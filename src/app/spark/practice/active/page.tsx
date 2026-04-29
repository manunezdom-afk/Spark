'use client';

// /spark/practice/active — Practice screen (mock).
// Receives ?name=...&method=... from /spark/session/new.
// Shows an animated method-specific guide on first load so users
// know exactly what to do in each type of practice.

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Brain, Check, X, Layers,
  ListChecks, Timer, MessageCircle, ChevronRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { METHODS, type StudyMethod } from '@/lib/spark/methods';

// ── Method icons (no emojis) ──────────────────────────────────
const METHOD_ICONS: Record<StudyMethod, LucideIcon> = {
  flashcards: Layers,
  quiz:       ListChecks,
  simulation: Timer,
  socratic:   MessageCircle,
};

// ── Per-method guide steps ────────────────────────────────────
// Shown as an animated step-indicator on first load.
// Teaches the user what to do before they start practicing.

const METHOD_GUIDE: Record<StudyMethod, { step: string; desc: string }[]> = {
  flashcards: [
    { step: 'Lee',       desc: 'Lee la pregunta con calma' },
    { step: 'Piensa',    desc: 'Responde mentalmente antes de revelar' },
    { step: 'Revela',    desc: 'Descubre la respuesta correcta' },
    { step: 'Evalúa',    desc: 'Dime qué tan bien la sabías' },
  ],
  quiz: [
    { step: 'Lee',       desc: 'Lee la pregunta completa' },
    { step: 'Analiza',   desc: 'Considera cada alternativa' },
    { step: 'Elige',     desc: 'Selecciona la opción correcta' },
    { step: 'Confirma',  desc: 'Revisa el resultado' },
  ],
  simulation: [
    { step: 'Atiende',   desc: 'Observa el tiempo restante' },
    { step: 'Responde',  desc: 'Contesta con tus palabras' },
    { step: 'Avanza',    desc: 'No te detengas — ritmo de prueba real' },
    { step: 'Revisa',    desc: 'Evalúa tu desempeño al finalizar' },
  ],
  socratic: [
    { step: 'Lee',       desc: 'Lee la pregunta de Nova' },
    { step: 'Reflexiona', desc: 'No hay respuesta correcta única' },
    { step: 'Responde',  desc: 'Escribe con tus propias palabras' },
    { step: 'Profundiza', desc: 'Nova preguntará más profundo' },
  ],
};

// ── Animated guide component ──────────────────────────────────
// Auto-advances through steps on mount so users understand the flow.
// Disappears once complete so it doesn't clutter the practice.

