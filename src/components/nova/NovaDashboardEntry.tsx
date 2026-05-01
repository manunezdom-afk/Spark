"use client";

import { ArrowRight } from "lucide-react";
import { NovaMark } from "@/components/nova/NovaMark";
import { useNovaAsk } from "@/components/nova/NovaAskProvider";

export function NovaDashboardEntry() {
  const ask = useNovaAsk();
  return (
    <div className="mb-8">
      <button
        type="button"
        onClick={ask.open}
        title="Pregúntale a Nova qué estudiar hoy · pulsa N"
        className="w-full group relative overflow-hidden flex items-center gap-4 px-5 py-4 rounded-2xl text-white transition-all duration-200 shadow-[0_6px_28px_var(--color-nova-glow)] hover:shadow-[0_8px_36px_var(--color-nova-glow)] hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova/50"
        style={{ background: "var(--gradient-nova)" }}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl" />
        <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
          <NovaMark size={20} variant="filled" />
        </span>
        <span className="relative flex flex-col text-left min-w-0 flex-1">
          <span className="text-[15px] font-semibold leading-tight">Pregúntale a Nova qué estudiar hoy</span>
          <span className="text-[11px] leading-tight opacity-75">Plan, método recomendado, tarjetas, resúmenes · pulsa N</span>
        </span>
        <ArrowRight className="relative w-5 h-5 opacity-70 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
