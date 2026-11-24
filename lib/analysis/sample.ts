/**
 * Measures skin, eye and hair colors from a still image using face landmarks
 * (and an optional hair mask). Pure functions on plain pixel arrays — no DOM —
 * so everything here is unit-testable.
 */
import { SRGB_TO_LINEAR_LUT, linearRgbToLab, type Lab } from "@/lib/color/convert";
import { iqrInlierMask, median, quantile } from "@/lib/color/stats";
import type { ColorFeatures } from "./dimensions";
import { EYE_POLYGONS, LM } from "./landmarks";

export interface PixelImage {
  width: number;
  height: number;
  /** RGBA, row-major (same layout as ImageData.data). */
  data: Uint8ClampedArray;
}

/** Normalized landmark (0–1), as returned by MediaPipe. */
export interface Point {
  x: number;
  y: number;
}

/** Per-pixel mask; any value > 0 means "hair". Size may differ from the image. */
export interface PixelMask {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray;
}

export type LightingIssue = "too-dark" | "too-bright" | "warm-cast" | "cool-cast";

export interface WhiteBalance {
  /** Multipliers applied to linear R, G, B. */
  gains: [number, number, number];
  source: "sclera" | "gray-world" | "none";
  /** Lab of the reference before correction (for diagnostics). */
  reference: Lab | null;
}

export interface SampleResult {
  features: ColorFeatures | null;
  whiteBalance: WhiteBalance;
  issues: LightingIssue[];
  counts: { skin: number; eyes: number; hair: number };
}

// ─── Tuning (photo handling, not season logic) ───────────────────────────────
export const SAMPLING = {
  cheekRadius: 0.085, // × face width
  foreheadRadius: 0.07, // × face width
  minSkinPixels: 120,
  minEyePixels: 20,
  minHairPixels: 300,
  eyeOpenRatio: 0.16, // lid gap / eye width below this = eyes closed
  irisInner: 0.35, // skip pupil (× iris radius)
  irisOuter: 0.85, // skip the dark limbal ring
  scleraOuterFactor: 1.25, // sclera starts this far from iris center (× radius)
  wb: {
    scleraStrength: 0.6, // sclera isn't perfectly white, so only correct partway
    grayWorldStrength: 0.35,
    minGain: 0.8,
    maxGain: 1.25,
    warmCastB: 9, // reference b* above this → warm light warning
    coolCastB: -6, // reference b* below this → cool light warning
  },
  exposure: {
    nearBlackLuma: 18, // 0–255
    clipped: 250,
    maxNearBlackShare: 0.25,
    maxClippedShare: 0.2,
  },
};

// ─── Geometry helpers ─────────────────────────────────────────────────────────

const toPx = (p: Point, img: PixelImage) => ({ x: p.x * img.width, y: p.y * img.height });

export function pointInPolygon(x: number, y: number, poly: Array<{ x: number; y: number }>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function faceWidthPx(lm: Point[], img: PixelImage): number {
  const a = toPx(lm[LM.faceLeft], img);
  const b = toPx(lm[LM.faceRight], img);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Iterate over integer pixels inside a circle (clipped to the image). */
function forEachInCircle(img: PixelImage, cx: number, cy: number, r: number, fn: (i: number, x: number, y: number) => void) {
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(img.width - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(img.height - 1, Math.ceil(cy + r));
  const r2 = r * r;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r2) fn((y * img.width + x) * 4, x, y);
    }
  }
}

function isHair(mask: PixelMask | undefined, img: PixelImage, x: number, y: number): boolean {
  if (!mask) return false;
  const mx = Math.min(mask.width - 1, Math.floor((x / img.width) * mask.width));
  const my = Math.min(mask.height - 1, Math.floor((y / img.height) * mask.height));
  return mask.data[my * mask.width + mx] > 0;
}

// ─── Pixel collection ─────────────────────────────────────────────────────────

