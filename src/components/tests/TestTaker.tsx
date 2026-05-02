"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ListChecks,
  Send,
  Timer,
  Hourglass,
  Play,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";
import { getEngineTheme } from "@/modules/spark/engines/themes";

import type { TestQuestion, TestAnswer, TestType } from "@/modules/spark/types";

interface TestTakerProps {
  sessionId: string;
  testType: TestType;
  questions: TestQuestion[];
  topicTitles: string[];
}

/**
 * Test runner: it's already an evaluation experience (not a chat). This
 * version reinforces that with:
 *   - exam-style header with engine theme
 *   - prominent "Pregunta X / Y" + topic badge
 *   - optional countdown timer (off by default — user toggles)
 *   - keyboard navigation (← →) and Enter-to-submit on last question
 *   - bottom navigator dots + sticky submit when all answered
 *
 * Backend untouched — we still POST to /api/tests/submit.
 */
export function TestTaker({
  sessionId,
  testType,
  questions,
  topicTitles,
}: TestTakerProps) {
  const router = useRouter();
  const theme = getEngineTheme(
    testType === "alternativas" ? "test_alternativas" : "test_desarrollo",
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, TestAnswer>>(new Map());
  const [busy, setBusy] = useState(false);
  const [timer, setTimer] = useState<{ enabled: boolean; secondsLeft: number; paused: boolean }>(
    { enabled: false, secondsLeft: questions.length * 90, paused: false },
  );
  const submittedRef = useRef(false);

  const current = questions[currentIndex];
  const total = questions.length;
  const answered = answers.size;
  const currentAnswer = answers.get(current.id);
  const isLastQuestion = currentIndex === total - 1;
  const allAnswered = answered === total;

  function setAlternativaAnswer(questionId: number, index: number) {
    setAnswers((prev) =>
      new Map(prev).set(questionId, { question_id: questionId, selected_index: index }),
    );
  }

  function setDesarrolloAnswer(questionId: number, text: string) {
    setAnswers((prev) =>
      new Map(prev).set(questionId, { question_id: questionId, text_answer: text }),
    );
  }

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(total - 1, index)));
  }

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inField =
        target.tagName === "TEXTAREA" || target.tagName === "INPUT";
      if (e.key === "ArrowLeft" && !inField) {
        setCurrentIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight" && !inField) {
        setCurrentIndex((i) => Math.min(total - 1, i + 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  // Timer countdown
  useEffect(() => {
    if (!timer.enabled || timer.paused) return;
    const id = window.setInterval(() => {
      setTimer((prev) => {
        if (!prev.enabled || prev.paused) return prev;
        const next = Math.max(0, prev.secondsLeft - 1);
        if (next === 0 && !submittedRef.current) {
          submittedRef.current = true;
          // Auto-submit when timer hits 0
          window.setTimeout(() => onSubmit(true), 0);
        }
        return { ...prev, secondsLeft: next };
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.enabled, timer.paused]);

  async function onSubmit(skipConfirm = false) {
    if (submittedRef.current && !skipConfirm) return;
    if (!skipConfirm && !allAnswered) {
      const unanswered = total - answered;
      const ok = window.confirm(
        `Tienes ${unanswered} pregunta${unanswered !== 1 ? "s" : ""} sin responder. ¿Enviar de todos modos?`,
      );
      if (!ok) return;
    }

    setBusy(true);
    submittedRef.current = true;
    try {
      const answersArray: TestAnswer[] = questions.map(
        (q) => answers.get(q.id) ?? { question_id: q.id },
      );

      const res = await fetch("/api/tests/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answers: answersArray }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error enviando prueba");
      router.push(`/tests/${sessionId}/results`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setBusy(false);
      submittedRef.current = false;
    }
  }

  const timerLabel = useMemo(() => {
    const m = Math.floor(timer.secondsLeft / 60).toString().padStart(2, "0");
    const s = (timer.secondsLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [timer.secondsLeft]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ "--engine-accent": theme.accent } as React.CSSProperties}
    >
      <header
        className="sticky top-0 z-30 border-b border-black/[0.06] bg-background/85 backdrop-blur-xl"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: theme.headerGradient, opacity: 0.7 }}
          aria-hidden
        />
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            Salir
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <ListChecks
              className="w-4 h-4 shrink-0"
              strokeWidth={1.6}
              style={{ color: theme.accent }}
            />
            <div className="flex flex-col leading-tight min-w-0">
              <span
                className="font-mono text-[9.5px] uppercase tracking-[0.18em] leading-none"
                style={{ color: theme.accent }}
              >
                Prueba {testType === "alternativas" ? "de alternativas" : "de desarrollo"}
              </span>
              <span className="text-[12px] text-muted-foreground truncate">
                {topicTitles.join(" · ")}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {timer.enabled ? (
              <button
                onClick={() => setTimer((t) => ({ ...t, paused: !t.paused }))}
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 h-7 rounded-full font-mono text-[11px] tabular-nums border bg-white/85",
                  timer.secondsLeft < 60 && "text-rose-700 border-rose-300",
                )}
                style={{
                  borderColor: timer.secondsLeft < 60 ? undefined : hexToRgba(theme.accent, 0.32),
                  color: timer.secondsLeft < 60 ? undefined : theme.accent,
                }}
              >
                {timer.paused ? (
                  <Play className="w-3 h-3" strokeWidth={1.7} />
                ) : (
                  <Hourglass className="w-3 h-3" strokeWidth={1.7} />
                )}
                {timerLabel}
              </button>
            ) : (
              <button
                onClick={() =>
                  setTimer({ enabled: true, secondsLeft: questions.length * 90, paused: false })
                }
                className="inline-flex items-center gap-1 px-2.5 h-7 rounded-full font-mono text-[10px] tracking-[0.14em] uppercase border bg-white/85 text-muted-foreground hover:text-foreground"
                title="Activar temporizador (90s por pregunta)"
              >
                <Timer className="w-3 h-3" strokeWidth={1.7} />
                Cronometrar
              </button>
            )}
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-5 md:px-8 pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Pregunta {currentIndex + 1} / {total}
            </span>
            <span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground">
              {answered} / {total} respondidas
            </span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: hexToRgba(theme.accent, 0.10) }}
          >
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${(answered / total) * 100}%`,
                background: theme.coachGradient,
              }}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 md:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <article
            className="rounded-3xl border bg-white/85 backdrop-blur-sm p-7 md:p-9 shadow-soft"
            style={{
              borderColor: hexToRgba(theme.accent, 0.18),
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <span
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl font-mono text-[12px] font-semibold"
                style={{
                  background: hexToRgba(theme.accent, 0.12),
                  color: theme.accent,
                  border: `1px solid ${hexToRgba(theme.accent, 0.28)}`,
                }}
              >
                {currentIndex + 1}
              </span>
              {currentAnswer !== undefined && (
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Respondida
                </span>
              )}
            </div>

            <p className="text-[18px] font-medium leading-relaxed text-foreground mb-7">
              {current.text}
            </p>

            {testType === "alternativas" && current.options && (
              <div className="flex flex-col gap-2">
                {current.options.map((opt, i) => {
                  const isSelected = currentAnswer?.selected_index === i;
                  const letter = String.fromCharCode(65 + i);
                  return (
                    <button
                      key={i}
                      onClick={() => setAlternativaAnswer(current.id, i)}
                      className={cn(
                        "text-left flex gap-3 px-4 py-3 rounded-xl border text-[14px] font-medium transition-all",
                        isSelected
                          ? "text-foreground"
                          : "border-black/[0.08] bg-white/60 text-foreground/80 hover:bg-white hover:border-black/[0.15]",
                      )}
                      style={
                        isSelected
                          ? {
                              borderColor: theme.accent,
                              background: hexToRgba(theme.accent, 0.06),
                            }
                          : undefined
                      }
                    >
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md font-mono text-[12px] font-semibold shrink-0"
                        style={
                          isSelected
                            ? {
                                background: theme.accent,
                                color: "white",
                              }
                            : {
                                background: "rgba(0,0,0,0.05)",
                                color: "rgb(40 40 40 / 0.7)",
                              }
                        }
                      >
                        {letter}
                      </span>
                      <span className="flex-1">{opt.replace(/^[A-D]\.\s*/, "")}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {testType === "desarrollo" && (
              <Textarea
                placeholder="Escribe tu respuesta aquí…"
                value={currentAnswer?.text_answer ?? ""}
                onChange={(e) => setDesarrolloAnswer(current.id, e.target.value)}
                rows={8}
                className="resize-none bg-white border-black/[0.08] text-sm leading-relaxed"
              />
            )}
          </article>

          <div className="flex items-center justify-between gap-3 mt-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => goTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="gap-1 shrink-0"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              Anterior
            </Button>

            <div className="flex gap-1.5 flex-wrap justify-center flex-1">
              {questions.map((q, i) => (
                <button
                  key={q.id}
                  onClick={() => goTo(i)}
                  title={`Pregunta ${i + 1}`}
                  className={cn(
                    "w-6 h-6 rounded-full text-[10px] font-semibold border transition-all",
                    i === currentIndex
                      ? "scale-110 text-white"
                      : answers.has(q.id)
                        ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                        : "bg-white/60 border-black/[0.10] text-muted-foreground hover:bg-white",
                  )}
                  style={
                    i === currentIndex
                      ? { background: theme.accent, borderColor: theme.accent }
                      : undefined
                  }
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {isLastQuestion ? (
              <Button
                size="sm"
                onClick={() => onSubmit(false)}
                disabled={busy}
                className="gap-1 shrink-0 text-white"
                style={{ background: theme.coachGradient }}
              >
                {busy ? "Enviando…" : "Enviar"}
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo(currentIndex + 1)}
                className="gap-1 shrink-0"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            )}
          </div>

          {allAnswered && !isLastQuestion && (
            <div className="mt-8 flex justify-center">
              <Button
                onClick={() => onSubmit(false)}
                disabled={busy}
                className="gap-2 shadow-soft text-white"
                style={{ background: theme.coachGradient }}
              >
                {busy ? "Enviando prueba…" : "Enviar prueba"}
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
