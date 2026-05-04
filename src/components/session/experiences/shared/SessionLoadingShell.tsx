"use client";

import { SessionShell } from "../../SessionShell";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type {
  LearningEngine,
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

/**
 * Pantalla de carga de una sesión activa. Se muestra hasta que llega
 * el primer assistant turn de Nova (la "apertura" de la actividad),
 * para evitar que el usuario vea el panel principal sin contenido
 * mientras Nova genera su primera respuesta.
 *
 * Usa el mismo SessionShell que la experiencia final, así no hay
 * salto de chrome entre loading y contenido. Solo cambia el cuerpo:
 * un hero centrado con el icono del método, un texto de "Preparando…"
 * con copy por engine, 3 dots animados como progress, y un par de
 * skeleton cards que insinúan el layout final.
 *
 * IMPORTANTE: deliberadamente NO mostramos el streamingText vivo de
 * Nova. Aunque era un nice-to-have, en la práctica el usuario lo
 * percibe como "la actividad se está construyendo a la vista", que
 * es exactamente lo que queremos evitar. Mejor mostrar un loading
 * limpio que la cocina abierta.
 */
export function SessionLoadingShell({
  session,
  topics,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
}) {
  const theme = getEngineTheme(session.engine);
  const Icon = theme.Icon;
  const copy = LOADING_COPY[session.engine] ?? LOADING_COPY_FALLBACK;

  return (
    <SessionShell
      engine={session.engine}
      topics={topics}
      status="active"
      canComplete={false}
    >
      <div className="flex flex-col items-center justify-center min-h-[55vh] px-6 py-12 max-w-3xl mx-auto w-full">
        {/* Icono con halo del theme */}
        <div className="relative mb-7">
          <div
            className="absolute inset-0 rounded-3xl blur-2xl"
            style={{
              background: theme.stageGlow,
              opacity: 0.45,
              transform: "scale(1.4)",
            }}
            aria-hidden
          />
          <div
            className="relative w-[72px] h-[72px] rounded-3xl flex items-center justify-center border bg-white/80 backdrop-blur-sm spark-loading-pulse"
            style={{
              borderColor: hexToRgba(theme.accent, 0.32),
              boxShadow: `0 8px 32px ${hexToRgba(theme.accent, 0.12)}`,
            }}
          >
            <Icon
              className="w-8 h-8"
              strokeWidth={1.6}
              style={{ color: theme.accent }}
            />
          </div>
        </div>

        {/* Kicker */}
        <div
          className="font-mono text-[10px] uppercase tracking-[0.18em] mb-3"
          style={{ color: theme.accent }}
        >
          {ENGINE_LABELS[session.engine]} · {theme.streamingLabel}
        </div>

        {/* Título */}
        <h2 className="text-2xl md:text-[28px] font-semibold tracking-tight text-foreground mb-2.5 text-center leading-tight">
          Preparando tu sesión…
        </h2>

        {/* Subtítulo por engine */}
        <p className="text-[14px] text-muted-foreground max-w-md text-center leading-relaxed mb-8">
          {copy}
        </p>

        {/* 3 dots animados — sin preview del stream */}
        <div className="flex items-center gap-2 mb-8" aria-label="Cargando">
          <span
            className="w-2 h-2 rounded-full spark-loading-dot"
            style={{ background: theme.accent }}
          />
          <span
            className="w-2 h-2 rounded-full spark-loading-dot"
            style={{ background: theme.accent, animationDelay: "0.2s" }}
          />
          <span
            className="w-2 h-2 rounded-full spark-loading-dot"
            style={{ background: theme.accent, animationDelay: "0.4s" }}
          />
        </div>

        {/* Skeleton: 1 card grande + 1 lateral angosto, alusivo al layout final */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 w-full">
          <div
            className="h-[140px] rounded-3xl border bg-white/40 backdrop-blur-sm spark-loading-shimmer"
            style={{ borderColor: hexToRgba(theme.accent, 0.12) }}
            aria-hidden
          />
          <div
            className="hidden lg:block h-[140px] rounded-3xl border bg-white/30 backdrop-blur-sm spark-loading-shimmer"
            style={{
              borderColor: hexToRgba(theme.accent, 0.10),
              animationDelay: "0.15s",
            }}
            aria-hidden
          />
        </div>
      </div>

      {/* Animaciones: pulse suave del icono, dots, shimmer del skeleton */}
      <style>{`
        @keyframes spark-loading-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes spark-loading-dot {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.85); }
          30% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes spark-loading-shimmer {
          0% { opacity: 0.55; }
          50% { opacity: 0.85; }
          100% { opacity: 0.55; }
        }
        .spark-loading-pulse { animation: spark-loading-pulse 2.4s ease-in-out infinite; }
        .spark-loading-dot { animation: spark-loading-dot 1.4s ease-in-out infinite; }
        .spark-loading-shimmer { animation: spark-loading-shimmer 2.2s ease-in-out infinite; }
      `}</style>
    </SessionShell>
  );
}

// ─────────────────────────────────────────────────────────────
// Copy por método. Cada uno refleja la personalidad de la actividad
// para que el loading se sienta del método correcto, no genérico.

const LOADING_COPY: Record<LearningEngine, string> = {
  socratic:
    "Construyendo las preguntas que te van a llevar al porqué del concepto.",
  debugger:
    "Plantando los errores escondidos en un texto plausible. Tu trabajo: cazarlos.",
  devils_advocate:
    "Afilando las objeciones para atacar el flanco más débil de tu postura.",
  bridge_builder:
    "Mapeando los conceptos para encontrar conexiones que no son obvias.",
  roleplay:
    "Armando la escena del caso. En un momento entras al personaje.",
  test_alternativas:
    "Generando preguntas para tu prueba con corrección automática.",
  test_desarrollo:
    "Generando preguntas para tu prueba con evaluación por IA.",
};

const LOADING_COPY_FALLBACK = "Nova está preparando la actividad.";

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
