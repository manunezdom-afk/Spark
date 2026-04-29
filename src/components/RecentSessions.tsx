'use client';

// RecentSessions — hydrates the dashboard's "Sesiones recientes" and
// "Debilidades detectadas" panels from localStorage. Replaced by the
// Supabase-backed history once auth + persistence are wired.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  History, TrendingDown, Layers, ListChecks, Timer, MessageCircle,
  ArrowRight, Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  listSessions, aggregateWeaknesses, clearSessions,
  type StoredSession,
} from '@/lib/spark/storage';
import type { StudyMethod } from '@/lib/spark/methods';

const METHOD_ICONS: Record<StudyMethod, LucideIcon> = {
  flashcards: Layers,
  quiz:       ListChecks,
  simulation: Timer,
  socratic:   MessageCircle,
};

function timeAgo(ms: number): string {
  const diff = Math.max(0, Date.now() - ms);
  const m    = Math.floor(diff / 60_000);
  if (m < 1)   return 'ahora';
  if (m < 60)  return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `hace ${d} d`;
  return new Date(ms).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' });
}

export function RecentDataPanels() {
  const [sessions,   setSessions]   = useState<StoredSession[]>([]);
  const [weaknesses, setWeaknesses] = useState<{ topic: string; count: number }[]>([]);
  const [hydrated,   setHydrated]   = useState(false);

  function refresh() {
    setSessions(listSessions().slice(0, 4));
    setWeaknesses(aggregateWeaknesses(6));
    setHydrated(true);
  }

  useEffect(() => {
    refresh();
  }, []);

  function handleClear() {
    if (!confirm('¿Borrar todo el historial local?')) return;
    clearSessions();
    refresh();
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* ── Recent sessions ──────────────────────────────────── */}
      <section className="flex flex-col gap-3 p-5 rounded-2xl
                          bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#C97B3F]/70" />
            <h2 className="text-sm font-medium text-zinc-200">Sesiones recientes</h2>
          </div>
          {hydrated && sessions.length > 0 && (
            <button
              onClick={handleClear}
              className="text-zinc-700 hover:text-rose-400 transition-colors"
              title="Borrar historial local"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {!hydrated ? (
          <PanelSkeleton />
        ) : sessions.length === 0 ? (
          <EmptyBlock
            title="Aún no hay sesiones"
            hint="Tu primera práctica aparecerá aquí con dominio y errores."
          />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {sessions.map((s) => {
              const Icon = METHOD_ICONS[s.method];
              const tone = s.scorePct >= 80 ? 'text-emerald-400'
                         : s.scorePct >= 50 ? 'text-amber-400'
                         :                    'text-rose-400';
              return (
                <li key={s.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                             bg-white/[0.02] border border-white/[0.04]
                             hover:bg-white/[0.04] hover:border-white/[0.08] transition-all">
                  <div className="w-7 h-7 rounded-lg bg-[#C97B3F]/10 border border-[#C97B3F]/12
                                  flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-[#C97B3F]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-200 truncate">{s.name}</p>
                    <p className="text-[10px] text-zinc-600">
                      {timeAgo(s.completedAt)} · {s.scoreLabel}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold tabular-nums ${tone}`}>
                    {s.scorePct}%
                  </span>
                </li>
              );
            })}
            <Link
              href="/spark/session/new"
              className="flex items-center justify-center gap-1.5 mt-1 py-2 rounded-lg
                         text-[11px] text-[#C97B3F]/70 hover:text-[#C97B3F] transition-colors"
            >
              Nueva sesión
              <ArrowRight className="w-3 h-3" />
            </Link>
          </ul>
        )}
      </section>

      {/* ── Weaknesses ───────────────────────────────────────── */}
      <section className="flex flex-col gap-3 p-5 rounded-2xl
                          bg-white/[0.02] border border-white/[0.06]">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[#C97B3F]/70" />
          <h2 className="text-sm font-medium text-zinc-200">Debilidades detectadas</h2>
        </div>

        {!hydrated ? (
          <PanelSkeleton />
        ) : weaknesses.length === 0 ? (
          <EmptyBlock
            title="Sin datos todavía"
            hint="Tras tu primera sesión, Spark detectará los temas a reforzar."
          />
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {weaknesses.map((w) => (
              <span
                key={w.topic}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full
                           bg-rose-500/[0.06] border border-rose-500/20 text-rose-300"
              >
                {w.topic}
                {w.count > 1 && (
                  <span className="text-[10px] text-rose-400/70 tabular-nums">×{w.count}</span>
                )}
              </span>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function EmptyBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-start gap-1 py-2">
      <p className="text-sm text-zinc-400">{title}</p>
      <p className="text-xs text-zinc-600 leading-relaxed">{hint}</p>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="flex flex-col gap-2 py-1 animate-pulse">
      <div className="h-3 w-2/3 rounded-md bg-white/[0.04]" />
      <div className="h-3 w-1/2 rounded-md bg-white/[0.03]" />
    </div>
  );
}
