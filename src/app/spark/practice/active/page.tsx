'use client';

// /spark/practice/active — Mock practice screen.
// Receives ?name=...&method=...&mock=1 from /spark/session/new.
// This is a placeholder UI showing what a real practice session will look like
// once Nova generation + the engine runtime are wired up.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Sparkles, Check, X } from 'lucide-react';
import { METHODS, type StudyMethod } from '@/lib/spark/methods';

function PracticeView() {
  const params = useSearchParams();
  const name   = params.get('name')   ?? 'Tu práctica';
  const method = (params.get('method') ?? 'flashcards') as StudyMethod;
  const meta   = METHODS[method];

  const [revealed, setRevealed] = useState(false);

  // Mock card. Real implementation will pull from Nova-generated payloads.
  const mockCard = MOCK_CARDS[method];

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-8">

      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Salir
        </Link>
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="text-lg">{meta.emoji}</span>
          <span className="text-zinc-300">{meta.label}</span>
        </div>
      </div>

      {/* ── Session header ──────────────────────────────────── */}
      <header className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-widest text-orange-400/70">Sesión activa</p>
        <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-600">
          <span>Pregunta 1 de 1</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-amber-400/80">
            <Sparkles className="w-3 h-3" />
            modo demo
          </span>
        </div>
      </header>

      {/* ── Practice card ───────────────────────────────────── */}
      <section className="flex flex-col gap-5 p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08] min-h-[300px]">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">{mockCard.label}</p>
        <p className="text-lg md:text-xl text-zinc-100 leading-relaxed">{mockCard.front}</p>

        {revealed ? (
          <div className="flex flex-col gap-4 pt-3 border-t border-white/[0.06]">
            <p className="text-[11px] uppercase tracking-wider text-orange-400/70">Respuesta</p>
            <p className="text-zinc-300 text-sm md:text-base leading-relaxed">{mockCard.back}</p>

            <div className="flex gap-2 pt-2">
              <ResponseBtn variant="bad"  label="No la sabía"   />
              <ResponseBtn variant="ok"   label="Más o menos"   />
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

      {/* ── Demo banner ─────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
        <Loader2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-amber-300">Vista previa estática</p>
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            La generación real con Nova, el seguimiento de dominio (SM-2) y el guardado en
            Supabase están en desarrollo. Esta pantalla muestra cómo se sentirá la práctica.
          </p>
        </div>
      </div>

    </main>
  );
}

function ResponseBtn({
  variant,
  label,
}: {
  variant: 'bad' | 'ok' | 'good';
  label:   string;
}) {
  const styles =
    variant === 'good' ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10' :
    variant === 'ok'   ? 'border-amber-500/30   text-amber-300   hover:bg-amber-500/10'   :
                         'border-rose-500/30    text-rose-300    hover:bg-rose-500/10';

  const Icon = variant === 'good' ? Check : variant === 'bad' ? X : Sparkles;

  return (
    <button
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                  border bg-white/[0.02] text-xs font-medium transition-all ${styles}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// Mock content per method — illustrative only
const MOCK_CARDS: Record<StudyMethod, { label: string; front: string; back: string }> = {
  flashcards: {
    label: 'Flashcard 1',
    front: '¿Qué postula la espiral del silencio de Noelle-Neumann?',
    back:  'Que las personas tienden a callar sus opiniones cuando perciben que son minoritarias, lo que refuerza la opinión dominante.',
  },
  quiz: {
    label: 'Quiz · alternativas',
    front: 'El modelo de Lasswell describe el proceso comunicativo respondiendo a la pregunta:',
    back:  '"¿Quién dice qué, en qué canal, a quién y con qué efecto?" — fórmula clásica de comunicación lineal.',
  },
  simulation: {
    label: 'Simulación · pregunta 1/10',
    front: 'Define con tus palabras qué entiende la teoría crítica por "industria cultural" y da un ejemplo contemporáneo.',
    back:  'Concepto de Adorno y Horkheimer: producción industrializada de bienes culturales que homogeniza el pensamiento. Ejemplo: algoritmos de recomendación que estandarizan consumo.',
  },
  socratic: {
    label: 'Pregunta socrática',
    front: '¿Por qué crees que la teoría de la aguja hipodérmica perdió vigencia en investigación contemporánea?',
    back:  'Spark espera tu respuesta. Cada respuesta tuya genera la siguiente pregunta — sin atajos, sin definiciones gratis.',
  },
};

export default function PracticeActivePage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-6 animate-pulse">
          <div className="h-4 w-24 rounded-lg bg-white/5" />
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-60 rounded-3xl bg-white/5" />
        </main>
      }
    >
      <PracticeView />
    </Suspense>
  );
}
