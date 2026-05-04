import Link from "next/link";
import { ENGINE_LABELS, ENGINE_TAGS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
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
 * El styling usa el accent del engine theme — mismo color que la
 * sesión activa de ese método. Identidad consistente entre pantallas.
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
  const tag = ENGINE_TAGS[themeEngine][0];
  const Icon = theme.Icon;

  // Variant-specific layout
  const isRecommendation = props.variant === "recommendation";
  const subtitle = isRecommendation ? props.reason : theme.pitch;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col gap-2.5 ${
        isRecommendation ? "p-5" : "p-4"
      } rounded-2xl border border-black/[0.06] bg-white/60 backdrop-blur-sm hover:bg-white hover:shadow-soft transition-all duration-300 ease-spring`}
      style={{
        animation: `fade-up 360ms ${animationIndex * 60}ms cubic-bezier(0.34, 1.4, 0.64, 1) both`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 transition-transform group-hover:scale-105"
          style={{
            background: hexToRgba(theme.accent, 0.1),
            color: theme.accent,
            border: `1px solid ${hexToRgba(theme.accent, 0.22)}`,
          }}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={1.7} />
        </span>
        <span
          className="font-mono text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-full border opacity-80"
          style={{
            background: hexToRgba(theme.accent, 0.06),
            borderColor: hexToRgba(theme.accent, 0.15),
            color: theme.accent,
          }}
        >
          {tag}
        </span>
      </div>
      <div
        className={`${
          isRecommendation ? "text-[15px]" : "text-[14px]"
        } font-semibold tracking-tight text-foreground leading-tight`}
      >
        {label}
      </div>
      <p
        className={`${
          isRecommendation ? "text-[12.5px]" : "text-[11.5px]"
        } text-muted-foreground leading-relaxed line-clamp-2`}
      >
        {subtitle}
      </p>
      {disabled && (
        <span className="text-[10px] font-medium text-muted-foreground/70 mt-0.5">
          Crea un tema para activar →
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
