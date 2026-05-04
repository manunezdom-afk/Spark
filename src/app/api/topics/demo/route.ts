import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { clearDemoData, seedDemoData } from "@/lib/spark/seed-demo";

/**
 * POST /api/topics/demo — asegura que existan los topics demo para el
 * usuario actual. Idempotente: si ya están, devuelve sus IDs sin tocar
 * nada. Pensado para el botón "Probar con material de ejemplo" en
 * /sessions/new.
 */
export async function POST() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topicIds } = await seedDemoData(db, user.id);
    return NextResponse.json({ topicIds });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    );
  }
}

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
