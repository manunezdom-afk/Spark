import Link from "next/link";
import { ExternalLink, BookOpen } from "lucide-react";

/**
 * Banner sutil que se muestra en /topics cuando:
 *  - El usuario INTENTÓ conectar Kairos al menos una vez (cookie
 *    `spark_kairos_attempted`).
 *  - Pero NO tiene snapshot de Kairos en Supabase (probablemente está
 *    usando Kairos en modo invitado, que solo guarda en localStorage).
 *  - Y NO tiene topics importados de Kairos.
 *
 * El estilo es deliberadamente low-key: una tira fina con icono pequeño,
 * sin urgencia, no acapara la pantalla. La intención es informar, no
 * presionar.
 *
 * El URL de Kairos se toma de NEXT_PUBLIC_KAIROS_URL si existe; el
 * fallback es kairostudios.me (la URL pública de la app).
 */
export function KairosConnectBanner() {
  const kairosUrl =
    process.env.NEXT_PUBLIC_KAIROS_URL ?? "https://kairostudios.me";

  return (
    <div className="flex items-start gap-3 rounded-xl border border-black/[0.06] bg-white/40 px-3.5 py-2.5 mb-6 sm:items-center">
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-nova-soft border border-nova/20 shrink-0">
        <BookOpen className="w-3.5 h-3.5 text-nova-mid" strokeWidth={1.7} />
      </span>
      <p className="flex-1 text-[12px] leading-relaxed text-muted-foreground">
        Tus notas de Kairos no están disponibles aquí. Si usás Kairos sin
        cuenta, creá una con el mismo email para sincronizar tus materias.
      </p>
      <Link
        href={kairosUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 inline-flex items-center gap-1 rounded-md border border-black/[0.08] bg-white/60 px-2.5 py-1 text-[11px] text-foreground/80 transition-colors hover:border-black/[0.14] hover:text-foreground"
      >
        Abrir Kairos
        <ExternalLink className="w-3 h-3" strokeWidth={1.7} />
      </Link>
    </div>
  );
}
