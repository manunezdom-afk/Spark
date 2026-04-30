import { cn } from "@/lib/utils/cn";

interface BrandOrbProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  spinning?: boolean;
  className?: string;
}

const SIZES: Record<NonNullable<BrandOrbProps["size"]>, string> = {
  xs: "w-5 h-5",
  sm: "w-7 h-7",
  md: "w-10 h-10",
  lg: "w-14 h-14",
  xl: "w-20 h-20",
};

/**
 * Animated brand orb — conic gradient circle inspired by Gemini's brand mark.
 * Orange anchor with a sweep through coral, purple and sky blue.
 *
 * Use everywhere the previous static spark icon appeared (sidebar header,
 * onboarding, brand accents). The motion is what carries the AI feel.
 */
export function BrandOrb({ size = "md", spinning = true, className }: BrandOrbProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 rounded-full overflow-hidden",
        SIZES[size],
        className,
      )}
      style={{
        boxShadow:
          "0 0 0 1px rgba(0,0,0,0.04), 0 4px 14px rgba(255,138,76,0.20)",
      }}
    >
      {/* Conic gradient layer (rotating) */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-brand-conic",
          !spinning && "[animation-play-state:paused]",
        )}
      />
      {/* Inner highlight: white core for that "glowing orb" feel */}
      <div
        className="absolute rounded-full"
        style={{
          inset: "22%",
          background:
            "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(255,255,255,0.35) 60%, transparent 80%)",
        }}
      />
    </div>
  );
}
