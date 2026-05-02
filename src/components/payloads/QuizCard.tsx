"use client";

import { useState } from "react";
import { Check, HelpCircle, MessageSquareQuote } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { QuizPayload } from "@/modules/spark/types";

export function QuizCard({ payload }: { payload: QuizPayload }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  const difficulty = DIFFICULTY[payload.difficulty];

  return (
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-violet-200/40 bg-violet-50/30">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-violet-700">
            <HelpCircle className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-violet-700">
              Pregunta abierta
            </span>
            <span className="text-[12px] text-foreground/80">
              Articula tu respuesta antes de ver los criterios.
            </span>
          </div>
        </div>
        <span
          className="inline-flex items-center px-2.5 h-6 rounded-full text-[10px] font-mono uppercase tracking-[0.14em]"
          style={{
            background: difficulty.bg,
            color: difficulty.color,
            border: `1px solid ${difficulty.border}`,
          }}
        >
          {difficulty.label}
        </span>
      </header>

      <div className="p-5 rounded-xl border border-violet-200/60 bg-white">
        <div className="flex items-start gap-3">
          <MessageSquareQuote
            className="w-5 h-5 text-violet-500 shrink-0 mt-0.5"
            strokeWidth={1.5}
          />
          <p className="text-[15px] leading-relaxed text-foreground">{payload.question}</p>
        </div>
      </div>

      {!revealed ? (
        <div className="flex flex-col gap-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tu respuesta…"
            rows={4}
            className="border-violet-200/60 focus:border-violet-400"
          />
          <Button
            onClick={() => setRevealed(true)}
            disabled={answer.trim().length < 5}
            variant="outline"
            className="self-end border-violet-300 text-violet-700 hover:bg-violet-100"
          >
            Ver criterios esperados
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 engine-card-rise">
          <div className="p-4 rounded-xl bg-white/60 border border-black/[0.06]">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Tu respuesta
            </div>
            <p className="text-[14px] whitespace-pre-wrap text-foreground/90">{answer}</p>
          </div>
          <div className="flex flex-col gap-2 p-4 rounded-xl bg-violet-100/50 border border-violet-200/60">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-violet-800 mb-1">
              Conceptos esperados
            </div>
            <ul className="flex flex-col gap-2">
              {payload.expected_concepts.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[14px] text-foreground/90">
                  <Check className="w-3.5 h-3.5 text-violet-700 shrink-0 mt-1" strokeWidth={2.2} />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

const DIFFICULTY = {
  easy: {
    label: "Fácil",
    bg: "rgba(34, 197, 94, 0.10)",
    color: "rgb(21, 128, 61)",
    border: "rgba(34, 197, 94, 0.30)",
  },
  medium: {
    label: "Medio",
    bg: "rgba(245, 158, 11, 0.10)",
    color: "rgb(180, 83, 9)",
    border: "rgba(245, 158, 11, 0.30)",
  },
  hard: {
    label: "Difícil",
    bg: "rgba(239, 68, 68, 0.10)",
    color: "rgb(185, 28, 28)",
    border: "rgba(239, 68, 68, 0.30)",
  },
} as const;
