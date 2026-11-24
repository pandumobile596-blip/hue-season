/**
 * Hard-stop CSS gradient that paints colors as equal stripes — one element
 * instead of one <span> per color (smaller DOM = faster hydration on phones).
 */
export function stripes(colors: string[], direction: "to right" | "to bottom" = "to right"): string {
  const n = colors.length;
  const stops = colors.map((c, i) => `${c} ${((i / n) * 100).toFixed(3)}% ${(((i + 1) / n) * 100).toFixed(3)}%`);
  return `linear-gradient(${direction}, ${stops.join(", ")})`;
}
