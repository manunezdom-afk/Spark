import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[88px] w-full rounded-xl border border-black/[0.08] bg-white px-4 py-3 text-[14px] transition-colors",
        "placeholder:text-muted-foreground/70 resize-none leading-relaxed",
        "focus-visible:outline-none focus-visible:border-spark/60 focus-visible:ring-2 focus-visible:ring-spark/15",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";
