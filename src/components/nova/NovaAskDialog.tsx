"use client";

import * as React from "react";
import { ArrowRight, BookOpen, Brain, Loader2, Sparkles, Zap } from "lucide-react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { NovaMark } from "@/components/nova/NovaMark";
import { useNovaContext } from "@/lib/nova/context";
import { cn } from "@/lib/utils/cn";

interface NovaAskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: typeof BookOpen;
  prompt: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "study-tip",
    label: "Estrategia de estudio",
    description: "Cómo organizar mi sesión de repaso de hoy",
    icon: Brain,
    prompt: "Dame una estrategia concreta para mi sesión de estudio de hoy en Spark. Sé específico y práctico.",
  },
  {
    id: "explain-sm2",
    label: "¿Cómo funciona el repaso?",
    description: "Entiende el algoritmo SM-2 detrás de Spark",
    icon: Zap,
    prompt: "Explícame brevemente cómo funciona el algoritmo de repaso espaciado SM-2 que usa Spark y por qué es efectivo.",
  },
  {
    id: "motivation",
    label: "Motivación de estudio",
    description: "Un empujón para arrancar",
    icon: Sparkles,
    prompt: "Dame un mensaje motivacional corto y práctico para empezar a estudiar ahora. Hazlo directo, sin rodeos.",
  },
  {
    id: "how-to-topic",
    label: "Cómo agregar un tema",
    description: "Agrega tu primer tema de estudio",
    icon: BookOpen,
    prompt: "¿Cómo puedo agregar un tema de estudio en Spark y cuál es la mejor forma de escribir el contenido para que el coach sea más útil?",
  },
];

export function NovaAskDialog({ open, onOpenChange }: NovaAskDialogProps) {
  const ctx = useNovaContext();
  const [question, setQuestion] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [answer, setAnswer] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const reset = React.useCallback(() => {
    setQuestion("");
    setLoading(false);
    setAnswer(null);
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

  const ask = React.useCallback(async (q: string) => {
    setLoading(true);
    setAnswer(null);
    setError(null);
    try {
      const res = await fetch("/api/nova/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, surface: ctx.surface, scopeLabel: ctx.scopeLabel }),
      });
      if (!res.ok) {
        setError("Nova no pudo responder. Intenta de nuevo.");
      } else {
        const data = (await res.json()) as { answer?: string };
        setAnswer(data.answer ?? "Nova preparó algo para ti.");
      }
    } catch {
      setError("No pude conectar con el servidor.");
    }
    setLoading(false);
  }, [ctx.surface, ctx.scopeLabel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    void ask(q);
  };

  const runQuickAction = (action: QuickAction) => {
    void ask(action.prompt);
  };

  const hasOutput = answer !== null || error !== null;

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

        {/* Quick actions */}
        {!hasOutput && !loading && (
          <div className="px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
              Acciones rápidas
            </p>
            <ul className="mt-2 flex flex-col gap-0.5">
              {QUICK_ACTIONS.map((action) => {
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
            {answer && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3 text-nova" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-nova">
                    Nova
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {answer}
                </p>
                {!loading && (
                  <button
                    type="button"
                    onClick={reset}
                    className={cn(
                      "mt-4 text-[11px] font-medium text-nova underline-offset-2 hover:underline",
                    )}
                  >
                    Hacer otra pregunta
                  </button>
                )}
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
