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
import { sseStream, extractJsonPayload, stripJsonBlock } from "@/lib/streaming/sse";
import type {
  EngineContext,
  SendMessageRequest,
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

  // Rate limit
  const rate = await checkAndIncrementRateLimit(db, user.id);
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
  };

  const systemPrompt = buildMasterSystemPrompt(session.engine, ctx);

  // Persist user turn upfront
  const userTurn = await appendTurn(db, {
    session_id: sessionId,
    role: "user",
    content: body.content,
    payload: null,
    turn_index: priorTurns.length,
  });

  const messages = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: "user" as const, content: body.content },
  ];

  return sseStream(async (push, close) => {
    push({ event: "user-turn", data: userTurn });

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
        turn_index: priorTurns.length + 1,
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
          turn_index: priorTurns.length + 1,
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
