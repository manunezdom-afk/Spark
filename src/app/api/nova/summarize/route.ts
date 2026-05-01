import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTopic,
  getMasteryStates,
  checkAndIncrementRateLimit,
} from "@/lib/spark/queries";
import { buildKairosContext } from "@/lib/spark/kairos-bridge";

interface RequestBody {
  topicId?: string;
  /** "summary" | "explain" | "weakpoints" */
  mode?: "summary" | "explain" | "weakpoints";
}

const SYSTEMS: Record<NonNullable<RequestBody["mode"]>, string> = {
  summary: `Eres Nova preparando un resumen de estudio para Spark.

Devuelve un resumen claro del tema en español neutro con "tú", sin emojis, organizado en:
1. Idea central en 1-2 oraciones.
2. 3-5 puntos clave con su matiz importante.
3. Una pregunta abierta que el usuario debería poder responder al terminar.

Sin preámbulos. Sin "claro, aquí tienes". Empieza directo.`,

  explain: `Eres Nova explicando un tema como un buen profesor para Spark.

Reglas:
- Español neutro con "tú". Sin emojis.
- Empieza con la intuición, después la mecánica, al final el matiz.
- Usa una analogía concreta (de la vida real o del contexto del usuario si lo tienes).
- Cierra con una pregunta corta para verificar comprensión.
- Máximo 4 párrafos.`,

  weakpoints: `Eres Nova diagnosticando puntos débiles para Spark.

Revisa el material y la maestría del usuario, y devuelve:
- 2 a 4 puntos donde el usuario probablemente tenga huecos (basado en el material y/o errores conocidos).
- Para cada punto, una pregunta concreta que ataque ese hueco.
- Cierra con qué método de Spark conviene usar (Preguntas guiadas / Cazar errores / Defender postura / Conectar temas / Caso real / Prueba de alternativas / Prueba de desarrollo).

Español neutro con "tú". Sin emojis. Sin enumeración numerada larga.`,
};

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

  const mode = body.mode ?? "summary";
  if (!body.topicId) {
    return NextResponse.json({ error: "topicId requerido." }, { status: 400 });
  }

  const rate = await checkAndIncrementRateLimit(db, user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Llegaste al límite diario de IA." },
      { status: 429 },
    );
  }

  const topic = await getTopic(db, body.topicId);
  if (!topic || topic.user_id !== user.id) {
    return NextResponse.json({ error: "Tema no encontrado." }, { status: 404 });
  }

  const mastery = await getMasteryStates(db, user.id, [topic.id]);
  const m = mastery[0];

  const lines: string[] = [
    `Tema: ${topic.title}`,
    topic.summary ? `Resumen del tema: ${topic.summary}` : "",
    topic.tags.length ? `Etiquetas: ${topic.tags.join(", ")}` : "",
    m
      ? `Maestría actual: ${m.mastery_score}% — sesiones ${m.total_sessions}, errores ${m.total_errors}.`
      : "Aún no hay sesiones registradas para este tema.",
  ].filter(Boolean);

  if (topic.source_note_ids?.length) {
    const kairos = await buildKairosContext(db, user.id, topic.source_note_ids);
    if (kairos) lines.push("", kairos);
  }

  const userMessage = lines.join("\n");
  const system = SYSTEMS[mode];

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 800,
      system,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content.find((c) => c.type === "text");
    const text = block && block.type === "text" ? block.text.trim() : "";

    return NextResponse.json({ answer: text, mode });
  } catch (err) {
    console.error("[nova/summarize]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error generando respuesta." },
      { status: 502 },
    );
  }
}
