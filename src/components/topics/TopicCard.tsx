import Link from "next/link";
import { ArrowUpRight, BookOpen, FlaskConical } from "lucide-react";
import type { SparkTopic, SparkMasteryState } from "@/modules/spark/types";

export function TopicCard({
  topic,
  mastery,
}: {
  topic: SparkTopic;
  mastery?: SparkMasteryState;
}) {
  const score = mastery?.mastery_score ?? 0;
  const sessions = mastery?.total_sessions ?? 0;
  const kairosColor = topic.kairos_color ?? null;

  return (
    <Link
      href={`/topics/${topic.id}`}
      className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-black/[0.05] bg-white shadow-soft hover:border-black/[0.10] hover:shadow-lift hover:-translate-y-px transition-all duration-200"
    >
      {/* Kairos color accent bar */}
      {kairosColor && (
        <div
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full opacity-80"
          style={{ backgroundColor: kairosColor }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {topic.category && (
              <span className="text-[11px] font-medium text-ink-tertiary tracking-tight">
                {topic.category}
              </span>
            )}
            {topic.kairos_subject_id && (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-nova-mid border border-nova-mid/22 bg-nova-mid/[0.06] px-2 py-0.5 rounded-full">
                <BookOpen className="w-2.5 h-2.5" strokeWidth={1.5} />
                Kairos
              </span>
            )}
            {topic.is_demo && (
              <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-ink-tertiary border border-black/[0.07] bg-black/[0.02] px-2 py-0.5 rounded-full">
                <FlaskConical className="w-2.5 h-2.5" strokeWidth={1.5} />
                Ejemplo
              </span>
            )}
          </div>
          <h3 className="font-medium text-[15px] text-ink group-hover:text-spark-deep transition-colors line-clamp-2 leading-snug">
            {topic.title}
          </h3>
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-ink-tertiary group-hover:text-spark group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
          strokeWidth={1.5}
        />
      </div>

      {topic.summary && (
        <p className="text-[12.5px] text-ink-secondary line-clamp-2 leading-relaxed">
          {topic.summary}
        </p>
      )}

      <div className="flex items-center gap-3 text-[12px] text-ink-tertiary">
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1 rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-spark to-spark/70 transition-all"
              style={{ width: `${Math.max(score, 4)}%` }}
            />
          </div>
          <span className="tabular-nums font-medium">{score}%</span>
        </div>
        <span className="text-ink-tertiary/40">·</span>
        <span>
          {sessions} {sessions === 1 ? "sesión" : "sesiones"}
        </span>
      </div>

      {topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topic.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-surface-subtle border border-black/[0.05] text-ink-tertiary"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
