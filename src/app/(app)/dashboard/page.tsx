import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSessions,
  getDaysToNearestDeadline,
  getTopics,
} from "@/lib/spark/queries";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { IntentActions } from "@/components/dashboard/IntentActions";
import { EmptySessionsState } from "@/components/dashboard/EmptySessionsState";
import { WeakTopicsWidget } from "@/components/dashboard/WeakTopicsWidget";
import { MethodQuickCard } from "@/components/methods/MethodQuickCard";
import { formatRelativeTime } from "@/lib/spark/recommendation";
import { hexToRgba } from "@/lib/utils/color";
import type {
  LearningEngine,
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

export const dynamic = "force-dynamic";

const METHODS: Array<{
  key: LearningEngine;
  href: string;
}> = [
  { key: "socratic", href: "/sessions/new?engine=socratic" },
  { key: "debugger", href: "/sessions/new?engine=debugger" },
  { key: "devils_advocate", href: "/sessions/new?engine=devils_advocate" },
  { key: "bridge_builder", href: "/sessions/new?engine=bridge_builder" },
  { key: "roleplay", href: "/sessions/new?engine=roleplay" },
];

export default async function DashboardPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const [activeSessions, daysToDeadline, topics] = await Promise.all([
    getSessions(db, user.id, "active"),
    getDaysToNearestDeadline(db, user.id),
    getTopics(db, user.id),
  ]);

  const hasTopics = topics.length > 0;
  const kairosTopics = topics.filter((t) => t.kairos_subject_id);

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto animate-fade-up">
      {(kairosTopics.length > 0 ||
        (daysToDeadline !== null && daysToDeadline <= 14)) && (
        <div className="mb-6 flex flex-wrap gap-2">
          {kairosTopics.length > 0 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-black/[0.07] bg-white/60 text-[12px] text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-spark" />
              Conectado con Kairos · {kairosTopics.length}{" "}
              {kairosTopics.length === 1 ? "materia" : "materias"}
            </div>
          )}
          {daysToDeadline !== null && daysToDeadline <= 14 && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-50/60 text-[12px] text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Prueba en{" "}
              {daysToDeadline === 0
                ? "hoy"
                : daysToDeadline === 1
                  ? "1 día"
                  : `${daysToDeadline} días`}
            </div>
          )}
        </div>
      )}

      <header className="mb-10">
        <div className="text-[13px] font-medium text-ink-tertiary mb-3 tracking-tight">
          {capitalize(
            new Date().toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }),
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-ink mb-2 max-w-3xl leading-[1.05]">
          {greet()}.
        </h1>
        <p className="text-lg md:text-xl text-ink-secondary leading-snug max-w-2xl">
          ¿Qué quieres entrenar hoy?
        </p>
      </header>

      {/* Intent-first: el alumno elige qué necesita, Spark elige el método */}
      <section className="mb-12">
        <IntentActions canCreateSession={hasTopics} />
      </section>

      {activeSessions.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-[13px] font-medium text-ink-secondary tracking-tight">
              Continuar donde lo dejaste
              <span className="ml-2 text-ink-tertiary font-normal">
                ({activeSessions.length})
              </span>
            </h2>
            {activeSessions.length > 5 && (
              <Link
                href="/sessions"
                className="text-[12px] font-medium text-ink-tertiary hover:text-ink transition-colors inline-flex items-center gap-1"
              >
                Ver todas
                <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
              </Link>
            )}
          </div>
          <ul className="flex flex-col gap-2">
            {activeSessions.slice(0, 5).map((s) => (
              <ActiveSessionRow key={s.id} session={s} topics={topics} />
            ))}
          </ul>
        </section>
      )}

      {!hasTopics && activeSessions.length === 0 && (
        <section className="mb-10">
          <EmptySessionsState hasTopics={hasTopics} />
        </section>
      )}

      <section className="mb-10">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 className="text-[13px] font-medium text-ink-secondary tracking-tight">
            Otras formas de entrenar
          </h2>
          <span className="text-[11.5px] text-ink-tertiary">5 métodos</span>
        </div>
        <p className="text-[12.5px] text-ink-tertiary mb-4 max-w-2xl leading-relaxed">
          Si ya sabes cómo quieres trabajar, elige el método directamente.
        </p>
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

      {hasTopics && (
        <section>
          <h2 className="text-[13px] font-medium text-ink-secondary tracking-tight mb-3">
            Tus temas a fortalecer
          </h2>
          <WeakTopicsWidget userId={user.id} topics={topics} />
        </section>
      )}
    </div>
  );
}

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
      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-white/55 hover:bg-white hover:border-black/[0.12] transition-all duration-200"
      style={{ borderLeft: `2.5px solid ${hexToRgba(theme.accent, 0.55)}` }}
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
          <div className="text-[14px] font-medium tracking-tight text-foreground truncate">
            {title}
          </div>
          <div className="text-[12px] text-muted-foreground truncate">
            {subjectLabel} · iniciada {formatRelativeTime(session.started_at)}
          </div>
        </div>
      </div>
      <span
        className="text-[12px] font-medium inline-flex items-center gap-1 shrink-0"
        style={{ color: theme.accent }}
      >
        Continuar
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
      </span>
    </Link>
  );
}

function greet(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Hola";
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
