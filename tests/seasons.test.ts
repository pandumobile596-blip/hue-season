import { describe, expect, it } from "vitest";
import type { SeasonSlug } from "@/content/palettes";
import { seasonPalettes } from "@/content/palettes";
import { buildResult } from "@/lib/analysis/analyze";
import { computeDimensions, undertoneScore, type ColorFeatures } from "@/lib/analysis/dimensions";
import { CONFIDENCE, SEASON_PROFILES, matchSeason, rankSeasons } from "@/lib/seasons";
import { people } from "./fixtures";

const lab = (L: number, a: number, b: number) => ({ L, a, b });
/** Skin Lab with a given hue angle & chroma at lightness L. */
const skinAt = (L: number, hueDeg: number, C = 20) => {
  const r = (hueDeg * Math.PI) / 180;
  return lab(L, C * Math.cos(r), C * Math.sin(r));
};

describe("season definitions", () => {
  it("defines all 12 seasons, matching the palette content", () => {
    const slugs = Object.keys(SEASON_PROFILES).sort();
    expect(slugs).toHaveLength(12);
    expect(slugs).toEqual(seasonPalettes.map((s) => s.slug).sort());
  });

  it("every season profile maps to itself", () => {
    for (const [slug, profile] of Object.entries(SEASON_PROFILES)) {
      expect(matchSeason(profile).top).toBe(slug);
    }
  });

  it("returns a distinct runner-up and a bounded confidence", () => {
    for (const p of people) {
      const m = matchSeason(computeDimensions(p.features));
      expect(m.second).not.toBe(m.top);
      expect(m.confidence).toBeGreaterThanOrEqual(CONFIDENCE.min);
      expect(m.confidence).toBeLessThanOrEqual(CONFIDENCE.max);
      expect(m.ranking).toHaveLength(12);
    }
  });

  it("is deterministic", () => {
    const d = computeDimensions(people[0].features);
    expect(matchSeason(d)).toEqual(matchSeason(d));
  });

  it("an exactly ambiguous person gets low confidence", () => {
    const mid = { undertone: 50, value: 50, chroma: 50, contrast: 50 };
    expect(matchSeason(mid).confidence).toBeLessThan(60);
  });
});

describe("sample people across the full skin-tone range", () => {
  for (const p of people) {
    it(`${p.depth}: ${p.name}`, () => {
      const top = matchSeason(computeDimensions(p.features)).top;
      expect(p.expect).toContain(top);
    });
  }
});

describe("inclusivity", () => {
  const depths = [75, 65, 55, 45, 35, 25];

  it("warm and cool undertones are distinguished at EVERY depth", () => {
    for (const L of depths) {
      const neutral = 55 + 0.12 * (65 - L);
      const f = (hue: number): ColorFeatures => ({ skin: skinAt(L, hue), eyes: null, hair: null });
      const warm = undertoneScore(f(neutral + 8));
      const cool = undertoneScore(f(neutral - 8));
      expect(warm, `L*=${L}`).toBeGreaterThan(70);
      expect(cool, `L*=${L}`).toBeLessThan(30);
    }
  });

  it("depth alone does not push skin warm: same relative hue → similar undertone", () => {
    const scores = depths.map((L) => {
      const neutral = 55 + 0.12 * (65 - L);
      return undertoneScore({ skin: skinAt(L, neutral + 2), eyes: null, hair: null });
    });
    expect(Math.max(...scores) - Math.min(...scores)).toBeLessThanOrEqual(2);
  });

  it("deep skin can belong to many seasons, not just one", () => {
    const deep = people.filter((p) => ["medium-deep", "deep", "very deep"].includes(p.depth));
    const seasons = new Set(deep.map((p) => matchSeason(computeDimensions(p.features)).top));
    for (const s of ["deep-autumn", "deep-winter", "bright-winter"] as SeasonSlug[]) expect(seasons).toContain(s);
    expect(seasons.size).toBeGreaterThanOrEqual(4);
  });

  it("deep skin with black hair can score high contrast", () => {
    const d = computeDimensions({ skin: lab(45, 14, 18), eyes: lab(25, 8, 12), hair: lab(9, 1, 1) });
    expect(d.contrast).toBeGreaterThanOrEqual(65);
  });

  it("very deep skin is not automatically 'muted'", () => {
    const d = computeDimensions({ skin: lab(28, 12, 16), eyes: lab(22, 10, 14), hair: lab(10, 1, 1) });
    expect(d.chroma).toBeGreaterThan(40);
  });

  it("fair skin with fair hair reads low contrast, with dark hair reads high", () => {
    const skin = lab(72, 12, 15);
    const low = computeDimensions({ skin, eyes: lab(55, -2, -8), hair: lab(66, 3, 16) }).contrast;
    const high = computeDimensions({ skin, eyes: lab(40, -3, -15), hair: lab(15, 1, 2) }).contrast;
    expect(low).toBeLessThan(40);
    expect(high).toBeGreaterThan(75);
  });
});

