// Spark dashboard — the home of active study practice in Focus OS.

import Link from 'next/link';
import { ArrowRight, BookOpenCheck, TrendingDown, History, Sparkles } from 'lucide-react';
import { SparkIcon } from '@/components/SparkIcon';
import { METHOD_ORDER, METHODS } from '@/lib/spark/methods';

export default function SparkDashboard() {
  return (
    <div className="min-h-screen bg-[#07080B] text-white overflow-hidden relative selection:bg-orange-500/30">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-orange-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-[#FB923C]/10 blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16 flex flex-col gap-12">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="flex items-center gap-4">
          <SparkIcon size={52} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-none">Spark</h1>
              <span className="text-[10px] font-medium tracking-widest uppercase text-orange-400/70 border border-orange-400/20 rounded-full px-2 py-0.5">
                Focus OS
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-1.5">
              Entrena para tus pruebas con práctica activa.
            </p>
          </div>
        </header>

        {/* ── Block 1: Primary CTA ────────────────────────────── */}
        <Link
          href="/spark/session/new"
          className="group relative overflow-hidden flex items-center gap-5 p-6 md:p-7 rounded-3xl
                     bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500
                     hover:from-orange-500 hover:via-orange-400 hover:to-amber-400
                     shadow-[0_0_50px_-12px_rgba(251,146,60,0.5)]
                     transition-all duration-300"
        >
          <div className="h-14 w-14 shrink-0 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-white" fill="currentColor" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-white">Nueva sesión de práctica</h2>
            <p className="text-sm text-white/80 mt-1">
              Pega tus apuntes, elige un método y Nova arma la práctica.
            </p>
          </div>
          <ArrowRight className="w-6 h-6 text-white shrink-0 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* ── Block 2: Study methods ──────────────────────────── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-medium text-zinc-200">Métodos de estudio</h2>
            <span className="text-xs text-zinc-600">elige uno y empieza</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {METHOD_ORDER.map((id) => {
              const m = METHODS[id];
              return (
                <Link
                  key={id}
                  href={`/spark/session/new?method=${id}`}
                  className="group flex flex-col gap-3 p-5 rounded-2xl
                             bg-white/[0.03] border border-white/[0.07]
                             hover:bg-white/[0.06] hover:border-orange-500/30
                             hover:shadow-[0_0_24px_-8px_rgba(251,146,60,0.3)]
                             transition-all duration-200"
                >
                  <span className="text-3xl leading-none">{m.emoji}</span>
                  <div>
                    <h3 className="font-semibold text-white text-sm group-hover:text-orange-300 transition-colors">
                      {m.label}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 leading-snug">{m.short}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Bottom row: Recent + Weaknesses ─────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Block 3: Recent sessions (empty state) */}
          <section className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-orange-400/70" />
              <h2 className="text-sm font-medium text-zinc-200">Sesiones recientes</h2>
            </div>
            <EmptyBlock
              title="Aún no hay sesiones"
              hint="Tu primera práctica aparecerá aquí con dominio y errores."
            />
          </section>

          {/* Block 4: Weaknesses (empty state) */}
          <section className="flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-400/70" />
              <h2 className="text-sm font-medium text-zinc-200">Debilidades detectadas</h2>
            </div>
            <EmptyBlock
              title="Sin datos todavía"
              hint="Tras tu primera sesión, Spark detectará los temas a reforzar."
            />
          </section>
        </div>

        {/* ── Footer note: ecosystem ──────────────────────────── */}
        <footer className="flex items-center gap-2 text-xs text-zinc-600 justify-center pt-4 border-t border-white/[0.04]">
          <BookOpenCheck className="w-3.5 h-3.5" />
          <span>
            Próximamente: importar apuntes desde <span className="text-zinc-500">Kairos</span> ·
            agendar repaso en <span className="text-zinc-500">Focus</span>
          </span>
        </footer>

      </main>
    </div>
  );
}

function EmptyBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-start gap-1 py-3">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-xs text-zinc-600 leading-relaxed">{hint}</p>
    </div>
  );
}
