"use client";

import { getEngineTheme } from "@/modules/spark/engines/themes";
import { getMethodPersonality } from "@/modules/spark/engines/personalities";
import type { LearningEngine } from "@/modules/spark/types";

/**
 * Per-method HUD strip rendered inside the session header. Each method
 * presents a different mechanic — depth layers, rounds, inspection
 * accuracy, scenario acts, validated bridges. The HUD is what makes
 * the session feel like a different app per method.
 */
export function MethodHUD({
  engine,
  phase,
  meterValue,
  badge,
}: {
  engine: LearningEngine;
  /** 0-based current phase / round / layer */
  phase: number;
  /** 0–1 mastered fraction for the meter */
  meterValue: number;
  /** Optional inline badge ("2 / 3 cazados") */
  badge?: string;
}) {
  const theme = getEngineTheme(engine);
  const personality = getMethodPersonality(engine);

  const totalPhases = personality.hudMaxPhases ?? 1;
  const currentLabel =
    personality.hudPhases?.[Math.min(phase, totalPhases - 1)] ?? "";

  return (
    <div className="relative px-5 md:px-8 pb-3 pt-1">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="font-mono text-[9.5px] uppercase tracking-[0.2em] shrink-0"
            style={{ color: theme.accent }}
          >
            {personality.hudTitle} {Math.min(phase + 1, totalPhases)} / {totalPhases}
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

        {personality.meterLabel && (
          <div className="flex items-center gap-2 min-w-[140px]">
            <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-muted-foreground">
              {personality.meterLabel}
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

      {/* Phase pips */}
      {personality.hudPhases && personality.hudPhases.length > 1 && (
        <div className="mt-2 flex items-center gap-1.5">
          {personality.hudPhases.map((label, i) => {
            const isDone = i < phase;
            const isCurrent = i === phase;
            return (
              <div
                key={label}
                className="group flex items-center gap-1.5 flex-1 min-w-0"
              >
                <span
                  className="h-1 rounded-full flex-1 transition-all"
                  style={{
                    background: isDone
                      ? theme.accent
                      : isCurrent
                        ? hexToRgba(theme.accent, 0.55)
                        : "rgba(0,0,0,0.06)",
                  }}
                />
              </div>
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
