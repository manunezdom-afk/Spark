import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getKairosSnapshot,
  type KairosSession,
  type KairosSubject,
} from "@/lib/spark/kairos-bridge";

/**
 * Cookie used as "intent signal": cuando el usuario abre la pestaña
 * "Desde Kairos" del NewTopicDialog, el cliente llama a este endpoint.
 * Aprovechamos esa llamada para registrar que el usuario INTENTÓ
 * conectar Kairos al menos una vez. La página /topics lee esta cookie
 * para decidir si muestra el banner de "tus notas no están disponibles".
 *
 * Sin esta señal, el banner aparecería para cualquier usuario nuevo
 * que nunca tuvo intención de usar Kairos.
 */
const KAIROS_INTENT_COOKIE = "spark_kairos_attempted";

export async function GET(_req: NextRequest) {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const snapshot = await getKairosSnapshot(db, user.id);

  const subjects = !snapshot
    ? []
    : (snapshot.subjects ?? [])
        .filter((s: KairosSubject) => !s.archived && !s.demo)
        .map((s: KairosSubject) => {
          const sessions = (snapshot.sessions ?? []).filter(
            (sess: KairosSession) => sess.subjectId === s.id && !sess.parentSessionId,
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

  const response = NextResponse.json({ subjects });
  // Mark intent for 1 year (no PII, just a flag).
  response.cookies.set({
    name: KAIROS_INTENT_COOKIE,
    value: "1",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
  });
  return response;
}
