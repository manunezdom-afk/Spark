import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, History } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessions, getTopicsByIds } from "@/lib/spark/queries";
import { Button } from "@/components/ui/button";
import { SessionsList } from "@/components/sessions/SessionsList";
import { PageHeader } from "@/components/layout/PageHeader";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const sessions = await getSessions(db, user.id);

  const allTopicIds = Array.from(
    new Set(sessions.flatMap((s) => s.topic_ids)),
  );
  const topics = allTopicIds.length
    ? await getTopicsByIds(db, allTopicIds)
    : [];
  const topicById = new Map(topics.map((t) => [t.id, t]));

  const active = sessions.filter((s) => s.status === "active");
  const completed = sessions.filter((s) => s.status === "completed");
  const abandoned = sessions.filter((s) => s.status === "abandoned");

  return (
    <div className="p-6 md:p-12 max-w-3xl animate-fade-up">
      <PageHeader title="Sesiones" description="Tu historial de entrenamiento." />

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center text-center py-20 gap-6 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-spark-soft border border-spark/22 flex items-center justify-center">
            <History className="w-6 h-6 text-spark" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-xl font-medium tracking-tight mb-2 text-ink">
              Aún no tienes sesiones
            </h2>
            <p className="text-[13.5px] text-ink-secondary leading-relaxed">
              Elige un tema y un método para empezar tu primera sesión de entrenamiento.
            </p>
          </div>
          <Button asChild variant="spark" className="rounded-full gap-2 shadow-soft">
            <Link href="/dashboard">
              Volver al inicio
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Link>
          </Button>
        </div>
      ) : (
        <SessionsList
          active={active}
          completed={completed}
          abandoned={abandoned}
          topicById={topicById}
        />
      )}
    </div>
  );
}
