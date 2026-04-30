import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Inline animated gradient text — for hero accents, italic phrases,
 * "thinking" labels and similar Gemini-style emphasis moments.
 */
export function GradientText({
  children,
  className,
  italic = false,
}: {
  children: ReactNode;
  className?: string;
  italic?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-brand-gradient",
        // inline-block + small inline-end padding gives the italic slant room
        // — without it, `background-clip:text` clips the last character's tail
        // (renders "unidad" as "unidaa", "Entrena" as "Entrenc", etc.)
        italic && "italic inline-block pe-[0.08em]",
        className,
      )}
    >
      {children}
    </span>
  );
}
