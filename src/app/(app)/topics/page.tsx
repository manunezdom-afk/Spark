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
          <h1 className="font-serif text-4xl tracking-tight mt-2">
            Tu biblioteca <span className="italic text-nova-mid">de combate</span>
          </h1>
        </div>
        <NewTopicDialog />
      </header>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 gap-3 max-w-md mx-auto">
          <BookMarked className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="font-serif text-2xl">Aún no has creado ningún tema</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Pega un texto y deja que Spark extraiga los conceptos atómicos, o créalos manualmente uno por uno.
          </p>
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
