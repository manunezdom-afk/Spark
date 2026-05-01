"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  Flame,
  HelpCircle,
  Sparkles,
  Trophy,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/brand/GradientText";
import { useTutorialStore } from "@/lib/tutorial/store";
import { cn } from "@/lib/utils/cn";
import {
  WelcomeBrandAnim,
  WelcomeMasteryAnim,
  WelcomeMethodsAnim,
  WelcomeNovaAnim,
  WelcomeStartAnim,
  WelcomeTopicsAnim,
} from "./welcomeAnimations";

interface Slide {
  key: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  highlight?: string;
  Icon: ComponentType<{ className?: string; strokeWidth?: number | string }>;
  Animation: ComponentType;
}

const SLIDES: Slide[] = [
  {
    key: "welcome",
    eyebrow: "Hola.",
    title: (
      <>
        No memorices. <GradientText italic>Entrena.</GradientText>
      </>
    ),
    body: "Spark transforma tu material en sesiones de estudio activo. Nova hace de coach: te pregunta, te corrige y detecta lo que aún no dominas.",
    highlight: "Te muestro en 60 segundos cómo se usa.",
    Icon: Zap,
    Animation: WelcomeBrandAnim,
  },
  {
    key: "topics",
    eyebrow: "Paso 1 · Tus temas",
    title: (
      <>
        Crea o importa <GradientText italic>tus temas.</GradientText>
      </>
    ),
    body: "Un tema es una unidad de conocimiento que entrenas. Pega un texto y Spark extrae los conceptos, o importa tus materias desde Kairos para usar tus apuntes reales.",
    highlight: "Los temas viven en la sección Temas y se editan o borran cuando quieras.",
    Icon: BookOpen,
    Animation: WelcomeTopicsAnim,
  },
  {
    key: "methods",
    eyebrow: "Paso 2 · Métodos de estudio",
    title: (
      <>
        Cinco formas de <GradientText italic>entrenar.</GradientText>
      </>
    ),
    body: "Preguntas guiadas, cazar errores, defender postura, conectar temas y caso real. Más pruebas simuladas (alternativas o desarrollo) con corrección automática.",
    highlight: "Elige el método según lo que necesites: entender, aplicar o defender.",
    Icon: Brain,
    Animation: WelcomeMethodsAnim,
  },
  {
    key: "nova",
    eyebrow: "Paso 3 · Nova",
    title: (
      <>
        Nova es tu <GradientText italic>guía.</GradientText>
      </>
    ),
    body: "Pulsa N en cualquier momento para abrir Nova. Te genera tarjetas, resume un tema, te explica como profesor o detecta tus puntos débiles. También responde dudas sobre cómo usar Spark.",
    highlight: "Atajo: pulsa N (o el botón Nova arriba a la izquierda).",
    Icon: Sparkles,
    Animation: WelcomeNovaAnim,
  },
  {
    key: "mastery",
    eyebrow: "Paso 4 · Maestría",
    title: (
      <>
        Spark recuerda lo que <GradientText italic>fallaste.</GradientText>
      </>
    ),
    body: "Cada sesión actualiza tu nivel por tema con SM-2 (repetición espaciada). Lo que más fallas vuelve antes; lo que dominas espera más. Sin configurar nada.",
    highlight: "En Maestría ves tu progreso y qué tema toca repasar hoy.",
    Icon: Trophy,
    Animation: WelcomeMasteryAnim,
  },
  {
    key: "help",
    eyebrow: "Si te pierdes",
    title: (
      <>
        Pregúntale a Nova <GradientText italic>cómo se usa.</GradientText>
      </>
    ),
    body: "El botón flotante con un signo de interrogación abre la ayuda en cualquier pantalla. También puedes preguntarle directamente a Nova: '¿cómo creo un tema?', '¿qué método uso hoy?' y similares.",
    highlight: "Atajo de ayuda: pulsa ? en cualquier pantalla.",
    Icon: HelpCircle,
    Animation: WelcomeNovaAnim,
  },
  {
    key: "start",
    eyebrow: "Listo",
    title: (
      <>
        Vamos a tu <GradientText italic>primer tema.</GradientText>
      </>
    ),
    body: "Empezamos creando o importando un tema. En menos de 2 minutos puedes tener tu primera sesión activa.",
    Icon: Flame,
    Animation: WelcomeStartAnim,
  },
];