class LabBuffer {
  L: number[] = [];
  a: number[] = [];
  b: number[] = [];
  push(lab: Lab) {
    this.L.push(lab.L);
    this.a.push(lab.a);
    this.b.push(lab.b);
  }
  get size() {
    return this.L.length;
  }
}

function pixelLab(img: PixelImage, i: number, g: [number, number, number]): Lab {
  const d = img.data;
  return linearRgbToLab(
    Math.min(1, SRGB_TO_LINEAR_LUT[d[i]] * g[0]),
    Math.min(1, SRGB_TO_LINEAR_LUT[d[i + 1]] * g[1]),
    Math.min(1, SRGB_TO_LINEAR_LUT[d[i + 2]] * g[2]),
  );
}

/**
 * Robust center of a pixel cloud:
 * 1. keep the [lowQ, highQ] band of lightness (drops shadows & specular highlights)
 * 2. drop a* and b* outliers with Tukey fences
 * 3. take per-channel medians
 */
export function robustLab(buf: LabBuffer, lowQ: number, highQ: number): Lab | null {
  if (buf.size === 0) return null;
  const lo = quantile(buf.L, lowQ);
  const hi = quantile(buf.L, highQ);
  const keep: number[] = [];
  for (let i = 0; i < buf.size; i++) if (buf.L[i] >= lo && buf.L[i] <= hi) keep.push(i);
  if (keep.length === 0) return null;
  const a = keep.map((i) => buf.a[i]);
  const b = keep.map((i) => buf.b[i]);
  const okA = iqrInlierMask(a);
  const okB = iqrInlierMask(b);
  const final = keep.filter((_, k) => okA[k] && okB[k]);
  const pick = final.length > 0 ? final : keep;
  return {
    L: median(pick.map((i) => buf.L[i])),
    a: median(pick.map((i) => buf.a[i])),
    b: median(pick.map((i) => buf.b[i])),
  };
}

// ─── White balance ────────────────────────────────────────────────────────────

function gainsFrom(meanLin: [number, number, number], strength: number): [number, number, number] {
  const { minGain, maxGain } = SAMPLING.wb;
  const gray = (meanLin[0] + meanLin[1] + meanLin[2]) / 3;
  return meanLin.map((c) => {
    const full = c > 1e-4 ? gray / c : 1;
    const g = 1 + (full - 1) * strength;
    return Math.min(maxGain, Math.max(minGain, g));
  }) as [number, number, number];
}

interface EyeGeometry {
  center: { x: number; y: number };
  radius: number;
  polygon: Array<{ x: number; y: number }>;
  open: boolean;
}

function eyeGeometry(lm: Point[], img: PixelImage): EyeGeometry[] {
  const eyes: EyeGeometry[] = [];
  const irises = [LM.irisA, LM.irisB];
  if (lm.length < 478) return eyes; // model without irises
  for (const iris of irises) {
    const c = toPx(lm[iris.center], img);
    const radius =
      iris.ring.reduce((s, idx) => {
        const p = toPx(lm[idx], img);
        return s + Math.hypot(p.x - c.x, p.y - c.y);
      }, 0) / iris.ring.length;
    // Match the iris with the eyelid outline that contains it.
    const polygon =
      EYE_POLYGONS.map((poly) => poly.map((idx) => toPx(lm[idx], img))).find((poly) =>
        pointInPolygon(c.x, c.y, poly),
      ) ?? [];
    eyes.push({ center: c, radius, polygon, open: false });
  }
  // Eye openness from lid gap / eye width.
  const gap = (u: number, l: number, o: number, i: number) => {
    const U = toPx(lm[u], img);
    const Lw = toPx(lm[l], img);
    const O = toPx(lm[o], img);
    const I = toPx(lm[i], img);
    return Math.hypot(U.x - Lw.x, U.y - Lw.y) / Math.max(1, Math.hypot(O.x - I.x, O.y - I.y));
  };
  const open =
    Math.min(
      gap(LM.leftEyeUpper, LM.leftEyeLower, LM.leftEyeOuter, LM.leftEyeInner),
      gap(LM.rightEyeUpper, LM.rightEyeLower, LM.rightEyeOuter, LM.rightEyeInner),
    ) >= SAMPLING.eyeOpenRatio;
  return eyes.map((e) => ({ ...e, open: open && e.polygon.length > 0 }));
}

