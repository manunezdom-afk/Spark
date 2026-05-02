"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  ShieldHalf,
  Sword,
  Target,
  Zap,
  ChevronRight,
  History,
  ListChecks,
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

const PHASES = ["Postura", "Embate I", "Embate II", "Veredicto"] as const;

type DefenseTactic = "defender" | "matizar" | "conceder" | "contraatacar";

const TACTIC_LABELS: Record<DefenseTactic, { label: string; verb: string; icon: typeof Sword }> = {
  defender: { label: "Defender", verb: "Sostengo mi posición", icon: ShieldHalf },
  matizar: { label: "Matizar", verb: "Acepto en parte, pero matizo", icon: Target },
  conceder: { label: "Conceder", verb: "Concedo este punto", icon: History },
  contraatacar: { label: "Contraatacar", verb: "Te respondo con mi propio ataque", icon: Sword },
};

/**
 * Defender postura — ya no es chat. Es un duelo por rondas.
 *
 * Flujo:
 *  - Postura (round 0): pantalla pide al usuario que escriba SU postura.
 *  - Round 1+: tarjeta grande de "objeción" de Nova (su último turn).
 *    Debajo, el usuario escoge una táctica (defender / matizar / conceder /
 *    contraatacar) y escribe su defensa. El POST envía la táctica + texto.
 *  - Sidebar: lista de rondas pasadas con táctica usada y solidez.
 *  - Veredicto: aparece al finalizar.
 */
