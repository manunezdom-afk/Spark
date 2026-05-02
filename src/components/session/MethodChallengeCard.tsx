"use client";

import {
  HelpCircle,
  ScanSearch,
  Swords,
  Spline,
  Drama,
} from "lucide-react";
import { PayloadRenderer } from "@/components/payloads/PayloadRenderer";
import { NovaMark } from "@/components/nova/NovaMark";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { getMethodPersonality } from "@/modules/spark/engines/personalities";
import type { LearningEngine, TurnPayload } from "@/modules/spark/types";

/**
 * The conversation card emitted by Nova. Each method renders the same
 * payload differently — a question vs. an attack vs. a scene line vs.
 * a connection proposal vs. a forensic brief. The visual frame, label
 * and accents are tuned per method so the chat doesn't feel like
 * "same template, different colors".
 */
export function MethodChallengeCard({
  text,
  payload,
  engine,
  index,
  isLast,
}: {
  text: string;
  payload?: TurnPayload | null;
  engine: LearningEngine;
  /** 0-based index of this assistant turn in the conversation. */
  index: number;
  /** Whether this is the latest assistant turn (only one shows the active accent). */
  isLast?: boolean;
}) {
  const theme = getEngineTheme(engine);
  const personality = getMethodPersonality(engine);

  const StripIcon = STRIP_ICON[engine] ?? HelpCircle;
  const stripLabel = stripLabelFor(engine, index);

  return (
    <div
      className="method-card engine-card-rise flex flex-col rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${hexToRgba(theme.accent, isLast ? 0.34 : 0.2)}`,
        boxShadow: `0 6px 22px ${hexToRgba(theme.accent, isLast ? 0.16 : 0.08)}, 0 1px 4px rgba(0,0,0,0.05)`,
      }}
    >
      {/* Method-specific top strip */}
      <div
        className="flex items-center justify-between gap-2 px-4 py-2.5 border-b"
        style={{
          background: `linear-gradient(to right, ${hexToRgba(theme.accent, 0.13)}, ${hexToRgba(theme.accent, 0.03)})`,
          borderColor: hexToRgba(theme.accent, 0.14),
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md shrink-0"
            style={{
              background: hexToRgba(theme.accent, 0.16),
              color: theme.accent,
            }}
          >
            <StripIcon className="w-3.5 h-3.5" strokeWidth={1.7} />
          </span>
          <NovaMark size={12} />
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em] truncate"
            style={{
              background: theme.coachGradient,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Nova · {personality.novaToneTag}
          </span>
        </div>
        <span
          className="font-mono text-[10px] uppercase tracking-[0.16em] shrink-0"
          style={{ color: theme.accent }}
        >
          {stripLabel}
        </span>
      </div>

      <MethodTurnBody
        engine={engine}
        text={text}
        accent={theme.accent}
      />

      {payload && (
        <div className="px-5 pb-5">
          <PayloadRenderer payload={payload} />
        </div>
      )}
    </div>
  );
}

/**
 * Body slot — different methods present the same `text` with their own
 * frame so a question reads like a question, an attack like an attack,
 * an evidence brief like a forensic doc, etc.
 */
function MethodTurnBody({
  engine,
  text,
  accent,
}: {
  engine: LearningEngine;
  text: string;
  accent: string;
}) {
  const personality = getMethodPersonality(engine);

  if (!text) return <div className="px-5 py-4 bg-white/90" />;

  if (personality.challenge === "question") {
    return (
      <div className="px-5 py-5 bg-white/90">
        <div className="flex items-start gap-3">
          <div
            className="flex flex-col items-center pt-1"
            aria-hidden
          >
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full font-mono text-[11px] font-semibold"
              style={{
                background: hexToRgba(accent, 0.12),
                color: accent,
                border: `1px solid ${hexToRgba(accent, 0.28)}`,
              }}
            >
              ?
            </span>
            <span
              className="w-px flex-1 mt-2"
              style={{
                background: `linear-gradient(180deg, ${hexToRgba(accent, 0.35)}, transparent)`,
              }}
            />
          </div>
          <p className="text-[15.5px] leading-relaxed whitespace-pre-wrap text-foreground/90 flex-1">
            {text}
          </p>
        </div>
      </div>
    );
  }

  if (personality.challenge === "strike") {
    return (
      <div className="px-5 py-5 bg-white/90 relative">
        <div
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-md"
          style={{
            background: `linear-gradient(180deg, ${accent}, transparent)`,
          }}
        />
        <p className="text-[15.5px] leading-relaxed whitespace-pre-wrap text-foreground/90 pl-2">
          {text}
        </p>
      </div>
    );
  }

  if (personality.challenge === "evidence") {
    return (
      <div className="px-5 py-5 bg-white/95">
        <div
          className="rounded-xl border p-4 leading-relaxed text-[14.5px] text-foreground/90 relative overflow-hidden"
          style={{
            borderColor: hexToRgba(accent, 0.22),
            background: `linear-gradient(180deg, rgba(255,255,255,0.95), ${hexToRgba(accent, 0.04)})`,
          }}
        >
          <span
            className="font-mono text-[9.5px] uppercase tracking-[0.18em] block mb-2"
            style={{ color: accent }}
          >
            Texto bajo inspección
          </span>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    );
  }

  if (personality.challenge === "proposal") {
    return (
      <div className="px-5 py-5 bg-white/90">
        <div className="flex items-start gap-3">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-md mt-1 shrink-0"
            style={{
              background: hexToRgba(accent, 0.14),
              color: accent,
            }}
          >
            <Spline className="w-3.5 h-3.5" strokeWidth={1.7} />
          </span>
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90 flex-1">
            {text}
          </p>
        </div>
      </div>
    );
  }

  if (personality.challenge === "beat") {
    return (
      <div className="px-5 py-5 bg-white/95">
        <div
          className="rounded-xl border p-4 italic leading-relaxed text-[15px] text-foreground/90 relative"
          style={{
            borderColor: hexToRgba(accent, 0.22),
            background: hexToRgba(accent, 0.04),
          }}
        >
          <span
            className="font-mono text-[9.5px] uppercase tracking-[0.18em] block mb-2 not-italic"
            style={{ color: accent }}
          >
            Personaje
          </span>
          <p className="whitespace-pre-wrap">{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 bg-white/90">
      <p className="text-[15px] leading-relaxed whitespace-pre-wrap text-foreground/90">
        {text}
      </p>
    </div>
  );
}

/** Streaming variant — shows a pulsing strip while text streams in. */
export function MethodStreamingCard({
  text,
  engine,
}: {
  text: string;
  engine: LearningEngine;
}) {
  const theme = getEngineTheme(engine);
  const personality = getMethodPersonality(engine);
  const StripIcon = STRIP_ICON[engine] ?? HelpCircle;

  return (
    <div
      className="method-card engine-card-rise flex flex-col rounded-2xl overflow-hidden"
      style={{
        border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
        boxShadow: `0 6px 22px ${hexToRgba(theme.accent, 0.10)}, 0 1px 4px rgba(0,0,0,0.05)`,
        opacity: 0.97,
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2.5 border-b"
        style={{
          background: `linear-gradient(to right, ${hexToRgba(theme.accent, 0.10)}, ${hexToRgba(theme.accent, 0.02)})`,
          borderColor: hexToRgba(theme.accent, 0.12),
        }}
      >
        <span
          className="inline-flex items-center justify-center w-6 h-6 rounded-md animate-pulse"
          style={{
            background: hexToRgba(theme.accent, 0.14),
            color: theme.accent,
          }}
        >
          <StripIcon className="w-3.5 h-3.5" strokeWidth={1.7} />
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
          Nova · {personality.thinkingLabel}
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

      <div className="px-5 py-5 bg-white/90">
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

const STRIP_ICON: Partial<Record<LearningEngine, typeof HelpCircle>> = {
  socratic: HelpCircle,
  debugger: ScanSearch,
  devils_advocate: Swords,
  bridge_builder: Spline,
  roleplay: Drama,
};

function stripLabelFor(engine: LearningEngine, index: number) {
  const n = index + 1;
  if (engine === "socratic") return `Capa ${n}`;
  if (engine === "devils_advocate") return `Round ${n}`;
  if (engine === "debugger") return n === 1 ? "Briefing" : `Pase ${n}`;
  if (engine === "bridge_builder") return `Conexión ${n}`;
  if (engine === "roleplay") return `Beat ${n}`;
  return `Turn ${n}`;
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
