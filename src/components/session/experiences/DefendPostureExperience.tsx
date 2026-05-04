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
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SessionShell } from "../SessionShell";
import { PhaseHUD } from "./shared/PhaseHUD";
import { NovaThinking } from "./shared/NovaCoach";
import { CompletionPanel } from "./shared/CompletionPanel";
import { SessionLoadingShell } from "./shared/SessionLoadingShell";
import { useSessionEngine } from "../useSessionEngine";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type {
  DefendVolleyPayload,
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

const PHASES = ["Postura", "Embate I", "Embate II", "Veredicto"] as const;

type DefenseTactic = "defender" | "matizar" | "conceder" | "contraatacar";

const TACTIC_LABELS: Record<
  DefenseTactic,
  { label: string; verb: string; icon: typeof Sword; placeholder: string }
> = {
  defender: {
    label: "Defender",
    verb: "Sostengo mi posición",
    icon: ShieldHalf,
    placeholder: "Cita evidencia. Sé específico. No esquives.",
  },
  matizar: {
    label: "Matizar",
    verb: "Acepto en parte, pero matizo",
    icon: Target,
    placeholder: "Indica qué aceptas y qué no, y por qué la diferencia importa.",
  },
  conceder: {
    label: "Conceder",
    verb: "Concedo este punto",
    icon: History,
    placeholder: "Reconoce el punto y explica el ajuste de tu postura.",
  },
  contraatacar: {
    label: "Contraatacar",
    verb: "Te respondo con mi propio ataque",
    icon: Sword,
    placeholder: "Atacá la premisa de Nova con un contraejemplo concreto.",
  },
};

/**
 * Defender postura — duelo argumentativo por rondas.
 *
 * Mecánica:
 *   - Postura (round 0): el usuario declara su postura en una línea.
 *   - Embates (round 1, 2): Nova ataca el flanco más débil con
 *     payload `defend_volley` que incluye: ataque, etiqueta del
 *     flanco, pregunta de cierre, y SOLIDITY SCORE de la última
 *     defensa del usuario.
 *   - Veredicto: cierre con fortalezas/debilidades.
 *
 * La solidez argumental ya NO es decorativa: viene del payload de
 * Nova por ronda y se acumula visualmente. El historial muestra
 * cada round con su score real.
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

  const userCount = engine.userTurnsCount;
  const isPosturePhase = userCount === 0;

  const openRound = rounds.find((r) => r.tactic === undefined);
  const lastClosedRound = [...rounds].reverse().find((r) => r.tactic !== undefined);

  // Real solidity: average of all per-round scores. Nullable rounds
  // are ignored (postura sin defensa previa todavía).
  const solidityScores = rounds
    .map((r) => r.volley?.solidity_score)
    .filter((s): s is number => typeof s === "number");
  const avgSolidity =
    solidityScores.length > 0
      ? solidityScores.reduce((a, b) => a + b, 0) / solidityScores.length
      : null;
  const meterValue =
    avgSolidity !== null
      ? Math.max(0, Math.min(1, avgSolidity / 100))
      : userCount === 0
        ? 0
        : Math.min(0.4, 0.15 + userCount * 0.1);

  useEffect(() => {
    setDraft("");
    setTactic("defender");
    if (textareaRef.current) textareaRef.current.focus();
  }, [openRound?.objection]);

  // Loading guard CRÍTICO (después de TODOS los hooks): este método
  // mostraba el PosturePanel con "Pedido de Nova" vacío durante
  // varios segundos en cada nueva sesión, porque la fase Postura se
  // rendea mientras userCount===0 sin esperar al primer turno de
  // Nova. Bloqueamos el render hasta que llegue el ataque/pedido inicial.
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

  const phaseIdx = Math.min(userCount, PHASES.length - 1);

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

  const meterLabel = avgSolidity !== null ? "Solidez" : "Solidez (calc…)";

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
          meterLabel={meterLabel}
          meterValue={engine.isCompleted ? Math.max(meterValue, 0.85) : meterValue}
          badge={
            avgSolidity !== null
              ? `${Math.round(avgSolidity)}/100 · Ronda ${userCount}`
              : userCount > 0
                ? `Ronda ${userCount}`
                : undefined
          }
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
            <PosturePanel
              novaPrompt={rounds[0]?.objection}
              accent={theme.accent}
              gradient={theme.coachGradient}
              status={engine.status}
              draft={draft}
              setDraft={setDraft}
              onSubmit={submitPosture}
              textareaRef={textareaRef}
            />
          ) : openRound?.objection ? (
            <AttackPanel
              round={openRound}
              tactic={tactic}
              setTactic={setTactic}
              draft={draft}
              setDraft={setDraft}
              onSubmit={submitDefense}
              status={engine.status}
              accent={theme.accent}
              gradient={theme.coachGradient}
              priorScore={lastClosedRound?.volley?.solidity_score ?? null}
              priorNote={openRound.volley?.prior_defense_note ?? null}
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
              Nova analizando tu última defensa…
            </div>
          )}
        </div>

        <RoundsTimeline
          rounds={rounds}
          accent={theme.accent}
          avgSolidity={avgSolidity}
        />
      </div>
    </SessionShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Postura phase: collect the user's stance.

function PosturePanel({
  novaPrompt,
  accent,
  gradient,
  status,
  draft,
  setDraft,
  onSubmit,
  textareaRef,
}: {
  novaPrompt: string | undefined;
  accent: string;
  gradient: string;
  status: string;
  draft: string;
  setDraft: (s: string) => void;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <article
      className="rounded-3xl border bg-white/90 p-7 md:p-9 engine-card-rise shadow-soft"
      style={{
        borderColor: hexToRgba(accent, 0.22),
        boxShadow: `0 12px 36px ${hexToRgba(accent, 0.08)}`,
      }}
    >
      <header className="flex items-center gap-2 mb-5">
        <span
          className="inline-flex items-center justify-center w-9 h-9 rounded-xl"
          style={{
            background: hexToRgba(accent, 0.12),
            color: accent,
            border: `1px solid ${hexToRgba(accent, 0.28)}`,
          }}
        >
          <ShieldHalf className="w-4 h-4" strokeWidth={1.7} />
        </span>
        <div className="flex flex-col leading-tight">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            Antes de empezar · declara tu postura
          </span>
          <span className="text-[11.5px] text-muted-foreground">
            Una sola línea. Específica. Defendible.
          </span>
        </div>
      </header>

      {novaPrompt && (
        <div
          className="rounded-2xl border p-4 mb-5 bg-white/85"
          style={{ borderColor: hexToRgba(accent, 0.16) }}
        >
          <div
            className="font-mono text-[10px] uppercase tracking-[0.16em] mb-2"
            style={{ color: accent }}
          >
            Pedido de Nova
          </div>
          <p className="text-[14px] text-foreground/85 whitespace-pre-wrap">
            {novaPrompt}
          </p>
        </div>
      )}

      <Textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Ej.: Las redes sociales son responsables de la polarización política."
        rows={3}
        disabled={status !== "idle"}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <div className="mt-4 flex justify-end">
        <Button
          size="sm"
          onClick={onSubmit}
          disabled={!draft.trim() || status !== "idle"}
          className="text-white gap-1.5"
          style={{ background: gradient }}
        >
          Sostener esta postura
          <Zap className="w-3.5 h-3.5" strokeWidth={1.7} />
        </Button>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
// Active duel round: Nova's attack card + tactic + compact defense.

function AttackPanel({
  round,
  tactic,
  setTactic,
  draft,
  setDraft,
  onSubmit,
  status,
  accent,
  gradient,
  priorScore,
  priorNote,
  textareaRef,
}: {
  round: Round;
  tactic: DefenseTactic;
  setTactic: (t: DefenseTactic) => void;
  draft: string;
  setDraft: (s: string) => void;
  onSubmit: () => void;
  status: string;
  accent: string;
  gradient: string;
  priorScore: number | null;
  priorNote: string | null;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const attackLabel = round.volley?.attack_label ?? "Objeción de Nova";
  const closingQ = round.volley?.closing_question;
  const objection =
    round.volley?.objection ?? stripJson(round.objection ?? "");

  return (
    <article
      key={round.index}
      className="rounded-3xl border bg-white/90 p-7 md:p-9 engine-card-rise"
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
            <Sword className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col leading-tight">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              Ronda {round.index} · {attackLabel}
            </span>
            <span className="text-[11.5px] text-muted-foreground">
              Elige cómo respondes. Una jugada por ronda.
            </span>
          </div>
        </div>
        {priorScore !== null && (
          <SolidityChip score={priorScore} accent={accent} />
        )}
      </header>

      {priorNote && (
        <div
          className="mb-4 rounded-xl border bg-amber-50/40 p-3 text-[12.5px] text-foreground/80 italic flex gap-2"
          style={{ borderColor: "rgba(245, 158, 11, 0.25)" }}
        >
          <Activity className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" strokeWidth={1.7} />
          <span>
            <span className="font-medium not-italic text-amber-700">Nota de Nova: </span>
            {priorNote}
          </span>
        </div>
      )}

      <div
        className="relative rounded-2xl border p-5 bg-rose-50/40"
        style={{ borderColor: hexToRgba(accent, 0.18) }}
      >
        <div
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md"
          style={{
            background: `linear-gradient(180deg, ${accent}, transparent)`,
          }}
        />
        <p className="text-[16px] leading-relaxed text-foreground/90 pl-3 whitespace-pre-wrap">
          {objection}
        </p>
        {closingQ && (
          <p
            className="text-[13.5px] font-medium pl-3 mt-3 pt-3 border-t"
            style={{ borderColor: hexToRgba(accent, 0.18), color: accent }}
          >
            → {closingQ}
          </p>
        )}
      </div>

      <div className="mt-6">
        <span
          className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
          style={{ color: accent }}
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
                {TACTIC_LABELS[k].label}
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
          Tu defensa · {TACTIC_LABELS[tactic].verb}
        </span>
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={TACTIC_LABELS[tactic].placeholder}
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
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="text-[11px] text-muted-foreground">
            Atajo: ⌘+Enter
          </span>
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!draft.trim() || status !== "idle"}
            className="text-white gap-1.5"
            style={{ background: gradient }}
          >
            {status === "streaming" ? (
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
  );
}

// ─────────────────────────────────────────────────────────────
// Side panel: rounds timeline with REAL solidity per round.

function RoundsTimeline({
  rounds,
  accent,
  avgSolidity,
}: {
  rounds: Round[];
  accent: string;
  avgSolidity: number | null;
}) {
  return (
    <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4" strokeWidth={1.6} style={{ color: accent }} />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            Línea del duelo
          </span>
        </div>
        {avgSolidity !== null && (
          <span
            className="font-mono text-[10px] tracking-[0.14em] px-2 py-0.5 rounded-full"
            style={{
              background: hexToRgba(accent, 0.10),
              color: accent,
            }}
          >
            ø {Math.round(avgSolidity)}
          </span>
        )}
      </header>
      {rounds.length === 0 ? (
        <p className="text-[12.5px] text-muted-foreground italic">
          Cada objeción de Nova queda registrada aquí con tu táctica y solidez por ronda.
        </p>
      ) : (
        <ol className="flex flex-col gap-2.5">
          {rounds.map((r) => (
            <RoundRow key={r.index} round={r} accent={accent} />
          ))}
        </ol>
      )}
    </aside>
  );
}

function RoundRow({ round, accent }: { round: Round; accent: string }) {
  const score = round.volley?.solidity_score ?? null;
  const tacticLabel = round.tactic ? TACTIC_LABELS[round.tactic]?.label : null;
  const attackTag = round.volley?.attack_label ?? null;

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
          {round.index === 0 ? "Postura" : `Ronda ${round.index}`}
          {attackTag && round.index > 0 ? ` · ${attackTag}` : ""}
        </span>
        {tacticLabel && (
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-foreground/60">
            {tacticLabel}
          </span>
        )}
      </div>
      <p className="text-[12.5px] text-foreground/85 line-clamp-3">
        {round.volley?.objection
          ? round.volley.objection
          : round.objection
            ? stripJson(round.objection)
            : round.userText}
      </p>
      {round.userText && round.objection && (
        <p className="text-[11.5px] text-muted-foreground line-clamp-2 mt-1.5 border-l border-black/[0.06] pl-2 italic">
          Tu defensa: {extractDefenseBody(round.userText)}
        </p>
      )}
      {score !== null && (
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-1 flex-1 rounded-full overflow-hidden"
            style={{ background: hexToRgba(accent, 0.10) }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{
                width: `${Math.max(0, Math.min(100, score))}%`,
                background:
                  score >= 70
                    ? "linear-gradient(90deg, rgb(16 185 129), rgb(5 150 105))"
                    : score >= 45
                      ? "linear-gradient(90deg, rgb(245 158 11), rgb(217 119 6))"
                      : "linear-gradient(90deg, rgb(244 114 38), rgb(234 88 12))",
              }}
            />
          </div>
          <span
            className="font-mono text-[10px] tabular-nums"
            style={{ color: accent }}
          >
            {Math.round(score)}
          </span>
        </div>
      )}
    </li>
  );
}

function SolidityChip({ score, accent }: { score: number; accent: string }) {
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
        Defensa anterior · {Math.round(score)} {tone.label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Round model: marries each assistant turn (objection + payload)
// with the user's response (tactic + text).

interface Round {
  index: number;
  objection?: string;
  userText?: string;
  tactic?: DefenseTactic;
  volley?: DefendVolleyPayload;
}

function buildRounds(turns: SparkSessionTurn[]): Round[] {
  const out: Round[] = [];
  let pendingObjection: string | undefined;
  let pendingVolley: DefendVolleyPayload | undefined;
  let roundNum = 0;
  for (const t of turns) {
    if (t.role === "assistant") {
      if (pendingObjection !== undefined) {
        out.push({
          index: roundNum,
          objection: pendingObjection,
          volley: pendingVolley,
        });
      }
      pendingObjection = t.content;
      pendingVolley =
        t.payload?.type === "defend_volley"
          ? (t.payload as DefendVolleyPayload)
          : undefined;
    } else {
      const userText = t.content;
      const tactic = inferTactic(userText);
      out.push({
        index: roundNum,
        objection: pendingObjection,
        volley: pendingVolley,
        userText,
        tactic,
      });
      pendingObjection = undefined;
      pendingVolley = undefined;
      roundNum += 1;
    }
  }
  if (pendingObjection !== undefined) {
    out.push({
      index: roundNum,
      objection: pendingObjection,
      volley: pendingVolley,
    });
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
