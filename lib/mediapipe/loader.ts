/**
 * Lazy MediaPipe loader (browser only).
 * - Everything is self-hosted under /public (no CDN at runtime).
 * - Reports real download progress for the WASM runtime + face model.
 * - Tries the GPU delegate first and falls back to CPU automatically.
 * - Reference-counted: the last `release()` closes the models and frees memory.
 */
import type { FaceLandmarker, ImageSegmenter } from "@mediapipe/tasks-vision";

export const ASSETS = {
  wasmBase: "/mediapipe/wasm",
  wasmBinary: "/mediapipe/wasm/vision_wasm_internal.wasm",
  faceModel: "/models/face_landmarker.task",
  hairModel: "/models/hair_segmenter.tflite",
};

export type Delegate = "GPU" | "CPU";
export type LoadStage = "download" | "starting" | "ready";
export type ProgressFn = (percent: number, stage: LoadStage) => void;

export interface Vision {
  face: FaceLandmarker;
  delegate: Delegate;
  /** Loads (once) and returns the hair segmenter. */
  hair: () => Promise<ImageSegmenter>;
}

/** fetch() that reports bytes received. Falls back to a plain read when streaming isn't possible. */
export async function fetchBytes(url: string, onBytes?: (loaded: number, total: number) => void): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download ${url} (HTTP ${res.status})`);
  const total = Number(res.headers.get("content-length")) || 0;
  if (!res.body || !onBytes) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    onBytes(loaded, total);
  }
  const out = new Uint8Array(loaded);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Everything created by one load, so a release during loading still frees it all. */
class Bag {
  private items: Array<{ close(): void }> = [];
  closed = false;
  add<T extends { close(): void }>(item: T): T {
    if (this.closed) safeClose(item);
    else this.items.push(item);
    return item;
  }
  closeAll() {
    this.closed = true;
    this.items.forEach(safeClose);
    this.items = [];
  }
}

function safeClose(m: { close(): void }) {
  try {
    m.close();
  } catch {
    /* already closed */
  }
}

let shared: Promise<Vision> | null = null;
let bag: Bag | null = null;
let users = 0;

async function createVision(onProgress: ProgressFn, bag: Bag): Promise<Vision> {
  const { FilesetResolver, FaceLandmarker, ImageSegmenter } = await import("@mediapipe/tasks-vision");

  // Approximate sizes, used until the server tells us the real ones.
  let wasmLoaded = 0;
  let wasmTotal = 14_700_000;
  let modelLoaded = 0;
  let modelTotal = 3_800_000;
  const report = () =>
    onProgress(Math.min(97, Math.round((100 * (wasmLoaded + modelLoaded)) / (wasmTotal + modelTotal))), "download");

  // Warm the HTTP cache for the WASM binary (with progress); MediaPipe then loads it from cache.
  const [, faceBytes, fileset] = await Promise.all([
    fetchBytes(ASSETS.wasmBinary, (l, t) => {
      wasmLoaded = l;
      if (t) wasmTotal = t;
      report();
    }).catch(() => null), // not fatal: FilesetResolver will fetch it itself
    fetchBytes(ASSETS.faceModel, (l, t) => {
      modelLoaded = l;
      if (t) modelTotal = t;
      report();
    }),
    FilesetResolver.forVisionTasks(ASSETS.wasmBase),
  ]);
  onProgress(98, "starting");

  const createFace = (delegate: Delegate) =>
    FaceLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetBuffer: faceBytes, delegate },
      runningMode: "VIDEO",
      numFaces: 2, // 2 so we can tell the user when more than one face is in view
      minFaceDetectionConfidence: 0.5,
      minFacePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

  let delegate: Delegate = "GPU";
  let face: FaceLandmarker | null = null;
  try {
    face = await createFace("GPU");
    // Some devices create a GPU graph but fail on first use — probe once.
    const probe = document.createElement("canvas");
    probe.width = probe.height = 32;
    probe.getContext("2d")?.fillRect(0, 0, 32, 32);
    face.detectForVideo(probe, performance.now());
  } catch {
    if (face) safeClose(face);
    delegate = "CPU";
    face = await createFace("CPU");
  }
  bag.add(face);

  let hairPromise: Promise<ImageSegmenter> | null = null;
  const hair = () => {
    hairPromise ??= (async () => {
      const bytes = await fetchBytes(ASSETS.hairModel);
      const create = (d: Delegate) =>
        ImageSegmenter.createFromOptions(fileset, {
          baseOptions: { modelAssetBuffer: bytes, delegate: d },
          runningMode: "IMAGE",
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      let seg: ImageSegmenter;
      try {
        seg = await create(delegate);
      } catch {
        seg = await create("CPU");
      }
      return bag.add(seg);
    })();
    return hairPromise;
  };

  onProgress(100, "ready");
  return { face, delegate, hair };
}

/** Get the shared models (loading them on first call). Pair every acquire with release(). */
export function acquireVision(onProgress: ProgressFn = () => {}): Promise<Vision> {
  users++;
  if (!shared) {
    bag = new Bag();
    shared = createVision(onProgress, bag).catch((err: unknown) => {
      shared = null;
      throw err;
    });
  } else {
    void shared.then(() => onProgress(100, "ready")).catch(() => {});
  }
  return shared;
}

/** Release the models; the last user closes them and frees WASM/GPU memory. */
export function releaseVision(): void {
  users = Math.max(0, users - 1);
  if (users > 0) return;
  bag?.closeAll(); // also closes anything that finishes loading later
  bag = null;
  shared = null;
}
