"use client";

import Link from "next/link";
import { Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNovaAsk } from "@/components/nova/NovaAskProvider";

/**
 * Acciones del hero de la home: CTA principal "Crear sesión" y CTA
 * secundario "Preguntarle a Nova" en variante `nova` del Button para
 * mantener consistencia visual y contraste accesible.
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
      <Button
        type="button"
        variant="nova"
        onClick={ask.open}
        className="group gap-2"
        title="Preguntarle a Nova · pulsa N"
        aria-label="Preguntarle a Nova"
      >
        <Sparkles
          className="w-3.5 h-3.5 text-nova-mid transition-transform group-hover:rotate-12"
          strokeWidth={1.5}
        />
        Preguntarle a Nova
        <kbd className="ml-1 rounded border border-black/[0.08] bg-black/[0.02] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-muted-foreground/70">
          N
        </kbd>
      </Button>
    </div>
  );
}
