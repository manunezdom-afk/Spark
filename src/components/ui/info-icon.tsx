"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

interface InfoIconProps {
  hint: string;
  className?: string;
  side?: "top" | "right" | "bottom" | "left";
  /** Tamaño del icono — sm = 12px, md = 14px (default) */
  size?: "sm" | "md";
}

/**
 * Pequeño icono de ayuda con tooltip Radix. Usar junto a labels o
 * títulos donde el usuario podría preguntarse "¿qué es esto?".
 *   <label>Maestría <InfoIcon hint="..." /></label>
 */
export function InfoIcon({ hint, className, side = "top", size = "md" }: InfoIconProps) {
  const dims = size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label="Más información"
          className={cn(
            "inline-flex items-center justify-center align-middle text-muted-foreground/60",
            "hover:text-foreground transition-colors rounded-full",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
        >
          <Info className={dims} strokeWidth={1.5} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>{hint}</TooltipContent>
    </Tooltip>
  );
}
