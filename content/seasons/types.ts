import type { SeasonSlug } from "@/content/palettes";

export interface FaqEntry {
  q: string;
  a: string;
}

/** Long-form guide content for one season page (/seasons/[slug]). */
export interface SeasonContent {
  slug: SeasonSlug;
  /** <title> — unique per page, ~50–60 characters. */
  seoTitle: string;
  /** Meta description — unique, ≤ 160 characters. */
  metaDescription: string;
  /** Opening paragraphs. */
  intro: string[];
  /** The four dimensions in plain words. */
  traits: { undertone: string; depth: string; clarity: string; contrast: string };
  /** "You might be this season if…" bullets. */
  recognize: string[];
  bestColors: string;
  neutrals: string;
  avoid: string;
  /** Practical wardrobe-building advice. */
  wardrobe: string;
  makeup: { label: string; text: string }[];
  hair: string[];
  jewelry: { metals: string; text: string };
  /** Sister & neighbor seasons for internal links. */
  related: SeasonSlug[];
  faq: FaqEntry[];
}
