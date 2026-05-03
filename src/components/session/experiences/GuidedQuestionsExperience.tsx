"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lightbulb,
  ArrowRight,
  Check,
  Layers,
  BookOpenCheck,
  Activity,
  Compass,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SessionShell } from "../SessionShell";
import { PhaseHUD } from "./shared/PhaseHUD";
import { NovaThinking, NovaCoachRibbon } from "./shared/NovaCoach";
import { CompletionPanel } from "./shared/CompletionPanel";
import { useSessionEngine } from "../useSessionEngine";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type {
  SocraticLayerPayload,
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

interface LayerEntry {
  /** 1..4 cuando viene del payload; -1 si es desconocida (legacy turn). */
  layer: number;
  question: string;
  payload: SocraticLayerPayload | null;
  answer?: string;
  /** Grade que Nova le puso a esta respuesta en el TURNO SIGUIENTE. */
  grade?: number | null;
  /** Nota inline sobre la respuesta. */
  gradeNote?: string | null;
  /** Si esta capa ya se cerró con un grade. */
  closed: boolean;
}

/**
 * Preguntas guiadas — camino por capas de comprensión.
 *
 * Mecánica:
 *   - Cada turno de Nova emite payload `socratic_layer` con la
 *     pregunta de la capa y, desde la capa 2, el grade real (0–100)
 *     de la respuesta anterior.
 *   - La capa 4 (Síntesis) trae además `closing_summary` y
 *     `gaps_detected`, que la UI muestra como cierre estructurado.
 *
 * El medidor de capas cerradas y el promedio de grade ya no son
 * decorativos: vienen del payload por turno.
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

  const layerEntries = useMemo(
    () => buildLayerEntries(engine.turns),
    [engine.turns],
  );

  const currentEntry = layerEntries.find((l) => !l.closed && l.question);
  const currentLayerIdx = currentEntry
    ? layerEntries.indexOf(currentEntry)
    : layerEntries.length - 1;
  const closedEntries = layerEntries.filter((l) => l.closed);
  const lastAssistant = engine.turns[engine.turns.length - 1];
  const lastPayload =
    lastAssistant?.role === "assistant" && lastAssistant.payload?.type === "socratic_layer"
      ? (lastAssistant.payload as SocraticLayerPayload)
      : null;

  // Reset textarea when layer changes
  useEffect(() => {
    setDraft("");
    if (textareaRef.current) textareaRef.current.focus();
  }, [currentEntry?.question]);

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

  // Real progress: count of closed layers / 4
  const closedCount = Math.min(4, closedEntries.length);
  const meterValue = engine.isCompleted ? 1 : closedCount / 4;
  const grades = closedEntries
    .map((e) => e.grade)
    .filter((g): g is number => typeof g === "number");
  const avgGrade =
    grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : null;

  // Layer number for display: prefer payload's `layer` if available, else
  // fall back to position in the list.
  const displayLayer = currentEntry?.payload?.layer ?? Math.min(4, layerEntries.length);
  const phaseIdx = Math.max(0, Math.min(3, displayLayer - 1));
  const layerLabel = LAYER_LABELS[phaseIdx];

  const closingSummary = lastPayload?.closing_summary ?? null;
  const gapsDetected = lastPayload?.gaps_detected ?? [];
  const showClosingPanel =
    (closingSummary || gapsDetected.length > 0) &&
    !engine.completionScore;

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
          meterLabel={avgGrade !== null ? "Profundidad" : "Capas cerradas"}
          meterValue={meterValue}
          badge={
            avgGrade !== null
              ? `${closedCount} / 4 · ø ${Math.round(avgGrade)}`
              : `${closedCount} / 4`
          }
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
          ) : currentEntry && currentEntry.question ? (
            <article
              key={currentEntry.question}
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
                    {displayLayer}
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: theme.accent }}
                    >
                      Capa {displayLayer} · {layerLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {LAYER_HINTS[layerLabel]}
                    </span>
                  </div>
                </div>
                {currentEntry.payload?.prior_answer_grade !== null &&
                currentEntry.payload?.prior_answer_grade !== undefined ? (
                  <GradeChip
                    score={currentEntry.payload.prior_answer_grade}
                    accent={theme.accent}
                  />
                ) : (
                  <NovaCoachRibbon engine={session.engine} label="Pregunta de Nova" />
                )}
              </header>

              {currentEntry.payload?.prior_answer_note && (
                <div
                  className="mb-5 rounded-xl border p-3 text-[12.5px] text-foreground/80 italic flex gap-2"
                  style={{
                    background: "rgb(254 252 232 / 0.5)",
                    borderColor: "rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <Activity
                    className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600"
                    strokeWidth={1.7}
                  />
                  <span>
                    <span className="font-medium not-italic text-amber-700">
                      Sobre tu capa anterior:{" "}
                    </span>
                    {currentEntry.payload.prior_answer_note}
                  </span>
                </div>
              )}

              <p className="text-[20px] md:text-[22px] leading-snug font-medium tracking-tight text-foreground">
                {currentEntry.question}
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
                    {displayLayer >= 4
                      ? "Cerrar la síntesis"
                      : "Avanzar a la siguiente capa"}
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

          {showClosingPanel && (
            <ClosingSynthesisPanel
              summary={closingSummary}
              gaps={gapsDetected}
              accent={theme.accent}
            />
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
          <header className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpenCheck
                className="w-4 h-4"
                strokeWidth={1.6}
                style={{ color: theme.accent }}
              />
              <span
                className="font-mono text-[10px] uppercase tracking-[0.18em]"
                style={{ color: theme.accent }}
              >
                Lo que ya entendiste
              </span>
            </div>
            {avgGrade !== null && (
              <span
                className="font-mono text-[10px] tracking-[0.14em] px-2 py-0.5 rounded-full"
                style={{
                  background: hexToRgba(theme.accent, 0.10),
                  color: theme.accent,
                }}
              >
                ø {Math.round(avgGrade)}
              </span>
            )}
          </header>
          {closedEntries.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Aún no cierras ninguna capa. Cada respuesta queda registrada con su
              evaluación.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {closedEntries.map((l, i) => {
                const layerNum = l.payload?.layer ?? Math.min(i + 1, 4);
                const labelIdx = Math.min(layerNum - 1, LAYER_LABELS.length - 1);
                return (
                  <ClosedLayerRow
                    key={i}
                    label={LAYER_LABELS[labelIdx]}
                    question={l.question}
                    answer={l.answer ?? ""}
                    grade={l.grade ?? null}
                    accent={theme.accent}
                  />
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </SessionShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Closed layer row in side panel — shows grade per layer.

function ClosedLayerRow({
  label,
  question,
  answer,
  grade,
  accent,
}: {
  label: string;
  question: string;
  answer: string;
  grade: number | null;
  accent: string;
}) {
  return (
    <li
      className="rounded-xl border bg-white/80 p-3"
      style={{ borderColor: hexToRgba(accent, 0.14) }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.16em] flex items-center gap-1"
          style={{ color: accent }}
        >
          <Layers className="w-3 h-3" strokeWidth={1.7} />
          {label}
        </span>
        {grade !== null ? (
          <span
            className="font-mono text-[10px] tabular-nums px-2 py-0.5 rounded-full"
            style={{
              background:
                grade >= 70
                  ? "rgb(209 250 229 / 0.7)"
                  : grade >= 45
                    ? "rgb(254 243 199 / 0.7)"
                    : "rgb(254 215 170 / 0.6)",
              color:
                grade >= 70
                  ? "rgb(5 150 105)"
                  : grade >= 45
                    ? "rgb(217 119 6)"
                    : "rgb(234 88 12)",
            }}
          >
            {Math.round(grade)}
          </span>
        ) : (
          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
        )}
      </div>
      <p className="text-[12px] text-muted-foreground line-clamp-2 mb-1.5">
        {question}
      </p>
      <p className="text-[12.5px] text-foreground/85 line-clamp-3">{answer}</p>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Closing synthesis panel — appears after layer 4 with gaps.

function ClosingSynthesisPanel({
  summary,
  gaps,
  accent,
}: {
  summary: string | null;
  gaps: string[];
  accent: string;
}) {
  return (
    <article
      className="rounded-3xl border bg-white/90 p-6 md:p-8 engine-card-rise"
      style={{ borderColor: hexToRgba(accent, 0.22) }}
    >
      <header className="flex items-center gap-2 mb-4">
        <Compass className="w-4 h-4" strokeWidth={1.7} style={{ color: accent }} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          Síntesis · regla mínima
        </span>
      </header>
      {summary && (
        <div
          className="rounded-2xl border p-4 mb-4 bg-emerald-50/40"
          style={{ borderColor: "rgba(16, 185, 129, 0.25)" }}
        >
          <p className="text-[15px] leading-relaxed text-foreground/90 italic">
            “{summary}”
          </p>
        </div>
      )}
      {gaps.length > 0 && (
        <div>
          <header className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.7} style={{ color: accent }} />
            <span
              className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
              style={{ color: accent }}
            >
              Brechas detectadas — repasar
            </span>
          </header>
          <ul className="flex flex-col gap-2">
            {gaps.map((g, i) => (
              <li
                key={i}
                className="text-[13px] text-foreground/85 leading-relaxed border-l-2 pl-3 py-0.5"
                style={{ borderColor: hexToRgba(accent, 0.4) }}
              >
                {g}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}

function GradeChip({ score, accent }: { score: number; accent: string }) {
  const tone =
    score >= 70
      ? { fg: "rgb(5 150 105)", bg: "rgb(209 250 229 / 0.6)", label: "sólida" }
      : score >= 45
        ? { fg: "rgb(217 119 6)", bg: "rgb(254 243 199 / 0.6)", label: "ok" }
        : { fg: "rgb(234 88 12)", bg: "rgb(254 215 170 / 0.5)", label: "frágil" };
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
      style={{
        background: tone.bg,
        borderColor: hexToRgba(accent, 0.18),
      }}
    >
      <Activity className="w-3 h-3" strokeWidth={1.7} style={{ color: tone.fg }} />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: tone.fg }}
      >
        Capa anterior · {Math.round(score)} {tone.label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Build layer entries from turns, marrying assistant questions
// (with their payload) and user answers (graded by the NEXT
// assistant payload).

function buildLayerEntries(turns: SparkSessionTurn[]): LayerEntry[] {
  const out: LayerEntry[] = [];
  let pendingQ: { text: string; payload: SocraticLayerPayload | null } | null = null;
  for (const t of turns) {
    if (t.role === "assistant") {
      const payload =
        t.payload?.type === "socratic_layer"
          ? (t.payload as SocraticLayerPayload)
          : null;
      // The grade in this payload refers to the PREVIOUS user answer
      if (
        payload &&
        payload.prior_answer_grade !== null &&
        out.length > 0 &&
        out[out.length - 1].answer
      ) {
        out[out.length - 1].grade = payload.prior_answer_grade;
        out[out.length - 1].gradeNote = payload.prior_answer_note;
        out[out.length - 1].closed = true;
      }
      if (pendingQ !== null) {
        // Previous question never got an answer; promote anyway.
        out.push({
          layer: pendingQ.payload?.layer ?? -1,
          question: pendingQ.text,
          payload: pendingQ.payload,
          closed: false,
        });
      }
      const questionText = payload?.question
        ? payload.question
        : stripJson(t.content);
      pendingQ = { text: questionText, payload };
    } else if (t.role === "user") {
      if (pendingQ !== null) {
        out.push({
          layer: pendingQ.payload?.layer ?? -1,
          question: pendingQ.text,
          payload: pendingQ.payload,
          answer: t.content,
          closed: false, // becomes closed when next assistant grades it
        });
        pendingQ = null;
      } else if (out.length > 0) {
        out[out.length - 1].answer = t.content;
      }
    }
  }
  if (pendingQ !== null) {
    out.push({
      layer: pendingQ.payload?.layer ?? -1,
      question: pendingQ.text,
      payload: pendingQ.payload,
      closed: false,
    });
  }
  return out;
}

function stripJson(text: string): string {
  return text.replace(/```json[\s\S]*?```/g, "").trim();
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
