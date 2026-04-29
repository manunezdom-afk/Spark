import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getFlashcard, updateFlashcardReview } from "@/lib/spark/queries";
import { sm2 } from "@/modules/spark/scheduler/sm2";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quality } = (await request.json()) as { quality?: number };
  if (typeof quality !== "number" || quality < 0 || quality > 5) {
    return NextResponse.json({ error: "quality 0–5 requerido" }, { status: 400 });
  }

  const card = await getFlashcard(db, id);
  if (!card || card.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const sm = sm2({
    ease_factor: card.ease_factor,
    interval_days: card.interval_days,
    repetitions: card.repetitions,
    quality,
  });

  // Mastery score: weighted average pulled toward quality * 20.
  const newScore = Math.round((card.mastery_score * 0.6) + (quality * 20 * 0.4));

  await updateFlashcardReview(db, id, {
    ease_factor: sm.ease_factor,
    interval_days: sm.interval_days,
    repetitions: sm.repetitions,
    next_review_at: sm.next_review_at.toISOString(),
    mastery_score: Math.max(0, Math.min(100, newScore)),
  });

  return NextResponse.json({ ok: true });
}
