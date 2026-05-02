"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Briefcase,
  ChevronRight,
  Clock,
  Drama,
  Loader2,
  ScrollText,
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
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

const ACT_LABELS = ["Apertura", "Tensión", "Decisión", "Debrief"] as const;

type DecisionPosture = "actuar" | "preguntar" | "esperar" | "escalar";

const POSTURE_LABELS: Record<DecisionPosture, { label: string; verb: string }> = {
  actuar: { label: "Actúo", verb: "Tomo la decisión y la ejecuto" },
  preguntar: { label: "Indago", verb: "Pido información adicional antes" },
  esperar: { label: "Sostengo", verb: "Mantengo posición y observo" },
  escalar: { label: "Escalo", verb: "Subo el caso a un superior" },
};

/**
 * Caso real — ya no es chat. Es una simulación con escenas y decisiones.
 *
 * Layout:
 *  - Briefing del caso arriba: contexto, datos relevantes, objetivo.
 *  - "Acto" actual: lo que dice el personaje (Nova en rol).
 *  - Panel de decisión: el usuario elige una postura + escribe su jugada.
 *  - Sidebar: timeline de actos pasados con la decisión que tomó.
 *  - Cuando Nova "sale del rol" para el debrief, se renderiza un panel
 *    distinto con análisis estructurado.
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
  }, [openAct?.scene]);

  const userCount = engine.userTurnsCount;
  const phaseIdx = Math.min(userCount, ACT_LABELS.length - 1);
  const meterValue = engine.isCompleted ? 1 : Math.min(0.92, userCount * 0.22);

  const isDebrief = openAct?.isDebrief;

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
      hudSlot={
        <PhaseHUD
          engine={session.engine}
          kicker="Escena"
          phaseLabels={[...ACT_LABELS]}
          currentPhase={phaseIdx}
          meterLabel="Avance del caso"
          meterValue={meterValue}
          badge={userCount > 0 ? `Acto ${userCount}` : undefined}
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
              topicId={session.topic_ids[0]}
            />
          ) : openAct?.scene ? (
            <article
              key={openAct.index}
              className="rounded-3xl border bg-white/90 p-7 md:p-8 engine-card-rise shadow-soft"
              style={{
                borderColor: hexToRgba(theme.accent, 0.22),
                boxShadow: `0 12px 36px ${hexToRgba(theme.accent, 0.10)}`,
              }}
            >
              <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
                    style={{
                      background: hexToRgba(theme.accent, 0.12),
                      color: theme.accent,
                      border: `1px solid ${hexToRgba(theme.accent, 0.28)}`,
                    }}
                  >
                    <Drama className="w-4 h-4" strokeWidth={1.7} />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: theme.accent }}
                    >
                      {isDebrief
                        ? "Debrief · análisis del caso"
                        : `Acto ${openAct.index + 1} · ${ACT_LABELS[Math.min(openAct.index, ACT_LABELS.length - 1)]}`}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground italic">
                      {isDebrief ? session.persona ?? "Personaje" : `Voz: ${session.persona ?? "el personaje"}`}
                    </span>
                  </div>
                </div>
                <NovaCoachRibbon
                  engine={session.engine}
                  label={isDebrief ? "Saliendo del rol" : "Nova en escena"}
                />
              </header>

              <div
                className="rounded-2xl border p-5 bg-amber-50/40"
                style={{ borderColor: hexToRgba(theme.accent, 0.18) }}
              >
                <p className="text-[16px] leading-relaxed text-foreground/90 whitespace-pre-wrap italic">
                  {stripJson(openAct.scene)}
                </p>
              </div>

              {!isDebrief && (
                <>
                  <div className="mt-6">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
                      style={{ color: theme.accent }}
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
                            className="rounded-xl border py-3 px-3 text-[12px] font-medium transition-all"
                            style={
                              active
                                ? {
                                    borderColor: theme.accent,
                                    background: hexToRgba(theme.accent, 0.08),
                                    color: theme.accent,
                                  }
                                : {
                                    borderColor: "rgba(0,0,0,0.08)",
                                    background: "rgba(255,255,255,0.7)",
                                    color: "rgb(40 40 40 / 0.85)",
                                  }
                            }
                          >
                            {POSTURE_LABELS[k].label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.16em]"
                      style={{ color: theme.accent }}
                    >
                      Tu jugada — qué dices o haces exactamente
                    </span>
                    <Textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder="Habla como en la escena real. No expliques teoría."
                      rows={4}
                      disabled={engine.status !== "idle"}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          void submitMove();
                        }
                      }}
                      className="bg-white/95"
                    />
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        onClick={submitMove}
                        disabled={!draft.trim() || engine.status !== "idle"}
                        className="text-white gap-1.5"
                        style={{ background: theme.coachGradient }}
                      >
                        {engine.status === "streaming" ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.7} />
                            Personaje reacciona…
                          </>
                        ) : (
                          <>
                            Ejecutar jugada
                            <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.7} />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </article>
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

        <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
          <header className="flex items-center gap-2">
            <ScrollText className="w-4 h-4" strokeWidth={1.6} style={{ color: theme.accent }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
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
              {acts.map((a) => (
                <li
                  key={a.index}
                  className="rounded-xl border bg-white/85 p-3"
                  style={{ borderColor: hexToRgba(theme.accent, 0.14) }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
                      style={{ color: theme.accent }}
                    >
                      Acto {a.index + 1}
                    </span>
                    {a.posture && (
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-foreground/60">
                        {POSTURE_LABELS[a.posture].label}
                      </span>
                    )}
                  </div>
                  {a.scene && (
                    <p className="text-[12px] text-foreground/85 italic line-clamp-2 mb-1.5">
                      {stripJson(a.scene)}
                    </p>
                  )}
                  {a.userMove && (
                    <p className="text-[11.5px] text-muted-foreground line-clamp-2 border-l-2 pl-2 border-black/[0.06]">
                      {extractMoveBody(a.userMove)}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </SessionShell>
  );
}

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
          <Briefcase className="w-4 h-4" strokeWidth={1.6} style={{ color: accent }} />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            Briefing del caso
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1">
          <Clock className="w-3 h-3" strokeWidth={1.7} />
          Tiempo libre
        </span>
      </header>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground block mb-1">
            Personaje
          </span>
          <p className="text-[13.5px] text-foreground/90">
            {persona ?? "Personaje sin definir"}
          </p>
        </div>
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground block mb-1">
            Temas que aplicas
          </span>
          <p className="text-[13.5px] text-foreground/90">
            {topics.map((t) => t.title).join(" · ")}
          </p>
        </div>
      </div>
      {scenario && (
        <div className="mt-4 pt-4 border-t border-black/[0.06]">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground block mb-1">
            Situación
          </span>
          <p className="text-[13.5px] text-foreground/85 leading-relaxed">{scenario}</p>
        </div>
      )}
    </div>
  );
}

interface Act {
  index: number;
  scene?: string;
  userMove?: string;
  posture?: DecisionPosture;
  isDebrief: boolean;
}

function buildActs(turns: SparkSessionTurn[]): Act[] {
  const out: Act[] = [];
  let idx = 0;
  let pendingScene: string | undefined;
  for (const t of turns) {
    if (t.role === "assistant") {
      if (pendingScene !== undefined) {
        out.push({ index: idx, scene: pendingScene, isDebrief: detectDebrief(pendingScene) });
        idx += 1;
      }
      pendingScene = t.content;
    } else {
      const userMove = t.content;
      const posture = inferPosture(userMove);
      out.push({
        index: idx,
        scene: pendingScene,
        userMove,
        posture,
        isDebrief: pendingScene ? detectDebrief(pendingScene) : false,
      });
      pendingScene = undefined;
      idx += 1;
    }
  }
  if (pendingScene !== undefined) {
    out.push({
      index: idx,
      scene: pendingScene,
      isDebrief: detectDebrief(pendingScene),
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

function detectDebrief(content: string) {
  return /saliendo de personaje|fuera de personaje|debrief/i.test(content);
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
