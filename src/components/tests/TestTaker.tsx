"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

import type { TestQuestion, TestAnswer, TestType } from "@/modules/spark/types";

interface TestTakerProps {
  sessionId: string;
  testType: TestType;
  questions: TestQuestion[];
  topicTitles: string[];
}

export function TestTaker({
  sessionId,
  testType,
  questions,
  topicTitles,
}: TestTakerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, TestAnswer>>(new Map());
  const [busy, setBusy] = useState(false);

  const current = questions[currentIndex];
  const total = questions.length;
  const answered = answers.size;
  const currentAnswer = answers.get(current.id);
  const isLastQuestion = currentIndex === total - 1;
  const allAnswered = answered === total;

  function setAlternativaAnswer(questionId: number, index: number) {
    setAnswers((prev) => new Map(prev).set(questionId, { question_id: questionId, selected_index: index }));
  }

  function setDesarrolloAnswer(questionId: number, text: string) {
    setAnswers((prev) => new Map(prev).set(questionId, { question_id: questionId, text_answer: text }));
  }

  function goTo(index: number) {
    setCurrentIndex(Math.max(0, Math.min(total - 1, index)));
  }

  async function onSubmit() {
    if (!allAnswered) {
      const unanswered = total - answered;
      const ok = window.confirm(
        `Tienes ${unanswered} pregunta${unanswered !== 1 ? "s" : ""} sin responder. ¿Enviar de todos modos?`
      );
      if (!ok) return;
    }

    setBusy(true);
    try {
      // Build answers array, filling in blanks for unanswered questions
      const answersArray: TestAnswer[] = questions.map(
        (q) => answers.get(q.id) ?? { question_id: q.id }
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
    }
  }

  return (
    <div className="min-h-full p-6 md:p-10">
      <div className="max-w-2xl mx-auto">

        {/* Header with progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground truncate max-w-[60%]">
              {topicTitles.join(" · ")}
            </span>
            <span className="font-mono text-[10px] text-muted-foreground shrink-0">
              {answered}/{total} respondidas
            </span>
          </div>
          <div className="h-1 rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full bg-spark rounded-full transition-all duration-500"
              style={{ width: `${(answered / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Question card */}
        <div className="rounded-2xl border border-black/[0.07] bg-white/70 backdrop-blur-sm p-7 mb-5 shadow-soft">
          <div className="flex items-center justify-between mb-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Pregunta {currentIndex + 1} de {total}
            </div>
            {currentAnswer !== undefined && (
              <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                Respondida
              </span>
            )}
          </div>

          <p className="text-[17px] font-medium leading-relaxed text-foreground mb-6">
            {current.text}
          </p>

          {/* Alternativas options */}
          {testType === "alternativas" && current.options && (
            <div className="flex flex-col gap-2">
              {current.options.map((opt, i) => {
                const isSelected = currentAnswer?.selected_index === i;
                return (
                  <button
                    key={i}
                    onClick={() => setAlternativaAnswer(current.id, i)}
                    className={cn(
                      "text-left px-4 py-3 rounded-xl border text-[14px] font-medium transition-all",
                      isSelected
                        ? "border-spark bg-spark/[0.07] text-foreground"
                        : "border-black/[0.08] bg-white/60 text-foreground/80 hover:bg-white hover:border-black/[0.15]"
                    )}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {/* Desarrollo text area */}
          {testType === "desarrollo" && (
            <Textarea
              placeholder="Escribe tu respuesta aquí…"
              value={currentAnswer?.text_answer ?? ""}
              onChange={(e) => setDesarrolloAnswer(current.id, e.target.value)}
              rows={7}
              className="resize-none bg-white/80 border-black/[0.08] focus:border-spark/40 text-sm leading-relaxed"
            />
          )}
        </div>

        {/* Navigation controls */}
        <div className="flex items-center justify-between gap-3">
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

          {/* Question dot navigator */}
          <div className="flex gap-1.5 flex-wrap justify-center flex-1">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                title={`Pregunta ${i + 1}`}
                className={cn(
                  "w-6 h-6 rounded-full text-[10px] font-semibold border transition-all",
                  i === currentIndex
                    ? "bg-spark text-white border-spark scale-110"
                    : answers.has(q.id)
                    ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                    : "bg-white/60 border-black/[0.10] text-muted-foreground hover:bg-white"
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <Button
              variant="spark"
              size="sm"
              onClick={onSubmit}
              disabled={busy}
              className="gap-1 shrink-0"
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

        {/* Floating submit button when all answered and not on last question */}
        {allAnswered && !isLastQuestion && (
          <div className="mt-8 flex justify-center">
            <Button variant="spark" onClick={onSubmit} disabled={busy} className="gap-2 shadow-soft">
              {busy ? "Enviando prueba…" : "Enviar prueba"}
              <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
