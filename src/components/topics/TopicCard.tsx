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
      className="group flex flex-col gap-3 p-5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-200 backdrop-blur-xl hover:-translate-y-px hover:shadow-[0_6px_24px_rgba(201,123,63,0.08)]"
    >
      {/* Kairos color accent bar */}
      {kairosColor && (
        <div
          className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full opacity-60"
          style={{ backgroundColor: kairosColor }}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {topic.category && (
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {topic.category}
              </span>
            )}
            {topic.kairos_subject_id && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-nova-mid border border-nova-mid/20 bg-nova-mid/[0.06] px-1.5 py-0.5 rounded-full">
                <BookOpen className="w-2.5 h-2.5" strokeWidth={1.5} />
                Kairos
              </span>
            )}
            {topic.is_demo && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60 border border-white/[0.08] bg-white/[0.03] px-1.5 py-0.5 rounded-full">
                <FlaskConical className="w-2.5 h-2.5" strokeWidth={1.5} />
                Ejemplo
              </span>
            )}
          </div>
          <h3 className="font-medium text-foreground group-hover:text-spark transition-colors line-clamp-2 leading-snug">
            {topic.title}
          </h3>
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-muted-foreground/40 group-hover:text-spark transition-colors shrink-0 mt-0.5"
          strokeWidth={1.5}
        />
      </div>

      {topic.summary && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {topic.summary}
        </p>
      )}

      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-spark to-spark/70 transition-all"
              style={{ width: `${Math.max(score, 4)}%` }}
            />
          </div>
          <span className="font-mono">{score}%</span>
        </div>
        <span className="text-muted-foreground/30">·</span>
        <span>
          {sessions} {sessions === 1 ? "sesión" : "sesiones"}
        </span>
      </div>

      {topic.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topic.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
