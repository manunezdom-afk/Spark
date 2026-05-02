import { NextResponse, type NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTopic } from "@/lib/spark/queries";
import { getTopicMaterials } from "@/lib/spark/kairos-bridge";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/topics/[id]/materials
 *
 * Returns the flat list of Kairos sessions ("apuntes/subpáginas") that
 * belong to a topic. The /sessions/new picker uses this to let the user
 * scope a study session to a specific apunte instead of the whole
 * subject.
 *
 * Empty array means "no Kairos sessions wired to this topic" — the UI
 * falls back to "studying the whole subject" with no filter.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const topic = await getTopic(db, id);
  if (!topic || topic.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const materials = await getTopicMaterials(
    db,
    user.id,
    topic.source_note_ids ?? [],
  );

  return NextResponse.json({
    topic_id: topic.id,
    materials,
  });
}
