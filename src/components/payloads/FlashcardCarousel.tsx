"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Layers, RotateCw } from "lucide-react";
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
    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-violet-200/40 bg-violet-50/30">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-violet-100 text-violet-700">
            <Layers className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-violet-700">
              Tarjeta de repaso
            </span>
            <span className="text-[12px] text-foreground/80">
              {index + 1} de {total}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-violet-500" : "w-1.5 bg-violet-200",
              )}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => setFlipped((f) => !f)}
        className="group relative w-full min-h-[200px] perspective-1000"
        style={{ perspective: "1000px" }}
      >
        <div
          className="relative w-full min-h-[200px] transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 p-6 rounded-2xl border border-violet-200/60 bg-white shadow-soft flex flex-col items-center justify-center text-center gap-3"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-violet-700">
              Pregunta
            </span>
            <p className="text-[16px] leading-relaxed font-medium text-foreground">
              {card.front}
            </p>
            {card.hint && (
              <p className="text-[12px] text-muted-foreground italic mt-1">
                Pista: {card.hint}
              </p>
            )}
            <span className="absolute bottom-4 right-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity">
              <RotateCw className="w-3 h-3" strokeWidth={1.7} />
              voltear
            </span>
          </div>
          <div
            className="absolute inset-0 p-6 rounded-2xl border border-violet-300/70 bg-violet-100/40 flex flex-col items-center justify-center text-center gap-3"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-violet-800">
              Respuesta
            </span>
            <p className="text-[16px] leading-relaxed text-foreground">
              {card.back}
            </p>
          </div>
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
          onClick={() => setFlipped((f) => !f)}
          className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-[11px] font-medium uppercase tracking-[0.14em] text-violet-700 bg-violet-100 hover:bg-violet-200 transition-colors"
        >
          <RotateCw className="w-3 h-3" strokeWidth={1.7} />
          {flipped ? "Pregunta" : "Respuesta"}
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
