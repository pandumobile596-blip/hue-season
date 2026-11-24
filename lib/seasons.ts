/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SEASON DEFINITIONS & TUNING KNOBS
 *  Everything that decides "which season are you?" lives in this file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW IT WORKS (in plain words)
 * 1. We measure three colors from the photo: skin, eyes (iris) and hair, in CIELAB.
 *      L* = lightness (0 black … 100 white)
 *      C* = chroma, i.e. how colorful (0 gray … ~40 for skin)
 *      h  = hue angle (skin sits around 40°–70°: lower = pinker/cooler, higher = yellower/warmer)
 * 2. We turn those into 4 scores, each 0–100 (see DIMENSIONS below):
 *      undertone  0 = cool ………… 100 = warm
 *      value      0 = deep ………… 100 = light
 *      chroma     0 = soft/muted … 100 = bright/clear
 *      contrast   0 = low ………… 100 = high
 * 3. Each of the 12 seasons has a "target" on those 4 scores (SEASON_PROFILES).
 *    The person's season is the closest target (weighted distance); the 2nd closest
 *    is the runner-up, and confidence comes from how clearly the top one wins.
 *
 * FAIRNESS ACROSS SKIN TONES
 * - Undertone uses the skin's HUE ANGLE compared to a depth-adjusted neutral, not raw b*.
 *   Raw b* grows with skin depth, which would wrongly push deeper skin toward "warm".
 * - Contrast blends an absolute lightness gap with a RELATIVE (Weber) luminance contrast,
 *   so deep skin with black hair can still read as high contrast — it often is.
 * - Depth (value) is only one of four scores; deep skin can land in any Deep, True or Bright
 *   season, and the tests in tests/seasons.test.ts check the full skin-tone range.
 *
 * TUNING TIPS
 * - Change one number at a time and run `npm test` — the tests describe intended behavior.
 * - To make a season "bigger", move its profile toward the center (50) on its weak dims,
 *   or lower DIMENSION_WEIGHTS for the dims you trust least.
 */

import type { SeasonSlug } from "@/content/palettes";

export type Dimension = "undertone" | "value" | "chroma" | "contrast";
export type Dimensions = Record<Dimension, number>;

// ─── 1. DIMENSIONS: how raw LAB measurements become 0–100 scores ─────────────

export const DIMENSIONS = {
  undertone: {
    /**
     * Neutral skin hue (degrees) at a given skin L*. Deeper skin naturally has a slightly
     * higher hue angle, so the "neutral" point shifts up as L* goes down.
     *   neutralHue(L) = base + slopePerL × (refL − L)
     */
    neutralHue: { base: 55, refL: 65, slopePerL: 0.12 },
    /** Score points per degree of hue away from neutral (±12.5° covers the full scale). */
    pointsPerDegree: 4,
    /** How much eyes and hair contribute to warmth when they are colorful enough. */
    weights: { skin: 0.8, hair: 0.12, eyes: 0.08 },
    /** Hair/eyes need at least this chroma to say anything about warmth (black/ash hair is skipped). */
    minFeatureChroma: 8,
    /**
     * Hair & eye warmth come from how much golden/red color they carry (chroma in the
     * warm hue band), not from hue alone — copper hair has a "red" hue but reads very warm.
     * Chroma `chromaRange[0]` → `unitRange[0]`, `chromaRange[1]` → `unitRange[1]`.
     */
    featureWarmth: { warmHueBand: [15, 110], chromaRange: [8, 24], unitRange: [0.4, 1] },
    /** Blue/gray eyes (b* < 0) lean cool. */
    coolEyeUnit: 0.25,
    /** Optional jewelry question nudge (score points). */
    jewelryNudge: 6,
  },
  value: {
    /** L* range mapped to 0–100 for each feature [deep, light]. */
    ranges: { skin: [25, 78], hair: [12, 75], eyes: [15, 60] },
    weights: { skin: 0.5, hair: 0.35, eyes: 0.15 },
  },
  chroma: {
    /** C* range mapped to 0–100 for each feature [muted, bright]. */
    ranges: { skin: [14, 32], hair: [3, 25], eyes: [6, 30] },
    weights: { skin: 0.3, hair: 0.25, eyes: 0.45 },
    /** Very dark hair hides its chroma, so we ignore hair chroma below this L*. */
    hairMinL: 22,
    /**
     * FAIRNESS: darker colors physically can't reach high chroma, so deep skin and dark
     * eyes would always read "muted". We divide C* by a factor that shrinks for low L*:
     * factor = minFactor at L ≤ fromL, rising linearly to 1 at L ≥ fullAtL.
     */
    depthCompensation: { fromL: 15, fullAtL: 55, minFactor: 0.75 },
  },
  contrast: {
    /** Absolute L* gap that counts as "maximum" contrast. */
    maxDeltaL: { hair: 50, eyes: 40 },
    /** Relative (Weber) luminance contrast that counts as "maximum". */
    maxWeber: 0.9,
    /** Blend between absolute gap and relative contrast (0 = only absolute, 1 = only relative). */
    relativeShare: 0.5,
    weights: { hair: 0.65, eyes: 0.35 },
  },
} as const;

// ─── 2. SEASON PROFILES: the "target" scores for each season ──────────────────
// Each row: [undertone, value, chroma, contrast]. 0–100 scales as described above.

