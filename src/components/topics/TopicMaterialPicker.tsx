"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  ChevronDown,
  CornerDownRight,
  FileText,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type { LearningEngine, SparkTopic, TopicMaterial } from "@/modules/spark/types";

/**
 * "Material específico" picker. Lets the user scope a session to a
 * concrete apunte/subpágina inside a topic instead of studying the
 * whole subject. Loads materials from `/api/topics/[id]/materials`
 * the moment the user selects a topic.
 *
 * UX rules:
 *   • The first option is always "Usar toda la materia" (default
 *     behavior). When checked, all individual materials are disabled.
 *   • Selecting a parent auto-selects its children. Deselecting a
 *     parent also unticks them. Children can also be picked alone.
 *   • If a topic has no Kairos sessions wired, we show an empty
 *     state pointing back to Kairos.
 *   • If the user picked multiple topics, this picker is hidden:
 *     filtering across topics gets confusing fast and the bridge
 *     methods (Conectar temas) need the full breadth anyway.
 */
export function TopicMaterialPicker({
  topic,
  engine,
  selected,
  onChange,
}: {
  topic: SparkTopic;
  engine: LearningEngine;
  /** Currently selected Kairos session ids. Empty = use full subject. */
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [materials, setMaterials] = useState<TopicMaterial[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  const theme = getEngineTheme(engine);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/topics/${topic.id}/materials`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setMaterials(data.materials ?? []);
      })
      .catch(() => {
        if (!cancelled) setError("No se pudieron cargar los materiales del tema.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [topic.id]);

  // Map: parent_id → list of children. Used to auto-toggle descendants
  // when the user clicks a parent.
  const childrenByParent = useMemo(() => {
    const map = new Map<string, TopicMaterial[]>();
    for (const m of materials ?? []) {
      if (m.parent_id) {
        const list = map.get(m.parent_id) ?? [];
        list.push(m);
        map.set(m.parent_id, list);
      }
    }
    return map;
  }, [materials]);

  const useAll = selected.size === 0;
  const total = materials?.length ?? 0;

  function descendantsOf(id: string): string[] {
    const acc: string[] = [];
    const stack = [id];
    while (stack.length) {
      const cur = stack.pop()!;
      const kids = childrenByParent.get(cur) ?? [];
      for (const k of kids) {
        acc.push(k.id);
        stack.push(k.id);
      }
    }
    return acc;
  }

  function toggleMaterial(id: string) {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
      // Cascade: unticking a parent clears its descendants too.
      for (const d of descendantsOf(id)) next.delete(d);
    } else {
      next.add(id);
      // Cascade: ticking a parent auto-includes its descendants. The
      // user can manually untick individual children afterwards.
      for (const d of descendantsOf(id)) next.add(d);
    }
    onChange(next);
  }

  function selectAll() {
    onChange(new Set());
  }

  const wrapperStyle = {
    "--engine-accent": theme.accent,
  } as CSSProperties;

  return (
    <div
      className="rounded-2xl border bg-white/65 overflow-hidden"
      style={{
        ...wrapperStyle,
        borderColor: hexToRgba(theme.accent, 0.22),
        boxShadow: `0 6px 18px ${hexToRgba(theme.accent, 0.08)}`,
      }}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        style={{
          background: `linear-gradient(to right, ${hexToRgba(theme.accent, 0.10)}, transparent)`,
        }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
            style={{
              background: hexToRgba(theme.accent, 0.14),
              color: theme.accent,
            }}
          >
            <Layers className="w-4 h-4" strokeWidth={1.7} />
          </span>
          <div className="flex flex-col min-w-0">
            <span
              className="font-mono text-[10px] uppercase tracking-[0.18em]"
              style={{ color: theme.accent }}
            >
              Material para esta sesión
            </span>
            <span className="text-[13px] font-medium text-foreground truncate">
              {useAll
                ? `Toda la materia · ${topic.title}`
                : `${selected.size} ${selected.size === 1 ? "apunte" : "apuntes"} seleccionados`}
            </span>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            collapsed && "-rotate-90",
          )}
          strokeWidth={1.7}
        />
      </button>

      {!collapsed && (
        <div className="p-3 flex flex-col gap-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground px-2 py-3">
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.7} />
              Buscando apuntes en {topic.title}…
            </div>
          ) : error ? (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {error}
            </div>
          ) : total === 0 ? (
            <EmptyMaterials topicTitle={topic.title} />
          ) : (
            <>
              <UseFullToggle
                label="Usar toda la materia"
                description={`Sin filtros · ${total} ${total === 1 ? "apunte" : "apuntes"} disponibles`}
                active={useAll}
                accent={theme.accent}
                onClick={selectAll}
              />
              <div className="h-px bg-black/[0.06] mx-1" />
              <ul className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
                {(materials ?? []).map((m) => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    accent={theme.accent}
                    selected={selected.has(m.id)}
                    disabled={false}
                    onToggle={() => toggleMaterial(m.id)}
                  />
                ))}
              </ul>
              {!useAll && selected.size === 0 && (
                <p className="text-[11px] text-muted-foreground px-2 mt-1">
                  Marca al menos un apunte o vuelve a "Usar toda la materia".
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function UseFullToggle({
  label,
  description,
  active,
  accent,
  onClick,
}: {
  label: string;
  description: string;
  active: boolean;
  accent: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full px-3 py-2.5 rounded-xl border transition-colors"
      style={{
        background: active ? hexToRgba(accent, 0.08) : "rgba(255,255,255,0.5)",
        borderColor: active ? hexToRgba(accent, 0.4) : "rgba(0,0,0,0.07)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "inline-flex items-center justify-center w-5 h-5 rounded-md border shrink-0",
            "transition-colors",
          )}
          style={
            active
              ? { background: accent, borderColor: accent, color: "#fff" }
              : { borderColor: "rgba(0,0,0,0.18)" }
          }
        >
          {active && <Sparkles className="w-3 h-3" strokeWidth={2.4} />}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] font-medium text-foreground">{label}</span>
          <span className="text-[11px] text-muted-foreground">{description}</span>
        </div>
      </div>
    </button>
  );
}

function MaterialRow({
  material,
  accent,
  selected,
  disabled,
  onToggle,
}: {
  material: TopicMaterial;
  accent: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  const isChild = material.parent_id !== null;
  const blockTotal = material.block_count + material.extraction_count;

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className={cn(
          "w-full text-left px-3 py-2.5 rounded-xl border transition-colors flex items-start gap-2.5",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-white",
        )}
        style={{
          background: selected ? hexToRgba(accent, 0.06) : "rgba(255,255,255,0.5)",
          borderColor: selected ? hexToRgba(accent, 0.42) : "rgba(0,0,0,0.06)",
          marginLeft: isChild ? 18 : 0,
        }}
      >
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-md border shrink-0 mt-0.5 transition-colors"
          style={
            selected
              ? { background: accent, borderColor: accent, color: "#fff" }
              : { borderColor: "rgba(0,0,0,0.18)" }
          }
        >
          {selected && <span className="block w-2 h-2 rounded-sm bg-white" />}
        </span>
        {isChild && (
          <CornerDownRight
            className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-1"
            strokeWidth={1.7}
          />
        )}
        {!isChild && (
          <FileText
            className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 mt-1"
            strokeWidth={1.7}
          />
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-[13px] font-medium text-foreground truncate">
            {material.title || "(sin título)"}
          </span>
          <span className="text-[10.5px] text-muted-foreground flex items-center gap-2 mt-0.5">
            {material.date && <span>{formatDate(material.date)}</span>}
            {material.date && blockTotal > 0 && <span className="opacity-40">·</span>}
            {blockTotal > 0 && (
              <span>
                {blockTotal} {blockTotal === 1 ? "bloque útil" : "bloques útiles"}
              </span>
            )}
            {material.has_children && (
              <>
                <span className="opacity-40">·</span>
                <span>incluye subpáginas</span>
              </>
            )}
          </span>
        </div>
      </button>
    </li>
  );
}

function EmptyMaterials({ topicTitle }: { topicTitle: string }) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-black/[0.06] bg-white/60">
      <span className="text-[13px] font-medium text-foreground">
        Esta materia todavía no tiene apuntes específicos.
      </span>
      <span className="text-[12px] text-muted-foreground leading-relaxed">
        Cuando importes apuntes desde Kairos para "{topicTitle}", podrás
        elegir solo una subpágina o sección concreta para entrenar. Por ahora
        la sesión usa todo el material disponible del tema.
      </span>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString("es", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
