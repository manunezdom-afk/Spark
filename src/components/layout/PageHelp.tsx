"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle, X, Zap, BookMarked, Activity, Layers, AlertCircle, Play } from "lucide-react";

interface HelpItem {
  icon: React.ElementType;
  label: string;
  desc: string;
}

interface PageHints {
  title: string;
  subtitle: string;
  items: HelpItem[];
}

const HINTS: Record<string, PageHints> = {
  "/dashboard": {
    title: "Panel principal",
    subtitle: "Tu punto de partida diario",
    items: [
      { icon: Zap, label: "Motores recomendados", desc: "Spark elige el modo de estudio según tus deadlines y nivel de maestría." },
      { icon: Play, label: "Iniciar sesión", desc: "Haz click en cualquier motor para elegir un tema y empezar a entrenar." },
      { icon: Activity, label: "Sesiones abiertas", desc: "Si dejaste una sesión a medias, aparece aquí para continuar donde la dejaste." },
      { icon: Layers, label: "Repasos pendientes", desc: "El banner de llama te avisa cuando hay tarjetas o temas que vencen hoy." },
    ],
  },
  "/topics": {
    title: "Tu biblioteca",
    subtitle: "Los temas que entrenas con Spark",
    items: [
      { icon: BookMarked, label: "Crear tema", desc: "Pulsa 'Nuevo tema' para crear manualmente, pegar texto o importar desde Kairos." },
      { icon: Zap, label: "Importar de Kairos", desc: "En 'Nuevo tema → Desde Kairos' tus materias se importan con tus notas como contexto." },
      { icon: Activity, label: "Ver progreso", desc: "Cada tarjeta muestra la barra de maestría y cuántas sesiones llevas." },
      { icon: Play, label: "Entrenar", desc: "Haz click en un tema para ver sus detalles y elegir el motor de entrenamiento." },
    ],
  },
  "/mastery": {
    title: "Maestría",
    subtitle: "Tu avance real por tema",
    items: [
      { icon: Activity, label: "Barra de maestría", desc: "Calcula el promedio ponderado de tus últimas sesiones con SM-2." },
      { icon: Zap, label: "Próxima revisión", desc: "SM-2 decide cuándo vuelve a aparecer cada tema según qué tan bien lo dominas." },
      { icon: AlertCircle, label: "Temas urgentes", desc: "Los que dicen 'Hoy' llevan más tiempo sin repasar — empieza por ellos." },
      { icon: Play, label: "Entrenar tema", desc: "Haz click en cualquier item para ir al tema y lanzar una sesión." },
    ],
  },
  "/flashcards/review": {
    title: "Repaso de tarjetas",
    subtitle: "Memorización espaciada",
    items: [
      { icon: Layers, label: "Qué son las tarjetas", desc: "Nova genera tarjetas automáticamente cuando detecta conceptos clave en tus sesiones." },
      { icon: Play, label: "Cómo repasar", desc: "Lee el anverso, piensa la respuesta, da vuelta la tarjeta y puntúa tu respuesta." },
      { icon: Zap, label: "Algoritmo SM-2", desc: "Las tarjetas que fallas vuelven antes. Las que dominas esperan días o semanas." },
    ],
  },
  "/errors": {
    title: "Registro de errores",
    subtitle: "Donde más aprenderás",
    items: [
      { icon: AlertCircle, label: "Para qué sirve", desc: "Guarda los conceptos que fallaste en sesiones anteriores para reforzarlos." },
      { icon: Zap, label: "Cómo usarlo", desc: "Revisa los errores antes de un examen — son exactamente tus puntos débiles." },
      { icon: Play, label: "Relanzar sesión", desc: "Puedes iniciar una sesión enfocada solo en los temas donde más fallaste." },
    ],
  },
};

export function PageHelp() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Match hints by prefix (handles /topics/[id] etc)
  const key = Object.keys(HINTS).find((k) => pathname === k || pathname.startsWith(k + "/")) ?? null;
  if (!key) return null;

  const hints = HINTS[key];

  return (
    <>
      <style jsx global>{`
        @keyframes help-panel-in {
          from { opacity: 0; transform: translateY(8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
        @keyframes help-item-in {
          from { opacity: 0; transform: translateX(-6px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8 w-10 h-10 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? "Cerrar ayuda" : "Ver ayuda"}
      >
        {open
          ? <X className="w-4 h-4" strokeWidth={2} />
          : <HelpCircle className="w-4.5 h-4.5" strokeWidth={1.75} />
        }
      </button>

      {/* Help panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-40 md:bottom-24 md:right-8 w-80 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.14)] overflow-hidden"
          style={{
            background: "hsl(var(--background))",
            border: "1px solid rgba(0,0,0,0.09)",
            animation: "help-panel-in 220ms cubic-bezier(0.34, 1.4, 0.64, 1) both",
          }}
        >
          {/* Header */}
          <div className="px-5 pt-4 pb-3 border-b border-black/[0.07]">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-spark/10 border border-spark/20 flex items-center justify-center shrink-0">
                <Zap className="w-3 h-3 text-spark" strokeWidth={1.5} fill="currentColor" />
              </div>
              <div>
                <div className="text-sm font-semibold leading-none">{hints.title}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{hints.subtitle}</div>
              </div>
            </div>
          </div>

          {/* Items */}
          <ul className="px-5 py-3 flex flex-col gap-3">
            {hints.items.map((item, i) => {
              const Icon = item.icon;
              return (
                <li
                  key={i}
                  className="flex gap-3"
                  style={{
                    animation: `help-item-in 200ms ${i * 50}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both`,
                  }}
                >
                  <div className="w-7 h-7 rounded-lg bg-black/[0.04] border border-black/[0.05] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground leading-none mb-1">{item.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-black/[0.06]">
            <p className="text-[10px] text-muted-foreground/60 text-center">
              El tour completo está en el botón <span className="font-mono">?</span> de cada página
            </p>
          </div>
        </div>
      )}
    </>
  );
}
