import { Award } from "lucide-react";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { hexToRgba } from "@/lib/utils/color";
import type { LearningEngine } from "@/modules/spark/types";

interface SummaryHeroProps {
  engine: LearningEngine;
  score: number;
  durationMinutes: number;
  topicTitles: string[];
}

export function SummaryHero({ engine, score, durationMinutes, topicTitles }: SummaryHeroProps) {
  const theme = getEngineTheme(engine);
  const Icon = theme.Icon;
  const subjectLabel =
    topicTitles.length === 0
      ? "Sin tema"
      : topicTitles.length === 1
        ? topicTitles[0]
        : `${topicTitles[0]} +${topicTitles.length - 1}`;

  return (
    <header className="rounded-3xl border border-black/[0.06] bg-white/70 backdrop-blur-sm p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <span
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
            style={{
              background: hexToRgba(theme.accent, 0.10),
              color: theme.accent,
              border: `1px solid ${hexToRgba(theme.accent, 0.25)}`,
            }}
          >
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <div
              className="font-mono text-[10px] uppercase tracking-[0.18em] mb-1"
              style={{ color: theme.accent }}
            >
              {theme.vibe}
            </div>
            <h1 className="text-[22px] md:text-[26px] font-semibold tracking-tight text-foreground leading-tight">
              {ENGINE_LABELS[engine]}
            </h1>
            <p className="text-[12.5px] text-muted-foreground mt-1 truncate">
              {subjectLabel} · {durationMinutes} min
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-12 h-12 rounded-full bg-spark/15 border border-spark/40 flex items-center justify-center">
            <Award className="w-5 h-5 text-spark" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1">
              Resultado
            </span>
            <div className="text-3xl md:text-4xl font-semibold tracking-tight">
              <span className="text-spark">{score}</span>
              <span className="text-muted-foreground/60 text-2xl">/100</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
