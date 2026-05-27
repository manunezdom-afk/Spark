"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  ChevronRight,
  Clock,
  Drama,
  Loader2,
  ScrollText,
  Quote,
  Sparkles,
  ArrowRight,
  UserCheck,
  CheckCircle2,
  Activity,
  FileText,
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
  RoleplayScenePayload,
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

const ACT_LABELS = ["Apertura", "Tensión", "Decisión", "Debrief"] as const;

type DecisionPosture = "actuar" | "preguntar" | "esperar" | "escalar";

const POSTURE_LABELS: Record<
  DecisionPosture,
  { label: string; verb: string; placeholder: string }
> = {
  actuar: {
    label: "Actúo",
    verb: "Tomo la decisión y la ejecuto",
    placeholder: "Habla en escena. Qué dices o haces exactamente.",
  },
  preguntar: {
    label: "Indago",
    verb: "Pido información adicional antes",
    placeholder: "¿Qué pregunta haces y a quién?",
  },
  esperar: {
    label: "Sostengo",
    verb: "Mantengo posición y observo",
    placeholder: "¿Qué dices o haces para sostener? (silencio cuenta)",
  },
  escalar: {
    label: "Escalo",
    verb: "Subo el caso a un superior",
    placeholder: "¿A quién escalas y con qué argumento?",
  },
};

interface Act {
  index: number;
  payload: RoleplayScenePayload | null;
  /** Texto crudo del turn (fallback si no hay payload). */
  rawText?: string;
  userMove?: string;
  posture?: DecisionPosture;
  isDebrief: boolean;
}

/**
 * Caso real — simulación con escenas y decisiones.
 *
 * Mecánica:
 *   - Cada turno de Nova emite payload `roleplay_scene` con act,
 *     scene_label, scene_text en personaje, available_data (chips),
 *     prior_move_consequence (cómo reaccionó el personaje a la
 *     jugada anterior) y decision_pressure.
 *   - El usuario elige una postura (actuar/indagar/sostener/escalar)
 *     y escribe su jugada exacta en escena.
 *   - Sidebar: bitácora de actos con la postura tomada.
 */
