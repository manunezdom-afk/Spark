import type { SupabaseClient } from "@supabase/supabase-js";

export async function seedDemoData(db: SupabaseClient, userId: string) {
  // Topic 1: Marketing Digital
  const { data: t1 } = await db
    .from("spark_topics")
    .insert({
      user_id: userId,
      title: "Marketing Digital y Redes Sociales",
      summary: "Estrategias de presencia digital, gestión de comunidades y métricas de engagement en plataformas sociales.",
      category: "Marketing",
      tags: ["redes-sociales", "estrategia", "contenido", "métricas"],
      is_demo: true,
      source_note_ids: [],
    })
    .select("id")
    .single();

  // Topic 2: Comportamiento del Consumidor
  const { data: t2 } = await db
    .from("spark_topics")
    .insert({
      user_id: userId,
      title: "Comportamiento del Consumidor",
      summary: "Factores psicológicos, sociales y culturales que influyen en las decisiones de compra.",
      category: "Marketing",
      tags: ["psicología", "decisión-de-compra", "segmentación", "motivación"],
      is_demo: true,
      source_note_ids: [],
    })
    .select("id")
    .single();

  if (!t1 || !t2) return;

  // Demo mastery states
  await db.from("spark_mastery_states").insert([
    {
      user_id: userId,
      topic_id: t1.id,
      mastery_score: 42,
      ease_factor: 2.36,
      interval_days: 3,
      repetitions: 2,
      total_sessions: 2,
      total_errors: 3,
      next_review_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    },
    {
      user_id: userId,
      topic_id: t2.id,
      mastery_score: 0,
      ease_factor: 2.50,
      interval_days: 1,
      repetitions: 0,
      total_sessions: 0,
      total_errors: 0,
      next_review_at: new Date().toISOString(),
    },
  ]);

  // Demo completed session for Topic 1
  const { data: session } = await db
    .from("spark_learning_sessions")
    .insert({
      user_id: userId,
      topic_ids: [t1.id],
      engine: "socratic",
      status: "completed",
      score: 42,
      is_demo: true,
      feedback: "Buen punto de partida. Captaste la diferencia entre búsqueda de intención y descubrimiento pasivo. Área a reforzar: métricas específicas de engagement por plataforma.",
      started_at: new Date(Date.now() - 25 * 60000).toISOString(),
      ended_at: new Date(Date.now() - 5 * 60000).toISOString(),
    })
    .select("id")
    .single();

  if (!session) return;

  // Pre-written demo turns
  await db.from("spark_session_turns").insert([
    {
      session_id: session.id,
      role: "assistant",
      content: `Si tuvieras que explicarle a alguien que nunca usó redes sociales por qué una empresa necesita presencia digital, ¿qué le dirías **sin usar la palabra "marketing"**?`,
      payload: {
        type: "quiz",
        question: "Explica la necesidad de presencia digital sin usar jerga de marketing",
        expected_concepts: ["alcance", "visibilidad", "clientes potenciales", "comunicación directa"],
        difficulty: "medium",
      },
      turn_index: 0,
    },
    {
      session_id: session.id,
      role: "user",
      content: "Diría que hoy si alguien quiere encontrar un restaurante, lo primero que hace es buscarlo en Instagram o Google. Si no está ahí, para muchos es como si no existiera.",
      payload: null,
      turn_index: 1,
    },
    {
      session_id: session.id,
      role: "assistant",
      content: `Exactamente — capturaste el principio de **visibilidad digital**. Pero quiero profundizar: mencionaste Instagram y Google como si fueran equivalentes. ¿Qué diferencia fundamental hay en la *intención del usuario* entre ambas plataformas?`,
      payload: null,
      turn_index: 2,
    },
    {
      session_id: session.id,
      role: "user",
      content: "En Google buscas algo específico que ya quieres. En Instagram te lo encuentras aunque no lo estabas buscando.",
      payload: null,
      turn_index: 3,
    },
    {
      session_id: session.id,
      role: "assistant",
      content: `Perfecto — acabas de describir la diferencia entre **búsqueda con intención** vs **descubrimiento pasivo**. Eso es fundamental para entender por qué se usan estrategias completamente distintas en cada canal.`,
      payload: {
        type: "flashcard",
        cards: [
          {
            front: "¿Qué es el marketing de intención?",
            back: "Estrategia que captura usuarios que ya buscan activamente un producto o servicio (ej. Google Ads, SEO).",
            hint: "Piensa en qué hace el usuario antes de ver el anuncio",
          },
          {
            front: "¿Qué es el marketing de descubrimiento?",
            back: "Estrategia que interrumpe el flujo del usuario para presentarle algo que no buscaba pero podría querer (ej. Instagram, TikTok Ads).",
            hint: "Piensa en cómo funciona el scroll",
          },
        ],
      },
      turn_index: 4,
    },
  ]);
}

export async function clearDemoData(db: SupabaseClient, userId: string) {
  // Sessions cascade-delete their turns via FK
  await db
    .from("spark_learning_sessions")
    .delete()
    .eq("user_id", userId)
    .eq("is_demo", true);

  // Mastery states for demo topics will cascade when topics are deleted
  const { data: demoTopics } = await db
    .from("spark_topics")
    .select("id")
    .eq("user_id", userId)
    .eq("is_demo", true);

  if (demoTopics?.length) {
    const ids = demoTopics.map((t) => t.id);
    await db.from("spark_mastery_states").delete().eq("user_id", userId).in("topic_id", ids);
    await db.from("spark_topics").delete().eq("user_id", userId).eq("is_demo", true);
  }
}
