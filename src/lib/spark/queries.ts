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

export async function getTopic(
  db: Client,
  topicId: string
): Promise<SparkTopic | null> {
  const { data } = await db
    .from('spark_topics')
    .select('*')
    .eq('id', topicId)
    .single();
  return data as SparkTopic | null;
}

export async function createTopic(
  db: Client,
  userId: string,
  input: {
    title: string;
    summary?: string | null;
    category?: string | null;
    tags?: string[];
    source_note_ids?: string[];
    kairos_subject_id?: string | null;
    kairos_color?: string | null;
  }
): Promise<SparkTopic> {
  const { data, error } = await db
    .from('spark_topics')
    .insert({
      user_id: userId,
      title: input.title,
      summary: input.summary ?? null,
      category: input.category ?? null,
      tags: input.tags ?? [],
      source_note_ids: input.source_note_ids ?? [],
      kairos_subject_id: input.kairos_subject_id ?? null,
      kairos_color: input.kairos_color ?? null,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SparkTopic;
}

export async function updateTopic(
  db: Client,
  topicId: string,
  patch: Partial<Pick<SparkTopic, 'title' | 'summary' | 'category' | 'tags' | 'is_archived'>>
): Promise<SparkTopic> {
  const { data, error } = await db
    .from('spark_topics')
    .update(patch)
    .eq('id', topicId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as SparkTopic;
}

export async function deleteTopic(db: Client, topicId: string): Promise<void> {
  const { error } = await db.from('spark_topics').delete().eq('id', topicId);
  if (error) throw new Error(error.message);
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

/**
 * Postgres / PostgREST surfaces "column not found" both as PGRST204
 * (PostgREST schema cache) and 42703 (Postgres native). We use that
 * to fall back gracefully when a migration hasn't been applied yet.
 */
function isMissingColumnError(err: { message?: string; code?: string } | null): boolean {
  if (!err) return false;
  if (err.code === 'PGRST204' || err.code === '42703') return true;
  return /could not find the .* column|column .* does not exist/i.test(err.message ?? '');
}

export async function createSession(
  db: Client,
  session: Omit<SparkLearningSession, 'id' | 'created_at' | 'started_at' | 'ended_at'>
): Promise<SparkLearningSession> {
  // Newer columns (selected_note_ids, objective, intensity) live behind
  // their own migrations. If the deploy hasn't run them yet, we don't
  // want the whole flow to die — drop the offending column and retry.
  const optionalColumns = ['objective', 'intensity', 'selected_note_ids'] as const;
  type Row = Record<string, unknown>;
  const row: Row = { ...session } as Row;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const { data, error } = await db
      .from('spark_learning_sessions')
      .insert(row)
      .select()
      .single();
    if (!error) return data as SparkLearningSession;
    if (!isMissingColumnError(error)) throw new Error(error.message);
    // Find which optional column the server complained about and drop it.
    const message = (error.message ?? '').toLowerCase();
    const offending = optionalColumns.find((col) => message.includes(col));
    if (!offending || !(offending in row)) throw new Error(error.message);
    delete row[offending];
  }
  throw new Error('No se pudo crear la sesión: faltan columnas en spark_learning_sessions.');
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

export async function deleteSession(
  db: Client,
  userId: string,
  sessionId: string
): Promise<void> {
  // RLS protege contra cross-user delete; el filtro user_id es defensa en
  // profundidad. Los turns y flashcards asociados borran en cascada vía FK.
  const { error } = await db
    .from('spark_learning_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}

export async function deleteAllSessions(
  db: Client,
  userId: string
): Promise<number> {
  const { error, count } = await db
    .from('spark_learning_sessions')
    .delete({ count: 'exact' })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
  return count ?? 0;
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

// ── Flashcards ───────────────────────────────────────────────

export async function getDueFlashcards(
  db: Client,
  userId: string
): Promise<import('@/modules/spark/types').SparkFlashcard[]> {
  const { data } = await db
    .from('spark_flashcards')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .lte('next_review_at', new Date().toISOString())
    .order('next_review_at', { ascending: true });
  return (data ?? []) as import('@/modules/spark/types').SparkFlashcard[];
}

export async function getFlashcard(
  db: Client,
  cardId: string
): Promise<import('@/modules/spark/types').SparkFlashcard | null> {
  const { data } = await db
    .from('spark_flashcards')
    .select('*')
    .eq('id', cardId)
    .single();
  return data as import('@/modules/spark/types').SparkFlashcard | null;
}

export async function insertFlashcards(
  db: Client,
  userId: string,
  cards: { topic_id: string | null; session_id: string | null; front: string; back: string; hint?: string | null }[]
): Promise<void> {
  if (!cards.length) return;
  const rows = cards.map((c) => ({
    user_id: userId,
    topic_id: c.topic_id,
    session_id: c.session_id,
    front: c.front,
    back: c.back,
    hint: c.hint ?? null,
  }));
  const { error } = await db.from('spark_flashcards').insert(rows);
  if (error) throw new Error(error.message);
}

export async function updateFlashcardReview(
  db: Client,
  cardId: string,
  patch: {
    ease_factor: number;
    interval_days: number;
    repetitions: number;
    next_review_at: string;
    mastery_score: number;
  }
): Promise<void> {
  const { error } = await db
    .from('spark_flashcards')
    .update({ ...patch, last_reviewed_at: new Date().toISOString() })
    .eq('id', cardId);
  if (error) throw new Error(error.message);
}

// ── Mastery queries (counts + lists) ─────────────────────────

export async function getAllMastery(
  db: Client,
  userId: string
): Promise<SparkMasteryState[]> {
  const { data } = await db
    .from('spark_mastery_states')
    .select('*')
    .eq('user_id', userId)
    .order('mastery_score', { ascending: true });
  return (data ?? []) as SparkMasteryState[];
}

export async function getDueMasteryCount(
  db: Client,
  userId: string
): Promise<number> {
  const { count } = await db
    .from('spark_mastery_states')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .lte('next_review_at', new Date().toISOString());
  return count ?? 0;
}

export async function getDueFlashcardsCount(
  db: Client,
  userId: string
): Promise<number> {
  const { count } = await db
    .from('spark_flashcards')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_archived', false)
    .lte('next_review_at', new Date().toISOString());
  return count ?? 0;
}

// ── Rate limit ───────────────────────────────────────────────

export async function checkAndIncrementRateLimit(
  db: Client,
  userId: string,
  limit = 100
): Promise<{ allowed: boolean; current: number }> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await db
    .from('spark_rate_limits')
    .select('count')
    .eq('user_id', userId)
    .eq('day', today)
    .maybeSingle();
  const current = (existing as { count: number } | null)?.count ?? 0;
  if (current >= limit) return { allowed: false, current };
  await db
    .from('spark_rate_limits')
    .upsert(
      { user_id: userId, day: today, count: current + 1 },
      { onConflict: 'user_id,day' }
    );
  return { allowed: true, current: current + 1 };
}
