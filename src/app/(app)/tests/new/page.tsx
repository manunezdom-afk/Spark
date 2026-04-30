"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ArrowRight, CheckSquare, AlignLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import { toast } from "sonner";

import type { SparkTopic, TestType } from "@/modules/spark/types";

const TYPE_CONFIG: Record<
  TestType,
  {
    label: string;
    description: string;
    icon: typeof CheckSquare;
    max: number;
    defaultCount: number;
  }
> = {
  alternativas: {
    label: "Alternativas",
    description:
      "Preguntas de opción múltiple con 4 opciones. Corrección automática e instantánea.",
    icon: CheckSquare,
    max: 25,
    defaultCount: 10,
  },
  desarrollo: {
    label: "Desarrollo",
    description:
      "Preguntas abiertas evaluadas por IA según los conceptos clave del tema.",
    icon: AlignLeft,
    max: 10,
    defaultCount: 5,
  },
};

export default function NewTestPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<SparkTopic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [testType, setTestType] = useState<TestType>("alternativas");
  const [count, setCount] = useState(10);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [busy, setBusy] = useState(false);

  const config = TYPE_CONFIG[testType];

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topics ?? []);
        setLoadingTopics(false);
      })
      .catch(() => setLoadingTopics(false));
  }, []);

  function toggleTopic(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleTypeChange(type: TestType) {
    setTestType(type);
    setCount(TYPE_CONFIG[type].defaultCount);
  }

  async function onStart() {
    if (!selected.size) {
      toast.error("Selecciona al menos un tema.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/tests/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic_ids: Array.from(selected),
          test_type: testType,
          question_count: count,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Error generando prueba");
      router.push(`/tests/${body.session_id}/take`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        Volver
      </Link>

      <header className="flex flex-col gap-2 mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-spark">
          Simulador de Prueba
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">Nueva prueba</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Genera una prueba simulada con IA a partir de tus temas.
        </p>
      </header>

      {/* Test type selector */}
      <section className="mb-6">
        <Label className="mb-3 block">Tipo de prueba</Label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(TYPE_CONFIG) as [TestType, (typeof TYPE_CONFIG)[TestType]][]).map(
            ([type, cfg]) => {
              const Icon = cfg.icon;
              const active = testType === type;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    "text-left p-4 rounded-xl border transition-all",
                    active
                      ? "border-spark/40 bg-spark/[0.06] shadow-glow/10"
                      : "border-black/[0.07] bg-white/40 hover:bg-white/70"
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 mb-2",
                      active ? "text-spark" : "text-muted-foreground"
                    )}
                    strokeWidth={1.5}
                  />
                  <div
                    className={cn(
                      "font-semibold text-sm mb-1",
                      active ? "text-foreground" : "text-foreground/70"
                    )}
                  >
                    {cfg.label}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">
                    {cfg.description}
                  </div>
                  <div className="text-[10px] text-muted-foreground/50 mt-2 font-mono">
                    máx. {cfg.max} preguntas
                  </div>
                </button>
              );
            }
          )}
        </div>
      </section>

      {/* Question count slider */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <Label htmlFor="count">Cantidad de preguntas</Label>
          <span className="text-2xl font-semibold text-foreground tabular-nums w-8 text-right">
            {count}
          </span>
        </div>
        <input
          id="count"
          type="range"
          min={1}
          max={config.max}
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
          className="w-full cursor-pointer accent-spark h-1.5"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/50 mt-1.5 font-mono">
          <span>1</span>
          <span>{config.max}</span>
        </div>
      </section>

      {/* Topic selector */}
      <section className="mb-8">
        <Label className="mb-3 block">
          Temas{" "}
          <span className="text-muted-foreground font-normal">
            ({selected.size} seleccionado{selected.size !== 1 ? "s" : ""})
          </span>
        </Label>

        {loadingTopics ? (
          <div className="text-sm text-muted-foreground py-3">Cargando temas…</div>
        ) : topics.length === 0 ? (
          <div className="p-4 rounded-xl border border-black/[0.07] bg-white/40 text-sm text-muted-foreground">
            No tienes temas aún.{" "}
            <Link href="/topics" className="text-spark hover:underline font-medium">
              Crea uno
            </Link>{" "}
            para poder generar una prueba.
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto pr-1">
            {topics.map((t) => {
              const isSelected = selected.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTopic(t.id)}
                  className={cn(
                    "text-left p-3.5 rounded-xl border transition-colors",
                    isSelected
                      ? "border-spark/40 bg-spark/[0.05]"
                      : "border-black/[0.07] bg-white/40 hover:bg-white/70"
                  )}
                >
                  {t.category && (
                    <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                      {t.category}
                    </div>
                  )}
                  <div
                    className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-foreground" : "text-foreground/80"
                    )}
                  >
                    {t.title}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <div className="flex justify-end">
        <Button
          onClick={onStart}
          disabled={busy || !selected.size}
          size="lg"
          variant="spark"
        >
          {busy ? "Generando prueba…" : "Generar prueba"}
          <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>
    </div>
  );
}
