import { type NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSession,
  getSessionTurns,
  appendTurn,
  getUserContext,
  getTopicsByIds,
  getMasteryStates,
  getErrorPatterns,
  checkAndIncrementRateLimit,
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

  // Rate limit (default 100/day per user)
  const RATE_LIMIT_DAILY = 100;
  const RATE_LIMIT_WARN_AT = 80;
  const rate = await checkAndIncrementRateLimit(db, user.id, RATE_LIMIT_DAILY);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Límite diario de IA alcanzado. Vuelve mañana." },
      { status: 429 }
    );
  }
  const remaining = RATE_LIMIT_DAILY - rate.current;
  const shouldWarnRateLimit =
    rate.current >= RATE_LIMIT_WARN_AT && rate.current < RATE_LIMIT_DAILY;

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
  const kairosContext = noteIdsForContext.length
    ? await buildKairosContext(db, user.id, noteIdsForContext)
    : null;

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
    userTurn = await appendTurn(db, {
      session_id: sessionId,
      role: "user",
      content: body.content,
      payload: null,
      turn_index: priorTurns.length,
    });
  }

  const messages = isKickoff
    ? [{ role: "user" as const, content: "Inicia la sesión." }]
    : [
        ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
        { role: "user" as const, content: body.content },
      ];

  const assistantTurnIndex = isKickoff ? 0 : priorTurns.length + 1;

  return sseStream(async (push, close) => {
    if (userTurn) push({ event: "user-turn", data: userTurn });

    if (shouldWarnRateLimit) {
      push({
        event: "warning",
        data: {
          message: `Llevas ${rate.current} de ${RATE_LIMIT_DAILY} mensajes hoy. Te quedan ${remaining}.`,
        },
      });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    let accumulated = "";

    try {
      const stream = client.messages.stream({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: systemPrompt,
        messages,
      });

      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          accumulated += event.delta.text;
          push({ event: "text-delta", data: { chunk: event.delta.text } });
        }
      }

      const payload = extractJsonPayload<TurnPayload>(accumulated);
      const displayText = payload ? stripJsonBlock(accumulated) : accumulated;

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
      // Persist whatever we got so the conversation isn't lost
      if (accumulated) {
        await appendTurn(db, {
          session_id: sessionId,
          role: "assistant",
          content: accumulated,
          payload: null,
          turn_index: assistantTurnIndex,
        }).catch(() => {});
      }
      push({
        event: "error",
        data: { message: err instanceof Error ? err.message : "AI stream error" },
      });
      close();
    }
  });
}
