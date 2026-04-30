"use client";

import { useState, useEffect } from "react";
import { X, BookOpen, Brain, Trophy, ArrowRight, ArrowLeft, Zap } from "lucide-react";
import { BrandOrb } from "@/components/brand/BrandOrb";
import { GradientText } from "@/components/brand/GradientText";

const STORAGE_KEY = "spark:welcome-tour-seen";

const SLIDES = [
  {
    icon: Zap,
    tag: "Hola.",
    title: <>No memorices. <GradientText italic>Entrena.</GradientText></>,
    body: "Spark no es un lugar para guardar notas. Nova te hace preguntas difíciles, detecta lo que no sabes y te lleva al borde de tu propio entendimiento.",
    hint: "Empieza creando un tema o importando tus materias desde Kairos.",
  },
  {
    icon: BookOpen,
    tag: "Tus temas",
    title: <>Cada tema, una <GradientText italic>clase</GradientText> propia.</>,
    body: "Crea temas a mano, pega texto para extraerlos, o importa tus materias desde Kairos. Spark lee tus apuntes y los usa como contexto en cada sesión.",
    hint: "Los temas marcados con 'Kairos' usan tus notas reales en cada sesión.",
  },
  {
    icon: Brain,
    tag: "Cinco motores",
    title: <>Cada motor te <GradientText italic>entrena</GradientText> distinto.</>,
    body: "Cinco caminos según lo que necesites: cazar errores en un texto, defender tu postura, conectar temas, simular un caso real, o responder pregunta a pregunta hasta que te quede claro.",
    hint: "Elige el motor según lo que necesites: entender, aplicar o defender.",
  },
  {
    icon: Trophy,
    tag: "Maestría",
    title: <>Nova recuerda lo que <GradientText italic>fallaste.</GradientText></>,
    body: "Cada sesión actualiza tu nivel de maestría con el algoritmo SM-2 de repetición espaciada. Los temas que más fallas vuelven antes. Los que dominas esperan más.",
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
        @keyframes tour-modal-in {
          from { opacity: 0; transform: scale(0.96) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes tour-content-right {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tour-content-left {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
        style={{
          background: "rgba(20, 16, 28, 0.55)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="relative w-full max-w-[460px] rounded-[28px] overflow-hidden bg-card"
          style={{
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.5) inset, 0 30px 80px rgba(0,0,0,0.18)",
            animation: "tour-modal-in 360ms cubic-bezier(0.34, 1.4, 0.64, 1) both",
          }}
        >
          {/* Animated brand wash at top */}
          <div className="relative h-[120px] overflow-hidden">
            <div className="absolute inset-0 bg-brand-gradient opacity-90" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, rgba(255,255,255,0.55), transparent 60%)",
              }}
            />
            {/* Floating brand orb */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-1/2 animate-float">
              <BrandOrb size="lg" />
            </div>
            {/* Close button */}
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-black/15 hover:bg-black/25 backdrop-blur-sm text-white transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
            {/* Step pill */}
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/15 backdrop-blur-sm text-white text-[10px] font-mono font-medium tracking-wider">
              {slide + 1} / {SLIDES.length}
            </div>
          </div>

          {/* Content (animated per slide) */}
          <div className="overflow-hidden pt-12">
            <div
              key={animKey}
              className="px-8 pb-2"
              style={{
                animation: `${dir === "next" ? "tour-content-right" : "tour-content-left"} 320ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
              }}
            >
              <div className="flex flex-col gap-4 items-center text-center">
                {/* Tag */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-muted-foreground/80">
                  <Icon className="w-3 h-3" strokeWidth={2} />
                  {current.tag}
                </div>

                {/* Title with gradient italic accent */}
                <h2 className="text-[1.7rem] font-light leading-[1.18] tracking-tight text-foreground">
                  {current.title}
                </h2>

                {/* Body */}
                <p className="text-[14px] text-muted-foreground leading-[1.65] max-w-[360px]">
                  {current.body}
                </p>

                {/* Hint */}
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.07] bg-black/[0.02] text-[11px] text-muted-foreground/90">
                  <span className="w-1 h-1 rounded-full bg-spark animate-brand-pulse" />
                  {current.hint}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-7 py-6 mt-4">
            {/* Dots */}
            <div className="flex items-center gap-1.5">
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300 ease-spring"
                  style={{
                    height: 6,
                    width: i === slide ? 22 : 6,
                    background: i === slide
                      ? "linear-gradient(90deg, var(--grad-1), var(--grad-2))"
                      : "rgba(0,0,0,0.12)",
                  }}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {slide > 0 && (
                <button
                  onClick={goPrev}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-black/[0.07] bg-white hover:bg-black/[0.04] transition-colors text-foreground/70 hover:text-foreground"
                  aria-label="Anterior"
                >
                  <ArrowLeft className="w-4 h-4" strokeWidth={1.75} />
                </button>
              )}

              {isLast ? (
                <button
                  onClick={dismiss}
                  className="px-5 py-2.5 rounded-full bg-foreground text-background text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                >
                  Empezar a entrenar
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={goNext}
                  className="px-5 py-2.5 rounded-full bg-foreground text-background text-[13px] font-semibold tracking-tight hover:opacity-90 transition-opacity inline-flex items-center gap-1.5"
                >
                  Siguiente
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
