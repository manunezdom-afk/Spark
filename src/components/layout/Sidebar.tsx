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
    <aside className="w-[220px] shrink-0 hidden md:flex flex-col border-r border-white/[0.06] bg-white/[0.01] backdrop-blur-xl">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-white/[0.06]">
        <Zap className="w-5 h-5 text-spark" strokeWidth={1.5} fill="currentColor" />
        <span className="font-mono text-xs uppercase tracking-[0.2em]">Spark</span>
      </div>

      <nav className="flex-1 px-3 py-5 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
              )}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/[0.06] flex flex-col gap-1">
        <Link
          href="/cuenta"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
            pathname === "/cuenta"
              ? "bg-white/[0.06] text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03]"
          )}
        >
          <User className="w-4 h-4" strokeWidth={1.5} />
          <span className="truncate">{user?.email ?? "Cuenta"}</span>
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-white/[0.03] transition-colors"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
