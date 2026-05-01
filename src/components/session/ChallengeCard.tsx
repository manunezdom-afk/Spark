import { PayloadRenderer } from "@/components/payloads/PayloadRenderer";
import { NovaMark } from "@/components/nova/NovaMark";
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
        <NovaMark size={14} />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: "linear-gradient(90deg, #8B5CF6, #FF8A4C)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Nova
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
        <NovaMark size={14} className="animate-pulse" />
        <span
          className="font-mono text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: "linear-gradient(90deg, #8B5CF6, #FF8A4C)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            opacity: 0.7,
          }}
        >
          Nova · pensando
        </span>
      </div>
      <div className="text-base leading-relaxed whitespace-pre-wrap text-foreground/80">
        {text}
        <span className="inline-block w-1.5 h-4 bg-spark/60 animate-pulse ml-0.5 align-middle" />
      </div>
    </div>
  );
}
