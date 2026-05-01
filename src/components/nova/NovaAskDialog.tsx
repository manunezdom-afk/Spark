"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  ClipboardList,
  Layers,
  Loader2,
  MessageSquareQuote,
  Sparkles,
  Telescope,
  Zap,
} from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NovaMark } from "@/components/nova/NovaMark";
import { useNovaContext } from "@/lib/nova/context";
import { cn } from "@/lib/utils/cn";

interface NovaAskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Surface = ReturnType<typeof useNovaContext>["surface"];

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof Brain;
  prompt?: string;
  href?: string;
  topicAction?: "flashcards" | "summary" | "explain" | "weakpoints";
}

function actionsForSurface(
  surface: Surface,
  hasTopicId: boolean,
  topicId?: string,
): QuickAction[] {
  if (hasTopicId) {
    return [
      {
        id: "topic-flashcards",
        label: "Crear tarjetas de este tema",
        description: "Nova genera 6 tarjetas y las agrega a tu repaso.",
        icon: Layers,
        topicAction: "flashcards",
      },
      {
        id: "topic-summary",
        label: "Resumen para estudiar",
        description: "Idea central + puntos clave + pregunta de cierre.",
        icon: MessageSquareQuote,
        topicAction: "summary",
      },
      {
        id: "topic-explain",
        label: "Explícamelo como profesor",
        description: "Intuición, mecánica, matiz y verificación rápida.",
        icon: Brain,
        topicAction: "explain",
      },
      {
        id: "topic-weakpoints",
        label: "Detectar mis puntos débiles",
        description: "Nova analiza tu material y te muestra qué reforzar.",
        icon: Telescope,
        topicAction: "weakpoints",
      },
      {
        id: "topic-test",
        label: "Generar prueba sobre este tema",
        description: "Crea una prueba simulada con corrección automática.",
        icon: ClipboardList,
        href: topicId ? `/tests/new?topic=${topicId}` : "/tests/new",
      },
    ];
  }

  if (surface === "session") {
    return [
      {
        id: "session-strategy",
        label: "Cómo aprovechar esta sesión",
        description: "Nova te da una pauta para responder a Spark.",
        icon: Brain,
        prompt:
          "Estoy en una sesión activa de Spark. Dame 3 consejos prácticos para aprovecharla al máximo, basados en mi contexto.",
      },
      {
        id: "session-end",
        label: "¿Vale la pena terminar la sesión?",
        description: "Decide si finalizar ahora o seguir un poco más.",
        icon: Zap,
        prompt:
          "Estoy en una sesión activa. ¿Cómo sé si vale la pena finalizarla ahora o si debo seguir respondiendo? Sé concreto.",
      },
    ];
  }

  if (surface === "review") {
    return [
      {
        id: "review-strategy",
        label: "Cómo repasar mejor",
        description: "Una pauta corta para sacarle más a la sesión.",
        icon: Brain,
        prompt:
          "Estoy a punto de repasar mis tarjetas. Dame 3 consejos breves para que el repaso sea más efectivo.",
      },
      {
        id: "review-sm2",
        label: "¿Cómo califico una tarjeta?",
        description: "Diferencia entre 'Otra vez', 'Difícil', 'Bien' y 'Fácil'.",
        icon: Sparkles,
        prompt:
          "Explícame cuándo elegir cada calificación al repasar tarjetas: 'Otra vez', 'Difícil', 'Bien' o 'Fácil'. Sé práctico.",
      },
    ];
  }

  if (surface === "test") {
    return [
      {
        id: "test-tactics",
        label: "Tácticas para una prueba",
        description: "Cómo encarar mejor una prueba simulada.",
        icon: Brain,
        prompt:
          "Voy a hacer una prueba simulada en Spark. Dame 3 tácticas concretas para responder mejor, sin que sean genéricas.",
      },
      {
        id: "test-which",
        label: "¿Alternativas o desarrollo?",
        description: "Cuál tipo conviene según tu objetivo.",
        icon: Sparkles,
        prompt:
          "¿Cuándo me conviene una prueba de alternativas y cuándo una de desarrollo? Hazlo simple.",
      },
    ];
  }

  if (surface === "mastery") {
    return [
      {
        id: "mastery-priority",
        label: "¿Por dónde empiezo hoy?",
        description: "Nova revisa tu maestría y te dice qué atacar primero.",
        icon: Brain,
        prompt:
          "Mira mi nivel de maestría por tema y mis sesiones recientes. ¿Qué tema me conviene atacar hoy y con qué método? Sé específico.",
      },
      {
        id: "mastery-sm2",
        label: "¿Cómo se calcula la maestría?",
        description: "Resumen rápido del algoritmo SM-2.",
        icon: Sparkles,
        prompt:
          "Explícame en pocas líneas cómo Spark calcula mi nivel de maestría con SM-2 y qué hago para que suba.",
      },
    ];
  }

  if (surface === "topic") {
    // /topics list (no concrete topicId in URL)
    return [
      {
        id: "topics-pick",
        label: "¿Por cuál tema empiezo?",
        description: "Nova mira tus temas y te recomienda uno.",
        icon: Brain,
        prompt:
          "Tengo varios temas guardados. ¿Por cuál me conviene empezar a entrenar hoy? Justifica brevemente.",
      },
      {
        id: "topics-howto",
        label: "Cómo crear un buen tema",
        description: "Tips para que Spark trabaje mejor.",
        icon: Sparkles,
        prompt:
          "¿Cómo escribo un buen título y resumen para un tema en Spark? Dame ejemplos prácticos.",
      },
    ];
  }

  // dashboard / fallback
  return [
    {
      id: "today-plan",
      label: "Plan de estudio para hoy",
      description: "Nova revisa tus pendientes y te da un orden.",
      icon: Brain,
      prompt:
        "Hazme un plan concreto para mi sesión de estudio de hoy con base en mis temas, mi maestría y mis pendientes. Máximo 4 pasos.",
    },
    {
      id: "today-method",
      label: "¿Qué método uso hoy?",
      description: "Recomendación según tus deadlines y avances.",
      icon: Sparkles,
      prompt:
        "Recomiéndame un método de Spark (Preguntas guiadas, Cazar errores, Defender postura, Conectar temas, Caso real, o Prueba) para hoy y dime por qué.",
    },
    {
      id: "today-motivation",
      label: "Empújame a empezar",
      description: "Mensaje corto y directo para arrancar.",
      icon: Zap,
      prompt:
        "Dame un mensaje motivacional muy corto y directo para empezar mi sesión ahora. Sin clichés.",
    },
  ];
}

