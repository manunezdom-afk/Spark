import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getUserContext,
  getTopics,
  getTopic,
  getAllMastery,
  getDueFlashcardsCount,
  getDueMasteryCount,
  getDaysToNearestDeadline,
  getErrorPatterns,
  getSessions,
  checkAndIncrementRateLimit,
} from "@/lib/spark/queries";
import { buildKairosContext } from "@/lib/spark/kairos-bridge";

const SYSTEM = `Eres Nova, la asistente de IA del ecosistema Focus OS.

Dentro de Spark (la app de aprendizaje activo del ecosistema) actúas como coach de estudio. Tu trabajo no es resumir clases sino ayudar al usuario a estudiar mejor: recomendarle qué método usar, qué tema reforzar, cómo abordar un repaso, o resolverle dudas concretas sobre su material.

Reglas estrictas de tono y forma:
- Español neutro con "tú". Nunca uses voseo ("vos", "tenés", "querés").
- Sin emojis.
- Respuestas cortas y accionables: máximo 3-4 párrafos cortos o una lista de pasos.
- Tono directo y motivador, no paternalista.
- No inventes datos. Si te falta contexto, dilo en una línea y propón el siguiente paso.

Capacidades de Spark que puedes recomendar al usuario:
- Métodos de estudio (chat con coach): Preguntas guiadas (Socrático), Cazar errores (Debugger), Defender postura (Devil's advocate), Conectar temas (Bridge builder), Caso real (Roleplay).
- Pruebas simuladas: alternativas (corrección automática) y desarrollo (evaluadas por IA).
- Repaso espaciado: tarjetas SM-2 que reaparecen según qué tan bien las dominas.
- Mastery tracking: barra de dominio por tema, calculada con SM-2.

Cuando recomiendes un método, escribe el nombre exactamente como aparece arriba para que el usuario lo encuentre en la app.`;

interface AskBody {
  question?: string;
  surface?: "dashboard" | "topic" | "session" | "mastery" | "review" | "test";
  scopeLabel?: string;
  topicId?: string;
}

export async function POST(req: Request) {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Inicia sesión para hablar con Nova." }, { status: 401 });
  }

  let body: AskBody;
  try {
    body = (await req.json()) as AskBody;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "La pregunta es requerida." }, { status: 400 });
  }

  const rate = await checkAndIncrementRateLimit(db, user.id);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Llegaste al límite diario de IA. Vuelve mañana." },
      { status: 429 },
    );
  }

  let contextBlock = "";
  let kairosBlock: string | null = null;

  try {
    const [
      userCtx,
      topics,
      mastery,
      dueFlashcards,
      dueMastery,
      daysToDeadline,
      sessions,
    ] = await Promise.all([
      getUserContext(db, user.id),
      getTopics(db, user.id),
      getAllMastery(db, user.id),
      getDueFlashcardsCount(db, user.id),
      getDueMasteryCount(db, user.id),
      getDaysToNearestDeadline(db, user.id),
      getSessions(db, user.id, "active"),
    ]);

    const masteryByTopic = new Map(mastery.map((m) => [m.topic_id, m]));
    const realTopics = topics.filter((t) => !t.is_demo);

    const lines: string[] = ["## Contexto actual del usuario"];

    if (userCtx?.career || userCtx?.user_role) {
      lines.push(
        `- Carrera/Rol: ${userCtx.career ?? "—"}${userCtx.user_role ? ` · ${userCtx.user_role}` : ""}`,
      );
    }
    if (userCtx?.learning_style) {
      lines.push(`- Estilo de aprendizaje: ${userCtx.learning_style}`);
    }
    if (userCtx?.active_projects?.length) {
      const top = userCtx.active_projects.slice(0, 3);
      lines.push(
        `- Proyectos activos: ${top.map((p) => `${p.name}${p.deadline ? ` (deadline ${p.deadline})` : ""}`).join("; ")}`,
      );
    }
    if (daysToDeadline !== null) {
      lines.push(`- Próximo evento crítico (Focus): en ${daysToDeadline} día(s).`);
    }

    lines.push(`- Tarjetas pendientes hoy: ${dueFlashcards}`);
    lines.push(`- Temas que toca repasar: ${dueMastery}`);
    lines.push(`- Sesiones abiertas sin terminar: ${sessions.length}`);

    if (realTopics.length === 0) {
      lines.push(
        "- El usuario aún no tiene temas reales (sólo ejemplos demo). Recomiéndale crear o importar temas en la sección Temas.",
      );
    } else {
      lines.push(
        `- Temas guardados (${realTopics.length}): ${realTopics
          .slice(0, 8)
          .map((t) => {
            const m = masteryByTopic.get(t.id);
            const score = m ? `${m.mastery_score}%` : "sin sesiones";
            return `${t.title} [${score}]`;
          })
          .join("; ")}`,
      );
    }

    // Topic-scoped context
    if (body.topicId) {
      const topic = await getTopic(db, body.topicId);
      if (topic && topic.user_id === user.id) {
        lines.push("", "## Tema activo en pantalla");
        lines.push(`- Título: ${topic.title}`);
        if (topic.summary) lines.push(`- Resumen: ${topic.summary}`);
        if (topic.tags.length) lines.push(`- Etiquetas: ${topic.tags.join(", ")}`);
        const m = masteryByTopic.get(topic.id);
        if (m) {
          lines.push(
            `- Maestría actual: ${m.mastery_score}% (sesiones: ${m.total_sessions}, errores: ${m.total_errors})`,
          );
        } else {
          lines.push("- Sin sesiones todavía.");
        }
        const errors = await getErrorPatterns(db, user.id, [topic.id]);
        if (errors.length > 0) {
          lines.push(
            `- Errores recurrentes (${errors.length}): ${errors
              .slice(0, 3)
              .map((e) => `[${e.error_type}] ${e.description.slice(0, 80)}`)
              .join("; ")}`,
          );
        }

        // Inject Kairos context if topic is linked
        if (topic.source_note_ids?.length) {
          kairosBlock = await buildKairosContext(
            db,
            user.id,
            topic.source_note_ids,
          );
        }
      }
    }

    contextBlock = lines.join("\n");
  } catch (err) {
    console.error("[nova/ask] error gathering context", err);
    contextBlock = "## Contexto actual del usuario\n- (no disponible en este momento)";
  }

  const surfaceHint = body.scopeLabel
    ? `El usuario está mirando: ${body.scopeLabel}.`
    : "";

  const userMessage = [
    contextBlock,
    kairosBlock ? `\n${kairosBlock}` : "",
    "",
    surfaceHint,
    "",
    `Pregunta del usuario:\n${question}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: "user", content: userMessage }],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    return NextResponse.json({ answer: text.trim() });
  } catch (err) {
    console.error("[nova/ask]", err);
    const message =
      err instanceof Error ? err.message : "No pude conectar con el modelo.";
    if (/api[_ ]?key|ANTHROPIC_API_KEY/i.test(message)) {
      return NextResponse.json(
        {
          error:
            "Falta la variable ANTHROPIC_API_KEY en el servidor. Revisa tu .env.local.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: "Nova no pudo responder. Intenta de nuevo en unos segundos." },
      { status: 500 },
    );
  }
}
