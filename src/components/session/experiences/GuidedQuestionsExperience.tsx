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
import { SessionLoadingShell } from "./shared/SessionLoadingShell";
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

  const depth = useMemo(() => calculateReasoningDepth(draft), [draft]);

  const currentEntry = layerEntries.find((l) => !l.closed && l.question);
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

  // Loading guard: hasta que llegue la primera pregunta de Nova,
  // mostramos el SessionLoadingShell premium en vez del article del
  // método. Evita que el usuario vea el panel principal vacío de
  // contenido durante los segundos iniciales del kickoff. DEBE ir
  // después de TODOS los hooks para no violar las rules-of-hooks.
  const isInitialLoading =
    engine.assistantTurnsCount === 0 &&
    session.status === "active" &&
    !engine.completionScore;
  if (isInitialLoading) {
    return (
      <SessionLoadingShell
        session={session}
        topics={topics}
      />
    );
  }

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
      errorMessage={engine.errorMessage}
      canRetry={engine.canRetry}
      onRetry={engine.retry}
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
              sessionId={session.id}
              topicId={session.topic_ids[0]}
            />
          ) : currentEntry && currentEntry.question ? (
            <article
              key={currentEntry.question}
              className="rounded-3xl border bg-white/85 p-6 md:p-8 engine-card-rise shadow-soft overflow-hidden"
              style={{
                borderColor: hexToRgba(theme.accent, 0.22),
                boxShadow: `0 12px 36px ${hexToRgba(theme.accent, 0.10)}`,
              }}
            >
              <div className="grid md:grid-cols-[260px_1fr] gap-8 items-start">
                {/* Left Column: Concentric Layers Socratic Sphere */}
                <div className="flex flex-col items-center gap-4">
                  <SocraticSphere
                    displayLayer={displayLayer}
                    closedCount={closedCount}
                  />
                </div>

                {/* Right Column: Socratic Layer Question and input flow */}
                <div className="flex flex-col min-w-0">
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
                          className="font-medium text-[11px]"
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
                        strokeWidth={1.5}
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
                      className="font-medium text-[11px] text-muted-foreground"
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
                      rows={4}
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

                    {/* Real-time Reasoning Depth Meter */}
                    <div className="bg-white/70 p-4 rounded-2xl border border-black/[0.04] transition-all duration-300">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Activity
                            className={`w-3.5 h-3.5 transition-colors duration-300 ${
                              depth.score >= 75
                                ? "text-emerald-500"
                                : depth.score >= 45
                                ? "text-amber-500"
                                : "text-muted-foreground"
                            }`}
                            strokeWidth={1.5}
                          />
                          <span className="text-[11px] font-semibold text-foreground/80">
                            Medidor de Profundidad Socrática
                          </span>
                        </div>
                        <span className="font-mono text-xs font-bold tabular-nums text-foreground/70">
                          {depth.score}%
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden p-[1px]">
                        <div
                          className="h-full rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${depth.score}%`,
                            background:
                              depth.score >= 75
                                ? "linear-gradient(90deg, #10b981, #34d399)"
                                : depth.score >= 45
                                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                                : "linear-gradient(90deg, #f97316, #fdba74)",
                            boxShadow:
                              depth.score >= 45
                                ? `0 0 8px ${depth.score >= 75 ? "rgba(16,185,129,0.3)" : "rgba(245,158,11,0.3)"}`
                                : "none",
                          }}
                        />
                      </div>

                      {/* Real-time Feedback & Indicators */}
                      <p className="text-[11px] text-muted-foreground mt-2 italic leading-relaxed">
                        {depth.feedback}
                      </p>

                      {/* Tags for dynamic keywords matching */}
                      {draft.trim() && (
                        <div className="mt-3 flex flex-wrap gap-1.5 items-center">
                          <span className="text-[10px] text-muted-foreground font-medium mr-1">
                            Conectores detectados:
                          </span>
                          {depth.keywordsFound.map((kw, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100"
                            >
                              ✓ {kw}
                            </span>
                          ))}
                          {depth.missingConcepts.map((mc, idx) => (
                            <span
                              key={idx}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-black/[0.02] text-muted-foreground border border-black/[0.04]"
                            >
                              + {mc.split(" ")[0]}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap mt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={askForHint}
                        disabled={engine.status !== "idle"}
                        className="gap-1.5"
                      >
                        <Lightbulb className="w-3.5 h-3.5" strokeWidth={1.5} />
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
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                    {engine.warning && (
                      <p className="text-xs text-amber-700">{engine.warning}</p>
                    )}
                  </div>
                </div>
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
                strokeWidth={1.5}
                style={{ color: theme.accent }}
              />
              <span
                className="font-medium text-[11px]"
                style={{ color: theme.accent }}
              >
                Lo que ya entendiste
              </span>
            </div>
            {avgGrade !== null && (
              <span
                className="font-medium text-[11px] px-2 py-0.5 rounded-full"
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
          className="font-medium text-[11px] flex items-center gap-1"
          style={{ color: accent }}
        >
          <Layers className="w-3 h-3" strokeWidth={1.5} />
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
          <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
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
        <Compass className="w-4 h-4" strokeWidth={1.5} style={{ color: accent }} />
        <span
          className="font-medium text-[11px]"
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
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} style={{ color: accent }} />
            <span
              className="font-medium text-[11px]"
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
      <Activity className="w-3 h-3" strokeWidth={1.5} style={{ color: tone.fg }} />
      <span
        className="font-medium text-[11px]"
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
      if (out.length > 0 && out[out.length - 1].answer) {
        if (payload && payload.prior_answer_grade !== null && payload.prior_answer_grade !== undefined) {
          out[out.length - 1].grade = payload.prior_answer_grade;
          out[out.length - 1].gradeNote = payload.prior_answer_note;
        }
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

// ─────────────────────────────────────────────────────────────
// Socratic concentric layered sphere component

function SocraticSphere({
  displayLayer,
  closedCount,
}: {
  displayLayer: number;
  closedCount: number;
}) {
  const layers = [
    { num: 1, label: "Superficie" },
    { num: 2, label: "Causalidad" },
    { num: 3, label: "Límites" },
    { num: 4, label: "Síntesis" },
  ];

  // Spheric background gradient based on current layer
  const bgGradients = [
    "from-amber-400/10 via-orange-500/5 to-transparent",
    "from-cyan-400/10 via-blue-500/5 to-transparent",
    "from-violet-400/10 via-indigo-500/5 to-transparent",
    "from-emerald-400/10 via-teal-500/5 to-transparent",
  ];
  const currentGradient = bgGradients[Math.min(3, Math.max(0, displayLayer - 1))];

  return (
    <div className="flex flex-col items-center justify-center p-5 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-inner w-full max-w-[280px] mx-auto">
      <div className="relative w-40 h-40 flex items-center justify-center select-none">
        {/* Dynamic Glow Background */}
        <div className={`absolute inset-4 rounded-full bg-gradient-to-tr ${currentGradient} blur-xl transition-all duration-1000`} />
        
        {/* Outer Ring: Layer 1 (Superficie) */}
        <div
          className={`absolute w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
            closedCount >= 1
              ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : displayLayer === 1
              ? "border-amber-500 border-dashed animate-[spin_20s_linear_infinite] shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              : "border-black/[0.04] border-dotted"
          }`}
        />

        {/* Second Ring: Layer 2 (Causalidad) */}
        <div
          className={`absolute w-28 h-28 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
            closedCount >= 2
              ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : displayLayer === 2
              ? "border-cyan-500 border-dashed animate-[spin_15s_linear_infinite_reverse] shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              : "border-black/[0.04] border-dotted"
          }`}
        />

        {/* Third Ring: Layer 3 (Límites) */}
        <div
          className={`absolute w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
            closedCount >= 3
              ? "border-emerald-500 bg-emerald-500/5 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
              : displayLayer === 3
              ? "border-violet-500 border-dashed animate-[spin_10s_linear_infinite] shadow-[0_0_15px_rgba(139,92,246,0.2)]"
              : "border-black/[0.04] border-dotted"
          }`}
        />

        {/* Inner Core: Layer 4 (Síntesis) */}
        <div
          className={`absolute w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-700 shadow-sm ${
            closedCount >= 4
              ? "border-emerald-500 bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              : displayLayer === 4
              ? "border-emerald-400 bg-emerald-500/10 text-emerald-600 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              : "border-black/[0.06] bg-black/[0.02] text-muted-foreground"
          }`}
        >
          {closedCount >= 4 ? (
            <Check className="w-4 h-4 text-white" strokeWidth={1.5} />
          ) : (
            <span className="font-mono text-[11px] font-bold">{displayLayer}</span>
          )}
        </div>
      </div>

      {/* Layer legend */}
      <div className="mt-4 w-full flex flex-col gap-1">
        {layers.map((l) => {
          const isCompleted = closedCount >= l.num;
          const isActive = displayLayer === l.num && !isCompleted;
          return (
            <div
              key={l.num}
              className={`flex items-center justify-between text-[10px] px-2 py-0.5 rounded-lg transition-all duration-300 ${
                isActive
                  ? "bg-amber-50 border border-amber-200/50 font-semibold text-amber-900"
                  : isCompleted
                  ? "bg-emerald-50/50 text-emerald-800 font-medium"
                  : "text-muted-foreground opacity-60"
              }`}
            >
              <div className="flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCompleted
                      ? "bg-emerald-500"
                      : isActive
                      ? "bg-amber-500 animate-pulse"
                      : "bg-black/10"
                  }`}
                />
                <span>Capa {l.num}: {l.label}</span>
              </div>
              <span className="text-[9px] font-mono opacity-80">
                {isCompleted ? "Cerrada" : isActive ? "Activa" : "Bloqueada"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Real-time Socratic Reasoning Depth calculator

interface ReasoningDepth {
  score: number;
  keywordsFound: string[];
  missingConcepts: string[];
  feedback: string;
}

function calculateReasoningDepth(text: string): ReasoningDepth {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      score: 0,
      keywordsFound: [],
      missingConcepts: ["Causalidad", "Límites", "Síntesis"],
      feedback: "Escribe tu reflexión para evaluar la profundidad cognitiva en tiempo real.",
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const categories = {
    causalidad: {
      label: "Causalidad (ej: porque, debido a)",
      keywords: ["porque", "debido a", "causa", "ya que", "puesto que", "por lo tanto", "consecuencia", "dado que", "genera", "produce", "deriva", "origen"],
    },
    limites: {
      label: "Límites (ej: excepto, si no)",
      keywords: ["siempre que", "excepto", "pero si", "a menos que", "limite", "condicion", "restringe", "sino", "aunque", "sin embargo", "no obstante", "salvo", "caso contrario"],
    },
    sintesis: {
      label: "Síntesis (ej: es decir, ejemplo)",
      keywords: ["ejemplo", "es decir", "en resumen", "sintesis", "fundamentalmente", "esencialmente", "nucleo", "estructura", "concluyendo", "en definitiva"],
    },
  };

  const textLower = trimmed.toLowerCase();
  const matchedCategories: string[] = [];
  const keywordsFound: string[] = [];
  const missingConcepts: string[] = [];

  for (const [key, cat] of Object.entries(categories)) {
    const foundInCat = cat.keywords.filter(keyword => {
      if (keyword.includes(" ")) {
        return textLower.includes(keyword);
      }
      const regex = new RegExp(`\\b${keyword}\\b`, "i");
      return regex.test(textLower);
    });

    if (foundInCat.length > 0) {
      matchedCategories.push(key);
      keywordsFound.push(...foundInCat.slice(0, 2));
    } else {
      missingConcepts.push(cat.label);
    }
  }

  // Length score: up to 40 points (scaled up to 80 words)
  const lengthScore = Math.min(40, (wordCount / 80) * 40);

  // Keyword category score: 20 points per matched category (max 60 points)
  const keywordScore = matchedCategories.length * 20;

  const rawScore = lengthScore + keywordScore;
  const score = Math.min(100, Math.round(rawScore));

  let feedback = "";
  if (score < 25) {
    feedback = "Intenta extender tu explicación con más detalles de tu comprensión.";
  } else if (score < 50) {
    feedback = "Buen inicio. Añade conectores lógicos como 'porque' o 'sin embargo' para profundizar.";
  } else if (score < 75) {
    feedback = "¡Análisis profundo! Estás justificando tus ideas y mostrando matices cognitivos.";
  } else {
    feedback = "Profundidad cognitiva sobresaliente. Tu razonamiento es robusto y articulado.";
  }

  return {
    score,
    keywordsFound: Array.from(new Set(keywordsFound)),
    missingConcepts,
    feedback,
  };
}
