"use client";

import Link from "next/link";
import { Flame, Sparkles, Play } from "lucide-react";
import { AnimatedConversation } from "@/components/demo/AnimatedConversation";
import { Button } from "@/components/ui/button";

const RECOMMENDED = [
  { engine: "Socrático", desc: "Responde preguntas de por qué" },
  { engine: "Debugger", desc: "Encuentra los errores ocultos" },
  { engine: "Roleplay", desc: "Aplica en escenarios reales" },
];

export function DashboardPreview() {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-6">

      {/* Label */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-white/[0.04]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 px-3">
          Así se verá tu dashboard
        </span>
        <div className="h-px flex-1 bg-white/[0.04]" />
      </div>

      {/* Simulated review banner */}
      <div className="p-5 rounded-lg border border-spark/20 bg-spark/[0.04] opacity-80">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-spark" strokeWidth={1.5} />
            <div>
              <div className="text-lg font-semibold">4 elementos por repasar</div>
              <div className="text-xs text-muted-foreground mt-0.5">2 tarjetas · 2 temas</div>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-md bg-spark/20 border border-spark/30 text-xs font-medium text-spark flex items-center gap-1.5 opacity-60 cursor-default select-none">
            Repasar tarjetas
            <Play className="w-3 h-3" strokeWidth={1.5} fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Simulated engines */}
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 mb-3">
          Recomendado para hoy
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {RECOMMENDED.map((r, i) => (
            <div
              key={i}
              className="flex flex-col gap-1.5 p-4 rounded-lg border border-white/[0.05] bg-white/[0.02] opacity-75"
            >
              <Sparkles className="w-3.5 h-3.5 text-spark/60" strokeWidth={1.5} />
              <div className="text-sm font-medium text-foreground/70">{r.engine}</div>
              <div className="text-xs text-muted-foreground/50">{r.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live session preview */}
      <div className="rounded-lg border border-white/[0.06] bg-white/[0.01] p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 mb-4">
          Ejemplo de sesión Socrática
        </div>
        <AnimatedConversation loop />
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-xs text-muted-foreground/50 text-center max-w-xs">
          Crea tu primer tema y Spark arma las sesiones de entrenamiento para ti.
        </p>
        <Button asChild variant="spark" size="lg">
          <Link href="/topics">Crear primer tema</Link>
        </Button>
      </div>
    </div>
  );
}
