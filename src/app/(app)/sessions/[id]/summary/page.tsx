import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSession,
  getSessionTurns,
  getTopicsByIds,
  getMasteryDeltasForSession,
  getFlashcardsBySession,
  getNewErrorPatternsSince,
  getDueFlashcardsCount,
  getDueMasteryCount,
  getSessions,
  getDaysToNearestDeadline,
  getTopics,
  getErrorPatterns,
} from "@/lib/spark/queries";
import { buildRecommendation } from "@/lib/spark/recommendation";
import { SummaryHero } from "@/components/session/summary/SummaryHero";
import { MasteryDelta } from "@/components/session/summary/MasteryDelta";
import { SummaryFeedback } from "@/components/session/summary/SummaryFeedback";
import { SummaryFlashcards } from "@/components/session/summary/SummaryFlashcards";
import { SummaryErrors } from "@/components/session/summary/SummaryErrors";
import { SummaryNextStep } from "@/components/session/summary/SummaryNextStep";
import type { ScorePayload } from "@/modules/spark/types";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export default async function SessionSummaryPage({ params }: RouteParams) {
  const { id } = await params;
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return notFound();

  const session = await getSession(db, id);
  if (!session || session.user_id !== user.id) return notFound();

  // Si la sesión no está completada todavía, redirigir a la sesión activa.
  if (session.status !== "completed" || session.score === null) {
    redirect(`/sessions/${id}`);
  }

  const [
    turns,
    topics,
    deltas,
    flashcards,
    newErrors,
    flashcardsDue,
    masteryDue,
    activeSessions,
    daysToDeadline,
    allTopics,
    allErrorPatterns,
  ] = await Promise.all([
    getSessionTurns(db, id),
    getTopicsByIds(db, session.topic_ids),
    getMasteryDeltasForSession(db, user.id, session),
    getFlashcardsBySession(db, id),
    getNewErrorPatternsSince(db, user.id, session.started_at, session.topic_ids),
    getDueFlashcardsCount(db, user.id),
    getDueMasteryCount(db, user.id),
    getSessions(db, user.id, "active"),
    getDaysToNearestDeadline(db, user.id),
    getTopics(db, user.id),
    getErrorPatterns(db, user.id),
  ]);

  // Buscar el último turn assistant con payload type 'score' para
  // extraer el breakdown completo (persistido en complete/route.ts).
  const scorePayload = turns
    .slice()
    .reverse()
    .find(
      (t): t is typeof t & { payload: ScorePayload } =>
        t.role === "assistant" && t.payload?.type === "score"
    )?.payload;

  const breakdown = scorePayload?.breakdown ?? [];

  // Estimar duración por turns (~1.5 min cada uno). Cota mínima 1 min.
  const turnCount = turns.filter((t) => t.role !== "assistant" || t.payload?.type !== "score").length;
  const durationMinutes = Math.max(1, Math.round(turnCount * 1.5));

  const kairosTopics = allTopics.filter((t) => t.kairos_subject_id);
  const recommendation = buildRecommendation({
    activeSessions,
    flashcardsDue,
    masteryDue,
    daysToDeadline,
    topics: allTopics,
    kairosTopics,
    errorsCount: allErrorPatterns.length,
  });

  return (
    <div className="p-4 md:p-12 max-w-3xl mx-auto animate-fade-up">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
        Volver al inicio
      </Link>

      <div className="flex flex-col gap-6">
        <SummaryHero
          engine={session.engine}
          score={session.score}
          durationMinutes={durationMinutes}
          topicTitles={topics.map((t) => t.title)}
        />

        <SummaryFeedback
          feedback={session.feedback ?? "Sin devolución registrada."}
          breakdown={breakdown}
        />

        <MasteryDelta deltas={deltas} topics={topics} />

        <SummaryFlashcards cards={flashcards} />

        <SummaryErrors errors={newErrors} />

        <SummaryNextStep recommendation={recommendation} />

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href={`/sessions/new?engine=${session.engine}${
              session.topic_ids.length
                ? `&topic_ids=${session.topic_ids.join(",")}`
                : ""
            }`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-black/[0.10] bg-white text-foreground text-[12.5px] font-semibold hover:bg-black/[0.03] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
            Repetir con el mismo método
          </Link>
        </div>
      </div>
    </div>
  );
}
