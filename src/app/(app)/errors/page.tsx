import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getErrorPatterns, getTopicsByIds } from "@/lib/spark/queries";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ERROR_LABELS: Record<string, string> = {
  conceptual: "Conceptual",
  causal: "Causal",
  factual: "Factual",
  application: "Aplicación",
  omission: "Omisión",
};

export default async function ErrorsPage() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const errors = await getErrorPatterns(db, user.id);
  const topicIds = Array.from(new Set(errors.map((e) => e.topic_id).filter((x): x is string => !!x)));
  const topics = topicIds.length ? await getTopicsByIds(db, topicIds) : [];
  const topicById = new Map(topics.map((t) => [t.id, t]));

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Spark · Errores
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Patrones <span className="italic text-nova-mid">que se repiten.</span>
        </h1>
      </header>

      {errors.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 gap-3 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-2xl font-semibold">Sin patrones detectados</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cuando Spark detecte errores recurrentes, aparecerán acá agrupados por
            tipo y frecuencia.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {errors.map((e) => {
            const topic = e.topic_id ? topicById.get(e.topic_id) : null;
            return (
              <li
                key={e.id}
                className="flex items-start gap-4 p-4 rounded-md border border-white/[0.06] bg-white/[0.02]"
              >
                <Badge variant="warning">
                  {ERROR_LABELS[e.error_type] ?? e.error_type}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{e.description}</p>
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
