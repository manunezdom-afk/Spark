import type { SupabaseClient } from "@supabase/supabase-js";

type KairosBlock = {
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

type KairosExtraction = {
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

  const sessionSet = new Set(sourceNoteIds);

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
