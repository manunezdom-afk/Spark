"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, MoreHorizontal, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import type {
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

/**
 * Lista de sesiones con eliminación (individual y bulk). Espera ya
 * agrupadas las sesiones por estado para reducir trabajo en cliente.
 *
 * Comportamiento:
 *   - Cada fila tiene menú "···" oculto en idle, visible en hover/focus,
 *     que despliega "Eliminar" — primer click pide confirmación inline,
 *     segundo borra. Sin modal porque es una sola fila.
 *   - "Limpiar todas" arriba abre Dialog modal con confirmación explícita
 *     (acción destructiva masiva: requiere doble confirmación).
 */
export function SessionsList({
  active,
  completed,
  abandoned,
  topicById,
}: {
  active: SparkLearningSession[];
  completed: SparkLearningSession[];
  abandoned: SparkLearningSession[];
  topicById: Map<string, SparkTopic>;
}) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [, startTransition] = useTransition();

  // Estado optimista local: ids ya borradas que filtramos del render hasta
  // que el router refresh propague. Evita "fantasma" si la lista server-side
  // tarda en refrescar.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visible = (list: SparkLearningSession[]) =>
    list.filter((s) => !removedIds.has(s.id));

  const visibleActive = visible(active);
  const visibleCompleted = visible(completed);
  const visibleAbandoned = visible(abandoned);
  const totalVisible =
    visibleActive.length + visibleCompleted.length + visibleAbandoned.length;

  async function deleteOne(id: string) {
    if (removingId) return;
    setRemovingId(id);
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo eliminar");
      }
      setRemovedIds((prev) => new Set(prev).add(id));
      setConfirmId(null);
      toast.success("Sesión eliminada");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setRemovingId(null);
    }
  }

  async function deleteAll() {
    if (bulkBusy) return;
    setBulkBusy(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "DELETE",
        headers: { "x-confirm": "clear-all-sessions" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "No se pudo limpiar el historial");
      }
      const body = (await res.json()) as { removed: number };
      const allIds = [...active, ...completed, ...abandoned].map((s) => s.id);
      setRemovedIds(new Set(allIds));
      setBulkOpen(false);
      toast.success(
        body.removed === 1
          ? "1 sesión eliminada"
          : `${body.removed} sesiones eliminadas`,
      );
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally {
      setBulkBusy(false);
    }
  }

  return (
    <>
      {totalVisible > 0 && (
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setBulkOpen(true)}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground hover:text-rose-600 transition-colors group"
          >
            <Trash2
              className="w-3.5 h-3.5 transition-transform group-hover:-rotate-6"
              strokeWidth={1.75}
            />
            Limpiar historial
          </button>
        </div>
      )}

      <div className="flex flex-col gap-10">
        {visibleActive.length > 0 && (
          <Group
            icon={<PlayCircle className="w-3.5 h-3.5" strokeWidth={1.75} />}
            title="Abiertas"
            tone="spark"
          >
            {visibleActive.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                topics={s.topic_ids
                  .map((id) => topicById.get(id))
                  .filter((t): t is SparkTopic => !!t)}
                isConfirming={confirmId === s.id}
                isRemoving={removingId === s.id}
                onAskConfirm={() => setConfirmId(s.id)}
                onCancelConfirm={() => setConfirmId(null)}
                onConfirmDelete={() => deleteOne(s.id)}
              />
            ))}
          </Group>
        )}

        {visibleCompleted.length > 0 && (
          <Group
            icon={<Clock className="w-3.5 h-3.5" strokeWidth={1.75} />}
            title="Completadas"
            tone="muted"
          >
            {visibleCompleted.slice(0, 25).map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                topics={s.topic_ids
                  .map((id) => topicById.get(id))
                  .filter((t): t is SparkTopic => !!t)}
                isConfirming={confirmId === s.id}
                isRemoving={removingId === s.id}
                onAskConfirm={() => setConfirmId(s.id)}
                onCancelConfirm={() => setConfirmId(null)}
                onConfirmDelete={() => deleteOne(s.id)}
              />
            ))}
          </Group>
        )}

        {visibleAbandoned.length > 0 && (
          <Group
            icon={<Clock className="w-3.5 h-3.5" strokeWidth={1.75} />}
            title="Abandonadas"
            tone="muted"
          >
            {visibleAbandoned.slice(0, 10).map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                topics={s.topic_ids
                  .map((id) => topicById.get(id))
                  .filter((t): t is SparkTopic => !!t)}
                isConfirming={confirmId === s.id}
                isRemoving={removingId === s.id}
                onAskConfirm={() => setConfirmId(s.id)}
                onCancelConfirm={() => setConfirmId(null)}
                onConfirmDelete={() => deleteOne(s.id)}
              />
            ))}
          </Group>
        )}
      </div>

      <Dialog open={bulkOpen} onOpenChange={(o) => !bulkBusy && setBulkOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpiar todo el historial</DialogTitle>
            <DialogDescription>
              Vas a eliminar {totalVisible}{" "}
              {totalVisible === 1 ? "sesión" : "sesiones"} y todas sus
              respuestas asociadas. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setBulkOpen(false)}
              disabled={bulkBusy}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void deleteAll()}
              disabled={bulkBusy}
            >
              {bulkBusy ? "Eliminando…" : "Sí, eliminar todas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Group({
  icon,
  title,
  tone,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  tone: "spark" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`font-mono text-[11px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 ${
          tone === "spark" ? "text-spark" : "text-muted-foreground/70"
        }`}
      >
        {icon}
        {title}
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function SessionRow({
  session,
  topics,
  isConfirming,
  isRemoving,
  onAskConfirm,
  onCancelConfirm,
  onConfirmDelete,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  isConfirming: boolean;
  isRemoving: boolean;
  onAskConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirmDelete: () => void;
}) {
  const isTest =
    session.engine === "test_alternativas" ||
    session.engine === "test_desarrollo";
  const href = isTest
    ? session.status === "completed"
      ? `/tests/${session.id}/results`
      : session.status === "active"
        ? `/tests/${session.id}/take`
        : `/tests/new`
    : `/sessions/${session.id}`;

  const titles =
    topics.length > 0
      ? topics.map((t) => t.title).join(" · ")
      : "Tema borrado";

  return (
    <li
      className={`relative group rounded-2xl border border-black/[0.06] bg-white/60 hover:bg-white hover:border-black/[0.10] transition-colors ${
        isRemoving ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-center gap-2 pr-2">
        <Link
          href={href}
          className="flex-1 flex items-center justify-between gap-3 p-4 text-sm min-w-0"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0">
              {ENGINE_LABELS[session.engine]}
            </span>
            <span className="text-sm font-medium text-foreground/90 truncate">
              {titles}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {new Date(session.started_at).toLocaleDateString("es", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span
              className={`text-[10px] uppercase tracking-[0.14em] font-mono ${
                session.status === "completed"
                  ? "text-emerald-600"
                  : session.status === "active"
                    ? "text-spark"
                    : "text-muted-foreground"
              }`}
            >
              {session.status === "completed"
                ? `${session.score ?? 0}%`
                : session.status === "active"
                  ? "En curso"
                  : "Abandonada"}
            </span>
          </div>
        </Link>
        <RowMenu
          isConfirming={isConfirming}
          isRemoving={isRemoving}
          onAskConfirm={onAskConfirm}
          onCancelConfirm={onCancelConfirm}
          onConfirmDelete={onConfirmDelete}
        />
      </div>
    </li>
  );
}

function RowMenu({
  isConfirming,
  isRemoving,
  onAskConfirm,
  onCancelConfirm,
  onConfirmDelete,
}: {
  isConfirming: boolean;
  isRemoving: boolean;
  onAskConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirmDelete: () => void;
}) {
  if (isConfirming) {
    return (
      <div className="flex items-center gap-1.5 shrink-0 pr-1">
        <button
          onClick={onConfirmDelete}
          disabled={isRemoving}
          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-50"
          aria-label="Confirmar eliminación"
        >
          {isRemoving ? "…" : "Eliminar"}
        </button>
        <button
          onClick={onCancelConfirm}
          disabled={isRemoving}
          className="text-[11px] font-medium text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-black/[0.04] transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    );
  }
  return (
    <button
      onClick={onAskConfirm}
      aria-label="Eliminar sesión"
      className="shrink-0 w-8 h-8 grid place-items-center rounded-lg text-muted-foreground/40 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
    >
      <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
    </button>
  );
}
