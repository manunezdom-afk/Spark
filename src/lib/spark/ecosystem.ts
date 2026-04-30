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

export const FOCUS_URL =
  process.env.NEXT_PUBLIC_FOCUS_URL ?? "https://usefocus.me";

/** Alias semántico — Focus es iOS, esto apunta a la landing con "Download" */
export const FOCUS_IOS_URL = FOCUS_URL;

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
