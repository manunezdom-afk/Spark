"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ArrowRight,
  CheckSquare,
  AlignLeft,
  CircleCheck,
  Layers,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/PageHeader";
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
      "Preguntas de opción múltiple con 4 opciones. Corrección automática.",
    icon: CheckSquare,
    max: 20,
    defaultCount: 10,
  },
  desarrollo: {
    label: "Desarrollo",
    description:
      "Preguntas abiertas evaluadas por IA según los conceptos clave del tema.",
    icon: AlignLeft,
    max: 20,
    defaultCount: 5,
  },
  verdadero_falso: {
    label: "Verdadero / Falso",
    description:
      "Afirmaciones para marcar como verdaderas o falsas. Corrección automática.",
    icon: CircleCheck,
    max: 20,
    defaultCount: 10,
  },
};

function NewTestForm() {
  const router = useRouter();
  const params = useSearchParams();
  const presetTopic = params.get("topic");
  const [topics, setTopics] = useState<SparkTopic[]>([]);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(presetTopic ? [presetTopic] : []),
  );
  const [testType, setTestType] = useState<TestType>("alternativas");
  const [count, setCount] = useState(10);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dueFlashcards, setDueFlashcards] = useState<number | null>(null);

  const config = TYPE_CONFIG[testType];

  useEffect(() => {
    fetch("/api/topics")
      .then((r) => r.json())
      .then((data) => {
        setTopics(data.topics ?? []);
        setLoadingTopics(false);
      })
      .catch(() => setLoadingTopics(false));

    fetch("/api/flashcards/due-count")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.count === "number") setDueFlashcards(data.count);
      })
      .catch(() => {});
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
        className="inline-flex items-center gap-1 text-sm text-ink-tertiary hover:text-ink mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        Volver
      </Link>

      <PageHeader
        title="Pruebas"
        description="Genera una prueba simulada o repasa tus tarjetas pendientes."
      />

      {/* Repaso de tarjetas — separado y antes del formulario */}
      <section className="mb-10">
        <Link
          href="/flashcards/review"
          className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-black/[0.05] bg-white shadow-soft hover:shadow-lift hover:border-black/[0.10] transition-all duration-200"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-nova-soft border border-nova/25 shrink-0">
              <Layers className="w-4 h-4 text-nova-mid" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-ink">
                Repaso de tarjetas
              </div>
              <div className="text-[12.5px] text-ink-secondary">
                {dueFlashcards === null
                  ? "Tarjetas que vencen hoy según SM-2."
                  : dueFlashcards === 0
                    ? "Sin tarjetas pendientes hoy."
                    : `${dueFlashcards} ${dueFlashcards === 1 ? "tarjeta pendiente" : "tarjetas pendientes"} hoy.`}
              </div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-ink-tertiary shrink-0" strokeWidth={1.5} />
        </Link>
      </section>

      <h2 className="text-[13px] font-medium text-ink-secondary mb-4 tracking-tight">
        Nueva prueba simulada
      </h2>

      {/* Test type selector */}
      <section className="mb-6">
        <Label className="mb-3 block text-ink-secondary">Tipo de prueba</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(TYPE_CONFIG) as [TestType, (typeof TYPE_CONFIG)[TestType]][]).map(
            ([type, cfg]) => {
              const Icon = cfg.icon;
              const active = testType === type;
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type)}
                  className={cn(
                    "text-left p-4 rounded-2xl border shadow-soft transition-all",
                    active
                      ? "border-spark/40 bg-spark-soft"
                      : "border-black/[0.05] bg-white hover:border-black/[0.10] hover:shadow-lift",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 mb-2",
                      active ? "text-spark" : "text-ink-tertiary",
                    )}
                    strokeWidth={1.5}
                  />
                  <div
                    className={cn(
                      "font-medium text-sm mb-1",
                      active ? "text-ink" : "text-ink-secondary",
                    )}
                  >
                    {cfg.label}
                  </div>
                  <div className="text-[12px] text-ink-secondary leading-relaxed">
                    {cfg.description}
                  </div>
                  <div className="text-[11px] text-ink-tertiary mt-2">
                    Máx. {cfg.max} preguntas
                  </div>
                </button>
              );
            },
          )}
        </div>
      </section>

      {/* Question count slider */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <Label htmlFor="count" className="text-ink-secondary">Cantidad de preguntas</Label>
          <span className="text-2xl font-semibold text-ink tabular-nums w-8 text-right">
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
        <div className="flex justify-between text-[11px] text-ink-tertiary mt-1.5">
          <span>1</span>
          <span>{config.max}</span>
        </div>
      </section>

      {/* Topic selector */}
      <section className="mb-8">
        <Label className="mb-3 block text-ink-secondary">
          Temas{" "}
          <span className="text-ink-tertiary font-normal">
            ({selected.size} seleccionado{selected.size !== 1 ? "s" : ""})
          </span>
        </Label>

        {loadingTopics ? (
          <div className="text-sm text-ink-tertiary py-3">Cargando temas…</div>
        ) : topics.length === 0 ? (
          <div className="p-4 rounded-2xl border border-black/[0.05] bg-white shadow-soft text-sm text-ink-secondary">
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
                    "text-left p-3.5 rounded-xl border transition-all",
                    isSelected
                      ? "border-spark/40 bg-spark-soft shadow-soft"
                      : "border-black/[0.05] bg-white hover:border-black/[0.10] hover:shadow-soft",
                  )}
                >
                  {t.category && (
                    <div className="text-[12px] text-ink-tertiary mb-0.5">
                      {t.category}
                    </div>
                  )}
                  <div
                    className={cn(
                      "font-medium text-sm",
                      isSelected ? "text-ink" : "text-ink-secondary",
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

export default function NewTestPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 md:p-10 max-w-2xl">
          <div className="h-8 w-40 rounded bg-black/[0.05] animate-pulse mb-4" />
          <div className="h-32 rounded bg-black/[0.05] animate-pulse" />
        </div>
      }
    >
      <NewTestForm />
    </Suspense>
  );
}