interface NovaResponse {
  answer: string;
  meta?: { kind: "flashcards"; created: number };
}

export function NovaAskDialog({ open, onOpenChange }: NovaAskDialogProps) {
  const router = useRouter();
  const ctx = useNovaContext();
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState<NovaResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const reset = React.useCallback(() => {
    setQuestion("");
    setLoading(false);
    setResponse(null);
    setError(null);
  }, []);

  React.useEffect(() => {
    if (!open) reset();
  }, [open, reset]);

  React.useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const ask = React.useCallback(
    async (q: string) => {
      setLoading(true);
      setResponse(null);
      setError(null);
      try {
        const res = await fetch("/api/nova/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q,
            surface: ctx.surface,
            scopeLabel: ctx.scopeLabel,
            topicId: ctx.topicId,
          }),
        });
        const data = (await res.json()) as { answer?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Nova no pudo responder.");
        } else {
          setResponse({ answer: data.answer ?? "Nova preparó algo para ti." });
        }
      } catch {
        setError("No pude conectar con el servidor.");
      }
      setLoading(false);
    },
    [ctx.surface, ctx.scopeLabel, ctx.topicId],
  );

  const runFlashcards = React.useCallback(async () => {
    if (!ctx.topicId) return;
    setLoading(true);
    setResponse(null);
    setError(null);
    try {
      const res = await fetch("/api/nova/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: ctx.topicId, count: 6 }),
      });
      const data = (await res.json()) as {
        created?: number;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Nova no pudo generar tarjetas.");
      } else if (data.created) {
        setResponse({
          answer: `Listo. Agregué ${data.created} tarjeta${data.created === 1 ? "" : "s"} a tu repaso. Aparecen en la sección Repaso, programadas para hoy.`,
          meta: { kind: "flashcards", created: data.created },
        });
      } else {
        setError("Nova no devolvió tarjetas. Intenta de nuevo.");
      }
    } catch {
      setError("No pude conectar con el servidor.");
    }
    setLoading(false);
  }, [ctx.topicId]);

  const runSummarize = React.useCallback(
    async (mode: "summary" | "explain" | "weakpoints") => {
      if (!ctx.topicId) return;
      setLoading(true);
      setResponse(null);
      setError(null);
      try {
        const res = await fetch("/api/nova/summarize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId: ctx.topicId, mode }),
        });
        const data = (await res.json()) as { answer?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Nova no pudo responder.");
        } else {
          setResponse({ answer: data.answer ?? "" });
        }
      } catch {
        setError("No pude conectar con el servidor.");
      }
      setLoading(false);
    },
    [ctx.topicId],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    void ask(q);
  };

  const runQuickAction = (action: QuickAction) => {
    if (action.href) {
      onOpenChange(false);
      router.push(action.href);
      return;
    }
    if (action.topicAction === "flashcards") {
      void runFlashcards();
      return;
    }
    if (action.topicAction === "summary") {
      void runSummarize("summary");
      return;
    }
    if (action.topicAction === "explain") {
      void runSummarize("explain");
      return;
    }
    if (action.topicAction === "weakpoints") {
      void runSummarize("weakpoints");
      return;
    }
    if (action.prompt) {
      void ask(action.prompt);
    }
  };

  const hasOutput = response !== null || error !== null;
  const actions = actionsForSurface(ctx.surface, !!ctx.topicId, ctx.topicId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 rounded-2xl">
        <DialogTitle className="sr-only">Pregúntale a Nova</DialogTitle>

        {/* Header */}
        <header className="flex items-center gap-3 border-b border-black/[0.06] bg-white/60 px-5 py-4 backdrop-blur-sm">
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-white shadow-[0_4px_18px_var(--color-nova-glow)]"
            style={{ background: "var(--gradient-nova)" }}
          >
            <NovaMark size={15} variant="filled" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-nova">
              Nova
            </p>
            <p className="truncate text-sm font-semibold text-foreground">
              {ctx.scopeLabel}
            </p>
            {ctx.scopeDetail && (
              <p className="truncate text-[11px] text-muted-foreground">
                {ctx.scopeDetail}
              </p>
            )}
          </div>
        </header>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-b border-black/[0.06] px-5 py-4">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder={`Pregúntale algo a Nova sobre ${ctx.scopeLabel}…`}
              rows={2}
              className="min-h-[44px] flex-1 resize-none rounded-xl border border-black/[0.08] bg-white/80 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-nova/40 focus:outline-none focus:ring-2 focus:ring-nova/20"
            />
            <button
              type="submit"
              disabled={!question.trim() || loading}
              aria-label="Enviar"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-40"
              style={{ background: "var(--gradient-nova)" }}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>

        {/* Quick actions (contextuales) */}
        {!hasOutput && !loading && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
              Acciones rápidas
            </p>
            <ul className="mt-2 flex flex-col gap-0.5 max-h-[280px] overflow-y-auto pr-1">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <li key={action.id}>
                    <button
                      type="button"
                      onClick={() => runQuickAction(action)}
                      className="group flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-nova-soft"
                    >
                      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-nova" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="text-sm font-medium text-foreground">
                          {action.label}
                        </span>
                        <span className="text-[11px] leading-snug text-muted-foreground/70">
                          {action.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 px-5 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-nova" />
            <span>Nova está pensando…</span>
          </div>
        )}

        {/* Output */}
        {hasOutput && (
          <div className="max-h-[360px] overflow-y-auto px-5 py-4">
            {response && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-nova" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-nova">
                    Nova
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {response.answer}
                </p>
                {response.meta?.kind === "flashcards" && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      router.push("/flashcards/review");
                    }}
                    className="mt-3 inline-flex items-center gap-1 rounded-full border border-nova/30 bg-nova-soft px-3 py-1 text-[11px] font-semibold text-nova transition-colors hover:border-nova/50"
                  >
                    Ir a repasar
                    <ArrowRight className="h-3 w-3" strokeWidth={2} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className={cn(
                    "ml-3 mt-4 text-[11px] font-medium text-nova underline-offset-2 hover:underline",
                  )}
                >
                  Hacer otra cosa
                </button>
              </div>
            )}
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Footer hint */}
        {!hasOutput && !loading && (
          <div className="border-t border-black/[0.04] px-5 py-2.5">
            <p className="text-[10px] text-muted-foreground/50">
              Atajo de teclado:{" "}
              <kbd className="rounded border border-black/[0.08] bg-black/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-semibold">
                N
              </kbd>
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
