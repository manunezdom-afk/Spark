// localStorage-backed session persistence. Keeps the dashboard's
// "Sesiones recientes" and "Debilidades detectadas" honest while the
// Supabase-backed backend is being wired. All functions are SSR-safe
// (return defaults when `window` is undefined).

import type { StudyMethod } from './methods';

export type StoredSession = {
  id:          string;
  name:        string;
  method:      StudyMethod;
  startedAt:   number;
  completedAt: number;
  total:       number;
  /** 0–100 — interpretation depends on method (mastery for cards/quiz, completion for socratic). */
  scorePct:    number;
  /** Short human-readable score, e.g. "5 / 6 dominas" or "5 reflexiones". */
  scoreLabel:  string;
  /** Topics the user struggled with — fed into the dashboard's weakness panel. */
  weakTopics:  string[];
};

const KEY     = 'spark.sessions.v1';
const MAX_LEN = 30;

const isClient = () => typeof window !== 'undefined';

export function listSessions(): StoredSession[] {
  if (!isClient()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredSession[]) : [];
  } catch {
    return [];
  }
}

export function saveSession(s: StoredSession): void {
  if (!isClient()) return;
  try {
    const all = [s, ...listSessions()].slice(0, MAX_LEN);
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // localStorage might be full or disabled — fail silently
  }
}

export function clearSessions(): void {
  if (!isClient()) return;
  window.localStorage.removeItem(KEY);
}

/** Aggregate weak topics across all sessions, ordered by frequency. */
export function aggregateWeaknesses(limit = 5): { topic: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of listSessions()) {
    for (const t of s.weakTopics) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
