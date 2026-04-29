"use client";

import { useEffect, useState } from "react";

const DEMO_ITEMS = [
  { title: "Marketing Digital", category: "Marketing", score: 68, sessions: 5, errors: 3, due: "Hoy", urgent: true, delay: 200 },
  { title: "Comportamiento del Consumidor", category: "Negocios", score: 32, sessions: 2, errors: 1, due: "En 3 días", urgent: false, delay: 480 },
  { title: "Fundamentos de Finanzas", category: "Finanzas", score: 21, sessions: 1, errors: 0, due: "En 7 días", urgent: false, delay: 760 },
];

const CYCLE_MS = 5500;

export function AnimatedMasteryBars({ loop = false }: { loop?: boolean }) {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [filled, setFilled] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setVisible(new Set());
    setFilled(false);
    const timers = DEMO_ITEMS.map((item, i) =>
      setTimeout(() => setVisible((v) => new Set([...v, i])), item.delay)
    );
    const fillTimer = setTimeout(() => setFilled(true), 1100);
    const loopTimer = loop
      ? setTimeout(() => setCycle((c) => c + 1), CYCLE_MS)
      : undefined;
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(fillTimer);
      if (loopTimer) clearTimeout(loopTimer);
    };
  }, [cycle, loop]);

  return (
    <div className="flex flex-col divide-y divide-white/[0.04]">
      {DEMO_ITEMS.map((item, i) => (
        <div
          key={i}
          className={`py-3 transition-all duration-500 ease-out ${
            visible.has(i) ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground mb-0.5">
                {item.category}
              </div>
              <div className="text-xs font-medium truncate">{item.title}</div>
            </div>
            <span
              className={`font-mono text-[9px] uppercase tracking-[0.14em] shrink-0 ${
                item.urgent ? "text-spark" : "text-muted-foreground"
              }`}
            >
              {item.due}
            </span>
          </div>

          <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden mb-1.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-spark to-spark/70 transition-all duration-1000 ease-out"
              style={{
                width: filled ? `${item.score}%` : "0%",
                transitionDelay: `${i * 150}ms`,
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.12em] text-muted-foreground/50">
            <span className="font-mono">{item.score}%</span>
            <span className="text-muted-foreground/20">·</span>
            <span>{item.sessions} sesiones</span>
            {item.errors > 0 && (
              <>
                <span className="text-muted-foreground/20">·</span>
                <span>{item.errors} errores</span>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
