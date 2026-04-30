"use client";

import { useState, useEffect } from "react";
import { X, Zap, BookOpen, Brain, Trophy, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "spark:welcome-tour-seen";

const SLIDES = [
  {
    icon: Zap,
    tag: "Bienvenido",
    title: "No memorices. Entrena.",
    body: "Spark no es un lugar para guardar notas. Nova te hace preguntas difíciles, detecta lo que no sabes y te lleva al borde de tu propio entendimiento.",
    hint: "Abajo tienes temas de ejemplo para que veas cómo funciona.",
  },
  {
    icon: BookOpen,
    tag: "Tus temas",
    title: "Cada tema es una unidad de combate.",
    body: "Crea temas manualmente, extráelos pegando texto, o importa directamente tus materias desde Kairos. Spark lee tus propias notas de clase y las usa como contexto.",
    hint: "Los temas marcados con 'Kairos' usan tus notas reales en cada sesión.",
  },
  {
    icon: Brain,
    tag: "Los 5 motores",
    title: "Cada motor te ataca distinto.",
    body: "Socrático te pregunta hasta que expliques bien. Debugger te mete errores a propósito. Abogado del diablo contradice todo lo que dices. Bridge Builder conecta conceptos. Roleplay te pone en situaciones reales.",
    hint: "Elige el motor según lo que necesitas: entender, aplicar o defender.",
  },
  {
    icon: Trophy,
    tag: "Maestría",
    title: "Nova recuerda lo que fallaste.",
    body: "Cada sesión actualiza tu nivel de maestría por tema usando el algoritmo SM-2 de repetición espaciada. Los temas que más fallas vuelven antes. Los que dominas esperan más.",
    hint: "Después de tu primera sesión real, verás la barra de maestría moverse.",
  },
];

export function WelcomeTour() {
  const [visible, setVisible] = useState(false);
  const [slide, setSlide] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  function goNext() {
    setDir("next");
    setAnimKey((k) => k + 1);
    setSlide((s) => s + 1);
  }

  function goPrev() {
    setDir("prev");
    setAnimKey((k) => k + 1);
    setSlide((s) => s - 1);
  }

  if (!visible) return null;

  const current = SLIDES[slide];
  const Icon = current.icon;
  const isLast = slide === SLIDES.length - 1;

  return (
    <>
      <style jsx global>{`
        @keyframes spark-tour-in {
          from { opacity: 0; transform: scale(0.96) translateY(10px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes spark-tour-from-right {
          from { opacity: 0; transform: translateX(22px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spark-tour-from-left {
          from { opacity: 0; transform: translateX(-22px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div
          className="w-full max-w-md bg-[#0a0c11] border border-white/[0.08] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.6)] overflow-hidden"
          style={{ animation: "spark-tour-in 320ms cubic-bezier(0.34, 1.4, 0.64, 1) both" }}
        >
          {/* Progress bar */}
          <div className="h-[2px] bg-white/[0.04] w-full">
            <div
              className="h-full bg-spark transition-all duration-500 ease-out"
              style={{ width: `${((slide + 1) / SLIDES.length) * 100}%` }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center gap-2 px-6 pt-4 pb-0">
            <div className="w-5 h-5 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-spark" strokeWidth={1.5} fill="currentColor" />
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-muted-foreground/40">
              Spark · Focus OS
            </span>
            <div className="flex-1" />
            <button
              onClick={dismiss}
              className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Animated content */}
          <div className="overflow-hidden">
            <div
              key={animKey}
              className="px-6 sm:px-8 pt-6 pb-2"
              style={{
                animation: `${
                  dir === "next" ? "spark-tour-from-right" : "spark-tour-from-left"
                } 260ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
              }}
            >
              <div className="flex flex-col gap-5">
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-foreground/60" strokeWidth={1.5} />
                </div>

                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2 block">
                    {current.tag}
                  </span>
                  <h2 className="text-2xl font-semibold leading-tight mb-3 tracking-tight">
                    {current.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{current.body}</p>
                </div>

                <div className="text-xs text-muted-foreground/50 border-l-2 border-white/[0.06] pl-3 italic leading-relaxed">
                  {current.hint}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 sm:px-8 py-5">
            {/* Animated dot indicators */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === slide ? "18px" : "6px",
                    background:
                      i === slide
                        ? "rgba(255,255,255,0.65)"
                        : "rgba(255,255,255,0.16)",
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {slide > 0 && (
                <button
                  onClick={goPrev}
                  className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}

              {isLast ? (
                <Button onClick={dismiss} variant="spark" size="sm">
                  Empezar a entrenar
                </Button>
              ) : (
                <button
                  onClick={goNext}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground px-4 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.09] transition-colors"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
