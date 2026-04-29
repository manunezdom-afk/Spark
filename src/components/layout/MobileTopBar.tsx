"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, User } from "lucide-react";

const TITLES: Record<string, string> = {
  "/dashboard": "Hoy",
  "/topics": "Temas",
  "/mastery": "Maestría",
  "/flashcards/review": "Repaso",
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

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-[#07080b]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center">
          <Zap className="w-3 h-3 text-spark" strokeWidth={1.5} fill="currentColor" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight leading-none">
            {getTitle(pathname)}
          </div>
          <div className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/40 leading-none mt-0.5">
            Spark · Focus OS
          </div>
        </div>
      </div>
      <Link
        href="/cuenta"
        className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <User className="w-4 h-4" strokeWidth={1.5} />
      </Link>
    </header>
  );
}
