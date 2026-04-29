// Spark dashboard — home of active study practice in Focus OS.
// Nova is the AI heart of the ecosystem and must be front and center.

import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
} from 'lucide-react';
import { SparkIcon } from '@/components/SparkIcon';
import { HowItWorks } from '@/components/HowItWorks';
import { MethodCards } from '@/components/MethodCards';
import { RecentDataPanels } from '@/components/RecentSessions';

export default function SparkDashboard() {
  return (
    <div className="min-h-screen bg-[#07080B] text-white overflow-hidden relative selection:bg-orange-500/30">
      {/* Ambient gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full bg-orange-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[45%] h-[45%] rounded-full bg-violet-900/10 blur-[140px]" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16 flex flex-col gap-10">

        {/* ── Header ───────────────────────────────────────────── */}
        <header className="flex items-center gap-4">
          <SparkIcon size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight leading-none">
                Spark
              </h1>
              <span className="text-[10px] font-medium tracking-widest uppercase
                               text-orange-400/70 border border-orange-400/20 rounded-full px-2 py-0.5">
                Focus OS
              </span>
            </div>
            <p className="text-zinc-400 text-sm mt-1.5">
              Entrena para tus pruebas con práctica activa.
            </p>
          </div>
        </header>

        {/* ── Nova card ─────────────────────────────────────────
            Nova is the AI heart of Focus OS. She lives here,
            not hidden in a button label.                        */}
        <section className="relative overflow-hidden rounded-3xl
                            bg-gradient-to-br from-violet-950/90 via-violet-900/50 to-purple-900/30
                            border border-violet-500/20
                            shadow-[0_0_60px_-16px_rgba(139,92,246,0.35)]">
          {/* Background glow */}
          <div className="absolute top-0 right-0 w-[50%] h-[120%] rounded-full
                          bg-violet-500/10 blur-[70px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center
                          gap-6 p-6 md:p-8">
            {/* Nova identity */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/20 border border-violet-400/20
                                flex items-center justify-center">
                  <Brain className="w-7 h-7 text-violet-300" />
                </div>
                {/* Online dot */}
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400
                                 border-2 border-[#07080B] animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white">Nova</span>
                  <span className="text-[10px] uppercase tracking-wider font-medium
                                   text-violet-300 border border-violet-500/40 rounded-full px-2 py-0.5">
                    IA
                  </span>
                </div>
                <p className="text-xs text-violet-300/60 mt-0.5">Inteligencia de Focus OS</p>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-300 leading-relaxed">
                Nova analiza tus apuntes y genera{' '}
                <span className="text-white font-medium">
                  flashcards, preguntas y simulaciones
                </span>{' '}
                personalizadas para tu prueba — en segundos.
                No estudias más: <span className="text-violet-300">entrenas</span>.
              </p>
            </div>

            {/* CTA */}
            <Link
              href="/spark/session/new"
              className="group shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl
                         bg-violet-500 hover:bg-violet-400
                         text-white text-sm font-semibold
                         shadow-[0_0_20px_-4px_rgba(139,92,246,0.5)]
                         transition-all duration-200 whitespace-nowrap"
            >
              Empezar con Nova
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ── How it works (animated mini-tutorial) ───────────── */}
        <HowItWorks />

        {/* ── Methods grid (with hover mini-tutorials) ─────── */}
        <MethodCards />

        {/* ── Recent + Weaknesses (hydrated from localStorage) ── */}
        <RecentDataPanels />

        {/* ── Footer ──────────────────────────────────────────── */}
        <footer className="flex items-center gap-2 text-xs text-zinc-700
                           justify-center pt-4 border-t border-white/[0.04]">
          <BookOpenCheck className="w-3.5 h-3.5" />
          <span>
            Próximamente: importar apuntes desde{' '}
            <span className="text-zinc-500">Kairos</span> ·
            agendar repaso en{' '}
            <span className="text-zinc-500">Focus</span>
          </span>
        </footer>

      </main>
    </div>
  );
}

