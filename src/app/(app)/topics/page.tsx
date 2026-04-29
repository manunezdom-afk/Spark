import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTopics, getAllMastery } from "@/lib/spark/queries";
import { redirect } from "next/navigation";
import { TopicCard } from "@/components/topics/TopicCard";
import { NewTopicDialog } from "@/components/topics/NewTopicDialog";
import { AnimatedTopicsGrid } from "@/components/demo/AnimatedTopicsGrid";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const [topics, mastery] = await Promise.all([
    getTopics(db, user.id),
    getAllMastery(db, user.id),
  ]);

  const masteryByTopic = new Map(mastery.map((m) => [m.topic_id, m]));

  return (
    <div className="p-6 md:p-10 max-w-6xl">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Spark · Temas
          </span>
          <h1 className="text-4xl font-semibold tracking-tight mt-2">
            Tu biblioteca <span className="italic text-nova-mid">de combate</span>
          </h1>
        </div>
        <NewTopicDialog />
      </header>

      {topics.length === 0 ? (
        <div className="flex flex-col gap-10 max-w-sm mx-auto py-8">
          {/* Animated preview */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-px flex-1 bg-white/[0.04]" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/30 px-3">
                Así se verá tu biblioteca
              </span>
              <div className="h-px flex-1 bg-white/[0.04]" />
            </div>
            <AnimatedTopicsGrid loop />
          </div>

          {/* CTA + instructions */}
          <div className="flex flex-col items-center text-center gap-4">
            <div>
              <h2 className="text-xl font-semibold mb-2">Crea tu primera unidad de combate</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Pega un texto, importa desde Kairos o escribe el tema manualmente. Spark lo convierte en sesiones de entrenamiento.
              </p>
            </div>
            <NewTopicDialog />
            <div className="w-full text-left p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-muted-foreground">
              <div className="font-medium text-foreground mb-2 text-xs uppercase tracking-[0.14em] font-mono">Para conectar con Kairos</div>
              <ol className="list-decimal list-inside space-y-1.5 text-xs">
                <li>Click en <span className="text-foreground font-medium">Nuevo tema</span> arriba a la derecha</li>
                <li>Selecciona la pestaña <span className="text-nova-mid font-medium">Desde Kairos</span></li>
                <li>Elige tus materias y haz click en Importar</li>
              </ol>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} mastery={masteryByTopic.get(t.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
