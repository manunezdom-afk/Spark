"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lightbulb, ArrowRight, Check, Layers, BookOpenCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SessionShell } from "../SessionShell";
import { PhaseHUD } from "./shared/PhaseHUD";
import { NovaThinking, NovaCoachRibbon } from "./shared/NovaCoach";
import { CompletionPanel } from "./shared/CompletionPanel";
import { useSessionEngine } from "../useSessionEngine";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type {
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

const LAYER_LABELS = ["Superficie", "Causalidad", "Límites", "Síntesis"] as const;
const LAYER_HINTS: Record<(typeof LAYER_LABELS)[number], string> = {
  Superficie: "¿Qué dice el concepto?",
  Causalidad: "¿Por qué ocurre? ¿Qué lo causa?",
  Límites: "¿Cuándo deja de aplicar?",
  Síntesis: "Pone todas las capas en una regla mínima.",
};

/**
 * Preguntas guiadas — ya no es chat. Es un camino por capas.
 *
 * Layout:
 *   - HUD: capa actual (1..4) con nombre.
 *   - Tarjeta principal: la pregunta de la capa, grande, sola en pantalla.
 *   - Acciones: pedir pista (un click) + responder (textarea + botón).
 *   - Sidebar/abajo: las capas anteriores ya cerradas con un mini-resumen.
 *
 * No hay timeline tipo chat: cada pregunta es una "pantalla" propia. Las
 * respuestas anteriores quedan archivadas como "lo que ya entendiste".
 */
export function GuidedQuestionsExperience({
  session,
  topics,
  initialTurns,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  initialTurns: SparkSessionTurn[];
}) {
  const engine = useSessionEngine({ session, initialTurns });
  const theme = getEngineTheme(session.engine);
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Build the layer history from turns. Each assistant turn = a layer
  // question; each user turn = the user's answer to the previous layer.
  const layers = useMemo(() => {
    const acc: { question: string; answer?: string }[] = [];
    let pending: string | null = null;
    for (const t of engine.turns) {
      if (t.role === "assistant") {
        if (pending !== null) acc.push({ question: pending });
        pending = stripHints(t.content);
      } else if (t.role === "user") {
        if (pending !== null) {
          acc.push({ question: pending, answer: t.content });
          pending = null;
        } else if (acc.length > 0) {
          // user answered before next assistant; attach to last
          acc[acc.length - 1].answer = t.content;
        }
      }
    }
    if (pending !== null) acc.push({ question: pending });
    return acc;
  }, [engine.turns]);

  // The current layer is the one with no answer yet.
  const currentIdx = layers.findIndex((l) => !l.answer);
  const currentLayerIdx = currentIdx === -1 ? layers.length - 1 : currentIdx;
  const currentLayer = currentLayerIdx >= 0 ? layers[currentLayerIdx] : null;

  // Reset textarea when layer changes
  useEffect(() => {
    setDraft("");
    if (textareaRef.current) textareaRef.current.focus();
  }, [currentLayerIdx]);

  async function submitAnswer() {
    if (!draft.trim() || engine.status !== "idle") return;
    const text = draft;
    setDraft("");
    await engine.send(text);
  }

  async function askForHint() {
    if (engine.status !== "idle") return;
    await engine.send("Pista, por favor. Una sola, mínima.");
  }

  const layerNumber = Math.min(layers.length, LAYER_LABELS.length);
  const phaseIdx = Math.max(0, layerNumber - 1);
  const meterValue = engine.isCompleted
    ? 1
    : Math.min(1, layers.filter((l) => l.answer).length / 4);

  const closedLayers = layers
    .filter((l) => l.answer)
    .slice(0, currentLayer && !currentLayer.answer ? layerNumber - 1 : layerNumber);

  return (
    <SessionShell
      engine={session.engine}
      topics={topics}
      status={engine.isCompleted ? "completed" : "active"}
      onComplete={engine.complete}
      canComplete={engine.userTurnsCount > 0}
      hudSlot={
        <PhaseHUD
          engine={session.engine}
          kicker="Profundidad"
          phaseLabels={[...LAYER_LABELS]}
          currentPhase={phaseIdx}
          meterLabel="Capas cerradas"
          meterValue={meterValue}
          badge={`${closedLayers.length} / 4`}
        />
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 px-5 md:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-6 min-w-0">
          {engine.completionScore ? (
            <CompletionPanel
              score={engine.completionScore}
              topicId={session.topic_ids[0]}
            />
          ) : currentLayer && currentLayer.question ? (
            <article
              key={currentLayerIdx}
              className="rounded-3xl border bg-white/85 p-7 md:p-9 engine-card-rise shadow-soft"
              style={{
                borderColor: hexToRgba(theme.accent, 0.22),
                boxShadow: `0 12px 36px ${hexToRgba(theme.accent, 0.10)}`,
              }}
            >
              <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl font-mono text-[12px] font-semibold"
                    style={{
                      background: hexToRgba(theme.accent, 0.12),
                      color: theme.accent,
                      border: `1px solid ${hexToRgba(theme.accent, 0.28)}`,
                    }}
                  >
                    {layerNumber}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: theme.accent }}
                    >
                      Capa {layerNumber} · {LAYER_LABELS[phaseIdx]}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {LAYER_HINTS[LAYER_LABELS[phaseIdx]]}
                    </span>
                  </div>
                </div>
                <NovaCoachRibbon engine={session.engine} label="Pregunta de Nova" />
              </header>

              <p className="text-[20px] md:text-[22px] leading-snug font-medium tracking-tight text-foreground">
                {currentLayer.question}
              </p>

              <div className="mt-7 flex flex-col gap-3">
                <label
                  className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
                  htmlFor="layer-answer"
                >
                  Tu razonamiento (en voz alta)
                </label>
                <Textarea
                  id="layer-answer"
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="No la respuesta corta — explica el porqué."
                  rows={5}
                  disabled={engine.status !== "idle"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submitAnswer();
                    }
                  }}
                  className="bg-white/95"
                  style={{
                    borderColor: hexToRgba(theme.accent, 0.18),
                  }}
                />
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={askForHint}
                    disabled={engine.status !== "idle"}
                    className="gap-1.5"
                  >
                    <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.6} />
                    Pedir pista
                  </Button>
                  <Button
                    size="sm"
                    onClick={submitAnswer}
                    disabled={!draft.trim() || engine.status !== "idle"}
                    className="gap-1.5 text-white"
                    style={{
                      background: theme.coachGradient,
                    }}
                  >
                    Avanzar a la siguiente capa
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.7} />
                  </Button>
                </div>
                {engine.warning && (
                  <p className="text-xs text-amber-700">{engine.warning}</p>
                )}
              </div>
            </article>
          ) : engine.status === "streaming" ? (
            <div
              className="rounded-3xl border bg-white/70 p-9 engine-card-rise"
              style={{ borderColor: hexToRgba(theme.accent, 0.18) }}
            >
              <NovaThinking engine={session.engine} text={engine.streamingText} fullText />
            </div>
          ) : (
            <div className="rounded-3xl border border-black/[0.06] bg-white/60 p-9 text-center text-sm text-muted-foreground">
              Cargando la primera capa…
            </div>
          )}

          {engine.status === "streaming" && currentLayer?.question && (
            <div
              className="rounded-2xl border p-4 bg-white/60"
              style={{ borderColor: hexToRgba(theme.accent, 0.14) }}
            >
              <NovaThinking engine={session.engine} text={engine.streamingText} fullText />
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
          <header className="flex items-center gap-2">
            <BookOpenCheck className="w-4 h-4" strokeWidth={1.6} style={{ color: theme.accent }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
            >
              Lo que ya entendiste
            </span>
          </header>
          {closedLayers.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Aún no cierras ninguna capa. Cada respuesta queda registrada aquí.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {closedLayers.map((l, i) => (
                <li
                  key={i}
                  className="rounded-xl border bg-white/80 p-3"
                  style={{ borderColor: hexToRgba(theme.accent, 0.14) }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
                      style={{ color: theme.accent }}
                    >
                      <Layers className="w-3 h-3 inline-block mr-1" strokeWidth={1.7} />
                      {LAYER_LABELS[Math.min(i, LAYER_LABELS.length - 1)]}
                    </span>
                    <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-1.5">
                    {l.question}
                  </p>
                  <p className="text-[12.5px] text-foreground/85 line-clamp-3">{l.answer}</p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </SessionShell>
  );
}

/** Strip "Pista:" or "💡" tails from question text so the question stays clean. */
function stripHints(text: string): string {
  // Remove any inline JSON code block remnants that may have leaked
  return text.replace(/```json[\s\S]*?```/g, "").trim();
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
