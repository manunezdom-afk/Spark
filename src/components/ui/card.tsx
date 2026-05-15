import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Card — superficie unificada del design system de Spark.
 *
 * Variantes:
 *   - "default" (white sobre paper): tarjetas de contenido principales
 *   - "subtle"  (surface-subtle): paneles secundarios, sidebars internos
 *   - "ghost"   (sin fondo, solo borde): contenedores discretos
 *
 * Tono interactivo:
 *   - interactive: añade hover (lift sutil + sombra)
 */
type CardVariant = "default" | "subtle" | "ghost";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  interactive?: boolean;
}

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: "bg-white border-black/[0.05] shadow-soft",
  subtle: "bg-surface-subtle border-black/[0.04]",
  ghost: "bg-transparent border-black/[0.06]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border transition-all duration-200",
        VARIANT_CLASSES[variant],
        interactive &&
          "hover:-translate-y-px hover:shadow-lift hover:border-black/[0.10]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col gap-1.5 p-5 md:p-6", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-[15px] font-medium leading-tight tracking-tight text-ink", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[12.5px] text-muted-foreground leading-relaxed", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-5 md:p-6 pt-0", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-5 md:p-6 pt-0", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
