"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SparkFlashcard } from "@/modules/spark/types";

const QUALITY_OPTIONS = [
  { quality: 0, label: "Otra vez", hint: "No lo sabía", tone: "destructive" as const },
  { quality: 2, label: "Difícil", hint: "Con esfuerzo", tone: "outline" as const },
  { quality: 4, label: "Bien", hint: "Lo tenía", tone: "outline" as const },
  { quality: 5, label: "Fácil", hint: "Inmediato", tone: "spark" as const },
];

export function FlashcardReview({ initial }: { initial: SparkFlashcard[] }) {
  const router = useRouter();
  const [queue, setQueue] = useState<SparkFlashcard[]>(initial);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-20 gap-3 max-w-md mx-auto">
        <RotateCw className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
        <h2 className="font-serif text-2xl">No hay tarjetas por repasar</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Vuelve más tarde. Spark programa tarjetas usando memoria espaciada (SM-2).
        </p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Volver al inicio
        </Button>
      </div>
    );
  }

  const card = queue[0];

  async function rate(quality: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/flashcards/${card.id}/review`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ quality }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      setQueue((q) => q.slice(1));
      setRevealed(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {queue.length} {queue.length === 1 ? "tarjeta" : "tarjetas"} pendientes
        </span>
      </div>

      <div className="p-8 rounded-lg border border-white/[0.10] bg-white/[0.03] min-h-[260px] flex flex-col items-center justify-center text-center gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark">
          {revealed ? "Respuesta" : "Pregunta"}
        </span>
        <p className="text-xl leading-relaxed max-w-2xl">
          {revealed ? card.back : card.front}
        </p>
        {!revealed && card.hint && (
          <p className="text-xs text-muted-foreground italic">Pista: {card.hint}</p>
        )}
      </div>

      {!revealed ? (
        <Button
          onClick={() => setRevealed(true)}
          variant="outline"
          size="lg"
          className="self-center"
        >
          <Eye className="w-4 h-4" strokeWidth={1.5} />
          Mostrar respuesta
        </Button>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {QUALITY_OPTIONS.map((q) => (
            <Button
              key={q.quality}
              onClick={() => rate(q.quality)}
              variant={q.tone}
              disabled={busy}
              className="h-auto flex-col items-stretch gap-1 py-3"
            >
              <span className="text-xs font-medium">{q.label}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] opacity-70">
                {q.hint}
              </span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
