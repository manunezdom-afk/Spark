import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import type { SparkErrorPattern } from "@/modules/spark/types";

interface SummaryErrorsProps {
  errors: SparkErrorPattern[];
}

const ERROR_LABELS: Record<SparkErrorPattern["error_type"], string> = {
  conceptual: "Conceptual",
  causal: "Causal",
  factual: "Factual",
  application: "Aplicación",
  omission: "Omisión",
};

export function SummaryErrors({ errors }: SummaryErrorsProps) {
  if (!errors.length) return null;

  return (
    <section className="rounded-2xl border border-amber-300/40 bg-amber-50/40 p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-100 border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-700" strokeWidth={1.5} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground leading-tight">
              {errors.length} {errors.length === 1 ? "patrón detectado" : "patrones detectados"}
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Errores que se repitieron en esta sesión.
            </p>
          </div>
        </div>
        <Link
          href="/errors"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-amber-300/50 bg-white text-amber-800 text-[12px] font-semibold hover:bg-amber-50 transition-colors"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {errors.slice(0, 4).map((e) => (
          <li
            key={e.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-black/[0.05] bg-white/70"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-amber-700 shrink-0 pt-0.5">
              {ERROR_LABELS[e.error_type]}
            </span>
            <p className="flex-1 text-[12.5px] text-foreground/90 leading-relaxed">
              {e.description}
            </p>
            {e.frequency > 1 && (
              <span className="font-mono text-[10px] text-muted-foreground shrink-0 pt-0.5">
                ×{e.frequency}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