export const SEASON_PROFILES: Record<SeasonSlug, Dimensions> = {
  //                 undertone      value       chroma       contrast
  "light-spring":  { undertone: 66, value: 82, chroma: 55, contrast: 30 },
  "true-spring":   { undertone: 86, value: 62, chroma: 70, contrast: 45 },
  "bright-spring": { undertone: 62, value: 58, chroma: 86, contrast: 75 },

  "light-summer":  { undertone: 34, value: 82, chroma: 40, contrast: 28 },
  "true-summer":   { undertone: 14, value: 56, chroma: 40, contrast: 40 },
  "soft-summer":   { undertone: 38, value: 46, chroma: 18, contrast: 30 },

  "soft-autumn":   { undertone: 62, value: 46, chroma: 18, contrast: 30 },
  "true-autumn":   { undertone: 86, value: 40, chroma: 55, contrast: 50 },
  "deep-autumn":   { undertone: 64, value: 14, chroma: 50, contrast: 58 },

  "deep-winter":   { undertone: 22, value: 14, chroma: 55, contrast: 68 },
  "true-winter":   { undertone: 14, value: 40, chroma: 70, contrast: 80 },
  "bright-winter": { undertone: 38, value: 46, chroma: 86, contrast: 86 },
};

/** How much each dimension counts in the distance. Undertone matters most in seasonal theory. */
export const DIMENSION_WEIGHTS: Dimensions = {
  undertone: 1.25,
  value: 1.0,
  chroma: 1.0,
  contrast: 0.85,
};

/**
 * Per-season emphasis, multiplied on top of DIMENSION_WEIGHTS. In seasonal theory each
 * sub-season is defined by ONE dominant trait (Light = value, True = undertone,
 * Bright/Soft = chroma, Deep = value), so that trait counts more and the others less.
 * Example: a Bright season cares little about value — this is what lets deep skin with
 * very clear, high-contrast coloring land in Bright Winter instead of being forced "Deep".
 */
type Emphasis = Partial<Dimensions>;
const LIGHT: Emphasis = { value: 1.5 };
const TRUE: Emphasis = { undertone: 1.5 };
const BRIGHT: Emphasis = { chroma: 1.4, value: 0.35, contrast: 1.0 };
const SOFT: Emphasis = { chroma: 1.4, value: 0.7 };
const DEEP: Emphasis = { value: 1.4, chroma: 0.6, contrast: 0.6 };

export const SEASON_EMPHASIS: Record<SeasonSlug, Emphasis> = {
  "light-spring": LIGHT,
  "true-spring": TRUE,
  "bright-spring": BRIGHT,
  "light-summer": LIGHT,
  "true-summer": TRUE,
  "soft-summer": SOFT,
  "soft-autumn": SOFT,
  "true-autumn": TRUE,
  "deep-autumn": DEEP,
  "deep-winter": DEEP,
  "true-winter": TRUE,
  "bright-winter": BRIGHT,
};

// ─── 3. CONFIDENCE ────────────────────────────────────────────────────────────

export const CONFIDENCE = {
  /** Softmax temperature over distances: lower = more decisive percentages. */
  temperature: 10,
  /** Never claim more/less than this (we're honest about selfie limitations). */
  min: 35,
  max: 90,
  /** Penalties (percentage points) when the photo was less than ideal. */
  penalties: { noHair: 6, noEyes: 6, lightingWarning: 8, weakWhiteBalance: 4 },
};

// ─── 4. MATCHING ──────────────────────────────────────────────────────────────

export interface SeasonMatch {
  slug: SeasonSlug;
  distance: number;
}

export interface SeasonResult {
  top: SeasonSlug;
  second: SeasonSlug;
  /** 0–100, already clamped and penalized. */
  confidence: number;
  /** All seasons sorted best → worst. */
  ranking: SeasonMatch[];
}

export function seasonDistance(d: Dimensions, slug: SeasonSlug): number {
  const profile = SEASON_PROFILES[slug];
  const emphasis = SEASON_EMPHASIS[slug];
  let sum = 0;
  for (const k of Object.keys(DIMENSION_WEIGHTS) as Dimension[]) {
    const diff = d[k] - profile[k];
    sum += DIMENSION_WEIGHTS[k] * (emphasis[k] ?? 1) * diff * diff;
  }
  return Math.sqrt(sum);
}

export function rankSeasons(d: Dimensions): SeasonMatch[] {
  return (Object.keys(SEASON_PROFILES) as SeasonSlug[])
    .map((slug) => ({ slug, distance: seasonDistance(d, slug) }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * Pick the closest season, the runner-up, and a confidence %.
 * @param penalty percentage points to subtract (from photo-quality issues)
 */
export function matchSeason(d: Dimensions, penalty = 0): SeasonResult {
  const ranking = rankSeasons(d);
  const T = CONFIDENCE.temperature;
  const weights = ranking.map((m) => Math.exp(-(m.distance - ranking[0].distance) / T));
  const share = weights[0] / weights.reduce((s, w) => s + w, 0);
  // Map the softmax share (≈0.08 … 1) onto a friendlier 0–100 scale.
  const raw = 100 * Math.sqrt(share);
  const confidence = Math.round(Math.min(CONFIDENCE.max, Math.max(CONFIDENCE.min, raw - penalty)));
  return { top: ranking[0].slug, second: ranking[1].slug, confidence, ranking };
}
