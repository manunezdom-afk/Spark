import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSession,
  getSessionTurns,
  getTopicsByIds,
} from "@/lib/spark/queries";
import { SessionView } from "@/components/session/SessionView";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

export default async function SessionPage({ params }: RouteParams) {
  const { id } = await params;
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return notFound();

  const session = await getSession(db, id);
  if (!session || session.user_id !== user.id) return notFound();

  const [turns, topics] = await Promise.all([
    getSessionTurns(db, id),
    getTopicsByIds(db, session.topic_ids),
  ]);

  return <SessionView session={session} topics={topics} initialTurns={turns} />;
}
