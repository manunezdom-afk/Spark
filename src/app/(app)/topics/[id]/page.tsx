import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  Play,
  AlertCircle,
  ClipboardList,
  History,
  Sparkles,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTopic,
  getMasteryStates,
  getErrorPatterns,
  getSessions,
} from "@/lib/spark/queries";
import { getTopicMaterials } from "@/lib/spark/kairos-bridge";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { KairosSourceHeader } from "@/components/topics/KairosSourceHeader";
import { TopicActions } from "@/components/topics/TopicActions";
import { MethodQuickCard } from "@/components/methods/MethodQuickCard";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import type { LearningEngine, TopicMaterial } from "@/modules/spark/types";

export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

interface RecommendedMethod {
  key: LearningEngine | "test";
  reason: string;
}

/**
 * Selecciona 2 métodos recomendados según el estado de maestría
 * del tema. La lógica privilegia construcción cuando no hay base
 * y evaluación cuando ya hay dominio.
 *
 *   sin entrenar (0%)  → preguntas guiadas (base) + cazar errores (calibrar)
 *   frágil  (1–39%)    → preguntas guiadas (consolidar) + caso real (aplicar)
 *   construcción (40–69%) → defender postura (presión) + conectar temas (síntesis)
 *   sólido (70%+)      → generar prueba (medir) + conectar temas (extender)
 */
function pickRecommendedMethods(masteryScore: number): RecommendedMethod[] {
  if (masteryScore === 0) {
    return [
      {
        key: "socratic",
        reason: "Construye base con preguntas que te lleven al porqué.",
      },
      {
        key: "debugger",
        reason: "Detecta qué partes te suenan pero no entiendes del todo.",
      },
    ];
  }
  if (masteryScore < 40) {
    return [
      {
        key: "socratic",
        reason: "Repite las capas de causalidad hasta que la regla se sostenga.",
      },
      {
        key: "roleplay",
        reason: "Aplica el concepto en un caso real para fijar la mecánica.",
      },
    ];
  }
  if (masteryScore < 70) {
    return [
      {
        key: "devils_advocate",
        reason: "Sube la presión: defiende tu postura ante contraataques reales.",
      },
      {
        key: "bridge_builder",
        reason: "Conecta este tema con otros para fortalecer el armazón.",
      },
    ];
  }
  return [
    {
      key: "test",
      reason: "Mide tu nivel real con una prueba simulada y corrección automática.",
    },
    {
      key: "bridge_builder",
      reason: "Extiende lo dominado: descubre conexiones no obvias con otros temas.",
    },
  ];
}

