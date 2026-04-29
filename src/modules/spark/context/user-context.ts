// Assembles the full EngineContext by querying Supabase.
// Called at session creation time to hydrate the system prompt.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  EngineContext,
  SparkUserContext,
  SparkTopic,
  SparkMasteryState,
  SparkErrorPattern,
  SparkSessionTurn,
} from '../types';

export async function buildEngineContext(
  supabase: SupabaseClient,
  userId: string,
  topicIds: string[],
  priorTurns: SparkSessionTurn[] = []
): Promise<EngineContext> {
  const [userCtx, topics, mastery, errors, deadline] = await Promise.all([
    fetchUserContext(supabase, userId),
    fetchTopics(supabase, topicIds),
    fetchMasteryStates(supabase, userId, topicIds),
    fetchErrorPatterns(supabase, userId, topicIds),
    fetchNearestDeadline(supabase, userId),
  ]);

  return {
    user: userCtx ?? emptyUserContext(userId),
    topics,
    mastery,
    error_patterns: errors,
    days_to_deadline: deadline,
    prior_turns: priorTurns,
  };
}

async function fetchUserContext(
  supabase: SupabaseClient,
  userId: string
): Promise<SparkUserContext | null> {
  const { data } = await supabase
    .from('spark_user_context')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data as SparkUserContext | null;
}

async function fetchTopics(
  supabase: SupabaseClient,
  topicIds: string[]
): Promise<SparkTopic[]> {
  if (!topicIds.length) return [];
  const { data } = await supabase
    .from('spark_topics')
    .select('*')
    .in('id', topicIds);
  return (data ?? []) as SparkTopic[];
}

async function fetchMasteryStates(
  supabase: SupabaseClient,
  userId: string,
  topicIds: string[]
): Promise<SparkMasteryState[]> {
  if (!topicIds.length) return [];
  const { data } = await supabase
    .from('spark_mastery_states')
    .select('*')
    .eq('user_id', userId)
    .in('topic_id', topicIds);
  return (data ?? []) as SparkMasteryState[];
}

async function fetchErrorPatterns(
  supabase: SupabaseClient,
  userId: string,
  topicIds: string[]
): Promise<SparkErrorPattern[]> {
  let query = supabase
    .from('spark_error_patterns')
    .select('*')
    .eq('user_id', userId)
    .eq('is_resolved', false)
    .order('frequency', { ascending: false })
    .limit(10);

  if (topicIds.length) {
    query = query.in('topic_id', topicIds);
  }

  const { data } = await query;
  return (data ?? []) as SparkErrorPattern[];
}

async function fetchNearestDeadline(
  supabase: SupabaseClient,
  userId: string
): Promise<number | null> {
  const { data } = await supabase
    .from('focus_calendar_events')
    .select('start_at')
    .eq('user_id', userId)
    .eq('is_critical', true)
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(1);

  if (!data?.length) return null;
  const diffMs = new Date((data as { start_at: string }[])[0].start_at).getTime() - Date.now();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function emptyUserContext(userId: string): SparkUserContext {
  return {
    id: '',
    user_id: userId,
    career: null,
    current_role: null,
    active_projects: [],
    personal_goals: [],
    learning_style: null,
    custom_context: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
