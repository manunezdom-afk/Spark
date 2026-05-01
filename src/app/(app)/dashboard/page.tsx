import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Play, Sparkles, Flame, ArrowRight } from "lucide-react";
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
import { GradientText } from "@/components/brand/GradientText";
import { BrandOrb } from "@/components/brand/BrandOrb";
import { NovaDashboardEntry } from "@/components/nova/NovaDashboardEntry";
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
      <div className="p-6 md:p-12 max-w-5xl animate-fade-up">
        <div className="mb-8 flex flex-wrap gap-2">
          {kairosTopics.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.07] bg-white/60 backdrop-blur-sm text-[11px] font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-spark animate-brand-pulse" />
              Conectado con Kairos · {kairosTopics.length}{" "}
              {kairosTopics.length === 1 ? "materia" : "materias"}
            </div>
          )}
          {daysToDeadline !== null && daysToDeadline <= 14 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-50/60 backdrop-blur-sm text-[11px] font-medium text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Focus avisa: prueba en{" "}
              {daysToDeadline === 0
                ? "hoy"
                : daysToDeadline === 1
                  ? "1 día"
                  : `${daysToDeadline} días`}
            </div>
          )}
        </div>

        <header className="flex flex-col gap-3 mb-12">
          <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
            {new Date().toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </div>
          <h1 className="text-display-lg md:text-display-xl text-foreground">
            <span className="font-light">{greeting}</span>{" "}
            <GradientText italic className="font-light">
              {totalDue > 0 ? "vamos." : "todo en orden."}
            </GradientText>
          </h1>
        </header>

        <NovaDashboardEntry />

        {totalDue > 0 && (
          <section className="mb-10">
            <Link
              href={flashcardsDue > 0 ? "/flashcards/review" : "/mastery"}
              className="group block p-7 rounded-2xl border border-spark/20 bg-gradient-to-br from-spark/[0.06] via-transparent to-spark/[0.03] hover:border-spark/35 hover:shadow-glow transition-all duration-300 ease-spring"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-spark/10 border border-spark/20 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-spark" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tracking-tight">
                      {totalDue} {totalDue === 1 ? "elemento" : "elementos"}
                      <span className="text-muted-foreground font-normal"> por repasar</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {flashcardsDue > 0 && `${flashcardsDue} ${flashcardsDue === 1 ? "tarjeta" : "tarjetas"}`}
                      {flashcardsDue > 0 && masteryDue > 0 && " · "}
                      {masteryDue > 0 && `${masteryDue} ${masteryDue === 1 ? "tema" : "temas"}`}
                    </div>
                  </div>
                </div>
                <Button variant="spark" className="rounded-full">
                  {flashcardsDue > 0 ? "Repasar tarjetas" : "Ver temas"}
                  <Play className="w-3.5 h-3.5" strokeWidth={1.5} fill="currentColor" />
                </Button>
              </div>
            </Link>
          </section>
        )}

        {activeSessions.length > 0 && (
          <section className="mb-10">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-4">
              Sesiones abiertas
            </h2>
            <ul className="flex flex-col gap-2">
              {activeSessions.map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}`}
                  className="flex items-center justify-between p-4 rounded-2xl border border-black/[0.06] bg-white/50 hover:bg-white hover:border-black/[0.10] hover:shadow-soft transition-all duration-200 text-sm"
                >
                  <span className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-spark" strokeWidth={1.75} />
                    <span className="font-semibold text-foreground">{ENGINE_LABELS[s.engine]}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleString("es", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-spark flex items-center gap-1">
                    Continuar
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </span>
                </Link>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
              {hasTopics
                ? daysToDeadline !== null && daysToDeadline <= 7
                  ? `Para hoy · ${daysToDeadline} ${daysToDeadline === 1 ? "día" : "días"} para tu deadline`
                  : "Recomendado para hoy"
                : "Empieza aquí"}
            </h2>
            {!hasTopics && (
              <Button asChild variant="spark" size="sm" className="rounded-full">
                <Link href="/topics">
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                  Crear primer tema
                </Link>
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommended.map((engine, i) => (
              <Link
                key={engine}
                href={hasTopics ? `/sessions/new?engine=${engine}` : "/topics"}
                className="group relative flex flex-col gap-3 p-6 rounded-2xl border border-black/[0.06] bg-white/60 backdrop-blur-sm hover:bg-white hover:border-spark/30 hover:shadow-lift transition-all duration-300 ease-spring"
                style={{ animation: `fade-up 360ms ${i * 80}ms cubic-bezier(0.34, 1.4, 0.64, 1) both` }}
              >
                {!hasTopics && (
                  <span className="self-start font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 border border-black/[0.07] bg-black/[0.02] px-2 py-0.5 rounded-full">
                    Ejemplo
                  </span>
                )}
                <BrandOrb size="xs" spinning={hasTopics} />
                <div className={`font-semibold text-[15px] tracking-tight ${!hasTopics ? "text-foreground/70" : "text-foreground"}`}>
                  {ENGINE_LABELS[engine]}
                </div>
                <div className={`text-xs leading-relaxed ${!hasTopics ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                  {ENGINE_DESCRIPTIONS[engine]}
                </div>
                {!hasTopics ? (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-spark group-hover:gap-1.5 transition-all">
                    Crea un tema para entrenar
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </div>
                ) : (
                  <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-spark/0 group-hover:text-spark group-hover:gap-1.5 transition-all">
                    Iniciar
                    <ArrowRight className="w-3 h-3" strokeWidth={2} />
                  </div>
                )}
              </Link>
            ))}
          </div>

          {!hasTopics && (
            <p className="mt-6 text-xs text-muted-foreground/70 text-center">
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
