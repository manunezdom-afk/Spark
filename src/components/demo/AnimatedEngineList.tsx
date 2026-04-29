"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Bug, Scale, Network, Users } from "lucide-react";

const ENGINES = [
  {
    Icon: HelpCircle,
    name: "Socrático",
    desc: "Responde preguntas de por qué hasta dominar el concepto",
    accent: "spark" as const,
  },
  {
    Icon: Bug,
    name: "Debugger",
    desc: "Encuentra los 3 errores ocultos en el texto que genera Spark",
    accent: "nova" as const,
  },
  {
    Icon: Scale,
    name: "Abogado del Diablo",
    desc: "Defiende tu postura ante argumentos adversariales",
    accent: "spark" as const,
  },
  {
    Icon: Network,
    name: "Bridge Builder",
    desc: "Descubre conexiones no obvias entre materias",
    accent: "nova" as const,
  },
  {
    Icon: Users,
    name: "Roleplay",
    desc: "Aplica tus conocimientos en un escenario de alta presión",
    accent: "spark" as const,
  },
];

const DWELL_MS = 1400;

const ACCENT_CLASSES = {
  spark: {
    row: "border-spark/20 bg-spark/[0.05]",
    icon: "border-spark/20 bg-spark/[0.08]",
    iconColor: "text-spark",
    label: "text-foreground",
  },
  nova: {
    row: "border-nova-mid/20 bg-nova-mid/[0.05]",
    icon: "border-nova-mid/20 bg-nova-mid/[0.08]",
    iconColor: "text-nova-mid",
    label: "text-foreground",
  },
};

const INACTIVE = {
  row: "border-white/[0.04] bg-transparent",
  icon: "border-white/[0.06] bg-white/[0.02]",
  iconColor: "text-muted-foreground/30",
  label: "text-muted-foreground/40",
};

export function AnimatedEngineList() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActive((a) => (a + 1) % ENGINES.length),
      DWELL_MS
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-1.5">
      {ENGINES.map((engine, i) => {
        const isActive = active === i;
        const styles = isActive ? ACCENT_CLASSES[engine.accent] : INACTIVE;
        const { Icon } = engine;

        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md border transition-all duration-300 ${styles.row}`}
          >
            <div
              className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition-all duration-300 ${styles.icon}`}
            >
              <Icon className={`w-3 h-3 transition-colors duration-300 ${styles.iconColor}`} strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[10px] font-medium transition-colors duration-300 ${styles.label}`}>
                {engine.name}
              </div>
              <div
                className={`text-[9px] leading-tight text-muted-foreground/50 mt-0.5 transition-all duration-300 overflow-hidden ${
                  isActive ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                {engine.desc}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
