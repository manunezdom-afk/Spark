import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTopic,
  insertFlashcards,
  checkAndIncrementRateLimit,
} from "@/lib/spark/queries";
import { extractJsonPayload } from "@/lib/streaming/sse";
import { buildKairosContext } from "@/lib/spark/kairos-bridge";

interface RequestBody {
  topicId?: string;
  rawText?: string;
  count?: number;
}

const SYSTEM = `Eres Nova generando tarjetas de repaso para Spark.

Devuelve EXCLUSIVAMENTE un bloque JSON con esta forma:
\`\`\`json
{
  "cards": [
    { "front": "Pregunta corta y específica", "back": "Respuesta de 1-3 oraciones", "hint": "Pista opcional muy breve" }
  ]
}
\`\`\`

Reglas:
- Cada tarjeta evalúa UN concepto. No mezcles ideas.
- "front" es una pregunta directa, no una frase incompleta.
- "back" es la respuesta mínima suficiente para evaluar comprensión.
- "hint" es opcional. Solo úsalo si la pregunta puede confundirse con otra.
- No incluyas numeración ("Pregunta 1:") ni etiquetas.
- Español neutro con "tú".`;

export async function POST(req: Request) {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  if (!body.topicId && !body.rawText) {
    return NextResponse.json(
      { error: "Necesito un tema o un texto para generar tarjetas." },
      { status: 400 },
    );
  }

  const desired = Math.max(3, Math.min(10, body.count ?? 6));

  const rate = await checkAndIncrementRateLimit(db, user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Llegaste al límite diario de IA." },
      { status: 429 },
    );
  }

  const topic = body.topicId ? await getTopic(db, body.topicId) : null;
  if (body.topicId && (!topic || topic.user_id !== user.id)) {
    return NextResponse.json({ error: "Tema no encontrado." }, { status: 404 });
  }

  const rawText = body.rawText?.trim();
  if (rawText && rawText.length < 30) {
    return NextResponse.json(
      { error: "El texto es demasiado corto. Pega al menos un párrafo." },
      { status: 400 },
    );
  }

  const sourceParts: string[] = [];
  if (topic) {
    sourceParts.push(`Tema: ${topic.title}`);
    if (topic.summary) sourceParts.push(`Resumen: ${topic.summary}`);
    if (topic.tags.length) sourceParts.push(`Etiquetas: ${topic.tags.join(", ")}`);
    if (topic.source_note_ids?.length) {
      const kairos = await buildKairosContext(db, user.id, topic.source_note_ids);
      if (kairos) sourceParts.push(kairos);
    }
  }
  if (rawText) {
    sourceParts.push(`Material:\n${rawText}`);
  }

  const userPrompt = [
    `Genera exactamente ${desired} tarjetas de repaso a partir del siguiente material.`,
    "",
    sourceParts.join("\n\n"),
  ].join("\n");

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
    });

    const block = response.content.find((c) => c.type === "text");
    const raw = block && block.type === "text" ? block.text : "";
    const parsed = extractJsonPayload<{
      cards: { front: string; back: string; hint?: string }[];
    }>(raw);

    if (!parsed?.cards?.length) {
      return NextResponse.json(
        { error: "Nova no pudo generar tarjetas válidas. Intenta de nuevo." },
        { status: 502 },
      );
    }

    const trimmed = parsed.cards
      .filter((c) => c.front?.trim() && c.back?.trim())
      .slice(0, desired)
      .map((c) => ({
        front: c.front.trim(),
        back: c.back.trim(),
        hint: c.hint?.trim() || null,
      }));

    if (!trimmed.length) {
      return NextResponse.json(
        { error: "Las tarjetas generadas estaban vacías. Intenta de nuevo." },
        { status: 502 },
      );
    }

    await insertFlashcards(
      db,
      user.id,
      trimmed.map((c) => ({
        topic_id: topic?.id ?? null,
        session_id: null,
        front: c.front,
        back: c.back,
        hint: c.hint,
      })),
    );

    return NextResponse.json({
      created: trimmed.length,
      cards: trimmed,
    });
  } catch (err) {
    console.error("[nova/flashcards]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error generando tarjetas." },
      { status: 502 },
    );
  }
}
