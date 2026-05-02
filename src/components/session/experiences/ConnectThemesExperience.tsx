"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Network,
  Spline,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Wand2,
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
  GraphNodePayload,
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

const PHASES = ["Mapa", "Hipótesis", "Validación", "Cierre"] as const;
type Verdict = "valida" | "matiza" | "refuta" | "extiende";

const VERDICT_LABELS: Record<Verdict, { label: string; verb: string; tone: string }> = {
  valida: { label: "Valida", verb: "Funciona como dice Nova", tone: "emerald" },
  matiza: { label: "Matiza", verb: "Funciona, pero con un matiz importante", tone: "amber" },
  refuta: { label: "Refuta", verb: "Se rompe — explico dónde", tone: "rose" },
  extiende: { label: "Extiende", verb: "Sumo otra conexión derivada", tone: "violet" },
};

/**
 * Conectar temas — ya no es chat. Es la construcción de un mapa.
 *
 * Layout:
 *  - Topics como nodos en una grilla / red, no como un timeline.
 *  - Tarjeta central: la PROPUESTA actual de Nova (no su texto entero, solo
 *    la forma "X conecta con Y porque Z").
 *  - Acciones: validar / matizar / refutar / extender — un solo click +
 *    breve justificación.
 *  - Sidebar: lista de conexiones aceptadas y refutadas (puentes
 *    conceptuales).
 *  - Cuando llega el payload graph_node, se renderiza el grafo final.
 */
