import { Award } from "lucide-react";
import type { ScorePayload } from "@/modules/spark/types";

export function ScoreSummary({ payload }: { payload: ScorePayload }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-spark/15 border border-spark/40 flex items-center justify-center shrink-0">
          <Award className="w-6 h-6 text-spark" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            Resultado
          </span>
          <div className="font-serif text-4xl tracking-tight">
            <span className="text-spark">{payload.score}</span>
            <span className="text-muted-foreground">/100</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          Desglose
        </div>
        <ul className="flex flex-col gap-2.5">
          {payload.breakdown.map((b, i) => (
            <li key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span>{b.criterion}</span>
                <span className="font-mono text-xs text-muted-foreground">{b.value}/100</span>
              </div>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full bg-spark/70 transition-all"
                  style={{ width: `${b.value}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 rounded-md border border-white/[0.06] bg-white/[0.02]">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
          Devolución
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{payload.feedback}</p>
      </div>
    </div>
  );
}
