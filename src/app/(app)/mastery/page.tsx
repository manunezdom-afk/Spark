import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  Activity,
  ArrowRight,
  CheckCircle2,
  FlaskConical,
  Flame,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAllMastery, getTopics } from "@/lib/spark/queries";
import { MasteryBar } from "@/components/mastery/MasteryBar";
import { GradientText } from "@/components/brand/GradientText";
import type { SparkMasteryState, SparkTopic } from "@/modules/spark/types";

export const dynamic = "force-dynamic";

// ── Demo data shown when the user has zero topics + zero mastery ──────────
const DEMO_TOPICS = [
  {
    id: "demo-1",
    title: "Marketing Digital y Redes Sociales",
    category: "Marketing",
    score: 42,
    sessions: 2,
    errors: 3,
    bucket: "risk" as const,
  },
  {
    id: "demo-2",
    title: "Comportamiento del Consumidor",
    category: "Marketing",
    score: 0,
    sessions: 0,
    errors: 0,
    bucket: "untouched" as const,
  },
];

interface TopicSummary {
  topic: SparkTopic;
  mastery: SparkMasteryState | null;
  /** ms hasta la próxima revisión SM-2. Negativo = vencido. */
  dueIn: number | null;
}

export default async function ProgressPage() {
  const db = await getSupabaseServerClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login");

  const [mastery, topics] = await Promise.all([
    getAllMastery(db, user.id),
    getTopics(db, user.id),
  ]);

  const masteryByTopic = new Map(mastery.map((m) => [m.topic_id, m]));
  const now = Date.now();
  const summaries: TopicSummary[] = topics.map((t) => {
    const m = masteryByTopic.get(t.id) ?? null;
    const dueIn = m ? new Date(m.next_review_at).getTime() - now : null;
    return { topic: t, mastery: m, dueIn };
  });

  // Buckets — mutually exclusive, prioritized in this order:
  //   1. Vencidos hoy (dueIn <= 0) → "Atención prioritaria"
  //   2. mastery_score < 40 (entrenado pero débil) → "En riesgo"
  //   3. mastery_score >= 70 (sólido) → "Avanzando"
  //   4. Sin sesiones (mastery null o total_sessions === 0) → "Sin entrenar"
  //   5. Resto → "Otros temas"
  const dueToday: TopicSummary[] = [];
  const atRisk: TopicSummary[] = [];
  const advancing: TopicSummary[] = [];
  const untouched: TopicSummary[] = [];
  const others: TopicSummary[] = [];

  for (const s of summaries) {
    const score = s.mastery?.mastery_score ?? 0;
    const hasMastery = !!s.mastery;
    const isUntouched = !hasMastery || s.mastery!.total_sessions === 0;

    if (hasMastery && s.dueIn !== null && s.dueIn <= 0) {
      dueToday.push(s);
    } else if (hasMastery && !isUntouched && score < 40) {
      atRisk.push(s);
    } else if (hasMastery && !isUntouched && score >= 70) {
      advancing.push(s);
    } else if (isUntouched) {
      untouched.push(s);
    } else {
      others.push(s);
    }
  }

  // Sort buckets meaningfully
  dueToday.sort((a, b) => (a.dueIn ?? 0) - (b.dueIn ?? 0)); // más viejos primero
  atRisk.sort(
    (a, b) => (a.mastery?.mastery_score ?? 0) - (b.mastery?.mastery_score ?? 0),
  );
  advancing.sort(
    (a, b) => (b.mastery?.mastery_score ?? 0) - (a.mastery?.mastery_score ?? 0),
  );
  untouched.sort((a, b) => a.topic.title.localeCompare(b.topic.title));

  const isCompletelyEmpty = topics.length === 0;
  const isFreshAccount = mastery.length === 0; // tiene topics pero ningún entreno

  // Global metrics for the header strip
  const totalTrained = mastery.length;
  const totalDueToday = dueToday.length;
  const avgMastery =
    mastery.length > 0
      ? Math.round(
          mastery.reduce((acc, m) => acc + m.mastery_score, 0) /
            mastery.length,
        )
      : null;

  return (
    <div className="w-full max-w-3xl mx-auto p-6 md:p-12 animate-fade-up">
      <header className="flex flex-col gap-2 mb-8">
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Spark · Progreso
        </span>
        <h1 className="text-display-md md:text-display-lg text-foreground">
          <span className="font-light">Qué entrenar</span>{" "}
          <GradientText italic className="font-light">
            ahora.
          </GradientText>
        </h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
          Cuatro secciones accionables: lo que vence hoy, lo que está flojo, lo
          que ya tienes sólido, y lo que aún no entrenaste.
        </p>
      </header>

      {/* Empty state — no topics at all */}
      {isCompletelyEmpty ? (
        <DemoSection />
      ) : isFreshAccount ? (
        <FreshAccountState topics={topics} />
      ) : (
        <>
          {/* Global metrics strip */}
          <div className="grid grid-cols-3 gap-3 mb-10">
            <MetricTile
              label="Vencen hoy"
              value={totalDueToday}
              tone={totalDueToday > 0 ? "warning" : "neutral"}
              hint={totalDueToday > 0 ? "Empieza por estos" : "Nada urgente"}
            />
            <MetricTile
              label="Entrenados"
              value={`${totalTrained} / ${topics.length}`}
              tone="neutral"
              hint={
                totalTrained === topics.length
                  ? "Todos en juego"
                  : `${topics.length - totalTrained} sin entrenar`
              }
            />
            <MetricTile
              label="Promedio"
              value={avgMastery !== null ? `${avgMastery}%` : "—"}
              tone={
                avgMastery === null
                  ? "neutral"
                  : avgMastery >= 70
                    ? "success"
                    : avgMastery >= 40
                      ? "neutral"
                      : "warning"
              }
              hint={
                avgMastery === null
                  ? "Sin datos aún"
                  : avgMastery >= 70
                    ? "Vas sólido"
                    : avgMastery >= 40
                      ? "En construcción"
                      : "Necesita base"
              }
            />
          </div>

          {/* Buckets */}
          {dueToday.length > 0 && (
            <BucketSection
              title="Atención prioritaria"
              kicker="Vencen hoy según tu repaso espaciado"
              icon={Flame}
              tone="urgent"
              items={dueToday}
            />
          )}

          {atRisk.length > 0 && (
            <BucketSection
              title="En riesgo"
              kicker="Maestría menor al 40% — necesita base"
              icon={AlertCircle}
              tone="warning"
              items={atRisk}
            />
          )}

          {advancing.length > 0 && (
            <BucketSection
              title="Avanzando"
              kicker="Maestría sobre 70% — sube la dificultad"
              icon={TrendingUp}
              tone="success"
              items={advancing}
            />
          )}

          {untouched.length > 0 && (
            <BucketSection
              title="Sin entrenar"
              kicker="Temas que aún no llevan ninguna sesión"
              icon={Sparkles}
              tone="neutral"
              items={untouched}
            />
          )}

          {others.length > 0 && (
            <BucketSection
              title="Otros temas"
              kicker="Maestría intermedia (40–70%)"
              icon={Activity}
              tone="neutral"
              items={others}
            />
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Header metric tile.

function MetricTile({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string | number;
  tone: "success" | "warning" | "urgent" | "neutral";
  hint: string;
}) {
  const colors = {
    success: { fg: "rgb(5 150 105)", bg: "rgb(209 250 229 / 0.5)" },
    warning: { fg: "rgb(217 119 6)", bg: "rgb(254 243 199 / 0.5)" },
    urgent: { fg: "rgb(234 88 12)", bg: "rgb(254 215 170 / 0.4)" },
    neutral: { fg: "rgb(64 64 64)", bg: "rgb(245 245 245 / 0.5)" },
  }[tone];
  return (
    <div
      className="rounded-2xl border border-black/[0.07] p-4 flex flex-col gap-1"
      style={{ background: colors.bg }}
    >
      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      <span
        className="text-[26px] font-semibold leading-none tabular-nums"
        style={{ color: colors.fg }}
      >
        {value}
      </span>
      <span className="text-[10.5px] text-muted-foreground mt-0.5">{hint}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Bucket section: heading + actionable rows.

const TONE_STYLES = {
  urgent: {
    badge: "bg-orange-50 border-orange-200 text-orange-700",
    accent: "rgb(234 88 12)",
  },
  warning: {
    badge: "bg-amber-50 border-amber-200 text-amber-700",
    accent: "rgb(217 119 6)",
  },
  success: {
    badge: "bg-emerald-50 border-emerald-200 text-emerald-700",
    accent: "rgb(5 150 105)",
  },
  neutral: {
    badge: "bg-black/[0.03] border-black/[0.08] text-foreground/70",
    accent: "rgb(64 64 64)",
  },
};

function BucketSection({
  title,
  kicker,
  icon: Icon,
  tone,
  items,
}: {
  title: string;
  kicker: string;
  icon: typeof AlertCircle;
  tone: keyof typeof TONE_STYLES;
  items: TopicSummary[];
}) {
  const style = TONE_STYLES[tone];
  return (
    <section className="mb-10">
      <header className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${style.badge}`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-[15px] font-semibold tracking-tight">
              {title}
            </span>
            <span className="text-[11.5px] text-muted-foreground">{kicker}</span>
          </div>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-[0.14em] ${style.badge}`}
        >
          {items.length} {items.length === 1 ? "tema" : "temas"}
        </span>
      </header>
      <ul className="flex flex-col gap-2">
        {items.map((s) => (
          <TopicRow key={s.topic.id} summary={s} accentColor={style.accent} />
        ))}
      </ul>
    </section>
  );
}

function TopicRow({
  summary,
  accentColor,
}: {
  summary: TopicSummary;
  accentColor: string;
}) {
  const { topic, mastery, dueIn } = summary;
  const score = mastery?.mastery_score ?? 0;
  const sessions = mastery?.total_sessions ?? 0;
  const errors = mastery?.total_errors ?? 0;
  const isUntouched = !mastery || sessions === 0;

  let dueLabel = "—";
  if (mastery && dueIn !== null) {
    const days = Math.ceil(dueIn / (1000 * 60 * 60 * 24));
    if (days <= 0) dueLabel = "Hoy";
    else if (days === 1) dueLabel = "Mañana";
    else dueLabel = `En ${days} días`;
  } else if (isUntouched) {
    dueLabel = "Sin sesiones";
  }

  return (
    <li>
      <Link
        href={
          isUntouched
            ? `/sessions/new?topic_ids=${topic.id}`
            : `/topics/${topic.id}`
        }
        className="group flex items-center gap-4 p-4 rounded-2xl border border-black/[0.06] bg-white/60 hover:bg-white hover:border-black/[0.12] hover:shadow-soft transition-all duration-200"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
            <div className="min-w-0 flex-1">
              {topic.category && (
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                  {topic.category}
                </div>
              )}
              <div className="font-medium text-foreground truncate">
                {topic.title}
              </div>
            </div>
            <span
              className="font-mono text-[10px] uppercase tracking-[0.16em] shrink-0"
              style={{ color: accentColor }}
            >
              {dueLabel}
            </span>
          </div>
          {!isUntouched && <MasteryBar score={score} />}
          <div className="flex items-center gap-3 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mt-1.5">
            {isUntouched ? (
              <span className="text-spark font-medium normal-case tracking-normal">
                Empezar primera sesión →
              </span>
            ) : (
              <>
                <span>
                  {sessions} {sessions === 1 ? "sesión" : "sesiones"}
                </span>
                <span>·</span>
                <span>
                  {errors} {errors === 1 ? "error" : "errores"}
                </span>
              </>
            )}
          </div>
        </div>
        <ArrowRight
          className="w-4 h-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0"
          strokeWidth={1.75}
        />
      </Link>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
// Empty states.

function DemoSection() {
  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-black/[0.07] bg-white/60 px-4 py-3 mb-6 sm:flex-row sm:items-center sm:gap-4">
        <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-spark/20 bg-spark/[0.08] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-spark">
          <FlaskConical className="h-3 w-3" strokeWidth={1.5} />
          Ejemplos
        </span>
        <p className="flex-1 text-xs leading-relaxed text-muted-foreground">
          Así se ve tu progreso después de entrenar. Crea tu primer tema para
          empezar a medir el tuyo.
        </p>
        <Link
          href="/topics"
          className="shrink-0 rounded-lg border border-black/[0.08] bg-white/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-black/[0.14] hover:text-foreground"
        >
          Ir a Temas →
        </Link>
      </div>
      <ul className="flex flex-col gap-2 opacity-70">
        {DEMO_TOPICS.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-4 p-4 rounded-2xl border border-black/[0.06] bg-white/60"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 mb-1.5">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                    {d.category}
                  </div>
                  <div className="font-medium text-foreground truncate">
                    {d.title}
                  </div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] shrink-0 text-muted-foreground">
                  Hoy
                </span>
              </div>
              <MasteryBar score={d.score} />
              <div className="flex items-center gap-3 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mt-1.5">
                <span>{d.sessions} sesiones</span>
                <span>·</span>
                <span>{d.errors} errores</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function FreshAccountState({ topics }: { topics: SparkTopic[] }) {
  return (
    <div className="rounded-3xl border border-black/[0.07] bg-white/70 p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-spark/10 border border-spark/20 mb-4">
        <CheckCircle2 className="w-5 h-5 text-spark" strokeWidth={1.7} />
      </div>
      <h2 className="text-lg font-semibold tracking-tight mb-2">
        Tienes {topics.length} {topics.length === 1 ? "tema creado" : "temas creados"}
      </h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed mb-5">
        Aún no has entrenado ninguno. Cuando hagas tu primera sesión, vas a ver
        aquí lo que vence, lo que está flojo y lo que ya tienes sólido.
      </p>
      <Link
        href={`/sessions/new?topic_ids=${topics[0].id}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-spark text-white text-[13px] font-semibold hover:scale-[1.02] transition-transform"
      >
        Empezar primera sesión
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
      </Link>
    </div>
  );
}
