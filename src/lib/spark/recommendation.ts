// Lógica pura para decidir qué proponerle al estudiante a continuación.
// La consume el dashboard (recommended-for-today) y la pantalla de
// summary post-sesión (siguiente paso). No conoce de UI: solo devuelve
// los campos que un componente puede renderizar.

import {
  Activity,
  AlertCircle,
  BookMarked,
  Flame,
  Layers,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type {
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

export interface Recommendation {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  tone: "urgent" | "warm" | "neutral";
  Icon: LucideIcon;
}

export interface RecommendationInput {
  activeSessions: SparkLearningSession[];
  flashcardsDue: number;
  masteryDue: number;
  daysToDeadline: number | null;
  topics: SparkTopic[];
  kairosTopics: SparkTopic[];
  errorsCount: number;
}

export function buildRecommendation(args: RecommendationInput): Recommendation {
  const {
    activeSessions,
    flashcardsDue,
    masteryDue,
    daysToDeadline,
    topics,
    kairosTopics,
    errorsCount,
  } = args;

  if (activeSessions.length > 0) {
    const s = activeSessions[0];
    const theme = getEngineTheme(s.engine);
    return {
      kicker: "Continúa donde lo dejaste",
      title: ENGINE_LABELS[s.engine],
      body: `Sesión iniciada ${formatRelativeTime(s.started_at)}. Termínala antes de empezar otra.`,
      href: `/sessions/${s.id}`,
      cta: "Continuar",
      tone: "warm",
      Icon: theme.Icon,
    };
  }

  if (daysToDeadline !== null && daysToDeadline <= 3) {
    return {
      kicker: "Prioridad — Focus avisa",
      title:
        daysToDeadline === 0
          ? "Tu prueba es hoy"
          : `Tu prueba en ${daysToDeadline} ${daysToDeadline === 1 ? "día" : "días"}`,
      body: "Modo evaluación: alta densidad. Empieza con preguntas guiadas o genera una prueba simulada.",
      href: "/tests/new",
      cta: "Generar prueba",
      tone: "urgent",
      Icon: Flame,
    };
  }

  if (flashcardsDue > 0) {
    return {
      kicker: "Repaso espaciado",
      title: `${flashcardsDue} ${flashcardsDue === 1 ? "tarjeta" : "tarjetas"} para hoy`,
      body: "Sin esto, lo que aprendiste se pierde. Cinco minutos bien invertidos.",
      href: "/flashcards/review",
      cta: "Repasar tarjetas",
      tone: "warm",
      Icon: Layers,
    };
  }

  if (masteryDue > 0) {
    return {
      kicker: "Por repasar",
      title: `${masteryDue} ${masteryDue === 1 ? "tema" : "temas"} para revisitar`,
      body: "Conceptos que ya entrenaste y toca refrescar antes de que se enfríen.",
      href: "/mastery",
      cta: "Ver mapa",
      tone: "warm",
      Icon: Activity,
    };
  }

  if (errorsCount > 0) {
    return {
      kicker: "Detección",
      title: `${errorsCount} ${errorsCount === 1 ? "error" : "errores"} sin atender`,
      body: "Patrones que se repiten en tus sesiones. Atácalos antes de que se vuelvan hábito.",
      href: "/errors",
      cta: "Revisar errores",
      tone: "neutral",
      Icon: AlertCircle,
    };
  }

  if (!topics.length) {
    return {
      kicker: "Empieza aquí",
      title: "Crea tu primer tema",
      body: "Un tema es un trozo de material — tu materia, tu capítulo, tus apuntes. De ahí salen todas las sesiones.",
      href: "/topics",
      cta: "Crear tema",
      tone: "warm",
      Icon: BookMarked,
    };
  }

  if (kairosTopics.length > 0) {
    const t = kairosTopics[0];
    return {
      kicker: "Tu material de Kairos",
      title: `Entrena con ${t.title}`,
      body: "Tus apuntes de clase entran como contexto en cada pregunta de Nova.",
      href: `/sessions/new?topic_ids=${t.id}`,
      cta: "Empezar sesión",
      tone: "neutral",
      Icon: Sparkles,
    };
  }

  const t = topics[0];
  return {
    kicker: "Sin urgencias",
    title: `Practica ${t.title}`,
    body: "Buen momento para profundizar con preguntas guiadas o conectar temas.",
    href: `/sessions/new?topic_ids=${t.id}`,
    cta: "Empezar sesión",
    tone: "neutral",
    Icon: Sparkles,
  };
}

export function formatRelativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "hace un momento";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? "día" : "días"}`;
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
  });
}
