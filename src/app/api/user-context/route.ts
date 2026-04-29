import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getUserContext, upsertUserContext } from "@/lib/spark/queries";
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
  current_role?: string;
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
    return NextResponse.json({ context: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 }
    );
  }
}
