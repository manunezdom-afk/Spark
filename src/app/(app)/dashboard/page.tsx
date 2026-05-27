import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSessions,
  getDaysToNearestDeadline,
  getTopics,
  getDueFlashcardsCount,
} from "@/lib/spark/queries";
import { EmptySessionsState } from "@/components/dashboard/EmptySessionsState";
import { WeakTopicsWidget } from "@/components/dashboard/WeakTopicsWidget";
import { MethodQuickCard } from "@/components/methods/MethodQuickCard";
import { WeeklyOverview } from "@/components/dashboard/WeeklyOverview";
import { ActiveSessionsSection } from "@/components/dashboard/ActiveSessionsSection";
import type { LearningEngine } from "@/modules/spark/types";

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

const NOVA_TIPS = [
  "La maestría no se logra repitiendo lo que ya dominas, sino desafiando activamente tus zonas grises.",
  "Cazar errores en tus sesiones entrena tu mente para detectar patrones débiles antes de que se consoliden.",
  "El puente cognitivo más fuerte es el que construyes conectando conceptos que creías aislados.",
  "Tu racha no es solo un número: es el registro de tu constancia neuronal y memoria a largo plazo.",
  "La repetición espaciada SM-2 calcula el momento preciso para repasar antes de que el conocimiento se desvanezca."
];

export default async function DashboardPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const [activeSessions, daysToDeadline, topics, dueFlashcards] = await Promise.all([
    getSessions(db, user.id, "active"),
    getDaysToNearestDeadline(db, user.id),
    getTopics(db, user.id),
    getDueFlashcardsCount(db, user.id),
  ]);

  const hasTopics = topics.length > 0;
  const kairosTopics = topics.filter((t) => t.kairos_subject_id);
  const randomTip = NOVA_TIPS[Math.floor(Math.random() * NOVA_TIPS.length)];

  return (
    <div className="p-6 md:p-12 max-w-5xl mx-auto animate-fade-up">
      {(kairosTopics.length > 0 ||
        (daysToDeadline !== null && daysToDeadline <= 14) ||
        dueFlashcards > 0) && (
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
          {dueFlashcards > 0 && (
            <Link
              href="/flashcards/review"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/15 bg-orange-50/60 text-[12px] text-orange-700 hover:bg-orange-100/70 hover:border-orange-500/30 transition-all duration-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              Tienes {dueFlashcards} {dueFlashcards === 1 ? "tarjeta pendiente" : "tarjetas pendientes"} hoy
            </Link>
          )}
        </div>
      )}

      {/* Cabecera Coach Panel Premium de Nova */}
      <div className="relative overflow-hidden mb-10 p-6 md:p-8 rounded-3xl border border-white/40 bg-white/45 backdrop-blur-xl shadow-soft">
        {/* Decoraciones de luz interna en la tarjeta */}
        <div className="absolute right-[-10%] top-[-30%] w-48 h-48 bg-spark/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-[30%] bottom-[-40%] w-56 h-56 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="min-w-0">
            <div className="text-[11.5px] font-semibold text-spark uppercase tracking-[0.2em] mb-2 font-mono">
              {capitalize(
                new Date().toLocaleDateString("es", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                }),
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-ink mb-3 leading-tight">
              {greet()}, <span className="text-brand-gradient leading-none">{user?.email?.split('@')[0] || "estudiante"}</span>.
            </h1>
            <p className="text-[13.5px] text-ink-secondary leading-relaxed max-w-2xl border-l-2 border-spark/30 pl-4 italic">
              <strong>Nova aconseja:</strong> &ldquo;{randomTip}&rdquo;
            </p>
          </div>
          
          <div className="flex shrink-0 gap-2 items-center">
            <Link
              href="/sessions/new"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-foreground text-background text-[13px] font-semibold hover:opacity-90 active:scale-[0.985] transition-all shadow-soft"
            >
              Comenzar a entrenar
            </Link>
          </div>
        </div>
      </div>

      {/* 1. Métodos de Aprendizaje Activo (Siempre accesibles al inicio) */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <h2 className="text-[16px] font-bold text-ink tracking-tight">
            Métodos de Aprendizaje Activo
          </h2>
          <span className="text-[11.5px] text-ink-tertiary font-mono">5 métodos de estudio</span>
        </div>
        <p className="text-[13px] text-ink-secondary mb-4 max-w-2xl leading-relaxed">
          Elige el enfoque cognitivo que prefieras para entrenar tu mente hoy:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
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

      {/* 2. Continuar donde lo dejaste (Sesiones en curso) */}
      {/* 2. Continuar donde lo dejaste (Sesiones en curso con opción de eliminación) */}
      <ActiveSessionsSection initialSessions={activeSessions} topics={topics} />

      {!hasTopics && activeSessions.length === 0 && (
        <section className="mb-10">
          <EmptySessionsState hasTopics={hasTopics} />
        </section>
      )}

      {/* 3. Tu Progreso y Racha */}
      <section className="mb-10">
        <h2 className="text-[13px] font-medium text-ink-secondary tracking-tight mb-3">
          Resumen de actividad
        </h2>
        <WeeklyOverview userId={user.id} />
      </section>

      {/* 4. Temas sugeridos para repasar */}
      {hasTopics && (
        <section>
          <h2 className="text-[13px] font-medium text-ink-secondary tracking-tight mb-3">
            Temas sugeridos para repasar
          </h2>
          <WeakTopicsWidget userId={user.id} topics={topics} />
        </section>
      )}
    </div>
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
