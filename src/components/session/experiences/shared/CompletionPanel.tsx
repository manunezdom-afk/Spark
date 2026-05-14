"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScoreSummary } from "@/components/payloads/ScoreSummary";
import type { ScorePayload } from "@/modules/spark/types";

/**
 * Final score panel rendered when la sesión termina. La pantalla canónica
 * de debrief vive en /sessions/[id]/summary — este panel hace router.replace
 * inmediatamente y muestra el score como fallback mientras navega. Si el
 * router falla por cualquier razón (e.g. SSR), el fallback queda visible
 * con CTAs manuales hacia /summary, /dashboard y el tema.
 */
export function CompletionPanel({
  score,
  sessionId,
  topicId,
}: {
  score: ScorePayload;
  sessionId?: string;
  topicId?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (sessionId) {
      router.replace(`/sessions/${sessionId}/summary`);
    }
  }, [router, sessionId]);

  return (
    <div className="p-6 rounded-2xl border border-spark/25 bg-spark/[0.04]">
      <ScoreSummary payload={score} />
      <div className="flex flex-wrap justify-end gap-2 pt-6 mt-6 border-t border-black/[0.06]">
        {sessionId && (
          <Button
            onClick={() => router.replace(`/sessions/${sessionId}/summary`)}
            variant="spark"
          >
            Ver resumen completo
          </Button>
        )}
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Volver al inicio
        </Button>
        {topicId && (
          <Button
            onClick={() => router.push(`/topics/${topicId}`)}
            variant="outline"
          >
            Ver tema
          </Button>
        )}
      </div>
    </div>
  );
}
