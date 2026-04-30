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
        italic && "italic",
        className,
      )}
    >
      {children}
    </span>
  );
}
