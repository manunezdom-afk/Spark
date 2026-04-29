'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Users, Layers } from 'lucide-react';
import type { LearningEngine } from '@/modules/spark/types';
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from '@/modules/spark/engines';

// Engine-specific metadata
const ENGINE_META: Record<
  LearningEngine,
  { emoji: string; hint: string; topicMin: number; topicMax: number }
> = {
  debugger: {
    emoji: '🐛',
    hint: 'Spark generará un texto con 3 errores conceptuales ocultos. Tu trabajo: encontrarlos.',
    topicMin: 1,
    topicMax: 2,
  },
  devils_advocate: {
    emoji: '⚔️',
    hint: 'Defiende tu postura. Spark atacará cada argumento sin piedad — hasta que el razonamiento sea sólido.',
    topicMin: 1,
    topicMax: 1,
  },
  roleplay: {
    emoji: '🎭',
    hint: 'Spark adoptará un personaje. Para avanzar en el escenario, tendrás que aplicar el conocimiento real.',
    topicMin: 1,
    topicMax: 3,
  },
  bridge_builder: {
    emoji: '🌉',
    hint: 'Elige 2-6 temas aparentemente separados. Spark construirá puentes de conocimiento entre ellos.',
    topicMin: 2,
    topicMax: 6,
  },
  socratic: {
    emoji: '🔍',
    hint: 'Sin respuestas directas. Solo preguntas de "¿por qué?" hasta que el conocimiento sea tuyo de verdad.',
    topicMin: 1,
    topicMax: 2,
  },
};

// ── Placeholder topics (replace with Kairos query) ───────────
const MOCK_TOPICS = [
  { id: '1', title: 'Valuación por DCF',           category: 'Finanzas'    },
  { id: '2', title: 'Teorema de Bayes',             category: 'Estadística' },
  { id: '3', title: 'Modelos mentales de Munger',   category: 'Estrategia'  },
  { id: '4', title: 'Unit Economics SaaS',          category: 'Negocios'    },
  { id: '5', title: 'Sesgo de confirmación',        category: 'Psicología'  },
  { id: '6', title: 'Redes neuronales — backprop',  category: 'ML'          },
];

// ── Form component ────────────────────────────────────────────
function NewSessionForm() {
  const params     = useSearchParams();
  const engine     = (params.get('engine') ?? 'socratic') as LearningEngine;
  const meta       = ENGINE_META[engine];
  const isRoleplay = engine === 'roleplay';
  const isBridge   = engine === 'bridge_builder';

  return (
    <main className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-8">

      {/* ── Back link ────────────────────────────────────── */}
      <Link
        href="/spark"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Motores
      </Link>

      {/* ── Engine header ────────────────────────────────── */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{meta.emoji}</span>
          <div>
            <p className="text-xs text-orange-400 uppercase tracking-widest font-medium">
              Motor de aprendizaje
            </p>
            <h1 className="text-2xl font-semibold mt-0.5">{ENGINE_LABELS[engine]}</h1>
          </div>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed pl-1 border-l-2 border-orange-500/30 ml-1">
          {meta.hint}
        </p>
      </header>

      {/* ── Topic selector ───────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <BookOpen className="w-4 h-4 text-orange-400/70" />
            {isBridge
              ? `Temas a conectar (${meta.topicMin}–${meta.topicMax})`
              : `Tema de trabajo`}
          </label>
          <span className="text-xs text-zinc-600">
            desde Kairos
          </span>
        </div>

        {/* Topic list — static until Kairos is wired */}
        <div className="flex flex-col gap-2">
          {MOCK_TOPICS.map((topic) => (
            <label
              key={topic.id}
              className="flex items-center gap-3 p-4 rounded-xl
                         bg-white/[0.03] border border-white/[0.07]
                         hover:border-orange-500/30 hover:bg-white/[0.06]
                         transition-all cursor-pointer group"
            >
              <input
                type={isBridge ? 'checkbox' : 'radio'}
                name="topic"
                value={topic.id}
                className="accent-orange-500 w-4 h-4 shrink-0"
              />
              <span className="flex-1 text-sm text-zinc-300 group-hover:text-white transition-colors">
                {topic.title}
              </span>
              <span className="text-xs text-zinc-600 shrink-0">{topic.category}</span>
            </label>
          ))}
        </div>

        <p className="text-xs text-zinc-700 pl-1">
          Conecta Kairos para ver tus propias notas como temas de práctica.
        </p>
      </section>

      {/* ── Roleplay: persona input ───────────────────────── */}
      {isRoleplay && (
        <section className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <Users className="w-4 h-4 text-orange-400/70" />
            Personaje que adoptará Spark
          </label>
          <input
            type="text"
            placeholder="ej. Inversionista ángel escéptico, Cliente enterprise difícil, Regulador de FDA..."
            className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white
                       placeholder:text-zinc-600 outline-none text-sm
                       focus:border-orange-500/60 focus:bg-white/[0.05] transition-all"
          />
          <p className="text-xs text-zinc-600">
            Cuanto más específico el personaje, más realista la presión del escenario.
          </p>
        </section>
      )}

      {/* ── Bridge Builder: multi-topic hint ─────────────── */}
      {isBridge && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/5 border border-sky-500/20">
          <Layers className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-300/80 leading-relaxed">
            Selecciona entre {meta.topicMin} y {meta.topicMax} temas. Spark encontrará
            conexiones no obvias y generará nodos para tu grafo de conocimiento.
          </p>
        </div>
      )}

      {/* ── Start session button ──────────────────────────── */}
      <button
        className="group flex items-center justify-center gap-3 w-full py-4 mt-2 rounded-xl
                   bg-gradient-to-r from-orange-600 to-orange-500
                   hover:from-orange-500 hover:to-orange-400
                   font-semibold text-white shadow-[0_0_30px_-8px_rgba(251,146,60,0.4)]
                   transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Comenzar sesión
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

    </main>
  );
}

// ── Page wrapper ──────────────────────────────────────────────
export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-6 animate-pulse">
          <div className="h-4 w-24 rounded-lg bg-white/5" />
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-40 rounded-2xl bg-white/5" />
        </main>
      }
    >
      <NewSessionForm />
    </Suspense>
  );
}
