"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScoreSummary } from "@/components/payloads/ScoreSummary";
import type { ScorePayload } from "@/modules/spark/types";

/**
 * Final score panel rendered when the session is evaluated. All
 * experiences share this — once the score lands, the method-specific
 * UI gives way to the same debrief shape.
 */
export function CompletionPanel({
  score,
  topicId,
}: {
  score: ScorePayload;
  topicId?: string;
}) {
  const router = useRouter();
  return (
    <div className="p-6 rounded-2xl border border-spark/25 bg-spark/[0.04]">
      <ScoreSummary payload={score} />
      <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-black/[0.06]">
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Volver al inicio
        </Button>
        {topicId && (
          <Button
            onClick={() => router.push(`/topics/${topicId}`)}
            variant="spark"
          >
            Ver tema
          </Button>
        )}
      </div>
    </div>
  );
}
