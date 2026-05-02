import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine } from "@/modules/spark/types";

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
      <div className="flex flex-col items-end gap-1.5 max-w-[88%]">
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.2em] pr-2"
          style={{ color: theme.accent, opacity: 0.7 }}
        >
          Tú
        </span>
        <div
          className="px-4 py-3 rounded-2xl rounded-tr-sm border text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/95"
          style={{
            background: hexToRgba(theme.accent, 0.07),
            borderColor: hexToRgba(theme.accent, 0.22),
          }}
        >
          {text}
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
