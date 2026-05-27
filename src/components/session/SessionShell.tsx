"use client";

import Link from "next/link";
import { AlertTriangle, ChevronLeft, RotateCcw } from "lucide-react";
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
  errorMessage,
  canRetry,
  onRetry,
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
  /** Banner shown when the last AI call failed; null/undefined hides it. */
  errorMessage?: string | null;
  /** Whether the retry button is enabled (we have a last message to resend). */
  canRetry?: boolean;
  /** Resend the last user message — wired to useSessionEngine.retry. */
  onRetry?: () => void;
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
      <header className="sticky top-0 z-30 border-b border-black/[0.05] bg-background/85 backdrop-blur-xl">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: theme.headerGradient, opacity: 0.6 }}
          aria-hidden
        />
        <div className="relative flex items-center justify-between gap-3 px-5 md:px-8 h-16">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-[13px] text-ink-secondary hover:text-ink transition-colors"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            Salir
          </Link>

          <div className="flex items-center gap-3 min-w-0 flex-1 justify-center">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl border bg-white shrink-0"
              style={{
                borderColor: hexToRgba(theme.accent, 0.28),
                color: theme.accent,
              }}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
            </span>
            <div className="flex flex-col items-start min-w-0">
              <span
                className="text-[11px] font-medium leading-tight tracking-tight"
                style={{ color: theme.accent }}
              >
                {theme.vibe}
              </span>
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-[14px] font-medium text-ink leading-tight">
                  {ENGINE_LABELS[engine]}
                </span>
                <span className="text-[12px] text-ink-tertiary truncate hidden sm:inline">
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
            <span className="font-medium text-[11px] text-ink-tertiary">
              {statusLabel}
            </span>
          )}
        </div>

        {hudSlot && (
          <div className="relative px-5 md:px-8 pb-3 pt-1">{hudSlot}</div>
        )}
      </header>

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="relative border-b border-amber-500/25 bg-amber-50/85 backdrop-blur-sm"
        >
          <div className="px-5 md:px-8 py-2.5 flex items-center gap-3 max-w-5xl mx-auto">
            <AlertTriangle
              className="w-4 h-4 text-amber-700 shrink-0"
              strokeWidth={1.5}
            />
            <p className="text-[13px] text-amber-900 leading-snug flex-1">
              {errorMessage}
            </p>
            {onRetry && (
              <Button
                size="sm"
                variant="outline"
                disabled={!canRetry}
                onClick={onRetry}
                className="shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" strokeWidth={1.5} />
                Reintentar
              </Button>
            )}
          </div>
        </div>
      )}

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