function MethodGuide({ method }: { method: StudyMethod }) {
  const steps    = METHOD_GUIDE[method];
  const [active, setActive] = useState(0);
  const [done,   setDone]   = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(t);
          setTimeout(() => setDone(true), 900);
          return prev;
        }
        return prev + 1;
      });
    }, 1600);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (done) return null;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]
                    transition-all duration-500">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Cómo funciona este modo</p>
      <div className="flex items-start gap-2 overflow-x-auto pb-1 scrollbar-none">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 shrink-0 transition-all duration-500
                        ${i === active
                          ? 'opacity-100'
                          : i < active
                            ? 'opacity-40'
                            : 'opacity-20'}`}
          >
            {/* Step chip */}
            <div className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl
                             border transition-all duration-500
                             ${i === active
                               ? 'bg-orange-500/10 border-orange-500/30'
                               : i < active
                                 ? 'bg-white/[0.02] border-white/[0.05]'
                                 : 'bg-transparent border-white/[0.04]'}`}>
              <span className={`text-[11px] font-semibold transition-colors duration-300
                                ${i === active ? 'text-orange-300' : i < active ? 'text-zinc-500' : 'text-zinc-700'}`}>
                {s.step}
              </span>
              {i === active && (
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">{s.desc}</span>
              )}
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <ChevronRight className={`w-3 h-3 shrink-0 transition-colors duration-500
                                        ${i < active ? 'text-zinc-600' : 'text-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Practice view ─────────────────────────────────────────────
function PracticeView() {
  const params   = useSearchParams();
  const name     = params.get('name')   ?? 'Tu práctica';
  const method   = (params.get('method') ?? 'flashcards') as StudyMethod;
  const meta     = METHODS[method];
  const Icon     = METHOD_ICONS[method];
  const mockCard = MOCK_CARDS[method];

  const [revealed, setRevealed] = useState(false);

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Salir
        </Link>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                        bg-white/[0.03] border border-white/[0.07]">
          <Icon className="w-3.5 h-3.5 text-orange-400" />
          <span className="text-xs text-zinc-300 font-medium">{meta.label}</span>
        </div>
      </div>

      {/* ── Session header ────────────────────────────────── */}
      <header className="flex flex-col gap-1.5">
        <p className="text-[10px] uppercase tracking-widest text-orange-400/70">Sesión activa</p>
        <h1 className="text-2xl font-semibold tracking-tight leading-tight">{name}</h1>
        <div className="flex items-center gap-2 text-xs text-zinc-600">
          <span>Pregunta 1 de 1</span>
          <span>·</span>
          <div className="flex items-center gap-1 text-violet-400/70">
            <Brain className="w-3 h-3" />
            <span>generado por Nova</span>
          </div>
        </div>
      </header>

      {/* ── Animated method guide ─────────────────────────── */}
      <MethodGuide method={method} />

      {/* ── Practice card ─────────────────────────────────── */}
      <section className="flex flex-col gap-5 p-6 md:p-8 rounded-3xl
                          bg-white/[0.03] border border-white/[0.08] min-h-[260px]">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">{mockCard.label}</p>
        <p className="text-lg md:text-xl text-zinc-100 leading-relaxed">{mockCard.front}</p>

        {revealed ? (
          <div className="flex flex-col gap-4 pt-3 border-t border-white/[0.06]
                          animate-in fade-in slide-in-from-bottom-2 duration-300">
            <p className="text-[11px] uppercase tracking-wider text-orange-400/70">Respuesta</p>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed">{mockCard.back}</p>
            <div className="flex gap-2 pt-2">
              <ResponseBtn variant="bad"  label="No la sabía"  />
              <ResponseBtn variant="ok"   label="Más o menos"  />
              <ResponseBtn variant="good" label="La domino"    />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setRevealed(true)}
            className="mt-auto flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm font-medium
                       hover:bg-orange-500/15 hover:border-orange-500/50 transition-all"
          >
            Revelar respuesta
          </button>
        )}
      </section>

      {/* ── Demo notice ───────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/5 border border-violet-500/15">
        <Brain className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-medium text-violet-300">Vista previa · Nova en desarrollo</p>
          <p className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
            La generación real con Nova, seguimiento de dominio (SM-2) y guardado en
            Supabase están en desarrollo. Esta pantalla muestra cómo se sentirá la práctica.
          </p>
        </div>
      </div>

    </main>
  );
}

// ── Response buttons ──────────────────────────────────────────
function ResponseBtn({ variant, label }: { variant: 'bad' | 'ok' | 'good'; label: string }) {
  const styles =
    variant === 'good' ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10' :
    variant === 'ok'   ? 'border-amber-500/30   text-amber-300   hover:bg-amber-500/10'   :
                         'border-rose-500/30    text-rose-300    hover:bg-rose-500/10';
  const Icon = variant === 'good' ? Check : variant === 'bad' ? X : MessageCircle;
  return (
    <button className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                        border bg-white/[0.02] text-xs font-medium transition-all ${styles}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ── Mock card content per method ──────────────────────────────
const MOCK_CARDS: Record<StudyMethod, { label: string; front: string; back: string }> = {
  flashcards: {
    label: 'Flashcard 1',
    front: '¿Qué postula la espiral del silencio de Noelle-Neumann?',
    back:  'Que las personas tienden a callar sus opiniones cuando las perciben como minoritarias, reforzando la opinión dominante.',
  },
  quiz: {
    label: 'Quiz · alternativas',
    front: 'El modelo de Lasswell describe el proceso comunicativo respondiendo a la pregunta:',
    back:  '"¿Quién dice qué, en qué canal, a quién y con qué efecto?" — fórmula clásica de comunicación lineal.',
  },
  simulation: {
    label: 'Simulación · pregunta 1/10',
    front: 'Define con tus palabras qué entiende la teoría crítica por "industria cultural" y da un ejemplo contemporáneo.',
    back:  'Concepto de Adorno y Horkheimer: producción industrializada de bienes culturales que homogeniza el pensamiento. Ej: algoritmos de recomendación que estandarizan consumo.',
  },
  socratic: {
    label: 'Pregunta socrática · Nova',
    front: '¿Por qué crees que la teoría de la aguja hipodérmica perdió vigencia en la investigación contemporánea?',
    back:  'Nova espera tu respuesta. Cada respuesta genera la siguiente pregunta — sin atajos, sin definiciones gratis.',
  },
};

// ── Page wrapper ──────────────────────────────────────────────
export default function PracticeActivePage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-6 animate-pulse">
          <div className="h-4 w-24 rounded-lg bg-white/5" />
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-20 rounded-2xl bg-white/5" />
          <div className="h-60 rounded-3xl bg-white/5" />
        </main>
      }
    >
      <PracticeView />
    </Suspense>
  );
}
