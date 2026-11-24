/**
 * Self-hosts the MediaPipe runtime + models so the site never calls a CDN at runtime.
 *
 * 1. Copies the WASM runtime from node_modules → public/mediapipe/wasm (every install).
 * 2. Downloads the two model files into public/models if they're missing.
 *    Commit public/models to git so deployments don't depend on Google's servers.
 *
 * Runs automatically after `npm install` (postinstall). Safe to re-run.
 */
import { copyFile, mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const WASM_SRC = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const WASM_DEST = join(root, "public", "mediapipe", "wasm");
const WASM_FILES = ["vision_wasm_internal.js", "vision_wasm_internal.wasm"];

const MODELS_DEST = join(root, "public", "models");
const MODELS = [
  {
    file: "face_landmarker.task",
    url: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  },
  {
    file: "hair_segmenter.tflite",
    url: "https://storage.googleapis.com/mediapipe-models/image_segmenter/hair_segmenter/float32/latest/hair_segmenter.tflite",
  },
];

async function exists(p) {
  try {
    return (await stat(p)).size > 0;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(WASM_DEST, { recursive: true });
  for (const f of WASM_FILES) await copyFile(join(WASM_SRC, f), join(WASM_DEST, f));
  console.log("[ai-assets] WASM runtime copied to public/mediapipe/wasm");

  await mkdir(MODELS_DEST, { recursive: true });
  for (const m of MODELS) {
    const dest = join(MODELS_DEST, m.file);
    if (await exists(dest)) continue;
    console.log(`[ai-assets] downloading ${m.file} …`);
    const res = await fetch(m.url);
    if (!res.ok) throw new Error(`Download failed for ${m.file}: HTTP ${res.status}`);
    await writeFile(dest, Buffer.from(await res.arrayBuffer()));
    console.log(`[ai-assets] saved public/models/${m.file}`);
  }
}

main().catch((err) => {
  // Don't break `npm install` — print a clear message instead.
  console.warn(`[ai-assets] ${err.message}\nRun "npm run setup:ai" again when you're online.`);
});
