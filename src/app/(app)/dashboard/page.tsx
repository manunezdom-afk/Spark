import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookMarked,
  Flame,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
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
import { MethodQuickCard } from "@/components/methods/MethodQuickCard";
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
      {/*
        Two-line hierarchy: kicker (date) + greeting + question. La
        pregunta nunca debe cortarse: usamos break-words y un cap de
        text-4xl en desktop (no text-5xl) para que la línea entera
        quepa cómoda incluso con sidebar de 228px y viewport de 1024px.
      */}
      <header className="mb-10">
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
            <ArrowRight className="w-3 h-3" strokeWidth={2} />
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
      <section>
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
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
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
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Recomendación inteligente: una sola card que apunta al siguiente
// paso correcto según el estado del usuario.

interface Recommendation {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: "urgent" | "warm" | "neutral";
  Icon: LucideIcon;
}

function buildRecommendation(args: {
  activeSessions: SparkLearningSession[];
  flashcardsDue: number;
  masteryDue: number;
  daysToDeadline: number | null;
  topics: SparkTopic[];
  kairosTopics: SparkTopic[];
  errorsCount: number;
}): Recommendation {
  const {
    activeSessions,
    flashcardsDue,
    masteryDue,
    daysToDeadline,
    topics,
    kairosTopics,
    errorsCount,
  } = args;

  // 1) Sesión activa → continuar
  if (activeSessions.length > 0) {
    const s = activeSessions[0];
    const theme = getEngineTheme(s.engine);
    return {
      kicker: "Continúa donde lo dejaste",
      title: ENGINE_LABELS[s.engine],
      body: `Sesión iniciada ${formatRelativeTime(s.started_at)}. Termínala antes de empezar otra.`,
      href: `/sessions/${s.id}`,
      cta: "Continuar",
      tone: "warm",
      Icon: theme.Icon,
    };
  }

  // 2) Deadline crítico (≤3 días)
  if (daysToDeadline !== null && daysToDeadline <= 3) {
    return {
      kicker: "Prioridad — Focus avisa",
      title:
        daysToDeadline === 0
          ? "Tu prueba es hoy"
          : `Tu prueba en ${daysToDeadline} ${daysToDeadline === 1 ? "día" : "días"}`,
      body: "Modo evaluación: alta densidad. Empieza con preguntas guiadas o genera una prueba simulada.",
      href: "/tests/new",
      cta: "Generar prueba",
      tone: "urgent",
      Icon: Flame,
    };
  }

  // 3) Tarjetas vencidas
  if (flashcardsDue > 0) {
    return {
      kicker: "Repaso espaciado",
      title: `${flashcardsDue} ${flashcardsDue === 1 ? "tarjeta" : "tarjetas"} para hoy`,
      body: "Sin esto, lo que aprendiste se pierde. Cinco minutos bien invertidos.",
      href: "/flashcards/review",
      cta: "Repasar tarjetas",
      tone: "warm",
      Icon: Layers,
    };
  }

  // 4) Mastery vencido
  if (masteryDue > 0) {
    return {
      kicker: "Por repasar",
      title: `${masteryDue} ${masteryDue === 1 ? "tema" : "temas"} para revisitar`,
      body: "Conceptos que ya entrenaste y toca refrescar antes de que se enfríen.",
      href: "/mastery",
      cta: "Ver mapa",
      tone: "warm",
      Icon: Activity,
    };
  }

  // 5) Errores acumulados
  if (errorsCount > 0) {
    return {
      kicker: "Detección",
      title: `${errorsCount} ${errorsCount === 1 ? "error" : "errores"} sin atender`,
      body: "Patrones que se repiten en tus sesiones. Atácalos antes de que se vuelvan hábito.",
      href: "/errors",
      cta: "Revisar errores",
      tone: "neutral",
      Icon: AlertCircle,
    };
  }

  // 6) Sin temas
  if (!topics.length) {
    return {
      kicker: "Empieza aquí",
      title: "Crea tu primer tema",
      body: "Un tema es un trozo de material — tu materia, tu capítulo, tus apuntes. De ahí salen todas las sesiones.",
      href: "/topics",
      cta: "Crear tema",
      tone: "warm",
      Icon: BookMarked,
    };
  }

  // 7) Tienes Kairos pero no entrenaste
  if (kairosTopics.length > 0) {
    const t = kairosTopics[0];
    return {
      kicker: "Tu material de Kairos",
      title: `Entrena con ${t.title}`,
      body: "Tus apuntes de clase entran como contexto en cada pregunta de Nova.",
      href: `/sessions/new?topic_ids=${t.id}`,
      cta: "Empezar sesión",
      tone: "neutral",
      Icon: Sparkles,
    };
  }

  // 8) Default — sin urgencias
  const t = topics[0];
  return {
    kicker: "Sin urgencias",
    title: `Practica ${t.title}`,
    body: "Buen momento para profundizar con preguntas guiadas o conectar temas.",
    href: `/sessions/new?topic_ids=${t.id}`,
    cta: "Empezar sesión",
    tone: "neutral",
    Icon: Sparkles,
  };
}

function RecommendedCard({ recommendation: r }: { recommendation: Recommendation }) {
  const tone =
    r.tone === "urgent"
      ? {
          border: "border-rose-300/40",
          bg: "bg-gradient-to-br from-rose-50/80 via-orange-50/40 to-transparent",
          accent: "text-rose-600",
          accentBg: "bg-rose-100/60 border-rose-200/50",
        }
      : r.tone === "warm"
        ? {
            border: "border-spark/25",
            bg: "bg-gradient-to-br from-spark/[0.07] via-transparent to-spark/[0.03]",
            accent: "text-spark",
            accentBg: "bg-spark/10 border-spark/20",
          }
        : {
            border: "border-black/[0.08]",
            bg: "bg-white/60",
            accent: "text-foreground/70",
            accentBg: "bg-black/[0.04] border-black/[0.06]",
          };

  return (
    <Link
      href={r.href}
      className={`group block p-6 md:p-7 rounded-2xl border ${tone.border} ${tone.bg} backdrop-blur-sm hover:shadow-lift hover:border-foreground/15 transition-all duration-300 ease-spring`}
    >
      <div className="flex items-start gap-4 flex-wrap">
        <div
          className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${tone.accentBg} border ${tone.accent} shrink-0`}
        >
          <r.Icon className="w-5 h-5" strokeWidth={1.7} />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`font-mono text-[10px] uppercase tracking-[0.18em] ${tone.accent} mb-1.5`}
          >
            {r.kicker}
          </div>
          <div className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-2 leading-snug">
            {r.title}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-2xl">
            {r.body}
          </p>
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-foreground text-background text-[12.5px] font-semibold group-hover:opacity-90 transition-opacity">
            {r.cta}
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
          </span>
        </div>
      </div>
    </Link>
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
          <theme.Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
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
        <ArrowRight className="w-3 h-3" strokeWidth={2} />
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

function formatRelativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
  });
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
