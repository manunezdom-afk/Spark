import { describe, expect, it } from "vitest";
import {
  bucketByDay,
  computeStreak,
  countSessionsInLastDays,
  estimateMinutes,
  toYMD,
} from "@/lib/spark/stats";

const NOW = new Date("2026-05-14T15:00:00");

function daysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

describe("computeStreak", () => {
  it("devuelve 0 cuando no hay sesiones", () => {
    expect(computeStreak([], NOW)).toBe(0);
  });

  it("devuelve 0 cuando todas las sesiones son antiguas (>1 día sin actividad reciente)", () => {
    const sessions = [{ ended_at: daysAgo(5) }];
    expect(computeStreak(sessions, NOW)).toBe(0);
  });

  it("cuenta 1 cuando hay sesión solo hoy", () => {
    const sessions = [{ ended_at: daysAgo(0) }];
    expect(computeStreak(sessions, NOW)).toBe(1);
  });

  it("cuenta 2 cuando hay sesión ayer + anteayer (sin hoy)", () => {
    const sessions = [{ ended_at: daysAgo(1) }, { ended_at: daysAgo(2) }];
    expect(computeStreak(sessions, NOW)).toBe(2);
  });

  it("cuenta racha de 3 días consecutivos terminando hoy", () => {
    const sessions = [
      { ended_at: daysAgo(0) },
      { ended_at: daysAgo(1) },
      { ended_at: daysAgo(2) },
    ];
    expect(computeStreak(sessions, NOW)).toBe(3);
  });

  it("rompe la racha por gap de un día", () => {
    const sessions = [
      { ended_at: daysAgo(0) },
      { ended_at: daysAgo(1) },
      // gap day 2
      { ended_at: daysAgo(3) },
    ];
    expect(computeStreak(sessions, NOW)).toBe(2);
  });

  it("ignora sesiones sin ended_at", () => {
    const sessions = [
      { ended_at: null },
      { ended_at: daysAgo(0) },
    ];
    expect(computeStreak(sessions, NOW)).toBe(1);
  });

  it("colapsa múltiples sesiones en el mismo día como 1", () => {
    const sessions = [
      { ended_at: daysAgo(0) },
      { ended_at: daysAgo(0) },
      { ended_at: daysAgo(1) },
    ];
    expect(computeStreak(sessions, NOW)).toBe(2);
  });
});

describe("bucketByDay", () => {
  it("devuelve N elementos en orden cronológico, último = hoy", () => {
    const buckets = bucketByDay([], 7, NOW);
    expect(buckets.length).toBe(7);
    expect(buckets[6].date).toBe(toYMD(NOW));
  });

  it("agrupa correctamente sesiones por día", () => {
    const sessions = [
      { ended_at: daysAgo(0) },
      { ended_at: daysAgo(0) },
      { ended_at: daysAgo(2) },
    ];
    const buckets = bucketByDay(sessions, 7, NOW);
    expect(buckets.find((b) => b.date === toYMD(NOW))?.count).toBe(2);
    const d2 = new Date(NOW);
    d2.setDate(d2.getDate() - 2);
    expect(buckets.find((b) => b.date === toYMD(d2))?.count).toBe(1);
  });

  it("ignora sesiones sin ended_at sin romper", () => {
    const sessions = [{ ended_at: null }, { ended_at: daysAgo(0) }];
    const buckets = bucketByDay(sessions, 7, NOW);
    const total = buckets.reduce((sum, b) => sum + b.count, 0);
    expect(total).toBe(1);
  });
});

describe("estimateMinutes", () => {
  it("0 turns → 0 minutos", () => {
    expect(estimateMinutes(0)).toBe(0);
  });

  it("1 turn → 2 minutos (redondeo de 1.5)", () => {
    expect(estimateMinutes(1)).toBe(2);
  });

  it("10 turns → 15 minutos", () => {
    expect(estimateMinutes(10)).toBe(15);
  });

  it("nunca devuelve negativos", () => {
    expect(estimateMinutes(-3)).toBe(0);
  });
});

describe("countSessionsInLastDays", () => {
  it("0 cuando no hay sesiones", () => {
    expect(countSessionsInLastDays([], 7, NOW)).toBe(0);
  });

  it("incluye hoy y los días anteriores hasta el cutoff", () => {
    const sessions = [
      { ended_at: daysAgo(0) },
      { ended_at: daysAgo(3) },
      { ended_at: daysAgo(6) },
      { ended_at: daysAgo(7) }, // fuera del rango de 7 días
    ];
    expect(countSessionsInLastDays(sessions, 7, NOW)).toBe(3);
  });
});

describe("toYMD", () => {
  it("formatea con padding correcto", () => {
    const d = new Date(2026, 0, 5, 10, 0, 0); // 5 enero
    expect(toYMD(d)).toBe("2026-01-05");
  });
});
