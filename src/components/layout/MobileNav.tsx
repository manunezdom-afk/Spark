"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookMarked, Layers, Activity } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { href: "/dashboard", label: "Hoy", icon: Home },
  { href: "/topics", label: "Temas", icon: BookMarked },
  { href: "/flashcards/review", label: "Repaso", icon: Layers },
  { href: "/mastery", label: "Maestría", icon: Activity },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#0a0c11]/95 backdrop-blur-xl">
      <div className="grid grid-cols-4 h-16">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[10px] uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
