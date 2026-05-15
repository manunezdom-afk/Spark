"use client";

import Link from "next/link";
import {
  ClipboardList,
  RefreshCw,
  HelpCircle,
  Drama,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * IntentActions — entry point intent-first del dashboard.
 *
 * El alumno no debería empezar pensando en métodos ("¿qué es Cazar
 * errores?") sino en su necesidad real ("Tengo prueba", "No entiendo X").
 * Esta componente traduce intent → ruta:
 *
 *   prueba    → /tests/new                     (genera prueba simulada)
 *   repaso    → /sessions/new?intent=repaso    (Spark elige método según mastery)
 *   aprender  → /sessions/new?intent=aprender  (preguntas guiadas, base)
 *   practicar → /sessions/new?intent=practicar (caso real con personaje)
 *
 * Si el usuario aún no tiene temas, todos llevan a /topics para crear el primero.
 */

interface Intent {
  key: "prueba" | "repaso" | "aprender" | "practicar";
  title: string;
  blurb: string;
  icon: LucideIcon;
  /** Color accent del icono — debe coordinarse con el tono del intent */
  accent: string;
  accentSoft: string;
  /** Marca el intent recomendado por defecto (visualmente destacado) */
  recommended?: boolean;
}

const INTENTS: Intent[] = [
  {
    key: "prueba",
    title: "Tengo prueba",
    blurb: "Genera una simulación con corrección automática.",
    icon: ClipboardList,
    accent: "#16A34A",
    accentSoft: "rgba(22,163,74,0.08)",
  },
  {
    key: "repaso",
    title: "Quiero repasar",
    blurb: "Spark elige el método según lo que más te cuesta.",
    icon: RefreshCw,
    accent: "#FF8A4C",
    accentSoft: "rgba(255,138,76,0.10)",
    recommended: true,
  },
  {
    key: "aprender",
    title: "No entiendo un tema",
    blurb: "Preguntas guiadas para construir la base desde cero.",
    icon: HelpCircle,
    accent: "#8B5CF6",
    accentSoft: "rgba(139,92,246,0.08)",
  },
  {
    key: "practicar",
    title: "Quiero practicar",
    blurb: "Aplica lo que sabes en un caso real con personaje.",
    icon: Drama,
    accent: "#D97706",
    accentSoft: "rgba(217,119,6,0.08)",
  },
];

export function IntentActions({ canCreateSession }: { canCreateSession: boolean }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {INTENTS.map((intent, i) => {
        const Icon = intent.icon;
        const href = !canCreateSession
          ? "/topics"
          : intent.key === "prueba"
            ? "/tests/new"
            : `/sessions/new?intent=${intent.key}`;
        return (
          <Link
            key={intent.key}
            href={href}
            className={cn(
              "group relative flex items-start gap-4 p-5 rounded-2xl border bg-white transition-all duration-200",
              "hover:-translate-y-px hover:shadow-lift",
              intent.recommended
                ? "border-spark/35 shadow-soft"
                : "border-black/[0.05] shadow-soft"
            )}
            style={{
              animation: `fade-up 320ms ${i * 50}ms ease-out both`,
            }}
          >
            {intent.recommended && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-spark-soft border border-spark/20 px-2 py-0.5 text-[10px] font-medium text-spark-deep">
                Sugerido
              </span>
            )}
            <span
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-transform group-hover:scale-105"
              style={{
                background: intent.accentSoft,
                color: intent.accent,
              }}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[15px] font-medium text-ink leading-tight">
                  {intent.title}
                </span>
                <ArrowUpRight
                  className="w-3.5 h-3.5 text-ink-tertiary group-hover:text-ink transition-colors -ml-0.5"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-[12.5px] text-ink-secondary leading-relaxed">
                {intent.blurb}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
