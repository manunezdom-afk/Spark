import Link from "next/link";
import { redirect } from "next/navigation";
import { Layers, Activity, Play, Sparkles, Flame } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDueFlashcardsCount,
  getDueMasteryCount,
  getSessions,
  getDaysToNearestDeadline,
  getTopics,
} from "@/lib/spark/queries";
import { recommendEngines } from "@/modules/spark/scheduler/sm2";
import { ENGINE_LABELS, ENGINE_DESCRIPTIONS } from "@/modules/spark/engines";
import { Button } from "@/components/ui/button";
import { WelcomeTour } from "@/components/onboarding/WelcomeTour";
import type { LearningEngine } from "@/modules/spark/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const db = await getSupabaseServerClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/login");

  const [
    flashcardsDue,
    masteryDue,
    activeSessions,
    daysToDeadline,
    topics,
  ] = await Promise.all([
    getDueFlashcardsCount(db, user.id),
    getDueMasteryCount(db, user.id),
    getSessions(db, user.id, "active"),
    getDaysToNearestDeadline(db, user.id),
    getTopics(db, user.id),
  ]);

  const totalDue = flashcardsDue + masteryDue;
  const recommended = recommendEngines(daysToDeadline).slice(0, 3) as LearningEngine[];
  const hasTopics = topics.length > 0;
  const kairosTopics = topics.filter((t) => t.kairos_subject_id);

  const greeting = greet();

  return (
    <>
    <WelcomeTour />
    <div className="p-6 md:p-10 max-w-5xl">
      {kairosTopics.length > 0 && (
        <div className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-nova-mid/60 font-mono">
          <div className="w-1.5 h-1.5 rounded-full bg-nova-mid/60" />
          Conectado con Kairos · {kairosTopics.length} {kairosTopics.length === 1 ? "materia" : "materias"}
        </div>
      )}

      <header className="flex flex-col gap-2 mb-10">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {new Date().toLocaleDateString("es", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </span>
        <h1 className="text-4xl font-semibold md:text-5xl tracking-tight leading-tight">
          {greeting}{" "}
          <span className="italic text-nova-mid">
            {totalDue > 0 ? "vamos." : "todo en orden."}
          </span>
        </h1>
      </header>

      {totalDue > 0 && (
        <section className="mb-10">
          <Link
            href={flashcardsDue > 0 ? "/flashcards/review" : "/mastery"}
            className="group block p-6 rounded-lg border border-spark/30 bg-spark/[0.04] hover:bg-spark/[0.07] transition-colors"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Flame className="w-6 h-6 text-spark" strokeWidth={1.5} />
                <div>
                  <div className="text-2xl font-semibold">
                    {totalDue} {totalDue === 1 ? "elemento por repasar" : "elementos por repasar"}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {flashcardsDue > 0 && `${flashcardsDue} ${flashcardsDue === 1 ? "tarjeta" : "tarjetas"}`}
                    {flashcardsDue > 0 && masteryDue > 0 && " · "}
                    {masteryDue > 0 && `${masteryDue} ${masteryDue === 1 ? "tema" : "temas"}`}
                  </div>
                </div>
              </div>
              <Button variant="spark">
                {flashcardsDue > 0 ? "Repasar tarjetas" : "Ver temas"}
                <Play className="w-3.5 h-3.5" strokeWidth={1.5} fill="currentColor" />
              </Button>
            </div>
          </Link>
        </section>
      )}

      {activeSessions.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">
            Sesiones abiertas
          </h2>
          <ul className="flex flex-col gap-2">
            {activeSessions.map((s) => (
              <Link
                key={s.id}
                href={`/sessions/${s.id}`}
                className="flex items-center justify-between p-3 rounded-md border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-sm"
              >
                <span className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-spark" strokeWidth={1.5} />
                  <span className="font-medium">{ENGINE_LABELS[s.engine]}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.started_at).toLocaleString("es", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark">
                  Continuar →
                </span>
              </Link>
            ))}
          </ul>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {hasTopics
              ? daysToDeadline !== null && daysToDeadline <= 7
                ? `Recomendado · ${daysToDeadline} ${daysToDeadline === 1 ? "día" : "días"} para tu deadline`
                : "Recomendado para hoy"
              : "Empieza aquí"}
          </h2>
          {!hasTopics && (
            <Button asChild variant="spark" size="sm">
              <Link href="/topics">
                <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
                Crear primer tema
              </Link>
            </Button>
          )}
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 ${!hasTopics ? "relative" : ""}`}>
          {recommended.map((engine) => (
            <Link
              key={engine}
              href="/topics"
              className={`group flex flex-col gap-2 p-5 rounded-lg border transition-colors ${
                hasTopics
                  ? "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-spark/30"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-spark/30"
              }`}
            >
              {!hasTopics && (
                <span className="self-start font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground/50 border border-white/[0.08] px-2 py-0.5 rounded-full mb-1">
                  Ejemplo
                </span>
              )}
              <Sparkles className={`w-4 h-4 text-spark ${!hasTopics ? "opacity-50" : ""}`} strokeWidth={1.5} />
              <div className={`font-medium ${!hasTopics ? "text-foreground/50" : ""}`}>
                {ENGINE_LABELS[engine]}
              </div>
              <div className={`text-xs leading-relaxed ${!hasTopics ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                {ENGINE_DESCRIPTIONS[engine]}
              </div>
              {!hasTopics && (
                <div className="mt-auto pt-3 text-[11px] text-spark/70 font-medium">
                  Crea un tema para entrenar →
                </div>
              )}
            </Link>
          ))}
        </div>

        {!hasTopics && (
          <p className="mt-4 text-xs text-muted-foreground/50 text-center">
            Pega un texto, una clase o un capítulo y Spark arma las sesiones por ti.
          </p>
        )}
      </section>
    </div>
    </>
  );
}

function greet(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Bien tarde,";
  if (hour < 12) return "Buenos días,";
  if (hour < 19) return "Buenas tardes,";
  return "Buenas noches,";
}
