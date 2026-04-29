"use client";

import { useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function UserResponseInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "Escribe tu respuesta…",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 240)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  }

  return (
    <div className="sticky bottom-0 -mx-5 md:-mx-8 px-5 md:px-8 py-4 border-t border-white/[0.06] bg-[#0a0c11]/85 backdrop-blur-xl">
      <div className="relative max-w-3xl mx-auto">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className={cn(
            "w-full pr-12 pl-4 py-3 rounded-lg border border-white/[0.10] bg-white/[0.03] text-sm leading-relaxed",
            "placeholder:text-muted-foreground resize-none scrollbar-thin",
            "focus:outline-none focus:border-spark/50 focus:bg-white/[0.05]",
            "disabled:opacity-50"
          )}
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          className={cn(
            "absolute right-2 bottom-2 w-8 h-8 rounded-md flex items-center justify-center transition-colors",
            value.trim() && !disabled
              ? "bg-spark text-background hover:bg-spark/90"
              : "bg-white/[0.06] text-muted-foreground cursor-not-allowed"
          )}
        >
          <ArrowUp className="w-4 h-4" strokeWidth={2} />
        </button>
        <div className="text-[10px] text-muted-foreground mt-2 text-right hidden md:block">
          ⌘ + Enter para enviar
        </div>
      </div>
    </div>
  );
}
