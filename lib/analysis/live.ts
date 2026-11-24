/**
 * Real-time checks for the camera guide: framing, light and stillness.
 * Pure function over landmarks + a small downscaled frame, so it's cheap
 * enough to run several times a second on low-end phones.
 */
import type { PixelImage, Point } from "./sample";
import { LM } from "./landmarks";

export type LiveStatus =
  | "no-face"
  | "multiple-faces"
  | "too-far"
  | "too-close"
  | "off-center"
  | "too-dark"
  | "too-bright"
  | "uneven-light"
  | "hold-still"
  | "ready";

export const LIVE_TIPS: Record<LiveStatus, string> = {
  "no-face": "Look straight at the screen so we can find your face",
  "multiple-faces": "Just you, please — make sure no one else is in the frame",
  "too-far": "Come a little closer",
  "too-close": "Move back a little",
  "off-center": "Center your face in the oval",
  "too-dark": "Too dark — find more light, ideally facing a window",
  "too-bright": "Too much glare — step out of direct sunlight",
  "uneven-light": "Turn to face the light so both cheeks are lit evenly",
  "hold-still": "Hold still…",
  ready: "Looks great — tap to capture",
};

/** The face-oval guide, in normalized frame coordinates (shared with the overlay). */
export function ovalGuide(frameW: number, frameH: number) {
  const m = Math.min(frameW, frameH);
  return { cx: frameW / 2, cy: frameH * 0.47, rx: m * 0.3, ry: m * 0.4 };
}

export const LIVE = {
  minFaceWidth: 0.3, // × min(frameW, frameH)
  maxFaceWidth: 0.72,
  maxCenterOffset: 0.12, // × min(frameW, frameH)
  minFaceLuma: 40, // 0–255; deep skin in good light is well above this
  maxClippedShare: 0.15,
  maxSideRatio: 1.7, // brighter cheek / darker cheek
  maxMotion: 0.012, // nose movement between checks (normalized)
};

export interface LiveInput {
  faces: Point[][];
  /** Small RGBA copy of the current frame (any size, same aspect as the video). */
  frame: PixelImage;
  /** Nose position from the previous check, for stillness. */
  previousNose: Point | null;
}

function regionLuma(frame: PixelImage, cx: number, cy: number, r: number) {
  let sum = 0;
  let n = 0;
  let clipped = 0;
  const x0 = Math.max(0, Math.floor((cx - r) * frame.width));
  const x1 = Math.min(frame.width - 1, Math.ceil((cx + r) * frame.width));
  const y0 = Math.max(0, Math.floor((cy - r) * frame.height));
  const y1 = Math.min(frame.height - 1, Math.ceil((cy + r) * frame.height));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const i = (y * frame.width + x) * 4;
      const d = frame.data;
      sum += 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (d[i] > 250 || d[i + 1] > 250 || d[i + 2] > 250) clipped++;
      n++;
    }
  }
  return { mean: n ? sum / n : 0, clippedShare: n ? clipped / n : 0 };
}

export function checkLiveFrame({ faces, frame, previousNose }: LiveInput): { status: LiveStatus; nose: Point | null } {
  if (faces.length === 0) return { status: "no-face", nose: null };
  if (faces.length > 1) return { status: "multiple-faces", nose: null };
  const lm = faces[0];
  const nose = lm[LM.noseTip];
  const W = frame.width;
  const H = frame.height;
  const m = Math.min(W, H);

  // Framing
  const faceW = Math.abs(lm[LM.faceRight].x - lm[LM.faceLeft].x) * W;
  if (faceW < m * LIVE.minFaceWidth) return { status: "too-far", nose };
  if (faceW > m * LIVE.maxFaceWidth) return { status: "too-close", nose };
  const oval = ovalGuide(W, H);
  const fx = ((lm[LM.faceLeft].x + lm[LM.faceRight].x) / 2) * W;
  const fy = ((lm[LM.top].y + lm[LM.chin].y) / 2) * H;
  if (Math.hypot(fx - oval.cx, fy - oval.cy) > m * LIVE.maxCenterOffset) return { status: "off-center", nose };

  // Light (measured on the cheeks, so it works for every skin tone)
  const r = (faceW / W) * 0.08;
  const a = regionLuma(frame, lm[LM.cheekLeft].x, lm[LM.cheekLeft].y, r);
  const b = regionLuma(frame, lm[LM.cheekRight].x, lm[LM.cheekRight].y, r);
  const mean = (a.mean + b.mean) / 2;
  if (mean < LIVE.minFaceLuma) return { status: "too-dark", nose };
  if ((a.clippedShare + b.clippedShare) / 2 > LIVE.maxClippedShare) return { status: "too-bright", nose };
  const ratio = Math.max(a.mean, b.mean) / Math.max(1, Math.min(a.mean, b.mean));
  if (ratio > LIVE.maxSideRatio) return { status: "uneven-light", nose };

  // Stillness
  if (!previousNose || Math.hypot(nose.x - previousNose.x, nose.y - previousNose.y) > LIVE.maxMotion) {
    return { status: "hold-still", nose };
  }
  return { status: "ready", nose };
}
