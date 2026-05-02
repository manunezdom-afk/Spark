"use client";

import { useRef, useEffect, useState, type CSSProperties } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine } from "@/modules/spark/types";

export function UserResponseInput({
  value,
  onChange,
  onSubmit,
  disabled,
  engine,
  placeholder = "Tu respuesta…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  engine: LearningEngine;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);
  const theme = getEngineTheme(engine);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  const wrapperStyle = {
    "--engine-accent": theme.accent,
  } as CSSProperties;
  const ringColor = focused ? hexToRgba(theme.accent, 0.5) : "rgba(0, 0, 0, 0.08)";
  const shadow = focused
    ? `0 0 0 4px ${hexToRgba(theme.accent, 0.12)}, 0 12px 32px rgba(0,0,0,0.05)`
    : "0 8px 24px rgba(0, 0, 0, 0.04)";
  const canSubmit = value.trim().length > 0 && !disabled;

  return (
    <div
      className="sticky bottom-0 px-5 md:px-8 py-4 border-t border-black/[0.06] bg-background/92 backdrop-blur-xl"
      style={wrapperStyle}
    >
      <div className="relative max-w-3xl mx-auto">
        <div
          className="relative rounded-2xl bg-white/85 transition-all duration-200"
          style={{
            border: `1px solid ${ringColor}`,
            boxShadow: shadow,
          }}
        >
          <span
            className="absolute left-4 top-3 font-mono text-[9px] uppercase tracking-[0.2em]"
            style={{ color: theme.accent, opacity: 0.65 }}
          >
            Tu respuesta
          </span>
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className={cn(
              "w-full pr-14 pl-4 pt-7 pb-3 rounded-2xl bg-transparent text-[14px] leading-relaxed",
              "placeholder:text-muted-foreground/65 resize-none scrollbar-thin",
              "focus:outline-none disabled:opacity-50",
            )}
          />
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            aria-label="Enviar respuesta"
            className={cn(
              "absolute right-2.5 bottom-2.5 w-9 h-9 rounded-xl flex items-center justify-center transition-all",
              canSubmit ? "text-white active:scale-95" : "bg-black/[0.06] text-muted-foreground cursor-not-allowed",
            )}
            style={
              canSubmit
                ? {
                    background: theme.coachGradient,
                    boxShadow: `0 6px 18px ${hexToRgba(theme.accent, 0.34)}`,
                  }
                : undefined
            }
          >
            <ArrowUp className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-muted-foreground">
          <span className="opacity-70">
            {disabled ? "Espera la respuesta de Nova…" : "Sin formulas. Escribe como hablas."}
          </span>
          <span className="hidden md:inline">Cmd / Ctrl + Enter</span>
        </div>
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
