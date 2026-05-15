import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTopic, insertFlashcards } from "@/lib/spark/queries";
import {
  getKairosSnapshot,
  expandKairosDescendants,
  type KairosBlock,
} from "@/lib/spark/kairos-bridge";

/**
 * Importa flashcards nativas de Kairos para un topic.
 *
 * A diferencia de /api/nova/flashcards que usa el LLM para generarlas,
 * este endpoint lee directamente los blocks de Kairos que ya tienen
 * `question` y `answer` escritos por el estudiante. Sin LLM, sin
 * rate limit, importación instantánea.
 *
 * POST /api/bridge/kairos/flashcards
 * Body: { topicId: string }
 * Response: { created: number, skipped: number }
 */
export async function POST(req: Request) {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let topicId: string;
  try {
    const body = (await req.json()) as { topicId?: string };
    if (!body.topicId) throw new Error("missing topicId");
    topicId = body.topicId;
  } catch {
    return NextResponse.json({ error: "Falta topicId." }, { status: 400 });
  }

  const topic = await getTopic(db, topicId);
  if (!topic || topic.user_id !== user.id) {
    return NextResponse.json({ error: "Tema no encontrado." }, { status: 404 });
  }

  if (!topic.source_note_ids?.length) {
    return NextResponse.json(
      { error: "Este tema no tiene apuntes de Kairos vinculados." },
      { status: 400 },
    );
  }

  const snapshot = await getKairosSnapshot(db, user.id);
  if (!snapshot) {
    return NextResponse.json(
      { error: "No se encontró el snapshot de Kairos." },
      { status: 404 },
    );
  }

  const allIds = new Set(expandKairosDescendants(snapshot, topic.source_note_ids));

  const nativeCards = (snapshot.blocks ?? []).filter(
    (b: KairosBlock) =>
      allIds.has(b.sessionId) &&
      b.question?.trim() &&
      b.answer?.trim(),
  );

  if (!nativeCards.length) {
    return NextResponse.json({ created: 0, skipped: 0 });
  }

  // Evitar duplicados: leer fronts existentes para este topic
  const { data: existingCards } = await db
    .from("spark_flashcards")
    .select("front")
    .eq("user_id", user.id)
    .eq("topic_id", topicId);

  const existingFronts = new Set(
    (existingCards ?? []).map((c) => c.front.trim().toLowerCase()),
  );

  const toInsert = nativeCards.filter(
    (b) => !existingFronts.has(b.question!.trim().toLowerCase()),
  );

  if (!toInsert.length) {
    return NextResponse.json({ created: 0, skipped: nativeCards.length });
  }

  await insertFlashcards(
    db,
    user.id,
    toInsert.map((b) => ({
      topic_id: topicId,
      session_id: null,
      front: b.question!.trim(),
      back: b.answer!.trim(),
      hint: null,
    })),
  );

  return NextResponse.json({
    created: toInsert.length,
    skipped: nativeCards.length - toInsert.length,
  });
}
