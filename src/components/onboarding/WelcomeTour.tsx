"use client";

import { useState, useEffect } from "react";
import { X, Zap, BookOpen, Brain, Trophy, ChevronRight, ChevronLeft } from "lucide-react";

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
          from { opacity: 0; transform: scale(0.95) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        @keyframes spark-tour-right {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes spark-tour-left {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      >
        {/* Card */}
        <div
          className="relative w-full max-w-[420px] rounded-2xl overflow-hidden"
          style={{
            background: "#181c27",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 100px rgba(0,0,0,0.8)",
            animation: "spark-tour-in 340ms cubic-bezier(0.34, 1.3, 0.64, 1) both",
          }}
        >
          {/* Progress bar */}
          <div style={{ height: "3px", background: "rgba(255,255,255,0.06)" }}>
            <div
              style={{
                height: "100%",
                background: "var(--spark, #e07b3a)",
                width: `${((slide + 1) / SLIDES.length) * 100}%`,
                transition: "width 500ms ease-out",
              }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center gap-2 px-5 pt-4">
            <div style={{
              width: 22, height: 22, borderRadius: 6,
              background: "rgba(224,123,58,0.12)",
              border: "1px solid rgba(224,123,58,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap style={{ width: 11, height: 11, color: "var(--spark, #e07b3a)" }} strokeWidth={1.5} fill="currentColor" />
            </div>
            <span style={{
              fontFamily: "monospace", fontSize: 9,
              textTransform: "uppercase", letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.35)",
            }}>
              Spark · Focus OS
            </span>
            <div style={{ flex: 1 }} />
            <button
              onClick={dismiss}
              style={{
                color: "rgba(255,255,255,0.35)", padding: 4, borderRadius: 6,
                background: "transparent", border: "none", cursor: "pointer",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
            >
              <X style={{ width: 14, height: 14 }} strokeWidth={1.5} />
            </button>
          </div>

          {/* Animated slide content */}
          <div style={{ overflow: "hidden" }}>
            <div
              key={animKey}
              style={{
                padding: "24px 28px 16px",
                animation: `${dir === "next" ? "spark-tour-right" : "spark-tour-left"} 270ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
              }}
            >
              {/* Icon */}
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: "rgba(224,123,58,0.10)",
                border: "1px solid rgba(224,123,58,0.22)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 20,
              }}>
                <Icon style={{ width: 22, height: 22, color: "var(--spark, #e07b3a)" }} strokeWidth={1.5} />
              </div>

              {/* Tag */}
              <div style={{
                fontFamily: "monospace", fontSize: 10,
                textTransform: "uppercase", letterSpacing: "0.18em",
                color: "rgba(255,255,255,0.45)",
                marginBottom: 8,
              }}>
                {current.tag}
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: "1.45rem", fontWeight: 600,
                lineHeight: 1.25, letterSpacing: "-0.02em",
                color: "#ffffff",
                margin: "0 0 12px",
              }}>
                {current.title}
              </h2>

              {/* Body */}
              <p style={{
                fontSize: 14, lineHeight: 1.65,
                color: "rgba(255,255,255,0.60)",
                margin: 0,
              }}>
                {current.body}
              </p>

              {/* Hint */}
              <div style={{
                marginTop: 18,
                borderLeft: "2px solid rgba(255,255,255,0.10)",
                paddingLeft: 12,
                fontSize: 12,
                fontStyle: "italic",
                color: "rgba(255,255,255,0.38)",
                lineHeight: 1.6,
              }}>
                {current.hint}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 28px 22px",
          }}>
            {/* Dots */}
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {SLIDES.map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 6, borderRadius: 99,
                    width: i === slide ? 20 : 6,
                    background: i === slide ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.18)",
                    transition: "all 280ms ease",
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {slide > 0 && (
                <button
                  onClick={goPrev}
                  style={{
                    width: 34, height: 34, borderRadius: 8,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.55)", cursor: "pointer",
                    transition: "background 150ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.10)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                >
                  <ChevronLeft style={{ width: 16, height: 16 }} strokeWidth={1.5} />
                </button>
              )}

              {isLast ? (
                <button
                  onClick={dismiss}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 8,
                    background: "#ffffff",
                    border: "none",
                    color: "#13161f",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                    transition: "opacity 150ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Empezar a entrenar
                </button>
              ) : (
                <button
                  onClick={goNext}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: "#ffffff",
                    border: "none",
                    color: "#13161f",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    letterSpacing: "-0.01em",
                    transition: "opacity 150ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Siguiente
                  <ChevronRight style={{ width: 14, height: 14 }} strokeWidth={2} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