export function RealCaseExperience({
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
  const [posture, setPosture] = useState<DecisionPosture>("actuar");
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const acts = useMemo(() => buildActs(engine.turns), [engine.turns]);
  const openAct = acts.find((a) => !a.userMove);

  useEffect(() => {
    setDraft("");
    setPosture("actuar");
    if (textareaRef.current) textareaRef.current.focus();
  }, [openAct?.payload?.scene_text, openAct?.rawText]);

  // Loading guard (después de TODOS los hooks): hasta que llegue la
  // primera escena en personaje, no renderizamos el ScenePanel.
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

  const userCount = engine.userTurnsCount;
  const phaseIdx = openAct?.payload?.act
    ? Math.min(openAct.payload.act - 1, ACT_LABELS.length - 1)
    : Math.min(userCount, ACT_LABELS.length - 1);
  const meterValue = engine.isCompleted ? 1 : Math.min(0.92, userCount * 0.22);

  const isDebrief = openAct?.isDebrief || openAct?.payload?.act === 4;

  async function submitMove() {
    if (!draft.trim() || engine.status !== "idle") return;
    const text = `[${POSTURE_LABELS[posture].label}] ${POSTURE_LABELS[posture].verb}.\n\n${draft.trim()}`;
    setDraft("");
    await engine.send(text);
  }

  return (
    <SessionShell
      engine={session.engine}
      topics={topics}
      status={engine.isCompleted ? "completed" : "active"}
      onComplete={engine.complete}
      canComplete={userCount > 0}
      errorMessage={engine.errorMessage}
      canRetry={engine.canRetry}
      onRetry={engine.retry}
      hudSlot={
        <PhaseHUD
          engine={session.engine}
          kicker="Escena"
          phaseLabels={[...ACT_LABELS]}
          currentPhase={phaseIdx}
          meterLabel="Avance del caso"
          meterValue={meterValue}
          badge={
            openAct?.payload?.act
              ? `Acto ${openAct.payload.act} · ${openAct.payload.scene_label || ACT_LABELS[phaseIdx]}`
              : userCount > 0
                ? `Acto ${userCount}`
                : undefined
          }
        />
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 px-5 md:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Always-visible scenario briefing */}
          <ScenarioBriefing
            persona={session.persona}
            scenario={session.scenario}
            topics={topics}
            accent={theme.accent}
          />

          {engine.completionScore ? (
            <CompletionPanel
              score={engine.completionScore}
              sessionId={session.id}
              topicId={session.topic_ids[0]}
            />
          ) : openAct ? (
            <ScenePanel
              act={openAct}
              persona={session.persona}
              isDebrief={isDebrief ?? false}
              accent={theme.accent}
              gradient={theme.coachGradient}
              status={engine.status}
              posture={posture}
              setPosture={setPosture}
              draft={draft}
              setDraft={setDraft}
              onSubmit={submitMove}
              textareaRef={textareaRef}
            />
          ) : engine.status === "streaming" ? (
            <div
              className="rounded-3xl border bg-white/70 p-9"
              style={{ borderColor: hexToRgba(theme.accent, 0.18) }}
            >
              <NovaThinking engine={session.engine} text={engine.streamingText} fullText />
            </div>
          ) : (
            <div className="rounded-3xl border border-black/[0.06] bg-white/60 p-9 text-center text-sm text-muted-foreground">
              Nova entrando en personaje…
            </div>
          )}
        </div>

        <ActsLog acts={acts} accent={theme.accent} />
      </div>
    </SessionShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Scene panel — renders prior consequence, scene_text, available
// data chips, decision pressure question, and posture+input.

function ScenePanel({
  act,
  persona,
  isDebrief,
  accent,
  gradient,
  status,
  posture,
  setPosture,
  draft,
  setDraft,
  onSubmit,
  textareaRef,
}: {
  act: Act;
  persona: string | null;
  isDebrief: boolean;
  accent: string;
  gradient: string;
  status: string;
  posture: DecisionPosture;
  setPosture: (p: DecisionPosture) => void;
  draft: string;
  setDraft: (s: string) => void;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const payload = act.payload;
  const sceneText = payload?.scene_text ?? stripJson(act.rawText ?? "");
  const availableData = payload?.available_data ?? [];
  const priorConsequence = payload?.prior_move_consequence ?? null;
  const decisionPressure = payload?.decision_pressure ?? null;
  const sceneLabel = payload?.scene_label ?? (isDebrief ? "Debrief" : "Escena");
  const actNum = payload?.act ?? act.index + 1;

  // Real-time keyword matching for data integration
  const integratedData = useMemo(() => {
    const dataList = payload?.available_data ?? [];
    return dataList.map((dataItem) => {
      const words = dataItem
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
        .split(/\s+/)
        .filter(
          (w) =>
            w.length > 3 &&
            ![
              "este",
              "esta",
              "para",
              "como",
              "tiene",
              "hace",
              "todo",
              "pero",
              "sino",
              "sobre",
              "entre",
              "bajo",
              "cabe",
              "desde",
              "hacia",
              "hasta",
              "para",
              "por",
              "segun",
              "sin",
              "tras",
              "cuyo",
              "cuya",
              "unos",
              "unas",
              "ellos",
              "ellas",
              "hayan",
              "habia",
            ].includes(w),
        );

      if (words.length === 0) return false;
      const draftLower = draft.toLowerCase();
      return words.some((word) => draftLower.includes(word));
    });
  }, [payload?.available_data, draft]);

  const baseConfidence = useMemo(() => {
    if (isDebrief) return 95;
    if (actNum === 1) return 45;
    if (actNum === 2) return 60;
    if (actNum === 3) return 75;
    return 50;
  }, [actNum, isDebrief]);

  const confidenceBonus = useMemo(() => {
    const integratedCount = integratedData.filter(Boolean).length;
    const wordBonus = Math.min(10, Math.floor(draft.trim().length / 20));
    return integratedCount * 10 + wordBonus;
  }, [integratedData, draft]);

  const confidenceScore = Math.min(100, baseConfidence + confidenceBonus);

  const { moodLabel, moodColor } = useMemo(() => {
    if (isDebrief) {
      return {
        moodLabel: "Analítico / Colaborativo",
        moodColor: {
          bg: "rgba(99, 102, 241, 0.06)",
          border: "rgba(99, 102, 241, 0.25)",
          text: "rgb(79, 70, 229)",
          shadow: "rgba(99, 102, 241, 0.05)",
        },
      };
    }
    if (confidenceScore < 50) {
      return {
        moodLabel: "Distante / Escéptico",
        moodColor: {
          bg: "rgba(245, 158, 11, 0.05)",
          border: "rgba(245, 158, 11, 0.22)",
          text: "rgb(217, 119, 6)",
          shadow: "rgba(245, 158, 11, 0.05)",
        },
      };
    }
    if (confidenceScore < 70) {
      return {
        moodLabel: "Interesado / Evaluando",
        moodColor: {
          bg: "rgba(6, 182, 212, 0.05)",
          border: "rgba(6, 182, 212, 0.22)",
          text: "rgb(8, 145, 178)",
          shadow: "rgba(6, 182, 212, 0.05)",
        },
      };
    }
    if (confidenceScore < 85) {
      return {
        moodLabel: "Convencido / Receptivo",
        moodColor: {
          bg: "rgba(16, 185, 129, 0.05)",
          border: "rgba(16, 185, 129, 0.22)",
          text: "rgb(5, 150, 105)",
          shadow: "rgba(16, 185, 129, 0.05)",
        },
      };
    }
    return {
      moodLabel: "Altamente Favorable",
      moodColor: {
        bg: "rgba(139, 92, 246, 0.06)",
        border: "rgba(139, 92, 246, 0.25)",
        text: "rgb(109, 40, 217)",
        shadow: "rgba(139, 92, 246, 0.08)",
      },
    };
  }, [confidenceScore, isDebrief]);

  return (
    <article
      key={act.index}
      className="rounded-3xl border bg-white/90 p-7 md:p-8 engine-card-rise shadow-soft animate-fade-in"
      style={{
        borderColor: hexToRgba(accent, 0.22),
        boxShadow: `0 12px 36px ${hexToRgba(accent, 0.1)}`,
      }}
    >
      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* Left Column: La Cabina de Negociación */}
        <div className="flex flex-col items-center border-b md:border-b-0 md:border-r border-black/[0.06] pb-6 md:pb-0 md:pr-6">
          <div className="flex items-center gap-2 mb-4 self-start">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg"
              style={{
                background: hexToRgba(accent, 0.12),
                color: accent,
                border: `1px solid ${hexToRgba(accent, 0.28)}`,
              }}
            >
              <Drama className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
            <span className="font-semibold text-[11px]" style={{ color: accent }}>
              Cabina de Negociación
            </span>
          </div>

          {/* Avatar sphere */}
          <div className="relative w-28 h-28 mx-auto flex items-center justify-center mb-4 mt-2">
            {/* Outer dashed spinning active ring */}
            <div
              className="absolute inset-0 rounded-full border-2 border-dashed opacity-40 animate-[spin_30s_linear_infinite]"
              style={{ borderColor: accent }}
            />
            {/* Middle pulse ring */}
            <div
              className="absolute inset-2 rounded-full border opacity-30 animate-ping"
              style={{ borderColor: accent, animationDuration: "3s" }}
            />
            {/* Inner glowing sphere */}
            <div
              className="absolute inset-2 rounded-full border flex items-center justify-center shadow-inner transition-all duration-500"
              style={{
                borderColor: moodColor.border,
                background: `radial-gradient(circle at center, ${moodColor.bg} 0%, rgba(255,255,255,0.7) 100%)`,
                boxShadow: `0 0 20px ${moodColor.shadow}`,
              }}
            >
              {isDebrief ? (
                <CheckCircle2
                  className="w-12 h-12 transition-all duration-300"
                  strokeWidth={1.5}
                  style={{ color: moodColor.text }}
                />
              ) : (
                <UserCheck
                  className="w-12 h-12 transition-all duration-300"
                  strokeWidth={1.5}
                  style={{ color: moodColor.text }}
                />
              )}
            </div>
          </div>

          {/* Role Name */}
          <div className="text-center mb-1">
            <h4 className="font-bold text-[14px] text-ink line-clamp-1">
              {isDebrief ? "Análisis de Nova" : persona ?? "Negociador"}
            </h4>
            <span className="text-[11px] text-muted-foreground uppercase tracking-widest font-mono">
              {isDebrief ? "Sesión Completada" : `Acto ${actNum} / 3`}
            </span>
          </div>

          {/* Mood Badge */}
          <div className="mt-2 flex justify-center w-full">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all duration-300 uppercase tracking-wider shadow-sm"
              style={{
                backgroundColor: moodColor.bg,
                borderColor: moodColor.border,
                color: moodColor.text,
                boxShadow: `0 2px 10px ${moodColor.shadow}`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: moodColor.text }}
              />
              {moodLabel}
            </span>
          </div>

          {/* Confianza Gauge */}
          <div className="mt-5 w-full">
            <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-muted-foreground tracking-wider">
              <span className="flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 animate-pulse" strokeWidth={1.5} style={{ color: moodColor.text }} />
                CONFIANZA / CONVICCIÓN
              </span>
              <span style={{ color: moodColor.text }} className="font-mono">
                {confidenceScore}%
              </span>
            </div>
            <div className="h-2 w-full bg-black/[0.04] rounded-full overflow-hidden border border-black/[0.02] relative">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${confidenceScore}%`,
                  background: `linear-gradient(to right, ${hexToRgba(accent, 0.6)}, ${accent})`,
                  boxShadow: `0 0 8px ${accent}`,
                }}
              />
            </div>
          </div>

          {/* Dynamic leverage tokens */}
          {availableData.length > 0 && !isDebrief && (
            <div className="mt-6 pt-5 border-t border-black/[0.06] w-full">
              <span
                className="font-semibold text-[10px] block mb-2.5 tracking-wider uppercase text-muted-foreground"
              >
                Fichas de Negociación ({availableData.length})
              </span>
              <div className="flex flex-col gap-2.5">
                {availableData.map((d, i) => {
                  const isIntegrated = integratedData[i];
                  return (
                    <div
                      key={i}
                      className="rounded-xl border p-2.5 text-[11.5px] leading-snug transition-all duration-300 relative overflow-hidden"
                      style={
                        isIntegrated
                          ? {
                              borderColor: "rgba(16, 185, 129, 0.4)",
                              backgroundColor: "rgba(209, 250, 229, 0.45)",
                              boxShadow: "0 0 10px rgba(16, 185, 129, 0.15)",
                              color: "rgb(6, 95, 70)",
                            }
                          : {
                              borderColor: hexToRgba(accent, 0.18),
                              backgroundColor: "rgba(255, 255, 255, 0.6)",
                              color: "rgb(75, 85, 99)",
                            }
                      }
                    >
                      <div
                        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-full"
                        style={{
                          backgroundColor: isIntegrated
                            ? "rgb(16, 185, 129)"
                            : hexToRgba(accent, 0.4),
                        }}
                      />
                      <div className="pl-2 flex items-start gap-1.5">
                        <span
                          className="shrink-0 font-bold font-mono"
                          style={{
                            color: isIntegrated ? "rgb(16, 185, 129)" : accent,
                          }}
                        >
                          {isIntegrated ? "✓" : "•"}
                        </span>
                        <div>
                          <p className={isIntegrated ? "font-semibold" : ""}>{d}</p>
                          {isIntegrated && (
                            <span className="inline-block mt-1 text-[8.5px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100/60 px-1.5 py-0.5 rounded">
                              ¡Integrado en borrador!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lecciones del caso (Debrief) */}
          {availableData.length > 0 && isDebrief && (
            <div className="mt-6 pt-5 border-t border-black/[0.06] w-full">
              <span
                className="font-semibold text-[10px] block mb-2.5 tracking-wider uppercase text-slate-500"
              >
                Lecciones del Caso
              </span>
              <ul className="flex flex-col gap-2.5">
                {availableData.map((d, i) => (
                  <li
                    key={i}
                    className="text-[12px] text-foreground/80 leading-relaxed border-l-2 pl-3 py-1.5 border-indigo-500/50 bg-indigo-50/20 rounded-r-xl p-2.5"
                  >
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Dialogue and Proposal Draft Editor */}
        <div className="flex flex-col gap-5 min-w-0">
          <header className="flex items-center justify-between gap-3 border-b border-black/[0.04] pb-3">
            <h3 className="font-bold text-[15px] text-ink">
              {isDebrief ? "Análisis de Cierre del Caso" : `Acto ${actNum} · ${sceneLabel}`}
            </h3>
            <NovaCoachRibbon
              engine="roleplay"
              label={isDebrief ? "Saliendo del rol" : "Nova en escena"}
            />
          </header>

          {/* Consequence of prior action */}
          {priorConsequence && !isDebrief && (
            <div
              className="rounded-2xl border p-4 text-[13px] flex gap-3 shadow-sm bg-amber-50/40 animate-fade-in"
              style={{
                borderColor: "rgba(245, 158, 11, 0.28)",
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.04)",
              }}
            >
              <Sparkles
                className="w-4 h-4 mt-0.5 shrink-0 text-amber-700 animate-pulse"
                strokeWidth={1.5}
              />
              <div>
                <span className="font-semibold text-amber-800 text-[10px] block uppercase tracking-wider mb-0.5">
                  Efecto de tu Acción Anterior
                </span>
                <p className="text-foreground/80 italic leading-relaxed">
                  {priorConsequence}
                </p>
              </div>
            </div>
          )}

          {/* Dialogue bubble */}
          <div
            className="relative rounded-2xl border p-6 bg-white/70 shadow-sm"
            style={{
              borderColor: hexToRgba(accent, 0.16),
              boxShadow: `0 4px 20px ${hexToRgba(accent, 0.02)}`,
            }}
          >
            <Quote
              className="absolute top-4 left-4 w-4 h-4 opacity-35"
              strokeWidth={1.5}
              style={{ color: accent }}
            />
            <p className="text-[15.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap pl-6 italic font-medium">
              {sceneText}
            </p>
          </div>

          {/* Debrief feedback */}
          {isDebrief && priorConsequence && (
            <div
              className="rounded-2xl border p-5 bg-indigo-50/30"
              style={{
                borderColor: "rgba(99, 102, 241, 0.25)",
              }}
            >
              <span className="font-semibold text-indigo-800 text-[10px] block uppercase tracking-wider mb-1.5">
                Veredicto y Retroalimentación Final
              </span>
              <p className="text-[14px] text-foreground/80 leading-relaxed italic">
                {priorConsequence}
              </p>
            </div>
          )}

          {/* Decision pressure */}
          {decisionPressure && !isDebrief && (
            <div
              className="rounded-2xl border-l-4 pl-4 py-3 bg-orange-50/15"
              style={{ borderColor: accent }}
            >
              <span
                className="font-semibold text-[10px] block uppercase tracking-wider"
                style={{ color: accent }}
              >
                Dilema de Decisión
              </span>
              <p className="text-[14.5px] font-bold text-foreground/90 mt-1 leading-snug">
                {decisionPressure}
              </p>
            </div>
          )}

          {/* Posture & Contract Draft */}
          {!isDebrief && (
            <div
              className="rounded-2xl border bg-white/80 p-5 flex flex-col gap-4 mt-1"
              style={{ borderColor: hexToRgba(accent, 0.18) }}
            >
              <div>
                <span
                  className="font-semibold text-[10px] block mb-2 tracking-wider uppercase"
                  style={{ color: accent }}
                >
                  Postura ante este momento
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(POSTURE_LABELS) as DecisionPosture[]).map((k) => {
                    const active = posture === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setPosture(k)}
                        className="rounded-xl border py-2.5 px-3 text-[12px] font-bold transition-all duration-200"
                        style={
                          active
                            ? {
                                borderColor: accent,
                                background: hexToRgba(accent, 0.08),
                                color: accent,
                                boxShadow: `0 0 10px ${hexToRgba(accent, 0.15)}`,
                              }
                            : {
                                borderColor: "rgba(0,0,0,0.06)",
                                background: "rgba(255,255,255,0.7)",
                                color: "rgb(75, 85, 99)",
                              }
                        }
                      >
                        {POSTURE_LABELS[k].label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div
                className="rounded-xl border p-4 bg-white/95 relative overflow-hidden"
                style={{ borderColor: hexToRgba(accent, 0.12) }}
              >
                {/* Lined contract background aesthetic */}
                <div className="absolute top-0 right-0 left-0 h-8 border-b border-black/[0.04] bg-black/[0.01] px-4 flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold text-muted-foreground tracking-widest flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                    BORRADOR DE PROPUESTA LÓGICA
                  </span>
                  <span
                    className="text-[9.5px] font-bold uppercase tracking-widest font-mono"
                    style={{ color: accent }}
                  >
                    {POSTURE_LABELS[posture].label}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <label
                    className="font-semibold text-[10.5px] text-muted-foreground mt-1"
                  >
                    Redacta tu propuesta de acción — {POSTURE_LABELS[posture].verb}
                  </label>
                  <Textarea
                    ref={textareaRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={POSTURE_LABELS[posture].placeholder}
                    rows={4}
                    disabled={status !== "idle"}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        onSubmit();
                      }
                    }}
                    className="bg-white/60 resize-none font-sans text-[14px] leading-relaxed border-black/[0.06] focus:border-indigo-500/30 focus-visible:ring-1 focus-visible:ring-indigo-500/30"
                  />
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Atajo: ⌘+Enter
                    </span>
                    <Button
                      size="sm"
                      onClick={onSubmit}
                      disabled={!draft.trim() || status !== "idle"}
                      className="text-white gap-1.5 font-bold transition-all duration-300"
                      style={{ background: gradient }}
                    >
                      {status === "streaming" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                          Personaje reacciona…
                        </>
                      ) : (
                        <>
                          Ejecutar jugada
                          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Always-visible briefing (persona + topics + scenario).

function ScenarioBriefing({
  persona,
  scenario,
  topics,
  accent,
}: {
  persona: string | null;
  scenario: string | null;
  topics: SparkTopic[];
  accent: string;
}) {
  return (
    <div
      className="rounded-3xl border bg-white/80 p-5"
      style={{ borderColor: hexToRgba(accent, 0.18) }}
    >
      <header className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4" strokeWidth={1.5} style={{ color: accent }} />
          <span
            className="font-medium text-[11px]"
            style={{ color: accent }}
          >
            Briefing del caso
          </span>
        </div>
        <span className="font-medium text-[11px] text-muted-foreground inline-flex items-center gap-1">
          <Clock className="w-3 h-3" strokeWidth={1.5} />
          Tiempo libre
        </span>
      </header>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <span className="font-medium text-[11px] text-muted-foreground block mb-1">
            Personaje
          </span>
          <p className="text-[13.5px] text-foreground/90">
            {persona ?? "Personaje sin definir"}
          </p>
        </div>
        <div>
          <span className="font-medium text-[11px] text-muted-foreground block mb-1">
            Temas que aplicas
          </span>
          <p className="text-[13.5px] text-foreground/90">
            {topics.map((t) => t.title).join(" · ")}
          </p>
        </div>
      </div>
      {scenario && (
        <div className="mt-4 pt-4 border-t border-black/[0.06]">
          <span className="font-medium text-[11px] text-muted-foreground block mb-1">
            Situación
          </span>
          <p className="text-[13.5px] text-foreground/85 leading-relaxed">{scenario}</p>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Side panel: acts log with posture per act.

function ActsLog({ acts, accent }: { acts: Act[]; accent: string }) {
  return (
    <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <ScrollText className="w-4 h-4" strokeWidth={1.5} style={{ color: accent }} />
        <span
          className="font-medium text-[11px]"
          style={{ color: accent }}
        >
          Bitácora del caso
        </span>
      </header>
      {acts.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground italic">
          Cada acto del caso queda registrado con la postura que tomaste.
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5 relative">
          {acts.map((a) => {
            const actNum = a.payload?.act ?? a.index + 1;
            const sceneLabel = a.payload?.scene_label ?? `Acto ${actNum}`;
            const sceneText = a.payload?.scene_text ?? stripJson(a.rawText ?? "");
            return (
              <li
                key={a.index}
                className="rounded-xl border bg-white/85 p-3"
                style={{ borderColor: hexToRgba(accent, 0.14) }}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className="font-medium text-[11px]"
                    style={{ color: accent }}
                  >
                    Acto {actNum} · {sceneLabel}
                  </span>
                  {a.posture && (
                    <span className="font-medium text-[11px] text-foreground/60 flex items-center gap-1">
                      <ArrowRight className="w-2.5 h-2.5" strokeWidth={1.5} />
                      {POSTURE_LABELS[a.posture].label}
                    </span>
                  )}
                </div>
                {sceneText && (
                  <p className="text-[12px] text-foreground/85 italic line-clamp-2 mb-1.5">
                    {sceneText}
                  </p>
                )}
                {a.userMove && (
                  <p className="text-[11.5px] text-muted-foreground line-clamp-2 border-l-2 pl-2 border-black/[0.06]">
                    {extractMoveBody(a.userMove)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────
// Build acts from turns: pair each assistant scene (with payload)
// with the next user move.

function buildActs(turns: SparkSessionTurn[]): Act[] {
  const out: Act[] = [];
  let idx = 0;
  let pending: { rawText: string; payload: RoleplayScenePayload | null } | null = null;

  for (const t of turns) {
    if (t.role === "assistant") {
      const payload =
        t.payload?.type === "roleplay_scene"
          ? (t.payload as RoleplayScenePayload)
          : null;
      if (pending !== null) {
        const isDebrief = isDebriefFromPayload(pending.payload, pending.rawText);
        out.push({
          index: idx,
          payload: pending.payload,
          rawText: pending.rawText,
          isDebrief,
        });
        idx += 1;
      }
      pending = { rawText: t.content, payload };
    } else if (t.role === "user") {
      const userMove = t.content;
      const posture = inferPosture(userMove);
      const isDebrief =
        pending && isDebriefFromPayload(pending.payload, pending.rawText);
      out.push({
        index: idx,
        payload: pending?.payload ?? null,
        rawText: pending?.rawText,
        userMove,
        posture,
        isDebrief: isDebrief ?? false,
      });
      pending = null;
      idx += 1;
    }
  }

  if (pending !== null) {
    out.push({
      index: idx,
      payload: pending.payload,
      rawText: pending.rawText,
      isDebrief: isDebriefFromPayload(pending.payload, pending.rawText),
    });
  }
  return out;
}

function inferPosture(text: string): DecisionPosture | undefined {
  const m = text.match(/^\[(Actúo|Indago|Sostengo|Escalo)\]/i);
  if (!m) return undefined;
  const k = m[1].toLowerCase();
  if (k === "actúo") return "actuar";
  if (k === "indago") return "preguntar";
  if (k === "sostengo") return "esperar";
  if (k === "escalo") return "escalar";
  return undefined;
}

// Debrief detection prefers the explicit payload flags. The regex on the
// raw text is kept as a last-resort fallback for sessions persisted before
// the schema carried `is_debrief` / before Nova consistently emitted
// `act: 4` — it should not be needed for new sessions.
function isDebriefFromPayload(
  payload: RoleplayScenePayload | null,
  rawText: string | undefined,
): boolean {
  if (payload?.is_debrief === true) return true;
  if (payload?.act === 4) return true;
  if (rawText && /saliendo de personaje|fuera de personaje|debrief/i.test(rawText)) {
    return true;
  }
  return false;
}

function extractMoveBody(text: string) {
  return text
    .replace(/^\[(Actúo|Indago|Sostengo|Escalo)\][^.\n]*\.?\n*/i, "")
    .trim()
    .slice(0, 100);
}

function stripJson(text: string) {
  return text.replace(/```json[\s\S]*?```/g, "").trim();
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
