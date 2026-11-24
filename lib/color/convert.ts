/**
 * Color conversions: sRGB (0–255) ⇄ linear RGB ⇄ CIE XYZ (D65) ⇄ CIELAB ⇄ LCh.
 * Pure functions, no DOM — unit-tested in tests/color.test.ts.
 */

export type RGB = [number, number, number];

export interface Lab {
  L: number; // lightness 0 (black) – 100 (white)
  a: number; // green (−) ↔ red (+)
  b: number; // blue (−) ↔ yellow (+)
}

export interface LCh {
  L: number;
  C: number; // chroma (colorfulness)
  h: number; // hue angle in degrees, 0–360
}

// D65 reference white
const Xn = 0.95047;
const Yn = 1.0;
const Zn = 1.08883;

/** sRGB channel 0–255 → linear 0–1 (inverse gamma). */
export function srgbToLinear(v: number): number {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Linear 0–1 → sRGB channel 0–255 (clamped). */
export function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.max(v, 0), 1 / 2.4) - 0.055;
  return Math.min(255, Math.max(0, c * 255));
}

/** Precomputed lookup table: sRGB byte → linear. Used in hot pixel loops. */
export const SRGB_TO_LINEAR_LUT: Float32Array = (() => {
  const t = new Float32Array(256);
  for (let i = 0; i < 256; i++) t[i] = srgbToLinear(i);
  return t;
})();

function f(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116;
}

function fInv(t: number): number {
  return t * t * t > 216 / 24389 ? t * t * t : (116 * t - 16) / (24389 / 27);
}

/** Linear RGB (0–1) → Lab. */
export function linearRgbToLab(r: number, g: number, b: number): Lab {
  const X = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = 0.0193339 * r + 0.119192 * g + 0.9503041 * b;
  const fx = f(X / Xn);
  const fy = f(Y / Yn);
  const fz = f(Z / Zn);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** sRGB (0–255) → Lab. */
export function rgbToLab([r, g, b]: RGB): Lab {
  return linearRgbToLab(srgbToLinear(r), srgbToLinear(g), srgbToLinear(b));
}

/** Lab → sRGB (0–255, clamped to gamut). */
export function labToRgb({ L, a, b }: Lab): RGB {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const X = Xn * fInv(fx);
  const Y = Yn * fInv(fy);
  const Z = Zn * fInv(fz);
  const r = 3.2404542 * X - 1.5371385 * Y - 0.4985314 * Z;
  const g = -0.969266 * X + 1.8760108 * Y + 0.041556 * Z;
  const bl = 0.0556434 * X - 0.2040259 * Y + 1.0572252 * Z;
  return [linearToSrgb(r), linearToSrgb(g), linearToSrgb(bl)];
}

/** Lab → LCh (polar form). */
export function labToLch({ L, a, b }: Lab): LCh {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

/** CIE76 color difference — good enough for our sanity checks. */
export function deltaE(x: Lab, y: Lab): number {
  return Math.hypot(x.L - y.L, x.a - y.a, x.b - y.b);
}

/** Relative luminance Y (0–1) from L*. */
export function lightnessToLuminance(L: number): number {
  return fInv((L + 16) / 116);
}

export function rgbToHex([r, g, b]: RGB): `#${string}` {
  const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function hexToRgb(hex: string): RGB {
  const m = hex.replace("#", "");
  return [parseInt(m.slice(0, 2), 16), parseInt(m.slice(2, 4), 16), parseInt(m.slice(4, 6), 16)];
}

export function labToHex(lab: Lab): `#${string}` {
  return rgbToHex(labToRgb(lab));
}
