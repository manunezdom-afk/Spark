import type { CSSProperties } from "react";
import { Compass, MapPinned, Mic2, ShieldHalf, ScanSearch, Sparkle } from "lucide-react";
import type { EngineTheme } from "@/modules/spark/engines/themes";
import { getMethodPersonality } from "@/modules/spark/engines/personalities";
import type { IntroPersona } from "@/modules/spark/engines/personalities";
import type { LearningEngine, SparkTopic } from "@/modules/spark/types";
import { ENGINE_LABELS } from "@/modules/spark/engines";

/**
 * Per-method intro stage — the first thing the user sees when a session
 * loads. Each method paints its own scene above the rules:
 *
 *   socratic       → mentor con capas concéntricas
 *   debugger       → escena forense con rejilla de inspección
 *   devils_advocate→ duelo (escudos cruzados)
 *   bridge_builder → cartografía con nodos y aristas
 *   roleplay       → escenario con foco de luz
 */
export function MethodIntroStage({
  engine,
  theme,
  topics,
  persona,
  scenario,
  selectedMaterials,
}: {
  engine: LearningEngine;
  theme: EngineTheme;
  topics: SparkTopic[];
  persona?: string | null;
  scenario?: string | null;
  /**
   * Optional subset of Kairos sessions the user pinned for this run.
   * When present, we render them as chips so the user can see at a
   * glance "Nova is studying just these apuntes, not the whole subject".
   */
  selectedMaterials?: { id: string; title: string }[];
}) {
  const personality = getMethodPersonality(engine);

  const stageStyle = {
    "--engine-accent": theme.accent,
    "--engine-accent-soft": hexToRgba(theme.accent, 0.07),
    "--engine-stage-gradient": theme.stageGradient,
    "--engine-stage-glow": theme.stageGlow,
  } as CSSProperties;

  return (
    <div className="method-stage" style={stageStyle}>
      <PersonaScene persona={personality.intro} accent={theme.accent} />

      <div className="relative z-[2] flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            {personality.hudKicker}
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">
            {personality.novaToneTag}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
          {ENGINE_LABELS[engine]}
        </h2>
        <p className="text-[14px] md:text-[15px] text-foreground/80 leading-relaxed max-w-xl">
          {personality.introHook}
        </p>

        <ul className="flex flex-col gap-1.5 mt-1">
          {personality.introRules.map((rule, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12.5px] text-muted-foreground"
            >
              <span
                className="mt-1.5 inline-block w-1 h-1 rounded-full shrink-0"
                style={{ background: theme.accent, opacity: 0.7 }}
              />
              <span>{rule}</span>
            </li>
          ))}
        </ul>

        {(persona || scenario || topics.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-2">
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

        {selectedMaterials && selectedMaterials.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-2">
            {selectedMaterials.map((m) => (
              <Chip
                key={m.id}
                accent={theme.accent}
                label={m.title || "(sin título)"}
                kind="material"
              />
            ))}
          </div>
        )}
      </div>
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
  kind: "topic" | "persona" | "scenario" | "material";
}) {
  const kindLabel =
    kind === "topic"
      ? "Tema"
      : kind === "persona"
        ? "Personaje"
        : kind === "scenario"
          ? "Escenario"
          : "Apunte";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border bg-white/70"
      style={{
        borderColor: hexToRgba(accent, 0.25),
        color: "rgb(40 40 40 / 0.9)",
      }}
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

/** Per-method scenography motif. */
function PersonaScene({
  persona,
  accent,
}: {
  persona: IntroPersona;
  accent: string;
}) {
  if (persona === "mentor") {
    return (
      <div className="method-scene">
        <span className="method-scene-rings" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <Compass className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "detective") {
    return (
      <div className="method-scene">
        <div className="method-scene-grid" aria-hidden />
        <div className="method-scene-scan" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <ScanSearch className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "rival") {
    return (
      <div className="method-scene">
        <span className="method-scene-strike method-scene-strike--a" aria-hidden />
        <span className="method-scene-strike method-scene-strike--b" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <ShieldHalf className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "cartographer") {
    return (
      <div className="method-scene">
        <span className="method-scene-node" style={{ top: "30%", left: "62%" }} aria-hidden />
        <span
          className="method-scene-node"
          style={{ top: "60%", left: "78%", animationDelay: "-0.7s" }}
          aria-hidden
        />
        <span
          className="method-scene-node"
          style={{ top: "70%", left: "55%", animationDelay: "-1.4s" }}
          aria-hidden
        />
        <span
          className="method-scene-link"
          style={{
            top: "34%",
            left: "55%",
            width: "20%",
            transform: "rotate(28deg)",
          }}
          aria-hidden
        />
        <span
          className="method-scene-link"
          style={{
            top: "64%",
            left: "57%",
            width: "18%",
            transform: "rotate(-15deg)",
          }}
          aria-hidden
        />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <MapPinned className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  if (persona === "director") {
    return (
      <div className="method-scene">
        <div className="method-scene-spotlight" aria-hidden />
        <span
          className="method-scene-icon"
          style={{ color: accent }}
          aria-hidden
        >
          <Mic2 className="w-5 h-5" strokeWidth={1.5} />
        </span>
      </div>
    );
  }
  return (
    <div className="method-scene">
      <span className="method-scene-icon" style={{ color: accent }} aria-hidden>
        <Sparkle className="w-5 h-5" strokeWidth={1.5} />
      </span>
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
