import type { SupabaseClient } from "@supabase/supabase-js";

export type KairosBlock = {
  id: string;
  sessionId: string;
  type: string;
  order: number;
  title?: string;
  body?: string;
  question?: string;
  answer?: string;
  expression?: string;
  content?: string;
};

export type KairosExtraction = {
  id: string;
  sessionId: string;
  kind: string;
  title: string;
  body: string;
  reviewState: string;
};

export type KairosSession = {
  id: string;
  subjectId: string;
  parentSessionId?: string;
  title: string;
  date?: string;
};

export type KairosSubject = {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  professor?: string;
  term?: string;
  archived?: boolean;
  demo?: boolean;
};

export type KairosSnapshot = {
  subjects?: KairosSubject[];
  sessions?: KairosSession[];
  blocks?: KairosBlock[];
  extractions?: KairosExtraction[];
};

export async function getKairosSnapshot(
  db: SupabaseClient,
  userId: string,
): Promise<KairosSnapshot | null> {
  const { data, error } = await db
    .from("kairos_snapshots")
    .select("data")
    .eq("user_id", userId)
    .single();

  if (error || !data?.data) return null;

  // Kairos sube el envelope crudo de zustand-persist `{ state, version }`,
  // así que el state real puede estar en `.state` o (legacy) en la raíz.
  const envelope = data.data as { state?: unknown } | KairosSnapshot;
  const inner =
    envelope && typeof envelope === "object" && "state" in envelope && envelope.state
      ? (envelope.state as KairosSnapshot)
      : (envelope as KairosSnapshot);

  return inner ?? null;
}

const USEFUL_BLOCK_TYPES = new Set([
  "concepto", "definicion", "importante", "resumen", "ejemplo", "formula",
]);

const USEFUL_EXTRACTION_KINDS = new Set(["concept", "summary"]);

export async function buildKairosContext(
  db: SupabaseClient,
  userId: string,
  sourceNoteIds: string[]
): Promise<string | null> {
  if (!sourceNoteIds.length) return null;

  const snapshot = await getKairosSnapshot(db, userId);
  if (!snapshot) return null;

  const sessionSet = new Set(expandKairosDescendants(snapshot, sourceNoteIds));

  const sessions: KairosSession[] = (snapshot.sessions ?? []).filter(
    (s: KairosSession) => sessionSet.has(s.id)
  );
  if (!sessions.length) return null;

  const blocks: KairosBlock[] = (snapshot.blocks ?? [])
    .filter((b: KairosBlock) => sessionSet.has(b.sessionId) && USEFUL_BLOCK_TYPES.has(b.type))
    .sort((a: KairosBlock, b: KairosBlock) => a.order - b.order);

  const extractions: KairosExtraction[] = (snapshot.extractions ?? []).filter(
    (e: KairosExtraction) =>
      sessionSet.has(e.sessionId) &&
      USEFUL_EXTRACTION_KINDS.has(e.kind) &&
      e.reviewState !== "rejected"
  );

  const lines: string[] = [
    "## Notas de Kairos del estudiante",
    "",
    "El estudiante tiene las siguientes notas de clase sobre este tema. Úsalas como contexto real para hacer el entrenamiento más preciso y relevante:",
    "",
  ];

  for (const session of sessions) {
    const sessionBlocks = blocks.filter((b) => b.sessionId === session.id);
    const sessionExtractions = extractions.filter((e) => e.sessionId === session.id);

    if (!sessionBlocks.length && !sessionExtractions.length) continue;

    lines.push(`### ${session.title}${session.date ? ` (${session.date})` : ""}`);

    for (const block of sessionBlocks) {
      switch (block.type) {
        case "concepto":
          lines.push(`- **Concepto — ${block.title ?? ""}**: ${block.body ?? ""}`);
          break;
        case "definicion":
          lines.push(`- **Definición — ${block.title ?? ""}**: ${block.body ?? ""}`);
          break;
        case "importante":
          lines.push(`- **Importante**: ${block.body ?? block.content ?? ""}`);
          break;
        case "resumen":
          lines.push(`- **Resumen**: ${block.body ?? block.content ?? ""}`);
          break;
        case "ejemplo":
          lines.push(`- **Ejemplo — ${block.title ?? ""}**: ${block.body ?? ""}`);
          break;
        case "formula":
          lines.push(`- **Fórmula — ${block.title ?? ""}**: ${block.expression ?? ""}`);
          break;
      }
    }

    for (const ext of sessionExtractions) {
      lines.push(`- **${ext.kind === "concept" ? "Concepto (IA)" : "Resumen (IA)"}**: ${ext.title} — ${ext.body}`);
    }

    lines.push("");
  }

  if (lines.length <= 5) return null;
  return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────
// Material picker support
//
// `topic.source_note_ids` stores top-level Kairos sessions for that
// topic. Each of those can have sub-pages (`parentSessionId`). The
// picker on /sessions/new wants the **flat list** of every apunte
// the user could pick — roots and descendants — annotated with how
// many useful blocks each has, so the UI can show "Apunte: Renacimiento
// (8 conceptos)" etc.
// ─────────────────────────────────────────────────────────────

import type { TopicMaterial } from "@/modules/spark/types";

/**
 * Resolve the full set of Kairos session IDs reachable from a list of
 * roots. Walks the snapshot's `parentSessionId` graph so that selecting
 * "Apunte: Renacimiento" automatically includes its sub-pages.
 *
 * Used both by the materials endpoint (UI) and by the message handler
 * (so when a parent is in `selected_note_ids` its children are studied
 * too without forcing the user to tick every box).
 */
export function expandKairosDescendants(
  snapshot: KairosSnapshot,
  rootIds: string[],
): string[] {
  if (!rootIds.length || !snapshot.sessions?.length) return rootIds;

  const childrenByParent = new Map<string, string[]>();
  for (const s of snapshot.sessions) {
    if (s.parentSessionId) {
      const list = childrenByParent.get(s.parentSessionId) ?? [];
      list.push(s.id);
      childrenByParent.set(s.parentSessionId, list);
    }
  }

  const visited = new Set<string>();
  const stack = [...rootIds];
  while (stack.length) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const kids = childrenByParent.get(id);
    if (kids) stack.push(...kids);
  }
  return Array.from(visited);
}

