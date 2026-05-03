"use client";

import { useMemo, useState } from "react";
import {
  Bug,
  Check,
  Eye,
  Loader2,
  Sparkles,
  Target,
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

type SentenceVerdict =
  | { kind: "idle" } // before report
  | { kind: "caught"; error: DebuggerError }
  | { kind: "false_alarm" }
  | { kind: "untouched" } // not marked, not an error
  | { kind: "missed"; error: DebuggerError }; // not marked but planted

/**
 * Cazar errores — pantalla de inspección forense.
 *
 * Mecánica:
 *  1. Briefing: Nova planta 3 errores en un texto coherente y emite
 *     payload `debugger` con la lista de errores correctos.
 *  2. Caza: el usuario clickea las oraciones que le parecen sospechosas.
 *     Lateral: cuaderno con motivo opcional por oración.
 *  3. Veredicto: cada oración marcada se evalúa contra `position_hint`:
 *       ✓ caught — la oración coincide con un error plantado
 *       ✗ false_alarm — marcó algo que no era error
 *       ⚠ missed — error plantado que no detectó (overlay sobre la oración)
 *     Precisión real = caught / (caught + false_alarm + missed).
 *
 * Sin chat. Sin "Nova escribió + tú escribiste". Cada acción es estructurada.
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

  // ── Verdict matching ─────────────────────────────────────────
  // For every sentence, determine its post-report verdict by matching
  // marked sentences against the planted errors' position hints. The
  // matching is fuzzy: an error matches a sentence if a meaningful
  // chunk of the position_hint appears in (or matches) the sentence.
  const verdicts = useMemo<SentenceVerdict[]>(() => {
    if (!hasReport || !briefingPayload) {
      return sentences.map(() => ({ kind: "idle" } as SentenceVerdict));
    }
    const errors = briefingPayload.errors;
    const usedErrors = new Set<number>();
    const result: SentenceVerdict[] = sentences.map((sentence, i) => {
      if (marked.has(i)) {
        // Find a planted error that matches this sentence
        const matchedErr = errors.find(
          (e) => !usedErrors.has(e.id) && sentenceMatchesError(sentence, e),
        );
        if (matchedErr) {
          usedErrors.add(matchedErr.id);
          return { kind: "caught", error: matchedErr };
        }
        return { kind: "false_alarm" };
      }
      return { kind: "untouched" };
    });

    // For each error not yet attributed to a marked sentence, find
    // its likely sentence and mark it as "missed" so we can overlay
    // the original text with a callout.
    for (const err of errors) {
      if (usedErrors.has(err.id)) continue;
      const sIdx = sentences.findIndex(
        (s, i) => result[i].kind === "untouched" && sentenceMatchesError(s, err),
      );
      if (sIdx >= 0) {
        result[sIdx] = { kind: "missed", error: err };
        usedErrors.add(err.id);
      }
    }
    return result;
  }, [hasReport, briefingPayload, sentences, marked]);

  const caughtCount = verdicts.filter((v) => v.kind === "caught").length;
  const falseAlarmCount = verdicts.filter((v) => v.kind === "false_alarm").length;
  const missedCount = verdicts.filter((v) => v.kind === "missed").length;
  const orphanMissed = totalErrors - caughtCount - missedCount; // errors not located in any sentence
  const totalMissed = missedCount + Math.max(0, orphanMissed);
  const precisionDenominator = caughtCount + falseAlarmCount + totalMissed;
  const precisionRaw = precisionDenominator
    ? caughtCount / precisionDenominator
    : 0;
  const precisionPct = Math.round(precisionRaw * 100);

  const phaseIdx = !briefingPayload ? 0 : !hasReport ? 1 : 2;
  const meterValue = !hasReport
    ? Math.min(0.5, marked.size > 0 ? 0.4 : 0.1)
    : precisionRaw;

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
          meterLabel={hasReport ? "Precisión" : "Avance"}
          meterValue={meterValue}
          badge={
            briefingPayload
              ? hasReport
                ? `${caughtCount} cazados · ${totalMissed} faltantes · ${falseAlarmCount} falsos`
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
                      {hasReport
                        ? `Veredicto · ${caughtCount}/${totalErrors} cazados`
                        : `Texto contaminado · ${totalErrors} errores plantados`}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground">
                      {hasReport
                        ? "Verde = cazaste · Naranja = falso · Azul = se te escapó"
                        : "Toca cada oración sospechosa. Cuando termines, envía el reporte."}
                    </span>
                  </div>
                </div>
                {!hasReport && (
                  <NovaCoachRibbon engine={session.engine} label="Briefing de Nova" />
                )}
              </header>

              <div
                className="rounded-2xl border p-5 md:p-6 leading-relaxed text-[15px] text-foreground/90 select-text bg-white"
                style={{ borderColor: hexToRgba(theme.accent, 0.16) }}
              >
                {sentences.map((s, i) => (
                  <SentenceSpan
                    key={i}
                    text={s}
                    marked={marked.has(i)}
                    verdict={verdicts[i]}
                    locked={hasReport}
                    onToggle={() => toggle(i)}
                  />
                ))}
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
              <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <Target
                    className="w-4 h-4"
                    strokeWidth={1.7}
                    style={{ color: theme.accent }}
                  />
                  <span
                    className="font-mono text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: theme.accent }}
                  >
                    Precisión · {precisionPct}%
                  </span>
                </div>
                <PrecisionBar value={precisionRaw} accent={theme.accent} />
              </header>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatTile
                  label="Cazados"
                  value={caughtCount}
                  total={totalErrors}
                  tone="success"
                />
                <StatTile
                  label="Faltantes"
                  value={totalMissed}
                  total={totalErrors}
                  tone="warning"
                />
                <StatTile
                  label="Falsos"
                  value={falseAlarmCount}
                  total={null}
                  tone="danger"
                />
              </div>

              <ul className="flex flex-col gap-3">
                {briefingPayload.errors.map((e, idx) => {
                  const wasCaught = verdicts.some(
                    (v) => v.kind === "caught" && v.error.id === e.id,
                  );
                  return (
                    <ErrorVerdictRow
                      key={e.id}
                      err={e}
                      idx={idx}
                      caught={wasCaught}
                      accent={theme.accent}
                    />
                  );
                })}
              </ul>
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
              {hasReport ? "Tu reporte" : "Tu cuaderno de inspección"}
            </span>
          </header>
          {marked.size === 0 ? (
            <p className="text-[12.5px] text-muted-foreground italic">
              Marca oraciones del texto. Aparecen aquí para anotar el por qué antes de enviar.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {Array.from(marked).map((i) => {
                const v = verdicts[i];
                return (
                  <li
                    key={i}
                    className="rounded-xl border bg-white/90 p-3"
                    style={{
                      borderColor:
                        v?.kind === "caught"
                          ? "rgba(16, 185, 129, 0.4)"
                          : v?.kind === "false_alarm"
                            ? "rgba(244, 114, 38, 0.4)"
                            : hexToRgba(theme.accent, 0.14),
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span
                        className="font-mono text-[9.5px] uppercase tracking-[0.16em]"
                        style={{
                          color:
                            v?.kind === "caught"
                              ? "rgb(5 150 105)"
                              : v?.kind === "false_alarm"
                                ? "rgb(234 88 12)"
                                : theme.accent,
                        }}
                      >
                        {v?.kind === "caught"
                          ? "✓ Cazaste"
                          : v?.kind === "false_alarm"
                            ? "✗ Falsa alarma"
                            : `Oración #${i + 1}`}
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
                    {v?.kind === "caught" && (
                      <p className="text-[11.5px] text-emerald-700 leading-relaxed border-l-2 border-emerald-300 pl-2 mt-2">
                        Correcto: {v.error.correct_version}
                      </p>
                    )}
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
                );
              })}
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

// ─────────────────────────────────────────────────────────────
// Sentence rendering with verdict-driven styling

function SentenceSpan({
  text,
  marked,
  verdict,
  locked,
  onToggle,
}: {
  text: string;
  marked: boolean;
  verdict?: SentenceVerdict;
  locked: boolean;
  onToggle: () => void;
}) {
  // After report: paint based on verdict
  if (locked && verdict) {
    if (verdict.kind === "caught") {
      return (
        <span
          className="rounded-sm px-0.5 bg-emerald-100/80 underline decoration-emerald-600 decoration-2 underline-offset-4"
          title={`✓ Cazaste: ${verdict.error.correct_version}`}
        >
          {text}{" "}
        </span>
      );
    }
    if (verdict.kind === "false_alarm") {
      return (
        <span
          className="rounded-sm px-0.5 bg-orange-100/70 line-through decoration-orange-500"
          title="✗ Falsa alarma"
        >
          {text}{" "}
        </span>
      );
    }
    if (verdict.kind === "missed") {
      return (
        <span
          className="rounded-sm px-0.5 bg-blue-100/70 underline decoration-blue-500 decoration-dotted decoration-2 underline-offset-4"
          title={`⚠ Se te escapó: ${verdict.error.correct_version}`}
        >
          {text}{" "}
        </span>
      );
    }
    return <span>{text} </span>;
  }
  // Pre-report: marking mode
  return (
    <span
      onClick={onToggle}
      className={`cursor-pointer rounded-sm px-0.5 transition-colors ${
        marked
          ? "bg-orange-200/80 underline decoration-orange-500 decoration-2 underline-offset-4"
          : "hover:bg-orange-100/60"
      }`}
      title={marked ? "Quitar marca" : "Marcar como sospechosa"}
    >
      {text}{" "}
    </span>
  );
}

function StatTile({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number | null;
  tone: "success" | "warning" | "danger";
}) {
  const colors =
    tone === "success"
      ? { fg: "rgb(5 150 105)", bg: "rgb(209 250 229 / 0.5)", border: "rgba(16, 185, 129, 0.3)" }
      : tone === "warning"
        ? { fg: "rgb(37 99 235)", bg: "rgb(219 234 254 / 0.5)", border: "rgba(59, 130, 246, 0.3)" }
        : { fg: "rgb(234 88 12)", bg: "rgb(254 215 170 / 0.4)", border: "rgba(244, 114, 38, 0.3)" };
  return (
    <div
      className="rounded-xl border p-3 flex flex-col items-center justify-center gap-0.5"
      style={{ background: colors.bg, borderColor: colors.border }}
    >
      <span
        className="font-mono text-[9px] uppercase tracking-[0.14em]"
        style={{ color: colors.fg, opacity: 0.85 }}
      >
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-[22px] font-semibold leading-none" style={{ color: colors.fg }}>
          {value}
        </span>
        {total !== null && (
          <span className="text-[11px] text-muted-foreground">/ {total}</span>
        )}
      </div>
    </div>
  );
}

function PrecisionBar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div
        className="h-1.5 flex-1 rounded-full overflow-hidden"
        style={{ background: hexToRgba(accent, 0.1) }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            background:
              value >= 0.7
                ? "linear-gradient(90deg, rgb(16 185 129), rgb(5 150 105))"
                : value >= 0.4
                  ? "linear-gradient(90deg, rgb(245 158 11), rgb(217 119 6))"
                  : "linear-gradient(90deg, rgb(244 114 38), rgb(234 88 12))",
          }}
        />
      </div>
    </div>
  );
}

function ErrorVerdictRow({
  err,
  idx,
  caught,
  accent,
}: {
  err: DebuggerError;
  idx: number;
  caught: boolean;
  accent: string;
}) {
  return (
    <li
      className="p-4 rounded-xl border flex flex-col gap-2 shadow-soft engine-card-rise"
      style={{
        background: caught ? "rgb(236 253 245 / 0.6)" : "rgb(255 255 255 / 0.85)",
        borderColor: caught ? "rgba(16, 185, 129, 0.3)" : hexToRgba(accent, 0.22),
        animationDelay: `${idx * 60}ms`,
      }}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex w-6 h-6 rounded-md items-center justify-center font-mono text-[10px] font-semibold"
            style={{
              background: caught ? "rgb(16 185 129)" : hexToRgba(accent, 0.12),
              color: caught ? "white" : accent,
            }}
          >
            {idx + 1}
          </span>
          <span className="text-[11px] text-muted-foreground italic">En: {err.position_hint}</span>
        </div>
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.16em] px-2 py-0.5 rounded-full"
          style={
            caught
              ? { background: "rgb(16 185 129)", color: "white" }
              : { background: "rgb(219 234 254)", color: "rgb(37 99 235)" }
          }
        >
          {caught ? "✓ Cazado" : "⚠ Faltante"}
        </span>
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

// ─────────────────────────────────────────────────────────────
// Matching: a sentence "contains" a planted error if a
// non-trivial slice of the position hint or correct version
// appears within it. This works without exact-string equality
// because Nova's `position_hint` is approximate (e.g. "segunda
// oración del párrafo 2"), and `correct_version` may rephrase.

function sentenceMatchesError(sentence: string, err: DebuggerError): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-záéíóúñü0-9 ]/gi, " ").replace(/\s+/g, " ").trim();
  const sNorm = norm(sentence);
  const hintNorm = norm(err.position_hint ?? "");
  const correctNorm = norm(err.correct_version ?? "");
  if (!sNorm) return false;

  // 1) exact-ish match against position_hint chunks (Nova sometimes
  //    quotes the exact problematic phrase here).
  if (hintNorm) {
    for (const chunk of significantChunks(hintNorm)) {
      if (sNorm.includes(chunk)) return true;
    }
  }

  // 2) match against the correct version's keywords. If the planted
  //    error's correct version mentions specific named entities,
  //    those are likely to appear (or be paraphrased) in the
  //    surrounding sentence.
  if (correctNorm) {
    const keywords = correctNorm
      .split(" ")
      .filter((w) => w.length >= 6 && !STOPWORDS.has(w));
    let hits = 0;
    for (const w of keywords) {
      if (sNorm.includes(w)) hits += 1;
      if (hits >= 2) return true;
    }
  }

  return false;
}

function significantChunks(text: string): string[] {
  // Take 4-word phrases, plus any content between quotes.
  const out: string[] = [];
  const quoted = text.match(/"([^"]{8,})"/g);
  if (quoted) for (const q of quoted) out.push(q.replace(/"/g, ""));
  const tokens = text.split(" ").filter((w) => !STOPWORDS.has(w));
  for (let i = 0; i + 3 < tokens.length; i += 1) {
    out.push(tokens.slice(i, i + 4).join(" "));
  }
  return out;
}

const STOPWORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "y", "o",
  "que", "en", "con", "por", "para", "se", "su", "sus", "es", "son", "al",
  "lo", "le", "les", "como", "más", "muy", "pero", "sin", "no", "si",
  "the", "of", "and", "or", "in", "on", "to", "a", "is", "are", "with",
]);

function splitIntoSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
