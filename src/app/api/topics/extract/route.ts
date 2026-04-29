import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { checkAndIncrementRateLimit } from "@/lib/spark/queries";

const EXTRACTOR_PROMPT = `Eres un extractor de conceptos atómicos para una herramienta de aprendizaje activo.

Recibes un texto en cualquier idioma. Tu tarea es identificar los conceptos atómicos más relevantes —no más de 10— que un estudiante debería poder explicar sin mirar el material.

Para cada concepto devuelve:
- title: nombre corto del concepto (3-7 palabras, sin punto final)
- summary: explicación de 1-2 oraciones, en español neutro con "tú", sin reformular literalmente el texto
- category: una categoría general ("Historia", "Marketing", "Programación", "Cálculo"…)
- tags: 2-4 etiquetas en minúscula, sin tildes ni espacios, separadas por palabra-individual

Reglas:
- No incluyas conceptos triviales o demasiado generales.
- No inventes información que no está en el texto.
- No agregues explicación fuera del JSON.

Responde EXCLUSIVAMENTE con un bloque JSON con esta forma:

\`\`\`json
{
  "topics": [
    { "title": "...", "summary": "...", "category": "...", "tags": ["...","..."] }
  ]
}
\`\`\``;

type ExtractedTopic = {
  title: string;
  summary: string;
  category: string;
  tags: string[];
};

export async function POST(request: NextRequest) {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { text } = (await request.json()) as { text?: string };
  if (!text || text.trim().length < 50) {
    return NextResponse.json({ error: "Necesito al menos 50 caracteres de contexto." }, { status: 400 });
  }

  const rate = await checkAndIncrementRateLimit(db, user.id);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Límite diario de IA alcanzado." }, { status: 429 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: EXTRACTOR_PROMPT,
      messages: [{ role: "user", content: text }],
    });

    const block = response.content.find((c) => c.type === "text");
    const raw = block && block.type === "text" ? block.text : "";
    const match = raw.match(/```json\n([\s\S]*?)\n```/);
    if (!match) {
      return NextResponse.json({ error: "El modelo no devolvió un JSON válido. Intenta con texto distinto." }, { status: 502 });
    }

    const parsed = JSON.parse(match[1]) as { topics?: ExtractedTopic[] };
    if (!parsed.topics?.length) {
      return NextResponse.json({ error: "No encontré conceptos en el texto." }, { status: 422 });
    }

    return NextResponse.json({ topics: parsed.topics.slice(0, 10) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error en el extractor" },
      { status: 502 }
    );
  }
}
