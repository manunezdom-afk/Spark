"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookMarked,
  Layers,
  AlertCircle,
  Activity,
  ClipboardList,
  History,
  User,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { isAnonymousUser, useSparkAuth } from "@/lib/auth/session";
import { BrandOrb } from "@/components/brand/BrandOrb";
import { NovaMark } from "@/components/nova/NovaMark";
import { useNovaAsk } from "@/components/nova/NovaAskProvider";
import { useNovaContext } from "@/lib/nova/context";
import { KAIROS_URL, FOCUS_IOS_URL } from "@/lib/spark/ecosystem";
import { IOSFocusBanner } from "@/components/layout/IOSFocusBanner";

const NAV: { href: string; label: string; icon: typeof Home }[] = [
  { href: "/dashboard", label: "Hoy", icon: Home },
  { href: "/topics", label: "Temas", icon: BookMarked },
  { href: "/mastery", label: "Maestría", icon: Activity },
  { href: "/flashcards/review", label: "Repaso", icon: Layers },
  { href: "/tests/new", label: "Pruebas", icon: ClipboardList },
  { href: "/sessions", label: "Sesiones", icon: History },
  { href: "/errors", label: "Errores", icon: AlertCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, user } = useSparkAuth();
  const guest = isAnonymousUser(user);
  const ask = useNovaAsk();
  const ctx = useNovaContext();

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

      {/* Nova — entrada principal */}
      <div className="px-3 pt-1 pb-3">
        <button
          type="button"
          onClick={ask.open}
          title="Pregúntale a Nova · N"
          className="w-full group relative overflow-hidden flex items-center gap-3 px-4 py-3.5 rounded-2xl text-white transition-all duration-200 shadow-[0_4px_20px_var(--color-nova-glow)] hover:shadow-[0_6px_28px_var(--color-nova-glow)] hover:scale-[1.015] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova/50"
          style={{ background: "var(--gradient-nova)" }}
        >
          {/* Brillo al hover */}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl" />
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/20 backdrop-blur-sm">
            <NovaMark size={16} variant="filled" />
          </span>
          <span className="relative flex flex-col text-left min-w-0 flex-1">
            <span className="text-[13px] font-semibold leading-tight">Pregúntale a Nova</span>
            <span className="text-[10.5px] leading-tight opacity-75 truncate">{ctx.scopeLabel}</span>
          </span>
          <kbd className="relative shrink-0 rounded border border-white/30 bg-white/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold opacity-80">N</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-1">
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

      {/* Guest mode banner */}
      {guest && (
        <div className="mx-3 mb-2 rounded-lg border border-spark/30 bg-spark/[0.06] p-2.5">
          <p className="text-[11px] font-semibold text-foreground leading-snug">
            Modo invitado
          </p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-foreground/60">
            Tu progreso se guarda. {" "}
            <Link
              href="/login"
              className="font-medium text-spark underline-offset-2 hover:underline"
            >
              Crear cuenta
            </Link>{" "}
            para no perderlo.
          </p>
        </div>
      )}

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
          <span className="truncate text-[12px]">
            {guest ? "Invitado" : (user?.email ?? "Cuenta")}
          </span>
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3.5 py-2 rounded-full text-sm text-foreground/60 hover:text-foreground hover:bg-black/[0.04] transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.75} />
          {guest ? "Salir" : "Cerrar sesión"}
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
