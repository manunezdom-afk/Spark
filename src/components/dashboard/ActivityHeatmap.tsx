"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils/cn";

interface HeatmapCell {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: HeatmapCell[];
  /** Cantidad de columnas a renderizar (semanas). Default 12. */
  weeks?: number;
}

/**
 * Heatmap GitHub-style: 7 filas (días de la semana) × N columnas (semanas).
 * `data` debe llegar en orden cronológico ascendente — el último elemento
 * es HOY, en la esquina inferior derecha. Si data tiene más de 7×weeks,
 * se recortan los días iniciales.
 */
export function ActivityHeatmap({ data, weeks = 12 }: ActivityHeatmapProps) {
  const cells = weeks * 7;
  const series = data.slice(-cells);
  while (series.length < cells) {
    series.unshift({ date: "", count: 0 });
  }

  // Reorganizar a [columna][día] — días: 0=Lun, 6=Dom
  const grid: HeatmapCell[][] = Array.from({ length: weeks }, () => []);
  for (let i = 0; i < series.length; i += 1) {
    const week = Math.floor(i / 7);
    grid[week].push(series[i]);
  }

  return (
    <div className="flex items-end gap-[3px]">
      {grid.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((cell, di) => (
            <HeatCell key={`${wi}-${di}`} cell={cell} />
          ))}
        </div>
      ))}
    </div>
  );
}

function HeatCell({ cell }: { cell: HeatmapCell }) {
  const tone = countToTone(cell.count);
  const empty = !cell.date;
  return (
    <Tooltip delayDuration={120}>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "block w-[11px] h-[11px] rounded-[3px] border border-black/[0.04]",
            empty && "opacity-0",
            !empty && tone
          )}
          aria-label={
            empty
              ? "sin datos"
              : `${cell.count} ${cell.count === 1 ? "sesión" : "sesiones"} el ${cell.date}`
          }
        />
      </TooltipTrigger>
      {!empty && (
        <TooltipContent side="top">
          <span className="font-medium text-[11px]">
            {formatDateES(cell.date)}
          </span>
          <span className="block">
            {cell.count === 0
              ? "Sin sesiones"
              : `${cell.count} ${cell.count === 1 ? "sesión" : "sesiones"}`}
          </span>
        </TooltipContent>
      )}
    </Tooltip>
  );
}

function countToTone(count: number): string {
  if (count === 0) return "bg-black/[0.05]";
  if (count === 1) return "bg-spark/30";
  if (count === 2) return "bg-spark/55";
  if (count === 3) return "bg-spark/75";
  return "bg-spark";
}

function formatDateES(ymd: string): string {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
