import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clearDemoData } from "@/lib/spark/seed-demo";
import {
  getKairosSnapshot,
  type KairosSession,
  type KairosSubject,
} from "@/lib/spark/kairos-bridge";

/**
 * Sincroniza topics de Spark con el snapshot de Kairos del usuario.
 *
 * Tres acciones:
 *   - INSERT: subjects nuevos en Kairos crean topics nuevos en Spark.
 *   - UPDATE: si los source_note_ids del subject cambiaron, se actualizan.
 *   - DELETE: topics con `kairos_subject_id` que ya no existe en el
 *     snapshot se borran como huérfanos (junto con sus mastery_states).
 *
 * Nota sobre snapshot vacío: si `getKairosSnapshot` devuelve null,
 * el usuario nunca tuvo Kairos sincronizado a Supabase — no tocamos
 * nada. Pero si el snapshot existe y tiene subjects: [], significa
 * que el usuario VACIÓ Kairos, y los topics existentes con
 * kairos_subject_id deben limpiarse.
 */
export async function POST() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await getKairosSnapshot(db, user.id);

  // Sin snapshot: el usuario nunca conectó Kairos vía Supabase. No
  // tocamos topics existentes (podrían venir de imports manuales
  // anteriores que ahora son "huérfanos legítimos" para el usuario).
  if (!snapshot) return NextResponse.json({ created: 0, updated: 0, deleted: 0 });

  const kairosSubjects = (snapshot.subjects ?? []).filter(
    (s: KairosSubject) => !s.archived && !s.demo,
  );

  // Cargar todos los topics existentes anclados a Kairos para este user
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
  let deleted = 0;

  // INSERT/UPDATE
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
      // Update source_note_ids cuando cambian las sessions de Kairos
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

  // DELETE huérfanos: topics cuyo kairos_subject_id ya no existe en
  // el snapshot. Esto ocurre cuando el usuario borra una materia (o
  // todas) en Kairos. Sin esta limpieza, Spark queda mostrando
  // topics fantasma con badge "KAIROS" que no apuntan a nada.
  const currentSubjectIds = new Set(kairosSubjects.map((s: KairosSubject) => s.id));
  const orphanTopics = (existingTopics ?? []).filter(
    (t) => !currentSubjectIds.has(t.kairos_subject_id as string),
  );
  if (orphanTopics.length > 0) {
    const orphanIds = orphanTopics.map((t) => t.id);
    // mastery_states no tienen ON DELETE CASCADE — borrar explícito
    await db
      .from("spark_mastery_states")
      .delete()
      .eq("user_id", user.id)
      .in("topic_id", orphanIds);
    await db
      .from("spark_topics")
      .delete()
      .eq("user_id", user.id)
      .in("id", orphanIds);
    deleted = orphanTopics.length;
  }

  return NextResponse.json({ created, updated, deleted });
}
