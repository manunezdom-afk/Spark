import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getDueFlashcards } from "@/lib/spark/queries";

export async function GET() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const cards = await getDueFlashcards(db, user.id);
  return NextResponse.json({ cards });
}
