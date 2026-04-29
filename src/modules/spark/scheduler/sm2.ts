import type { SM2Input, SM2Output } from '../types';

// SM-2 spaced repetition algorithm (Wozniak 1987, adapted)
// quality: 0 = blackout, 1 = wrong, 2 = wrong but familiar,
//          3 = correct with difficulty, 4 = correct, 5 = perfect
export function sm2(input: SM2Input): SM2Output {
  const { quality, repetitions, interval_days, ease_factor } = input;

  let newRepetitions: number;
  let newInterval: number;
  let newEaseFactor: number;

  if (quality < 3) {
    // Failed: reset repetitions, restart intervals
    newRepetitions = 0;
    newInterval = 1;
    newEaseFactor = ease_factor;
  } else {
    // Passed
    newRepetitions = repetitions + 1;

    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval_days * ease_factor);
    }

    // Update ease factor: EF' = EF + (0.1 - (5-q)(0.08 + (5-q)*0.02))
    newEaseFactor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  }

  // Floor ease factor at 1.30 (SM-2 minimum)
  newEaseFactor = Math.max(1.3, parseFloat(newEaseFactor.toFixed(2)));

  const next = new Date();
  next.setDate(next.getDate() + newInterval);

  return {
    ease_factor: newEaseFactor,
    interval_days: newInterval,
    repetitions: newRepetitions,
    next_review_at: next,
  };
}

// Maps a 0–100 session score to SM-2 quality (0–5)
export function scoreToQuality(score: number): number {
  if (score >= 90) return 5;
  if (score >= 75) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  if (score >= 20) return 1;
  return 0;
}

// Given days_to_deadline, returns the recommended engine priority order
export function recommendEngines(daysToDeadline: number | null): string[] {
  if (daysToDeadline === null) {
    return ['bridge_builder', 'roleplay', 'devils_advocate', 'socratic', 'debugger'];
  }
  if (daysToDeadline <= 1) {
    return ['socratic', 'debugger'];
  }
  if (daysToDeadline <= 3) {
    return ['debugger', 'socratic', 'devils_advocate'];
  }
  if (daysToDeadline <= 7) {
    return ['devils_advocate', 'bridge_builder', 'socratic', 'debugger'];
  }
  return ['roleplay', 'bridge_builder', 'devils_advocate', 'socratic', 'debugger'];
}
