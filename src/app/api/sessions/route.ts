import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  createSession,
  getSessions,
  getUserContext,
  getTopicsByIds,
  getMasteryStates,
  getErrorPatterns,
  getDaysToNearestDeadline,
} from "@/lib/spark/queries";
import {
  getKairosSnapshot,
  expandKairosDescendants,
} from "@/lib/spark/kairos-bridge";
import { buildEngineConfig } from "@/modules/spark/engines";
import type {
  CreateSessionRequest,
  EngineContext,
  SparkUserContext,
} from "@/modules/spark/types";

function emptyUserContext(userId: string): SparkUserContext {
  return {
    id: "",
    user_id: userId,
    career: null,
    user_role: null,
    active_projects: [],
    personal_goals: [],
    learning_style: null,
    custom_context: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as CreateSessionRequest;
  if (!body.engine || !body.topic_ids?.length) {
    return NextResponse.json(
      { error: "engine y topic_ids son requeridos" },
      { status: 400 }
    );
  }

  try {
    const [userCtx, topics, mastery, errors, daysToDeadline] = await Promise.all([
      getUserContext(db, user.id),
      getTopicsByIds(db, body.topic_ids),
      getMasteryStates(db, user.id, body.topic_ids),
      getErrorPatterns(db, user.id, body.topic_ids),
      getDaysToNearestDeadline(db, user.id),
    ]);

    const ctx: EngineContext = {
      user: userCtx ?? emptyUserContext(user.id),
      topics,
      mastery,
      error_patterns: errors,
      days_to_deadline: daysToDeadline,
      prior_turns: [],
    };

    buildEngineConfig(
      { engine: body.engine, topic_ids: body.topic_ids, persona: body.persona },
      ctx
    );

    // Validate selected_note_ids: the user can pick a top-level apunte
    // OR any sub-page of those apuntes. We expand the topic roots
    // through the Kairos parent/child graph so a sub-page id is still
    // accepted; anything outside that closed set is dropped silently.
    const requestedSelected = body.selected_note_ids ?? [];
    let safeSelected: string[] = [];
    if (requestedSelected.length) {
      const roots = topics.flatMap((t) => t.source_note_ids ?? []);
      let universe = new Set(roots);
      if (roots.length) {
        const snapshot = await getKairosSnapshot(db, user.id);
        if (snapshot) {
          universe = new Set(expandKairosDescendants(snapshot, roots));
        }
      }
      safeSelected = requestedSelected.filter((id) => universe.has(id));
    }

    const session = await createSession(db, {
      user_id: user.id,
      topic_ids: body.topic_ids,
      selected_note_ids: safeSelected,
      engine: body.engine,
      status: "active",
      persona: body.persona ?? null,
      scenario: body.scenario ?? null,
      score: null,
      feedback: null,
      errors_found: [],
      nearest_deadline: null,
      days_to_deadline: daysToDeadline,
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as
    | "active"
    | "completed"
    | "abandoned"
    | undefined;

  const sessions = await getSessions(db, user.id, status ?? undefined);
  return NextResponse.json({ sessions });
}
