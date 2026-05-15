"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookMarked,
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
  { href: "/mastery", label: "Mapa", icon: Activity },
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
    <aside className="w-[244px] shrink-0 hidden md:flex flex-col border-r border-black/[0.04] bg-surface-subtle/60 backdrop-blur-xl">
      {/* Brand header */}
      <div className="px-5 h-[68px] flex items-center gap-3">
        <BrandOrb size="sm" />
        <div className="min-w-0">
          <div className="text-[15px] font-medium tracking-tight leading-none text-ink">
            Spark
          </div>
          <div className="text-[10.5px] text-ink-tertiary mt-1 leading-none font-medium tracking-tight">
            Focus OS
          </div>
        </div>
      </div>

      {/* Nova — entrada principal (más compacta, menos visualmente dominante) */}
      <div className="px-3 pt-1 pb-4">
        <button
          type="button"
          onClick={ask.open}
          title="Pregúntale a Nova · N"
          className="w-full group relative overflow-hidden flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-white transition-all duration-200 shadow-[0_3px_14px_var(--color-nova-glow)] hover:shadow-[0_5px_20px_var(--color-nova-glow)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nova/50"
          style={{ background: "var(--gradient-nova)" }}
        >
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
          <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/22 backdrop-blur-sm">
            <NovaMark size={14} variant="filled" />
          </span>
          <span className="relative flex flex-col text-left min-w-0 flex-1">
            <span className="text-[12.5px] font-medium leading-tight">Pregúntale a Nova</span>
            <span className="text-[10px] leading-tight opacity-80 truncate mt-0.5">
              {ctx.scopeLabel}
            </span>
          </span>
          <kbd className="relative shrink-0 rounded-md border border-white/25 bg-white/12 px-1.5 py-0.5 text-[9px] font-medium opacity-85">
            N
          </kbd>
        </button>
      </div>

      {/* Nav — rounded-xl en lugar de rounded-full, active state suave */}
      <nav className="flex-1 px-3 py-1 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all duration-150",
                active
                  ? "bg-white text-ink shadow-soft font-medium"
                  : "text-ink-secondary hover:text-ink hover:bg-white/60 font-normal"
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r bg-spark"
                  aria-hidden
                />
              )}
              <Icon
                className={cn(
                  "w-[16px] h-[16px] shrink-0 transition-colors",
                  active ? "text-spark" : "text-ink-tertiary group-hover:text-ink-secondary"
                )}
                strokeWidth={1.5}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <IOSFocusBanner />

      {/* Ecosystem footer */}
      <div className="px-3 pb-3 mt-2">
        <div className="text-[10px] font-medium text-ink-tertiary mb-1.5 px-2 tracking-tight">
          Familia
        </div>
        <div className="flex flex-col gap-0.5">
          <EcosystemLink href={KAIROS_URL} label="Kairos" sub="Notas" dot="#A78BFA" />
          <EcosystemLink href={FOCUS_IOS_URL} label="Focus" sub="Calendario" dot="#5DD2A8" />
        </div>
      </div>

      {/* Guest mode banner */}
      {guest && (
        <div className="mx-3 mb-2 rounded-xl border border-spark/25 bg-spark-soft p-3">
          <p className="text-[11.5px] font-medium text-ink leading-snug">
            Modo invitado
          </p>
          <p className="mt-1 text-[10.5px] leading-snug text-ink-secondary">
            Tu progreso se guarda. {" "}
            <Link
              href="/login"
              className="font-medium text-spark hover:underline underline-offset-2"
            >
              Crear cuenta
            </Link>{" "}
            para no perderlo.
          </p>
        </div>
      )}

      {/* Account */}
      <div className="px-3 py-3 border-t border-black/[0.04] flex flex-col gap-0.5">
        <Link
          href="/cuenta"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] transition-colors",
            pathname === "/cuenta"
              ? "bg-white text-ink shadow-soft font-medium"
              : "text-ink-secondary hover:text-ink hover:bg-white/60"
          )}
        >
          <User className="w-4 h-4 shrink-0 text-ink-tertiary" strokeWidth={1.5} />
          <span className="truncate">
            {guest ? "Invitado" : (user?.email ?? "Cuenta")}
          </span>
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-[12.5px] text-ink-tertiary hover:text-ink-secondary hover:bg-white/60 transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" strokeWidth={1.5} />
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
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:bg-white/60"
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: dot }}
      />
      <span className="font-medium text-ink-secondary group-hover:text-ink">
        {label}
      </span>
      <span className="text-ink-tertiary text-[10px] flex-1 truncate">
        {sub}
      </span>
      <ExternalLink className="h-2.5 w-2.5 text-ink-tertiary opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}
