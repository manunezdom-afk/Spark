'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import type { LearningEngine } from '@/modules/spark/types';
import { ENGINE_LABELS } from '@/modules/spark/engines';

function NewSessionForm() {
  const params = useSearchParams();
  const engine = (params.get('engine') ?? 'socratic') as LearningEngine;

  return (
    <main className="max-w-2xl mx-auto px-6 py-16 flex flex-col gap-8">
      <header>
        <p className="text-sm text-purple-400 uppercase tracking-widest">Nuevo Ejercicio</p>
        <h1 className="text-3xl font-semibold mt-1">{ENGINE_LABELS[engine]}</h1>
      </header>

      <section className="flex flex-col gap-3">
        <label className="text-sm text-zinc-400">Selecciona el tema a trabajar</label>
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-zinc-500 text-sm">
          Conectar con Kairos para listar temas…
        </div>
      </section>

      {engine === 'roleplay' && (
        <section className="flex flex-col gap-3">
          <label className="text-sm text-zinc-400">Personaje que adoptará Spark</label>
          <input
            type="text"
            placeholder="ej. Inversionista ángel escéptico"
            className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-zinc-600 outline-none focus:border-purple-500/60"
          />
        </section>
      )}

      <button className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 transition-colors font-semibold text-white">
        Comenzar sesión
      </button>
    </main>
  );
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse" />
      </main>
    }>
      <NewSessionForm />
    </Suspense>
  );
}
