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

  return (
    <article
      key={act.index}
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
            <Drama className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col leading-tight">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: accent }}
            >
              {isDebrief ? "Debrief · análisis del caso" : `Acto ${actNum} · ${sceneLabel}`}
            </span>
            <span className="text-[11.5px] text-muted-foreground italic">
              {isDebrief
                ? "Saliendo del rol"
                : `Voz: ${persona ?? "el personaje"}`}
            </span>
          </div>
        </div>
        <NovaCoachRibbon
          engine="roleplay"
          label={isDebrief ? "Saliendo del rol" : "Nova en escena"}
        />
      </header>

      {priorConsequence && !isDebrief && (
        <div
          className="mb-4 rounded-xl border p-3 text-[12.5px] italic flex gap-2"
          style={{
            background: "rgb(254 252 232 / 0.5)",
            borderColor: "rgba(245, 158, 11, 0.25)",
          }}
        >
          <Sparkles
            className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-700"
            strokeWidth={1.7}
          />
          <span className="text-foreground/80">
            <span className="font-medium not-italic text-amber-700">
              Tras tu jugada anterior:{" "}
            </span>
            {priorConsequence}
          </span>
        </div>
      )}

      {/* The scene as dialogue, with quote marker */}
      <div
        className="relative rounded-2xl border p-5 bg-amber-50/40"
        style={{ borderColor: hexToRgba(accent, 0.18) }}
      >
        <Quote
          className="absolute top-3 left-3 w-3.5 h-3.5 opacity-40"
          strokeWidth={1.7}
          style={{ color: accent }}
        />
        <p className="text-[16px] leading-relaxed text-foreground/90 whitespace-pre-wrap pl-6 italic">
          {sceneText}
        </p>
      </div>

      {/* Available data chips */}
      {availableData.length > 0 && !isDebrief && (
        <div className="mt-4">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
            style={{ color: accent }}
          >
            Datos a la mano
          </span>
          <div className="flex flex-wrap gap-2">
            {availableData.map((d, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-white/85 text-[12px]"
                style={{
                  borderColor: hexToRgba(accent, 0.22),
                  boxShadow: `0 0 0 3px ${hexToRgba(accent, 0.04)}`,
                }}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ background: accent }}
                />
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Debrief: render available_data as "lecciones clave" */}
      {availableData.length > 0 && isDebrief && (
        <div className="mt-4">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
            style={{ color: accent }}
          >
            Lecciones del caso
          </span>
          <ul className="flex flex-col gap-2">
            {availableData.map((d, i) => (
              <li
                key={i}
                className="text-[13.5px] text-foreground/85 leading-relaxed border-l-2 pl-3 py-0.5"
                style={{ borderColor: hexToRgba(accent, 0.4) }}
              >
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Debrief: prior_move_consequence is the verdict */}
      {isDebrief && priorConsequence && (
        <div
          className="mt-4 rounded-2xl border p-4"
          style={{
            background: hexToRgba(accent, 0.05),
            borderColor: hexToRgba(accent, 0.22),
          }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
            style={{ color: accent }}
          >
            Veredicto
          </span>
          <p className="text-[14px] text-foreground/85 leading-relaxed">
            {priorConsequence}
          </p>
        </div>
      )}

      {/* Decision pressure question — only outside debrief */}
      {decisionPressure && !isDebrief && (
        <div
          className="mt-5 rounded-2xl border-l-4 pl-4 py-2"
          style={{ borderColor: accent }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[0.14em] block"
            style={{ color: accent }}
          >
            Tu turno
          </span>
          <p className="text-[15px] font-medium text-foreground/90 mt-1">
            {decisionPressure}
          </p>
        </div>
      )}

      {/* Posture + input — only outside debrief */}
      {!isDebrief && (
        <>
          <div className="mt-6">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.16em] block mb-2"
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
                    className="rounded-xl border py-3 px-3 text-[12px] font-medium transition-all"
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
                    {POSTURE_LABELS[k].label}
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
              Tu jugada — {POSTURE_LABELS[posture].verb}
            </span>
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={POSTURE_LABELS[posture].placeholder}
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

// ─────────────────────────────────────────────────────────────
// Side panel: acts log with posture per act.

function ActsLog({ acts, accent }: { acts: Act[]; accent: string }) {
  return (
    <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
      <header className="flex items-center gap-2">
        <ScrollText className="w-4 h-4" strokeWidth={1.6} style={{ color: accent }} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
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
                    className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
                    style={{ color: accent }}
                  >
                    Acto {actNum} · {sceneLabel}
                  </span>
                  {a.posture && (
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-foreground/60 flex items-center gap-1">
                      <ArrowRight className="w-2.5 h-2.5" strokeWidth={1.7} />
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
        const isDebrief = detectDebrief(pending.rawText) || pending.payload?.act === 4;
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
        pending && (detectDebrief(pending.rawText) || pending.payload?.act === 4);
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
      isDebrief: detectDebrief(pending.rawText) || pending.payload?.act === 4,
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
