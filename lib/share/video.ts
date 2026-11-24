/**
 * ~7.5s 9:16 reveal video, recorded client-side with MediaRecorder.
 * MP4 where supported (iPhone, recent Chrome), WebM otherwise.
 * Scenes: "My color season is…" → name + palette → drape color cycling → full card.
 */
import type { SeasonPalette } from "@/content/palettes";
import type { StoredPhoto } from "@/lib/photoStore";
import { drawCard, drawPortraitImage, loadCardFonts, makePortrait, type Fonts } from "./card";
import { fitFontSize } from "./text";

const W = 720;
const H = 1280;
const FPS = 30;

/** Scene timeline in seconds. */
const T = { intro: 1.2, name: 3.0, drape: 6.6, end: 7.6 };
const CYCLE_COLORS = 6;

const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

export function pickVideoMime(isSupported: (t: string) => boolean): string | null {
  return MIME_CANDIDATES.find((t) => isSupported(t)) ?? null;
}

/** Hide the video button when the browser can't record a canvas. */
export function canRecordVideo(): boolean {
  if (typeof window === "undefined" || typeof MediaRecorder === "undefined") return false;
  if (typeof HTMLCanvasElement.prototype.captureStream !== "function") return false;
  try {
    return pickVideoMime((t) => MediaRecorder.isTypeSupported(t)) !== null;
  } catch {
    return false;
  }
}

const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

function background(ctx: CanvasRenderingContext2D, season: SeasonPalette) {
  ctx.fillStyle = "#fbf7f2";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H * 0.38, 0, W / 2, H * 0.38, W);
  g.addColorStop(0, `${season.palette[1].hex}40`);
  g.addColorStop(1, `${season.palette[1].hex}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  t: number,
  season: SeasonPalette,
  fonts: Fonts,
  portraits: HTMLCanvasElement[] | null,
  endCard: HTMLCanvasElement,
) {
  const cx = W / 2;
  if (t >= T.drape) {
    // Final scene: the share card (pre-rendered once) fades in.
    background(ctx, season);
    ctx.globalAlpha = ease((t - T.drape) / 0.5);
    ctx.drawImage(endCard, 0, 0);
    ctx.globalAlpha = 1;
    return;
  }
  background(ctx, season);
  ctx.textAlign = "center";

  // "My color season is…"
  const introAlpha = t < T.name ? ease(t / 0.6) : 1;
  ctx.globalAlpha = introAlpha;
  ctx.font = `italic 400 44px ${fonts.serif}`;
  ctx.fillStyle = "#4a423d";
  ctx.fillText("My color season is…", cx, t < T.name ? H * 0.42 : 170);
  ctx.globalAlpha = 1;

  if (t < T.intro) return;

  // Season name
  const nameT = ease((t - T.intro) / 0.8);
  const size = fitFontSize(season.name.toUpperCase(), W - 80, 96, 48, (txt, s) => {
    ctx.font = `500 ${s}px ${fonts.serif}`;
    return ctx.measureText(txt).width;
  });
  ctx.globalAlpha = nameT;
  ctx.font = `500 ${size}px ${fonts.serif}`;
  ctx.fillStyle = "#2b2623";
  const nameY = t < T.name ? H * 0.42 + 40 + size + (1 - nameT) * 30 : 170 + 20 + size;
  ctx.fillText(season.name.toUpperCase(), cx, nameY);
  ctx.globalAlpha = 1;

  if (t < T.name) {
    // Palette dots pop in.
    season.palette.forEach((c, i) => {
      const p = ease((t - T.intro - 0.5 - i * 0.06) / 0.35);
      if (p <= 0) return;
      const col = i % 6;
      const row = Math.floor(i / 6);
      const r = 38 * p;
      ctx.beginPath();
      ctx.arc(cx - 5 * 92 / 2 + col * 92, H * 0.62 + row * 100, r, 0, Math.PI * 2);
      ctx.fillStyle = c.hex;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    });
    return;
  }

  // Drape cycling through the best colors.
  const per = (T.drape - T.name) / CYCLE_COLORS;
  const k = Math.min(CYCLE_COLORS - 1, Math.floor((t - T.name) / per));
  const color = season.palette[k];
  const cy = H * 0.52;
  const d = 520;
  if (portraits) {
    drawPortraitImage(ctx, portraits[k], cx, cy, d);
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, d / 2, 0, Math.PI * 2);
    ctx.fillStyle = color.hex;
    ctx.fill();
    ctx.lineWidth = 14;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
  }
  ctx.font = `600 22px ${fonts.sans}`;
  ctx.fillStyle = "#7d3a32";
  ctx.fillText("MY BEST COLORS", cx, cy + d / 2 + 70);
  ctx.font = `500 52px ${fonts.serif}`;
  ctx.fillStyle = "#2b2623";
  ctx.fillText(color.name, cx, cy + d / 2 + 135);
}

export interface VideoResult {
  blob: Blob;
  ext: "mp4" | "webm";
  mime: string;
}

/**
 * Record the reveal video in real time (~7.6s).
 * @param photo include the face only when the user opted in.
 */
export async function recordRevealVideo(
  season: SeasonPalette,
  photo: StoredPhoto | null,
  onProgress: (fraction: number) => void,
): Promise<VideoResult> {
  const mime = pickVideoMime((t) => MediaRecorder.isTypeSupported(t));
  if (!mime) throw new Error("Video recording is not supported in this browser");
  const fonts = await loadCardFonts();
  const portraits = photo
    ? season.palette.slice(0, CYCLE_COLORS).map((c) => makePortrait(photo, c.hex, 520))
    : null;

  const endCard = document.createElement("canvas");
  endCard.width = W;
  endCard.height = H;
  const endCtx = endCard.getContext("2d");
  if (endCtx) drawCard(endCtx, { season, fonts, photo });

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  drawFrame(ctx, 0, season, fonts, portraits, endCard);

  const stream = canvas.captureStream(FPS);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));

  recorder.start(250);
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      drawFrame(ctx, Math.min(t, T.end), season, fonts, portraits, endCard);
      onProgress(Math.min(1, t / T.end));
      if (t >= T.end) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await stopped;
  stream.getTracks().forEach((tr) => tr.stop());
  portraits?.forEach((p) => (p.width = p.height = 0));
  canvas.width = canvas.height = 0;
  endCard.width = endCard.height = 0;

  const type = mime.split(";")[0];
  return { blob: new Blob(chunks, { type }), ext: type === "video/mp4" ? "mp4" : "webm", mime: type };
}
