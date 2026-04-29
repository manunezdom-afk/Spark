import { describe, it, expect } from "vitest";
import { sm2, scoreToQuality, recommendEngines } from "@/modules/spark/scheduler/sm2";

describe("sm2", () => {
  it("resets repetitions and interval when quality < 3", () => {
    const out = sm2({ ease_factor: 2.5, interval_days: 12, repetitions: 4, quality: 2 });
    expect(out.repetitions).toBe(0);
    expect(out.interval_days).toBe(1);
    expect(out.ease_factor).toBe(2.5);
  });

  it("first successful repetition uses interval 1", () => {
    const out = sm2({ ease_factor: 2.5, interval_days: 1, repetitions: 0, quality: 4 });
    expect(out.repetitions).toBe(1);
    expect(out.interval_days).toBe(1);
  });

  it("second successful repetition uses interval 6", () => {
    const out = sm2({ ease_factor: 2.5, interval_days: 1, repetitions: 1, quality: 4 });
    expect(out.repetitions).toBe(2);
    expect(out.interval_days).toBe(6);
  });

  it("scales interval by ease_factor on third+ rep", () => {
    const out = sm2({ ease_factor: 2.5, interval_days: 6, repetitions: 2, quality: 5 });
    expect(out.interval_days).toBe(15); // round(6 * 2.5)
  });

  it("ease factor never goes below 1.30", () => {
    let ef = 2.5;
    for (let i = 0; i < 50; i++) {
      const out = sm2({ ease_factor: ef, interval_days: 1, repetitions: 0, quality: 3 });
      ef = out.ease_factor;
    }
    expect(ef).toBeGreaterThanOrEqual(1.3);
  });
});

describe("scoreToQuality", () => {
  it("maps boundaries correctly", () => {
    expect(scoreToQuality(95)).toBe(5);
    expect(scoreToQuality(90)).toBe(5);
    expect(scoreToQuality(89)).toBe(4);
    expect(scoreToQuality(75)).toBe(4);
    expect(scoreToQuality(74)).toBe(3);
    expect(scoreToQuality(60)).toBe(3);
    expect(scoreToQuality(59)).toBe(2);
    expect(scoreToQuality(40)).toBe(2);
    expect(scoreToQuality(39)).toBe(1);
    expect(scoreToQuality(20)).toBe(1);
    expect(scoreToQuality(19)).toBe(0);
    expect(scoreToQuality(0)).toBe(0);
  });
});

describe("recommendEngines", () => {
  it("returns urgent engines when deadline is tomorrow", () => {
    const out = recommendEngines(1);
    expect(out[0]).toBe("socratic");
    expect(out).toContain("debugger");
  });

  it("favors strategic engines when no deadline", () => {
    const out = recommendEngines(null);
    expect(out[0]).toBe("bridge_builder");
  });

  it("prioritizes debugger when deadline is 3 days", () => {
    const out = recommendEngines(3);
    expect(out[0]).toBe("debugger");
  });
});
