"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { FlashcardPayload } from "@/modules/spark/types";

export function FlashcardCarousel({ payload }: { payload: FlashcardPayload }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = payload.cards.length;
  const card = payload.cards[index];

  function next() {
    setFlipped(false);
    setIndex((i) => Math.min(total - 1, i + 1));
  }
  function prev() {
    setFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  if (!card) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Tarjeta {index + 1} de {total}
        </span>
        <button
          onClick={() => setFlipped((f) => !f)}
          className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground hover:text-spark inline-flex items-center gap-1"
        >
          <RotateCw className="w-3 h-3" strokeWidth={1.5} />
          Voltear
        </button>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className={cn(
          "p-6 rounded-2xl border min-h-[180px] flex items-center justify-center text-center transition-colors",
          flipped
            ? "bg-spark/[0.05] border-spark/30"
            : "bg-white/60 border-black/[0.08] hover:bg-white"
        )}
      >
        <div className="flex flex-col gap-3">
          <div
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.16em]",
              flipped ? "text-spark" : "text-muted-foreground"
            )}
          >
            {flipped ? "Respuesta" : "Pregunta"}
          </div>
          <div className="text-base leading-relaxed">{flipped ? card.back : card.front}</div>
          {!flipped && card.hint && (
            <div className="text-xs text-muted-foreground italic">Pista: {card.hint}</div>
          )}
        </div>
      </button>

      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={index === 0}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          Anterior
        </button>
        <button
          onClick={next}
          disabled={index === total - 1}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
