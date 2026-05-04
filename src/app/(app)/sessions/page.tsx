import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, History } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessions, getTopicsByIds } from "@/lib/spark/queries";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/brand/GradientText";
import { SessionsList } from "@/components/sessions/SessionsList";

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
      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Spark · Sesiones
        </span>
        <h1 className="text-display-md md:text-display-lg text-foreground">
          <span className="font-light">Tu historial</span>{" "}
          <GradientText italic className="font-light">
            de entrenamiento.
          </GradientText>
        </h1>
      </header>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center text-center py-16 gap-5 max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-spark/10 border border-spark/20 flex items-center justify-center">
            <History className="w-6 h-6 text-spark" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-light tracking-tight mb-2">
              Aún no entrenaste{" "}
              <GradientText italic>nada</GradientText>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elige un tema y un método para empezar tu primera sesión.
            </p>
          </div>
          <Button asChild variant="spark" className="rounded-full">
            <Link href="/topics">
              Ir a Temas
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
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
