import type { ScorePayload } from "@/modules/spark/types";

interface SummaryFeedbackProps {
  feedback: string;
  breakdown?: ScorePayload["breakdown"];
}

export function SummaryFeedback({ feedback, breakdown }: SummaryFeedbackProps) {
  return (
    <section className="rounded-2xl border border-black/[0.06] bg-white/60 p-6">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-4">
        Devolución de Nova
      </h2>
      <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap mb-6">
        {feedback}
      </p>
      {breakdown && breakdown.length > 0 && (
        <div className="flex flex-col gap-3 pt-5 border-t border-black/[0.05]">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Desglose por criterio
          </div>
          <ul className="flex flex-col gap-2.5">
            {breakdown.map((b, i) => (
              <li key={i}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-foreground/90">{b.criterion}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {b.value}/100
                  </span>
                </div>
                <div className="h-1 rounded-full bg-black/[0.06] overflow-hidden">
                  <div
                    className="h-full bg-spark/70 transition-all"
                    style={{ width: `${b.value}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
