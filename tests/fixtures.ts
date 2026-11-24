/**
 * Sample people described by measured LAB values (skin, eyes, hair), covering the
 * full skin-tone range from very fair to very deep. Values are realistic for
 * daylight photos; `expect` lists the seasons a human analyst would accept.
 */
import type { SeasonSlug } from "@/content/palettes";
import type { ColorFeatures } from "@/lib/analysis/dimensions";

export interface Person {
  name: string;
  depth: "very fair" | "fair" | "light" | "medium" | "medium-deep" | "deep" | "very deep";
  features: ColorFeatures;
  expect: SeasonSlug[];
}

const lab = (L: number, a: number, b: number) => ({ L, a, b });

export const people: Person[] = [
  {
    name: "very fair, cool pink skin, ash blonde, blue eyes",
    depth: "very fair",
    features: { skin: lab(74, 13, 11), eyes: lab(52, -3, -14), hair: lab(66, 2, 13) },
    expect: ["light-summer"],
  },
  {
    name: "very fair, warm peachy skin, golden blonde, light hazel-green eyes",
    depth: "very fair",
    features: { skin: lab(73, 11, 19), eyes: lab(50, -6, 18), hair: lab(68, 5, 24) },
    expect: ["light-spring"],
  },
  {
    name: "fair, warm, copper red hair, green eyes",
    depth: "fair",
    features: { skin: lab(68, 12, 19), eyes: lab(45, -8, 16), hair: lab(42, 22, 30) },
    // Neutral-warm skin + vivid copper hair sits between Bright and True Spring.
    expect: ["true-spring", "bright-spring", "true-autumn"],
  },
  {
    name: "fair, cool, dark brown hair, bright blue eyes",
    depth: "fair",
    features: { skin: lab(70, 13, 12), eyes: lab(45, -4, -18), hair: lab(20, 2, 3) },
    expect: ["true-winter", "bright-winter"],
  },
  {
    name: "light, neutral-warm, mousy brown hair, gray-hazel eyes",
    depth: "light",
    features: { skin: lab(62, 12, 16), eyes: lab(45, 2, 9), hair: lab(40, 5, 11) },
    expect: ["soft-autumn", "soft-summer"],
  },
  {
    name: "medium, cool-neutral, ash brown hair, gray eyes",
    depth: "medium",
    features: { skin: lab(60, 11, 13), eyes: lab(48, -1, -3), hair: lab(38, 2, 6) },
    expect: ["soft-summer", "true-summer"],
  },
  {
    name: "medium, cool rosy skin, light ash brown hair, blue-gray eyes",
    depth: "medium",
    features: { skin: lab(58, 14, 12), eyes: lab(42, -2, -10), hair: lab(35, 3, 7) },
    expect: ["true-summer", "soft-summer"],
  },
  {
    name: "medium olive-warm, dark brown hair, brown eyes",
    depth: "medium",
    features: { skin: lab(55, 10, 20), eyes: lab(32, 8, 16), hair: lab(22, 5, 9) },
    expect: ["deep-autumn", "true-autumn"],
  },
  {
    name: "medium-deep, neutral-cool, jet black hair, very clear dark eyes",
    depth: "medium-deep",
    features: { skin: lab(45, 15, 19), eyes: lab(25, 13, 24), hair: lab(9, 1, 1) },
    expect: ["bright-winter", "true-winter"],
  },
  {
    name: "medium-deep, warm golden, clear amber eyes, black hair",
    depth: "medium-deep",
    features: { skin: lab(48, 12, 24), eyes: lab(32, 14, 28), hair: lab(10, 2, 2) },
    expect: ["bright-spring", "deep-autumn", "true-autumn"],
  },
  {
    name: "deep, warm golden skin, black-brown hair, dark brown eyes",
    depth: "deep",
    features: { skin: lab(38, 12, 22), eyes: lab(26, 8, 13), hair: lab(14, 3, 4) },
    expect: ["deep-autumn"],
  },
  {
    name: "deep, cool skin, black hair, dark brown eyes",
    depth: "deep",
    features: { skin: lab(36, 13, 13), eyes: lab(24, 6, 8), hair: lab(12, 1, 1) },
    expect: ["deep-winter", "true-winter"],
  },
  {
    name: "very deep, cool-neutral, black hair",
    depth: "very deep",
    features: { skin: lab(26, 9, 9), eyes: lab(20, 5, 6), hair: lab(10, 1, 1) },
    expect: ["deep-winter"],
  },
  {
    name: "very deep, warm, black-brown hair",
    depth: "very deep",
    features: { skin: lab(27, 8, 16), eyes: lab(20, 6, 9), hair: lab(12, 3, 4) },
    expect: ["deep-autumn"],
  },
  {
    name: "deep, cool, hair covered (headscarf)",
    depth: "deep",
    features: { skin: lab(37, 13, 13), eyes: lab(24, 6, 8), hair: null },
    expect: ["deep-winter", "true-winter"],
  },
];
