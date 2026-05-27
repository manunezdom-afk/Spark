import { type NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSession,
  getSessionTurns,
  getUserContext,
  getTopicsByIds,
  getMasteryStates,
  getErrorPatterns,
  upsertMasteryState,
  completeSession,
  insertFlashcards,
  checkRateLimit,
  incrementRateLimit,
  appendTurn,
  getNextTurnIndex,
} from "@/lib/spark/queries";
import { buildEvaluatorPrompt } from "@/modules/spark/prompts/evaluator";
import { sm2, scoreToQuality } from "@/modules/spark/scheduler/sm2";
import { extractJsonPayload } from "@/lib/streaming/sse";
import type {
  EngineContext,
  ScorePayload,
  SparkUserContext,
  FlashcardPayload,
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

export async function POST(_request: NextRequest, { params }: RouteContext) {
  const { id: sessionId } = await params;
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: check only — we charge after the evaluator actually
  // succeeded. If the evaluator throws, the user doesn't burn quota.
  const rate = await checkRateLimit(db, user.id);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Límite diario de sesiones alcanzado." }, { status: 429 });
  }

  const session = await getSession(db, sessionId);
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json({ error: "La sesión ya finalizó" }, { status: 409 });
  }

  const [turns, userCtx, topics, mastery, errors] = await Promise.all([
    getSessionTurns(db, sessionId),
    getUserContext(db, user.id),
    getTopicsByIds(db, session.topic_ids),
    getMasteryStates(db, user.id, session.topic_ids),
    getErrorPatterns(db, user.id, session.topic_ids),
  ]);

  // Need at least one user response to evaluate
  const userTurns = turns.filter((t) => t.role === "user");
  if (userTurns.length === 0) {
    return NextResponse.json(
      { error: "Aún no has respondido nada en esta sesión." },
      { status: 422 }
    );
  }

  const ctx: EngineContext = {
    user: userCtx ?? emptyUserContext(user.id),
    topics,
    mastery,
    error_patterns: errors,
    days_to_deadline: session.days_to_deadline,
    prior_turns: turns,
  };

  const { system, user: userPrompt } = buildEvaluatorPrompt(session.engine, ctx, turns);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  let scorePayload: ScorePayload;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content.find((c) => c.type === "text");
    const raw = block && block.type === "text" ? block.text : "";
    const parsed = extractJsonPayload<ScorePayload>(raw);
    if (!parsed || parsed.type !== "score") {
      throw new Error("El evaluador no devolvió un score válido.");
    }
    scorePayload = parsed;
  } catch (err) {
    console.error("[complete] evaluator failed", { sessionId, userId: user.id, err });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error del evaluador" },
      { status: 502 }
    );
  }

  // Evaluator succeeded — now charge the user's quota.
  await incrementRateLimit(db, user.id);

  const score = Math.max(0, Math.min(100, scorePayload.score));
  const quality = scoreToQuality(score);

  // Persist the score-turn FIRST. The summary page reads this turn to
  // render the breakdown — without it the user lands on a score with no
  // detail. If this fails, surface the error: a "complete" with no
  // evaluator output is worse than asking the user to retry.
  const scoreTurnIndex = await getNextTurnIndex(db, sessionId);
  try {
    await appendTurn(db, {
      session_id: sessionId,
      role: "assistant",
      content: scorePayload.feedback,
      payload: scorePayload,
      turn_index: scoreTurnIndex,
    });
  } catch (turnErr) {
    console.error("[complete] persist score-turn failed", {
      sessionId,
      userId: user.id,
      turnErr,
    });
    return NextResponse.json(
      { error: "No se pudo guardar la evaluación. Intenta finalizar de nuevo." },
      { status: 500 },
    );
  }

  // Update mastery per topic. Use allSettled so a failure on one topic
  // doesn't drop SM-2 updates for the others — partial mastery is better
  // than zero mastery, and we log what didn't make it.
  const masteryByTopic = new Map(mastery.map((m) => [m.topic_id, m]));
  const masteryResults = await Promise.allSettled(
    session.topic_ids.map(async (topicId) => {
      const existing = masteryByTopic.get(topicId);
      const sm = sm2({
        ease_factor: existing?.ease_factor ?? 2.5,
        interval_days: existing?.interval_days ?? 1,
        repetitions: existing?.repetitions ?? 0,
        quality,
      });

      const prevTotalSessions = existing?.total_sessions ?? 0;
      const prevScoreContrib = (existing?.mastery_score ?? 0) * prevTotalSessions;
      const newMasteryScore = Math.round(
        (prevScoreContrib + score) / (prevTotalSessions + 1)
      );

      await upsertMasteryState(db, {
        user_id: user.id,
        topic_id: topicId,
        mastery_score: newMasteryScore,
        ease_factor: sm.ease_factor,
        interval_days: sm.interval_days,
        repetitions: sm.repetitions,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: sm.next_review_at.toISOString(),
        total_errors: existing?.total_errors ?? 0,
        total_sessions: prevTotalSessions + 1,
      });
    })
  );
  for (const r of masteryResults) {
    if (r.status === "rejected") {
      console.error("[complete] mastery upsert failed", {
        sessionId,
        userId: user.id,
        reason: r.reason,
      });
    }
  }

  // Persist any flashcards generated during the session
  const flashcardTurns = turns.filter(
    (t) => t.role === "assistant" && t.payload?.type === "flashcard"
  );
  for (const t of flashcardTurns) {
    const fp = t.payload as FlashcardPayload;
    try {
      await insertFlashcards(
        db,
        user.id,
        fp.cards.map((c) => ({
          topic_id: session.topic_ids[0] ?? null,
          session_id: session.id,
          front: c.front,
          back: c.back,
          hint: c.hint ?? null,
        }))
      );
    } catch (cardsErr) {
      console.error("[complete] flashcards insert failed", {
        sessionId,
        userId: user.id,
        cardsErr,
      });
    }
  }

  await completeSession(db, sessionId, score, scorePayload.feedback);

  return NextResponse.json({ score: scorePayload });
}
