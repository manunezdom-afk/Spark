import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clearDemoData } from "@/lib/spark/seed-demo";

/** DELETE /api/topics/demo — remove all demo topics for the current user */
export async function DELETE() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await clearDemoData(db, user.id);
  return NextResponse.json({ ok: true });
}
