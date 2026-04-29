import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserContext, upsertUserContext, getTopics } from "@/lib/spark/queries";
import { seedDemoData } from "@/lib/spark/seed-demo";
import type { LearningStyle, ActiveProject, PersonalGoal } from "@/modules/spark/types";

export async function GET() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ctx = await getUserContext(db, user.id);
  return NextResponse.json({ context: ctx });
}

type PutBody = {
  career?: string;
  user_role?: string;
  active_projects?: ActiveProject[];
  personal_goals?: PersonalGoal[];
  learning_style?: LearningStyle;
  custom_context?: string;
};

export async function PUT(request: NextRequest) {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json()) as PutBody;
  try {
    const updated = await upsertUserContext(db, user.id, body);
    // Seed demo data only on first onboarding (no topics yet)
    const existing = await getTopics(db, user.id);
    if (existing.length === 0) {
      await seedDemoData(db, user.id).catch(() => {});
    }
    return NextResponse.json({ context: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 }
    );
  }
}
