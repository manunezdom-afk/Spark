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
  FlaskConical,
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
  BridgeProposalPayload,
  GraphNodePayload,
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

const PHASES = ["Mapa", "Hipótesis", "Validación", "Cierre"] as const;
type Verdict = "valida" | "matiza" | "refuta" | "extiende";

const VERDICT_LABELS: Record<
  Verdict,
  { label: string; verb: string; placeholder: string }
> = {
  valida: {
    label: "Valida",
    verb: "Funciona como dice Nova",
    placeholder: "Cuenta brevemente qué te convenció.",
  },
  matiza: {
    label: "Matiza",
    verb: "Funciona, pero con un matiz importante",
    placeholder: "¿Qué condición la hace verdadera? ¿Cuándo falla?",
  },
  refuta: {
    label: "Refuta",
    verb: "Se rompe — explico dónde",
    placeholder: "¿Dónde se rompe la conexión? Da el contraejemplo.",
  },
  extiende: {
    label: "Extiende",
    verb: "Sumo otra conexión derivada",
    placeholder: "¿Qué otra conexión deriva de esta?",
  },
};

const QUALITY_TONES: Record<
  NonNullable<BridgeProposalPayload["prior_quality"]>,
  { fg: string; bg: string }
> = {
  superficial: { fg: "rgb(146 64 14)", bg: "rgb(254 243 199 / 0.6)" },
  sólida: { fg: "rgb(5 150 105)", bg: "rgb(209 250 229 / 0.6)" },
  profunda: { fg: "rgb(67 56 202)", bg: "rgb(224 231 255 / 0.6)" },
  forzada: { fg: "rgb(190 18 60)", bg: "rgb(254 226 226 / 0.6)" },
};

interface Proposal {
  index: number;
  /** Texto crudo del turn (fallback si no hay payload). */
  rawText?: string;
  payload: BridgeProposalPayload | null;
  verdict?: Verdict;
  /** Justificación del usuario tras el veredicto. */
  userRationale?: string;
}

