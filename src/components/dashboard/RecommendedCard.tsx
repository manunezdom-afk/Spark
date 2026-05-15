import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Recommendation } from "@/lib/spark/recommendation";

interface RecommendedCardProps {
  recommendation: Recommendation;
}

const TONE_CLASSES: Record<
  Recommendation["tone"],
  { border: string; bg: string; accent: string; accentBg: string }
> = {
  urgent: {
    border: "border-rose-300/40",
    bg: "bg-gradient-to-br from-rose-50/80 via-orange-50/40 to-transparent",
    accent: "text-rose-600",
    accentBg: "bg-rose-100/60 border-rose-200/50",
  },
  warm: {
    border: "border-spark/25",
    bg: "bg-gradient-to-br from-spark/[0.07] via-transparent to-spark/[0.03]",
    accent: "text-spark",
    accentBg: "bg-spark/10 border-spark/20",
  },
  neutral: {
    border: "border-black/[0.08]",
    bg: "bg-white/60",
    accent: "text-foreground/70",
    accentBg: "bg-black/[0.04] border-black/[0.06]",
  },
};

export function RecommendedCard({ recommendation: r }: RecommendedCardProps) {
  const tone = TONE_CLASSES[r.tone];

  return (
    <Link
      href={r.href}
      className={`group relative block p-6 md:p-7 rounded-2xl border ${tone.border} ${tone.bg} backdrop-blur-sm hover:shadow-lift hover:border-foreground/15 transition-all duration-300 ease-spring overflow-hidden`}
    >
      {r.kairosColor && (
        <span
          className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full opacity-70"
          style={{ backgroundColor: r.kairosColor }}
        />
      )}
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${tone.accentBg} border ${tone.accent} shrink-0`}
        >
          <r.Icon className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-mono text-[10px] uppercase tracking-[0.18em] ${tone.accent} mb-1.5`}
          >
            {r.kicker}
          </div>
          <div className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-2 leading-snug">
            {r.title}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
            {r.body}
          </p>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-[12.5px] font-semibold group-hover:opacity-90 transition-opacity">
            {r.cta}
            <ArrowRight
              className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