/**
 * Build the flat material list for a topic. Each entry is a Kairos
 * session (root or sub-page) belonging to that topic, annotated with
 * useful counters and parent reference. Order follows the natural
 * Kairos order (roots first, then their children grouped).
 */
export async function getTopicMaterials(
  db: SupabaseClient,
  userId: string,
  topicSourceNoteIds: string[],
): Promise<TopicMaterial[]> {
  if (!topicSourceNoteIds.length) return [];
  const snapshot = await getKairosSnapshot(db, userId);
  if (!snapshot?.sessions?.length) return [];

  const allIds = new Set(
    expandKairosDescendants(snapshot, topicSourceNoteIds),
  );

  const sessionsById = new Map<string, KairosSession>();
  for (const s of snapshot.sessions) sessionsById.set(s.id, s);

  const blocksBySession = new Map<string, number>();
  for (const b of snapshot.blocks ?? []) {
    if (USEFUL_BLOCK_TYPES.has(b.type)) {
      blocksBySession.set(b.sessionId, (blocksBySession.get(b.sessionId) ?? 0) + 1);
    }
  }

  const extractionsBySession = new Map<string, number>();
  for (const e of snapshot.extractions ?? []) {
    if (USEFUL_EXTRACTION_KINDS.has(e.kind) && e.reviewState !== "rejected") {
      extractionsBySession.set(
        e.sessionId,
        (extractionsBySession.get(e.sessionId) ?? 0) + 1,
      );
    }
  }

  const childCount = new Map<string, number>();
  for (const s of snapshot.sessions) {
    if (s.parentSessionId && allIds.has(s.parentSessionId)) {
      childCount.set(s.parentSessionId, (childCount.get(s.parentSessionId) ?? 0) + 1);
    }
  }

  // Stable ordering: roots first (natural snapshot order), then for
  // each root its descendants in DFS order. This matches how the user
  // sees them in Kairos.
  const visited = new Set<string>();
  const ordered: KairosSession[] = [];
  const childrenByParent = new Map<string, KairosSession[]>();
  for (const s of snapshot.sessions) {
    if (s.parentSessionId) {
      const list = childrenByParent.get(s.parentSessionId) ?? [];
      list.push(s);
      childrenByParent.set(s.parentSessionId, list);
    }
  }

  function pushDfs(s: KairosSession) {
    if (visited.has(s.id) || !allIds.has(s.id)) return;
    visited.add(s.id);
    ordered.push(s);
    const kids = childrenByParent.get(s.id) ?? [];
    for (const k of kids) pushDfs(k);
  }

  // Start with the explicit topic roots in declared order
  for (const rootId of topicSourceNoteIds) {
    const s = sessionsById.get(rootId);
    if (s) pushDfs(s);
  }
  // Catch any other reachable sessions that weren't roots
  for (const s of snapshot.sessions) {
    if (allIds.has(s.id)) pushDfs(s);
  }

  return ordered.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.date ?? null,
    parent_id: s.parentSessionId ?? null,
    block_count: blocksBySession.get(s.id) ?? 0,
    extraction_count: extractionsBySession.get(s.id) ?? 0,
    has_children: (childCount.get(s.id) ?? 0) > 0,
  }));
}
