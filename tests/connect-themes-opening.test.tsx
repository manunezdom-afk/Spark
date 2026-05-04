import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ConnectThemesExperience } from "@/components/session/experiences/ConnectThemesExperience";
import type {
  BridgeProposalPayload,
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

const topics: SparkTopic[] = [
  {
    id: "topic_1",
    user_id: "user_1",
    title: "Comportamiento del Consumidor",
    summary: null,
    source_note_ids: [],
    tags: [],
    category: null,
    is_archived: false,
    is_demo: true,
    kairos_subject_id: null,
    kairos_color: null,
    created_at: "2026-05-04T10:00:00.000Z",
    updated_at: "2026-05-04T10:00:00.000Z",
  },
  {
    id: "topic_2",
    user_id: "user_1",
    title: "Marketing Digital",
    summary: null,
    source_note_ids: [],
    tags: [],
    category: null,
    is_archived: false,
    is_demo: true,
    kairos_subject_id: null,
    kairos_color: null,
    created_at: "2026-05-04T10:00:00.000Z",
    updated_at: "2026-05-04T10:00:00.000Z",
  },
];

function buildSession(): SparkLearningSession {
  return {
    id: "sess_bridge",
    user_id: "user_1",
    topic_ids: ["topic_1", "topic_2"],
    selected_note_ids: [],
    engine: "bridge_builder",
    status: "active",
    persona: null,
    scenario: null,
    objective: null,
    intensity: null,
    score: null,
    feedback: null,
    errors_found: [],
    nearest_deadline: null,
    days_to_deadline: null,
    started_at: "2026-05-04T10:00:00.000Z",
    ended_at: null,
    created_at: "2026-05-04T10:00:00.000Z",
  };
}

function buildOpeningTurn(): SparkSessionTurn {
  const payload: BridgeProposalPayload = {
    type: "bridge_proposal",
    proposal_index: 0,
    concept_a: null,
    concept_b: null,
    mechanism: "Cuando estés listo, dime: adelante.",
    prediction: null,
    prior_quality: null,
  };

  return {
    id: "turn_1",
    session_id: "sess_bridge",
    role: "assistant",
    content: "Cuando estés listo, dime: adelante.",
    payload,
    turn_index: 0,
    created_at: "2026-05-04T10:00:00.000Z",
  };
}

describe("ConnectThemesExperience", () => {
  it("permite avanzar desde la apertura del mapa", () => {
    render(
      <ConnectThemesExperience
        session={buildSession()}
        topics={topics}
        initialTurns={[buildOpeningTurn()]}
      />,
    );

    expect(
      screen.getByRole("button", { name: /empezar conexiones/i }),
    ).toBeTruthy();
  });
});