export function ConnectThemesExperience({
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
  const [verdict, setVerdict] = useState<Verdict>("valida");
  const [draft, setDraft] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const proposals = useMemo(() => buildProposals(engine.turns), [engine.turns]);
  const openProposal = proposals.find((p) => !p.verdict);

  // Final graph payload (if Nova has emitted one)
  const finalGraph = useMemo<GraphNodePayload | null>(() => {
    for (let i = engine.turns.length - 1; i >= 0; i--) {
      const t = engine.turns[i];
      if (t.role === "assistant" && t.payload?.type === "graph_node") {
        return t.payload;
      }
    }
    return null;
  }, [engine.turns]);

  useEffect(() => {
    setDraft("");
    setVerdict("valida");
    if (textareaRef.current) textareaRef.current.focus();
  }, [openProposal?.text]);

  const userCount = engine.userTurnsCount;
  const validatedCount = proposals.filter(
    (p) => p.verdict === "valida" || p.verdict === "extiende",
  ).length;
  const phaseIdx = userCount === 0 ? 0 : Math.min(PHASES.length - 1, 1 + Math.min(2, validatedCount));
  const meterValue = engine.isCompleted
    ? 1
    : Math.min(1, validatedCount / 3 + 0.05);

  async function submitVerdict() {
    if (engine.status !== "idle") return;
    if (!draft.trim() && verdict !== "valida") return; // need rationale unless plain valida
    const tag = `[${VERDICT_LABELS[verdict].label}]`;
    const body = draft.trim() || VERDICT_LABELS[verdict].verb;
    const text = `${tag} ${body}`;
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
          kicker="Síntesis"
          phaseLabels={[...PHASES]}
          currentPhase={phaseIdx}
          meterLabel="Conexiones validadas"
          meterValue={meterValue}
          badge={validatedCount > 0 ? `${validatedCount} puentes` : undefined}
        />
      }
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 px-5 md:px-8 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-col gap-5 min-w-0">
          {/* Always-visible topic constellation */}
          <TopicConstellation topics={topics} accent={theme.accent} />

          {engine.completionScore ? (
            <CompletionPanel
              score={engine.completionScore}
              topicId={session.topic_ids[0]}
            />
          ) : openProposal ? (
            <article
              key={openProposal.text}
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
                    <Spline className="w-4 h-4" strokeWidth={1.7} />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: theme.accent }}
                    >
                      Conexión #{validatedCount + 1}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      Valida o mata. No hay conexiones genéricas aceptadas.
                    </span>
                  </div>
                </div>
                <NovaCoachRibbon engine={session.engine} label="Nova propone" />
              </header>

              <div
                className="rounded-2xl border p-5 bg-white/95"
                style={{ borderColor: hexToRgba(theme.accent, 0.16) }}
              >
                <p className="text-[16px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {openProposal.text}
                </p>
              </div>

              <div className="mt-6">
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
                  style={{ color: theme.accent }}
                >
                  Tu veredicto
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.keys(VERDICT_LABELS) as Verdict[]).map((k) => {
                    const Icon =
                      k === "valida"
                        ? ThumbsUp
                        : k === "refuta"
                          ? ThumbsDown
                          : k === "matiza"
                            ? Spline
                            : Wand2;
                    const active = verdict === k;
                    return (
                      <button
                        key={k}
                        onClick={() => setVerdict(k)}
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
                        {VERDICT_LABELS[k].label}
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
                  Justificación (opcional si validas, requerida si matizas o refutas)
                </span>
                <Textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    verdict === "refuta"
                      ? "¿Dónde se rompe la conexión? Da el contraejemplo."
                      : verdict === "matiza"
                        ? "¿Qué condición la hace verdadera? ¿Cuándo falla?"
                        : verdict === "extiende"
                          ? "¿Qué otra conexión deriva de esta?"
                          : "Cuenta brevemente qué te convenció."
                  }
                  rows={3}
                  disabled={engine.status !== "idle"}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void submitVerdict();
                    }
                  }}
                  className="bg-white/95"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={submitVerdict}
                    disabled={
                      engine.status !== "idle" ||
                      (verdict !== "valida" && !draft.trim())
                    }
                    className="text-white gap-1.5"
                    style={{ background: theme.coachGradient }}
                  >
                    {engine.status === "streaming" ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.7} />
                        Tendiendo el puente…
                      </>
                    ) : (
                      <>
                        Sellar veredicto
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.7} />
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
              Nova está mapeando los temas…
            </div>
          )}

          {finalGraph && finalGraph.edges.length > 0 && (
            <FinalGraph payload={finalGraph} accent={theme.accent} />
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
          <header className="flex items-center gap-2">
            <Network className="w-4 h-4" strokeWidth={1.6} style={{ color: theme.accent }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
            >
              Puentes conceptuales
            </span>
          </header>
          {proposals.length === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Nova lanzará una conexión por ronda. Tus veredictos forman el mapa final.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {proposals.map((p, i) => (
                <li
                  key={i}
                  className="rounded-xl border bg-white/85 p-3"
                  style={{ borderColor: hexToRgba(theme.accent, 0.14) }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span
                      className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
                      style={{ color: theme.accent }}
                    >
                      Conexión #{i + 1}
                    </span>
                    {p.verdict ? (
                      <span
                        className="font-mono text-[9.5px] uppercase tracking-[0.14em]"
                        style={{
                          color:
                            p.verdict === "valida" || p.verdict === "extiende"
                              ? "rgb(21, 128, 61)"
                              : p.verdict === "matiza"
                                ? "rgb(180, 83, 9)"
                                : "rgb(190, 18, 60)",
                        }}
                      >
                        {VERDICT_LABELS[p.verdict].label}
                      </span>
                    ) : (
                      <span className="font-mono text-[9.5px] text-muted-foreground uppercase">
                        Pendiente
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-foreground/85 line-clamp-3">
                    {p.text}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </SessionShell>
  );
}

function TopicConstellation({
  topics,
  accent,
}: {
  topics: SparkTopic[];
  accent: string;
}) {
  return (
    <div
      className="rounded-3xl border bg-white/70 p-5"
      style={{ borderColor: hexToRgba(accent, 0.16) }}
    >
      <header className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5" strokeWidth={1.6} style={{ color: accent }} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          Temas en juego ({topics.length})
        </span>
      </header>
      <div className="flex flex-wrap gap-2">
        {topics.map((t, i) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white text-[12px] font-medium"
            style={{
              borderColor: hexToRgba(accent, 0.28),
              boxShadow: `0 0 0 4px ${hexToRgba(accent, 0.04)}`,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: accent, opacity: 0.4 + 0.6 * (i / Math.max(1, topics.length - 1)) }}
            />
            {t.title}
          </span>
        ))}
      </div>
    </div>
  );
}

function FinalGraph({
  payload,
  accent,
}: {
  payload: GraphNodePayload;
  accent: string;
}) {
  return (
    <div
      className="rounded-3xl border p-6 bg-white/90"
      style={{ borderColor: hexToRgba(accent, 0.22) }}
    >
      <header className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4" strokeWidth={1.6} style={{ color: accent }} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          Mapa final · {payload.nodes.length} nodos · {payload.edges.length} relaciones
        </span>
      </header>
      <ul className="flex flex-col gap-2">
        {payload.edges.map((e, i) => (
          <li
            key={i}
            className="flex items-center gap-2 text-[13px] flex-wrap p-3 rounded-xl border bg-white/60"
            style={{ borderColor: hexToRgba(accent, 0.14) }}
          >
            <span className="font-medium text-foreground">{e.source}</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.7} style={{ color: accent }} />
            <span
              className="px-2 py-0.5 rounded-full text-[11px] italic"
              style={{
                background: hexToRgba(accent, 0.10),
                color: accent,
              }}
            >
              {e.relationship}
            </span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.7} style={{ color: accent }} />
            <span className="font-medium text-foreground">{e.target}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Proposal {
  text: string; // assistant content (cleaned)
  verdict?: Verdict;
}

function buildProposals(turns: SparkSessionTurn[]): Proposal[] {
  const out: Proposal[] = [];
  let pending: string | undefined;
  for (const t of turns) {
    if (t.role === "assistant") {
      if (pending !== undefined) {
        out.push({ text: pending });
      }
      pending = stripJson(t.content);
    } else if (t.role === "user") {
      const verdict = inferVerdict(t.content);
      out.push({ text: pending ?? "(propuesta inicial)", verdict });
      pending = undefined;
    }
  }
  if (pending !== undefined) out.push({ text: pending });
  return out;
}

function inferVerdict(text: string): Verdict | undefined {
  const m = text.match(/^\[(Valida|Matiza|Refuta|Extiende)\]/i);
  if (!m) return undefined;
  const k = m[1].toLowerCase();
  if (k === "valida") return "valida";
  if (k === "matiza") return "matiza";
  if (k === "refuta") return "refuta";
  if (k === "extiende") return "extiende";
  return undefined;
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
