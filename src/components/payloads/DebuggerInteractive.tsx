"use client";

import { useState } from "react";
import { Eye, AlertTriangle } from "lucide-react";
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {revealed
            ? `Errores revelados`
            : `Marca las oraciones con error · ${marked.size} marcadas`}
        </span>
        {!revealed && (
          <Button onClick={() => setRevealed(true)} size="sm" variant="outline">
            <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
            Revelar
          </Button>
        )}
      </div>

      <div className="p-5 rounded-lg border border-white/[0.10] bg-white/[0.03] leading-relaxed">
        {sentences.map((s, i) => {
          const isMarked = marked.has(i);
          return (
            <span
              key={i}
              onClick={() => toggleSentence(i)}
              className={`cursor-pointer transition-colors ${
                isMarked
                  ? "bg-spark/20 border-b border-spark"
                  : "hover:bg-white/[0.04]"
              }`}
            >
              {s}{" "}
            </span>
          );
        })}
      </div>

      {revealed && (
        <div className="flex flex-col gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" strokeWidth={1.5} />
            {payload.errors.length} {payload.errors.length === 1 ? "error" : "errores"}
          </div>
          <ul className="flex flex-col gap-3">
            {payload.errors.map((e) => (
              <li
                key={e.id}
                className="p-4 rounded-md border border-spark/30 bg-spark/[0.04] flex flex-col gap-2"
              >
                <div className="text-xs text-muted-foreground italic">
                  En: {e.position_hint}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="text-sm">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark mr-2">
                      Correcto
                    </span>
                    {e.correct_version}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {e.explanation}
                  </div>
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
