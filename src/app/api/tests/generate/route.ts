import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  createSession,
  appendTurn,
  getTopicsByIds,
  checkAndIncrementRateLimit,
} from '@/lib/spark/queries';
import {
  buildAlternativasGenerationPrompt,
  buildDesarrolloGenerationPrompt,
} from '@/lib/spark/test-prompts';
import { extractJsonPayload } from '@/lib/streaming/sse';

import type {
  TestType,
  TestQuestion,
  TestQuestionsPayload,
  LearningEngine,
} from '@/modules/spark/types';

interface GenerateRequest {
  topic_ids: string[];
  test_type: TestType;
  question_count: number;
}

export async function POST(request: NextRequest) {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rate = await checkAndIncrementRateLimit(db, user.id);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Límite diario de sesiones alcanzado.' }, { status: 429 });
  }

  const body = (await request.json()) as GenerateRequest;

  if (!body.topic_ids?.length) {
    return NextResponse.json({ error: 'Selecciona al menos un tema.' }, { status: 400 });
  }

  const MAX_COUNTS: Record<TestType, number> = { alternativas: 25, desarrollo: 10 };
  const max = MAX_COUNTS[body.test_type] ?? 10;
  const count = Math.min(Math.max(1, body.question_count ?? 10), max);

  const topics = await getTopicsByIds(db, body.topic_ids);
  if (!topics.length) {
    return NextResponse.json({ error: 'Temas no encontrados.' }, { status: 404 });
  }

  const engine: LearningEngine =
    body.test_type === 'alternativas' ? 'test_alternativas' : 'test_desarrollo';

  // Create session first so we have an ID to attach questions to
  const session = await createSession(db, {
    user_id: user.id,
    topic_ids: body.topic_ids,
    selected_note_ids: [],
    engine,
    status: 'active',
    persona: null,
    scenario: null,
    score: null,
    feedback: null,
    errors_found: [],
    nearest_deadline: null,
    days_to_deadline: null,
  });

  // Build prompt and call Claude Haiku (cheapest for generation)
  const { system, user: userMsg } =
    body.test_type === 'alternativas'
      ? buildAlternativasGenerationPrompt(topics, count)
      : buildDesarrolloGenerationPrompt(topics, count);

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 6000,
      system,
      messages: [{ role: 'user', content: userMsg }],
    });

    const block = response.content.find((c) => c.type === 'text');
    const raw = block && block.type === 'text' ? block.text : '';
    const parsed = extractJsonPayload<{ questions: TestQuestion[] }>(raw);

    if (!parsed?.questions?.length) {
      throw new Error('El generador no devolvió preguntas válidas.');
    }

    const questions = parsed.questions.slice(0, count);

    const payload: TestQuestionsPayload = {
      type: 'test_questions',
      test_type: body.test_type,
      questions,
    };

    // Store questions as the first assistant turn
    await appendTurn(db, {
      session_id: session.id,
      role: 'assistant',
      content: `Prueba generada: ${count} preguntas de ${body.test_type}`,
      payload,
      turn_index: 0,
    });

    return NextResponse.json(
      {
        session_id: session.id,
        test_type: body.test_type,
        questions,
      },
      { status: 201 }
    );
  } catch (err) {
    // Abandon session if generation failed
    await db
      .from('spark_learning_sessions')
      .update({ status: 'abandoned' })
      .eq('id', session.id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error generando prueba' },
      { status: 502 }
    );
  }
}
