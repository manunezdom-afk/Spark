'use client';

// /spark/session/new — Three-step session creator.
//   1. Name your prueba/control
//   2. Pick a method (flashcards / quiz / simulation / socratic)
//   3. Paste your study material
// Submitting routes to /spark/practice/active (mock) until Nova generation is wired.

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Sparkles, FileText, Tag,
  Layers, ListChecks, Timer, MessageCircle, Brain, Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { METHOD_ORDER, METHODS, methodFromEngineParam, type StudyMethod } from '@/lib/spark/methods';

const METHOD_ICONS: Record<StudyMethod, LucideIcon> = {
  flashcards: Layers,
  quiz:       ListChecks,
  simulation: Timer,
  socratic:   MessageCircle,
};

// ── Cycling placeholder for the content textarea ──────────────
// Rotates through realistic examples every 2.8s so users
// immediately understand what kind of material to paste.

const CONTENT_PLACEHOLDERS = [
  'Modelo de Lasswell, Teoría de la aguja hipodérmica, Espiral del silencio de Noelle-Neumann…',
  'Derivadas, regla de la cadena, integrales por sustitución, teorema fundamental del cálculo…',
  'Homeostasis, membrana celular, ATP y fosforilación oxidativa, ciclo de Krebs…',
  'Demanda y oferta, elasticidad precio, equilibrio de Nash, teoría de juegos básica…',
  'Revolución francesa, causas, etapas, Terror, Napoleón, impacto en Europa…',
  'Psicología del desarrollo, Piaget, etapas cognitivas, Vygotsky, zona de desarrollo próximo…',
];

// ── Nova "thinking" sequence ──────────────────────────────────
// Multi-step animation shown while we mock generation. Each phase
// appears for ~700ms, total ~3s — enough to feel like real work
// without being slow.

const NOVA_STEPS = [
  'Analizando tus apuntes…',
  'Detectando conceptos clave…',
  'Generando preguntas…',
  'Calibrando dificultad…',
];

