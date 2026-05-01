"use client";

import {
  ArrowRight,
  Brain,
  CheckSquare,
  Flame,
  HelpCircle,
  Layers,
  Lightbulb,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import { BrandOrb } from "@/components/brand/BrandOrb";
import { NovaMark } from "@/components/nova/NovaMark";

/**
 * Animaciones grandes para los slides del WelcomeTour de Spark.
 * Cada una vive en un contenedor de 200px de alto.
 *
 * Las animaciones usan keyframes definidos en globals.css con prefijo
 * `spark-welcome-` y son puramente CSS — sin JS.
 */

export function WelcomeBrandAnim() {
  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      <div className="spark-welcome-glow" aria-hidden />
      <div className="spark-welcome-orb">
        <BrandOrb size="lg" spinning />
      </div>
      <span className="spark-welcome-orbit-dot spark-welcome-orbit-dot--a" />
      <span className="spark-welcome-orbit-dot spark-welcome-orbit-dot--b" />
      <span className="spark-welcome-orbit-dot spark-welcome-orbit-dot--c" />
      <span className="spark-welcome-orbit-dot spark-welcome-orbit-dot--d" />
    </div>
  );
}

export function WelcomeTopicsAnim() {
  const topics = [
    { tag: "Algoritmos", title: "Búsqueda binaria", color: "var(--color-spark)" },
    { tag: "Marketing", title: "Embudo AARRR", color: "#8B5CF6" },
    { tag: "Cálculo", title: "Series de Taylor", color: "#5DD2A8" },
  ];
  return (
    <div className="relative h-full w-full flex items-center justify-center px-6">
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {topics.map((t, i) => (
          <div
            key={t.title}
            className="spark-welcome-topic"
            style={{
              animationDelay: `${i * 220}ms`,
              borderLeftColor: t.color,
            }}
          >
            <span
              className="text-[9px] font-mono uppercase tracking-[0.16em]"
              style={{ color: t.color }}
            >
              {t.tag}
            </span>
            <span className="text-sm font-semibold text-foreground">{t.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WelcomeMethodsAnim() {
  const methods = [
    { Icon: HelpCircle, label: "Socrático" },
    { Icon: Lightbulb, label: "Errores" },
    { Icon: MessageCircle, label: "Debate" },
    { Icon: Layers, label: "Conectar" },
  ];
  return (
    <div className="relative h-full w-full flex items-center justify-center px-6">
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {methods.map(({ Icon, label }, i) => (
          <div
            key={label}
            className="spark-welcome-method"
            style={{ animationDelay: `${i * 180}ms` }}
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-spark/10 text-spark border border-spark/20">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </span>
            <span className="text-xs font-semibold text-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WelcomeNovaAnim() {
  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      <div className="spark-welcome-nova-glow" aria-hidden />
      <div className="spark-welcome-nova-pill">
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-white"
          style={{ background: "var(--gradient-nova)" }}
        >
          <NovaMark size={14} variant="filled" />
        </span>
        <span className="text-xs font-semibold text-foreground">Nova</span>
      </div>
      <div
        className="spark-welcome-nova-card spark-welcome-nova-card--a"
        style={{ animationDelay: "0.15s" }}
      >
        <Sparkles className="h-3 w-3 text-nova" />
        <span>Crear 6 tarjetas</span>
      </div>
      <div
        className="spark-welcome-nova-card spark-welcome-nova-card--b"
        style={{ animationDelay: "0.45s" }}
      >
        <Sparkles className="h-3 w-3 text-nova" />
        <span>Resumir tema</span>
      </div>
      <div
        className="spark-welcome-nova-card spark-welcome-nova-card--c"
        style={{ animationDelay: "0.75s" }}
      >
        <Sparkles className="h-3 w-3 text-nova" />
        <span>Detectar débiles</span>
      </div>
    </div>
  );
}

export function WelcomeMasteryAnim() {
  const bars = [
    { label: "Marketing", score: 78 },
    { label: "Algoritmos", score: 42 },
    { label: "Cálculo", score: 12 },
  ];
  return (
    <div className="relative h-full w-full flex items-center justify-center px-6">
      <div className="flex flex-col gap-3 w-full max-w-xs">
        {bars.map((b, i) => (
          <div
            key={b.label}
            className="spark-welcome-bar"
            style={{ animationDelay: `${i * 200}ms` }}
          >
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="font-medium text-foreground">{b.label}</span>
              <span className="font-mono text-muted-foreground">
                {b.score}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-black/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-spark to-spark/70 spark-welcome-bar-fill"
                style={{
                  width: `${b.score}%`,
                  animationDelay: `${i * 200 + 200}ms`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WelcomeStartAnim() {
  return (
    <div className="relative h-full w-full flex items-center justify-center overflow-hidden">
      <div className="spark-welcome-start-glow" aria-hidden />
      <div className="spark-welcome-start-pill">
        <Flame className="h-4 w-4 text-spark" strokeWidth={1.75} />
        <span className="text-xs font-semibold text-foreground">
          Lo importante de hoy
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" strokeWidth={2} />
      </div>
      <span className="spark-welcome-conf spark-welcome-conf--a" />
      <span className="spark-welcome-conf spark-welcome-conf--b" />
      <span className="spark-welcome-conf spark-welcome-conf--c" />
      <span className="spark-welcome-conf spark-welcome-conf--d" />
      <span className="spark-welcome-conf spark-welcome-conf--e" />
      <Brain
        className="absolute right-6 top-6 h-4 w-4 text-spark/30"
        strokeWidth={1.5}
      />
      <CheckSquare
        className="absolute left-7 bottom-8 h-4 w-4 text-spark/30"
        strokeWidth={1.5}
      />
    </div>
  );
}