export function DefendPostureExperience({
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
  const [tactic, setTactic] = useState<DefenseTactic>("defender");
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const rounds = useMemo(() => buildRounds(engine.turns), [engine.turns]);

  // Postura phase = no user turn yet
  const userCount = engine.userTurnsCount;
  const isPosturePhase = userCount === 0;

  // Current "open" round = the last assistant turn whose user reply
  // hasn't arrived yet
  const openRound = rounds.find((r) => r.tactic === undefined);

  useEffect(() => {
    setDraft("");
    setTactic("defender");
    if (textareaRef.current) textareaRef.current.focus();
  }, [openRound?.objection]);

  const phaseIdx = Math.min(userCount, PHASES.length - 1);
  const meterValue = userCount === 0 ? 0 : Math.min(1, 0.25 + userCount * 0.22);

  async function submitPosture() {
    if (!draft.trim() || engine.status !== "idle") return;
    const text = `Mi postura: ${draft.trim()}.\n\nEstoy listo para defenderla.`;
    setDraft("");
    await engine.send(text);
  }

  async function submitDefense() {
    if (!draft.trim() || engine.status !== "idle") return;
    const text = `[${TACTIC_LABELS[tactic].label}] ${TACTIC_LABELS[tactic].verb}.\n\n${draft.trim()}`;
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
          kicker="Duelo"
          phaseLabels={[...PHASES]}
          currentPhase={phaseIdx}
          meterLabel="Solidez argumental"
          meterValue={engine.isCompleted ? Math.max(meterValue, 0.85) : meterValue}
          badge={userCount > 0 ? `Ronda ${userCount}` : undefined}
        />
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 px-5 md:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-5 min-w-0">
          {engine.completionScore ? (
            <CompletionPanel
              score={engine.completionScore}
              topicId={session.topic_ids[0]}
            />
          ) : isPosturePhase ? (
            <article
              className="rounded-3xl border bg-white/90 p-7 md:p-9 engine-card-rise shadow-soft"
              style={{
                borderColor: hexToRgba(theme.accent, 0.22),
                boxShadow: `0 12px 36px ${hexToRgba(theme.accent, 0.08)}`,
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
                    <ShieldHalf className="w-4 h-4" strokeWidth={1.7} />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: theme.accent }}
                    >
                      Antes de empezar · declara tu postura
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      Una sola línea. Específica. Defendible.
                    </span>
                  </div>
                </div>
                <NovaCoachRibbon engine={session.engine} label="Nova preparada para atacar" />
              </header>

              {rounds[0]?.objection && (
                <div
                  className="rounded-2xl border p-4 mb-5 bg-white/85"
                  style={{ borderColor: hexToRgba(theme.accent, 0.16) }}
                >
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.16em] mb-2"
                    style={{ color: theme.accent }}
                  >
                    Pedido de Nova
                  </div>
                  <p className="text-[14px] text-foreground/85 whitespace-pre-wrap">
                    {stripJson(rounds[0].objection)}
                  </p>
                </div>
              )}

              <Textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ej.: Las redes sociales son responsables de la polarización política."
                rows={3}
                disabled={engine.status !== "idle"}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void submitPosture();
                  }
                }}
              />
              <div className="mt-4 flex justify-end">
                <Button
                  size="sm"
                  onClick={submitPosture}
                  disabled={!draft.trim() || engine.status !== "idle"}
                  className="text-white gap-1.5"
                  style={{ background: theme.coachGradient }}
                >
                  Sostener esta postura
                  <Zap className="w-3.5 h-3.5" strokeWidth={1.7} />
                </Button>
              </div>
            </article>
          ) : openRound?.objection ? (
            <article
              key={openRound.index}
              className="rounded-3xl border bg-white/90 p-7 md:p-9 engine-card-rise"
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
                    <Sword className="w-4 h-4" strokeWidth={1.7} />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: theme.accent }}
                    >
                      Ronda {openRound.index} · Objeción de Nova
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      Elige cómo respondes. Una jugada por ronda.
                    </span>
                  </div>
                </div>
              </header>

              <div
                className="relative rounded-2xl border p-5 bg-rose-50/40"
                style={{ borderColor: hexToRgba(theme.accent, 0.18) }}
              >
                <div
                  className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md"
                  style={{
                    background: `linear-gradient(180deg, ${theme.accent}, transparent)`,
                  }}
                />
                <p className="text-[16px] leading-relaxed text-foreground/90 pl-3 whitespace-pre-wrap">
                  {stripJson(openRound.objection)}
                </p>
              </div>

              <div className="mt-6">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
                  style={{ color: theme.accent }}
                >
                  Tu táctica
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(TACTIC_LABELS) as DefenseTactic[]).map((k) => {
                    const Icon = TACTIC_LABELS[k].icon;
                    const active = tactic === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setTactic(k)}
                        className="flex flex-col items-center justify-center gap-1.5 rounded-xl border py-3 text-[12px] font-medium transition-all"
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
                        <Icon className="w-4 h-4" strokeWidth={1.6} />
                        {TACTIC_LABELS[k].label}
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
                  Tu defensa
                </span>
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    tactic === "conceder"
                      ? "Reconoce el punto y explica el ajuste de tu postura."
                      : tactic === "contraatacar"
                        ? "Atacá la premisa de Nova con un contraejemplo concreto."
                        : "Cita evidencia. Sé específico. No esquives."
                  }
                  rows={4}
                  disabled={engine.status !== "idle"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submitDefense();
                    }
                  }}
                  className="bg-white/95"
                />
                <div className="flex justify-end mt-1">
                  <Button
                    size="sm"
                    onClick={submitDefense}
                    disabled={!draft.trim() || engine.status !== "idle"}
                    className="text-white gap-1.5"
                    style={{ background: theme.coachGradient }}
                  >
                    {engine.status === "streaming" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.7} />
                        Defendiendo…
                      </>
                    ) : (
                      <>
                        Lanzar defensa
                        <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.7} />
                      </>
                    )}
                  </Button>
                </div>
              </div>
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
              Nova analizando tu última defensa…
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
          <header className="flex items-center gap-2">
            <ListChecks className="w-4 h-4" strokeWidth={1.6} style={{ color: theme.accent }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
            >
              Historial del duelo
            </span>
          </header>
          {rounds.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Cada objeción de Nova queda registrada aquí con tu táctica.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {rounds.map((r) => (
                <li
                  key={r.index}
                  className="rounded-xl border bg-white/85 p-3"
                  style={{ borderColor: hexToRgba(theme.accent, 0.14) }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
                      style={{ color: theme.accent }}
                    >
                      {r.index === 0 ? "Postura" : `Ronda ${r.index}`}
                    </span>
                    {r.tactic && (
                      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-foreground/60">
                        {TACTIC_LABELS[r.tactic]?.label ?? r.tactic}
                      </span>
                    )}
                  </div>
                  <p className="text-[12.5px] text-foreground/85 line-clamp-3">
                    {r.objection ? stripJson(r.objection) : r.userText}
                  </p>
                  {r.userText && r.objection && (
                    <p className="text-[11.5px] text-muted-foreground line-clamp-2 mt-1.5 border-l border-black/[0.06] pl-2 italic">
                      Tu defensa: {extractDefenseBody(r.userText)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </SessionShell>
  );
}

interface Round {
  index: number; // 0 = postura, 1+ = round
  objection?: string; // assistant content
  userText?: string;
  tactic?: DefenseTactic;
}

function buildRounds(turns: SparkSessionTurn[]): Round[] {
  const out: Round[] = [];
  let pendingObjection: string | undefined;
  let roundNum = 0;
  for (const t of turns) {
    if (t.role === "assistant") {
      if (pendingObjection !== undefined) {
        out.push({ index: roundNum, objection: pendingObjection });
      }
      pendingObjection = t.content;
    } else {
      const userText = t.content;
      const tactic = inferTactic(userText);
      out.push({
        index: roundNum,
        objection: pendingObjection,
        userText,
        tactic,
      });
      pendingObjection = undefined;
      roundNum += 1;
    }
  }
  if (pendingObjection !== undefined) {
    out.push({ index: roundNum, objection: pendingObjection });
  }
  return out;
}

function inferTactic(text: string): DefenseTactic | undefined {
  const m = text.match(/^\[(Defender|Matizar|Conceder|Contraatacar)\]/i);
  if (!m) return undefined;
  const k = m[1].toLowerCase();
  if (k === "defender") return "defender";
  if (k === "matizar") return "matizar";
  if (k === "conceder") return "conceder";
  if (k === "contraatacar") return "contraatacar";
  return undefined;
}

function extractDefenseBody(text: string): string {
  const stripped = text.replace(/^\[(Defender|Matizar|Conceder|Contraatacar)\][^.\n]*\.?\n*/i, "");
  return stripped.trim().slice(0, 100);
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
