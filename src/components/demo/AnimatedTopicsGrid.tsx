"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, FlaskConical } from "lucide-react";

const DEMO_TOPICS = [
  {
    category: "Marketing",
    title: "Marketing Digital y Redes Sociales",
    score: 68,
    sessions: 5,
    tags: ["digital", "contenido", "redes"],
    delay: 150,
  },
  {
    category: "Negocios",
    title: "Comportamiento del Consumidor",
    score: 32,
    sessions: 2,
    tags: ["psicología", "decisión"],
    delay: 420,
  },
  {
    category: "Finanzas",
    title: "Fundamentos de Finanzas",
    score: 11,
    sessions: 1,
    tags: ["contabilidad", "flujo"],
    delay: 690,
  },
];

const CYCLE_MS = 5000;

export function AnimatedTopicsGrid({ loop = false }: { loop?: boolean }) {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [filled, setFilled] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setVisible(new Set());
    setFilled(false);
    const timers = DEMO_TOPICS.map((t, i) =>
      setTimeout(() => setVisible((v) => new Set([...v, i])), t.delay)
    );
    const fillTimer = setTimeout(() => setFilled(true), 900);
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
    <div className="flex flex-col gap-2">
      {DEMO_TOPICS.map((topic, i) => (
        <div
          key={i}
          className={`transition-all duration-500 ease-out ${
            visible.has(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex flex-col gap-2 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    {topic.category}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground/50 border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 rounded-full">
                    <FlaskConical className="w-2 h-2" strokeWidth={1.5} />
                    Ejemplo
                  </span>
                </div>
                <div className="text-xs font-medium leading-snug">{topic.title}</div>
              </div>
              <ArrowUpRight className="w-3 h-3 text-muted-foreground/30 shrink-0 mt-0.5" strokeWidth={1.5} />
            </div>

            <div className="flex items-center gap-2.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-14 h-[3px] rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-spark to-spark/70 transition-all duration-1000 ease-out"
                    style={{
                      width: filled ? `${Math.max(topic.score, 5)}%` : "0%",
                      transitionDelay: `${i * 120}ms`,
                    }}
                  />
                </div>
                <span className="font-mono">{topic.score}%</span>
              </div>
              <span className="text-muted-foreground/30">·</span>
              <span>{topic.sessions} {topic.sessions === 1 ? "sesión" : "sesiones"}</span>
            </div>

            <div className="flex gap-1 flex-wrap">
              {topic.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.05] text-muted-foreground/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
