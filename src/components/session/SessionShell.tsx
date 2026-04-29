"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ENGINE_LABELS } from "@/modules/spark/engines";
import type { LearningEngine, SparkTopic } from "@/modules/spark/types";

export function SessionShell({
  engine,
  topics,
  status,
  onComplete,
  children,
}: {
  engine: LearningEngine;
  topics: SparkTopic[];
  status: "active" | "completed" | "abandoned";
  onComplete: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen md:h-auto md:min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-5 md:px-8 h-16 border-b border-white/[0.06] bg-[#0a0c11]/80 backdrop-blur-xl">
        <Link
          href="/topics"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          Salir
        </Link>

        <div className="flex items-center gap-2 min-w-0 flex-1 justify-center">
          <Badge variant="spark">{ENGINE_LABELS[engine]}</Badge>
          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
            {topics.map((t) => t.title).join(" · ")}
          </span>
        </div>

        {status === "active" ? (
          <Button onClick={onComplete} size="sm" variant="outline">
            Finalizar
          </Button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {status === "completed" ? "Completada" : "Abandonada"}
          </span>
        )}
      </header>

      <div className="flex-1 px-5 md:px-8 py-6 max-w-3xl w-full mx-auto">
        {children}
      </div>
    </div>
  );
}
