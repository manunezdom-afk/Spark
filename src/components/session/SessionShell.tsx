"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine, SparkTopic } from "@/modules/spark/types";

/**
 * Method-agnostic shell. Owns the header chrome, exit, finalize button,
 * theme variables and the framed content surface — but it does NOT
 * impose a chat layout. Each method's experience renders inside `children`
 * with its own internal mechanics: capas, rondas, mapa, escena, etc.
 *
 * Replaces the old MethodSessionShell which embedded a HUD that assumed
 * a single conversation timeline. The HUD is now delegated to each
 * experience because the metric (precisión, solidez, conexiones,
 * decisiones, capa actual) is method-specific.
 */
export function SessionShell({
  engine,
  topics,
  status,
  onComplete,
  canComplete,
  hudSlot,
  children,
}: {
  engine: LearningEngine;
  topics: SparkTopic[];
  status: "active" | "completed" | "abandoned";
  onComplete?: () => void;
  /** Disable the finalize button when the experience hasn't gathered enough input. */
  canComplete?: boolean;
  /** Optional method-specific HUD rendered below the header (capas, rondas, etc). */
  hudSlot?: ReactNode;
  children: ReactNode;
}) {
  const theme = getEngineTheme(engine);
  const Icon = theme.Icon;

  const shellStyle = {
    "--engine-accent": theme.accent,
    "--engine-accent-soft": hexToRgba(theme.accent, 0.07),
    "--engine-tint": theme.tint,
  } as CSSProperties;

  const showFinalize = status === "active" && Boolean(onComplete);
  const finalizeDisabled = canComplete === false;
  const statusLabel =
    status === "completed"
      ? "Completada"
      : status === "abandoned"
        ? "Abandonada"
        : "En curso";

  return (
    <div
      className="flex flex-col min-h-screen"
      style={shellStyle}
    >
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-background/85 backdrop-blur-xl">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: theme.headerGradient, opacity: 0.7 }}
          aria-hidden
        />
        <div className="relative flex items-center justify-between gap-3 px-5 md:px-8 h-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            Salir
          </Link>

          <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border bg-white/80 shrink-0"
              style={{
                borderColor: hexToRgba(theme.accent, 0.28),
                color: theme.accent,
              }}
            >
              <Icon className="w-4 h-4" strokeWidth={1.7} />
            </span>
            <div className="flex flex-col items-start min-w-0">
              <span
                className="font-mono text-[9.5px] uppercase tracking-[0.18em] leading-none"
                style={{ color: theme.accent }}
              >
                Spark · {theme.vibe}
              </span>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[13px] font-semibold text-foreground leading-tight">
                  {ENGINE_LABELS[engine]}
                </span>
                <span className="text-[11px] text-muted-foreground truncate hidden sm:inline">
                  · {topics.map((t) => t.title).join(" · ")}
                </span>
              </div>
            </div>
          </div>

          {showFinalize ? (
            <Button
              onClick={onComplete}
              size="sm"
              variant="outline"
              disabled={finalizeDisabled}
              title={finalizeDisabled ? "Necesitas avanzar antes de finalizar" : undefined}
            >
              Finalizar
            </Button>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {statusLabel}
            </span>
          )}
        </div>

        {hudSlot && (
          <div className="relative px-5 md:px-8 pb-3 pt-1">{hudSlot}</div>
        )}
      </header>

      <div className="flex-1 relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 12% -10%, ${theme.tint}, transparent 50%), radial-gradient(ellipse at 90% 110%, ${theme.tint}, transparent 50%)`,
          }}
          aria-hidden
        />
        <div className="relative w-full">{children}</div>
      </div>
    </div>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
