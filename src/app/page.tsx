import Link from 'next/link';
import { ArrowRight, Brain, Flame, Trophy } from 'lucide-react';
import { SparkIcon } from '@/components/SparkIcon';
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from '@/modules/spark/engines';
import type { LearningEngine } from '@/modules/spark/types';

const ENGINES: { id: LearningEngine; emoji: string }[] = [
  { id: 'debugger',        emoji: '🐛' },
  { id: 'devils_advocate', emoji: '⚔️' },
  { id: 'roleplay',        emoji: '🎭' },
  { id: 'bridge_builder',  emoji: '🌉' },
  { id: 'socratic',        emoji: '🔍' },
];

const STATS = [
  { label: 'Sesiones completadas', value: '0',  icon: Brain  },
  { label: 'Dominio promedio',     value: '—',  icon: Trophy },
  { label: 'Racha actual',         value: '0d', icon: Flame  },
];

export default function SparkHome() {
  return (
    <div className="min-h-screen bg-[#07080B] text-white overflow-hidden relative selection:bg-orange-500/30">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-orange-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#FB923C]/10 blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-20 flex flex-col gap-14">

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex items-center gap-4">
          <SparkIcon size={52} />
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-none">
              Spark
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Coach de Aprendizaje de Alto Rendimiento
            </p>
          </div>
        </header>

        {/* ── Stats ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {STATS.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex flex-col gap-3 p-4 md:p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]"
            >
              <Icon className="w-4 h-4 text-orange-400/70" />
              <div>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-snug">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Primary CTA ────────────────────────────────────── */}
        <Link
          href="/spark"
          className="group flex items-center justify-center gap-3 w-full py-5 rounded-2xl
                     bg-gradient-to-r from-orange-600 to-orange-500
                     hover:from-orange-500 hover:to-orange-400
                     font-semibold text-lg text-white shadow-[0_0_40px_-8px_rgba(251,146,60,0.5)]
                     transition-all duration-300"
        >
          Nueva sesión
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* ── Engines grid ───────────────────────────────────── */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-zinc-200">5 Motores de Aprendizaje Activo</h2>
            <span className="text-xs text-zinc-600 uppercase tracking-widest">vs memorización pasiva</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {ENGINES.map(({ id, emoji }) => (
              <Link
                key={id}
                href={`/spark/session/new?engine=${id}`}
                className="group flex items-start gap-4 p-5 rounded-2xl
                           bg-white/[0.02] border border-white/[0.06]
                           hover:bg-white/[0.05] hover:border-orange-500/30
                           hover:shadow-[0_0_20px_-6px_rgba(251,146,60,0.2)]
                           transition-all duration-200"
              >
                <span className="text-2xl mt-0.5 shrink-0">{emoji}</span>
                <div className="min-w-0">
                  <h3 className="font-medium text-white group-hover:text-orange-300 transition-colors truncate">
                    {ENGINE_LABELS[id]}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                    {ENGINE_DESCRIPTIONS[id]}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Mission note ───────────────────────────────────── */}
        <p className="text-center text-xs text-zinc-600 leading-relaxed max-w-lg mx-auto">
          Spark usa repetición espaciada <span className="text-zinc-500">(SM-2)</span> y recall
          activo para construir dominio real — no memorización superficial.
          Integrado con Kairos y Focus.
        </p>

      </main>
    </div>
  );
}
