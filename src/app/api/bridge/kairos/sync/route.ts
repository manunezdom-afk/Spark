import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clearDemoData } from "@/lib/spark/seed-demo";
import {
  getKairosSnapshot,
  type KairosSession,
  type KairosSubject,
} from "@/lib/spark/kairos-bridge";

export async function POST() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await getKairosSnapshot(db, user.id);
  if (!snapshot) return NextResponse.json({ created: 0, updated: 0 });

  const kairosSubjects = (snapshot.subjects ?? []).filter(
    (s: KairosSubject) => !s.archived && !s.demo,
  );
  if (!kairosSubjects.length) return NextResponse.json({ created: 0, updated: 0 });

  // Load existing Kairos-sourced topics for this user
  const { data: existingTopics } = await db
    .from("spark_topics")
    .select("id, kairos_subject_id, source_note_ids")
    .eq("user_id", user.id)
    .not("kairos_subject_id", "is", null);

  const existingBySubjectId = new Map(
    (existingTopics ?? []).map((t) => [t.kairos_subject_id as string, t]),
  );

  let created = 0;
  let updated = 0;

  for (const subject of kairosSubjects) {
    const sessions = (snapshot.sessions ?? []).filter(
      (sess: KairosSession) =>
        sess.subjectId === subject.id && !sess.parentSessionId,
    );
    const sessionIds = sessions.map((s: KairosSession) => s.id);

    const existing = existingBySubjectId.get(subject.id);

    if (!existing) {
      if (created === 0 && updated === 0) {
        await clearDemoData(db, user.id).catch(() => {});
      }
      await db.from("spark_topics").insert({
        user_id: user.id,
        title: subject.name,
        summary: subject.professor ? `Materia con ${subject.professor}` : null,
        category: subject.term ?? null,
        tags: [subject.name.toLowerCase().replace(/\s+/g, "-")],
        source_note_ids: sessionIds,
        kairos_subject_id: subject.id,
        kairos_color: subject.color ?? null,
      });
      created++;
    } else {
      // Update source_note_ids when Kairos sessions were added/removed
      const current = [...(existing.source_note_ids ?? [])].sort().join(",");
      const next = [...sessionIds].sort().join(",");
      if (current !== next) {
        await db
          .from("spark_topics")
          .update({
            source_note_ids: sessionIds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        updated++;
      }
    }
  }

  return NextResponse.json({ created, updated });
}
