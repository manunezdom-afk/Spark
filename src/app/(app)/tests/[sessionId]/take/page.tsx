import { notFound, redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSession, getSessionTurns, getTopicsByIds } from "@/lib/spark/queries";
import { TestTaker } from "@/components/tests/TestTaker";

import type { TestQuestionsPayload } from "@/modules/spark/types";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ sessionId: string }> };

export default async function TakeTestPage({ params }: RouteParams) {
  const { sessionId } = await params;
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const session = await getSession(db, sessionId);
  if (!session || session.user_id !== user.id) notFound();

  // If already completed, send straight to results
  if (session.status === "completed") {
    redirect(`/tests/${sessionId}/results`);
  }
  if (session.status === "abandoned") notFound();

  const turns = await getSessionTurns(db, sessionId);
  const questionsTurn = turns.find((t) => t.payload?.type === "test_questions");

  if (!questionsTurn?.payload) notFound();

  const qPayload = questionsTurn.payload as TestQuestionsPayload;
  const topics = await getTopicsByIds(db, session.topic_ids);

  return (
    <TestTaker
      sessionId={sessionId}
      testType={qPayload.test_type}
      questions={qPayload.questions}
      topicTitles={topics.map((t) => t.title)}
    />
  );
}
