import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getKairosSnapshot } from "@/lib/spark/kairos-bridge";

export async function GET(_req: NextRequest) {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await getKairosSnapshot(db, user.id);
  if (!snapshot) return NextResponse.json({ subjects: [] });

  const subjects = (snapshot.subjects ?? [])
    .filter((s: KairosSubject) => !s.archived && !s.demo)
    .map((s: KairosSubject) => {
      const sessions = (snapshot.sessions ?? []).filter(
        (sess: KairosSession) => sess.subjectId === s.id && !sess.parentSessionId
      );
      return {
        id: s.id,
        name: s.name,
        professor: s.professor ?? null,
        emoji: s.emoji ?? null,
        color: s.color ?? null,
        term: s.term ?? null,
        session_count: sessions.length,
        session_ids: sessions.map((sess: KairosSession) => sess.id),
      };
    });

  return NextResponse.json({ subjects });
}

type KairosSubject = {
  id: string;
  name: string;
  professor?: string;
  emoji?: string;
  color?: string;
  term?: string;
  archived?: boolean;
  demo?: boolean;
};

type KairosSession = {
  id: string;
  subjectId: string;
  parentSessionId?: string;
  title: string;
};
