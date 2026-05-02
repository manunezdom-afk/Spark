"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Bug,
  Check,
  Eye,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionShell } from "../SessionShell";
import { PhaseHUD } from "./shared/PhaseHUD";
import { NovaThinking, NovaCoachRibbon } from "./shared/NovaCoach";
import { CompletionPanel } from "./shared/CompletionPanel";
import { useSessionEngine } from "../useSessionEngine";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type {
  DebuggerError,
  DebuggerPayload,
  SparkLearningSession,
  SparkSessionTurn,
  SparkTopic,
} from "@/modules/spark/types";

const PHASES = ["Briefing", "Caza", "Veredicto"] as const;

/**
 * Cazar errores — ya no es chat. Es una pantalla de inspección:
 *   - panel del texto plantado, partido en oraciones clickeables;
 *   - lista lateral de oraciones marcadas, con badge X / Y errores;
 *   - botón "Enviar reporte" (no input genérico) que manda al modelo
 *     un resumen estructurado de qué oraciones marcó el usuario;
 *   - una vez Nova revela, panel de veredicto con cada error confirmado,
 *     conteo (cazados / faltantes), y precisión.
 *
 * El usuario marca con clicks, no con un textarea.
 */
export function HuntErrorsExperience({
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

  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [reasonFor, setReasonFor] = useState<Record<number, string>>({});

  // Find the briefing payload
  const briefingPayload = useMemo<DebuggerPayload | null>(() => {
    for (const t of engine.turns) {
      if (t.role === "assistant" && t.payload?.type === "debugger") {
        return t.payload;
      }
    }
    return null;
  }, [engine.turns]);

  const sentences = useMemo(() => {
    if (!briefingPayload?.text_with_errors) return [] as string[];
    return splitIntoSentences(briefingPayload.text_with_errors);
  }, [briefingPayload]);

  const totalErrors = briefingPayload?.errors.length ?? 0;
  const hasReport = engine.userTurnsCount > 0;

  // After the user sends a report, Nova may emit follow-up text
  // confirming/contesting marks. The "veredicto" panel becomes
  // available once we have at least one user turn.
  const novaFollowup = engine.turns.find(
    (t, i) => t.role === "assistant" && i > 0,
  );

  const phaseIdx = !briefingPayload
    ? 0
    : !hasReport
      ? 1
      : 2;

  const meterValue = !hasReport
    ? Math.min(0.5, marked.size > 0 ? 0.4 : 0.1)
    : briefingPayload && totalErrors > 0
      ? Math.min(1, marked.size / totalErrors)
      : 0.7;

  function toggle(i: number) {
    if (hasReport) return;
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function sendReport() {
    if (engine.status !== "idle" || marked.size === 0) return;
    const lines = Array.from(marked).map((i) => {
      const text = sentences[i] ?? "";
      const reason = reasonFor[i]?.trim();
      return `• Marqué: "${truncate(text, 140)}"${reason ? ` — ${reason}` : ""}`;
    });
    const message = `Reporte de inspección.\n\nEncontré ${marked.size} oración(es) sospechosas:\n${lines.join("\n")}`;
    await engine.send(message);
  }

  return (
    <SessionShell
      engine={session.engine}
      topics={topics}
      status={engine.isCompleted ? "completed" : "active"}
      onComplete={engine.complete}
      canComplete={hasReport}
      hudSlot={
        <PhaseHUD
          engine={session.engine}
          kicker="Inspección"
          phaseLabels={[...PHASES]}
          currentPhase={phaseIdx}
          meterLabel="Precisión"
          meterValue={meterValue}
          badge={
            briefingPayload
              ? hasReport
                ? `${marked.size} marcadas · ${totalErrors} plantadas`
                : `${marked.size} marcadas`
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
          ) : briefingPayload ? (
            <article
              className="rounded-3xl border bg-white/85 p-6 md:p-8 engine-card-rise shadow-soft"
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
                    <Bug className="w-4 h-4" strokeWidth={1.7} />
                  </span>
                  <div className="flex flex-col leading-tight">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: theme.accent }}
                    >
                      Texto contaminado · {totalErrors} errores plantados
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      Toca cada oración sospechosa. Cuando termines, envía el reporte.
                    </span>
                  </div>
                </div>
                <NovaCoachRibbon engine={session.engine} label="Briefing de Nova" />
              </header>

              <div
                className="rounded-2xl border p-5 md:p-6 leading-relaxed text-[15px] text-foreground/90 select-text bg-white"
                style={{ borderColor: hexToRgba(theme.accent, 0.16) }}
              >
                {sentences.map((s, i) => {
                  const isMarked = marked.has(i);
                  return (
                    <span
                      key={i}
                      onClick={() => toggle(i)}
                      className={`cursor-pointer rounded-sm px-0.5 transition-colors ${
                        isMarked
                          ? "bg-orange-200/80 underline decoration-orange-500 decoration-2 underline-offset-4"
                          : hasReport
                            ? "cursor-default"
                            : "hover:bg-orange-100/60"
                      }`}
                      title={hasReport ? undefined : isMarked ? "Quitar marca" : "Marcar como sospechosa"}
                    >
                      {s}{" "}
                    </span>
                  );
                })}
              </div>

              {!hasReport && (
                <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-[12px] text-muted-foreground">
                    {marked.size === 0
                      ? "Selecciona al menos una oración para enviar el reporte."
                      : `${marked.size} oración${marked.size === 1 ? "" : "es"} marcada${marked.size === 1 ? "" : "s"}.`}
                  </span>
                  <div className="flex gap-2">
                    {marked.size > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMarked(new Set())}
                      >
                        Limpiar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={sendReport}
                      disabled={marked.size === 0 || engine.status !== "idle"}
                      className="text-white gap-1.5"
                      style={{ background: theme.coachGradient }}
                    >
                      {engine.status === "streaming" ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.7} />
                          Procesando…
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" strokeWidth={1.7} />
                          Enviar reporte
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
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
              Nova está plantando los errores…
            </div>
          )}

          {hasReport && briefingPayload && (
            <article
              className="rounded-3xl border bg-white/90 p-6 md:p-8 engine-card-rise"
              style={{
                borderColor: hexToRgba(theme.accent, 0.22),
              }}
            >
              <header className="flex items-center gap-2 mb-4">
                <AlertTriangle
                  className="w-4 h-4"
                  strokeWidth={1.7}
                  style={{ color: theme.accent }}
                />
                <span
                  className="font-mono text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: theme.accent }}
                >
                  Veredicto · {totalErrors} {totalErrors === 1 ? "error oculto" : "errores ocultos"}
                </span>
              </header>
              <ul className="flex flex-col gap-3">
                {briefingPayload.errors.map((e, idx) => (
                  <ErrorVerdictRow
                    key={e.id}
                    err={e}
                    idx={idx}
                    accent={theme.accent}
                  />
                ))}
              </ul>
              {novaFollowup?.content && (
                <div
                  className="mt-5 p-4 rounded-xl border bg-white/70"
                  style={{ borderColor: hexToRgba(theme.accent, 0.14) }}
                >
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.16em] mb-2"
                    style={{ color: theme.accent }}
                  >
                    Análisis de Nova
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-foreground/85 whitespace-pre-wrap">
                    {stripJson(novaFollowup.content)}
                  </p>
                </div>
              )}
            </article>
          )}
        </div>

        <aside className="lg:sticky lg:top-32 lg:self-start flex flex-col gap-3">
          <header className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" strokeWidth={1.6} style={{ color: theme.accent }} />
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
            >
              Tu cuaderno de inspección
            </span>
          </header>
          {marked.size === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Marca oraciones del texto. Aparecen aquí para anotar el por qué antes de enviar.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {Array.from(marked).map((i) => (
                <li
                  key={i}
                  className="rounded-xl border bg-white/90 p-3"
                  style={{ borderColor: hexToRgba(theme.accent, 0.14) }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
                      style={{ color: theme.accent }}
                    >
                      Oración #{i + 1}
                    </span>
                    {!hasReport && (
                      <button
                        onClick={() => toggle(i)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="Quitar marca"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={1.7} />
                      </button>
                    )}
                  </div>
                  <p className="text-[12.5px] text-foreground/85 line-clamp-3 mb-2">
                    {sentences[i]}
                  </p>
                  {!hasReport && (
                    <input
                      type="text"
                      value={reasonFor[i] ?? ""}
                      onChange={(e) =>
                        setReasonFor((prev) => ({ ...prev, [i]: e.target.value }))
                      }
                      placeholder="Por qué te suena raro…"
                      className="w-full text-[12px] px-2 py-1.5 rounded-md border border-black/[0.08] bg-white/90 focus:outline-none focus:border-[color:var(--engine-accent)]"
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
          {!hasReport && marked.size > 0 && (
            <p className="text-[11px] text-muted-foreground/80">
              Tip: anotar el motivo aumenta la calidad del veredicto.
            </p>
          )}
        </aside>
      </div>
    </SessionShell>
  );
}

function ErrorVerdictRow({
  err,
  idx,
  accent,
}: {
  err: DebuggerError;
  idx: number;
  accent: string;
}) {
  return (
    <li
      className="p-4 rounded-xl border bg-white/85 flex flex-col gap-2 shadow-soft engine-card-rise"
      style={{
        borderColor: hexToRgba(accent, 0.22),
        animationDelay: `${idx * 60}ms`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex w-6 h-6 rounded-md items-center justify-center font-mono text-[10px] font-semibold"
          style={{
            background: hexToRgba(accent, 0.12),
            color: accent,
          }}
        >
          {idx + 1}
        </span>
        <span className="text-[11px] text-muted-foreground italic">En: {err.position_hint}</span>
      </div>
      <div className="flex items-start gap-2">
        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={2} />
        <div className="text-[14px] text-foreground/90">{err.correct_version}</div>
      </div>
      <div className="text-[12.5px] text-muted-foreground leading-relaxed pl-5">
        {err.explanation}
      </div>
    </li>
  );
}

function splitIntoSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
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
