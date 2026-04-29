"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Zap, BookOpen, Brain, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "spark:welcome-tour-seen";

const SLIDES = [
  {
    icon: Zap,
    tag: "Bienvenido a Spark",
    title: "No memorices. Entrena.",
    body: "Spark no es un lugar para guardar notas. Nova te hace preguntas difíciles, detecta lo que no sabes y te lleva al borde de tu propio entendimiento.",
    hint: "Abajo tienes temas de ejemplo para que veas cómo funciona.",
    accentColor: "text-spark",
    borderColor: "border-spark/20",
    bgColor: "bg-spark/[0.08]",
    iconColor: "text-spark",
  },
  {
    icon: BookOpen,
    tag: "Tus temas",
    title: "Cada tema es una unidad de combate.",
    body: "Crea temas manualmente, extráelos pegando texto, o importa directamente tus materias desde Kairos. Spark lee tus propias notas de clase y las usa como contexto.",
    hint: "Los temas marcados con 'Kairos' usan tus notas reales en cada sesión.",
    accentColor: "text-nova-mid",
    borderColor: "border-nova-mid/20",
    bgColor: "bg-nova-mid/[0.08]",
    iconColor: "text-nova-mid",
  },
  {
    icon: Brain,
    tag: "Los 5 motores",
    title: "Cada motor te ataca distinto.",
    body: "Socrático te pregunta hasta que expliques bien. Debugger te mete errores a propósito. Abogado del diablo contradice todo lo que dices. Bridge Builder conecta conceptos. Roleplay te pone en situaciones reales.",
    hint: "Elige el motor según lo que necesitas: entender, aplicar o defender.",
    accentColor: "text-spark",
    borderColor: "border-spark/20",
    bgColor: "bg-spark/[0.08]",
    iconColor: "text-spark",
  },
  {
    icon: Trophy,
    tag: "Maestría con SM-2",
    title: "Nova recuerda lo que fallaste.",
    body: "Cada sesión actualiza tu nivel de maestría por tema usando el algoritmo SM-2 de repetición espaciada. Los temas que más fallas vuelven antes. Los que dominas esperan más.",
    hint: "Después de tu primera sesión real, verás la barra de maestría moverse.",
    accentColor: "text-nova-mid",
    borderColor: "border-nova-mid/20",
    bgColor: "bg-nova-mid/[0.08]",
    iconColor: "text-nova-mid",
  },
];

export function WelcomeTour() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = SLIDES[slide];
  const Icon = current.icon;
  const isLast = slide === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#0a0c11] border border-white/[0.08] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Progress bar */}
        <div className="h-[2px] bg-white/[0.04] w-full">
          <div
            className="h-full bg-spark transition-all duration-500 ease-out"
            style={{ width: `${((slide + 1) / SLIDES.length) * 100}%` }}
          />
        </div>

        {/* Ecosystem identity */}
        <div className="flex items-center gap-2 px-6 pt-4 pb-0">
          <div className="w-5 h-5 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center">
            <Zap className="w-2.5 h-2.5 text-spark" strokeWidth={1.5} fill="currentColor" />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/40">
            Spark · Focus OS
          </span>
          <div className="flex-1" />
          <button onClick={dismiss} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1">
            <X className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 sm:p-8 pt-5">
          {/* Slide counter */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-[10px] text-muted-foreground/40">
              {slide + 1} / {SLIDES.length}
            </span>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-5">
            <div className={`w-10 h-10 rounded-xl ${current.bgColor} border ${current.borderColor} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${current.iconColor}`} strokeWidth={1.5} />
            </div>

            <div>
              <span className={`font-mono text-[10px] uppercase tracking-[0.2em] ${current.accentColor} mb-2 block`}>
                {current.tag}
              </span>
              <h2 className="text-2xl font-semibold leading-tight mb-3 tracking-tight">{current.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
            </div>

            <div className="text-xs text-muted-foreground/50 border-l-2 border-white/[0.05] pl-3 italic leading-relaxed">
              {current.hint}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setSlide((s) => s - 1)}
              disabled={slide === 0}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground disabled:opacity-0 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              Anterior
            </button>

            {isLast ? (
              <Button onClick={dismiss} variant="spark" size="sm">
                Empezar a entrenar
              </Button>
            ) : (
              <button
                onClick={() => setSlide((s) => s + 1)}
                className="inline-flex items-center gap-1.5 text-sm text-foreground hover:text-spark transition-colors"
              >
                Siguiente
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
