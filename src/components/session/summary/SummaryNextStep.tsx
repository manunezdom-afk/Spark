import { RecommendedCard } from "@/components/dashboard/RecommendedCard";
import type { Recommendation } from "@/lib/spark/recommendation";

interface SummaryNextStepProps {
  recommendation: Recommendation;
}

export function SummaryNextStep({ recommendation }: SummaryNextStepProps) {
  return (
    <section>
      <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mb-3">
        Tu siguiente paso
      </h2>
      <RecommendedCard recommendation={recommendation} />
    </section>
  );
}
