/**
 * Browser pipeline: still photo → landmarks → hair mask → color features.
 * Nothing leaves the device; the canvas is only read locally.
 */
import type { Vision } from "@/lib/mediapipe/loader";
import type { ColorFeatures } from "./dimensions";
import { sampleFeatures, type LightingIssue, type PixelMask, type Point, type WhiteBalance } from "./sample";
import { LM } from "./landmarks";

/** Longest side we analyze at — plenty of detail, fast on phones. */
export const MAX_ANALYSIS_SIDE = 1280;

export type PhotoProblem = "no-face" | "multiple-faces" | "face-too-small" | "no-skin" | "too-dark";

export class PhotoError extends Error {
  constructor(public problem: PhotoProblem) {
    super(problem);
  }
}

export interface PhotoAnalysis {
  features: ColorFeatures;
  issues: LightingIssue[];
  whiteBalance: WhiteBalance["source"];
  landmarks: Point[];
}

/** Draw any image source onto a canvas, downscaled to MAX_ANALYSIS_SIDE. */
export function toCanvas(source: CanvasImageSource, width: number, height: number): HTMLCanvasElement {
  const scale = Math.min(1, MAX_ANALYSIS_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/** Decode an uploaded file (respecting EXIF rotation) into a canvas. */
export async function fileToCanvas(file: File): Promise<HTMLCanvasElement> {
  if ("createImageBitmap" in window) {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      const c = toCanvas(bmp, bmp.width, bmp.height);
      bmp.close();
      return c;
    } catch {
      /* fall through to <img> decoding (older Safari, unusual formats) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return toCanvas(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

let lastTs = 0;
/** MediaPipe VIDEO mode needs strictly increasing timestamps. */
export function nextTimestamp(): number {
  lastTs = Math.max(lastTs + 1, performance.now());
  return lastTs;
}

async function hairMask(vision: Vision, canvas: HTMLCanvasElement): Promise<PixelMask | undefined> {
  try {
    const seg = await vision.hair();
    return await new Promise<PixelMask | undefined>((resolve) => {
      seg.segment(canvas, (result) => {
        const mask = result.categoryMask;
        // Copy out: MediaPipe frees the mask after the callback returns.
        resolve(mask ? { width: mask.width, height: mask.height, data: mask.getAsUint8Array().slice() } : undefined);
      });
    });
  } catch {
    return undefined; // hair is optional — analysis continues without it
  }
}

export async function analyzePhoto(canvas: HTMLCanvasElement, vision: Vision): Promise<PhotoAnalysis> {
  const result = vision.face.detectForVideo(canvas, nextTimestamp());
  const faces = result.faceLandmarks ?? [];
  if (faces.length === 0) throw new PhotoError("no-face");
  if (faces.length > 1) throw new PhotoError("multiple-faces");
  const lm = faces[0] as Point[];

  const faceW = Math.abs(lm[LM.faceRight].x - lm[LM.faceLeft].x) * canvas.width;
  if (faceW < Math.min(canvas.width, canvas.height) * 0.15) throw new PhotoError("face-too-small");

  const mask = await hairMask(vision, canvas);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas is not available");
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sample = sampleFeatures(pixels, lm, mask);
  if (!sample.features) throw new PhotoError("no-skin");
  return {
    features: sample.features,
    issues: sample.issues,
    whiteBalance: sample.whiteBalance.source,
    landmarks: lm,
  };
}
