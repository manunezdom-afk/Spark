"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Buckets secundarios del mapa de progreso. Por defecto colapsado para
 * reducir ruido visual; se expande con un click. Mantiene la información
 * accesible sin saturar la vista primaria.
 */
export function CollapsibleSecondary({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-2 mb-10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-black/[0.05] bg-white/40 hover:bg-white/70 transition-colors group"
      >
        <span className="text-[13px] font-medium text-foreground/80">
          Ver {count} {count === 1 ? "tema más" : "temas más"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          strokeWidth={1.75}
        />
      </button>
      {open && <div className="mt-5">{children}</div>}
    </section>
  );
}
