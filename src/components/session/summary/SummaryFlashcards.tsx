import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import type { SparkFlashcard } from "@/modules/spark/types";

interface SummaryFlashcardsProps {
  cards: SparkFlashcard[];
}

export function SummaryFlashcards({ cards }: SummaryFlashcardsProps) {
  if (!cards.length) return null;

  return (
    <section className="rounded-2xl border border-spark/20 bg-spark/[0.04] p-6">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-spark/15 border border-spark/30">
            <Layers className="w-4 h-4 text-spark" strokeWidth={1.5} />
          </span>
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-foreground leading-tight">
              {cards.length} {cards.length === 1 ? "tarjeta nueva" : "tarjetas nuevas"} para repasar
            </h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Generadas en esta sesión. Vencen hoy.
            </p>
          </div>
        </div>
        <Link
          href="/flashcards/review"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-spark text-white text-[12px] font-semibold hover:bg-spark/90 transition-colors"
        >
          Repasar ahora
          <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="overflow-x-auto -mx-1 pb-1">
        <ul className="flex gap-2 px-1">
          {cards.slice(0, 8).map((c) => (
            <li
              key={c.id}
              className="shrink-0 w-[220px] rounded-xl border border-black/[0.06] bg-white/80 p-3.5"
            >
              <p className="text-[12.5px] font-medium text-foreground leading-snug line-clamp-3">
                {c.front}
              </p>
              <p className="mt-2 pt-2 border-t border-black/[0.05] text-[11.5px] text-muted-foreground leading-snug line-clamp-2">
                {c.back}
              </p>
            </li>
          ))}
          {cards.length > 8 && (
            <li className="shrink-0 w-[140px] rounded-xl border border-dashed border-black/[0.10] bg-white/40 p-3.5 flex items-center justify-center">
              <span className="text-[12px] text-muted-foreground text-center">
                +{cards.length - 8} más
              </span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
