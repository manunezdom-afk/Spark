'use client';

// /spark/practice/active — Practice screen (mock deck).
// Receives ?name=...&method=... from /spark/session/new.
//
// What's wired today:
//   • Multi-card deck (5–6 cards/method) from MOCK_DECKS
//   • Per-method UI: 3D-flip flashcards, quiz with feedback, sim with timer, socratic chat
//   • Streak counter + keyboard shortcuts (flashcards: Space / 1·2·3)
//   • localStorage persistence so the dashboard can show recent sessions + weaknesses
//   • Animated method-specific guide on first card (auto-dismisses)
//   • Result screen with score, time, weak topics

import { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Brain, Check, X, Layers, ListChecks, Timer, MessageCircle,
  ChevronRight, ArrowRight, Flame, RefreshCw, Send, Sparkles, Trophy,
  TrendingDown, Home,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { METHODS, type StudyMethod } from '@/lib/spark/methods';
import { MOCK_DECKS, type DeckCard } from '@/lib/spark/decks';
import { saveSession } from '@/lib/spark/storage';

// ── Method icons ──────────────────────────────────────────────
const METHOD_ICONS: Record<StudyMethod, LucideIcon> = {
  flashcards: Layers,
  quiz:       ListChecks,
  simulation: Timer,
  socratic:   MessageCircle,
};

// ── Per-method first-card guide ───────────────────────────────
const METHOD_GUIDE: Record<StudyMethod, { step: string; desc: string }[]> = {
  flashcards: [
    { step: 'Lee',     desc: 'Lee la pregunta con calma' },
    { step: 'Piensa',  desc: 'Responde mentalmente antes de revelar' },
    { step: 'Revela',  desc: 'Espacio para voltear la tarjeta' },
    { step: 'Evalúa',  desc: '1 · 2 · 3 según qué tan bien la sabías' },
  ],
  quiz: [
    { step: 'Lee',      desc: 'Lee la pregunta completa' },
    { step: 'Analiza',  desc: 'Considera cada alternativa' },
    { step: 'Elige',    desc: 'Selecciona la opción correcta' },
    { step: 'Avanza',   desc: 'Verás la corrección al instante' },
  ],
  simulation: [
    { step: 'Atiende',   desc: 'Observa el tiempo restante' },
    { step: 'Responde',  desc: 'Contesta con tus palabras' },
    { step: 'Avanza',    desc: 'Sin pausa — ritmo de prueba real' },
    { step: 'Revisa',    desc: 'Compara con la respuesta modelo' },
  ],
  socratic: [
    { step: 'Lee',        desc: 'Lee la pregunta de Nova' },
    { step: 'Reflexiona', desc: 'No hay respuesta correcta única' },
    { step: 'Responde',   desc: 'Escribe con tus palabras' },
    { step: 'Profundiza', desc: 'Nova preguntará más profundo' },
  ],
};

type Score = 'good' | 'ok' | 'bad' | 'reflected';

// ──────────────────────────────────────────────────────────────
// Animated guide (auto-advances, then collapses out of the way)
// ──────────────────────────────────────────────────────────────
function MethodGuide({ method, onDone }: { method: StudyMethod; onDone: () => void }) {
  const steps = METHOD_GUIDE[method];
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(t);
          setTimeout(onDone, 1100);
          return prev;
        }
        return prev + 1;
      });
    }, 1400);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]
                    animate-in fade-in slide-in-from-top-2 duration-500">
      <p className="text-[10px] uppercase tracking-widest text-zinc-600">Cómo funciona este modo</p>
      <div className="flex items-start gap-2 overflow-x-auto pb-1 scrollbar-none">
        {steps.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 shrink-0 transition-all duration-500
                        ${i === active ? 'opacity-100' : i < active ? 'opacity-40' : 'opacity-20'}`}
          >
            <div className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl border transition-all duration-500
                             ${i === active
                               ? 'bg-orange-500/10 border-orange-500/30'
                               : i < active
                                 ? 'bg-white/[0.02] border-white/[0.05]'
                                 : 'bg-transparent border-white/[0.04]'}`}>
              <span className={`text-[11px] font-semibold transition-colors duration-300
                                ${i === active ? 'text-orange-300' : i < active ? 'text-zinc-500' : 'text-zinc-700'}`}>
                {s.step}
              </span>
              {i === active && (
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">{s.desc}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className={`w-3 h-3 shrink-0 transition-colors duration-500
                                        ${i < active ? 'text-zinc-600' : 'text-zinc-800'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// FLASHCARD — 3D flip + difficulty buttons + keyboard support
// ──────────────────────────────────────────────────────────────
function FlashcardView({
  card, idx, total, revealed, onReveal, onScore,
}: {
  card: DeckCard; idx: number; total: number;
  revealed: boolean; onReveal: () => void; onScore: (s: Score) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="[perspective:1400px]">
        <div
          className={`relative w-full min-h-[280px] rounded-3xl transition-transform duration-700 ease-out
                      [transform-style:preserve-3d]
                      ${revealed ? '[transform:rotateY(180deg)]' : ''}`}
        >
          {/* FRONT */}
          <div className="absolute inset-0 [backface-visibility:hidden] flex flex-col gap-5 p-6 md:p-8 rounded-3xl
                          bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              Flashcard {idx + 1} · {card.topic}
            </p>
            <p className="text-lg md:text-xl text-zinc-100 leading-relaxed">{card.front}</p>
            <button
              onClick={onReveal}
              className="mt-auto group flex items-center justify-center gap-2 py-3 rounded-xl
                         bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm font-medium
                         hover:bg-orange-500/15 hover:border-orange-500/50 transition-all"
            >
              Revelar respuesta
              <kbd className="text-[10px] text-orange-400/60 px-1.5 py-0.5 rounded
                              bg-orange-500/10 border border-orange-500/20">Espacio</kbd>
            </button>
          </div>

          {/* BACK */}
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]
                          flex flex-col gap-5 p-6 md:p-8 rounded-3xl
                          bg-gradient-to-br from-orange-950/30 via-white/[0.03] to-white/[0.03]
                          border border-orange-500/20">
            <p className="text-[11px] uppercase tracking-wider text-orange-400/70">Respuesta · {card.topic}</p>
            <p className="text-zinc-200 text-base md:text-lg leading-relaxed">{card.back}</p>
            <div className="mt-auto flex flex-col gap-2">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 text-center">¿Qué tan bien la sabías?</p>
              <div className="grid grid-cols-3 gap-2">
                <ResponseBtn variant="bad"  label="No la sabía"  hint="1" onClick={() => onScore('bad')}  />
                <ResponseBtn variant="ok"   label="Más o menos"  hint="2" onClick={() => onScore('ok')}   />
                <ResponseBtn variant="good" label="La domino"    hint="3" onClick={() => onScore('good')} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResponseBtn({
  variant, label, hint, onClick,
}: {
  variant: 'bad' | 'ok' | 'good'; label: string; hint?: string; onClick: () => void;
}) {
  const styles =
    variant === 'good' ? 'border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10' :
    variant === 'ok'   ? 'border-amber-500/30   text-amber-300   hover:bg-amber-500/10'   :
                         'border-rose-500/30    text-rose-300    hover:bg-rose-500/10';
  const Icon = variant === 'good' ? Check : variant === 'bad' ? X : MessageCircle;
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-1 py-2.5 rounded-xl
                  border bg-white/[0.02] text-xs font-medium transition-all ${styles}`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      {hint && (
        <kbd className="absolute top-1 right-1.5 text-[9px] text-zinc-600">{hint}</kbd>
      )}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// QUIZ — pick answer, show correct/wrong, auto-advance
// ──────────────────────────────────────────────────────────────
function QuizView({
  card, idx, total, onAnswer,
}: {
  card: DeckCard; idx: number; total: number;
  onAnswer: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<number | null>(null);
  const opts = card.options ?? [];

  function pick(i: number) {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => onAnswer(opts[i].correct), 1100);
  }

  return (
    <div className="flex flex-col gap-5 p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500">
        Pregunta {idx + 1} · {card.topic}
      </p>
      <p className="text-lg md:text-xl text-zinc-100 leading-relaxed">{card.front}</p>
      <div className="flex flex-col gap-2">
        {opts.map((opt, i) => {
          const isPicked  = picked === i;
          const isCorrect = picked !== null && opt.correct;
          const isWrong   = isPicked && !opt.correct;

          return (
            <button
              key={i}
              onClick={() => pick(i)}
              disabled={picked !== null}
              className={`flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl
                          border text-left text-sm transition-all duration-300
                          ${isCorrect
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-[0_0_20px_-4px_rgba(16,185,129,0.4)]'
                            : isWrong
                              ? 'bg-rose-500/15 border-rose-500/50 text-rose-200'
                              : picked !== null
                                ? 'bg-white/[0.01] border-white/[0.05] text-zinc-600'
                                : 'bg-white/[0.02] border-white/[0.07] text-zinc-300 hover:bg-white/[0.05] hover:border-white/[0.12] cursor-pointer'}`}
            >
              <span className="leading-snug">{opt.text}</span>
              {isCorrect && <Check className="w-4 h-4 shrink-0" />}
              {isWrong   && <X     className="w-4 h-4 shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SIMULATION — timer + textarea + reveal model answer
// ──────────────────────────────────────────────────────────────
function SimulationView({
  card, idx, total, onSubmit,
}: {
  card: DeckCard; idx: number; total: number;
  onSubmit: (selfRating: 'good' | 'ok' | 'bad') => void;
}) {
  const [text,    setText]    = useState('');
  const [seconds, setSeconds] = useState(90);
  const [phase,   setPhase]   = useState<'answer' | 'review'>('answer');

  useEffect(() => {
    if (phase !== 'answer') return;
    if (seconds <= 0) { setPhase('review'); return; }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds, phase]);

  const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
  const ss = (seconds % 60).toString().padStart(2, '0');
  const lowTime = seconds <= 15;

  return (
    <div className="flex flex-col gap-5 p-6 md:p-8 rounded-3xl bg-white/[0.03] border border-white/[0.08]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-wider text-zinc-500">
          Simulación {idx + 1} · {card.topic}
        </p>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full
                        font-mono text-sm font-semibold tabular-nums transition-colors
                        ${lowTime
                          ? 'bg-rose-500/10 border border-rose-500/40 text-rose-300 animate-pulse'
                          : 'bg-white/[0.04] border border-white/[0.08] text-orange-300'}`}>
          <Timer className="w-3.5 h-3.5" />
          {mm}:{ss}
        </div>
      </div>

      <p className="text-base md:text-lg text-zinc-100 leading-relaxed">{card.front}</p>

      {phase === 'answer' ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe tu respuesta…"
            rows={5}
            className="w-full p-4 rounded-xl bg-white/[0.02] border border-white/[0.07] text-white
                       placeholder:text-zinc-700 outline-none text-sm leading-relaxed resize-y min-h-[120px]
                       focus:border-orange-500/40 focus:bg-white/[0.04] transition-all"
          />
          <button
            onClick={() => setPhase('review')}
            disabled={!text.trim()}
            className="flex items-center justify-center gap-2 py-3 rounded-xl
                       bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm font-medium
                       hover:bg-orange-500/15 hover:border-orange-500/50 transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
            Enviar respuesta
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {text.trim() && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-1.5">Tu respuesta</p>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{text}</p>
            </div>
          )}
          <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Brain className="w-3 h-3 text-violet-400" />
              <p className="text-[10px] uppercase tracking-widest text-violet-300/70">Respuesta modelo</p>
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">{card.back}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 text-center">¿Cómo te fue?</p>
            <div className="grid grid-cols-3 gap-2">
              <ResponseBtn variant="bad"  label="Lejos"        onClick={() => onSubmit('bad')}  />
              <ResponseBtn variant="ok"   label="Casi"          onClick={() => onSubmit('ok')}   />
              <ResponseBtn variant="good" label="La clavé"      onClick={() => onSubmit('good')} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SOCRATIC — Nova question + textarea, advance on submit
// ──────────────────────────────────────────────────────────────
function SocraticView({
  card, idx, total, onSubmit,
}: {
  card: DeckCard; idx: number; total: number;
  onSubmit: () => void;
}) {
  const [text, setText] = useState('');

  return (
    <div className="flex flex-col gap-4">
      {/* Nova bubble */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-400/20
                        flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-violet-300" />
        </div>
        <div className="flex-1 p-4 rounded-2xl rounded-tl-sm
                        bg-gradient-to-br from-violet-950/40 via-violet-900/20 to-transparent
                        border border-violet-500/20">
          <p className="text-[10px] uppercase tracking-widest text-violet-400/70 mb-1.5">
            Nova · pregunta {idx + 1} · {card.topic}
          </p>
          <p className="text-base md:text-lg text-zinc-100 leading-relaxed">{card.front}</p>
        </div>
      </div>

      {/* User input */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.07]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reflexiona y responde con tus palabras…"
          rows={4}
          className="w-full bg-transparent outline-none text-sm leading-relaxed resize-y min-h-[100px]
                     text-white placeholder:text-zinc-700"
        />
        <button
          onClick={() => { setText(''); onSubmit(); }}
          disabled={!text.trim()}
          className="self-end flex items-center gap-2 px-4 py-2 rounded-lg
                     bg-violet-500/15 border border-violet-500/40 text-violet-200 text-sm font-medium
                     hover:bg-violet-500/25 transition-all
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Profundizar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Result screen — score, time, weak topics, restart
// ──────────────────────────────────────────────────────────────
function ResultScreen({
  name, method, total, scores, weakTopics, startedAt,
}: {
  name:        string;
  method:      StudyMethod;
  total:       number;
  scores:      Score[];
  weakTopics:  string[];
  startedAt:   number;
}) {
  const goodCount = scores.filter(s => s === 'good').length;
  const okCount   = scores.filter(s => s === 'ok').length;
  const badCount  = scores.filter(s => s === 'bad').length;

  const pct = method === 'socratic'
    ? 100
    : Math.round(((goodCount + okCount * 0.5) / total) * 100);

  const elapsed = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
  const mins    = Math.floor(elapsed / 60);
  const secs    = elapsed % 60;
  const elapsedLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

  const tone = pct >= 80 ? 'emerald' : pct >= 50 ? 'amber' : 'rose';
  const toneClasses =
    tone === 'emerald' ? 'from-emerald-950/40 to-emerald-900/10 border-emerald-500/30 text-emerald-300' :
    tone === 'amber'   ? 'from-amber-950/40 to-amber-900/10 border-amber-500/30 text-amber-300'         :
                         'from-rose-950/40 to-rose-900/10 border-rose-500/30 text-rose-300';

  const headline =
    method === 'socratic'
      ? '¡Buen trabajo! Reflexionaste a fondo.'
      : pct >= 80 ? '¡Dominio sólido!'
      : pct >= 50 ? 'Vas avanzando.'
                  : 'Hay temas que reforzar.';

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Hero */}
      <section className={`relative overflow-hidden rounded-3xl border bg-gradient-to-br ${toneClasses} p-6 md:p-8`}>
        <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-current opacity-10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-widest opacity-80">Sesión completada</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">{headline}</h1>
          <p className="text-sm text-zinc-300/80">{name}</p>

          <div className="grid grid-cols-3 gap-3 mt-2">
            <Stat label="Score"       value={method === 'socratic' ? `${total}` : `${pct}%`} />
            <Stat label="Tarjetas"    value={`${total}`} />
            <Stat label="Tiempo"      value={elapsedLabel} />
          </div>
        </div>
      </section>

      {/* Breakdown — only for evaluative methods */}
      {method !== 'socratic' && (
        <section className="grid grid-cols-3 gap-3">
          <Tile color="emerald" icon={Check}        label="Dominas"      value={goodCount} />
          <Tile color="amber"   icon={MessageCircle} label="Más o menos"  value={okCount} />
          <Tile color="rose"    icon={X}             label="No la sabías" value={badCount} />
        </section>
      )}

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <section className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-orange-400/70" />
            <h2 className="text-sm font-medium text-zinc-200">Temas a reforzar</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[...new Set(weakTopics)].map((t) => (
              <span key={t}
                className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          href="/spark/session/new"
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl
                     bg-gradient-to-r from-orange-600 to-orange-500
                     hover:from-orange-500 hover:to-orange-400
                     text-white text-sm font-semibold
                     shadow-[0_0_24px_-8px_rgba(251,146,60,0.5)] transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Otra práctica
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl
                     bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-sm font-medium
                     hover:bg-white/[0.06] transition-all"
        >
          <Home className="w-4 h-4" />
          Inicio
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 p-3 rounded-xl bg-black/20 border border-white/[0.06]">
      <span className="text-[10px] uppercase tracking-widest text-zinc-500">{label}</span>
      <span className="text-xl font-semibold text-white tabular-nums">{value}</span>
    </div>
  );
}

function Tile({
  color, icon: Icon, label, value,
}: {
  color: 'emerald' | 'amber' | 'rose'; icon: LucideIcon; label: string; value: number;
}) {
  const c =
    color === 'emerald' ? 'border-emerald-500/25 text-emerald-300 bg-emerald-500/[0.04]' :
    color === 'amber'   ? 'border-amber-500/25 text-amber-300 bg-amber-500/[0.04]'       :
                          'border-rose-500/25 text-rose-300 bg-rose-500/[0.04]';
  return (
    <div className={`flex flex-col gap-1 p-4 rounded-2xl border ${c}`}>
      <div className="flex items-center gap-1.5 opacity-80">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main practice view
// ──────────────────────────────────────────────────────────────
function PracticeView() {
  const params = useSearchParams();
  const name   = params.get('name')   ?? 'Tu práctica';
  const method = (params.get('method') ?? 'flashcards') as StudyMethod;
  const meta   = METHODS[method];
  const Icon   = METHOD_ICONS[method];
  const deck   = MOCK_DECKS[method];
  const total  = deck.length;

  const [idx,         setIdx]         = useState(0);
  const [revealed,    setRevealed]    = useState(false);
  const [streak,      setStreak]      = useState(0);
  const [scores,      setScores]      = useState<Score[]>([]);
  const [weakTopics,  setWeakTopics]  = useState<string[]>([]);
  const [done,        setDone]        = useState(false);
  const [showGuide,   setShowGuide]   = useState(true);
  const [pulseStreak, setPulseStreak] = useState(false);
  const startedAtRef = useRef<number>(Date.now());
  const cardKey      = `${method}-${idx}`;

  const card = deck[idx];

  const advance = useCallback((score: Score) => {
    const finalScores     = [...scores, score];
    const finalWeakTopics = (score === 'bad' && card.topic)
      ? [...weakTopics, card.topic]
      : weakTopics;

    setScores(finalScores);
    setWeakTopics(finalWeakTopics);

    if (score === 'good') {
      setStreak(s => s + 1);
      setPulseStreak(true);
      setTimeout(() => setPulseStreak(false), 700);
    } else if (score === 'bad') {
      setStreak(0);
    }

    if (idx + 1 >= total) {
      // Persist before flipping to result screen
      const goodCount = finalScores.filter(s => s === 'good').length;
      const okCount   = finalScores.filter(s => s === 'ok').length;
      const pct = method === 'socratic'
        ? 100
        : Math.round(((goodCount + okCount * 0.5) / total) * 100);
      const scoreLabel = method === 'socratic'
        ? `${total} reflexiones`
        : method === 'quiz'
          ? `${goodCount} / ${total} correctas`
          : `${goodCount} / ${total} dominas`;

      saveSession({
        id:          (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        name,
        method,
        startedAt:   startedAtRef.current,
        completedAt: Date.now(),
        total,
        scorePct:    pct,
        scoreLabel,
        weakTopics:  [...new Set(finalWeakTopics)],
      });
      setTimeout(() => setDone(true), 350);
    } else {
      setIdx(i => i + 1);
      setRevealed(false);
    }
  }, [scores, weakTopics, idx, total, card, name, method]);

  // Keyboard shortcuts (flashcards only — other methods need text input)
  useEffect(() => {
    if (method !== 'flashcards' || done) return;
    function handle(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT')) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!revealed) setRevealed(true);
        return;
      }
      if (revealed) {
        if (e.key === '1') { e.preventDefault(); advance('bad');  }
        if (e.key === '2') { e.preventDefault(); advance('ok');   }
        if (e.key === '3') { e.preventDefault(); advance('good'); }
      }
    }
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [method, done, revealed, advance]);

  if (done) {
    return (
      <ResultScreen
        name={name}
        method={method}
        total={total}
        scores={scores}
        weakTopics={weakTopics}
        startedAt={startedAtRef.current}
      />
    );
  }

  const progress = ((idx) / total) * 100;

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-6">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-zinc-500 hover:text-orange-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Salir
        </Link>
        <div className="flex items-center gap-2">
          {streak > 1 && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full
                             bg-amber-500/10 border border-amber-500/30 transition-all duration-300
                             ${pulseStreak ? 'scale-110 shadow-[0_0_18px_rgba(245,158,11,0.45)]' : ''}`}>
              <Flame className={`w-3.5 h-3.5 text-amber-400 ${pulseStreak ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-semibold text-amber-300 tabular-nums">{streak}</span>
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-white/[0.03] border border-white/[0.07]">
            <Icon className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-xs text-zinc-300 font-medium">{meta.label}</span>
          </div>
        </div>
      </div>

      {/* ── Header + progress bar ───────────────────────── */}
      <header className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight leading-tight truncate">{name}</h1>
          <span className="shrink-0 text-xs text-zinc-500 tabular-nums">{idx + 1} / {total}</span>
        </div>
        <div className="h-1 rounded-full bg-white/[0.05] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400
                       transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-violet-400/70">
          <Brain className="w-3 h-3" />
          <span>generado por Nova</span>
        </div>
      </header>

      {/* ── Animated guide (first card only) ───────────── */}
      {showGuide && idx === 0 && (
        <MethodGuide method={method} onDone={() => setShowGuide(false)} />
      )}

      {/* ── Card area ──────────────────────────────────── */}
      <div key={cardKey} className="animate-in fade-in slide-in-from-right-3 duration-300">
        {method === 'flashcards' && (
          <FlashcardView
            card={card} idx={idx} total={total}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onScore={advance}
          />
        )}
        {method === 'quiz' && (
          <QuizView
            card={card} idx={idx} total={total}
            onAnswer={(correct) => advance(correct ? 'good' : 'bad')}
          />
        )}
        {method === 'simulation' && (
          <SimulationView
            card={card} idx={idx} total={total}
            onSubmit={(rating) => advance(rating)}
          />
        )}
        {method === 'socratic' && (
          <SocraticView
            card={card} idx={idx} total={total}
            onSubmit={() => advance('reflected')}
          />
        )}
      </div>

      {/* ── Demo notice ────────────────────────────────── */}
      <div className="flex items-start gap-3 p-3.5 rounded-xl bg-violet-500/[0.04] border border-violet-500/15">
        <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-zinc-500 leading-relaxed">
          <span className="text-violet-300 font-medium">Vista previa.</span>{' '}
          La generación real con Nova y guardado en Supabase están en desarrollo.
          Por ahora tu sesión queda guardada localmente para mostrar la dinámica.
        </p>
      </div>

    </main>
  );
}

// ── Page wrapper ──────────────────────────────────────────────
export default function PracticeActivePage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-6 py-14 flex flex-col gap-6 animate-pulse">
          <div className="h-4 w-24 rounded-lg bg-white/5" />
          <div className="h-10 w-64 rounded-xl bg-white/5" />
          <div className="h-20 rounded-2xl bg-white/5" />
          <div className="h-60 rounded-3xl bg-white/5" />
        </main>
      }
    >
      <PracticeView />
    </Suspense>
  );
}
