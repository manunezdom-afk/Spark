// Funciones puras para computar estadísticas de aprendizaje.
// Todas son testables sin DB y sin React. Trabajan sobre el shape
// mínimo necesario (no el full SparkLearningSession) para poder ser
// usadas también desde tests con fixtures.

export interface SessionLike {
  ended_at: string | null;
}

/**
 * Racha — días consecutivos terminando hoy (o ayer si hoy no hay)
 * con al menos una sesión completada. Cuenta hacia atrás hasta el
 * primer día sin sesión.
 *
 * Ejemplos:
 *   - hoy + ayer + anteayer  → 3
 *   - solo hoy               → 1
 *   - ayer + anteayer (no hoy) → 2
 *   - vacío                  → 0
 */
export function computeStreak(
  sessions: SessionLike[],
  now: Date = new Date()
): number {
  const days = new Set<string>();
  for (const s of sessions) {
    if (!s.ended_at) continue;
    days.add(toYMD(new Date(s.ended_at)));
  }
  if (days.size === 0) return 0;

  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);

  // Si hoy no hay sesión, empezamos a contar desde ayer.
  if (!days.has(toYMD(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (days.has(toYMD(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Bucketea sesiones por día para el heatmap. Devuelve un array de
 * `days` elementos en orden cronológico ascendente: el último es
 * HOY, el primero es hoy - (days - 1).
 */
export function bucketByDay(
  sessions: SessionLike[],
  days = 84,
  now: Date = new Date()
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const s of sessions) {
    if (!s.ended_at) continue;
    const ymd = toYMD(new Date(s.ended_at));
    counts.set(ymd, (counts.get(ymd) ?? 0) + 1);
  }

  const out: { date: string; count: number }[] = [];
  const cursor = new Date(now);
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - (days - 1));

  for (let i = 0; i < days; i += 1) {
    const ymd = toYMD(cursor);
    out.push({ date: ymd, count: counts.get(ymd) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

/**
 * Estima minutos invertidos a partir del número total de turns.
 * Heurística empírica: ~1.5 min por turn (incluye lectura + respuesta).
 * 0 turns → 0 minutos.
 */
export function estimateMinutes(turnCount: number): number {
  if (turnCount <= 0) return 0;
  return Math.round(turnCount * 1.5);
}

/**
 * Cuenta sesiones cuya ended_at cae dentro de los últimos N días
 * desde `now`. Día completo (00:00 a 23:59).
 */
export function countSessionsInLastDays(
  sessions: SessionLike[],
  days: number,
  now: Date = new Date()
): number {
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  let count = 0;
  for (const s of sessions) {
    if (!s.ended_at) continue;
    if (new Date(s.ended_at) >= cutoff) count += 1;
  }
  return count;
}

/**
 * Convierte un Date a string YYYY-MM-DD respetando timezone local.
 * No usa toISOString() porque ese siempre da UTC.
 */
export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
