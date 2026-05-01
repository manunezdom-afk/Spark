import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getErrorPatterns, getTopicsByIds } from "@/lib/spark/queries";
import { Badge } from "@/components/ui/badge";
import { GradientText } from "@/components/brand/GradientText";
import Link from "next/link";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

const ERROR_LABELS: Record<string, string> = {
  conceptual: "Conceptual",
  causal: "Causal",
  factual: "Factual",
  application: "Aplicación",
  omission: "Omisión",
};

// ── Demo error patterns ────────────────────────────────────────────────────
const DEMO_ERRORS = [
  {
    id: "demo-1",
    type: "conceptual",
    description:
      "Confundes búsqueda con intención con descubrimiento pasivo: son estrategias distintas para estados mentales distintos del usuario.",
    topic: "Marketing Digital y Redes Sociales",
    example: "Respuesta: 'Google e Instagram sirven para lo mismo'.",
    frequency: 2,
  },
  {
    id: "demo-2",
    type: "factual",
    description:
      "No recuerdas cuál factor del SM-2 controla el intervalo entre repasos: es el ease_factor (facilidad percibida).",
    topic: "Comportamiento del Consumidor",
    example: null,
    frequency: 1,
  },
  {
    id: "demo-3",
    type: "omission",
    description:
      "Describes el proceso de decisión de compra pero omites la fase de evaluación post-compra (disonancia cognitiva).",
    topic: "Comportamiento del Consumidor",
    example: "Correcto: reconocimiento → búsqueda → evaluación → compra → post-compra.",
    frequency: 3,
  },
];

export default async function ErrorsPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const errors = await getErrorPatterns(db, user.id);
  const topicIds = Array.from(
    new Set(errors.map((e) => e.topic_id).filter((x): x is string => !!x)),
  );
  const topics = topicIds.length ? await getTopicsByIds(db, topicIds) : [];
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const isEmpty = errors.length === 0;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-10 animate-fade-up">
      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Spark · Errores
        </span>
        <h1 className="text-display-md md:text-display-lg text-foreground">
          Patrones{" "}
          <GradientText italic className="font-light">
            que se repiten.
          </GradientText>
        </h1>
      </header>

      {isEmpty ? (
        <>
          {/* Demo banner */}
          <div className="flex flex-col gap-3 rounded-xl border border-black/[0.07] bg-white/60 px-4 py-3 mb-6 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-spark/20 bg-spark/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-spark">
              <FlaskConical className="h-3 w-3" strokeWidth={1.5} />
              Ejemplos
            </span>
            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              Spark detecta errores recurrentes en tus sesiones y los agrupa
              aquí. Estos son ejemplos de cómo se verán.
            </p>
            <Link
              href="/topics"
              className="shrink-0 rounded-lg border border-black/[0.08] bg-white/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-black/[0.14] hover:text-foreground"
            >
              Ir a Temas →
            </Link>
          </div>

          {/* Demo error rows */}
          <ul className="flex flex-col gap-3">
            {DEMO_ERRORS.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-4 p-4 rounded-2xl border border-black/[0.07] bg-white/50"
              >
                <Badge variant="warning">
                  {ERROR_LABELS[e.type] ?? e.type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90">{e.description}</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    Tema: {e.topic}
                  </div>
                  {e.example && (
                    <div className="text-xs italic text-muted-foreground mt-2">
                      {e.example}
                    </div>
                  )}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-1">
                  {e.frequency}×
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {errors.map((e) => {
            const topic = e.topic_id ? topicById.get(e.topic_id) : null;
            return (
              <li
                key={e.id}
                className="flex items-start gap-4 p-4 rounded-2xl border border-black/[0.07] bg-white/60"
              >
                <Badge variant="warning">
                  {ERROR_LABELS[e.error_type] ?? e.error_type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground/90">{e.description}</p>
                  {topic && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Tema: {topic.title}
                    </div>
                  )}
                  {e.example && (
                    <div className="text-xs italic text-muted-foreground mt-2">
                      Ejemplo: {e.example}
                    </div>
                  )}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-1">
                  {e.frequency}×
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
