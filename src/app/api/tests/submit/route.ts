import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  getSession,
  getSessionTurns,
  getMasteryStates,
  upsertMasteryState,
  completeSession,
  appendTurn,
} from '@/lib/spark/queries';
import { buildDesarrolloEvaluationPrompt } from '@/lib/spark/test-prompts';
import { extractJsonPayload } from '@/lib/streaming/sse';
import { sm2, scoreToQuality } from '@/modules/spark/scheduler/sm2';

import type {
  TestAnswer,
  TestQuestion,
  TestQuestionResult,
  TestQuestionsPayload,
  TestResultPayload,
} from '@/modules/spark/types';

interface SubmitRequest {
  session_id: string;
  answers: TestAnswer[];
}

export async function POST(request: NextRequest) {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as SubmitRequest;

  const session = await getSession(db, body.session_id);
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Prueba no encontrada.' }, { status: 404 });
  }
  if (session.status !== 'active') {
    return NextResponse.json({ error: 'Esta prueba ya fue enviada.' }, { status: 409 });
  }

  const turns = await getSessionTurns(db, session.id);
  const questionsTurn = turns.find((t) => t.payload?.type === 'test_questions');

  if (!questionsTurn?.payload) {
    return NextResponse.json({ error: 'Preguntas no encontradas.' }, { status: 404 });
  }

  const qPayload = questionsTurn.payload as TestQuestionsPayload;
  const questions: TestQuestion[] = qPayload.questions;
  const testType = qPayload.test_type;
  const answers: TestAnswer[] = body.answers ?? [];

  let questionResults: TestQuestionResult[];
  let overallScore: number;
  let overallFeedback: string;

  // ── Auto-grade alternativas ──────────────────────────────────
  if (testType === 'alternativas') {
    questionResults = questions.map((q) => {
      const ans = answers.find((a) => a.question_id === q.id);
      const isCorrect =
        ans?.selected_index !== undefined && ans.selected_index === q.correct_index;
      return {
        question_id: q.id,
        correct: isCorrect,
        score: isCorrect ? 100 : 0,
        feedback: isCorrect
          ? '¡Correcto!'
          : `Incorrecto. La respuesta correcta era: ${q.options?.[q.correct_index ?? 0] ?? ''}`,
        correct_answer: q.options?.[q.correct_index ?? 0],
      };
    });

    const correctCount = questionResults.filter((r) => r.correct).length;
    overallScore = Math.round((correctCount / questions.length) * 100);
    overallFeedback = `Obtuviste ${correctCount} de ${questions.length} ${questions.length === 1 ? 'pregunta correcta' : 'preguntas correctas'}.`;
  }

  // ── AI-grade desarrollo ──────────────────────────────────────
  else {
    const { system, user: userMsg } = buildDesarrolloEvaluationPrompt(questions, answers);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        system,
        messages: [{ role: 'user', content: userMsg }],
      });

      const block = response.content.find((c) => c.type === 'text');
      const raw = block && block.type === 'text' ? block.text : '';
      const parsed = extractJsonPayload<{
        results: Array<{
          question_id: number;
          score: number;
          correct: boolean;
          feedback: string;
        }>;
        overall_score: number;
        overall_feedback: string;
      }>(raw);

      if (!parsed?.results?.length) {
        throw new Error('El evaluador no devolvió resultados válidos.');
      }

      questionResults = parsed.results.map((r) => ({
        question_id: r.question_id,
        correct: r.correct,
        score: Math.max(0, Math.min(100, r.score)),
        feedback: r.feedback,
      }));
      overallScore = Math.max(0, Math.min(100, parsed.overall_score));
      overallFeedback = parsed.overall_feedback;
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Error evaluando respuestas.' },
        { status: 502 }
      );
    }
  }

  // ── Store result turn ────────────────────────────────────────
  const resultPayload: TestResultPayload = {
    type: 'test_result',
    score: overallScore,
    question_results: questionResults,
    feedback: overallFeedback,
  };

  const nextTurnIndex = turns.length;

  await appendTurn(db, {
    session_id: session.id,
    role: 'user',
    content: 'Respuestas enviadas',
    payload: null,
    turn_index: nextTurnIndex,
  });

  await appendTurn(db, {
    session_id: session.id,
    role: 'assistant',
    content: `Resultado: ${overallScore}/100`,
    payload: resultPayload,
    turn_index: nextTurnIndex + 1,
  });

  // ── Update mastery for each topic ────────────────────────────
  const mastery = await getMasteryStates(db, user.id, session.topic_ids);
  const masteryByTopic = new Map(mastery.map((m) => [m.topic_id, m]));
  const quality = scoreToQuality(overallScore);

  await Promise.all(
    session.topic_ids.map(async (topicId) => {
      const existing = masteryByTopic.get(topicId);
      const sm = sm2({
        ease_factor: existing?.ease_factor ?? 2.5,
        interval_days: existing?.interval_days ?? 1,
        repetitions: existing?.repetitions ?? 0,
        quality,
      });

      const prevTotal = existing?.total_sessions ?? 0;
      const newMasteryScore = Math.round(
        ((existing?.mastery_score ?? 0) * prevTotal + overallScore) / (prevTotal + 1)
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
        total_sessions: prevTotal + 1,
      });
    })
  );

  await completeSession(db, session.id, overallScore, overallFeedback);

  const correctCount = questionResults.filter((r) => r.correct).length;

  return NextResponse.json({
    session_id: session.id,
    score: overallScore,
    total_questions: questions.length,
    correct_count: correctCount,
    question_results: questionResults,
    feedback: overallFeedback,
  });
}
