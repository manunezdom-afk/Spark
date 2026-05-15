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
    <div className="rounded-2xl border border-black/[0.05] bg-white shadow-soft p-5 sm:p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-spark-soft border border-spark/22 shrink-0">
        <Activity className="w-5 h-5 text-spark" strokeWidth={1.5} />
      </div>
      <p className="flex-1 text-[13.5px] leading-relaxed text-ink-secondary">
        {hasTopics
          ? "Aún no tienes una sesión en curso. Elige cómo entrenar arriba o pídele a Nova que te recomiende por dónde empezar."
          : "Crea tu primer tema para empezar a entrenar. Puedes importarlo desde Kairos o crearlo manualmente."}
      </p>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Link
          href={hasTopics ? "/sessions/new" : "/topics"}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-spark text-white text-[12.5px] font-medium hover:bg-spark-deep transition-colors shadow-soft"
        >
          {hasTopics ? "Crear sesión" : "Crear tema"}
        </Link>
        <button
          type="button"
          onClick={ask.open}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-nova/30 bg-white text-ink text-[12px] font-medium hover:border-nova/50 hover:shadow-soft transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-nova-mid" strokeWidth={1.5} />
          Pedir a Nova
        </button>
      </div>
    </div>
  );
}