function boundingBox(lm: Point[], img: PixelImage) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of lm) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return { x0: x0 * img.width, y0: y0 * img.height, x1: x1 * img.width, y1: y1 * img.height };
}

export function estimateWhiteBalance(
  img: PixelImage,
  lm: Point[],
  hairMask?: PixelMask,
): WhiteBalance {
  const L = SRGB_TO_LINEAR_LUT;
  const d = img.data;

  // 1) Sclera: bright pixels inside the eyelids but outside the iris.
  const eyes = eyeGeometry(lm, img).filter((e) => e.open);
  const lum: number[] = [];
  const rgb: Array<[number, number, number]> = [];
  for (const e of eyes) {
    const xs = e.polygon.map((p) => p.x);
    const ys = e.polygon.map((p) => p.y);
    for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(img.height - 1, Math.ceil(Math.max(...ys))); y++) {
      for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(img.width - 1, Math.ceil(Math.max(...xs))); x++) {
        if (Math.hypot(x - e.center.x, y - e.center.y) < e.radius * SAMPLING.scleraOuterFactor) continue;
        if (!pointInPolygon(x, y, e.polygon)) continue;
        const i = (y * img.width + x) * 4;
        const r = L[d[i]];
        const g = L[d[i + 1]];
        const b = L[d[i + 2]];
        rgb.push([r, g, b]);
        lum.push(0.2126 * r + 0.7152 * g + 0.0722 * b);
      }
    }
  }
  if (rgb.length >= 30) {
    const cut = quantile(lum, 0.6); // the whitest 40%
    const bright = rgb.filter((_, i) => lum[i] >= cut);
    const mean: [number, number, number] = [0, 0, 0];
    for (const p of bright) for (let c = 0; c < 3; c++) mean[c] += p[c] / bright.length;
    const ref = linearRgbToLab(mean[0], mean[1], mean[2]);
    if (ref.L >= 40 && Math.hypot(ref.a, ref.b) < 30) {
      return { gains: gainsFrom(mean, SAMPLING.wb.scleraStrength), source: "sclera", reference: ref };
    }
  }

  // 2) Gray-world on the background (outside the face box, not hair), sampled sparsely.
  const box = boundingBox(lm, img);
  const mean: [number, number, number] = [0, 0, 0];
  let n = 0;
  const step = Math.max(2, Math.round(Math.min(img.width, img.height) / 160));
  for (let y = 0; y < img.height; y += step) {
    for (let x = 0; x < img.width; x += step) {
      if (x > box.x0 && x < box.x1 && y > box.y0) continue; // face & body below it
      if (isHair(hairMask, img, x, y)) continue;
      const i = (y * img.width + x) * 4;
      mean[0] += L[d[i]];
      mean[1] += L[d[i + 1]];
      mean[2] += L[d[i + 2]];
      n++;
    }
  }
  if (n >= 200) {
    for (let c = 0; c < 3; c++) mean[c] /= n;
    const ref = linearRgbToLab(mean[0], mean[1], mean[2]);
    return { gains: gainsFrom(mean, SAMPLING.wb.grayWorldStrength), source: "gray-world", reference: ref };
  }
  return { gains: [1, 1, 1], source: "none", reference: null };
}

// ─── Main entry ───────────────────────────────────────────────────────────────

