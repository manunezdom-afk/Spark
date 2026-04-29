import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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

  return (
    <Link
      href={`/topics/${topic.id}`}
      className="group flex flex-col gap-3 p-5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.10] transition-colors backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {topic.category && (
              <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {topic.category}
              </span>
            )}
          </div>
          <h3 className="font-medium text-foreground group-hover:text-spark transition-colors line-clamp-2">
            {topic.title}
          </h3>
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-muted-foreground/50 group-hover:text-spark transition-colors shrink-0 mt-1"
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
              className="h-full bg-spark transition-all"
              style={{ width: `${Math.max(score, 4)}%` }}
            />
          </div>
          <span className="font-mono">{score}%</span>
        </div>
        <span>·</span>
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
