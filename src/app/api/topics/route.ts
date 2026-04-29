import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTopics, createTopic } from "@/lib/spark/queries";

export async function GET() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const topics = await getTopics(db, user.id);
  return NextResponse.json({ topics });
}

type PostBody = {
  title?: string;
  summary?: string | null;
  category?: string | null;
  tags?: string[];
  source_note_ids?: string[];
};

export async function POST(request: NextRequest) {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as PostBody;
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "title es requerido" }, { status: 400 });
  }

  try {
    const topic = await createTopic(db, user.id, {
      title: body.title.trim(),
      summary: body.summary ?? null,
      category: body.category ?? null,
      tags: body.tags ?? [],
      source_note_ids: body.source_note_ids ?? [],
    });
    return NextResponse.json({ topic }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error" },
      { status: 400 }
    );
  }
}
