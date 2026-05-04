import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionLoadingShell } from "@/components/session/experiences/shared/SessionLoadingShell";
import type {
  LearningEngine,
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

function buildSession(engine: LearningEngine): SparkLearningSession {
  return {
    id: "sess_1",
    user_id: "user_1",
    topic_ids: ["topic_1"],
    selected_note_ids: [],
    engine,
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

const topics: SparkTopic[] = [
  {
    id: "topic_1",
    user_id: "user_1",
    title: "Marketing Digital",
    summary: null,
    source_note_ids: [],
    tags: [],
    category: null,
    is_archived: false,
    is_demo: false,
    kairos_subject_id: null,
    kairos_color: null,
    created_at: "2026-05-04T10:00:00.000Z",
    updated_at: "2026-05-04T10:00:00.000Z",
  },
];

describe("SessionLoadingShell", () => {
  it("renderiza el copy genérico 'Preparando tu sesión…'", () => {
    render(
      <SessionLoadingShell
        session={buildSession("socratic")}
        topics={topics}
      />,
    );
    expect(screen.getByText(/preparando tu sesión/i)).toBeTruthy();
  });

  it("usa copy específico por método: socratic", () => {
    render(
      <SessionLoadingShell
        session={buildSession("socratic")}
        topics={topics}
      />,
    );
    // socratic → "Construyendo las preguntas que te van a llevar al porqué…"
    expect(
      screen.getByText(/construyendo las preguntas/i),
    ).toBeTruthy();
  });

  it("usa copy específico por método: debugger", () => {
    render(
      <SessionLoadingShell
        session={buildSession("debugger")}
        topics={topics}
      />,
    );
    expect(screen.getByText(/plantando los errores/i)).toBeTruthy();
  });

  it("usa copy específico por método: devils_advocate", () => {
    render(
      <SessionLoadingShell
        session={buildSession("devils_advocate")}
        topics={topics}
      />,
    );
    expect(
      screen.getByText(/afilando las objeciones/i),
    ).toBeTruthy();
  });

  it("usa copy específico por método: bridge_builder", () => {
    render(
      <SessionLoadingShell
        session={buildSession("bridge_builder")}
        topics={topics}
      />,
    );
    expect(screen.getByText(/mapeando los conceptos/i)).toBeTruthy();
  });

  it("usa copy específico por método: roleplay", () => {
    render(
      <SessionLoadingShell
        session={buildSession("roleplay")}
        topics={topics}
      />,
    );
    expect(screen.getByText(/armando la escena/i)).toBeTruthy();
  });

  it("muestra el título del topic en el header del shell", () => {
    render(
      <SessionLoadingShell
        session={buildSession("socratic")}
        topics={topics}
      />,
    );
    // El SessionShell muestra topics como ` · {titles}` en el header
    // (visible solo en >= sm:). En jsdom hidden:sm-inline aún se renderea
    // pero podríamos no verlo. Aceptamos cualquier match parcial.
    const matches = screen.queryAllByText(/marketing digital/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("NUNCA muestra el streamingText vivo (no debe parecer que la actividad se construye)", () => {
    // El componente ya no acepta streamingText. Aunque le pasemos uno via
    // any-cast, no debe rendear texto de Nova en pantalla. Renderizamos solo
    // el prop API actual y verificamos que el fragmento típico de un
    // primer turno NO aparece — es decir, no hay leak de streaming.
    render(
      <SessionLoadingShell
        session={buildSession("devils_advocate")}
        topics={topics}
      />,
    );
    // Cualquier frase típica de un primer turno NO debe aparecer
    expect(
      screen.queryByText(/declara tu postura concreta/i),
    ).toBeNull();
    expect(screen.queryByText(/```json/)).toBeNull();
  });
});
