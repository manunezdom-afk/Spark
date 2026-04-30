"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical } from "lucide-react";

/**
 * Banner shown when the user only has demo topics.
 * Explains the demo, offers a "Limpiar ejemplos" action.
 */
export function ClearDemoBanner() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClear() {
    setLoading(true);
    await fetch("/api/topics/demo", { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 mb-6 sm:flex-row sm:items-center sm:gap-4">
      <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-spark/20 bg-spark/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-spark">
        <FlaskConical className="h-3 w-3" strokeWidth={1.5} />
        Ejemplos
      </span>
      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
        Estos temas son una demo para que veas cómo se ve Spark.
        Desaparecen automáticamente cuando crees el primero tuyo,
        o puedes limpiarlos ahora.
      </p>
      <button
        type="button"
        disabled={loading}
        onClick={handleClear}
        className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/[0.14] hover:text-foreground disabled:opacity-50"
      >
        {loading ? "Limpiando…" : "Limpiar ejemplos"}
      </button>
    </div>
  );
}
