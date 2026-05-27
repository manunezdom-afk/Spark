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
  Thermometer,
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
    placeholder: "Ataca la premisa de Nova con un contraejemplo concreto.",
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

  // Honest meter labels. Before this, the badge showed "Solidez (calc…)"
  // from turn 0 forever — it looked like the meter was permanently
  // computing. Now we say what's actually happening: no defense yet, or
  // Nova didn't score the last round.
  const meterLabel =
    avgSolidity !== null
      ? "Solidez"
      : userCount === 0
        ? "Solidez · sin defensa aún"
        : "Solidez · esperando score";

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
          kicker="Duelo"
          phaseLabels={[...PHASES]}
          currentPhase={phaseIdx}
          meterLabel={meterLabel}
          meterValue={meterValue}
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
              sessionId={session.id}
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
              userCount={userCount}
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
          <ShieldHalf className="w-4 h-4" strokeWidth={1.5} />
        </span>
        <div className="flex flex-col leading-tight">
          <span
            className="font-medium text-[11px]"
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
            className="font-medium text-[11px] mb-2"
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
          <Zap className="w-3.5 h-3.5" strokeWidth={1.5} />
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
  userCount,
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
  userCount: number;
}) {
  const attackLabel = round.volley?.attack_label ?? "Objeción de Nova";
  const closingQ = round.volley?.closing_question;
  const objection =
    round.volley?.objection ?? stripJson(round.objection ?? "");

  // Presión argumental (Ronda 0: Postura; Ronda 1: 55C, Ronda 2: 85C)
  const temperature = 25 + userCount * 30;
  const tempLabels = ["Templada", "Moderada", "Crítica", "Extrema"];
  const activeTempLabel = tempLabels[Math.min(3, userCount)];

  // Escudos de premisas defensivas
  const shields = useMemo(() => [
    {
      key: "evidencia",
      label: "Evidencia Empírica",
      desc: "Hechos o ejemplos",
      matched: /evidencia|ejemplo|dato|hecho|prueba|demuestra|caso/i.test(draft),
    },
    {
      key: "causalidad",
      label: "Nexo Causal",
      desc: "Por qué lógico",
      matched: /porque|causa|debido|consecuencia|genera|produce|razon/i.test(draft),
    },
    {
      key: "contexto",
      label: "Límite Contextual",
      desc: "Dónde aplica",
      matched: /contexto|limite|depende|excepto|restringe|salvo/i.test(draft),
    },
  ], [draft]);

  return (
    <div className="grid md:grid-cols-2 gap-6 items-stretch">
      {/* Left Panel: Nova (Carmesí/Crimson Attack Arena) */}
      <article
        className="rounded-3xl border bg-rose-950/[0.02] p-6 md:p-8 flex flex-col justify-between transition-all duration-500 engine-card-rise shadow-soft"
        style={{
          borderColor: "rgba(244, 63, 94, 0.22)",
          boxShadow: "0 12px 36px rgba(244, 63, 94, 0.05)",
        }}
      >
        <div>
          <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/22"
              >
                <Sword className="w-4 h-4 text-rose-600" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[12px] text-rose-700 uppercase tracking-wider">
                  Nova AI · {attackLabel}
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  Ronda {round.index}
                </span>
              </div>
            </div>
          </header>

          {priorNote && (
            <div
              className="mb-4 rounded-xl border bg-amber-50/50 p-3 text-[12.5px] text-foreground/80 italic flex gap-2"
              style={{ borderColor: "rgba(245, 158, 11, 0.25)" }}
            >
              <Activity className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-600" strokeWidth={1.5} />
              <span>
                <span className="font-medium not-italic text-amber-700">Comentario de Nova: </span>
                {priorNote}
              </span>
            </div>
          )}

          <div className="relative rounded-2xl border p-5 bg-rose-50/30 border-rose-100 mb-4 min-h-[140px] flex flex-col justify-between">
            <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-md bg-rose-500" />
            <p className="text-[15px] leading-relaxed text-foreground/90 pl-3 whitespace-pre-wrap italic">
              &ldquo;{objection}&rdquo;
            </p>
            {closingQ && (
              <p className="text-[13px] font-semibold pl-3 mt-4 pt-3 border-t border-rose-100 text-rose-700">
                → {closingQ}
              </p>
            )}
          </div>
        </div>

        {/* Argumentative Pressure Temperature Meter */}
        <div className="mt-4 bg-white/70 p-4 rounded-2xl border border-rose-500/10">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-rose-700">
              <Thermometer className="w-4 h-4 text-rose-600" strokeWidth={1.5} />
              <span className="text-[11px] font-semibold">Presión Argumental</span>
            </div>
            <span className="text-[11px] font-mono font-bold text-rose-600 uppercase tracking-wider">
              {temperature}°C ({activeTempLabel})
            </span>
          </div>
          <div className="h-2 rounded-full bg-black/[0.04] overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(temperature / 115) * 100}%`,
                background: "linear-gradient(90deg, #f97316, #ec4899, #ef4444)",
                boxShadow: "0 0 8px rgba(239, 68, 68, 0.3)",
              }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
            La intensidad de las objeciones aumenta con cada embate. Sostén tu tesis.
          </p>
        </div>
      </article>

      {/* Right Panel: You (Dorado/Gold Defense Arena) */}
      <article
        className="rounded-3xl border bg-amber-500/[0.01] p-6 md:p-8 flex flex-col justify-between transition-all duration-500 engine-card-rise shadow-soft"
        style={{
          borderColor: "rgba(245, 158, 11, 0.22)",
          boxShadow: "0 12px 36px rgba(245, 158, 11, 0.05)",
        }}
      >
        <div className="flex flex-col gap-5">
          <header className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/22"
              >
                <ShieldHalf className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
              </span>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[12px] text-amber-700 uppercase tracking-wider">
                  Tu Defensa
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  Ronda {round.index} de 2
                </span>
              </div>
            </div>
            {priorScore !== null && (
              <SolidityChip score={priorScore} accent={accent} />
            )}
          </header>

          {/* Escudo de Premisas (Concept check tags) */}
          <div className="bg-white/60 p-4 rounded-2xl border border-amber-500/10">
            <span className="font-semibold text-[11px] block text-amber-800 mb-2">
              Tus Escudos de Premisa (Valida al escribir)
            </span>
            <div className="flex flex-col gap-2">
              {shields.map((s) => (
                <div
                  className={`flex items-center justify-between p-2 rounded-xl border text-[11px] transition-all duration-300 ${
                    s.matched
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 font-semibold shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                      : "bg-black/[0.01] border-black/[0.04] text-muted-foreground"
                  }`}
                  key={s.key}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        s.matched ? "bg-emerald-500 animate-pulse" : "bg-black/10"
                      }`}
                    />
                    <span>{s.label} <span className="opacity-70">({s.desc})</span></span>
                  </div>
                  <span className="font-mono text-[9px] font-bold">
                    {s.matched ? "✓ ACTIVADO" : "+ APAGADO"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <span className="font-semibold text-[11px] block text-amber-800 mb-2">
              Tu táctica argumentativa
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(TACTIC_LABELS) as DefenseTactic[]).map((k) => {
                const Icon = TACTIC_LABELS[k].icon;
                const active = tactic === k;
                return (
                  <button
                    key={k}
                    onClick={() => setTactic(k)}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[11.5px] font-medium transition-all"
                    style={
                      active
                        ? {
                            borderColor: "rgba(245, 158, 11, 0.6)",
                            background: "rgba(245, 158, 11, 0.08)",
                            color: "rgb(217, 119, 6)",
                          }
                        : {
                            borderColor: "rgba(0,0,0,0.06)",
                            background: "rgba(255,255,255,0.7)",
                            color: "rgb(40 40 40 / 0.85)",
                          }
                    }
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {TACTIC_LABELS[k].label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <span className="font-semibold text-[11px] text-amber-800">
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
            className="bg-white/90 resize-none border-amber-100 focus:border-amber-400"
          />
          <div className="flex items-center justify-between gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} />
                  Defendiendo…
                </>
              ) : (
                <>
                  Lanzar defensa
                  <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                </>
              )}
            </Button>
          </div>
        </div>
      </article>
    </div>
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
          <ListChecks className="w-4 h-4" strokeWidth={1.5} style={{ color: accent }} />
          <span
            className="font-medium text-[11px]"
            style={{ color: accent }}
          >
            Línea del duelo
          </span>
        </div>
        {avgSolidity !== null && (
          <span
            className="font-medium text-[11px] px-2 py-0.5 rounded-full"
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
          className="font-medium text-[11px]"
          style={{ color: accent }}
        >
          {round.index === 0 ? "Postura" : `Ronda ${round.index}`}
          {attackTag && round.index > 0 ? ` · ${attackTag}` : ""}
        </span>
        {tacticLabel && (
          <span className="font-medium text-[11px] text-foreground/60">
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
      <Activity className="w-3 h-3" strokeWidth={1.5} style={{ color: tone.fg }} />
      <span
        className="font-medium text-[11px]"
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
