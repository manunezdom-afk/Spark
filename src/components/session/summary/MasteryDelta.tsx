import { ArrowRight, TrendingUp, Minus } from "lucide-react";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { InfoIcon } from "@/components/ui/info-icon";
import type { SparkTopic } from "@/modules/spark/types";

interface MasteryDeltaItem {
  topic_id: string;
  before: number;
  after: number;
  delta: number;
}

interface MasteryDeltaProps {
  deltas: MasteryDeltaItem[];
  topics: SparkTopic[];
}

export function MasteryDelta({ deltas, topics }: MasteryDeltaProps) {
  if (!deltas.length) return null;
  const topicsById = new Map(topics.map((t) => [t.id, t]));

  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white/60 p-6">
      <div className="flex items-center gap-2 mb-5">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Cómo cambió tu maestría
        </h2>
        <InfoIcon
          hint="Maestría es el promedio ponderado de tus puntajes por sesión en este tema. Cada sesión completada empuja el número."
          size="sm"
        />
      </div>
      <ul className="flex flex-col gap-4">
        {deltas.map((d) => {
          const topic = topicsById.get(d.topic_id);
          const positive = d.delta > 0;
          const flat = d.delta === 0;
          return (
            <li key={d.topic_id} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[13.5px] font-medium text-foreground truncate">
                  {topic?.title ?? "Tema sin título"}
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.14em] ${
                    positive
                      ? "text-emerald-600"
                      : flat
                        ? "text-muted-foreground"
                        : "text-rose-600"
                  }`}
                >
                  {flat ? (
                    <Minus className="w-3 h-3" strokeWidth={1.5} />
                  ) : (
                    <TrendingUp
                      className={`w-3 h-3 ${positive ? "" : "rotate-180"}`}
                      strokeWidth={1.5}
                    />
                  )}
                  {positive ? `+${d.delta}` : flat ? "0" : `${d.delta}`} pts
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <MasteryBar score={d.after} size="md" showLabel={false} />
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
                  <span>{d.before}%</span>
                  <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
                  <span className="text-foreground font-semibold">{d.after}%</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
