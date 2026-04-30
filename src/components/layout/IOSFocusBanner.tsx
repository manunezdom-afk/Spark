"use client";

import * as React from "react";
import { Smartphone, X, ArrowUpRight } from "lucide-react";
import { FOCUS_IOS_URL } from "@/lib/spark/ecosystem";
import { cn } from "@/lib/utils/cn";

const STORAGE_KEY = "spark:ios-focus-banner-dismissed";
const REAPPEAR_DAYS = 30;

/**
 * Banner muy sutil que invita al usuario a bajarse Focus en su iPhone.
 *
 * Reglas anti-invasivo:
 * - No aparece si está en un dispositivo iOS
 * - No aparece la primera visita (esperamos al menos 1 día de uso)
 * - Dismissable; reaparece después de 30 días
 * - Diseño tipo footer-pill
 */
export function IOSFocusBanner({ className }: { className?: string }) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua);
    if (isIOS) return;

    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const daysSince =
        (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSince < REAPPEAR_DAYS) return;
    }

    const firstSeenKey = "spark:first-seen";
    const firstSeen = localStorage.getItem(firstSeenKey);
    if (!firstSeen) {
      localStorage.setItem(firstSeenKey, String(Date.now()));
      return;
    }
    const daysSinceFirst =
      (Date.now() - Number(firstSeen)) / (1000 * 60 * 60 * 24);
    if (daysSinceFirst < 1) return;

    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <div
      className={cn(
        "mx-3 mb-2 flex items-center gap-2 rounded-md border border-black/[0.06] bg-black/[0.02] px-2.5 py-1.5",
        className,
      )}
    >
      <Smartphone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <a
        href={FOCUS_IOS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-1 items-center gap-1 text-[11px] text-foreground/70 hover:text-foreground"
      >
        <span className="font-medium">Focus en tu iPhone</span>
        <ArrowUpRight className="h-2.5 w-2.5 opacity-50 group-hover:opacity-100" />
      </a>
      <button
        type="button"
        onClick={dismiss}
        className="rounded p-0.5 text-muted-foreground/60 hover:text-muted-foreground"
        aria-label="Cerrar"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}
