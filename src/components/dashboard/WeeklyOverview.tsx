import { Activity, Calendar, Clock, Flame } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { computeWeeklyStats } from "@/lib/spark/weekly-stats";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { InfoIcon } from "@/components/ui/info-icon";

interface WeeklyOverviewProps {
  userId: string;
}

/**
 * 4 métricas agregadas + heatmap 12 semanas. Server component:
 * resuelve sus propios datos para no obligar al dashboard a hacer las
 * queries. Si el usuario aún no tiene sesiones completadas, muestra
 * un estado vacío con el texto correcto.
 */
export async function WeeklyOverview({ userId }: WeeklyOverviewProps) {
  const db = await getSupabaseServerClient();
  const stats = await computeWeeklyStats(db, userId);
  const hasData = stats.completed_count > 0;

  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white/65 backdrop-blur-sm p-5 md:p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
        <Metric
          icon={<Flame className="w-4 h-4" strokeWidth={1.5} />}
          label="Racha"
          value={`${stats.streak} ${stats.streak === 1 ? "día" : "días"}`}
          tone={stats.streak > 0 ? "spark" : "neutral"}
          hint="Días consecutivos terminando hoy con al menos una sesión completada."
        />
        <Metric
          icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
          label="Esta semana"
          value={`${stats.sessions_this_week}`}
          tone="neutral"
          hint="Sesiones completadas en los últimos 7 días."
        />
        <Metric
          icon={<Clock className="w-4 h-4" strokeWidth={1.5} />}
          label="Tiempo total"
          value={formatMinutes(stats.total_minutes_estimate)}
          tone="neutral"
          hint="Estimación basada en cantidad de turnos. Aproximación, no cronómetro."
        />
        <Metric
          icon={<Activity className="w-4 h-4" strokeWidth={1.5} />}
          label="Maestría promedio"
          value={
            stats.mastery_avg === null ? "—" : `${stats.mastery_avg}%`
          }
          tone={
            stats.mastery_avg !== null && stats.mastery_avg >= 70
              ? "spark"
              : "neutral"
          }
          hint="Promedio de maestría a través de todos tus temas con al menos una sesión."
        />
      </div>

      {hasData ? (
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="font-medium text-[11px] text-muted-foreground/70">
              Últimas 12 semanas
            </div>
            <ActivityHeatmap data={stats.heatmap} weeks={12} />
          </div>
          <div className="font-medium flex items-center gap-2 text-[11px] text-muted-foreground/60">
            <span>Menos</span>
            <span className="block w-[11px] h-[11px] rounded-[3px] bg-black/[0.05]" />
            <span className="block w-[11px] h-[11px] rounded-[3px] bg-spark/30" />
            <span className="block w-[11px] h-[11px] rounded-[3px] bg-spark/55" />
            <span className="block w-[11px] h-[11px] rounded-[3px] bg-spark/75" />
            <span className="block w-[11px] h-[11px] rounded-[3px] bg-spark" />
            <span>Más</span>
          </div>
        </div>
      ) : (
        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
          Cuando completes tu primera sesión, aparecerá tu racha y un mapa de actividad de las últimas 12 semanas.
        </p>
      )}
    </div>
  );
}

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "spark" | "neutral";
  hint: string;
}

function Metric({ icon, label, value, tone, hint }: MetricProps) {
  const accent =
    tone === "spark"
      ? "text-spark border-spark/25 bg-spark/5"
      : "text-foreground/70 border-black/[0.07] bg-white/40";
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${accent}`}
        >
          {icon}
        </span>
        <span className="font-medium text-[11px] text-muted-foreground inline-flex items-center gap-1">
          {label}
          <InfoIcon hint={hint} size="sm" />
        </span>
      </div>
      <div className="text-[20px] md:text-[22px] font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  );
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}
