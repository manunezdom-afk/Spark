import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAllMastery, getTopicsByIds } from "@/lib/spark/queries";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { GradientText } from "@/components/brand/GradientText";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

// ── Demo data shown when the user hasn't done any sessions yet ─────────────
const DEMO_MASTERY = [
  {
    id: "demo-1",
    title: "Marketing Digital y Redes Sociales",
    category: "Marketing",
    score: 42,
    sessions: 2,
    errors: 3,
    dueLabel: "Hoy",
    hot: true,
  },
  {
    id: "demo-2",
    title: "Comportamiento del Consumidor",
    category: "Marketing",
    score: 0,
    sessions: 0,
    errors: 0,
    dueLabel: "Hoy",
    hot: true,
  },
];

export default async function MasteryPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const mastery = await getAllMastery(db, user.id);
  const topics = await getTopicsByIds(db, mastery.map((m) => m.topic_id));
  const topicById = new Map(topics.map((t) => [t.id, t]));
  const now = Date.now();
  const isEmpty = mastery.length === 0;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-12 animate-fade-up">
      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Spark · Maestría
        </span>
        <h1 className="text-display-md md:text-display-lg text-foreground">
          <span className="font-light">Lo que sabes</span>{" "}
          <GradientText italic className="font-light">
            hoy.
          </GradientText>
        </h1>
      </header>

      {isEmpty ? (
        <>
          {/* Demo banner */}
          <div className="flex flex-col gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 mb-6 sm:flex-row sm:items-center sm:gap-4">
            <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-spark/20 bg-spark/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-spark">
              <FlaskConical className="h-3 w-3" strokeWidth={1.5} />
              Ejemplos
            </span>
            <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
              Así se ve tu progreso después de entrenar. Completa tu primera
              sesión en un tema para ver tu maestría real.
            </p>
            <Link
              href="/topics"
              className="shrink-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-white/[0.14] hover:text-foreground"
            >
              Ir a Temas →
            </Link>
          </div>

          {/* Demo mastery rows */}
          <ul className="flex flex-col divide-y divide-black/[0.06]">
            {DEMO_MASTERY.map((item) => (
              <li key={item.id} className="opacity-70">
                <div className="flex flex-col gap-2 py-4 px-3 rounded-md cursor-default">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      {item.category && (
                        <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-1">
                          {item.category}
                        </div>
                      )}
                      <div className="font-medium truncate">{item.title}</div>
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] shrink-0 text-spark">
                      {item.dueLabel}
                    </span>
                  </div>
                  <MasteryBar score={item.score} />
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <span>{item.sessions} sesiones</span>
                    <span>·</span>
                    <span>{item.errors} errores</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <ul className="flex flex-col divide-y divide-black/[0.06]">
          {mastery.map((m) => {
            const topic = topicById.get(m.topic_id);
            if (!topic) return null;
            const dueIn = new Date(m.next_review_at).getTime() - now;
            const days = Math.ceil(dueIn / (1000 * 60 * 60 * 24));
            const dueLabel =
              days <= 0 ? "Hoy" : days === 1 ? "Mañana" : `En ${days} días`;
            return (
              <li key={m.id}>
                <Link
                  href={`/topics/${topic.id}`}
                  className="flex flex-col gap-2 py-4 hover:bg-black/[0.03] -mx-3 px-3 rounded-md transition-colors"
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
