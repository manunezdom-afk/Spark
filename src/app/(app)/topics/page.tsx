import { BookMarked } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTopics, getAllMastery } from "@/lib/spark/queries";
import { redirect } from "next/navigation";
import { TopicCard } from "@/components/topics/TopicCard";
import { NewTopicDialog } from "@/components/topics/NewTopicDialog";

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
        <div className="flex flex-col items-center justify-center text-center py-20 gap-4 max-w-sm mx-auto">
          <BookMarked className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
          <div>
            <h2 className="text-2xl font-semibold mb-2">Aún no tienes temas</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Empieza importando tus materias desde Kairos, o crea un tema manualmente.
            </p>
          </div>
          <div className="w-full text-left p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] text-sm text-muted-foreground leading-relaxed">
            <div className="font-medium text-foreground mb-1">Para conectar con Kairos:</div>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Click en <span className="text-foreground font-medium">Nuevo tema</span> arriba a la derecha</li>
              <li>Selecciona la pestaña <span className="text-nova-mid font-medium">Desde Kairos</span></li>
              <li>Elige tus materias y haz click en Importar</li>
            </ol>
          </div>
          <NewTopicDialog />
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