describe("dimension behavior", () => {
  const base: ColorFeatures = { skin: lab(62, 12, 16), eyes: lab(40, 5, 12), hair: lab(30, 6, 12) };

  it("lighter features raise the value score", () => {
    const light = computeDimensions({ ...base, skin: lab(75, 12, 16), hair: lab(65, 5, 18) });
    expect(light.value).toBeGreaterThan(computeDimensions(base).value);
  });

  it("golden or copper hair warms the undertone; ash hair does not", () => {
    const copper = undertoneScore({ ...base, hair: lab(42, 22, 30) });
    const ash = undertoneScore({ ...base, hair: lab(42, 1, 5) });
    expect(copper).toBeGreaterThan(ash);
  });

  it("dyed hair (naturalHair: false) is ignored", () => {
    const natural = computeDimensions({ ...base, hair: lab(70, 6, 30) });
    const dyed = computeDimensions({ ...base, hair: lab(70, 6, 30) }, { naturalHair: false });
    const noHair = computeDimensions({ ...base, hair: null });
    expect(dyed).toEqual(noHair);
    expect(dyed).not.toEqual(natural);
  });

  it("jewelry answer only nudges the undertone", () => {
    const plain = undertoneScore(base);
    const gold = undertoneScore(base, { jewelry: "gold" });
    const silver = undertoneScore(base, { jewelry: "silver" });
    expect(gold - plain).toBeGreaterThan(0);
    expect(gold - plain).toBeLessThanOrEqual(6);
    expect(plain - silver).toBeLessThanOrEqual(6);
    expect(undertoneScore(base, { jewelry: "both" })).toBe(plain);
  });

  it("all scores stay within 0–100 for extreme inputs", () => {
    const extremes: ColorFeatures[] = [
      { skin: lab(100, 0, 0), eyes: lab(100, 0, 0), hair: lab(100, 0, 0) },
      { skin: lab(0, 0, 0), eyes: lab(0, 0, 0), hair: lab(0, 0, 0) },
      { skin: lab(50, 60, 80), eyes: lab(50, -60, -80), hair: lab(50, 80, 80) },
    ];
    for (const f of extremes) {
      for (const v of Object.values(computeDimensions(f))) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
      expect(rankSeasons(computeDimensions(f))).toHaveLength(12);
    }
  });
});

describe("buildResult", () => {
  it("lowers confidence when the photo was not ideal", () => {
    const f = people[0].features;
    const good = buildResult(f, { issues: [], whiteBalance: "sclera" });
    const poor = buildResult({ ...f, hair: null }, { issues: ["warm-cast"], whiteBalance: "gray-world" });
    expect(poor.confidence).toBeLessThan(good.confidence);
    expect(good.swatches.skin).toMatch(/^#[0-9a-f]{6}$/);
    expect(poor.swatches.hair).toBeNull();
  });
});
