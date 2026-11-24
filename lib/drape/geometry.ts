/**
 * Where the virtual fabric drape goes, derived from face landmarks.
 * Pure math (unit-tested). Coordinates are in source-image pixels.
 */
import { LM } from "@/lib/analysis/landmarks";
import type { Point } from "@/lib/analysis/sample";

export interface DrapeGeometry {
  /** Chin position. */
  chinX: number;
  chinY: number;
  /** Face width (ear to ear), used to scale the drape. */
  faceW: number;
  /** Head tilt in radians (positive = clockwise). */
  roll: number;
}

/** Tuning for the drape shape, as multiples of face width. */
export const DRAPE_SHAPE = {
  neckHalfWidth: 0.36,
  neckTop: 0.08, // collar top below the chin
  necklineDip: 0.26, // how far the U-neckline dips at the center (control point)
  shoulderOut: 0.95,
  shoulderDrop: 0.28,
  edgeOut: 2.4,
  edgeDrop: 0.7,
  /** Shoulders only follow a fraction of the head's tilt. */
  rollFollow: 0.35,
};

export function geometryFromLandmarks(lm: Point[], width: number, height: number): DrapeGeometry {
  const chin = lm[LM.chin];
  const l = lm[LM.faceLeft];
  const r = lm[LM.faceRight];
  const dx = (r.x - l.x) * width;
  const dy = (r.y - l.y) * height;
  return {
    chinX: chin.x * width,
    chinY: chin.y * height,
    faceW: Math.hypot(dx, dy),
    roll: Math.atan2(dy, dx),
  };
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smoothly moves the drape toward the latest detection so it doesn't jitter. */
export class DrapeTracker {
  current: DrapeGeometry | null = null;
  private target: DrapeGeometry | null = null;

  setTarget(g: DrapeGeometry | null) {
    this.target = g;
    if (g && !this.current) this.current = { ...g };
  }

  /** Advance one animation frame. `t` = fraction of the remaining distance (0–1). */
  step(t = 0.35): DrapeGeometry | null {
    if (!this.target || !this.current) return this.current;
    const c = this.current;
    const g = this.target;
    // Big jumps (new person / re-detection) snap instead of sliding across the screen.
    if (Math.hypot(g.chinX - c.chinX, g.chinY - c.chinY) > g.faceW * 1.5) {
      this.current = { ...g };
      return this.current;
    }
    this.current = {
      chinX: lerp(c.chinX, g.chinX, t),
      chinY: lerp(c.chinY, g.chinY, t),
      faceW: lerp(c.faceW, g.faceW, t),
      roll: lerp(c.roll, g.roll, t),
    };
    return this.current;
  }

  reset() {
    this.current = null;
    this.target = null;
  }
}

export interface DrapeOutline {
  /** Rotation pivot & angle for the whole shape. */
  pivot: { x: number; y: number };
  angle: number;
  /** Path commands in un-rotated space. */
  leftEdge: { x: number; y: number };
  leftShoulder: { x: number; y: number };
  neckLeft: { x: number; y: number };
  neckControl: { x: number; y: number };
  neckRight: { x: number; y: number };
  rightShoulder: { x: number; y: number };
  rightEdge: { x: number; y: number };
  bottom: number;
}

export function drapeOutline(g: DrapeGeometry, canvasHeight: number): DrapeOutline {
  const s = DRAPE_SHAPE;
  const w = g.faceW;
  const x = g.chinX;
  const y = g.chinY;
  return {
    pivot: { x, y },
    angle: g.roll * s.rollFollow,
    leftEdge: { x: x - s.edgeOut * w, y: y + s.edgeDrop * w },
    leftShoulder: { x: x - s.shoulderOut * w, y: y + s.shoulderDrop * w },
    neckLeft: { x: x - s.neckHalfWidth * w, y: y + s.neckTop * w },
    neckControl: { x, y: y + s.necklineDip * w * 1.6 },
    neckRight: { x: x + s.neckHalfWidth * w, y: y + s.neckTop * w },
    rightShoulder: { x: x + s.shoulderOut * w, y: y + s.shoulderDrop * w },
    rightEdge: { x: x + s.edgeOut * w, y: y + s.edgeDrop * w },
    bottom: Math.max(canvasHeight, y + 3 * w) + 20,
  };
}
