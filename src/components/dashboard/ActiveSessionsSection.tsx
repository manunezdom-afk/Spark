"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Trash2, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { formatRelativeTime } from "@/lib/spark/recommendation";
import { hexToRgba } from "@/lib/utils/color";
import type { SparkLearningSession, SparkTopic } from "@/modules/spark/types";

export function ActiveSessionsSection({
  initialSessions,
  topics,
}: {
  initialSessions: SparkLearningSession[];
  topics: SparkTopic[];
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SparkLearningSession[]>(initialSessions);
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta sesión? Los datos de progreso acumulados en ella se perderán.")) {
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al eliminar");
      }

      setSessions((prev) => prev.filter((s) => s.id !== id));
      toast.success("Sesión eliminada con éxito");
      
      // Refresh server components (e.g. badge status, weekly metrics)
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("¿Seguro que deseas eliminar TODAS las sesiones activas? Se borrará todo tu historial de sesiones en curso de forma permanente.")) {
      return;
    }

    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: {
          "x-confirm": "clear-all-sessions",
        },
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Error al limpiar sesiones");
      }

      setSessions([]);
      toast.success("Todas las sesiones activas fueron eliminadas");
      
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al limpiar");
    }
  };

  if (sessions.length === 0) return null;

  return (
    <section className="mb-10 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[13px] font-medium text-ink-secondary tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-spark animate-pulse" strokeWidth={1.5} />
          Continuar donde lo dejaste
          <span className="text-ink-tertiary font-normal">
            ({sessions.length} activas)
          </span>
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Delete All active sessions button */}
          <button
            onClick={handleDeleteAll}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-600 border border-rose-500/15 bg-rose-500/[0.03] px-2.5 py-1 rounded-full hover:bg-rose-500/10 hover:border-rose-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            title="Eliminar todas las sesiones en curso"
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" strokeWidth={1.5} />
            ) : (
              <Trash2 className="w-3 h-3" strokeWidth={1.5} />
            )}
            Eliminar todas
          </button>

          {sessions.length > 3 && (
            <Link
              href="/sessions"
              className="text-[12px] font-medium text-ink-tertiary hover:text-ink transition-colors inline-flex items-center gap-1"
            >
              Ver todas
              <ArrowRight className="w-3 h-3" strokeWidth={1.5} />
            </Link>
          )}
        </div>
      </div>
      
      <ul className="flex flex-col gap-2">
        {sessions.slice(0, 3).map((s) => (
          <ActiveSessionRow
            key={s.id}
            session={s}
            topics={topics}
            onDelete={handleDelete}
          />
        ))}
      </ul>
    </section>
  );
}

function ActiveSessionRow({
  session,
  topics,
  onDelete,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  onDelete: (id: string) => void;
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
      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-black/[0.06] bg-white/55 hover:bg-white hover:border-black/[0.12] hover:scale-[1.005] active:scale-[0.995] transition-all duration-300 ease-spring group relative overflow-hidden"
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
      
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-[12px] font-semibold inline-flex items-center gap-1 transition-all duration-300 opacity-90 group-hover:opacity-100 mr-1"
          style={{ color: theme.accent }}
        >
          Continuar
          <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.5} />
        </span>

        {/* Delete specific session button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(session.id);
          }}
          className="w-8 h-8 rounded-lg border border-transparent hover:border-rose-500/25 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-all duration-300 flex items-center justify-center relative z-10"
          title="Eliminar sesión"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </Link>
  );
}
