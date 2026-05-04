"use client";

import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNovaAsk } from "@/components/nova/NovaAskProvider";

/**
 * Acciones del hero de la home: CTA principal "Crear sesión" y CTA
 * secundario "Preguntarle a Nova" — equivalentes en jerarquía pero
 * el de Nova es ghost para que no compita con el primario.
 */
export function HeroActions({ canCreateSession }: { canCreateSession: boolean }) {
  const ask = useNovaAsk();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button asChild variant="spark" className="rounded-full gap-2 shadow-soft">
        <Link href={canCreateSession ? "/sessions/new" : "/topics"}>
          <Play className="w-3.5 h-3.5" strokeWidth={1.5} fill="currentColor" />
          {canCreateSession ? "Crear sesión" : "Crear primer tema"}
        </Link>
      </Button>
      <button
        type="button"
        onClick={ask.open}
        className="group inline-flex items-center gap-2 px-4 py-2 rounded-full border border-nova/25 bg-white/60 backdrop-blur-sm text-[13px] font-medium text-foreground/80 hover:text-foreground hover:border-nova/45 hover:bg-white transition-colors"
        title="Preguntarle a Nova · pulsa N"
      >
        <Sparkles
          className="w-3.5 h-3.5 text-nova-mid transition-transform group-hover:rotate-12"
          strokeWidth={1.7}
        />
        Preguntarle a Nova
        <kbd className="ml-1 rounded border border-black/[0.08] bg-black/[0.02] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground/70">
          N
        </kbd>
      </button>
    </div>
  );
}
