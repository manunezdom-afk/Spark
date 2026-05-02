import { PayloadRenderer } from "@/components/payloads/PayloadRenderer";
import { NovaMark } from "@/components/nova/NovaMark";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine, TurnPayload } from "@/modules/spark/types";

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ChallengeCard({
  text,
  payload,
  engine,
}: {
  text: string;
  payload?: TurnPayload | null;
  engine: LearningEngine;
}) {
  const theme = getEngineTheme(engine);
  const EngineIcon = theme.Icon;

  return (
    <div
      className="engine-card-rise flex flex-col rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
        boxShadow: `0 4px 20px ${hexToRgba(theme.accent, 0.11)}, 0 1px 4px rgba(0,0,0,0.06)`,
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-2.5"
        style={{
          background: `linear-gradient(to right, ${hexToRgba(theme.accent, 0.12)}, ${hexToRgba(theme.accent, 0.03)})`,
          borderBottom: `1px solid ${hexToRgba(theme.accent, 0.14)}`,
        }}
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-md"
          style={{
            background: hexToRgba(theme.accent, 0.15),
            color: theme.accent,
          }}
        >
          <EngineIcon className="w-3.5 h-3.5" strokeWidth={1.7} />
        </span>
        <NovaMark size={12} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: theme.coachGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Nova · {theme.vibe}
        </span>
      </div>

      <div className="px-5 py-4 bg-white/90 flex flex-col gap-4">
        {text && (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
            {text}
          </p>
        )}
        {payload && <PayloadRenderer payload={payload} />}
      </div>
    </div>
  );
}

export function StreamingChallengeCard({
  text,
  engine,
}: {
  text: string;
  engine: LearningEngine;
}) {
  const theme = getEngineTheme(engine);
  const EngineIcon = theme.Icon;

  return (
    <div
      className="engine-card-rise flex flex-col rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${hexToRgba(theme.accent, 0.18)}`,
        boxShadow: `0 4px 16px ${hexToRgba(theme.accent, 0.08)}, 0 1px 4px rgba(0,0,0,0.05)`,
        opacity: 0.97,
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-2.5"
        style={{
          background: `linear-gradient(to right, ${hexToRgba(theme.accent, 0.10)}, ${hexToRgba(theme.accent, 0.02)})`,
          borderBottom: `1px solid ${hexToRgba(theme.accent, 0.12)}`,
        }}
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-md animate-pulse"
          style={{
            background: hexToRgba(theme.accent, 0.14),
            color: theme.accent,
          }}
        >
          <EngineIcon className="w-3.5 h-3.5" strokeWidth={1.7} />
        </span>
        <NovaMark size={12} className="animate-pulse" />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em] flex-1"
          style={{
            background: theme.coachGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: 0.8,
          }}
        >
          Nova · {theme.streamingLabel}
        </span>
        <div className="flex items-center gap-0.5 mr-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block w-1 h-1 rounded-full animate-bounce"
              style={{
                background: theme.accent,
                opacity: 0.55,
                animationDelay: `${i * 130}ms`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="px-5 py-4 bg-white/90">
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/85">
          {text}
          <span
            className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-spark-cursor"
            style={{ background: theme.accent, opacity: 0.7 }}
          />
        </p>
      </div>
    </div>
  );
}
