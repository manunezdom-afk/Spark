// Todas las queries de Spark en un solo lugar.
// Reciben el cliente de Supabase como argumento para ser agnósticas
// al contexto (server component, route handler, test).

import type {
  SparkUserContext,
  SparkTopic,
  SparkMasteryState,
  SparkLearningSession,
  SparkSessionTurn,
  SparkErrorPattern,
} from '@/modules/spark/types';

type Client = Awaited<ReturnType<typeof import('@/lib/supabase/server').getSupabaseServerClient>>;

// ── User Context ─────────────────────────────────────────────

export async function getUserContext(
  db: Client,
  userId: string
): Promise<SparkUserContext | null> {
  const { data } = await db
    .from('spark_user_context')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as SparkUserContext | null;
}

export async function upsertUserContext(
  db: Client,
  userId: string,
  patch: Partial<Omit<SparkUserContext, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<SparkUserContext> {
  const { data, error } = await db
    .from('spark_user_context')
    .upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SparkUserContext;
}

// ── Topics ───────────────────────────────────────────────────

export async function getTopics(
  db: Client,
  userId: string
): Promise<SparkTopic[]> {
  const { data } = await db
    .from('spark_topics')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });
  return (data ?? []) as SparkTopic[];
}

export async function getTopicsByIds(
  db: Client,
  topicIds: string[]
): Promise<SparkTopic[]> {
  if (!topicIds.length) return [];
  const { data } = await db
    .from('spark_topics')
    .select('*')
    .in('id', topicIds);
  return (data ?? []) as SparkTopic[];
}

// ── Mastery States ───────────────────────────────────────────

export async function getMasteryStates(
  db: Client,
  userId: string,
  topicIds: string[]
): Promise<SparkMasteryState[]> {
  if (!topicIds.length) return [];
  const { data } = await db
    .from('spark_mastery_states')
    .select('*')
    .eq('user_id', userId)
    .in('topic_id', topicIds);
  return (data ?? []) as SparkMasteryState[];
}

export async function upsertMasteryState(
  db: Client,
  state: Omit<SparkMasteryState, 'id' | 'created_at' | 'updated_at'>
): Promise<SparkMasteryState> {
  const { data, error } = await db
    .from('spark_mastery_states')
    .upsert(state, { onConflict: 'user_id,topic_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SparkMasteryState;
}

// ── Sessions ─────────────────────────────────────────────────

export async function createSession(
  db: Client,
  session: Omit<SparkLearningSession, 'id' | 'created_at' | 'started_at' | 'ended_at'>
): Promise<SparkLearningSession> {
  const { data, error } = await db
    .from('spark_learning_sessions')
    .insert(session)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SparkLearningSession;
}

export async function getSession(
  db: Client,
  sessionId: string
): Promise<SparkLearningSession | null> {
  const { data } = await db
    .from('spark_learning_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  return data as SparkLearningSession | null;
}

export async function getSessions(
  db: Client,
  userId: string,
  status?: 'active' | 'completed' | 'abandoned'
): Promise<SparkLearningSession[]> {
  let query = db
    .from('spark_learning_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (status) query = query.eq('status', status);
  const { data } = await query;
  return (data ?? []) as SparkLearningSession[];
}

export async function completeSession(
  db: Client,
  sessionId: string,
  score: number,
  feedback: string
): Promise<void> {
  const { error } = await db
    .from('spark_learning_sessions')
    .update({
      status: 'completed',
      score,
      feedback,
      ended_at: new Date().toISOString(),
    })
    .eq('id', sessionId);
  if (error) throw new Error(error.message);
}

// ── Session Turns ────────────────────────────────────────────

export async function getSessionTurns(
  db: Client,
  sessionId: string
): Promise<SparkSessionTurn[]> {
  const { data } = await db
    .from('spark_session_turns')
    .select('*')
    .eq('session_id', sessionId)
    .order('turn_index', { ascending: true });
  return (data ?? []) as SparkSessionTurn[];
}

export async function appendTurn(
  db: Client,
  turn: Omit<SparkSessionTurn, 'id' | 'created_at'>
): Promise<SparkSessionTurn> {
  const { data, error } = await db
    .from('spark_session_turns')
    .insert(turn)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SparkSessionTurn;
}

// ── Error Patterns ───────────────────────────────────────────

export async function getErrorPatterns(
  db: Client,
  userId: string,
  topicIds?: string[]
): Promise<SparkErrorPattern[]> {
  let query = db
    .from('spark_error_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('is_resolved', false)
    .order('frequency', { ascending: false })
    .limit(10);
  if (topicIds?.length) query = query.in('topic_id', topicIds);
  const { data } = await query;
  return (data ?? []) as SparkErrorPattern[];
}

export async function incrementErrorPattern(
  db: Client,
  userId: string,
  topicId: string,
  description: string,
  errorType: SparkErrorPattern['error_type']
): Promise<void> {
  // Try to find existing pattern first
  const { data: existing } = await db
    .from('spark_error_patterns')
    .select('id, frequency')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .eq('description', description)
    .single();

  if (existing) {
    await db
      .from('spark_error_patterns')
      .update({ frequency: existing.frequency + 1, last_seen_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await db.from('spark_error_patterns').insert({
      user_id: userId,
      topic_id: topicId,
      error_type: errorType,
      description,
      frequency: 1,
    });
  }
}

// ── Calendar (cross-schema read from Focus) ──────────────────

export async function getDaysToNearestDeadline(
  db: Client,
  userId: string
): Promise<number | null> {
  const { data } = await db
    .from('focus_calendar_events')
    .select('start_at')
    .eq('user_id', userId)
    .eq('is_critical', true)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(1);

  if (!data?.length) return null;
  const diffMs = new Date(data[0].start_at).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}
