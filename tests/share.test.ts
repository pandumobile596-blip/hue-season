import { describe, expect, it } from "vitest";
import { fitFontSize, seasonShareUrl, shareFileName, wrapText, type Measure } from "@/lib/share/text";
import { pickVideoMime } from "@/lib/share/video";

/** Fake measure: every character is 0.5 × font size wide. */
const measure: Measure = (text, size) => text.length * size * 0.5;

describe("share card text", () => {
  it("shrinks long season names to fit", () => {
    expect(fitFontSize("Soft Summer", 1000, 150, 80, measure)).toBe(150);
    const size = fitFontSize("Bright Winter Glow", 900, 150, 80, measure);
    expect(size).toBeLessThan(150);
    expect(measure("Bright Winter Glow", size)).toBeLessThanOrEqual(900);
    expect(fitFontSize("x".repeat(200), 100, 150, 80, measure)).toBe(80); // never below min
  });

  it("wraps words and caps the number of lines", () => {
    expect(wrapText("Light Turquoise", 400, 40, measure)).toEqual(["Light Turquoise"]);
    expect(wrapText("Light Turquoise", 200, 40, measure)).toEqual(["Light", "Turquoise"]);
    const lines = wrapText("one two three four five six seven", 80, 20, measure, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith("…")).toBe(true);
  });
});

describe("share links & files", () => {
  it("links to the public season page", () => {
    expect(seasonShareUrl("https://hueseason.com/", "soft-autumn")).toBe("https://hueseason.com/seasons/soft-autumn?ref=share");
  });

  it("makes friendly file names from the brand", () => {
    expect(shareFileName("Hue Season", "deep-winter", "png")).toBe("hue-season-deep-winter.png");
    expect(shareFileName("  Glow & Co! ", "true-spring", "mp4")).toBe("glow-co-true-spring.mp4");
  });

  it("prefers MP4 video, falls back to WebM, or reports unsupported", () => {
    expect(pickVideoMime(() => true)).toMatch(/^video\/mp4/);
    expect(pickVideoMime((t) => t.startsWith("video/webm"))).toMatch(/^video\/webm/);
    expect(pickVideoMime(() => false)).toBeNull();
  });
});
