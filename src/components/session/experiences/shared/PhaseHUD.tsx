"use client";

import type { CSSProperties } from "react";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine } from "@/modules/spark/types";

/**
 * Reusable phase HUD: kicker label + N segmented pills + a meter.
 * Each experience constructs the labels/meter that fit its mechanic
 * (capas, rondas, actos, conexiones). The shell delegates the body
 * via SessionShell.hudSlot — that's how we keep the chrome consistent
 * without forcing the same UX across methods.
 */
export function PhaseHUD({
  engine,
  kicker,
  phaseLabels,
  currentPhase,
  meterLabel,
  meterValue,
  badge,
}: {
  engine: LearningEngine;
  /** Top-left tag, e.g. "Profundidad", "Round", "Inspección". */
  kicker: string;
  /** All phases (e.g. ["Superficie", "Causalidad", "Límites", "Síntesis"]). */
  phaseLabels: string[];
  /** 0-based current phase index. */
  currentPhase: number;
  /** Optional secondary meter (precisión, solidez, conexiones, decisiones). */
  meterLabel?: string;
  meterValue?: number; // 0..1
  /** Optional inline badge ("2 / 3 cazados"). */
  badge?: string;
}) {
  const theme = getEngineTheme(engine);
  const total = phaseLabels.length;
  const safePhase = Math.min(Math.max(currentPhase, 0), total - 1);
  const currentLabel = phaseLabels[safePhase] ?? "";

  const style = {
    "--engine-accent": theme.accent,
  } as CSSProperties;

  return (
    <div style={style}>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="font-mono text-[9.5px] uppercase tracking-[0.2em] shrink-0"
            style={{ color: theme.accent }}
          >
            {kicker} {safePhase + 1} / {total}
          </span>
          {currentLabel && (
            <span className="text-[11.5px] font-medium text-foreground/85 truncate">
              {currentLabel}
            </span>
          )}
          {badge && (
            <span
              className="font-mono text-[10px] uppercase tracking-[0.14em] px-2 h-5 rounded-full inline-flex items-center"
              style={{
                background: hexToRgba(theme.accent, 0.10),
                color: theme.accent,
                border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
              }}
            >
              {badge}
            </span>
          )}
        </div>

        {meterLabel && meterValue !== undefined && (
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
              {meterLabel}
            </span>
            <div
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ background: hexToRgba(theme.accent, 0.10) }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${Math.round(clamp(meterValue, 0, 1) * 100)}%`,
                  background: theme.coachGradient,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {phaseLabels.length > 1 && (
        <div className="mt-2 flex items-center gap-1.5">
          {phaseLabels.map((label, i) => {
            const isDone = i < safePhase;
            const isCurrent = i === safePhase;
            return (
              <span
                key={label}
                className="h-1 rounded-full flex-1 transition-all"
                style={{
                  background: isDone
                    ? theme.accent
                    : isCurrent
                      ? hexToRgba(theme.accent, 0.55)
                      : "rgba(0,0,0,0.06)",
                }}
              />
            );
          })}
        </div>
      )}
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

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
