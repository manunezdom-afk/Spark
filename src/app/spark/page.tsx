// /spark — Engine selector
// User picks a learning engine and gets routed to /spark/session/new?engine=X
// TODO: load real mastery scores from Supabase once auth is wired.

import Link from 'next/link';
import { SparkIcon } from '@/components/SparkIcon';
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from '@/modules/spark/engines';
import type { LearningEngine } from '@/modules/spark/types';

const ENGINES: { id: LearningEngine; emoji: string; color: string }[] = [
  { id: 'debugger',        emoji: '🐛', color: 'text-emerald-400' },
  { id: 'devils_advocate', emoji: '⚔️', color: 'text-red-400'     },
  { id: 'roleplay',        emoji: '🎭', color: 'text-violet-400'  },
  { id: 'bridge_builder',  emoji: '🌉', color: 'text-sky-400'     },
  { id: 'socratic',        emoji: '🔍', color: 'text-amber-400'   },
];

// Placeholder mastery until Supabase query is wired
const MASTERY: Record<LearningEngine, number | null> = {
  debugger:        null,
  devils_advocate: null,
  roleplay:        null,
  bridge_builder:  null,
  socratic:        null,
};

export default function SparkHomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">

      {/* ── Header ───────────────────────────────────────────── */}
      <header className="flex items-center gap-4">
        <SparkIcon size={44} />
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Spark <span className="text-orange-400">Engine</span>
          </h1>
          <p className="text-zinc-400 mt-1 text-sm">
            Elige un motor — cada sesión obliga al conocimiento a consolidarse.
          </p>
        </div>
      </header>

      {/* ── What is each engine ──────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <p className="text-xs text-zinc-600 uppercase tracking-widest">Selecciona un motor</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ENGINES.map(({ id, emoji, color }) => {
            const mastery = MASTERY[id];
            return (
              <Link
                key={id}
                href={`/spark/session/new?engine=${id}`}
                className="group flex flex-col gap-4 p-6 rounded-2xl
                           bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl
                           transition-all duration-200
                           hover:bg-white/[0.07] hover:border-orange-500/40
                           hover:shadow-[0_0_24px_-6px_rgba(251,146,60,0.25)]"
              >
                {/* Top row: emoji + mastery badge */}
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{emoji}</span>
                  {mastery !== null ? (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                                      bg-orange-400/10 text-orange-400 border border-orange-400/20`}>
                      {mastery}% dominio
                    </span>
                  ) : (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full
                                     bg-white/5 text-zinc-600 border border-white/10">
                      sin datos
                    </span>
                  )}
                </div>

                {/* Engine info */}
                <div>
                  <h3 className={`font-semibold text-white group-hover:${color} transition-colors`}>
                    {ENGINE_LABELS[id]}
                  </h3>
                  <p className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
                    {ENGINE_DESCRIPTIONS[id]}
                  </p>
                </div>

                {/* CTA hint */}
                <p className="text-xs text-zinc-600 group-hover:text-orange-400/60 transition-colors mt-auto">
                  Empezar sesión →
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Bottom note ──────────────────────────────────────── */}
      <p className="text-xs text-zinc-700 text-center">
        Los temas disponibles se cargan desde Kairos — conecta tu cuenta para ver tus notas.
      </p>

    </main>
  );
}
