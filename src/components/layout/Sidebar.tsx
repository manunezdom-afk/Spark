"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Zap,
  Home,
  BookMarked,
  Layers,
  AlertCircle,
  Activity,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSparkAuth } from "@/lib/auth/session";

const NAV: { href: string; label: string; icon: typeof Home }[] = [
  { href: "/dashboard", label: "Hoy", icon: Home },
  { href: "/topics", label: "Temas", icon: BookMarked },
  { href: "/mastery", label: "Maestría", icon: Activity },
  { href: "/flashcards/review", label: "Repaso", icon: Layers },
  { href: "/errors", label: "Errores", icon: AlertCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useSparkAuth();

  return (
    <aside className="w-[220px] shrink-0 hidden md:flex flex-col border-r border-black/[0.07] bg-background/80 backdrop-blur-xl">
      {/* App header */}
      <div className="px-4 h-16 border-b border-black/[0.07] flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-spark/10 border border-spark/20 flex items-center justify-center shrink-0">
          <Zap className="w-3.5 h-3.5 text-spark" strokeWidth={1.5} fill="currentColor" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold tracking-tight leading-none">Spark</div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/60 mt-0.5 leading-none">
            Focus OS
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-black/[0.06] text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-spark" />
              )}
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Ecosystem footer */}
      <div className="px-4 pb-2">
        <div className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground/40 font-mono mb-1.5 px-1">
          Familia
        </div>
        <div className="flex flex-col gap-0.5">
          {[
            { label: "Focus", sub: "Calendario" },
            { label: "Kairos", sub: "Notas" },
          ].map((app) => (
            <div
              key={app.label}
              className="flex items-center justify-between px-1 py-1 text-[10px] text-muted-foreground/50"
            >
              <span className="font-medium">{app.label}</span>
              <span className="text-muted-foreground/40">{app.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="px-3 py-3 border-t border-black/[0.07] flex flex-col gap-0.5">
        <Link
          href="/cuenta"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === "/cuenta"
              ? "bg-black/[0.06] text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04]"
          )}
        >
          <User className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span className="truncate text-xs">{user?.email ?? "Cuenta"}</span>
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-black/[0.04] transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
