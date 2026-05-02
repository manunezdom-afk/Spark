import { PayloadRenderer } from "@/components/payloads/PayloadRenderer";
import { NovaMark } from "@/components/nova/NovaMark";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine, TurnPayload } from "@/modules/spark/types";

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
  return (
    <div
      className="engine-card-rise relative pl-5 flex flex-col gap-4"
      style={{
        borderLeft: `2px solid ${theme.borderColor}`,
      }}
    >
      <div className="flex items-center gap-2">
        <NovaMark size={14} />
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
      {text && (
        <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/95">
          {text}
        </div>
      )}
      {payload && (
        <div className="mt-1">
          <PayloadRenderer payload={payload} />
        </div>
      )}
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
  return (
    <div
      className="engine-card-rise relative pl-5 flex flex-col gap-4"
      style={{
        borderLeft: `2px solid ${theme.borderColor}`,
        opacity: 0.96,
      }}
    >
      <div className="flex items-center gap-2">
        <NovaMark size={14} className="animate-pulse" />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: theme.coachGradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: 0.75,
          }}
        >
          Nova · {theme.streamingLabel}
        </span>
      </div>
      <div className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/85">
        {text}
        <span
          className="inline-block w-1.5 h-4 ml-0.5 align-middle animate-spark-cursor"
          style={{ background: theme.accent, opacity: 0.7 }}
        />
      </div>
    </div>
  );
}
