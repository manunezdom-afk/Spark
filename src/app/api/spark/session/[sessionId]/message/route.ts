import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  getSession,
  getSessionTurns,
  appendTurn,
  getUserContext,
  getTopicsByIds,
  getMasteryStates,
  getErrorPatterns,
} from '@/lib/spark/queries';
import { buildMasterSystemPrompt } from '@/modules/spark/prompts/master-system';
import type { EngineContext, SendMessageRequest, TurnPayload } from '@/modules/spark/types';

type RouteContext = { params: Promise<{ sessionId: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { sessionId } = await params;
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await request.json()) as SendMessageRequest;
  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'content es requerido' }, { status: 400 });
  }

  const session = await getSession(db, sessionId);
  if (!session || session.user_id !== user.id) {
    return NextResponse.json({ error: 'Sesión no encontrada' }, { status: 404 });
  }
  if (session.status !== 'active') {
    return NextResponse.json({ error: 'La sesión ya finalizó' }, { status: 409 });
  }

  // Load prior turns and build full context
  const [priorTurns, userCtx, topics, mastery, errors] = await Promise.all([
    getSessionTurns(db, sessionId),
    getUserContext(db, user.id),
    getTopicsByIds(db, session.topic_ids),
    getMasteryStates(db, user.id, session.topic_ids),
    getErrorPatterns(db, user.id, session.topic_ids),
  ]);

  const ctx: EngineContext = {
    user: userCtx ?? {
      id: '', user_id: user.id, career: null, current_role: null,
      active_projects: [], personal_goals: [], learning_style: null,
      custom_context: null, created_at: '', updated_at: '',
    },
    topics,
    mastery,
    error_patterns: errors,
    days_to_deadline: session.days_to_deadline,
    prior_turns: priorTurns,
  };

  const systemPrompt = buildMasterSystemPrompt(session.engine, ctx);

  // Persist user turn
  const userTurn = await appendTurn(db, {
    session_id: sessionId,
    role: 'user',
    content: body.content,
    payload: null,
    turn_index: priorTurns.length,
  });

  // Build message history for the AI call
  const messages = [
    ...priorTurns.map((t) => ({ role: t.role, content: t.content })),
    { role: 'user' as const, content: body.content },
  ];

  // ── AI call (streaming) ──────────────────────────────────────
  const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    }),
  });

  if (!aiResponse.ok) {
    const err = await aiResponse.text();
    return NextResponse.json({ error: `AI error: ${err}` }, { status: 502 });
  }

  const aiData = await aiResponse.json() as {
    content: { type: string; text: string }[];
  };
  const rawText = aiData.content.find((b) => b.type === 'text')?.text ?? '';

  // Extract optional JSON payload from AI response
  const payload = extractPayload(rawText);
  const displayText = payload ? rawText.replace(/```json[\s\S]*?```/g, '').trim() : rawText;

  // Persist assistant turn
  const assistantTurn = await appendTurn(db, {
    session_id: sessionId,
    role: 'assistant',
    content: displayText,
    payload,
    turn_index: priorTurns.length + 1,
  });

  return NextResponse.json({
    user_turn: userTurn,
    assistant_turn: assistantTurn,
  });
}

function extractPayload(text: string): TurnPayload | null {
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as TurnPayload;
  } catch {
    return null;
  }
}
