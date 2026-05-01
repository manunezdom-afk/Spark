"use client";

import * as React from "react";

import { NovaMark } from "@/components/nova/NovaMark";
import { useNovaAsk } from "@/components/nova/NovaAskProvider";
import { useNovaContext } from "@/lib/nova/context";
import { cn } from "@/lib/utils/cn";

type NovaPillVariant = "bar" | "compact" | "stacked" | "icon";

interface NovaPillProps {
  variant?: NovaPillVariant;
  className?: string;
}

export function NovaPill({ variant = "bar", className }: NovaPillProps) {
  const ask = useNovaAsk();
  const ctx = useNovaContext();

  const ariaLabel = `Pregúntale a Nova sobre ${ctx.scopeLabel}`;

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={ask.open}
        aria-label={ariaLabel}
        title={`${ariaLabel} · pulsa N`}
        className={cn(
          "grid h-7 w-7 shrink-0 place-items-center rounded-md text-white shadow-[0_2px_10px_var(--color-nova-glow)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova/40 active:scale-95",
          className,
        )}
        style={{ background: "var(--gradient-nova)" }}
      >
        <NovaMark size={12} variant="filled" />
      </button>
    );
  }

  if (variant === "stacked") {
    return (
      <button
        type="button"
        onClick={ask.open}
        aria-label={ariaLabel}
        className={cn(
          "relative flex h-14 flex-col items-center justify-center gap-0.5 text-nova transition-colors",
          className,
        )}
      >
        <span
          className="grid h-7 w-7 place-items-center rounded-full text-white shadow-[0_4px_14px_var(--color-nova-glow)]"
          style={{ background: "var(--gradient-nova)" }}
        >
          <NovaMark size={13} variant="filled" />
        </span>
        <span className="text-[10px] font-semibold">Nova</span>
      </button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={ask.open}
        aria-label={ariaLabel}
        className={cn(
          "grid h-9 w-9 place-items-center rounded-md text-white shadow-sm transition-transform hover:scale-[1.04] active:scale-95",
          className,
        )}
        style={{ background: "var(--gradient-nova)" }}
      >
        <NovaMark size={14} variant="filled" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={ask.open}
      aria-label={ariaLabel}
      title={`${ariaLabel} · pulsa N`}
      className={cn(
        "group inline-flex h-9 max-w-full items-center gap-2 overflow-hidden rounded-full border border-nova/20 bg-white/70 px-2.5 text-left text-xs font-medium text-foreground transition-all hover:border-nova/40 hover:bg-nova-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova/30",
        className,
      )}
    >
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-white shadow-[0_2px_10px_var(--color-nova-glow)]"
        style={{ background: "var(--gradient-nova)" }}
      >
        <NovaMark size={11} variant="filled" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[11px] font-semibold text-foreground">
          Pregúntale a Nova
        </span>
        <span className="truncate text-[10px] font-normal text-muted-foreground/70">
          {ctx.scopeLabel}
        </span>
      </span>
      <kbd className="hidden shrink-0 rounded border border-black/[0.08] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground md:inline">
        N
      </kbd>
    </button>
  );
}
