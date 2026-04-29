'use client';

// Animated 3-step mini-tutorial. Fades in on mount with stagger so
// first-time users understand the flow before touching anything.

import { useEffect, useState } from 'react';
import { PenLine, SlidersHorizontal, Sparkles } from 'lucide-react';

const STEPS = [
  {
    Icon:   PenLine,
    number: '01',
    label:  'Nombra tu prueba',
    desc:   'Escribe el solemne, control o certamen que estás preparando.',
  },
  {
    Icon:   SlidersHorizontal,
    number: '02',
    label:  'Elige tu método',
    desc:   'Flashcards, quiz, simulación cronometrada o socrático.',
  },
  {
    Icon:   Sparkles,
    number: '03',
    label:  'Nova genera la práctica',
    desc:   'Pega tus apuntes y Nova arma preguntas, tarjetas y feedback en segundos.',
  },
];

export function HowItWorks() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tiny delay so the transition is visible on first paint
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-widest text-zinc-600">Así funciona</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {STEPS.map((step, i) => (
          <div
            key={step.number}
            style={{ transitionDelay: `${i * 120}ms` }}
            className={`flex flex-col gap-4 p-5 rounded-2xl
                        bg-white/[0.02] border border-white/[0.06]
                        transition-all duration-500 ease-out
                        ${visible
                          ? 'opacity-100 translate-y-0'
                          : 'opacity-0 translate-y-3'}`}
          >
            <div className="flex items-start justify-between">
              <div className="w-9 h-9 rounded-xl bg-[#C97B3F]/10 border border-[#C97B3F]/10 flex items-center justify-center">
                <step.Icon className="w-4 h-4 text-[#C97B3F]" />
              </div>
              <span className="text-2xl font-bold text-white/[0.04] select-none">
                {step.number}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-200">{step.label}</h3>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
