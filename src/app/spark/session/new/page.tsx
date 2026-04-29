'use client';

// /spark/session/new — Three-step session creator.
//   1. Name your prueba/control
//   2. Pick a method (flashcards / quiz / simulation / socratic)
//   3. Paste your study material
// Submitting routes to /spark/practice/active (mock) until Nova generation is wired.

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Sparkles, FileText, Tag } from 'lucide-react';
import { METHOD_ORDER, METHODS, methodFromEngineParam, type StudyMethod } from '@/lib/spark/methods';

function NewSessionForm() {
  const router = useRouter();
  const params = useSearchParams();

  // Read method from query (?method=flashcards) or legacy (?engine=socratic)
  const initialMethod =
    (params.get('method') as StudyMethod | null) ??
    methodFromEngineParam(params.get('engine')) ??
    null;

  const [method,  setMethod]  = useState<StudyMethod | null>(initialMethod);
  const [name,    setName]    = useState('');
  const [content, setContent] = useState('');
  const [busy,    setBusy]    = useState(false);

  const canSubmit = !!method && name.trim().length > 0 && content.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    // Mock: simulate Nova generating the session, then route to practice screen.
    setTimeout(() => {
      const qs = new URLSearchParams({ name, method: method!, mock: '1' });
      router.push(`/spark/practice/active?${qs.toString()}`);
    }, 600);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-10">

      {/* ── Back ────────────────────────────────────────────── */}
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      {/* ── Title ───────────────────────────────────────────── */}
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-orange-400/80">Paso a paso</p>
        <h1 className="text-3xl font-semibold tracking-tight mt-1">Nueva sesión de práctica</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Nombra tu prueba, elige un método y pega tus apuntes. Nova arma la práctica.
        </p>
      </header>

      {/* ── 1. Name ─────────────────────────────────────────── */}
      <Field
        step="1"
        icon={<Tag className="w-4 h-4 text-orange-400/70" />}
        label="¿Qué estás preparando?"
        hint="Ej: Solemne de Psicología · Control de Historia · Certamen de Cálculo II"
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Solemne de Teorías de la Comunicación"
          className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white
                     placeholder:text-zinc-600 outline-none text-sm
                     focus:border-orange-500/60 focus:bg-white/[0.05] transition-all"
        />
      </Field>

      {/* ── 2. Method ───────────────────────────────────────── */}
      <Field
        step="2"
        icon={<Sparkles className="w-4 h-4 text-orange-400/70" />}
        label="Método de práctica"
        hint="Elige cómo quieres que Nova te entrene."
      >
        <div className="grid grid-cols-2 gap-2.5">
          {METHOD_ORDER.map((id) => {
            const m        = METHODS[id];
            const selected = method === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`group relative flex flex-col items-start gap-2 p-4 rounded-xl text-left
                            border transition-all duration-150
                            ${selected
                              ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_18px_-6px_rgba(251,146,60,0.4)]'
                              : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12]'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-2xl leading-none">{m.emoji}</span>
                  {!m.ready && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 border border-white/10 rounded-full px-1.5 py-0.5">
                      beta
                    </span>
                  )}
                </div>
                <div>
                  <h3 className={`font-medium text-sm transition-colors
                                  ${selected ? 'text-orange-300' : 'text-white'}`}>
                    {m.label}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{m.short}</p>
                </div>
              </button>
            );
          })}
        </div>
        {method && (
          <p className="text-xs text-zinc-500 mt-3 leading-relaxed pl-3 border-l-2 border-orange-500/30">
            {METHODS[method].description}
          </p>
        )}
      </Field>

      {/* ── 3. Content ──────────────────────────────────────── */}
      <Field
        step="3"
        icon={<FileText className="w-4 h-4 text-orange-400/70" />}
        label="Contenido o tema"
        hint="Pega tus apuntes, un resumen o lista de conceptos. Cuanto más específico, mejor."
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={'Ej: Modelo de Lasswell, Teoría de la aguja hipodérmica, Espiral del silencio…'}
          rows={6}
          className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white
                     placeholder:text-zinc-600 outline-none text-sm leading-relaxed resize-y min-h-[140px]
                     focus:border-orange-500/60 focus:bg-white/[0.05] transition-all"
        />
        <p className="text-[11px] text-zinc-600 mt-2">
          Próximamente podrás importar apuntes directamente desde Kairos.
        </p>
      </Field>

      {/* ── Submit ──────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || busy}
        className="group flex items-center justify-center gap-3 w-full py-4 rounded-xl
                   bg-gradient-to-r from-orange-600 to-orange-500
                   hover:from-orange-500 hover:to-orange-400
                   font-semibold text-white shadow-[0_0_30px_-8px_rgba(251,146,60,0.4)]
                   transition-all duration-300
                   disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {busy ? 'Preparando con Nova…' : 'Generar práctica con Nova'}
        {!busy && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
      </button>
    </main>
  );
}

// ── Field wrapper ─────────────────────────────────────────────
function Field({
  step,
  icon,
  label,
  hint,
  children,
}: {
  step:     string;
  icon:     React.ReactNode;
  label:    string;
  hint:     string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/30
                         flex items-center justify-center text-[11px] font-medium text-orange-300">
          {step}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="text-sm font-medium text-zinc-200">{label}</h2>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{hint}</p>
        </div>
      </div>
      {children}
    </section>
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
