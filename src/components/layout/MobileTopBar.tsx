"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, User } from "lucide-react";
import { NovaPill } from "@/components/nova/NovaPill";

const TITLES: Record<string, string> = {
  "/dashboard": "Hoy",
  "/topics": "Temas",
  "/mastery": "Mapa",
  "/flashcards/review": "Repaso",
  "/tests/new": "Nueva prueba",
  "/tests": "Pruebas",
  "/sessions/new": "Nueva sesión",
  "/sessions": "Sesiones",
  "/errors": "Errores",
  "/cuenta": "Cuenta",
};

function getTitle(pathname: string): string {
  for (const [prefix, label] of Object.entries(TITLES)) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return label;
  }
  return "Spark";
}

export function MobileTopBar() {
  const pathname = usePathname();
  const isImmersiveSession =
    pathname.startsWith("/sessions/") && pathname !== "/sessions/new";

  if (isImmersiveSession) return null;

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-white/92 backdrop-blur-xl border-b border-black/[0.05]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-spark-soft border border-spark/20 flex items-center justify-center">
          <Zap className="w-3.5 h-3.5 text-spark" strokeWidth={1.5} fill="currentColor" />
        </div>
        <div>
          <div className="text-[14px] font-medium tracking-tight leading-none text-ink">
            {getTitle(pathname)}
          </div>
          <div className="text-[10px] font-medium text-ink-tertiary leading-none mt-1 tracking-tight">
            Spark
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <NovaPill variant="icon" />
        <Link
          href="/cuenta"
          className="w-8 h-8 rounded-full bg-surface-subtle border border-black/[0.05] flex items-center justify-center text-ink-secondary hover:text-ink hover:bg-white transition-colors"
        >
          <User className="w-4 h-4" strokeWidth={1.5} />
        </Link>
      </div>
    </header>
  );
}