export function sampleFeatures(img: PixelImage, lm: Point[], hairMask?: PixelMask): SampleResult {
  const wb = estimateWhiteBalance(img, lm, hairMask);
  const g = wb.gains;
  const fw = faceWidthPx(lm, img);
  const issues: LightingIssue[] = [];
  const d = img.data;

  // Skin: two cheeks + forehead.
  const skin = new LabBuffer();
  let total = 0;
  let nearBlack = 0;
  let clipped = 0;
  const regions: Array<[Point, number]> = [
    [lm[LM.cheekLeft], SAMPLING.cheekRadius],
    [lm[LM.cheekRight], SAMPLING.cheekRadius],
    [lm[LM.forehead], SAMPLING.foreheadRadius],
  ];
  for (const [p, rf] of regions) {
    const c = toPx(p, img);
    forEachInCircle(img, c.x, c.y, rf * fw, (i, x, y) => {
      if (isHair(hairMask, img, x, y)) return;
      total++;
      const luma = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (luma < SAMPLING.exposure.nearBlackLuma) nearBlack++;
      if (d[i] >= SAMPLING.exposure.clipped || d[i + 1] >= SAMPLING.exposure.clipped || d[i + 2] >= SAMPLING.exposure.clipped) {
        clipped++;
        return; // clipped pixels carry no color information
      }
      skin.push(pixelLab(img, i, g));
    });
  }
  if (total > 0 && nearBlack / total > SAMPLING.exposure.maxNearBlackShare) issues.push("too-dark");
  if (total > 0 && clipped / total > SAMPLING.exposure.maxClippedShare) issues.push("too-bright");

  if (wb.reference) {
    const limit = wb.source === "sclera" ? 1 : 1.6; // gray-world is noisier, so be lenient
    if (wb.reference.b > SAMPLING.wb.warmCastB * limit) issues.push("warm-cast");
    else if (wb.reference.b < SAMPLING.wb.coolCastB * limit) issues.push("cool-cast");
  }

  // Eyes: ring of the iris inside the eyelids, minus reflections.
  const eyesBuf = new LabBuffer();
  for (const e of eyeGeometry(lm, img)) {
    if (!e.open) continue;
    forEachInCircle(img, e.center.x, e.center.y, e.radius * SAMPLING.irisOuter, (i, x, y) => {
      if (Math.hypot(x - e.center.x, y - e.center.y) < e.radius * SAMPLING.irisInner) return;
      if (!pointInPolygon(x, y, e.polygon)) return;
      eyesBuf.push(pixelLab(img, i, g));
    });
  }

  // Hair: masked pixels in a generous box around the head.
  const hairBuf = new LabBuffer();
  if (hairMask) {
    const box = boundingBox(lm, img);
    const w = box.x1 - box.x0;
    const h = box.y1 - box.y0;
    const x0 = Math.max(0, Math.floor(box.x0 - w * 0.8));
    const x1 = Math.min(img.width - 1, Math.ceil(box.x1 + w * 0.8));
    const y0 = Math.max(0, Math.floor(box.y0 - h * 0.8));
    const y1 = Math.min(img.height - 1, Math.ceil(box.y1 + h * 0.6));
    const area = (x1 - x0) * (y1 - y0);
    const step = Math.max(1, Math.round(Math.sqrt(area / 40000))); // cap ≈40k samples
    for (let y = y0; y <= y1; y += step) {
      for (let x = x0; x <= x1; x += step) {
        if (!isHair(hairMask, img, x, y)) continue;
        hairBuf.push(pixelLab(img, (y * img.width + x) * 4, g));
      }
    }
  }

  const skinLab = skin.size >= SAMPLING.minSkinPixels ? robustLab(skin, 0.15, 0.9) : null;
  const eyesLab = eyesBuf.size >= SAMPLING.minEyePixels ? robustLab(eyesBuf, 0.05, 0.85) : null;
  const hairLab = hairBuf.size >= SAMPLING.minHairPixels ? robustLab(hairBuf, 0.05, 0.85) : null;

  return {
    features: skinLab ? { skin: skinLab, eyes: eyesLab, hair: hairLab } : null,
    whiteBalance: wb,
    issues,
    counts: { skin: skin.size, eyes: eyesBuf.size, hair: hairBuf.size },
  };
}
