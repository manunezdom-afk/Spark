import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { computeWeeklyStats } from "@/lib/spark/weekly-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const stats = await computeWeeklyStats(db, user.id);
  return NextResponse.json(stats);
}
