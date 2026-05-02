import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine } from "@/modules/spark/types";

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function UserResponseBubble({
  text,
  engine,
}: {
  text: string;
  engine: LearningEngine;
}) {
  const theme = getEngineTheme(engine);

  return (
    <div className="flex justify-end engine-bubble-rise">
      <div className="flex flex-col items-end gap-1.5 max-w-[82%]">
        <span
          className="inline-flex items-center px-2.5 h-5 rounded-full font-mono text-[9px] uppercase tracking-[0.2em]"
          style={{
            background: hexToRgba(theme.accent, 0.13),
            color: theme.accent,
          }}
        >
          Tú
        </span>
        <div
          className="px-5 py-4 rounded-2xl rounded-tr-sm text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90"
          style={{
            background: `linear-gradient(135deg, ${hexToRgba(theme.accent, 0.09)}, ${hexToRgba(theme.accent, 0.04)})`,
            border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
            boxShadow: `0 2px 10px ${hexToRgba(theme.accent, 0.08)}`,
          }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
