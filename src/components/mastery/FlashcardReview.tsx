"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, FlaskConical, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { SparkFlashcard } from "@/modules/spark/types";

/**
 * Cuatro niveles de dificultad SM-2 con identidad visual propia. El color
 * comunica la calidad de la respuesta sin necesidad de leer el label.
 *   0 = Otra vez (rojo)   — no la sabía, vuelve pronto
 *   2 = Difícil (ámbar)   — la sabía con esfuerzo
 *   4 = Bien (cian)       — la tenía
 *   5 = Fácil (verde)     — inmediato, espacia más
 *
 * El número (1-4) sirve como atajo de teclado mostrado al usuario.
 */
const QUALITY_OPTIONS = [
  {
    quality: 0,
    label: "Otra vez",
    hint: "No la sabía",
    shortcut: "1",
    color: "rgb(220 38 38)",
    bg: "rgb(254 226 226 / 0.6)",
    border: "rgb(252 165 165 / 0.5)",
  },
  {
    quality: 2,
    label: "Difícil",
    hint: "Con esfuerzo",
    shortcut: "2",
    color: "rgb(217 119 6)",
    bg: "rgb(254 243 199 / 0.6)",
    border: "rgb(252 211 77 / 0.5)",
  },
  {
    quality: 4,
    label: "Bien",
    hint: "La tenía",
    shortcut: "3",
    color: "rgb(8 145 178)",
    bg: "rgb(207 250 254 / 0.6)",
    border: "rgb(103 232 249 / 0.5)",
  },
  {
    quality: 5,
    label: "Fácil",
    hint: "Inmediato",
    shortcut: "4",
    color: "rgb(5 150 105)",
    bg: "rgb(209 250 229 / 0.6)",
    border: "rgb(110 231 183 / 0.5)",
  },
];

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
  const wasEmptyInitially = useRef(initial.length === 0);
  const totalInitially = useRef(initial.length);
  const [queue, setQueue] = useState<SparkFlashcard[]>(initial);
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);

  const [demoIndex, setDemoIndex] = useState(0);
  const [demoRevealed, setDemoRevealed] = useState(false);
  const [demoDone, setDemoDone] = useState(false);
  const [demoHintVisible, setDemoHintVisible] = useState(false);

  const isDemoMode = wasEmptyInitially.current;
  const currentRevealed = isDemoMode ? demoRevealed : revealed;
  const isOnFinalState = isDemoMode ? demoDone : queue.length === 0;

  // Keyboard shortcuts:
  //   Space / Enter → revelar respuesta
  //   1 / 2 / 3 / 4 → puntuar dificultad (solo cuando reveal)
  useEffect(() => {
    if (isOnFinalState) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;

      if (!currentRevealed) {
        if (e.code === "Space" || e.code === "Enter") {
          e.preventDefault();
          if (isDemoMode) setDemoRevealed(true);
          else setRevealed(true);
        }
        return;
      }

      const map: Record<string, number> = { "1": 0, "2": 2, "3": 4, "4": 5 };
      if (e.key in map) {
        e.preventDefault();
        if (isDemoMode) advanceDemo();
        else void rate(map[e.key]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRevealed, isOnFinalState, isDemoMode, queue.length, demoIndex]);

  function advanceDemo() {
    const next = demoIndex + 1;
    if (next >= DEMO_CARDS.length) setDemoDone(true);
    else {
      setDemoIndex(next);
      setDemoRevealed(false);
      setDemoHintVisible(false);
    }
  }

  // ── Demo mode ──────────────────────────────────────────────────────────
  if (isDemoMode) {
    if (demoDone) {
      return (
        <DoneState
          title="¡Eso es todo por ahora!"
          body="Cuando completes sesiones reales, tus tarjetas aparecerán aquí programadas por memoria espaciada (SM-2)."
          ctaHref="/topics"
          ctaLabel="Ir a Temas →"
        />
      );
    }

    const card = DEMO_CARDS[demoIndex];
    const progress = ((demoIndex + (demoRevealed ? 0.5 : 0)) / DEMO_CARDS.length) * 100;

    return (
      <div className="flex flex-col gap-6 max-w-2xl mx-auto">
        <DemoBanner />
        <ProgressHeader
          current={demoIndex + 1}
          total={DEMO_CARDS.length}
          progress={progress}
        />
        <Flashcard
          front={card.front}
          back={card.back}
          hint={card.hint}
          revealed={demoRevealed}
          hintVisible={demoHintVisible}
          onShowHint={() => setDemoHintVisible(true)}
        />
        {!demoRevealed ? (
          <RevealButton onClick={() => setDemoRevealed(true)} />
        ) : (
          <QualityButtons onRate={() => advanceDemo()} disabled={false} />
        )}
        <KeyboardHint revealed={demoRevealed} />
      </div>
    );
  }

  // ── Real cards: queue empty → done state ───────────────────────────────
  if (queue.length === 0) {
    return (
      <DoneState
        title="¡Al día!"
        body="Repasaste todas las tarjetas de hoy. Spark las volverá a programar según cómo te fue."
        ctaHref="/dashboard"
        ctaLabel="Volver al inicio"
        celebrate
      />
    );
  }

  // ── Real card review ───────────────────────────────────────────────────
  const card = queue[0];
  const done = totalInitially.current - queue.length;
  const progress = ((done + (revealed ? 0.5 : 0)) / totalInitially.current) * 100;

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
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <ProgressHeader
        current={done + 1}
        total={totalInitially.current}
        progress={progress}
      />
      <Flashcard
        front={card.front}
        back={card.back}
        hint={card.hint}
        revealed={revealed}
        hintVisible={hintVisible}
        onShowHint={() => setHintVisible(true)}
      />
      {!revealed ? (
        <RevealButton onClick={() => setRevealed(true)} />
      ) : (
        <QualityButtons onRate={(q) => void rate(q)} disabled={busy} />
      )}
      <KeyboardHint revealed={revealed} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Subcomponents

function DemoBanner() {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-spark/15 bg-spark/[0.04] px-4 py-2.5">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-spark/25 bg-spark/[0.10] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-spark shrink-0">
        <FlaskConical className="h-3 w-3" strokeWidth={1.5} />
        Ejemplo
      </span>
      <p className="text-xs text-muted-foreground">
        Así funciona el repaso con memoria espaciada. Las tarjetas reales llegan
        al completar sesiones.
      </p>
    </div>
  );
}

function ProgressHeader({
  current,
  total,
  progress,
}: {
  current: number;
  total: number;
  progress: number;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground/70">
          Tarjeta {current} de {total}
        </span>
        <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground/70">
          {Math.min(Math.round(progress), 100)}%
        </span>
      </div>
      <div className="h-1 rounded-full bg-black/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-spark to-spark/70 transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Flashcard({
  front,
  back,
  hint,
  revealed,
  hintVisible,
  onShowHint,
}: {
  front: string;
  back: string;
  hint?: string | null;
  revealed: boolean;
  hintVisible: boolean;
  onShowHint: () => void;
}) {
  return (
    <div
      className="relative w-full"
      style={{ perspective: "1400px" }}
    >
      <div
        className="relative w-full min-h-[320px] transition-transform duration-500 ease-[cubic-bezier(0.45,0.05,0.15,1.0)]"
        style={{
          transformStyle: "preserve-3d",
          transform: revealed ? "rotateX(180deg)" : "rotateX(0deg)",
        }}
      >
        {/* Front (pregunta) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 px-8 py-10 rounded-3xl border border-black/[0.08] bg-gradient-to-br from-white via-white to-white/40 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_18px_40px_-12px_rgba(0,0,0,0.08)]"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-spark">
            <span className="w-1.5 h-1.5 rounded-full bg-spark" />
            Pregunta
          </span>
          <p className="text-2xl md:text-[26px] leading-[1.35] font-light text-foreground max-w-xl tracking-tight">
            {front}
          </p>
          {hint && !hintVisible && (
            <button
              onClick={onShowHint}
              className="text-[11.5px] text-muted-foreground/60 hover:text-muted-foreground underline underline-offset-2 transition-colors"
            >
              Ver pista
            </button>
          )}
          {hint && hintVisible && (
            <p className="text-xs italic text-muted-foreground max-w-md">
              {hint}
            </p>
          )}
        </div>

        {/* Back (respuesta) — rotated 180deg */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center gap-5 px-8 py-10 rounded-3xl border border-emerald-200/40 bg-gradient-to-br from-emerald-50/40 via-white to-white/40 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_18px_40px_-12px_rgba(0,0,0,0.08)]"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateX(180deg)",
          }}
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Respuesta
          </span>
          <p className="text-xl md:text-[22px] leading-[1.5] text-foreground max-w-xl">
            {back}
          </p>
        </div>
      </div>
    </div>
  );
}

function RevealButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      onClick={onClick}
      variant="outline"
      size="lg"
      className="self-center rounded-full px-7 group"
    >
      <Eye
        className="w-4 h-4 transition-transform group-hover:scale-110"
        strokeWidth={1.6}
      />
      Mostrar respuesta
    </Button>
  );
}

function QualityButtons({
  onRate,
  disabled,
}: {
  onRate: (quality: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 animate-[fade-up_240ms_ease-out_both]">
      {QUALITY_OPTIONS.map((q) => (
        <button
          key={q.quality}
          onClick={() => onRate(q.quality)}
          disabled={disabled}
          className="group relative flex flex-col items-center justify-center gap-1 rounded-2xl border px-4 py-3.5 text-[13px] font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none"
          style={{
            background: q.bg,
            borderColor: q.border,
            color: q.color,
          }}
        >
          <span className="absolute top-1.5 right-2 font-mono text-[9px] opacity-50 group-hover:opacity-100 transition-opacity">
            {q.shortcut}
          </span>
          <span>{q.label}</span>
          <span className="text-[10.5px] uppercase tracking-[0.12em] opacity-70 font-medium">
            {q.hint}
          </span>
        </button>
      ))}
    </div>
  );
}

function KeyboardHint({ revealed }: { revealed: boolean }) {
  return (
    <p className="text-center text-[10.5px] text-muted-foreground/50 font-mono uppercase tracking-[0.14em] hidden md:block">
      {revealed ? "Pulsa 1 · 2 · 3 · 4 para puntuar" : "Pulsa Espacio para revelar"}
    </p>
  );
}

function DoneState({
  title,
  body,
  ctaHref,
  ctaLabel,
  celebrate = false,
}: {
  title: string;
  body: string;
  ctaHref: string;
  ctaLabel: string;
  celebrate?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center py-20 gap-4 max-w-md mx-auto animate-fade-up">
      <span
        className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${
          celebrate
            ? "bg-emerald-50 border border-emerald-200/50 text-emerald-600"
            : "bg-spark/10 border border-spark/20 text-spark"
        }`}
      >
        {celebrate ? (
          <Sparkles className="w-6 h-6" strokeWidth={1.5} />
        ) : (
          <RotateCw className="w-6 h-6" strokeWidth={1.5} />
        )}
      </span>
      <h2 className="text-2xl font-light tracking-tight">{title}</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      <Button asChild variant="outline" className="mt-2 rounded-full">
        <Link href={ctaHref}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
