"use client";

import Link from "next/link";
import { Sparkles, Activity } from "lucide-react";
import { useNovaAsk } from "@/components/nova/NovaAskProvider";

/**
 * Estado vacío "inteligente" cuando no hay sesiones abiertas. En vez
 * de un placeholder neutro, propone dos caminos: crear una sesión
 * desde un tema, o pedir recomendación a Nova. Contraste reforzado
 * para mobile (botones de 36px alto y borde más visible).
 */
export function EmptySessionsState({ hasTopics }: { hasTopics: boolean }) {
  const ask = useNovaAsk();
  return (
    <div className="rounded-2xl border border-dashed border-black/[0.12] bg-white/50 p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-spark/10 border border-spark/25 shrink-0">
        <Activity className="w-4 h-4 text-spark" strokeWidth={1.5} />
      </div>
      <p className="flex-1 text-[13px] leading-relaxed text-foreground/85">
        No tienes sesiones activas.{" "}
        {hasTopics
          ? "Crea una desde una de tus materias o pídele a Nova que te recomiende por dónde empezar."
          : "Crea tu primer tema y empieza con el método que prefieras."}
      </p>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link
          href={hasTopics ? "/sessions/new" : "/topics"}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-foreground text-background text-[12px] font-semibold hover:opacity-90 transition-opacity"
        >
          {hasTopics ? "Crear sesión" : "Crear tema"}
        </Link>
        <button
          type="button"
          onClick={ask.open}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-nova/35 bg-white text-foreground text-[12px] font-semibold hover:border-nova/55 hover:shadow-soft transition-all"
        >
          <Sparkles className="w-3 h-3 text-nova-mid" strokeWidth={1.5} />
          Pedir a Nova
        </button>
      </div>
    </div>
  );
}
