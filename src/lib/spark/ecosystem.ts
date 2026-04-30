/**
 * URLs del ecosistema Focus OS.
 *
 * Estas constantes se inyectan vía variables de entorno cuando estén
 * disponibles. Si no, se usan valores por defecto razonables que apuntan
 * a los dominios públicos del producto.
 *
 * Importante: Focus es la app del calendario para *cualquier* persona —
 * no solo estudiantes. Por eso este archivo no la trata como peer directo
 * de Kairos/Spark, sino como un descubrimiento opcional vía iOS.
 */

export const KAIROS_URL =
  process.env.NEXT_PUBLIC_KAIROS_URL ?? "https://kairostudios.me";

export const SPARK_URL =
  process.env.NEXT_PUBLIC_SPARK_URL ?? "https://spark.focusos.cl";

export const FOCUS_IOS_URL =
  process.env.NEXT_PUBLIC_FOCUS_IOS_URL ??
  "https://apps.apple.com/cl/app/focus-os";

export const FOCUS_LANDING_URL =
  process.env.NEXT_PUBLIC_FOCUS_LANDING_URL ?? "https://focusos.cl";

/**
 * Construye un URL de Kairos hacia una sesión específica.
 * Usado para los headers "desde tu clase de [X] en Kairos".
 */
export function kairosSessionUrl(subjectId: string, sessionId: string): string {
  return `${KAIROS_URL}/materias/${subjectId}/${sessionId}`;
}

export function kairosSubjectUrl(subjectId: string): string {
  return `${KAIROS_URL}/materias/${subjectId}`;
}
