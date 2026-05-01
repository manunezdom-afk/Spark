"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, FlaskConical, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SparkFlashcard } from "@/modules/spark/types";

const QUALITY_OPTIONS = [
  { quality: 0, label: "Otra vez", hint: "No lo sabía", tone: "destructive" as const },
  { quality: 2, label: "Difícil", hint: "Con esfuerzo", tone: "outline" as const },
  { quality: 4, label: "Bien", hint: "Lo tenía", tone: "outline" as const },
  { quality: 5, label: "Fácil", hint: "Inmediato", tone: "spark" as const },
];

// ── Demo flashcards shown when no real cards are due ──────────────────────
type DemoCard = { id: string; front: string; back: string; hint?: string };

const DEMO_CARDS: DemoCard[] = [
  {
    id: "demo-1",
    front: "¿Qué es el marketing de intención?",
    back: "Captura usuarios que ya buscan activamente un producto o servicio (ej. Google Ads, SEO). El usuario tiene una necesidad declarada.",
    hint: "Piensa en qué hace el usuario antes de ver el anuncio",
  },
  {
    id: "demo-2",
    front: "¿Cuál es la diferencia entre búsqueda con intención y descubrimiento pasivo?",
    back: "Intención: el usuario busca activamente. Descubrimiento: el contenido aparece sin que el usuario lo pidiera (Instagram, TikTok).",
    hint: "Piensa en el estado mental del usuario al momento de ver el contenido",
  },
  {
    id: "demo-3",
    front: "¿Qué es la disonancia cognitiva post-compra?",
    back: "Incomodidad psicológica que siente el consumidor después de tomar una decisión de compra, especialmente si fue costosa o irreversible.",
    hint: "Ocurre en la última fase del proceso de decisión de compra",
  },
];

export function FlashcardReview({ initial }: { initial: SparkFlashcard[] }) {
  const router = useRouter();
  const wasEmptyInitially = useRef(initial.length === 0);
  const [queue, setQueue] = useState<SparkFlashcard[]>(initial);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);

  const [hintVisible, setHintVisible] = useState(false);

  // Demo mode state
  const [demoIndex, setDemoIndex] = useState(0);
  const [demoRevealed, setDemoRevealed] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [demoHintVisible, setDemoHintVisible] = useState(false);

  // ── Demo mode ──────────────────────────────────────────────────────────
  if (wasEmptyInitially.current) {
    if (demoDone) {
      return (
        <div className="flex flex-col items-center text-center py-16 gap-4 max-w-sm mx-auto">
          <RotateCw className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-xl font-semibold">¡Eso es todo por ahora!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cuando completes sesiones reales, tus tarjetas aparecerán aquí
            programadas por memoria espaciada (SM-2).
          </p>
          <Button asChild variant="outline">
            <Link href="/topics">Ir a Temas →</Link>
          </Button>
        </div>
      );
    }

    const card = DEMO_CARDS[demoIndex];
    return (
      <div className="flex flex-col gap-6">
        {/* Demo banner */}
        <div className="flex items-center gap-2.5 rounded-xl border border-black/[0.07] bg-white/60 px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-spark/20 bg-spark/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-spark shrink-0">
            <FlaskConical className="h-3 w-3" strokeWidth={1.5} />
            Ejemplo
          </span>
          <p className="text-xs text-muted-foreground">
            Así funciona el repaso con memoria espaciada. Las tarjetas reales
            llegan al completar una sesión.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {demoIndex + 1} / {DEMO_CARDS.length} tarjetas
          </span>
        </div>

        <div className="p-8 rounded-2xl border border-black/[0.07] bg-white/60 min-h-[260px] flex flex-col items-center justify-center text-center gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark">
            {demoRevealed ? "Respuesta" : "Pregunta"}
          </span>
          <p className="text-xl leading-relaxed max-w-2xl text-foreground">
            {demoRevealed ? card.back : card.front}
          </p>
          {!demoRevealed && card.hint && (
            demoHintVisible ? (
              <p className="text-xs text-muted-foreground italic">Pista: {card.hint}</p>
            ) : (
              <button
                onClick={() => setDemoHintVisible(true)}
                className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2 transition-colors"
              >
                Ver pista
              </button>
            )
          )}
        </div>

        {!demoRevealed ? (
          <Button
            onClick={() => setDemoRevealed(true)}
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
                onClick={() => {
                  const next = demoIndex + 1;
                  if (next >= DEMO_CARDS.length) {
                    setDemoDone(true);
                  } else {
                    setDemoIndex(next);
                    setDemoRevealed(false);
                    setDemoHintVisible(false);
                  }
                }}
                variant={q.tone}
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

  // ── Real cards done (started with real cards, queue now empty) ────────
  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center text-center py-20 gap-3 max-w-md mx-auto">
        <RotateCw className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
        <h2 className="text-2xl font-semibold">¡Al día!</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Repasaste todas las tarjetas de hoy. Spark las volverá a programar
          según cómo te fue.
        </p>
        <Button onClick={() => router.push("/")} variant="outline">
          Volver al inicio
        </Button>
      </div>
    );
  }

  // ── Real card review ───────────────────────────────────────────────────
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
      setHintVisible(false);
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

      <div className="p-8 rounded-2xl border border-black/[0.07] bg-white/60 min-h-[260px] flex flex-col items-center justify-center text-center gap-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark">
          {revealed ? "Respuesta" : "Pregunta"}
        </span>
        <p className="text-xl leading-relaxed max-w-2xl text-foreground">
          {revealed ? card.back : card.front}
        </p>
        {!revealed && card.hint && (
          hintVisible ? (
            <p className="text-xs text-muted-foreground italic">Pista: {card.hint}</p>
          ) : (
            <button
              onClick={() => setHintVisible(true)}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground underline underline-offset-2 transition-colors"
            >
              Ver pista
            </button>
          )
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
