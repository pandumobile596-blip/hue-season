/**
 * Keeps the analyzed photo IN MEMORY ONLY so the result page can drape colors on it.
 * It is never written to storage or sent anywhere, and disappears on refresh,
 * on "Retake", or when the tab closes.
 */
import type { Point } from "@/lib/analysis/sample";

export interface StoredPhoto {
  canvas: HTMLCanvasElement;
  landmarks: Point[];
  source: "camera" | "upload";
}

let photo: StoredPhoto | null = null;

export function setPhoto(p: StoredPhoto): void {
  clearPhoto();
  photo = p;
}

export function getPhoto(): StoredPhoto | null {
  return photo;
}

export function clearPhoto(): void {
  if (photo) photo.canvas.width = photo.canvas.height = 0; // release pixel memory
  photo = null;
}
