// /spark — Engine selector dashboard
// Renders the 5 learning engines as cards with mastery context.
// TODO: replace static data with Supabase queries once auth is wired.

import { Zap } from 'lucide-react';
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from '@/modules/spark/engines';
import type { LearningEngine } from '@/modules/spark/types';

const ENGINES: LearningEngine[] = [
  'debugger',
  'devils_advocate',
  'roleplay',
  'bridge_builder',
  'socratic',
];

const ENGINE_ICONS: Record<LearningEngine, string> = {
  debugger:        '🐛',
  devils_advocate: '⚔️',
  roleplay:        '🎭',
  bridge_builder:  '🌉',
  socratic:        '🔍',
};

export default function SparkHomePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-12">
      <header className="flex items-center gap-3">
        <Zap className="w-8 h-8 text-purple-400" fill="currentColor" />
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Spark <span className="text-purple-400">Engine</span>
          </h1>
          <p className="text-zinc-400 mt-1">Selecciona un motor de aprendizaje activo.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENGINES.map((engine) => (
          <a
            key={engine}
            href={`/spark/session/new?engine=${engine}`}
            className="group flex flex-col gap-3 p-6 rounded-2xl bg-white/[0.03] border border-white/8 backdrop-blur-xl transition-all duration-200 hover:bg-white/[0.07] hover:border-purple-500/40 hover:shadow-[0_0_24px_-6px_rgba(167,139,250,0.25)]"
          >
            <span className="text-3xl">{ENGINE_ICONS[engine]}</span>
            <div>
              <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors">
                {ENGINE_LABELS[engine]}
              </h3>
              <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                {ENGINE_DESCRIPTIONS[engine]}
              </p>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
