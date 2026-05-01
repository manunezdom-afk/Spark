import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM = `Eres Nova, la asistente de IA del ecosistema Focus OS. Dentro de Spark (la app de aprendizaje activo), tu rol es ser un coach de estudio conciso y útil.

Reglas:
- Responde en español neutro con "tú". Nunca voseo.
- Respuestas cortas y accionables: máximo 3-4 párrafos cortos o una lista de pasos.
- Tono: claro, motivador, no paternalista.
- No inventes datos del usuario. Si no tienes contexto específico, da consejos generales de calidad.
- Spark usa SM-2 (repaso espaciado), sesiones de estudio tipo coach-alumno, y tarjetas de repaso.`;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      question?: string;
      surface?: string;
      scopeLabel?: string;
    };

    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "question requerido" }, { status: 400 });
    }

    const contextHint = body.scopeLabel
      ? `El usuario está en: ${body.scopeLabel}.`
      : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: contextHint
            ? `${contextHint}\n\nPregunta: ${question}`
            : question,
        },
      ],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    return NextResponse.json({ answer: text });
  } catch (err) {
    console.error("[nova/ask]", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
