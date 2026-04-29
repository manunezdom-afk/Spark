import { Zap } from "lucide-react";
import { PayloadRenderer } from "@/components/payloads/PayloadRenderer";
import type { TurnPayload } from "@/modules/spark/types";

export function ChallengeCard({
  text,
  payload,
}: {
  text: string;
  payload?: TurnPayload | null;
}) {
  return (
    <div className="flex flex-col gap-4 pl-4 border-l-2 border-spark/60">
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-spark" strokeWidth={1.5} fill="currentColor" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-spark">
          Spark
        </span>
      </div>
      {text && (
        <div className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
          {text}
        </div>
      )}
      {payload && (
        <div className="mt-2">
          <PayloadRenderer payload={payload} />
        </div>
      )}
    </div>
  );
}

export function StreamingChallengeCard({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-4 pl-4 border-l-2 border-spark/30">
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-spark animate-pulse" strokeWidth={1.5} fill="currentColor" />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-spark">
          Spark · pensando
        </span>
      </div>
      <div className="text-base leading-relaxed whitespace-pre-wrap text-foreground/80">
        {text}
        <span className="inline-block w-1.5 h-4 bg-spark/60 animate-pulse ml-0.5 align-middle" />
      </div>
    </div>
  );
}
