/**
 * Pixel-sampling tests on a synthetic "face": flat skin, white sclera, a colored
 * iris, and hair above the forehead, with landmarks placed where MediaPipe would.
 */
import { describe, expect, it } from "vitest";
import { deltaE, rgbToLab, type RGB } from "@/lib/color/convert";
import { EYE_POLYGONS, LM } from "@/lib/analysis/landmarks";
import { pointInPolygon, sampleFeatures, type PixelImage, type PixelMask, type Point } from "@/lib/analysis/sample";

const W = 400;
const H = 400;

interface Scene {
  skin: RGB;
  iris: RGB;
  sclera: RGB;
  hair: RGB;
  eyeOpen?: boolean;
}

function buildScene(s: Scene) {
  const lm: Point[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.55 }));
  lm[LM.faceLeft] = { x: 0.25, y: 0.5 };
  lm[LM.faceRight] = { x: 0.75, y: 0.5 };
  lm[LM.cheekLeft] = { x: 0.37, y: 0.62 };
  lm[LM.cheekRight] = { x: 0.63, y: 0.62 };
  lm[LM.forehead] = { x: 0.5, y: 0.3 };
  lm[LM.top] = { x: 0.5, y: 0.22 };
  lm[LM.chin] = { x: 0.5, y: 0.85 };

  const rx = 0.05;
  const ry = s.eyeOpen === false ? 0.004 : 0.02;
  const centers = [
    { x: 0.4, y: 0.45 },
    { x: 0.6, y: 0.45 },
  ];
  const irisR = 0.015;
  EYE_POLYGONS.forEach((poly, e) => {
    poly.forEach((idx, k) => {
      const ang = Math.PI - (k * 2 * Math.PI) / poly.length;
      lm[idx] = { x: centers[e].x + rx * Math.cos(ang), y: centers[e].y + ry * Math.sin(ang) };
    });
  });
  [LM.irisA, LM.irisB].forEach((iris, e) => {
    const c = centers[e];
    lm[iris.center] = c;
    iris.ring.forEach((idx, k) => {
      const ang = (k * Math.PI) / 2;
      lm[idx] = { x: c.x + irisR * Math.cos(ang), y: c.y + irisR * Math.sin(ang) };
    });
  });

  const data = new Uint8ClampedArray(W * H * 4);
  const mask: PixelMask = { width: W, height: H, data: new Uint8Array(W * H) };
  const eyePolys = EYE_POLYGONS.map((poly) => poly.map((i) => ({ x: lm[i].x * W, y: lm[i].y * H })));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let c = s.skin;
      if (y < 0.2 * H) {
        c = s.hair;
        mask.data[y * W + x] = 1;
      }
      eyePolys.forEach((poly, e) => {
        if (!pointInPolygon(x, y, poly)) return;
        const d = Math.hypot(x - centers[e].x * W, y - centers[e].y * H);
        c = d <= irisR * W ? s.iris : s.sclera;
      });
      const i = (y * W + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  }
  return { img: { width: W, height: H, data } as PixelImage, lm, mask };
}

const neutralScene: Scene = {
  skin: [198, 150, 120],
  iris: [70, 100, 140],
  sclera: [236, 236, 234],
  hair: [70, 48, 34],
};

/** Apply a color cast to every pixel (simulates warm indoor light). */
function withCast(img: PixelImage, gains: RGB, scale = 1): PixelImage {
  const data = new Uint8ClampedArray(img.data);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i] * gains[0] * scale;
    data[i + 1] = data[i + 1] * gains[1] * scale;
    data[i + 2] = data[i + 2] * gains[2] * scale;
  }
  return { ...img, data };
}

describe("sampleFeatures", () => {
  it("measures skin, iris and hair colors accurately in neutral light", () => {
    const { img, lm, mask } = buildScene(neutralScene);
    const r = sampleFeatures(img, lm, mask);
    expect(r.whiteBalance.source).toBe("sclera");
    expect(r.issues).toEqual([]);
    expect(r.features).not.toBeNull();
    const f = r.features!;
    expect(deltaE(f.skin, rgbToLab(neutralScene.skin))).toBeLessThan(2);
    expect(deltaE(f.eyes!, rgbToLab(neutralScene.iris))).toBeLessThan(3);
    expect(deltaE(f.hair!, rgbToLab(neutralScene.hair))).toBeLessThan(3);
  });

  it("works the same for deep skin", () => {
    const scene: Scene = { ...neutralScene, skin: [96, 62, 44], iris: [45, 30, 22], hair: [20, 18, 17] };
    const { img, lm, mask } = buildScene(scene);
    const r = sampleFeatures(img, lm, mask);
    expect(r.issues).not.toContain("too-dark"); // deep skin is NOT a lighting problem
    expect(deltaE(r.features!.skin, rgbToLab(scene.skin))).toBeLessThan(2);
    expect(r.features!.eyes).not.toBeNull();
  });

  it("flags warm light and partially corrects it using the eye whites", () => {
    const { img, lm, mask } = buildScene(neutralScene);
    const warm = withCast(img, [1.0, 0.9, 0.72]);
    const corrected = sampleFeatures(warm, lm, mask);
    expect(corrected.issues).toContain("warm-cast");
    expect(corrected.whiteBalance.gains[2]).toBeGreaterThan(1); // boosts blue

    const truth = rgbToLab(neutralScene.skin);
    const uncorrectedSkin = rgbToLab([
      neutralScene.skin[0],
      neutralScene.skin[1] * 0.9,
      neutralScene.skin[2] * 0.72,
    ]);
    expect(deltaE(corrected.features!.skin, truth)).toBeLessThan(deltaE(uncorrectedSkin, truth));
  });

  it("flags cool light", () => {
    const { img, lm, mask } = buildScene(neutralScene);
    const r = sampleFeatures(withCast(img, [0.8, 0.92, 1.0]), lm, mask);
    expect(r.issues).toContain("cool-cast");
  });

  it("flags a photo that is far too dark", () => {
    const { img, lm, mask } = buildScene(neutralScene);
    const r = sampleFeatures(withCast(img, [1, 1, 1], 0.05), lm, mask);
    expect(r.issues).toContain("too-dark");
  });

  it("flags blown-out highlights", () => {
    const { img, lm, mask } = buildScene({ ...neutralScene, skin: [255, 252, 250] });
    expect(sampleFeatures(img, lm, mask).issues).toContain("too-bright");
  });

  it("skips the eyes when they are closed", () => {
    const { img, lm, mask } = buildScene({ ...neutralScene, eyeOpen: false });
    const r = sampleFeatures(img, lm, mask);
    expect(r.features!.eyes).toBeNull();
    expect(r.whiteBalance.source).not.toBe("sclera");
  });

  it("works without a hair mask (hair = null)", () => {
    const { img, lm } = buildScene(neutralScene);
    const r = sampleFeatures(img, lm);
    expect(r.features!.hair).toBeNull();
    expect(r.features!.skin).toBeDefined();
  });

  it("returns no features when the face is outside the image", () => {
    const { img } = buildScene(neutralScene);
    const off: Point[] = Array.from({ length: 478 }, () => ({ x: 3, y: 3 }));
    expect(sampleFeatures(img, off).features).toBeNull();
  });
});
