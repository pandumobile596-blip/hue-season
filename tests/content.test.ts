import { describe, expect, it } from "vitest";
import { seasonPalettes } from "@/content/palettes";
import { seasonContent, type SeasonContent } from "@/content/seasons";

function wordCount(c: SeasonContent): number {
  const text = [
    ...c.intro,
    ...Object.values(c.traits),
    ...c.recognize,
    c.bestColors,
    c.neutrals,
    c.avoid,
    c.wardrobe,
    ...c.makeup.map((m) => `${m.label} ${m.text}`),
    ...c.hair,
    c.jewelry.metals,
    c.jewelry.text,
    ...c.faq.flatMap((f) => [f.q, f.a]),
  ].join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

describe("season page content", () => {
  const all = Object.values(seasonContent);

  it("exists for every season", () => {
    expect(Object.keys(seasonContent).sort()).toEqual(seasonPalettes.map((s) => s.slug).sort());
    for (const [slug, c] of Object.entries(seasonContent)) expect(c.slug).toBe(slug);
  });

  it("has unique titles and meta descriptions of a sensible length", () => {
    expect(new Set(all.map((c) => c.seoTitle)).size).toBe(12);
    expect(new Set(all.map((c) => c.metaDescription)).size).toBe(12);
    for (const c of all) {
      expect(c.seoTitle.length, c.slug).toBeLessThanOrEqual(65);
      expect(c.metaDescription.length, c.slug).toBeLessThanOrEqual(160);
      expect(c.metaDescription.length, c.slug).toBeGreaterThan(90);
    }
  });

  it("has substantial guide text (palette names and swatches add more on the page)", () => {
    for (const c of all) expect(wordCount(c), c.slug).toBeGreaterThanOrEqual(580);
  });

  it("links only to real, different seasons", () => {
    const slugs = new Set(Object.keys(seasonContent));
    for (const c of all) {
      expect(c.related.length).toBeGreaterThanOrEqual(3);
      for (const r of c.related) {
        expect(slugs.has(r)).toBe(true);
        expect(r).not.toBe(c.slug);
      }
    }
  });

  it("every season page has an FAQ", () => {
    for (const c of all) expect(c.faq.length).toBeGreaterThanOrEqual(3);
  });
});
