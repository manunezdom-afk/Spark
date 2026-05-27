import { type NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSession,
  getSessionTurns,
  appendTurn,
  getNextTurnIndex,
  getUserContext,
  getTopicsByIds,
  getMasteryStates,
  getErrorPatterns,
  checkRateLimit,
  incrementRateLimit,
} from "@/lib/spark/queries";
import { buildMasterSystemPrompt } from "@/modules/spark/prompts/master-system";
import { buildKairosContext } from "@/lib/spark/kairos-bridge";
import { sseStream, extractJsonPayload, stripJsonBlock } from "@/lib/streaming/sse";
import type {
  EngineContext,
  SendMessageRequest,
  SparkSessionTurn,
  SparkUserContext,
  TurnPayload,
} from "@/modules/spark/types";

type RouteContext = { params: Promise<{ id: string }> };

function emptyUserContext(userId: string): SparkUserContext {
  return {
    id: "",
    user_id: userId,
    career: null,
    user_role: null,
    active_projects: [],
    personal_goals: [],
    learning_style: null,
    custom_context: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id: sessionId } = await params;
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as SendMessageRequest;
  if (!body.content?.trim()) {
    return NextResponse.json({ error: "content es requerido" }, { status: 400 });
  }

  const session = await getSession(db, sessionId);
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json({ error: "La sesión ya finalizó" }, { status: 409 });
  }

  // Rate limit: check first (read-only), increment only after Anthropic
  // actually produced a token. If the AI call fails, the user's quota
  // is not burned.
  const RATE_LIMIT_DAILY = 100;
  const RATE_LIMIT_WARN_AT = 80;
  const rate = await checkRateLimit(db, user.id, RATE_LIMIT_DAILY);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Límite diario de IA alcanzado. Vuelve mañana." },
      { status: 429 }
    );
  }

  // Hydrate context
  const [priorTurns, userCtx, topics, mastery, errors] = await Promise.all([
    getSessionTurns(db, sessionId),
    getUserContext(db, user.id),
    getTopicsByIds(db, session.topic_ids),
    getMasteryStates(db, user.id, session.topic_ids),
    getErrorPatterns(db, user.id, session.topic_ids),
  ]);

  const ctx: EngineContext = {
    user: userCtx ?? emptyUserContext(user.id),
    topics,
    mastery,
    error_patterns: errors,
    days_to_deadline: session.days_to_deadline,
    prior_turns: priorTurns,
    objective: session.objective,
    intensity: session.intensity,
  };

  // Inject Kairos notes context. If the session has a `selected_note_ids`
  // subset, we restrict the context to those apuntes (so Nova studies
  // only "Arte gótico", not the whole "Artes e ideas" subject). Without
  // a selection we fall back to every Kairos session linked to the
  // topics — the legacy "study the whole subject" behavior.
  const allSourceIds = topics.flatMap((t) => t.source_note_ids ?? []);
  const usingSubset = (session.selected_note_ids?.length ?? 0) > 0;
  const noteIdsForContext = usingSubset
    ? session.selected_note_ids
    : allSourceIds;
  let kairosContext: string | null = null;
  let kairosFailed = false;
  if (noteIdsForContext.length) {
    try {
      kairosContext = await buildKairosContext(db, user.id, noteIdsForContext);
    } catch (kairosErr) {
      console.error("[message] buildKairosContext failed", {
        sessionId,
        userId: user.id,
        noteCount: noteIdsForContext.length,
        kairosErr,
      });
      kairosFailed = true;
    }
  }

  // When the user pinned specific apuntes, tell Nova explicitly: stay
  // inside this scope and avoid spilling into the rest of the subject.
  // Without this nudge, the model tends to pull in tangential examples
  // from the broader topic context.
  const scopeInstruction = usingSubset
    ? `\n\n# ALCANCE DE ESTUDIO\n\nEl estudiante eligió enfocarse en un subconjunto específico de su material para esta sesión (ver "Notas de Kairos del estudiante" más abajo). NO uses información del resto de la materia. Si una pregunta del estudiante se sale del alcance, redirige cortésmente al material seleccionado.`
    : "";

  const systemPrompt =
    buildMasterSystemPrompt(session.engine, ctx) +
    scopeInstruction +
    (kairosContext ? `\n\n${kairosContext}` : "");

  // Synthetic kickoff: when the session is empty and the client requests
  // the first assistant turn, do NOT persist the kickoff string as a user
  // turn (it's not really from the student). We still need a user message
  // for the model so it produces an opening turn, so we send a generic
  // kickoff prompt that won't pollute the transcript.
  const isKickoff =
    priorTurns.length === 0 && body.content.trim().startsWith("[Inicio]");

  let userTurn: SparkSessionTurn | null = null;
  if (!isKickoff) {
    // Recompute the next index from the DB rather than using the snapshot
    // we hydrated earlier — a previous turn could have been written by a
    // racing request (rare with the client-side guard, but real with
    // multiple tabs or fast retries) and reusing a stale index collides.
    const userTurnIndex = await getNextTurnIndex(db, sessionId);
    userTurn = await appendTurn(db, {
      session_id: sessionId,
      role: "user",
      content: body.content,
      payload: null,
      turn_index: userTurnIndex,
    });
  }

  const messages = isKickoff
    ? [{ role: "user" as const, content: "Inicia la sesión." }]
    : [
        ...priorTurns.map((t) => {
          let content = t.content;
          if (t.role === "assistant" && t.payload) {
            content += `\n\n\`\`\`json\n${JSON.stringify(t.payload, null, 2)}\n\`\`\``;
          }
          return { role: t.role, content };
        }),
        { role: "user" as const, content: body.content },
      ];

  return sseStream(async (push, close, signal) => {
    if (userTurn) push({ event: "user-turn", data: userTurn });

    if (kairosFailed) {
      push({
        event: "warning",
        data: {
          message:
            "Nova no pudo leer tus apuntes de Kairos esta vez. La sesión continúa, pero sin ese contexto.",
        },
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    let accumulated = "";
    let quotaCharged = false;

    try {
      const stream = client.messages.stream(
        {
          model: "claude-sonnet-4-6",
          max_tokens: 2048,
          system: systemPrompt,
          messages,
        },
        { signal },
      );

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          // First token confirms Anthropic accepted the call → charge quota
          // exactly once. If the stream errors before this point, the user's
          // daily limit is not affected.
          if (!quotaCharged) {
            quotaCharged = true;
            const { current } = await incrementRateLimit(db, user.id);
            if (current >= RATE_LIMIT_WARN_AT && current < RATE_LIMIT_DAILY) {
              push({
                event: "warning",
                data: {
                  message: `Llevas ${current} de ${RATE_LIMIT_DAILY} mensajes hoy. Te quedan ${RATE_LIMIT_DAILY - current}.`,
                },
              });
            }
          }
          accumulated += event.delta.text;
          push({ event: "text-delta", data: { chunk: event.delta.text } });
        }
      }

      const payload = extractJsonPayload<TurnPayload>(accumulated);
      const displayText = payload ? stripJsonBlock(accumulated) : accumulated;

      // Compute the assistant index from the live DB state, not from the
      // priorTurns snapshot — same reason as the userTurn above.
      const assistantTurnIndex = await getNextTurnIndex(db, sessionId);
      const assistantTurn = await appendTurn(db, {
        session_id: sessionId,
        role: "assistant",
        content: displayText,
        payload,
        turn_index: assistantTurnIndex,
      });

      if (payload) {
        push({ event: "payload", data: payload });
      } else if (/```json/.test(accumulated)) {
        push({
          event: "warning",
          data: { message: "El modelo intentó devolver un payload pero el JSON no es válido." },
        });
      }

      push({ event: "done", data: { turn: assistantTurn } });
      close();
    } catch (err) {
      // If the client disconnected (navigated away, closed tab, etc.) we
      // got here via the AbortController — don't persist a partial turn
      // and don't surface an "error" event to a client that's already gone.
      if (signal.aborted) {
        close();
        return;
      }

      // Real failure (Anthropic API error, network, etc.). Persist whatever
      // we accumulated so the conversation isn't a black hole, but log it —
      // silent .catch() was hiding real DB issues from us.
      if (accumulated) {
        try {
          const recoveryIndex = await getNextTurnIndex(db, sessionId);
          await appendTurn(db, {
            session_id: sessionId,
            role: "assistant",
            content: accumulated,
            payload: null,
            turn_index: recoveryIndex,
          });
        } catch (persistErr) {
          console.error("[message] persist-on-error failed", {
            sessionId,
            userId: user.id,
            persistErr,
          });
          push({
            event: "warning",
            data: {
              message:
                "No se pudo guardar la respuesta parcial. Recarga la sesión.",
            },
          });
        }
      }
      console.error("[message] stream failed", {
        sessionId,
        userId: user.id,
        err,
      });
      push({
        event: "error",
        data: { message: err instanceof Error ? err.message : "AI stream error" },
      });
      close();
    }
  });
}
