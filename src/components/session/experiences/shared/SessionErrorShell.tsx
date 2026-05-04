"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionShell } from "../../SessionShell";
import { getEngineTheme } from "@/modules/spark/engines/themes";
import type {
  SparkLearningSession,
  SparkTopic,
} from "@/modules/spark/types";

/**
 * Error shell para fallos críticos al cargar/streamear la sesión.
 * No se usa cuando la session row ya no existe (eso es 404 en
 * page.tsx con notFound()), sino cuando la generación falló o
 * el stream se cortó sin llegar al primer assistant turn.
 */
export function SessionErrorShell({
  session,
  topics,
  message,
  onRetry,
}: {
  session: SparkLearningSession;
  topics: SparkTopic[];
  message?: string;
  /** Si está presente, muestra botón Reintentar. */
  onRetry?: () => void;
}) {
  const theme = getEngineTheme(session.engine);
  return (
    <SessionShell
      engine={session.engine}
      topics={topics}
      status={session.status}
      canComplete={false}
    >
      <div className="flex flex-col items-center justify-center min-h-[55vh] px-6 py-12 max-w-md mx-auto w-full text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center border mb-5"
          style={{
            background: "rgb(254 226 226 / 0.5)",
            borderColor: "rgba(244, 63, 94, 0.25)",
          }}
        >
          <AlertTriangle
            className="w-6 h-6 text-rose-600"
            strokeWidth={1.7}
          />
        </div>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground mb-2 leading-tight">
          No pudimos cargar esta sesión
        </h2>
        <p className="text-[13.5px] text-muted-foreground leading-relaxed mb-7">
          {message ??
            "Algo salió mal preparando la actividad. Puede ser una conexión inestable o un fallo temporal del modelo."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="gap-1.5 text-white"
              style={{ background: theme.coachGradient }}
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.7} />
              Reintentar
            </Button>
          )}
          <Button asChild variant="outline" className="gap-1.5">
            <Link href="/sessions">
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.7} />
              Volver a Sesiones
            </Link>
          </Button>
        </div>
      </div>
    </SessionShell>
  );
}

