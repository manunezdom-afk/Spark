"use client";

import { useState } from "react";
import { Download, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function KairosFlashcardsImport({ topicId }: { topicId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  async function handleImport() {
    setState("loading");
    try {
      const res = await fetch("/api/bridge/kairos/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      const body = (await res.json()) as {
        created?: number;
        skipped?: number;
        error?: string;
      };
      if (!res.ok) {
        toast.error(body.error ?? "Error importando tarjetas.");
        setState("idle");
        return;
      }
      if (body.created === 0) {
        toast("Sin tarjetas nuevas", {
          description:
            body.skipped && body.skipped > 0
              ? `${body.skipped} ya importadas antes.`
              : "Tus apuntes de Kairos no tienen preguntas/respuestas escritas aún.",
        });
      } else {
        toast.success(
          `${body.created} ${body.created === 1 ? "tarjeta importada" : "tarjetas importadas"} de Kairos`,
          { description: body.skipped ? `${body.skipped} ya existían.` : undefined },
        );
      }
      setState("done");
    } catch {
      toast.error("Error de red. Intenta de nuevo.");
      setState("idle");
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleImport}
      disabled={state === "loading" || state === "done"}
      className="gap-1.5 text-[12px]"
    >
      {state === "done" ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} />
      ) : (
        <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
      )}
      {state === "loading"
        ? "Importando…"
        : state === "done"
          ? "Importadas"
          : "Importar tarjetas de Kairos"}
    </Button>
  );
}
