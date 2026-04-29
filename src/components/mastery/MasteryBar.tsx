import { cn } from "@/lib/utils/cn";

export function MasteryBar({
  score,
  size = "md",
  showLabel = true,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const heights = { sm: "h-1", md: "h-1.5", lg: "h-2" };
  const safe = Math.max(0, Math.min(100, score));
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className={cn("flex-1 rounded-full bg-white/[0.06] overflow-hidden", heights[size])}>
        <div
          className="h-full bg-gradient-to-r from-spark to-spark/70 transition-all"
          style={{ width: `${Math.max(safe, 2)}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground shrink-0">
          {safe}%
        </span>
      )}
    </div>
  );
}
