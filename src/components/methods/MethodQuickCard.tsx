import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import { ENGINE_BLURBS } from "@/modules/spark/engines/blurbs";
import type { LearningEngine } from "@/modules/spark/types";

/**
 * Compact method card — usado en dashboard (acceso rápido) y en
 * topic page (recomendaciones contextuales). NO es el selector
 * grande de /sessions/new (ese vive en MethodPickCard, dedicado al
 * configurador con motifs e isActive state).
 *
 * Variantes:
 *   - "quick": grid de 6 en dashboard, cada una abre /sessions/new?engine=X
 *   - "recommendation": 2 cards en topic page con `reason` contextual
 *
 * Diseño minimalista: icon + título + descripción de una línea.
 * El accent del engine theme se aplica solo al icon, dejando la card
 * neutra para reducir saturación visual cuando se ven 6 juntas.
 */
export type MethodKey = LearningEngine | "test";

interface BaseProps {
  methodKey: MethodKey;
  href: string;
  /** Animación de entrada — index para el delay del fade-up */
  animationIndex?: number;
  disabled?: boolean;
  /** Label override (rara vez necesario) */
  label?: string;
}

interface QuickProps extends BaseProps {
  variant?: "quick";
}

interface RecommendationProps extends BaseProps {
  variant: "recommendation";
  /** Una línea sobre por qué este método para este contexto */
  reason: string;
}

type MethodQuickCardProps = QuickProps | RecommendationProps;

export function MethodQuickCard(props: MethodQuickCardProps) {
  const { methodKey, href, animationIndex = 0, disabled = false } = props;
  const themeEngine: LearningEngine =
    methodKey === "test" ? "test_alternativas" : methodKey;
  const theme = getEngineTheme(themeEngine);
  const label =
    props.label ??
    (methodKey === "test"
      ? "Generar prueba"
      : ENGINE_LABELS[methodKey as LearningEngine]);
  const Icon = theme.Icon;

  const isRecommendation = props.variant === "recommendation";
  const blurbEngine: LearningEngine =
    methodKey === "test" ? "test_alternativas" : methodKey;
  const subtitle = isRecommendation ? props.reason : ENGINE_BLURBS[blurbEngine];

  return (
    <Link
      href={href}
      className={`method-quick-card group relative flex flex-col gap-3 ${
        isRecommendation ? "p-5" : "p-4"
      } rounded-2xl border hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.985] transition-all duration-300 ease-spring`}
      style={{
        "--mqc-bg": hexToRgba(theme.accent, 0.045),
        "--mqc-bg-hover": hexToRgba(theme.accent, 0.08),
        "--mqc-border": hexToRgba(theme.accent, 0.14),
        "--mqc-border-hover": hexToRgba(theme.accent, 0.35),
        "--mqc-shadow-hover": `0 12px 30px -6px ${hexToRgba(theme.accent, 0.22)}`,
        animation: `fade-up 320ms ${animationIndex * 40}ms ease-out both`,
      } as CSSProperties}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`inline-flex items-center justify-center ${
            isRecommendation ? "w-10 h-10" : "w-9 h-9"
          } rounded-xl shrink-0`}
          style={{
            background: hexToRgba(theme.accent, 0.08),
            color: theme.accent,
          }}
        >
          <Icon
            className={isRecommendation ? "w-[18px] h-[18px]" : "w-4 h-4"}
            strokeWidth={1.5}
          />
        </span>
        <ArrowUpRight
          className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-foreground/60 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
          strokeWidth={1.5}
        />
      </div>
      <div className="flex flex-col gap-1">
        <div
          className={`${
            isRecommendation ? "text-[15px]" : "text-[14px]"
          } font-medium tracking-tight text-ink leading-tight`}
        >
          {label}
        </div>
        <p
          className={`${
            isRecommendation ? "text-[12.5px]" : "text-[11.5px]"
          } text-ink-secondary leading-relaxed line-clamp-2`}
        >
          {subtitle}
        </p>
      </div>
      {disabled && (
        <span className="text-[10.5px] font-medium text-muted-foreground/60">
          Crea un tema para activar
        </span>
      )}
    </Link>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
