import Link from "next/link";
import { ArrowRight, TrendingDown } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAllMastery } from "@/lib/spark/queries";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import type { SparkTopic } from "@/modules/spark/types";

interface WeakTopicsWidgetProps {
  userId: string;
  topics: SparkTopic[];
}

/**
 * Top 3 temas con maestría < 70 que ya tienen al menos una sesión.
 * Si el usuario tiene < 3 temas con datos, muestra todos los disponibles
 * con su maestría actual. Si ningún tema tiene datos, muestra un estado
 * vacío sugiriendo empezar a entrenar.
 */
export async function WeakTopicsWidget({ userId, topics }: WeakTopicsWidgetProps) {
  const db = await getSupabaseServerClient();
  const states = await getAllMastery(db, userId);

  // Solo temas con al menos una sesión.
  const trained = states
    .filter((s) => s.total_sessions > 0)
    .sort((a, b) => a.mastery_score - b.mastery_score);

  const topicsById = new Map(topics.map((t) => [t.id, t]));
  const weak = trained
    .filter((s) => s.mastery_score < 70)
    .slice(0, 3)
    .map((s) => ({ state: s, topic: topicsById.get(s.topic_id) }))
    .filter((row): row is { state: typeof row.state; topic: SparkTopic } => Boolean(row.topic));

  if (weak.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/[0.10] bg-white/40 p-5 text-[13px] text-muted-foreground leading-relaxed">
        {trained.length === 0
          ? "Todavía no tienes temas entrenados. Cuando completes una sesión, aquí verás los más débiles."
          : "Vas bien — ningún tema entrenado está por debajo del 70% de maestría."}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {weak.map(({ state, topic }) => (
        <li key={state.id}>
          <Link
            href={`/topics/${topic.id}`}
            className="flex items-center gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-white/55 hover:bg-white hover:border-black/[0.12] hover:shadow-soft transition-all duration-200"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 bg-amber-100/60 border border-amber-200/50 text-amber-700">
              <TrendingDown className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-semibold tracking-tight text-foreground truncate">
                {topic.title}
              </div>
              <div className="mt-1.5">
                <MasteryBar score={state.mastery_score} size="sm" />
              </div>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground inline-flex items-center gap-1 shrink-0">
              Entrenar
              <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
