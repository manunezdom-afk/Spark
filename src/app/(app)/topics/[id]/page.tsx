import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Play, AlertCircle } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTopic,
  getMasteryStates,
  getErrorPatterns,
  getSessions,
} from "@/lib/spark/queries";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from "@/modules/spark/engines";
import type { LearningEngine } from "@/modules/spark/types";

export const dynamic = "force-dynamic";

const ENGINES: LearningEngine[] = [
  "socratic",
  "debugger",
  "devils_advocate",
  "bridge_builder",
  "roleplay",
];

type RouteParams = { params: Promise<{ id: string }> };

export default async function TopicDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return notFound();

  const topic = await getTopic(db, id);
  if (!topic || topic.user_id !== user.id) return notFound();

  const [mastery, errors, allSessions] = await Promise.all([
    getMasteryStates(db, user.id, [topic.id]),
    getErrorPatterns(db, user.id, [topic.id]),
    getSessions(db, user.id),
  ]);

  const m = mastery[0];
  const sessions = allSessions.filter((s) => s.topic_ids.includes(topic.id));

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Link
        href="/topics"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        Temas
      </Link>

      <header className="flex flex-col gap-3 mb-10">
        {topic.category && (
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {topic.category}
          </span>
        )}
        <h1 className="font-serif text-4xl tracking-tight leading-tight">{topic.title}</h1>
        {topic.summary && (
          <p className="text-muted-foreground leading-relaxed">{topic.summary}</p>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            Maestría
          </div>
          <MasteryBar score={m?.mastery_score ?? 0} size="lg" />
        </div>
        <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            Sesiones
          </div>
          <div className="font-serif text-2xl">{m?.total_sessions ?? 0}</div>
        </div>
        <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-2">
            Errores acumulados
          </div>
          <div className="font-serif text-2xl">{m?.total_errors ?? 0}</div>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
          Empezar entrenamiento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ENGINES.map((engine) => (
            <Link
              key={engine}
              href={`/sessions/new?engine=${engine}&topic=${topic.id}`}
              className="group flex items-center gap-3 p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-spark/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center shrink-0 group-hover:bg-spark/20 transition-colors">
                <Play className="w-3.5 h-3.5 text-spark" strokeWidth={1.5} fill="currentColor" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm">{ENGINE_LABELS[engine]}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">
                  {ENGINE_DESCRIPTIONS[engine]}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {errors.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
            Patrones de error
          </h2>
          <ul className="flex flex-col gap-2">
            {errors.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 p-3 rounded-md border border-white/[0.06] bg-white/[0.02]"
              >
                <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground font-mono shrink-0 mt-0.5">
                  {e.error_type}
                </span>
                <p className="text-sm flex-1">{e.description}</p>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5">
                  {e.frequency}×
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sessions.length > 0 && (
        <section>
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">
            Historial
          </h2>
          <ul className="flex flex-col gap-2">
            {sessions.slice(0, 10).map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between gap-3 p-3 rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0">
                    {ENGINE_LABELS[s.engine]}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {new Date(s.started_at).toLocaleDateString("es", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-[0.14em] font-mono shrink-0 ${
                    s.status === "completed"
                      ? "text-green-400"
                      : s.status === "active"
                      ? "text-spark"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.status === "completed"
                    ? `${s.score ?? 0}%`
                    : s.status === "active"
                    ? "En curso"
                    : "Abandonada"}
                </span>
              </Link>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
