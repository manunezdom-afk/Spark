import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getDueFlashcardsCount,
  getDueMasteryCount,
  getSessions,
  getDaysToNearestDeadline,
  getTopics,
  getErrorPatterns,
} from "@/lib/spark/queries";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { GradientText } from "@/components/brand/GradientText";
import { HeroActions } from "@/components/dashboard/HeroActions";
import { EmptySessionsState } from "@/components/dashboard/EmptySessionsState";
import { RecommendedCard } from "@/components/dashboard/RecommendedCard";
import { WeeklyOverview } from "@/components/dashboard/WeeklyOverview";
import { WeakTopicsWidget } from "@/components/dashboard/WeakTopicsWidget";
import { MethodQuickCard } from "@/components/methods/MethodQuickCard";
import { buildRecommendation, formatRelativeTime } from "@/lib/spark/recommendation";
import { hexToRgba } from "@/lib/utils/color";
import type {
  LearningEngine,
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

export const dynamic = "force-dynamic";

// Métodos en orden de presentación. "test" es virtual y abre /tests/new.
const METHODS: Array<{
  key: LearningEngine | "test";
  href: string;
}> = [
  { key: "socratic", href: "/sessions/new?engine=socratic" },
  { key: "debugger", href: "/sessions/new?engine=debugger" },
  { key: "devils_advocate", href: "/sessions/new?engine=devils_advocate" },
  { key: "bridge_builder", href: "/sessions/new?engine=bridge_builder" },
  { key: "roleplay", href: "/sessions/new?engine=roleplay" },
  { key: "test", href: "/tests/new" },
];

export default async function DashboardPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const [
    flashcardsDue,
    masteryDue,
    activeSessions,
    daysToDeadline,
    topics,
    errorPatterns,
  ] = await Promise.all([
    getDueFlashcardsCount(db, user.id),
    getDueMasteryCount(db, user.id),
    getSessions(db, user.id, "active"),
    getDaysToNearestDeadline(db, user.id),
    getTopics(db, user.id),
    getErrorPatterns(db, user.id),
  ]);

  const hasTopics = topics.length > 0;
  const kairosTopics = topics.filter((t) => t.kairos_subject_id);
  const errorsCount = errorPatterns.length;

  const recommendation = buildRecommendation({
    activeSessions,
    flashcardsDue,
    masteryDue,
    daysToDeadline,
    topics,
    kairosTopics,
    errorsCount,
  });

  const greeting = greet();

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto animate-fade-up">
      {/* Status chips — sutil, no ocupan jerarquía */}
      {(kairosTopics.length > 0 ||
        (daysToDeadline !== null && daysToDeadline <= 14)) && (
        <div className="mb-6 flex flex-wrap gap-2">
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
      )}

      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="mb-8">
        <div className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-3">
          {new Date().toLocaleDateString("es", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <p className="text-sm md:text-base text-muted-foreground mb-2">
          {greeting}
        </p>
        <h1 className="text-[26px] sm:text-3xl md:text-4xl leading-[1.15] tracking-tight text-foreground mb-5 break-words max-w-3xl">
          <span className="font-light">¿Qué quieres entrenar </span>
          <GradientText italic className="font-light">
            hoy?
          </GradientText>
        </h1>
        <HeroActions canCreateSession={hasTopics} />
      </header>

      {/* ── Tu semana (stats + racha + heatmap) ──────────────── */}
      <section className="mb-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-3">
          Tu semana
        </h2>
        <WeeklyOverview userId={user.id} />
      </section>

      {/* ── Recomendado para hoy ─────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-3">
          Recomendado para hoy
        </h2>
        <RecommendedCard recommendation={recommendation} />
      </section>

      {/* ── Métodos rápidos ──────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Métodos de entrenamiento
          </h2>
          <Link
            href="/sessions/new"
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            Ver todos
            <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {METHODS.map((m, i) => (
            <MethodQuickCard
              key={m.key}
              methodKey={m.key}
              href={hasTopics ? m.href : "/topics"}
              animationIndex={i}
              disabled={!hasTopics}
            />
          ))}
        </div>
      </section>

      {/* ── Sesiones abiertas ────────────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Sesiones abiertas
            {activeSessions.length > 0 && (
              <span className="ml-2 text-foreground/40 normal-case tracking-normal">
                ({activeSessions.length})
              </span>
            )}
          </h2>
          {activeSessions.length > 3 && (
            <Link
              href="/sessions"
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          )}
        </div>
        {activeSessions.length === 0 ? (
          <EmptySessionsState hasTopics={hasTopics} />
        ) : (
          <ul className="flex flex-col gap-2">
            {activeSessions.slice(0, 3).map((s) => (
              <ActiveSessionRow key={s.id} session={s} topics={topics} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Temas a fortalecer ───────────────────────────────── */}
      <section>
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-3">
          Temas a fortalecer
        </h2>
        <WeakTopicsWidget userId={user.id} topics={topics} />
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Active session row — compact, lateral, with theme accent dot.

function ActiveSessionRow({
  session,
  topics,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
}) {
  const theme = getEngineTheme(session.engine);
  const title = ENGINE_LABELS[session.engine];
  const sessionTopics = topics.filter((t) => session.topic_ids.includes(t.id));
  const subjectLabel =
    sessionTopics.length === 0
      ? "Sin tema asignado"
      : sessionTopics.length === 1
        ? sessionTopics[0].title
        : `${sessionTopics[0].title} +${sessionTopics.length - 1}`;

  return (
    <Link
      href={`/sessions/${session.id}`}
      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-white/55 hover:bg-white hover:border-black/[0.12] hover:shadow-soft transition-all duration-200"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
          style={{
            background: hexToRgba(theme.accent, 0.1),
            color: theme.accent,
            border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
          }}
        >
          <theme.Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold tracking-tight text-foreground truncate">
            {title}
          </div>
          <div className="text-[11.5px] text-muted-foreground truncate">
            {subjectLabel} · iniciada {formatRelativeTime(session.started_at)}
          </div>
        </div>
      </div>
      <span
        className="font-mono text-[10px] uppercase tracking-[0.14em] inline-flex items-center gap-1 shrink-0"
        style={{ color: theme.accent }}
      >
        Continuar
        <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
      </span>
    </Link>
  );
}

// ──────────────────────────────────────────────────────────────
// Helpers

function greet(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Bien tarde,";
  if (hour < 12) return "Buenos días,";
  if (hour < 19) return "Buenas tardes,";
  return "Buenas noches,";
}
