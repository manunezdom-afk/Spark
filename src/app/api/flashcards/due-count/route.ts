import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDueFlashcardsCount } from "@/lib/spark/queries";

/**
 * GET /api/flashcards/due-count
 * Devuelve el número de tarjetas vencidas hoy según SM-2.
 * Lo consume /tests/new para mostrar el badge de "N tarjetas pendientes".
 */
export async function GET() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const count = await getDueFlashcardsCount(db, user.id);
  return NextResponse.json({ count });
}
