"use client";

import { ExternalLink } from "lucide-react";
import { kairosSubjectUrl } from "@/lib/spark/ecosystem";

/**
 * Header sutil que aparece en el detalle de un topic cuando este se
 * importó desde Kairos. Le da al usuario contexto de origen y un link
 * directo a la materia/clase original.
 *
 * Diseño minimalista: una sola línea con un dot del color de la materia,
 * etiqueta "Desde Kairos", y nombre opcional del subject.
 */
export function KairosSourceHeader({
  subjectId,
  color,
  subjectName,
}: {
  subjectId: string;
  color: string | null;
  subjectName?: string;
}) {
  return (
    <a
      href={kairosSubjectUrl(subjectId)}
      target="_blank"
      rel="noopener noreferrer"
      className="group inline-flex items-center gap-2 mb-4 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/[0.05]"
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ background: color ?? "#A78BFA" }}
      />
      <span className="text-muted-foreground">Desde</span>
      <span className="font-medium text-foreground/80 group-hover:text-foreground">
        Kairos
      </span>
      {subjectName && (
        <>
          <span className="text-muted-foreground/40">·</span>
          <span className="text-foreground/70 truncate max-w-[180px]">
            {subjectName}
          </span>
        </>
      )}
      <ExternalLink className="h-3 w-3 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
    </a>
  );
}
