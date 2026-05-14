// Composición de stats semanales: combina queries de DB con las
// funciones puras de stats.ts. La consume el dashboard (server
// component) y el endpoint /api/stats. Único punto de cómputo.

import {
  getCompletedSessionsLast,
  getTurnCountsByCompletedSessions,
  getAllMastery,
} from "@/lib/spark/queries";
import {
  bucketByDay,
  computeStreak,
  countSessionsInLastDays,
  estimateMinutes,
} from "@/lib/spark/stats";
import type { SparkMasteryState } from "@/modules/spark/types";

type Client = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").getSupabaseServerClient>
>;

export interface WeeklyStatsPayload {
  streak: number;
  sessions_this_week: number;
  total_minutes_estimate: number;
  completed_count: number;
  mastery_avg: number | null;
  heatmap: { date: string; count: number }[];
}

export async function computeWeeklyStats(
  db: Client,
  userId: string,
  now: Date = new Date()
): Promise<WeeklyStatsPayload> {
  // 84 días (12 semanas) de ventana — cubre heatmap + racha + esta semana.
  const sessions = await getCompletedSessionsLast(db, userId, 84);
  const sessionIds = sessions.map((s) => s.id);
  const turnCounts = await getTurnCountsByCompletedSessions(db, sessionIds);
  const masteryStates = await getAllMastery(db, userId);

  const streak = computeStreak(sessions, now);
  const sessions_this_week = countSessionsInLastDays(sessions, 7, now);
  const totalTurns = Array.from(turnCounts.values()).reduce((s, n) => s + n, 0);
  const total_minutes_estimate = estimateMinutes(totalTurns);
  const completed_count = sessions.length;
  const mastery_avg = avgMastery(masteryStates);
  const heatmap = bucketByDay(sessions, 84, now);

  return {
    streak,
    sessions_this_week,
    total_minutes_estimate,
    completed_count,
    mastery_avg,
    heatmap,
  };
}

function avgMastery(states: SparkMasteryState[]): number | null {
  if (!states.length) return null;
  const sum = states.reduce((acc, s) => acc + s.mastery_score, 0);
  return Math.round(sum / states.length);
}
