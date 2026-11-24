import type { SeasonSlug } from "@/content/palettes";
import { brightSpring, lightSpring, trueSpring } from "./spring";
import { lightSummer, softSummer, trueSummer } from "./summer";
import { deepAutumn, softAutumn, trueAutumn } from "./autumn";
import { brightWinter, deepWinter, trueWinter } from "./winter";
import type { SeasonContent } from "./types";

export type { SeasonContent, FaqEntry } from "./types";

export const seasonContent: Record<SeasonSlug, SeasonContent> = {
  "light-spring": lightSpring,
  "true-spring": trueSpring,
  "bright-spring": brightSpring,
  "light-summer": lightSummer,
  "true-summer": trueSummer,
  "soft-summer": softSummer,
  "soft-autumn": softAutumn,
  "true-autumn": trueAutumn,
  "deep-autumn": deepAutumn,
  "deep-winter": deepWinter,
  "true-winter": trueWinter,
  "bright-winter": brightWinter,
};

export function getSeasonContent(slug: string): SeasonContent | undefined {
  return (seasonContent as Record<string, SeasonContent | undefined>)[slug];
}