/**
 * Conectar temas — construcción de un mapa conceptual.
 *
 * Mecánica:
 *   - Cada turno de Nova emite payload `bridge_proposal` con concept_a,
 *     concept_b, mechanism, prediction, y la calidad de la propuesta
 *     anterior (tras el veredicto del usuario).
 *   - El usuario clasifica con 4 botones (valida/matiza/refuta/extiende)
 *     y opcionalmente justifica.
 *   - El sidebar muestra los puentes con su calidad real, no solo
 *     "Pendiente / Validado".
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
  const lastClosed = [...proposals].reverse().find((p) => p.verdict !== undefined);

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
  }, [openProposal?.payload?.proposal_index, openProposal?.rawText]);

  const userCount = engine.userTurnsCount;
  const validatedCount = proposals.filter(
    (p) => p.verdict === "valida" || p.verdict === "extiende",
  ).length;
  const phaseIdx =
    userCount === 0 ? 0 : Math.min(PHASES.length - 1, 1 + Math.min(2, validatedCount));
  const meterValue = engine.isCompleted
    ? 1
    : Math.min(1, validatedCount / 3 + 0.05);

  const isOpeningMap =
    openProposal?.payload?.proposal_index === 0 || // explicit opening
    (openProposal && !openProposal.payload?.concept_a && !openProposal.rawText?.includes("→"));

  async function submitVerdict() {
    if (engine.status !== "idle") return;
    if (!draft.trim() && verdict !== "valida") return;
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
          badge={validatedCount > 0 ? `${validatedCount} puentes sólidos` : undefined}
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
          ) : openProposal && isOpeningMap ? (
            <OpeningMapPanel
              text={openProposal.payload?.mechanism || openProposal.rawText || ""}
              accent={theme.accent}
              status={engine.status}
            />
          ) : openProposal ? (
            <ActiveProposalPanel
              proposal={openProposal}
              priorQuality={lastClosed?.payload?.prior_quality ?? null}
              priorIndex={lastClosed?.index ?? null}
              verdict={verdict}
              setVerdict={setVerdict}
              draft={draft}
              setDraft={setDraft}
              onSubmit={submitVerdict}
              status={engine.status}
              accent={theme.accent}
              gradient={theme.coachGradient}
              validatedCount={validatedCount}
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
              Nova está mapeando los temas…
            </div>
          )}

          {finalGraph && finalGraph.edges.length > 0 && (
            <FinalGraph payload={finalGraph} accent={theme.accent} />
          )}
        </div>

        <BridgesPanel proposals={proposals} accent={theme.accent} />
      </div>
    </SessionShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Opening map: just shows the topic list announcement, no inputs.

function OpeningMapPanel({
  text,
  accent,
  status,
}: {
  text: string;
  accent: string;
  status: string;
}) {
  return (
    <article
      className="rounded-3xl border bg-white/85 p-7 md:p-8 shadow-soft"
      style={{
        borderColor: hexToRgba(accent, 0.22),
        boxShadow: `0 12px 36px ${hexToRgba(accent, 0.08)}`,
      }}
    >
      <header className="flex items-center gap-2 mb-4">
        <Network className="w-4 h-4" strokeWidth={1.7} style={{ color: accent }} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          Apertura del mapa
        </span>
      </header>
      <p className="text-[15.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
        {text || "Listando los temas y preparando las conexiones…"}
      </p>
      {status === "streaming" && (
        <div className="mt-4">
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.7} style={{ color: accent }} />
        </div>
      )}
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Active proposal panel — concept_a → mechanism → concept_b flow.

function ActiveProposalPanel({
  proposal,
  priorQuality,
  priorIndex,
  verdict,
  setVerdict,
  draft,
  setDraft,
  onSubmit,
  status,
  accent,
  gradient,
  validatedCount,
  textareaRef,
}: {
  proposal: Proposal;
  priorQuality: BridgeProposalPayload["prior_quality"] | null;
  priorIndex: number | null;
  verdict: Verdict;
  setVerdict: (v: Verdict) => void;
  draft: string;
  setDraft: (s: string) => void;
  onSubmit: () => void;
  status: string;
  accent: string;
  gradient: string;
  validatedCount: number;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const payload = proposal.payload;
  const conceptA = payload?.concept_a ?? null;
  const conceptB = payload?.concept_b ?? null;
  const mechanism = payload?.mechanism ?? null;
  const prediction = payload?.prediction ?? null;
  const hasStructured = !!(conceptA && conceptB && mechanism);

  return (
    <article
      key={proposal.index}
      className="rounded-3xl border bg-white/90 p-7 md:p-8 engine-card-rise shadow-soft"
      style={{
        borderColor: hexToRgba(accent, 0.22),
        boxShadow: `0 12px 36px ${hexToRgba(accent, 0.10)}`,
      }}
    >
      <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
            style={{
              background: hexToRgba(accent, 0.12),
              color: accent,
              border: `1px solid ${hexToRgba(accent, 0.28)}`,
            }}
          >
            <Spline className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col leading-tight">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Conexión #{validatedCount + 1}
            </span>
            <span className="text-[11.5px] text-muted-foreground">
              Valida o mata. No hay conexiones genéricas aceptadas.
            </span>
          </div>
        </div>
        {priorQuality !== null && priorQuality !== undefined && priorIndex !== null ? (
          <QualityChip
            quality={priorQuality}
            index={priorIndex}
            accent={accent}
          />
        ) : (
          <NovaCoachRibbon engine="bridge_builder" label="Nova propone" />
        )}
      </header>

      {hasStructured ? (
        <StructuredBridgeView
          conceptA={conceptA}
          conceptB={conceptB}
          mechanism={mechanism}
          prediction={prediction}
          accent={accent}
        />
      ) : (
        <div
          className="rounded-2xl border p-5 bg-white/95"
          style={{ borderColor: hexToRgba(accent, 0.16) }}
        >
          <p className="text-[16px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
            {proposal.rawText || mechanism || ""}
          </p>
        </div>
      )}

      <div className="mt-6">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
          style={{ color: accent }}
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
                        borderColor: accent,
                        background: hexToRgba(accent, 0.08),
                        color: accent,
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
          style={{ color: accent }}
        >
          Justificación {verdict === "valida" ? "(opcional)" : "(requerida)"}
        </span>
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={VERDICT_LABELS[verdict].placeholder}
          rows={3}
          disabled={status !== "idle"}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit();
            }
          }}
          className="bg-white/95 resize-none"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={
              status !== "idle" || (verdict !== "valida" && !draft.trim())
            }
            className="text-white gap-1.5"
            style={{ background: gradient }}
          >
            {status === "streaming" ? (
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
  );
}

// ─────────────────────────────────────────────────────────────
// Visual: concept_a → [mechanism] → concept_b + prediction.

function StructuredBridgeView({
  conceptA,
  conceptB,
  mechanism,
  prediction,
  accent,
}: {
  conceptA: string;
  conceptB: string;
  mechanism: string;
  prediction: string | null;
  accent: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        <ConceptCard label="Concepto A" name={conceptA} accent={accent} />
        <div className="hidden md:flex flex-col items-center justify-center px-2">
          <ArrowRight
            className="w-5 h-5"
            strokeWidth={1.7}
            style={{ color: accent }}
          />
        </div>
        <div className="md:hidden flex justify-center">
          <ArrowRight
            className="w-5 h-5 rotate-90"
            strokeWidth={1.7}
            style={{ color: accent }}
          />
        </div>
        <ConceptCard label="Concepto B" name={conceptB} accent={accent} />
      </div>
      <div
        className="rounded-2xl border p-4"
        style={{
          background: hexToRgba(accent, 0.05),
          borderColor: hexToRgba(accent, 0.22),
        }}
      >
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.16em] block mb-1.5"
          style={{ color: accent }}
        >
          Mecanismo
        </span>
        <p className="text-[14.5px] leading-relaxed text-foreground/90">{mechanism}</p>
      </div>
      {prediction && (
        <div
          className="rounded-2xl border p-4 flex gap-3"
          style={{
            background: "rgb(254 252 232 / 0.5)",
            borderColor: "rgba(245, 158, 11, 0.25)",
          }}
        >
          <FlaskConical
            className="w-4 h-4 shrink-0 mt-0.5 text-amber-700"
            strokeWidth={1.7}
          />
          <div>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] block mb-1 text-amber-700">
              Prueba esto
            </span>
            <p className="text-[13.5px] leading-relaxed text-foreground/85">
              {prediction}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ConceptCard({
  label,
  name,
  accent,
}: {
  label: string;
  name: string;
  accent: string;
}) {
  return (
    <div
      className="rounded-2xl border p-4 bg-white/95 flex flex-col items-center justify-center text-center min-h-[88px]"
      style={{
        borderColor: hexToRgba(accent, 0.32),
        boxShadow: `0 0 0 4px ${hexToRgba(accent, 0.05)}`,
      }}
    >
      <span
        className="font-mono text-[9.5px] uppercase tracking-[0.16em] mb-1"
        style={{ color: accent, opacity: 0.75 }}
      >
        {label}
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground leading-tight">
        {name}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Quality chip: shows how Nova rated the user's prior verdict.

function QualityChip({
  quality,
  index,
  accent,
}: {
  quality: NonNullable<BridgeProposalPayload["prior_quality"]>;
  index: number;
  accent: string;
}) {
  const tone = QUALITY_TONES[quality];
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
      style={{
        background: tone.bg,
        borderColor: hexToRgba(accent, 0.18),
      }}
    >
      <Sparkles
        className="w-3 h-3"
        strokeWidth={1.7}
        style={{ color: tone.fg }}
      />
      <span
        className="font-mono text-[10px] uppercase tracking-[0.14em]"
        style={{ color: tone.fg }}
      >
        Conexión #{index + 1} · {quality}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Topic constellation (always visible at the top).

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
              style={{
                background: accent,
                opacity: 0.4 + 0.6 * (i / Math.max(1, topics.length - 1)),
              }}
            />
            {t.title}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sidebar: bridges with quality.

function BridgesPanel({
  proposals,
  accent,
}: {
  proposals: Proposal[];
  accent: string;
}) {
  return (
    <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <Network className="w-4 h-4" strokeWidth={1.6} style={{ color: accent }} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          Puentes conceptuales
        </span>
      </header>
      {proposals.length === 0 || (proposals.length === 1 && !proposals[0].verdict) ? (
        <p className="text-[12.5px] text-muted-foreground italic">
          Nova lanzará una conexión por ronda. Tus veredictos forman el mapa final.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {proposals
            .filter((p) => p.payload?.proposal_index !== 0) // skip opening
            .map((p, i) => (
              <BridgeRow key={i} proposal={p} accent={accent} />
            ))}
        </ul>
      )}
    </aside>
  );
}

function BridgeRow({ proposal, accent }: { proposal: Proposal; accent: string }) {
  const conceptA = proposal.payload?.concept_a;
  const conceptB = proposal.payload?.concept_b;
  const mechanism = proposal.payload?.mechanism;
  const verdictKey = proposal.verdict;
  const verdictLabel = verdictKey ? VERDICT_LABELS[verdictKey].label : null;

  return (
    <li
      className="rounded-xl border bg-white/85 p-3"
      style={{ borderColor: hexToRgba(accent, 0.14) }}
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
          style={{ color: accent }}
        >
          Conexión #{proposal.index}
        </span>
        {verdictLabel ? (
          <span
            className="font-mono text-[9.5px] uppercase tracking-[0.14em]"
            style={{
              color:
                verdictKey === "valida" || verdictKey === "extiende"
                  ? "rgb(21, 128, 61)"
                  : verdictKey === "matiza"
                    ? "rgb(180, 83, 9)"
                    : "rgb(190, 18, 60)",
            }}
          >
            {verdictLabel}
          </span>
        ) : (
          <span className="font-mono text-[9.5px] text-muted-foreground uppercase">
            Pendiente
          </span>
        )}
      </div>
      {conceptA && conceptB ? (
        <div className="flex items-center gap-1.5 text-[12px] flex-wrap">
          <span className="font-medium text-foreground/90">{conceptA}</span>
          <ArrowRight
            className="w-3 h-3 shrink-0"
            strokeWidth={1.7}
            style={{ color: accent }}
          />
          <span className="font-medium text-foreground/90">{conceptB}</span>
        </div>
      ) : (
        <p className="text-[12px] text-foreground/85 line-clamp-2">
          {mechanism || proposal.rawText || ""}
        </p>
      )}
      {mechanism && conceptA && conceptB && (
        <p className="text-[11.5px] text-muted-foreground line-clamp-2 italic mt-1">
          {mechanism}
        </p>
      )}
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Final graph view.

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

// ─────────────────────────────────────────────────────────────
// Build proposals from turns. Each assistant turn proposes a bridge
// (with payload); each user turn closes the previous proposal with
// a verdict + rationale. The opening map (proposal_index === 0) is
// kept in the list so we can render its announcement panel.

function buildProposals(turns: SparkSessionTurn[]): Proposal[] {
  const out: Proposal[] = [];
  let pending: Proposal | null = null;
  let proposalCounter = 0;
  for (const t of turns) {
    if (t.role === "assistant") {
      if (pending !== null) out.push(pending);
      const payload =
        t.payload?.type === "bridge_proposal"
          ? (t.payload as BridgeProposalPayload)
          : null;
      const idx = payload?.proposal_index ?? proposalCounter;
      pending = {
        index: idx,
        rawText: stripJson(t.content),
        payload,
      };
      if (payload?.proposal_index !== 0) proposalCounter += 1;
    } else if (t.role === "user") {
      if (pending !== null) {
        pending.verdict = inferVerdict(t.content);
        pending.userRationale = stripVerdictTag(t.content);
        out.push(pending);
        pending = null;
      } else if (out.length > 0) {
        out[out.length - 1].verdict = inferVerdict(t.content);
        out[out.length - 1].userRationale = stripVerdictTag(t.content);
      }
    }
  }
  if (pending !== null) out.push(pending);
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

function stripVerdictTag(text: string): string {
  return text.replace(/^\[(Valida|Matiza|Refuta|Extiende)\]\s*/i, "").trim();
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