export default async function TopicDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return notFound();

  const topic = await getTopic(db, id);
  if (!topic || topic.user_id !== user.id) return notFound();

  const [mastery, errors, allSessions, materials] = await Promise.all([
    getMasteryStates(db, user.id, [topic.id]),
    getErrorPatterns(db, user.id, [topic.id]),
    getSessions(db, user.id),
    topic.source_note_ids?.length
      ? getTopicMaterials(db, user.id, topic.source_note_ids)
      : Promise.resolve([] as TopicMaterial[]),
  ]);

  const m = mastery[0];
  const masteryScore = m?.mastery_score ?? 0;
  const sessions = allSessions.filter((s) => s.topic_ids.includes(topic.id));
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const recommended = pickRecommendedMethods(masteryScore);

  const masteryStateLabel =
    masteryScore === 0
      ? "sin entrenar"
      : masteryScore < 40
        ? "en construcción"
        : masteryScore < 70
          ? "avanzando"
          : "sólido";

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-6">
        <Link
          href="/topics"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          Temas
        </Link>
        <TopicActions topic={topic} />
      </div>

      {/* ── Hero ───────────────────────────────────────────── */}
      <header className="flex flex-col gap-3 mb-8">
        {topic.kairos_subject_id && (
          <KairosSourceHeader
            subjectId={topic.kairos_subject_id}
            color={topic.kairos_color}
          />
        )}
        {topic.category && (
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {topic.category}
          </span>
        )}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight leading-[1.15] text-foreground break-words">
          {topic.title}
        </h1>
        {topic.summary && (
          <p className="text-[14px] md:text-[15px] text-muted-foreground leading-relaxed max-w-3xl">
            {topic.summary}
          </p>
        )}
      </header>

      {/* ── Action bar — los 2 CTAs principales ─────────────── */}
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/sessions/new?topic=${topic.id}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-spark text-white text-[14px] font-semibold hover:bg-spark/90 transition-colors shadow-soft"
          >
            <Play className="w-3.5 h-3.5" strokeWidth={1.5} fill="currentColor" />
            Entrenar este tema
          </Link>
          <Link
            href={`/tests/new?topic=${topic.id}`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-black/[0.08] bg-white/60 text-[14px] font-medium text-foreground/85 hover:bg-white hover:border-black/[0.16] transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.5} />
            Generar prueba
          </Link>
          <span className="text-[12px] text-muted-foreground">
            Estado: <span className="text-foreground/70 font-medium">{masteryStateLabel}</span>
          </span>
        </div>
      </section>

      {/* ── Progreso (3 metrics) ─────────────────────────────── */}
      <section className="mb-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-4">
          Tu progreso en este tema
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl border border-black/[0.06] bg-white/60">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Maestría
            </div>
            <MasteryBar score={masteryScore} size="lg" />
          </div>
          <div className="p-4 rounded-2xl border border-black/[0.06] bg-white/60">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Sesiones
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {completedSessions.length}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {completedSessions.length === 1 ? "completada" : "completadas"}
              </span>
            </div>
          </div>
          <div className="p-4 rounded-2xl border border-black/[0.06] bg-white/60">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Errores acumulados
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {m?.total_errors ?? 0}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {(m?.total_errors ?? 0) === 1 ? "patrón" : "patrones"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Métodos recomendados (solo 2, contextuales) ──────── */}
      <section className="mb-10">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-1">
          Recomendado para este tema
        </h2>
        <p className="text-[12.5px] text-muted-foreground mb-4 max-w-2xl">
          Según tu estado actual ({masteryStateLabel}), estos dos métodos van a darte
          el mejor avance ahora.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {recommended.map((r, i) => {
            const href =
              r.key === "test"
                ? `/tests/new?topic=${topic.id}`
                : `/sessions/new?engine=${r.key}&topic=${topic.id}`;
            return (
              <MethodQuickCard
                key={r.key}
                methodKey={r.key}
                href={href}
                animationIndex={i}
                variant="recommendation"
                reason={r.reason}
              />
            );
          })}
        </div>
      </section>

      {/* ── Material (apuntes de Kairos) ─────────────────────── */}
      {materials.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-4 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" strokeWidth={1.6} />
            Material de Kairos
            <span className="text-foreground/40 normal-case tracking-normal">
              ({materials.length})
            </span>
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {materials.slice(0, 8).map((mat) => (
              <MaterialRow key={mat.id} material={mat} />
            ))}
          </ul>
          {materials.length > 8 && (
            <p className="text-[11.5px] text-muted-foreground/70 mt-2">
              +{materials.length - 8} apuntes más disponibles al iniciar la sesión.
            </p>
          )}
        </section>
      )}

      {/* ── Sesiones recientes de este tema ──────────────────── */}
      {sessions.length > 0 && (
        <section className="mb-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-4 flex items-center gap-2">
            <History className="w-3.5 h-3.5" strokeWidth={1.6} />
            Historial de este tema
            <span className="text-foreground/40 normal-case tracking-normal">
              ({sessions.length})
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {sessions.slice(0, 6).map((s) => {
              const isTest =
                s.engine === "test_alternativas" || s.engine === "test_desarrollo";
              const href = isTest
                ? s.status === "completed"
                  ? `/tests/${s.id}/results`
                  : `/tests/${s.id}/take`
                : `/sessions/${s.id}`;
              return (
                <Link
                  key={s.id}
                  href={href}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-white/55 hover:bg-white hover:border-black/[0.12] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-foreground/70 shrink-0 truncate max-w-[180px]">
                      {ENGINE_LABELS[s.engine]}
                    </span>
                    <span className="text-[11.5px] text-muted-foreground truncate">
                      {new Date(s.started_at).toLocaleDateString("es", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] uppercase tracking-[0.14em] shrink-0 ${
                      s.status === "completed"
                        ? "text-emerald-600"
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
              );
            })}
          </ul>
          {sessions.length > 6 && (
            <Link
              href="/sessions"
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
            >
              Ver todas las sesiones
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          )}
        </section>
      )}

      {/* ── Errores acumulados ───────────────────────────────── */}
      {errors.length > 0 && (
        <section>
          <h2 className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-4 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.6} />
            Patrones de error
            <span className="text-foreground/40 normal-case tracking-normal">
              ({errors.length})
            </span>
          </h2>
          <ul className="flex flex-col gap-2">
            {errors.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-black/[0.06] bg-white/60"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0 mt-0.5">
                  {e.error_type}
                </span>
                <p className="text-[13px] flex-1 text-foreground/90 break-words leading-relaxed">
                  {e.description}
                </p>
                <span className="font-mono text-[10px] text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                  {e.frequency}×
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Link
              href={`/sessions/new?engine=debugger&topic=${topic.id}`}
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-spark hover:gap-2 transition-all"
            >
              <Sparkles className="w-3 h-3" strokeWidth={1.7} />
              Atacar estos errores con Cazar errores
              <ArrowRight className="w-3 h-3" strokeWidth={2} />
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Material row — compact, shows title + block_count if any.

function MaterialRow({ material }: { material: TopicMaterial }) {
  return (
    <li className="flex items-start gap-2.5 p-3 rounded-xl border border-black/[0.06] bg-white/55">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-nova-soft border border-nova/20 shrink-0 mt-0.5">
        <BookOpen className="w-3 h-3 text-nova-mid" strokeWidth={1.7} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-foreground truncate">
          {material.title}
        </div>
        <div className="text-[10.5px] text-muted-foreground tabular-nums">
          {material.block_count > 0
            ? `${material.block_count} ${material.block_count === 1 ? "bloque" : "bloques"} útiles`
            : "sin bloques útiles aún"}
          {material.has_children && " · con sub-páginas"}
        </div>
      </div>
    </li>
  );
}
