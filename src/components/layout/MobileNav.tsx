"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookMarked, Activity, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { NovaPill } from "@/components/nova/NovaPill";

const ITEMS_LEFT = [
  { href: "/dashboard", label: "Hoy", icon: Home },
  { href: "/topics", label: "Temas", icon: BookMarked },
];

const ITEMS_RIGHT = [
  { href: "/mastery", label: "Mapa", icon: Activity },
  { href: "/tests/new", label: "Pruebas", icon: ClipboardList },
];

export function MobileNav() {
  const pathname = usePathname();
  const isImmersiveSession =
    pathname.startsWith("/sessions/") && pathname !== "/sessions/new";

  if (isImmersiveSession) return null;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-black/[0.05] bg-white/92 backdrop-blur-xl">
      <div
        className="grid grid-cols-5 h-[60px]"
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
                active ? "text-ink" : "text-ink-tertiary",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-spark" />
              )}
              <Icon
                className={cn("w-[18px] h-[18px]", active && "text-spark")}
                strokeWidth={1.5}
              />
              <span className="text-[9.5px] font-medium leading-none tracking-tight">
                {item.label}
              </span>
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
                active ? "text-ink" : "text-ink-tertiary",
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-spark" />
              )}
              <Icon
                className={cn("w-[18px] h-[18px]", active && "text-spark")}
                strokeWidth={1.5}
              />
              <span className="text-[9.5px] font-medium leading-none tracking-tight">
                {item.label}
              </span>
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
