// MethodCards — method grid with hover-expand mini-tutorials.
// Each card reveals a mini preview of what that method looks like in practice,
// so users know what they're choosing before they click.
// Pure CSS hover — no client JS needed.

import Link from 'next/link';
import { Check, Layers, ListChecks, Timer, MessageCircle, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { METHOD_ORDER, METHODS } from '@/lib/spark/methods';
import type { StudyMethod } from '@/lib/spark/methods';

const METHOD_ICONS: Record<StudyMethod, LucideIcon> = {
  flashcards: Layers,
  quiz:       ListChecks,
  simulation: Timer,
  socratic:   MessageCircle,
};

// ── Mini-tutorial previews ────────────────────────────────────
// Shown on hover. Each one is a realistic sample of what that
// method produces so users know what they're getting into.

function FlashcardPreview() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">Así se ve</span>
      <div className="p-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-zinc-300 leading-relaxed">
        ¿Qué postula la espiral del silencio?
      </div>
      <div className="p-3 rounded-lg bg-[#C97B3F]/5 border border-[#C97B3F]/12 text-xs text-zinc-400 leading-relaxed">
        Las personas tienden a callar opiniones que perciben como minoritarias,
        reforzando la opinión dominante.
      </div>
      <p className="text-[10px] text-zinc-700 mt-0.5">
        Lee → piensa → voltea → evalúa tu dominio
      </p>
    </div>
  );
}

function QuizPreview() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">Así se ve</span>
      <p className="text-[11px] text-zinc-300 leading-snug">
        ¿Cuál es la fórmula del modelo de Lasswell?
      </p>
      <div className="flex flex-col gap-1">
        {[
          { text: '¿Quién? → ¿Qué? → ¿A quién?',                              correct: false },
          { text: '¿Quién dice qué, en qué canal, a quién y con qué efecto?',  correct: true  },
          { text: '¿Por qué? → ¿Cómo? → ¿Cuándo?',                            correct: false },
        ].map((opt, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-lg
                        ${opt.correct
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                          : 'bg-white/[0.02] border border-white/[0.05] text-zinc-600'}`}
          >
            {opt.correct && <Check className="w-3 h-3 shrink-0" />}
            <span className="truncate">{opt.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SimulationPreview() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">Así se ve</span>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-[#C97B3F] font-semibold">12:45</span>
        <span className="text-[11px] text-zinc-500">Pregunta 3 / 10</span>
      </div>
      <div className="w-full h-1 rounded-full bg-white/[0.05]">
        <div className="h-full w-[30%] rounded-full bg-[#C97B3F]/40" />
      </div>
      <p className="text-[11px] text-zinc-400 leading-snug">
        Define qué entiende la teoría crítica por "industria cultural"
        y da un ejemplo contemporáneo.
      </p>
    </div>
  );
}

function SocraticPreview() {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] uppercase tracking-wider text-zinc-600">Así se ve</span>
      <div className="flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <Brain className="w-2.5 h-2.5 text-violet-400" />
        </div>
        <div className="p-2.5 rounded-xl rounded-tl-none bg-violet-500/8 border border-violet-500/20
                        text-[11px] text-zinc-300 leading-relaxed">
          ¿Por qué crees que esa teoría perdió vigencia en la investigación actual?
        </div>
      </div>
      <p className="text-[10px] text-zinc-700">
        Nova nunca da la respuesta — solo pregunta más profundo
      </p>
    </div>
  );
}

const METHOD_PREVIEWS: Record<StudyMethod, React.ReactNode> = {
  flashcards: <FlashcardPreview />,
  quiz:       <QuizPreview />,
  simulation: <SimulationPreview />,
  socratic:   <SocraticPreview />,
};

// ── Main export ───────────────────────────────────────────────
export function MethodCards() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-base font-medium text-zinc-200">Métodos de estudio</h2>
        <span className="hidden md:block text-xs text-zinc-600">
          pasa el cursor para ver cómo funciona cada uno
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {METHOD_ORDER.map((id) => {
          const m    = METHODS[id];
          const Icon = METHOD_ICONS[id];
          return (
            <Link
              key={id}
              href={`/spark/session/new?method=${id}`}
              className="group flex flex-col gap-4 p-5 rounded-2xl
                         bg-white/[0.03] border border-white/[0.07]
                         hover:bg-white/[0.05] hover:border-[#C97B3F]/25
                         transition-all duration-300"
            >
              {/* ── Always visible ── */}
              <div className="flex flex-col gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#C97B3F]/10 border border-[#C97B3F]/10
                                flex items-center justify-center
                                group-hover:bg-[#C97B3F]/15 group-hover:border-[#C97B3F]/20
                                transition-all duration-300">
                  <Icon className="w-4 h-4 text-[#C97B3F]" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm
                                 group-hover:text-[#D4894A] transition-colors duration-200">
                    {m.label}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{m.short}</p>
                </div>
              </div>

              {/* ── Mini-tutorial preview — expands on hover ── */}
              <div className="overflow-hidden max-h-0 group-hover:max-h-52
                              transition-all duration-300 ease-out">
                <div className="pt-3 border-t border-white/[0.06]
                                opacity-0 group-hover:opacity-100
                                transition-opacity duration-200 delay-150">
                  {METHOD_PREVIEWS[id]}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