export function WelcomeTour() {
  const open = useTutorialStore((s) => s.welcomeOpen);
  const seen = useTutorialStore((s) => s.welcomeSeen);
  const hasHydrated = useTutorialStore((s) => s.hasHydrated);
  const openWelcome = useTutorialStore((s) => s.openWelcome);
  const closeWelcome = useTutorialStore((s) => s.closeWelcome);

  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");
  const total = SLIDES.length;

  // Hidratar el store en el primer ingreso al cliente.
  useEffect(() => {
    void useTutorialStore.persist.rehydrate();
  }, []);

  // Si nunca se vio, abrir tras la hidratación.
  useEffect(() => {
    if (!hasHydrated) return;
    if (!seen && !open) {
      const id = setTimeout(() => openWelcome(), 350);
      return () => clearTimeout(id);
    }
  }, [hasHydrated, seen, open, openWelcome]);

  // Reset al abrir.
  useEffect(() => {
    if (open) {
      setIndex(0);
      setDir("next");
    }
  }, [open]);

  // Teclado.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeWelcome();
      else if (e.key === "ArrowRight") {
        setDir("next");
        setIndex((i) => Math.min(total - 1, i + 1));
      } else if (e.key === "ArrowLeft") {
        setDir("prev");
        setIndex((i) => Math.max(0, i - 1));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeWelcome, total]);

  if (!open) return null;

  const slide = SLIDES[index];
  const isLast = index === total - 1;
  const Icon = slide.Icon;
  const Animation = slide.Animation;

  function next() {
    setDir("next");
    setIndex((i) => Math.min(total - 1, i + 1));
  }
  function prev() {
    setDir("prev");
    setIndex((i) => Math.max(0, i - 1));
  }
  function finish() {
    closeWelcome();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 sm:px-6"
      style={{
        background: "rgba(20, 16, 28, 0.45)",
        backdropFilter: "blur(8px)",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Bienvenida a Spark"
    >
      <div
        className="relative w-full max-w-[480px] rounded-[26px] overflow-hidden bg-card"
        style={{
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.5) inset, 0 30px 80px rgba(0,0,0,0.18)",
          animation:
            "spark-welcome-fade-in 380ms cubic-bezier(0.34, 1.4, 0.64, 1) both",
          maxHeight: "min(680px, 92dvh)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 pt-3 sm:px-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-spark/[0.08] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-spark">
            <Sparkles className="h-3 w-3" strokeWidth={1.75} />
            Tour
          </span>
          <div className="flex items-center gap-1">
            {!isLast && (
              <button
                type="button"
                onClick={finish}
                className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground"
              >
                Saltar
              </button>
            )}
            <button
              type="button"
              onClick={finish}
              aria-label="Cerrar tour"
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-black/[0.04] hover:text-foreground"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Animation stage */}
        <div className="relative mt-2 h-[200px]">
          <div
            key={`anim-${slide.key}-${dir}`}
            className="spark-welcome-stage-fade absolute inset-0"
          >
            <Animation />
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 px-6 pb-3 pt-5">
          <div
            key={`eyebrow-${slide.key}`}
            className="flex items-center gap-1.5 text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-muted-foreground spark-welcome-stage-fade"
          >
            <Icon className="h-3 w-3 text-spark" strokeWidth={1.75} />
            {slide.eyebrow}
          </div>
          <h2
            key={`title-${slide.key}`}
            className="text-[1.55rem] font-light leading-[1.18] tracking-tight text-foreground sm:text-[1.7rem] spark-welcome-stage-fade"
            style={{ animationDelay: "60ms" }}
          >
            {slide.title}
          </h2>
          <p
            key={`body-${slide.key}`}
            className="text-[14px] text-muted-foreground leading-[1.65] spark-welcome-stage-fade"
            style={{ animationDelay: "100ms" }}
          >
            {slide.body}
          </p>
          {slide.highlight && (
            <p
              key={`hint-${slide.key}`}
              className="mt-1 inline-flex items-start gap-1.5 rounded-xl border border-black/[0.06] bg-black/[0.02] px-3 py-2 text-[12px] text-muted-foreground spark-welcome-stage-fade"
              style={{ animationDelay: "140ms" }}
            >
              <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-spark" />
              <span>{slide.highlight}</span>
            </p>
          )}
        </div>

        {/* Pagination dots */}
        <div className="flex items-center justify-center gap-1.5 px-4 pb-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onClick={() => {
                setDir(i > index ? "next" : "prev");
                setIndex(i);
              }}
              aria-label={`Ir al paso ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index
                  ? "w-6 bg-spark"
                  : "w-1.5 bg-black/[0.12] hover:bg-black/[0.22]",
              )}
            />
          ))}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-2 border-t border-black/[0.06] bg-black/[0.02] px-4 py-3 sm:px-5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={index === 0}
            className={cn(index === 0 && "opacity-0 pointer-events-none")}
          >
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
            Atrás
          </Button>

          {isLast ? (
            <Button type="button" variant="spark" size="sm" onClick={finish}>
              Ir a mis temas
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          ) : (
            <Button type="button" variant="spark" size="sm" onClick={next}>
              Siguiente
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
          )}
        </div>

        {/* Progress bar arriba */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-black/[0.05]">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${((index + 1) / total) * 100}%`,
              background: "var(--gradient-nova)",
            }}
          />
        </div>
      </div>
    </div>
  );
}
