"use client";

import { Suspense, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight, BookMarked, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { getMethodPersonality } from "@/modules/spark/engines/personalities";
import type { LearningEngine, SparkTopic } from "@/modules/spark/types";
import { toast } from "sonner";

const ENGINE_LIMITS: Record<LearningEngine, { min: number; max: number }> = {
  debugger:           { min: 1, max: 2 },
  devils_advocate:    { min: 1, max: 1 },
  roleplay:           { min: 1, max: 3 },
  bridge_builder:     { min: 2, max: 6 },
  socratic:           { min: 1, max: 2 },
  test_alternativas:  { min: 1, max: 5 },
  test_desarrollo:    { min: 1, max: 5 },
};

const CHAT_ENGINE_OPTIONS: LearningEngine[] = [
  "socratic",
  "debugger",
  "devils_advocate",
  "bridge_builder",
  "roleplay",
];

function NewSessionForm() {
  const router = useRouter();
  const params = useSearchParams();

  const requestedEngine = params.get("engine") as LearningEngine | null;
  const engine: LearningEngine =
    requestedEngine && requestedEngine in ENGINE_LIMITS
      ? requestedEngine
      : "socratic";
  const presetTopic = params.get("topic");

  const [topics, setTopics] = useState<SparkTopic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(presetTopic ? [presetTopic] : []),
  );
  const [activeEngine, setActiveEngine] = useState<LearningEngine>(engine);
  const [persona, setPersona] = useState("");
  const [scenario, setScenario] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const limits = ENGINE_LIMITS[activeEngine];
  const personality = useMemo(
    () => getMethodPersonality(activeEngine),
    [activeEngine],
  );
  const theme = useMemo(() => getEngineTheme(activeEngine), [activeEngine]);

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topics ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function toggleTopic(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else {
      if (selected.size >= limits.max) {
        toast.error(`Este método admite máximo ${limits.max} ${limits.max === 1 ? "tema" : "temas"}.`);
        return;
      }
      next.add(id);
    }
    setSelected(next);
  }

  function changeEngine(next: LearningEngine) {
    setActiveEngine(next);
    const nextLimits = ENGINE_LIMITS[next];
    if (selected.size > nextLimits.max) {
      const trimmed = new Set(Array.from(selected).slice(0, nextLimits.max));
      setSelected(trimmed);
    }
  }

  async function onStart() {
    if (selected.size < limits.min) {
      toast.error(`Necesitas seleccionar al menos ${limits.min} ${limits.min === 1 ? "tema" : "temas"}.`);
      return;
    }
    if (activeEngine === "roleplay" && !persona.trim()) {
      toast.error("El roleplay requiere un personaje.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engine: activeEngine,
          topic_ids: Array.from(selected),
          persona: persona.trim() || undefined,
          scenario: scenario.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error");
      router.push(`/sessions/${body.session.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <div className="p-5 md:p-10 max-w-3xl">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        Volver
      </Link>

      <NewSessionHero engine={activeEngine} />

      <section className="flex flex-col gap-3 mb-8">
        <div className="flex items-center justify-between">
          <Label>Elige cómo entrenar</Label>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            5 métodos · cada uno se vive distinto
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {CHAT_ENGINE_OPTIONS.map((opt) => (
            <MethodPickCard
              key={opt}
              engine={opt}
              isActive={opt === activeEngine}
              onClick={() => changeEngine(opt)}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3 mb-8">
        <div className="flex items-center justify-between">
          <Label>
            Temas ({selected.size} / máx {limits.max})
          </Label>
          <Badge>mín {limits.min}</Badge>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Cargando temas…</div>
        ) : topics.length === 0 ? (
          <div className="flex flex-col gap-3 p-5 rounded-2xl border border-black/[0.07] bg-white/60">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <BookMarked className="w-4 h-4 text-spark" strokeWidth={1.75} />
              Aún no tienes temas guardados.
            </div>
            <p className="text-[12px] text-muted-foreground">
              Crea o importa un tema antes de iniciar una sesión.
            </p>
            <Button asChild variant="spark" size="sm" className="self-start rounded-full">
              <Link href="/topics">
                Crear o importar tema
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto scrollbar-thin pr-1">
            {topics.map((t) => {
              const isSelected = selected.has(t.id);
              const disabled = !isSelected && selected.size >= limits.max;
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  disabled={disabled}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    isSelected
                      ? "bg-white shadow-soft"
                      : disabled
                        ? "border-black/[0.05] bg-white/40 opacity-50 cursor-not-allowed"
                        : "border-black/[0.07] bg-white/60 hover:bg-white"
                  }`}
                  style={
                    isSelected
                      ? { borderColor: hexToRgba(theme.accent, 0.45) }
                      : undefined
                  }
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {t.category && (
                        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                          {t.category}
                        </div>
                      )}
                      <div className="font-medium text-sm text-foreground">{t.title}</div>
                    </div>
                    {isSelected && (
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded-full shrink-0"
                        style={{
                          background: theme.accent,
                          color: "#fff",
                        }}
                      >
                        <Check className="w-3 h-3" strokeWidth={2.5} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {activeEngine === "roleplay" && (
        <>
          <section className="flex flex-col gap-3 mb-6">
            <Label htmlFor="persona">Personaje que adoptará Nova</Label>
            <Input
              id="persona"
              placeholder="ej. Inversionista ángel escéptico"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
            />
          </section>
          <section className="flex flex-col gap-3 mb-6">
            <Label htmlFor="scenario">Escenario (opcional)</Label>
            <Textarea
              id="scenario"
              placeholder="Pitch de 5 minutos en demo day, sala llena…"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              rows={3}
            />
          </section>
        </>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
        <p className="text-[12px] text-muted-foreground max-w-md leading-relaxed">
          {personality.introHook}
        </p>
        <Button
          onClick={onStart}
          disabled={busy || selected.size < limits.min || topics.length === 0}
          size="lg"
          className="text-white border-none shrink-0"
          style={{
            background: theme.coachGradient,
            boxShadow: `0 8px 22px ${hexToRgba(theme.accent, 0.32)}`,
          }}
        >
          {busy ? "Iniciando…" : `Comenzar · ${ENGINE_LABELS[activeEngine]}`}
          <ArrowRight className="w-4 h-4" strokeWidth={1.7} />
        </Button>
      </div>
    </div>
  );
}

function NewSessionHero({ engine }: { engine: LearningEngine }) {
  const theme = getEngineTheme(engine);
  const personality = getMethodPersonality(engine);
  const Icon = theme.Icon;

  const heroStyle = {
    "--engine-accent": theme.accent,
    "--engine-accent-soft": hexToRgba(theme.accent, 0.07),
    "--engine-stage-gradient": theme.stageGradient,
    "--engine-stage-glow": theme.stageGlow,
  } as CSSProperties;

  return (
    <header
      className="method-stage relative overflow-hidden mb-8"
      style={heroStyle}
    >
      <div className="relative z-[2] flex items-start gap-4">
        <span
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/85 border shadow-soft shrink-0"
          style={{
            borderColor: hexToRgba(theme.accent, 0.25),
            color: theme.accent,
          }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.6} />
        </span>
        <div className="flex flex-col gap-1.5 min-w-0 max-w-xl">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            Nueva sesión · {personality.hudKicker}
          </span>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground leading-tight">
            {ENGINE_LABELS[engine]}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-[14px]">
            {personality.introHook}
          </p>
          <ul className="flex flex-col gap-1 mt-2">
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
        </div>
      </div>
    </header>
  );
}

function MethodPickCard({
  engine,
  isActive,
  onClick,
}: {
  engine: LearningEngine;
  isActive: boolean;
  onClick: () => void;
}) {
  const theme = getEngineTheme(engine);
  const personality = getMethodPersonality(engine);
  const Icon = theme.Icon;
  const limits = ENGINE_LIMITS[engine];

  const cardStyle = {
    "--engine-accent": theme.accent,
    "--engine-accent-soft": hexToRgba(theme.accent, 0.07),
    "--engine-stage-gradient": theme.stageGradient,
    "--engine-stage-glow": theme.stageGlow,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onClick}
      data-active={isActive}
      className="method-pick-card text-left rounded-2xl border bg-white/65 hover:bg-white p-3 flex flex-col gap-3 overflow-hidden"
      style={{
        ...cardStyle,
        borderColor: isActive
          ? hexToRgba(theme.accent, 0.5)
          : "rgba(0,0,0,0.07)",
        boxShadow: isActive
          ? `0 12px 32px ${hexToRgba(theme.accent, 0.22)}`
          : "0 1px 4px rgba(0,0,0,0.03)",
      }}
    >
      <div className="method-pick-preview">
        <PickPreviewMotif engine={engine} />
        <span
          className="absolute top-2.5 left-2.5 inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/85 border z-10"
          style={{
            borderColor: hexToRgba(theme.accent, 0.32),
            color: theme.accent,
          }}
        >
          <Icon className="w-4 h-4" strokeWidth={1.7} />
        </span>
        <span
          className="absolute top-3 right-3 font-mono text-[9px] uppercase tracking-[0.18em] z-10"
          style={{ color: theme.accent }}
        >
          {personality.hudKicker}
        </span>
        {isActive && (
          <span
            className="absolute bottom-2.5 right-2.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-white z-10"
            style={{ background: theme.accent }}
          >
            <Check className="w-3 h-3" strokeWidth={2.5} />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-[14px] text-foreground">
            {ENGINE_LABELS[engine]}
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
            {limits.min === limits.max
              ? `${limits.min} tema`
              : `${limits.min}–${limits.max} temas`}
          </span>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-2">
          {personality.introHook}
        </p>
        <span
          className="font-mono text-[9.5px] uppercase tracking-[0.14em] mt-1"
          style={{ color: theme.accent }}
        >
          {personality.novaToneTag}
        </span>
      </div>
    </button>
  );
}

/**
 * Tiny animated motif inside the picker card preview. Mirrors the
 * full intro stage motif so the user already gets a flavor of how
 * the method will feel before committing.
 */
function PickPreviewMotif({ engine }: { engine: LearningEngine }) {
  const personality = getMethodPersonality(engine);
  const persona = personality.intro;

  if (persona === "mentor") {
    return <span className="method-scene-rings" aria-hidden />;
  }
  if (persona === "detective") {
    return (
      <>
        <div className="method-scene-grid" aria-hidden />
        <div className="method-scene-scan" aria-hidden />
      </>
    );
  }
  if (persona === "rival") {
    return (
      <>
        <span className="method-scene-strike method-scene-strike--a" aria-hidden />
        <span
          className="method-scene-strike method-scene-strike--b"
          style={{ left: "calc(50% + 4px)" }}
          aria-hidden
        />
      </>
    );
  }
  if (persona === "cartographer") {
    return (
      <>
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
      </>
    );
  }
  if (persona === "director") {
    return <div className="method-scene-spotlight" aria-hidden />;
  }
  return null;
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function NewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-10 max-w-2xl">
          <div className="h-8 w-40 rounded bg-white/[0.04] animate-pulse mb-4" />
          <div className="h-32 rounded bg-white/[0.04] animate-pulse" />
        </div>
      }
    >
      <NewSessionForm />
    </Suspense>
  );
}
