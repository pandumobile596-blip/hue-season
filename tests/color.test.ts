import { describe, expect, it } from "vitest";
import {
  deltaE,
  hexToRgb,
  labToHex,
  labToLch,
  labToRgb,
  lightnessToLuminance,
  rgbToHex,
  rgbToLab,
  srgbToLinear,
  linearToSrgb,
} from "@/lib/color/convert";
import { iqrInlierMask, median, normalize, quantile, weightedAverage } from "@/lib/color/stats";

describe("sRGB ⇄ CIELAB", () => {
  it("maps white and black to L* 100 and 0", () => {
    const white = rgbToLab([255, 255, 255]);
    expect(white.L).toBeCloseTo(100, 1);
    expect(Math.abs(white.a)).toBeLessThan(0.05);
    expect(Math.abs(white.b)).toBeLessThan(0.05);
    expect(rgbToLab([0, 0, 0]).L).toBeCloseTo(0, 5);
  });

  it("matches reference values for primaries (D65)", () => {
    const red = rgbToLab([255, 0, 0]);
    expect(red.L).toBeCloseTo(53.24, 1);
    expect(red.a).toBeCloseTo(80.09, 0);
    expect(red.b).toBeCloseTo(67.2, 0);
    const blue = rgbToLab([0, 0, 255]);
    expect(blue.L).toBeCloseTo(32.3, 0);
    expect(blue.b).toBeCloseTo(-107.86, 0);
  });

  it("mid gray is neutral at L* ≈ 53.6", () => {
    const g = rgbToLab([128, 128, 128]);
    expect(g.L).toBeCloseTo(53.59, 1);
    expect(Math.hypot(g.a, g.b)).toBeLessThan(0.05);
  });

  it("round-trips sRGB → Lab → sRGB within 0.5 per channel", () => {
    const samples: Array<[number, number, number]> = [
      [233, 190, 160], // light skin
      [141, 85, 36], // deep warm skin
      [60, 40, 32], // very deep skin
      [12, 200, 140],
      [250, 250, 245],
    ];
    for (const rgb of samples) {
      const back = labToRgb(rgbToLab(rgb));
      back.forEach((v, i) => expect(Math.abs(v - rgb[i])).toBeLessThan(0.5));
    }
  });

  it("gamma helpers are inverse of each other", () => {
    for (const v of [0, 1, 10, 64, 128, 200, 255]) expect(linearToSrgb(srgbToLinear(v))).toBeCloseTo(v, 6);
  });
});

describe("LCh, hex and helpers", () => {
  it("computes chroma and hue angle", () => {
    const lch = labToLch({ L: 60, a: 10, b: 10 });
    expect(lch.C).toBeCloseTo(Math.SQRT2 * 10, 6);
    expect(lch.h).toBeCloseTo(45, 6);
    expect(labToLch({ L: 50, a: 0, b: -10 }).h).toBeCloseTo(270, 6); // never negative
  });

  it("converts hex both ways", () => {
    expect(hexToRgb("#9a4c43")).toEqual([154, 76, 67]);
    expect(rgbToHex([154, 76, 67])).toBe("#9a4c43");
    expect(labToHex(rgbToLab([154, 76, 67]))).toBe("#9a4c43");
  });

  it("deltaE is zero for identical colors and symmetric", () => {
    const x = { L: 50, a: 10, b: 20 };
    const y = { L: 55, a: 12, b: 18 };
    expect(deltaE(x, x)).toBe(0);
    expect(deltaE(x, y)).toBeCloseTo(deltaE(y, x), 10);
  });

  it("luminance from L* matches the CIE definition", () => {
    expect(lightnessToLuminance(100)).toBeCloseTo(1, 6);
    expect(lightnessToLuminance(50)).toBeCloseTo(0.1842, 3);
  });
});

describe("robust statistics", () => {
  it("quantile and median interpolate", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(quantile([0, 10], 0.25)).toBe(2.5);
    expect(Number.isNaN(median([]))).toBe(true);
  });

  it("IQR mask removes outliers like specular highlights", () => {
    const values = [50, 51, 52, 49, 50, 51, 98]; // 98 = shine
    const mask = iqrInlierMask(values);
    expect(mask[6]).toBe(false);
    expect(mask.slice(0, 6).every(Boolean)).toBe(true);
  });

  it("normalize clamps and supports inverted ranges", () => {
    expect(normalize(5, 0, 10)).toBe(0.5);
    expect(normalize(-5, 0, 10)).toBe(0);
    expect(normalize(15, 0, 10)).toBe(1);
    expect(normalize(2.5, 10, 0)).toBe(0.75);
  });

  it("weightedAverage skips missing values and renormalizes", () => {
    expect(weightedAverage([[1, 1], [null, 5], [0, 1]])).toBe(0.5);
    expect(weightedAverage([[null, 1]])).toBeNull();
  });
});
