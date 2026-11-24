import { describe, expect, it } from "vitest";
import { LM } from "@/lib/analysis/landmarks";
import type { Point } from "@/lib/analysis/sample";
import { DrapeTracker, drapeOutline, geometryFromLandmarks, type DrapeGeometry } from "@/lib/drape/geometry";

function face(cx: number, chinY: number, halfW: number, tiltY = 0): Point[] {
  const lm: Point[] = Array.from({ length: 478 }, () => ({ x: cx, y: chinY - 0.2 }));
  lm[LM.chin] = { x: cx, y: chinY };
  lm[LM.faceLeft] = { x: cx - halfW, y: chinY - 0.2 - tiltY };
  lm[LM.faceRight] = { x: cx + halfW, y: chinY - 0.2 + tiltY };
  return lm;
}

describe("drape geometry", () => {
  it("anchors at the chin and scales with face width", () => {
    const g = geometryFromLandmarks(face(0.5, 0.7, 0.2), 1000, 1000);
    expect(g.chinX).toBeCloseTo(500);
    expect(g.chinY).toBeCloseTo(700);
    expect(g.faceW).toBeCloseTo(400);
    expect(g.roll).toBeCloseTo(0);
  });

  it("measures head tilt", () => {
    const g = geometryFromLandmarks(face(0.5, 0.7, 0.2, 0.05), 1000, 1000);
    expect(g.roll).toBeGreaterThan(0.2);
  });

  it("outline sits below the chin, is symmetric, and reaches the bottom", () => {
    const g: DrapeGeometry = { chinX: 500, chinY: 600, faceW: 300, roll: 0 };
    const o = drapeOutline(g, 1000);
    expect(o.neckLeft.y).toBeGreaterThan(g.chinY);
    expect(o.neckControl.y).toBeGreaterThan(o.neckLeft.y); // U-neckline dips down
    expect(500 - o.neckLeft.x).toBeCloseTo(o.neckRight.x - 500);
    expect(o.bottom).toBeGreaterThanOrEqual(1000);
  });

  it("shoulders follow only part of the head tilt", () => {
    const o = drapeOutline({ chinX: 0, chinY: 0, faceW: 100, roll: 0.4 }, 500);
    expect(o.angle).toBeGreaterThan(0);
    expect(o.angle).toBeLessThan(0.4);
  });
});

describe("DrapeTracker smoothing", () => {
  const a: DrapeGeometry = { chinX: 100, chinY: 100, faceW: 200, roll: 0 };
  const b: DrapeGeometry = { chinX: 140, chinY: 120, faceW: 210, roll: 0.1 };

  it("starts at the first detection", () => {
    const t = new DrapeTracker();
    t.setTarget(a);
    expect(t.step()).toEqual(a);
  });

  it("eases toward new detections between frames instead of jumping", () => {
    const t = new DrapeTracker();
    t.setTarget(a);
    t.setTarget(b);
    const first = t.step(0.5)!;
    expect(first.chinX).toBeCloseTo(120);
    for (let i = 0; i < 30; i++) t.step(0.5);
    expect(t.current!.chinX).toBeCloseTo(140, 3);
  });

  it("snaps on very large jumps", () => {
    const t = new DrapeTracker();
    t.setTarget(a);
    t.setTarget({ ...a, chinX: 900 });
    expect(t.step(0.1)!.chinX).toBe(900);
  });

  it("keeps the last position when the face is briefly lost", () => {
    const t = new DrapeTracker();
    t.setTarget(a);
    t.step();
    t.setTarget(null);
    expect(t.step()).toEqual(a);
  });
});
