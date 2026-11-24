/**
 * Glue: measured colors + optional answers → season result.
 * Stores only numbers and hex codes — never image data.
 */
import type { SeasonSlug } from "@/content/palettes";
import { labToHex } from "@/lib/color/convert";
import { CONFIDENCE, matchSeason, type Dimensions } from "@/lib/seasons";
import { computeDimensions, type ColorFeatures, type UserAnswers } from "./dimensions";
import type { LightingIssue, WhiteBalance } from "./sample";

export interface AnalysisResult {
  version: 1;
  season: SeasonSlug;
  second: SeasonSlug;
  confidence: number;
  dimensions: Dimensions;
  features: ColorFeatures;
  /** Hex previews of the measured colors (for "what we saw" swatches). */
  swatches: { skin: string; eyes: string | null; hair: string | null };
  issues: LightingIssue[];
  whiteBalance: WhiteBalance["source"];
  answers: UserAnswers;
  createdAt: number;
}

export function buildResult(
  features: ColorFeatures,
  context: { issues: LightingIssue[]; whiteBalance: WhiteBalance["source"] },
  answers: UserAnswers = {},
): AnalysisResult {
  const dimensions = computeDimensions(features, answers);
  const p = CONFIDENCE.penalties;
  const hairUsed = features.hair && answers.naturalHair !== false;
  const penalty =
    (hairUsed ? 0 : p.noHair) +
    (features.eyes ? 0 : p.noEyes) +
    (context.issues.length > 0 ? p.lightingWarning : 0) +
    (context.whiteBalance === "sclera" ? 0 : p.weakWhiteBalance);
  const match = matchSeason(dimensions, penalty);
  return {
    version: 1,
    season: match.top,
    second: match.second,
    confidence: match.confidence,
    dimensions,
    features,
    swatches: {
      skin: labToHex(features.skin),
      eyes: features.eyes ? labToHex(features.eyes) : null,
      hair: features.hair ? labToHex(features.hair) : null,
    },
    issues: context.issues,
    whiteBalance: context.whiteBalance,
    answers,
    createdAt: Date.now(),
  };
}
