"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight, BookMarked } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine, SparkTopic } from "@/modules/spark/types";
import { toast } from "sonner";

const ENGINE_LIMITS: Record<LearningEngine, { min: number; max: number }> = {
  debugger:           { min: 1, max: 2 },
  devils_advocate:    { min: 1, max: 1 },
  roleplay:           { min: 1, max: 3 },
  bridge_builder:     { min: 2, max: 6 },
  socratic:           { min: 1, max: 2 },
  // Test engines go through /tests/new, not this form
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
    // Trim selection if it exceeds the new max.
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
    <div className="p-6 md:p-10 max-w-2xl">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        Volver
      </Link>

      <NewSessionHeader engine={activeEngine} />

      <section className="flex flex-col gap-3 mb-6">
        <Label>Método de estudio</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CHAT_ENGINE_OPTIONS.map((opt) => {
            const isActive = opt === activeEngine;
            const optTheme = getEngineTheme(opt);
            const OptIcon = optTheme.Icon;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => changeEngine(opt)}
                className={`group text-left p-3 rounded-xl border transition-all duration-200 ${
                  isActive
                    ? "bg-white shadow-soft scale-[1.01]"
                    : "border-black/[0.07] bg-white/60 hover:bg-white hover:-translate-y-0.5"
                }`}
                style={
                  isActive
                    ? {
                        borderColor: hexToRgba(optTheme.accent, 0.45),
                        boxShadow: `0 6px 18px ${hexToRgba(optTheme.accent, 0.18)}`,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors"
                    style={{
                      background: hexToRgba(optTheme.accent, isActive ? 0.16 : 0.08),
                      color: optTheme.accent,
                    }}
                  >
                    <OptIcon className="w-3.5 h-3.5" strokeWidth={1.7} />
                  </span>
                  <div className="font-medium text-[13px] text-foreground">
                    {ENGINE_LABELS[opt]}
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground line-clamp-2">
                  {ENGINE_DESCRIPTIONS[opt]}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <Label>
            Temas ({selected.size} / máx {limits.max})
          </Label>
          <Badge>
            mín {limits.min}
          </Badge>
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
                      ? { borderColor: hexToRgba(getEngineTheme(activeEngine).accent, 0.45) }
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
            <Label htmlFor="persona">Personaje que adoptará Spark</Label>
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

      <div className="flex justify-end pt-4">
        <Button
          onClick={onStart}
          disabled={busy || selected.size < limits.min || topics.length === 0}
          size="lg"
          className="text-white border-none"
          style={{
            background: getEngineTheme(activeEngine).coachGradient,
            boxShadow: `0 8px 22px ${hexToRgba(getEngineTheme(activeEngine).accent, 0.32)}`,
          }}
        >
          {busy ? "Iniciando…" : "Comenzar sesión"}
          <ArrowRight className="w-4 h-4" strokeWidth={1.7} />
        </Button>
      </div>
    </div>
  );
}

function NewSessionHeader({ engine }: { engine: LearningEngine }) {
  const theme = getEngineTheme(engine);
  const Icon = theme.Icon;
  return (
    <header
      className="relative overflow-hidden rounded-2xl border border-black/[0.06] p-6 mb-8"
      style={{ background: theme.headerGradient }}
    >
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full blur-3xl pointer-events-none"
        style={{ background: theme.stageGlow }}
        aria-hidden
      />
      <div className="relative flex items-start gap-4">
        <span
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/85 border shadow-soft"
          style={{ borderColor: hexToRgba(theme.accent, 0.25), color: theme.accent }}
        >
          <Icon className="w-5 h-5" strokeWidth={1.6} />
        </span>
        <div className="flex flex-col gap-1.5 min-w-0">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.22em]"
            style={{ color: theme.accent }}
          >
            Nueva sesión · {theme.vibe}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {ENGINE_LABELS[engine]}
          </h1>
          <p className="text-muted-foreground leading-relaxed text-[14px]">
            {ENGINE_DESCRIPTIONS[engine]}
          </p>
        </div>
      </div>
    </header>
  );
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
