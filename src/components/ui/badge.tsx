import { cva, type VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-white/8 text-foreground border border-white/10",
        spark: "bg-spark/10 text-spark border border-spark/30",
        nova: "bg-nova-mid/10 text-nova-mid border border-nova-mid/30",
        success: "bg-green-500/10 text-green-400 border border-green-500/30",
        warning: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
