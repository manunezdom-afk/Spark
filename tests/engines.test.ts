import { describe, it, expect } from "vitest";
import { buildEngineConfig } from "@/modules/spark/engines";
import type { EngineContext, SparkUserContext } from "@/modules/spark/types";

const baseUser: SparkUserContext = {
  id: "x",
  user_id: "u",
  career: null,
  current_role: null,
  active_projects: [],
  personal_goals: [],
  learning_style: null,
  custom_context: null,
  created_at: "",
  updated_at: "",
};

const ctx: EngineContext = {
  user: baseUser,
  topics: [],
  mastery: [],
  error_patterns: [],
  days_to_deadline: null,
  prior_turns: [],
};

describe("buildEngineConfig", () => {
  it("rejects roleplay without persona", () => {
    expect(() =>
      buildEngineConfig(
        { engine: "roleplay", topic_ids: ["t1"] },
        ctx
      )
    ).toThrow(/persona/);
  });

  it("rejects bridge_builder with single topic", () => {
    expect(() =>
      buildEngineConfig(
        { engine: "bridge_builder", topic_ids: ["t1"] },
        ctx
      )
    ).toThrow(/at least 2/);
  });

  it("rejects devils_advocate with two topics", () => {
    expect(() =>
      buildEngineConfig(
        { engine: "devils_advocate", topic_ids: ["t1", "t2"] },
        ctx
      )
    ).toThrow(/at most 1/);
  });

  it("accepts socratic with one topic", () => {
    const cfg = buildEngineConfig(
      { engine: "socratic", topic_ids: ["t1"] },
      ctx
    );
    expect(cfg.requiresPersona).toBe(false);
    expect(cfg.systemPrompt).toMatch(/IDENTIDAD/);
  });

  it("accepts roleplay with persona", () => {
    const cfg = buildEngineConfig(
      { engine: "roleplay", topic_ids: ["t1"], persona: "VC escéptico" },
      ctx
    );
    expect(cfg.requiresPersona).toBe(true);
  });
});
