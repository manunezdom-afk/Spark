"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

const MESSAGES = [
  {
    role: "coach" as const,
    text: "Define 'propuesta de valor' con tus palabras. No busques la definición perfecta.",
    delay: 400,
  },
  {
    role: "user" as const,
    text: "Es lo que hace único a tu producto… algo que le importa al cliente de verdad.",
    delay: 1600,
  },
  {
    role: "coach" as const,
    text: "Bien. Ahora dime: ¿por qué eso importaría más que el precio?",
    delay: 2900,
  },
  {
    role: "user" as const,
    text: "Porque resuelve un problema que el cliente no puede ignorar.",
    delay: 4200,
  },
];

const CYCLE_MS = 6500;

export function AnimatedConversation({ loop = false }: { loop?: boolean }) {
  const [visible, setVisible] = useState<Set<number>>(new Set());
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setVisible(new Set());
    const timers = MESSAGES.map((m, i) =>
      setTimeout(() => setVisible((v) => new Set([...v, i])), m.delay)
    );
    const loopTimer = loop
      ? setTimeout(() => setCycle((c) => c + 1), CYCLE_MS)
      : undefined;
    return () => {
      timers.forEach(clearTimeout);
      if (loopTimer) clearTimeout(loopTimer);
    };
  }, [cycle, loop]);

  return (
    <div className="flex flex-col gap-2.5">
      {MESSAGES.map((msg, i) => (
        <div
          key={i}
          className={`transition-all duration-500 ease-out ${
            visible.has(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
          }`}
        >
          {msg.role === "coach" ? (
            <div className="flex gap-2 items-start">
              <div className="w-5 h-5 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-2.5 h-2.5 text-spark" strokeWidth={1.5} fill="currentColor" />
              </div>
              <div className="flex-1 rounded-md border-l-2 border-[#C97B3F] bg-[#C97B3F]/[0.04] px-3 py-2 text-xs leading-relaxed text-foreground/80">
                {msg.text}
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <div className="max-w-[80%] rounded-md bg-white/[0.05] border border-white/[0.06] px-3 py-2 text-xs leading-relaxed text-foreground/60">
                {msg.text}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* typing indicator — shown after last visible message while next is pending */}
      {visible.size > 0 && visible.size < MESSAGES.length && (
        <div
          className={`transition-all duration-300 ${
            visible.size % 2 === 0 ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center shrink-0">
              <Zap className="w-2.5 h-2.5 text-spark" strokeWidth={1.5} fill="currentColor" />
            </div>
            <div className="flex items-center gap-1 px-3 py-2 rounded-md border-l-2 border-[#C97B3F]/40 bg-[#C97B3F]/[0.02]">
              <span className="w-1 h-1 rounded-full bg-spark/50 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1 h-1 rounded-full bg-spark/50 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1 h-1 rounded-full bg-spark/50 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
