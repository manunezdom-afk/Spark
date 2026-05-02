"use client";

import type { CSSProperties } from "react";
import { Sparkles } from "lucide-react";
import { NovaMark } from "@/components/nova/NovaMark";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine } from "@/modules/spark/types";

/**
 * Compact Nova ribbon used inside an experience to mark "this content
 * came from Nova" without taking over the layout. Replaces the old
 * MethodChallengeCard which dominated the screen — this is a thin
 * accent strip the experience embeds where it makes sense (above a
 * question, an attack, a proposal, a scene line).
 */
export function NovaCoachRibbon({
  engine,
  label,
  className,
}: {
  engine: LearningEngine;
  /** Verb tag, e.g. "está formulando", "lanzó una objeción", "propone". */
  label: string;
  className?: string;
}) {
  const theme = getEngineTheme(engine);
  const style = {
    "--engine-accent": theme.accent,
    background: hexToRgba(theme.accent, 0.08),
    color: theme.accent,
    border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
  } as CSSProperties;

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 h-6 rounded-full text-[10px] font-mono uppercase tracking-[0.16em] ${className ?? ""}`}
      style={style}
    >
      <NovaMark size={11} />
      {label}
    </span>
  );
}

/**
 * Tiny "Nova is thinking" indicator used while streaming. Shows a
 * pulsing dot + the engine-specific verb. Replaces the old streaming
 * card that took the full row.
 */
export function NovaThinking({
  engine,
  text,
  fullText,
}: {
  engine: LearningEngine;
  text: string; // streamingText (may be empty)
  fullText?: boolean; // when true, render the streaming text below the ribbon
}) {
  const theme = getEngineTheme(engine);
  return (
    <div className="flex flex-col gap-2">
      <span
        className="inline-flex items-center gap-2 self-start px-2.5 h-6 rounded-full text-[10px] font-mono uppercase tracking-[0.16em]"
        style={{
          background: hexToRgba(theme.accent, 0.08),
          color: theme.accent,
          border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
        }}
      >
        <Sparkles className="w-3 h-3 animate-pulse" strokeWidth={1.7} />
        <span>{text ? "Nova respondiendo…" : `Nova ${theme.streamingLabel}…`}</span>
      </span>
      {fullText && text && (
        <p className="text-[14px] leading-relaxed text-foreground/80 whitespace-pre-wrap">
          {text}
          <span
            className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-spark-cursor"
            style={{ background: theme.accent, opacity: 0.7 }}
          />
        </p>
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
