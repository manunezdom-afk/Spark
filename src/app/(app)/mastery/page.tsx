import Link from "next/link";
import { Activity } from "lucide-react";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAllMastery, getTopicsByIds } from "@/lib/spark/queries";
import { MasteryBar } from "@/components/mastery/MasteryBar";

export const dynamic = "force-dynamic";

export default async function MasteryPage() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const mastery = await getAllMastery(db, user.id);
  const topics = await getTopicsByIds(db, mastery.map((m) => m.topic_id));
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const now = Date.now();

  return (
    <div className="p-6 md:p-10 max-w-3xl">
      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Spark · Maestría
        </span>
        <h1 className="text-4xl font-semibold tracking-tight">
          Lo que sabes <span className="italic text-nova-mid">hoy.</span>
        </h1>
      </header>

      {mastery.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 gap-3 max-w-md mx-auto">
          <Activity className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.5} />
          <h2 className="text-2xl font-semibold">Todavía no entrenas nada</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cuando completes tu primera sesión, esta lista mostrará el avance por tema.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-white/[0.06]">
          {mastery.map((m) => {
            const topic = topicById.get(m.topic_id);
            if (!topic) return null;
            const dueIn = new Date(m.next_review_at).getTime() - now;
            const days = Math.ceil(dueIn / (1000 * 60 * 60 * 24));
            const dueLabel =
              days <= 0
                ? "Hoy"
                : days === 1
                ? "Mañana"
                : `En ${days} días`;
            return (
              <li key={m.id}>
                <Link
                  href={`/topics/${topic.id}`}
                  className="flex flex-col gap-2 py-4 hover:bg-white/[0.02] -mx-3 px-3 rounded-md transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      {topic.category && (
                        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
                          {topic.category}
                        </div>
                      )}
                      <div className="font-medium truncate">{topic.title}</div>
                    </div>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.16em] shrink-0 ${
                        days <= 0 ? "text-spark" : "text-muted-foreground"
                      }`}
                    >
                      {dueLabel}
                    </span>
                  </div>
                  <MasteryBar score={m.mastery_score} />
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span>{m.total_sessions} sesiones</span>
                    <span>·</span>
                    <span>{m.total_errors} errores</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
