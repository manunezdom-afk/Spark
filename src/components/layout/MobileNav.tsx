"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookMarked, Layers, Activity, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NovaPill } from "@/components/nova/NovaPill";

const ITEMS_LEFT = [
  { href: "/dashboard", label: "Hoy", icon: Home },
  { href: "/topics", label: "Temas", icon: BookMarked },
];

const ITEMS_RIGHT = [
  { href: "/mastery", label: "Maestría", icon: Activity },
  { href: "/flashcards/review", label: "Repaso", icon: Layers },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.06] bg-white/90 backdrop-blur-xl">
      <div
        className="grid grid-cols-5 h-[58px]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {ITEMS_LEFT.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                active ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-nova" />
              )}
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span className="text-[9px] uppercase tracking-wider leading-none">{item.label}</span>
            </Link>
          );
        })}

        {/* Nova — centro */}
        <div className="flex items-center justify-center">
          <NovaPill variant="stacked" />
        </div>

        {ITEMS_RIGHT.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors relative",
                active ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-nova" />
              )}
              <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span className="text-[9px] uppercase tracking-wider leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Línea Nova decorativa */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-px h-px opacity-40"
        style={{ background: "var(--gradient-nova)" }}
      />
    </nav>
  );
}
