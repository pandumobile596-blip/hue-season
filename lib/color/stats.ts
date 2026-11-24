/** Robust statistics helpers (pure, unit-tested). */

/** Value at quantile q (0–1) using linear interpolation. Does not mutate input. */
export function quantile(values: ArrayLike<number>, q: number): number {
  const n = values.length;
  if (n === 0) return NaN;
  const sorted = Float64Array.from(values).sort();
  const pos = (n - 1) * Math.min(1, Math.max(0, q));
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function median(values: ArrayLike<number>): number {
  return quantile(values, 0.5);
}

/**
 * Indices of values that survive Tukey's fence (outside [Q1 − k·IQR, Q3 + k·IQR] are removed).
 */
export function iqrInlierMask(values: ArrayLike<number>, k = 1.5): boolean[] {
  const q1 = quantile(values, 0.25);
  const q3 = quantile(values, 0.75);
  const iqr = q3 - q1;
  const lo = q1 - k * iqr;
  const hi = q3 + k * iqr;
  return Array.from(values, (v) => v >= lo && v <= hi);
}

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

/** Linearly map v from [a, b] to [0, 1], clamped. Works when a > b (inverted scale). */
export function normalize(v: number, a: number, b: number): number {
  return clamp((v - a) / (b - a));
}

/** Weighted average that ignores entries whose value is null/NaN (weights renormalize). */
export function weightedAverage(entries: Array<[value: number | null, weight: number]>): number | null {
  let sum = 0;
  let wsum = 0;
  for (const [v, w] of entries) {
    if (v === null || Number.isNaN(v) || w <= 0) continue;
    sum += v * w;
    wsum += w;
  }
  return wsum > 0 ? sum / wsum : null;
}