function NewSessionForm() {
  const router = useRouter();
  const params = useSearchParams();

  // Read method from query (?method=flashcards) or legacy (?engine=socratic)
  const initialMethod =
    (params.get('method') as StudyMethod | null) ??
    methodFromEngineParam(params.get('engine')) ??
    null;

  const [method,      setMethod]      = useState<StudyMethod | null>(initialMethod);
  const [name,        setName]        = useState('');
  const [content,     setContent]     = useState('');
  const [busy,        setBusy]        = useState(false);
  const [busyStep,    setBusyStep]    = useState(0);
  const [phIdx,       setPhIdx]       = useState(0);
  const [phVisible,   setPhVisible]   = useState(true);

  // Cycle through content placeholder examples every 2.8s
  useEffect(() => {
    if (content.trim()) return; // stop cycling once user typed something
    const t = setInterval(() => {
      setPhVisible(false);
      setTimeout(() => {
        setPhIdx((i) => (i + 1) % CONTENT_PLACEHOLDERS.length);
        setPhVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const canSubmit = !!method && name.trim().length > 0 && content.trim().length > 0;

  // Step completion state for the animated dots
  const step1Done = name.trim().length > 0;
  const step2Done = !!method;
  const step3Done = content.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    setBusy(true);
    setBusyStep(0);

    // Step through Nova's thinking phases, then route to practice.
    const stepDuration = 720; // ms per phase
    let i = 0;
    const tick = setInterval(() => {
      i += 1;
      if (i >= NOVA_STEPS.length) {
        clearInterval(tick);
        setTimeout(() => {
          const qs = new URLSearchParams({ name, method: method!, mock: '1' });
          router.push(`/spark/practice/active?${qs.toString()}`);
        }, 350);
      } else {
        setBusyStep(i);
      }
    }, stepDuration);
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-10">

      {/* ── Back ────────────────────────────────────────────── */}
      <Link
        href="/"
        className="flex items-center gap-2 text-sm text-zinc-500 hover:text-[#C97B3F] transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      {/* ── Title ───────────────────────────────────────────── */}
      <header className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-[#C97B3F]/80">Paso a paso</p>
          <h1 className="text-3xl font-semibold tracking-tight mt-1">Nueva sesión de práctica</h1>
          <p className="text-sm text-zinc-400 mt-2">
            Nombra tu prueba, elige un método y pega tus apuntes. Nova arma la práctica.
          </p>
        </div>
        {/* Nova context strip */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl
                        bg-violet-500/5 border border-violet-500/20">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
            <Brain className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <p className="text-xs text-violet-300/80 leading-relaxed">
            <span className="font-medium text-violet-300">Nova</span> tomará tus apuntes
            y generará la práctica en segundos según el método que elijas.
          </p>
        </div>
      </header>

      {/* ── 1. Name ─────────────────────────────────────────── */}
      <Field
        step="1"
        icon={<Tag className="w-4 h-4 text-[#C97B3F]/70" />}
        label="¿Qué estás preparando?"
        hint="Ej: Solemne de Psicología · Control de Historia · Certamen de Cálculo II"
        done={step1Done}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Solemne de Teorías de la Comunicación"
          className="w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white
                     placeholder:text-zinc-600 outline-none text-sm
                     focus:border-[#C97B3F]/40 focus:bg-white/[0.05] transition-all"
        />
      </Field>

      {/* ── 2. Method ───────────────────────────────────────── */}
      <Field
        step="2"
        icon={<Sparkles className="w-4 h-4 text-[#C97B3F]/70" />}
        label="Método de práctica"
        hint="Elige cómo quieres que Nova te entrene."
        done={step2Done}
      >
        <div className="grid grid-cols-2 gap-2.5">
          {METHOD_ORDER.map((id) => {
            const m        = METHODS[id];
            const Icon     = METHOD_ICONS[id];
            const selected = method === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setMethod(id)}
                className={`group relative flex flex-col items-start gap-3 p-4 rounded-xl text-left
                            border transition-all duration-150
                            ${selected
                              ? 'bg-[#C97B3F]/8 border-[#C97B3F]/35'
                              : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.12]'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors
                                   ${selected
                                     ? 'bg-[#C97B3F]/15 border border-[#C97B3F]/25'
                                     : 'bg-white/[0.05] border border-white/10'}`}>
                    <Icon className={`w-4 h-4 transition-colors ${selected ? 'text-[#C97B3F]' : 'text-zinc-400'}`} />
                  </div>
                  {!m.ready && (
                    <span className="text-[10px] uppercase tracking-wider text-zinc-600 border border-white/10 rounded-full px-1.5 py-0.5">
                      beta
                    </span>
                  )}
                </div>
                <div>
                  <h3 className={`font-medium text-sm transition-colors
                                  ${selected ? 'text-[#D4894A]' : 'text-white'}`}>
                    {m.label}
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5 leading-snug">{m.short}</p>
                </div>
              </button>
            );
          })}
        </div>
        {method && (
          <p className="text-xs text-zinc-500 mt-3 leading-relaxed pl-3 border-l-2 border-[#C97B3F]/25">
            {METHODS[method].description}
          </p>
        )}
      </Field>

      {/* ── 3. Content ──────────────────────────────────────── */}
      <Field
        step="3"
        icon={<FileText className="w-4 h-4 text-[#C97B3F]/70" />}
        label="Contenido o tema"
        hint="Pega tus apuntes, un resumen o lista de conceptos. Cuanto más específico, mejor."
        done={step3Done}
      >
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={CONTENT_PLACEHOLDERS[phIdx]}
            rows={6}
            className={`w-full p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white
                       outline-none text-sm leading-relaxed resize-y min-h-[140px]
                       focus:border-[#C97B3F]/40 focus:bg-white/[0.05] transition-all
                       placeholder:transition-opacity placeholder:duration-300
                       ${phVisible ? 'placeholder:opacity-60' : 'placeholder:opacity-0'}`}
          />
          {/* Cycling indicator — tiny dots showing which example is visible */}
          {!content.trim() && (
            <div className="absolute bottom-3 right-3 flex gap-1">
              {CONTENT_PLACEHOLDERS.map((_, i) => (
                <span
                  key={i}
                  className={`w-1 h-1 rounded-full transition-all duration-300
                              ${i === phIdx ? 'bg-[#C97B3F]/60 scale-125' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
          )}
        </div>
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
                   bg-[#A86030] hover:bg-[#C27035]
                   font-semibold text-white
                   transition-all duration-300
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? 'Nova está pensando…' : 'Generar práctica con Nova'}
        {!busy && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
      </button>

      {/* ── Nova thinking overlay ────────────────────────────── */}
      {busy && <NovaThinking step={busyStep} />}
    </main>
  );
}

// ── Nova thinking overlay ─────────────────────────────────────
// Full-screen takeover that gives weight to "Nova is generating".
// Pulsing brain + orbital dots + cycling phase text.

function NovaThinking({ step }: { step: number }) {
  return (
    <div className="fixed inset-0 z-50 bg-[#07080B]/90 backdrop-blur-md
                    flex items-center justify-center
                    animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-8 max-w-sm mx-auto px-6 text-center">

        {/* Pulsing brain with orbital dot */}
        <div className="relative">
          <div className="absolute inset-[-30px] rounded-full bg-violet-500/8 blur-3xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl
                          bg-gradient-to-br from-violet-500/25 to-violet-700/15
                          border border-violet-400/30
                          flex items-center justify-center
                          shadow-[0_0_40px_-12px_rgba(139,92,246,0.25)]">
            <Brain className="w-11 h-11 text-violet-200 animate-pulse" />
          </div>
          {/* Orbital dot */}
          <div className="absolute inset-[-16px] animate-spin"
               style={{ animationDuration: '3s' }}>
            <span className="absolute top-0 left-1/2 -translate-x-1/2
                             w-2 h-2 rounded-full bg-violet-300
                             shadow-[0_0_8px_rgba(196,181,253,0.3)]" />
          </div>
          <div className="absolute inset-[-16px] animate-spin"
               style={{ animationDuration: '4.5s', animationDirection: 'reverse' }}>
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2
                             w-1.5 h-1.5 rounded-full bg-[#C97B3F]
                             shadow-[0_0_6px_rgba(201,123,63,0.3)]" />
          </div>
        </div>

        {/* Phase text */}
        <div className="flex flex-col items-center gap-2 min-h-[60px]">
          <span className="text-[10px] uppercase tracking-[0.2em] text-violet-400/70">
            Nova
          </span>
          <p key={step} className="text-base text-white font-medium
                                   animate-in fade-in slide-in-from-bottom-1 duration-300">
            {NOVA_STEPS[step] ?? NOVA_STEPS[NOVA_STEPS.length - 1]}
          </p>
        </div>

        {/* Phase progress dots */}
        <div className="flex gap-2">
          {NOVA_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500
                          ${i < step ? 'w-6 bg-violet-400'
                          : i === step ? 'w-8 bg-violet-400'
                          :              'w-3 bg-zinc-800'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────
// `done` drives a subtle animated completion indicator on the step bubble.
function Field({
  step,
  icon,
  label,
  hint,
  done = false,
  children,
}: {
  step:     string;
  icon:     React.ReactNode;
  label:    string;
  hint:     string;
  done?:    boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {/* Step bubble: number collapses to checkmark when done */}
        <div className={`relative shrink-0 w-6 h-6 rounded-full flex items-center justify-center
                         transition-all duration-300
                         ${done
                           ? 'bg-emerald-500/15 border border-emerald-500/40'
                           : 'bg-[#C97B3F]/8 border border-[#C97B3F]/25'}`}>
          <span
            className={`absolute text-[11px] font-medium transition-all duration-200
                         ${done ? 'opacity-0 scale-50' : 'opacity-100 scale-100'} text-[#C97B3F]`}
          >
            {step}
          </span>
          <span
            className={`absolute transition-all duration-200
                         ${done ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}
          >
            <Check className="w-3 h-3 text-emerald-400" />
          </span>
        </div>

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
