"use client";

import { useState } from "react";
import { Eye, AlertTriangle, Bug, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DebuggerPayload } from "@/modules/spark/types";

export function DebuggerInteractive({ payload }: { payload: DebuggerPayload }) {
  const [revealed, setRevealed] = useState(false);
  const sentences = splitIntoSentences(payload.text_with_errors);
  const [marked, setMarked] = useState<Set<number>>(new Set());

  function toggleSentence(i: number) {
    if (revealed) return;
    const next = new Set(marked);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setMarked(next);
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-orange-500/15 bg-orange-50/40 p-5">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-orange-100 text-orange-700">
            <Bug className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-orange-700">
              Caso · errores ocultos
            </span>
            <span className="text-[12px] text-foreground/80">
              {revealed
                ? "Veredicto en pantalla"
                : `Marca las oraciones sospechosas · ${marked.size} marcadas`}
            </span>
          </div>
        </div>
        {!revealed && (
          <Button
            onClick={() => setRevealed(true)}
            size="sm"
            variant="outline"
            className="border-orange-300/60 text-orange-700 hover:bg-orange-100"
          >
            <Eye className="w-3.5 h-3.5" strokeWidth={1.7} />
            Revelar errores
          </Button>
        )}
      </header>

      <div className="relative p-5 rounded-xl border border-black/[0.06] bg-white/80 leading-relaxed text-foreground/90 text-[14.5px]">
        {sentences.map((s, i) => {
          const isMarked = marked.has(i);
          return (
            <span
              key={i}
              onClick={() => toggleSentence(i)}
              className={`cursor-pointer transition-colors rounded-sm px-0.5 ${
                isMarked
                  ? "bg-orange-200/70 underline decoration-orange-500 decoration-2 underline-offset-4"
                  : revealed
                    ? ""
                    : "hover:bg-orange-100/70"
              }`}
            >
              {s}{" "}
            </span>
          );
        })}
      </div>

      {revealed && (
        <div className="flex flex-col gap-3 engine-card-rise">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-orange-700 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" strokeWidth={1.7} />
            {payload.errors.length} {payload.errors.length === 1 ? "error encontrado" : "errores encontrados"}
          </div>
          <ul className="flex flex-col gap-3">
            {payload.errors.map((e, idx) => (
              <li
                key={e.id}
                className="p-4 rounded-xl border border-orange-300/40 bg-white/85 flex flex-col gap-2 shadow-soft"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-center gap-2">
                  <span className="inline-flex w-6 h-6 rounded-md bg-orange-100 text-orange-700 items-center justify-center font-mono text-[10px] font-semibold">
                    {idx + 1}
                  </span>
                  <span className="text-[11px] text-muted-foreground italic">
                    En: {e.position_hint}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" strokeWidth={1.7} />
                  <div className="text-[14px] text-foreground/90">{e.correct_version}</div>
                </div>
                <div className="text-[12.5px] text-muted-foreground leading-relaxed pl-5">
                  {e.explanation}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function splitIntoSentences(text: string): string[] {
  // Conservative split on sentence terminators followed by space or newline.
  return text.split(/(?<=[.!?])\s+/).filter(Boolean);
}
