import { BookMarked, ArrowRight } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTopics, getAllMastery } from "@/lib/spark/queries";
import { redirect } from "next/navigation";
import { TopicCard } from "@/components/topics/TopicCard";
import { NewTopicDialog } from "@/components/topics/NewTopicDialog";
import { GradientText } from "@/components/brand/GradientText";

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
    <div className="p-6 md:p-12 max-w-6xl animate-fade-up">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-10">
        <div className="flex flex-col gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Spark · Temas
          </span>
          <h1 className="text-display-md md:text-display-lg text-foreground">
            <span className="font-light">Tu biblioteca</span>{" "}
            <GradientText italic className="font-light">de combate</GradientText>
          </h1>
        </div>
        <NewTopicDialog />
      </header>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center text-center py-12 gap-5 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-spark/10 border border-spark/20 flex items-center justify-center">
            <BookMarked className="w-6 h-6 text-spark" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-light tracking-tight mb-2">
              Aún no tienes <GradientText italic>temas</GradientText>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Importa tus materias desde Kairos o crea un tema manualmente para empezar.
            </p>
          </div>
          <div className="w-full text-left p-5 rounded-2xl border border-black/[0.07] bg-white/60 backdrop-blur-sm">
            <div className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-spark animate-brand-pulse" />
              Conectar con Kairos
            </div>
            <ol className="space-y-2 text-xs text-muted-foreground">
              <li className="flex gap-2.5"><span className="font-mono text-foreground/40">01</span><span>Click en <span className="text-foreground font-semibold">Nuevo tema</span> arriba a la derecha</span></li>
              <li className="flex gap-2.5"><span className="font-mono text-foreground/40">02</span><span>Selecciona la pestaña <GradientText className="font-semibold">Desde Kairos</GradientText></span></li>
              <li className="flex gap-2.5"><span className="font-mono text-foreground/40">03</span><span>Elige tus materias y dale a <span className="text-foreground font-semibold">Importar</span> <ArrowRight className="w-3 h-3 inline" strokeWidth={2} /></span></li>
            </ol>
          </div>
          <NewTopicDialog />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((t, i) => (
            <div key={t.id} style={{ animation: `fade-up 360ms ${i * 50}ms cubic-bezier(0.34, 1.4, 0.64, 1) both` }}>
              <TopicCard topic={t} mastery={masteryByTopic.get(t.id)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
