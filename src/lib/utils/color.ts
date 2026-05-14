/**
 * Convierte un color hex (#RRGGBB) a string rgba con alpha 0–1.
 * Si el hex viene mal formado, devuelve el negro con el alpha pedido.
 */
export function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  if (value.length !== 6) return `rgba(0, 0, 0, ${alpha})`;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
