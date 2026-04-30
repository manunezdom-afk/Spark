import { BookMarked } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTopics, getAllMastery } from "@/lib/spark/queries";
import { redirect } from "next/navigation";
import { TopicCard } from "@/components/topics/TopicCard";
import { NewTopicDialog } from "@/components/topics/NewTopicDialog";
import { ClearDemoBanner } from "@/components/topics/ClearDemoBanner";
import { GradientText } from "@/components/brand/GradientText";
import { seedDemoData } from "@/lib/spark/seed-demo";

export const dynamic = "force-dynamic";

export default async function TopicsPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const [initialTopics, mastery] = await Promise.all([
    getTopics(db, user.id),
    getAllMastery(db, user.id),
  ]);
  let topics = initialTopics;

  // Auto-seed demo examples for new / empty users
  if (topics.length === 0) {
    await seedDemoData(db, user.id).catch(() => {});
    topics = await getTopics(db, user.id);
  }

  const masteryByTopic = new Map(mastery.map((m) => [m.topic_id, m]));

  // Banner visible only while there are demo topics but no real ones
  const hasDemo = topics.some((t) => t.is_demo);
  const hasReal = topics.some((t) => !t.is_demo);
  const showDemoBanner = hasDemo && !hasReal;

  return (
    <div className="p-6 md:p-12 max-w-6xl animate-fade-up">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Spark · Temas
          </span>
          <h1 className="text-display-md md:text-display-lg text-foreground">
            <span className="font-light">Tu biblioteca</span>{" "}
            <GradientText italic className="font-light">
              de combate
            </GradientText>
          </h1>
        </div>
        <NewTopicDialog />
      </header>

      {showDemoBanner && <ClearDemoBanner />}

      {topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t, i) => (
            <div
              key={t.id}
              style={{
                animation: `fade-up 360ms ${i * 50}ms cubic-bezier(0.34, 1.4, 0.64, 1) both`,
              }}
            >
              <TopicCard topic={t} mastery={masteryByTopic.get(t.id)} />
            </div>
          ))}
        </div>
      ) : (
        /* Fallback si el seed falla */
        <div className="flex flex-col items-center text-center py-16 gap-5 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-spark/10 border border-spark/20 flex items-center justify-center">
            <BookMarked className="w-6 h-6 text-spark" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-light tracking-tight mb-2">
              Aún no tienes <GradientText italic>temas</GradientText>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Crea un tema manualmente o importa tus materias desde Kairos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
