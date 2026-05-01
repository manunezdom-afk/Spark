"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { QuizPayload } from "@/modules/spark/types";

export function QuizCard({ payload }: { payload: QuizPayload }) {
  const [answer, setAnswer] = useState("");
  const [revealed, setRevealed] = useState(false);

  const difficultyLabel = {
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
  }[payload.difficulty];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Badge variant="spark">Pregunta abierta</Badge>
        <Badge>{difficultyLabel}</Badge>
      </div>

      <div className="p-5 rounded-xl border border-black/[0.07] bg-white/60">
        <p className="text-base leading-relaxed text-foreground">{payload.question}</p>
      </div>

      {!revealed ? (
        <>
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Tu respuesta…"
            rows={4}
          />
          <Button
            onClick={() => setRevealed(true)}
            disabled={answer.trim().length < 5}
            variant="outline"
            className="self-end"
          >
            Mostrar criterios
          </Button>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="p-4 rounded-xl bg-black/[0.02] border border-black/[0.06]">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Tu respuesta
            </div>
            <p className="text-sm whitespace-pre-wrap text-foreground/90">{answer}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark">
              Conceptos esperados
            </div>
            <ul className="flex flex-col gap-1.5">
              {payload.expected_concepts.map((c, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-foreground/90">
                  <Check className="w-3.5 h-3.5 text-spark shrink-0" strokeWidth={2} />
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
