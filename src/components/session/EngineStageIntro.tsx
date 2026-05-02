import type { CSSProperties } from "react";
import type { EngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine, SparkTopic } from "@/modules/spark/types";
import { ENGINE_LABELS } from "@/modules/spark/engines";

export function EngineStageIntro({
  engine,
  theme,
  topics,
  persona,
  scenario,
}: {
  engine: LearningEngine;
  theme: EngineTheme;
  topics: SparkTopic[];
  persona?: string | null;
  scenario?: string | null;
}) {
  const Icon = theme.Icon;
  const stageStyle = {
    "--engine-accent": theme.accent,
    "--engine-accent-soft": hexToRgba(theme.accent, 0.07),
    "--engine-stage-gradient": theme.stageGradient,
    "--engine-stage-glow": theme.stageGlow,
  } as CSSProperties;

  return (
    <div className="engine-stage" style={stageStyle}>
      <StageMotif motif={theme.motif} />
      <span className="engine-stage-glow" aria-hidden />

      <div className="relative z-[2] flex items-start gap-4">
        <div className="engine-stage-icon" style={{ color: theme.accent }}>
          <Icon className="w-6 h-6" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: theme.accent }}
          >
            {theme.vibe}
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            {ENGINE_LABELS[engine]}
          </h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {theme.pitch}
          </p>
        </div>
      </div>

      {(persona || scenario || topics.length > 0) && (
        <div className="relative z-[2] mt-5 flex flex-wrap gap-2">
          {topics.map((t) => (
            <Chip key={t.id} accent={theme.accent} label={t.title} kind="topic" />
          ))}
          {persona && <Chip accent={theme.accent} label={persona} kind="persona" />}
          {scenario && (
            <Chip
              accent={theme.accent}
              label={scenario.length > 80 ? `${scenario.slice(0, 80)}…` : scenario}
              kind="scenario"
            />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({
  accent,
  label,
  kind,
}: {
  accent: string;
  label: string;
  kind: "topic" | "persona" | "scenario";
}) {
  const kindLabel = kind === "topic" ? "Tema" : kind === "persona" ? "Personaje" : "Escenario";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border bg-white/70"
      style={{ borderColor: hexToRgba(accent, 0.25), color: "rgb(40 40 40 / 0.9)" }}
    >
      <span
        className="font-mono uppercase tracking-[0.14em] text-[9px]"
        style={{ color: accent }}
      >
        {kindLabel}
      </span>
      <span className="opacity-30">·</span>
      <span className="truncate max-w-[280px]">{label}</span>
    </span>
  );
}

function StageMotif({ motif }: { motif: EngineTheme["motif"] }) {
  if (motif === "rings") {
    return (
      <>
        <span className="engine-orbit-dot engine-orbit-dot--a" aria-hidden />
        <span className="engine-orbit-dot engine-orbit-dot--b" aria-hidden />
      </>
    );
  }
  if (motif === "scan") {
    return (
      <>
        <div className="engine-grid-bg" aria-hidden />
        <div className="engine-scanline" aria-hidden />
      </>
    );
  }
  if (motif === "crossed") {
    return (
      <>
        <span className="engine-clash engine-clash--left" aria-hidden />
        <span
          className="engine-clash engine-clash--right"
          style={{ left: "calc(50% + 12px)" }}
          aria-hidden
        />
      </>
    );
  }
  if (motif === "network") {
    return (
      <>
        <span className="engine-network-node" style={{ top: "26%", left: "78%" }} aria-hidden />
        <span
          className="engine-network-node"
          style={{ top: "62%", left: "82%", animationDelay: "-0.6s" }}
          aria-hidden
        />
        <span
          className="engine-network-node"
          style={{ top: "70%", left: "70%", animationDelay: "-1.2s" }}
          aria-hidden
        />
        <span
          className="engine-network-line"
          style={{ top: "30%", left: "60%", width: "20%", transform: "rotate(28deg)" }}
          aria-hidden
        />
        <span
          className="engine-network-line"
          style={{ top: "66%", left: "62%", width: "16%", transform: "rotate(-12deg)" }}
          aria-hidden
        />
      </>
    );
  }
  // spotlight
  return <div className="engine-spotlight" aria-hidden />;
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
