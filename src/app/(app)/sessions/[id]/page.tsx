import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSession,
  getSessionTurns,
  getTopicsByIds,
} from "@/lib/spark/queries";
import { getTopicMaterials } from "@/lib/spark/kairos-bridge";
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

  // Resolve titles for the apuntes the user pinned to this session so
  // the intro stage can render them as chips. Empty selection = full
  // subject, so we skip the bridge call entirely.
  let selectedMaterials: { id: string; title: string }[] = [];
  if (session.selected_note_ids?.length) {
    const allRoots = topics.flatMap((t) => t.source_note_ids ?? []);
    if (allRoots.length) {
      const allMaterials = await getTopicMaterials(db, user.id, allRoots);
      const selectedSet = new Set(session.selected_note_ids);
      selectedMaterials = allMaterials
        .filter((m) => selectedSet.has(m.id))
        .map((m) => ({ id: m.id, title: m.title }));
    }
  }

  return (
    <SessionView
      session={session}
      topics={topics}
      initialTurns={turns}
      selectedMaterials={selectedMaterials}
    />
  );
}
