/**
 * Turns measured skin / eye / hair colors into the 4 season dimensions (0–100).
 * All numbers come from DIMENSIONS in lib/seasons.ts.
 */
import { labToLch, lightnessToLuminance, type Lab } from "@/lib/color/convert";
import { clamp, normalize, weightedAverage } from "@/lib/color/stats";
import { DIMENSIONS, type Dimensions } from "@/lib/seasons";

export interface ColorFeatures {
  skin: Lab;
  /** null when the eyes couldn't be measured (closed, glasses glare…) */
  eyes: Lab | null;
  /** null when hair isn't visible (hat, headscarf, very short hair…) */
  hair: Lab | null;
}

export type Jewelry = "gold" | "silver" | "both";

export interface UserAnswers {
  /** false = dyed hair → hair is ignored. */
  naturalHair?: boolean;
  jewelry?: Jewelry;
}

const score = (unit: number) => Math.round(clamp(unit) * 100);

/** Signed hue difference in degrees (−180…180). */
function hueDiff(h: number, ref: number): number {
  return ((h - ref + 540) % 360) - 180;
}

export function neutralSkinHue(L: number): number {
  const n = DIMENSIONS.undertone.neutralHue;
  return n.base + n.slopePerL * (n.refL - L);
}

/** Warmth (0–1) carried by hair or eyes: golden/red chroma = warm; colorless = no opinion. */
export function featureWarmth(lab: Lab | null): number | null {
  if (!lab) return null;
  const cfg = DIMENSIONS.undertone;
  const { C, h } = labToLch(lab);
  if (C < cfg.minFeatureChroma) return null;
  const [h0, h1] = cfg.featureWarmth.warmHueBand;
  if (h < h0 || h > h1) return null;
  const [c0, c1] = cfg.featureWarmth.chromaRange;
  const [u0, u1] = cfg.featureWarmth.unitRange;
  return u0 + (u1 - u0) * normalize(C, c0, c1);
}

/** FAIRNESS: chroma adjusted for depth (dark colors can't be very chromatic). */
export function depthAdjustedChroma(lab: Lab): number {
  const { fromL, fullAtL, minFactor } = DIMENSIONS.chroma.depthCompensation;
  const factor = minFactor + (1 - minFactor) * normalize(lab.L, fromL, fullAtL);
  return labToLch(lab).C / factor;
}

export function undertoneScore(f: ColorFeatures, answers: UserAnswers = {}): number {
  const cfg = DIMENSIONS.undertone;
  const skin = labToLch(f.skin);
  const toUnit = (deg: number) => 0.5 + (deg * cfg.pointsPerDegree) / 100;

  const skinUnit = toUnit(hueDiff(skin.h, neutralSkinHue(skin.L)));
  const useHair = answers.naturalHair !== false;
  const eyesUnit = f.eyes && f.eyes.b < 0 ? cfg.coolEyeUnit : featureWarmth(f.eyes);
  const unit =
    weightedAverage([
      [clamp(skinUnit), cfg.weights.skin],
      [useHair ? featureWarmth(f.hair) : null, cfg.weights.hair],
      [eyesUnit, cfg.weights.eyes],
    ]) ?? 0.5;

  const nudge =
    answers.jewelry === "gold" ? cfg.jewelryNudge : answers.jewelry === "silver" ? -cfg.jewelryNudge : 0;
  return Math.round(clamp(unit * 100 + nudge, 0, 100));
}

export function valueScore(f: ColorFeatures, answers: UserAnswers = {}): number {
  const { ranges, weights } = DIMENSIONS.value;
  const hair = answers.naturalHair === false ? null : f.hair;
  return score(
    weightedAverage([
      [normalize(f.skin.L, ranges.skin[0], ranges.skin[1]), weights.skin],
      [hair ? normalize(hair.L, ranges.hair[0], ranges.hair[1]) : null, weights.hair],
      [f.eyes ? normalize(f.eyes.L, ranges.eyes[0], ranges.eyes[1]) : null, weights.eyes],
    ]) ?? 0.5,
  );
}

export function chromaScore(f: ColorFeatures, answers: UserAnswers = {}): number {
  const { ranges, weights, hairMinL } = DIMENSIONS.chroma;
  const C = depthAdjustedChroma;
  const hair = answers.naturalHair === false || !f.hair || f.hair.L < hairMinL ? null : f.hair;
  return score(
    weightedAverage([
      [normalize(C(f.skin), ranges.skin[0], ranges.skin[1]), weights.skin],
      [hair ? normalize(C(hair), ranges.hair[0], ranges.hair[1]) : null, weights.hair],
      [f.eyes ? normalize(C(f.eyes), ranges.eyes[0], ranges.eyes[1]) : null, weights.eyes],
    ]) ?? 0.5,
  );
}

/** Contrast between skin and a feature: blend of absolute L* gap and relative luminance contrast. */
function pairContrast(skinL: number, featureL: number, maxDeltaL: number): number {
  const cfg = DIMENSIONS.contrast;
  const abs = clamp(Math.abs(skinL - featureL) / maxDeltaL);
  const ys = lightnessToLuminance(skinL);
  const yf = lightnessToLuminance(featureL);
  const weber = clamp(Math.abs(ys - yf) / Math.max(ys, yf, 1e-4) / cfg.maxWeber);
  return (1 - cfg.relativeShare) * abs + cfg.relativeShare * weber;
}

export function contrastScore(f: ColorFeatures, answers: UserAnswers = {}): number {
  const cfg = DIMENSIONS.contrast;
  const hair = answers.naturalHair === false ? null : f.hair;
  return score(
    weightedAverage([
      [hair ? pairContrast(f.skin.L, hair.L, cfg.maxDeltaL.hair) : null, cfg.weights.hair],
      [f.eyes ? pairContrast(f.skin.L, f.eyes.L, cfg.maxDeltaL.eyes) : null, cfg.weights.eyes],
    ]) ?? 0.5,
  );
}

export function computeDimensions(f: ColorFeatures, answers: UserAnswers = {}): Dimensions {
  return {
    undertone: undertoneScore(f, answers),
    value: valueScore(f, answers),
    chroma: chromaScore(f, answers),
    contrast: contrastScore(f, answers),
  };
}
