import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clock, History, PlayCircle } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSessions, getTopicsByIds } from "@/lib/spark/queries";
import { Button } from "@/components/ui/button";
import { GradientText } from "@/components/brand/GradientText";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import type {
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

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
            <History
              className="w-6 h-6 text-spark"
              strokeWidth={1.5}
            />
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
        <div className="flex flex-col gap-10">
          {active.length > 0 && (
            <Group
              icon={<PlayCircle className="w-3.5 h-3.5" strokeWidth={1.75} />}
              title="Abiertas"
              tone="spark"
            >
              {active.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  topics={s.topic_ids
                    .map((id) => topicById.get(id))
                    .filter((t): t is SparkTopic => !!t)}
                />
              ))}
            </Group>
          )}

          {completed.length > 0 && (
            <Group
              icon={<Clock className="w-3.5 h-3.5" strokeWidth={1.75} />}
              title="Completadas"
              tone="muted"
            >
              {completed.slice(0, 25).map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  topics={s.topic_ids
                    .map((id) => topicById.get(id))
                    .filter((t): t is SparkTopic => !!t)}
                />
              ))}
            </Group>
          )}

          {abandoned.length > 0 && (
            <Group
              icon={<Clock className="w-3.5 h-3.5" strokeWidth={1.75} />}
              title="Abandonadas"
              tone="muted"
            >
              {abandoned.slice(0, 10).map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  topics={s.topic_ids
                    .map((id) => topicById.get(id))
                    .filter((t): t is SparkTopic => !!t)}
                />
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "spark" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`font-mono text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${
          tone === "spark" ? "text-spark" : "text-muted-foreground/70"
        }`}
      >
        {icon}
        {title}
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function SessionRow({
  session,
  topics,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
}) {
  const isTest =
    session.engine === "test_alternativas" ||
    session.engine === "test_desarrollo";
  const href = isTest
    ? session.status === "completed"
      ? `/tests/${session.id}/results`
      : session.status === "active"
        ? `/tests/${session.id}/take`
        : `/tests/new`
    : `/sessions/${session.id}`;

  const titles =
    topics.length > 0
      ? topics.map((t) => t.title).join(" · ")
      : "Tema borrado";

  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-black/[0.06] bg-white/60 hover:bg-white hover:border-black/[0.10] transition-colors text-sm"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0">
            {ENGINE_LABELS[session.engine]}
          </span>
          <span className="text-sm font-medium text-foreground/90 truncate">
            {titles}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {new Date(session.started_at).toLocaleDateString("es", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span
            className={`text-[10px] uppercase tracking-[0.14em] font-mono ${
              session.status === "completed"
                ? "text-emerald-600"
                : session.status === "active"
                  ? "text-spark"
                  : "text-muted-foreground"
            }`}
          >
            {session.status === "completed"
              ? `${session.score ?? 0}%`
              : session.status === "active"
                ? "En curso"
                : "Abandonada"}
          </span>
        </div>
      </Link>
    </li>
  );
}
