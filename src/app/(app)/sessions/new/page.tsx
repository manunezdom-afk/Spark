"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from "@/modules/spark/engines";
import type { LearningEngine, SparkTopic } from "@/modules/spark/types";
import { toast } from "sonner";

const ENGINE_LIMITS: Record<LearningEngine, { min: number; max: number }> = {
  debugger: { min: 1, max: 2 },
  devils_advocate: { min: 1, max: 1 },
  roleplay: { min: 1, max: 3 },
  bridge_builder: { min: 2, max: 6 },
  socratic: { min: 1, max: 2 },
};

function NewSessionForm() {
  const router = useRouter();
  const params = useSearchParams();

  const engine = (params.get("engine") ?? "socratic") as LearningEngine;
  const presetTopic = params.get("topic");

  const [topics, setTopics] = useState<SparkTopic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(presetTopic ? [presetTopic] : [])
  );
  const [persona, setPersona] = useState("");
  const [scenario, setScenario] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const limits = ENGINE_LIMITS[engine];

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topics ?? []);
        setLoading(false);
      });
  }, []);

  function toggleTopic(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else {
      if (selected.size >= limits.max) return;
      next.add(id);
    }
    setSelected(next);
  }

  async function onStart() {
    if (selected.size < limits.min) {
      toast.error(`Necesitas seleccionar al menos ${limits.min} ${limits.min === 1 ? "tema" : "temas"}.`);
      return;
    }
    if (engine === "roleplay" && !persona.trim()) {
      toast.error("El roleplay requiere un personaje.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          engine,
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

      <header className="flex flex-col gap-2 mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-spark">
          Nueva sesión
        </span>
        <h1 className="font-serif text-3xl tracking-tight">{ENGINE_LABELS[engine]}</h1>
        <p className="text-muted-foreground leading-relaxed">
          {ENGINE_DESCRIPTIONS[engine]}
        </p>
      </header>

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
          <div className="p-4 rounded-md border border-white/10 bg-white/[0.02] text-sm text-muted-foreground">
            No tienes temas aún.{" "}
            <Link href="/topics" className="text-spark hover:underline">
              Crea uno
            </Link>{" "}
            antes de empezar.
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
                  className={`text-left p-3 rounded-md border transition-colors ${
                    isSelected
                      ? "border-spark/40 bg-spark/[0.05]"
                      : disabled
                      ? "border-white/[0.04] bg-white/[0.01] opacity-40 cursor-not-allowed"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {t.category && (
                        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                          {t.category}
                        </div>
                      )}
                      <div className="font-medium text-sm">{t.title}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {engine === "roleplay" && (
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
          disabled={busy || selected.size < limits.min}
          size="lg"
          variant="spark"
        >
          {busy ? "Iniciando…" : "Comenzar sesión"}
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
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
