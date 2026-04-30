"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookMarked,
  Layers,
  AlertCircle,
  Activity,
  User,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useSparkAuth } from "@/lib/auth/session";
import { BrandOrb } from "@/components/brand/BrandOrb";
import { KAIROS_URL, FOCUS_IOS_URL } from "@/lib/spark/ecosystem";
import { IOSFocusBanner } from "@/components/layout/IOSFocusBanner";

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
    <aside className="w-[228px] shrink-0 hidden md:flex flex-col border-r border-black/[0.06] bg-background/70 backdrop-blur-2xl">
      {/* Brand header */}
      <div className="px-5 h-[68px] flex items-center gap-3">
        <BrandOrb size="sm" />
        <div className="min-w-0">
          <div className="text-[15px] font-semibold tracking-tight leading-none">Spark</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70 mt-1 leading-none font-medium">
            Focus OS
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm transition-all duration-200",
                active
                  ? "bg-foreground text-background font-semibold"
                  : "text-foreground/70 hover:text-foreground hover:bg-black/[0.04] font-medium"
              )}
            >
              <Icon
                className={cn("w-[17px] h-[17px] shrink-0 transition-transform", !active && "group-hover:scale-110")}
                strokeWidth={active ? 2 : 1.75}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <IOSFocusBanner />

      {/* Ecosystem footer */}
      <div className="px-3 pb-3">
        <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/50 font-mono mb-1.5 px-2">
          Familia
        </div>
        <div className="flex flex-col gap-0.5">
          <EcosystemLink href={KAIROS_URL} label="Kairos" sub="Notas" dot="#A78BFA" />
          <EcosystemLink href={FOCUS_IOS_URL} label="Focus" sub="Calendario" dot="#5DD2A8" />
        </div>
      </div>

      {/* Account */}
      <div className="px-3 py-3 border-t border-black/[0.06] flex flex-col gap-1">
        <Link
          href="/cuenta"
          className={cn(
            "flex items-center gap-3 px-3.5 py-2 rounded-full text-sm transition-colors",
            pathname === "/cuenta"
              ? "bg-foreground text-background font-medium"
              : "text-foreground/70 hover:text-foreground hover:bg-black/[0.04]"
          )}
        >
          <User className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          <span className="truncate text-[12px]">{user?.email ?? "Cuenta"}</span>
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3.5 py-2 rounded-full text-sm text-foreground/60 hover:text-foreground hover:bg-black/[0.04] transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}

function EcosystemLink({
  href,
  label,
  sub,
  dot,
}: {
  href: string;
  label: string;
  sub: string;
  dot: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-2 rounded px-2 py-1 text-[11px] transition-colors hover:bg-black/[0.04]"
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: dot }}
      />
      <span className="font-medium text-foreground/70 group-hover:text-foreground">
        {label}
      </span>
      <span className="text-muted-foreground/50 text-[10px] flex-1 truncate">
        {sub}
      </span>
      <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}
