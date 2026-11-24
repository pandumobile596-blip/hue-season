/**
 * The 9:16 share card, drawn client-side on a canvas (1080×1920 by default).
 * Layout is designed at 1080 wide and scaled, so the same code renders the
 * smaller video frames too. Nothing here is uploaded anywhere.
 */
import { site } from "@/config/site";
import type { NamedColor, SeasonPalette } from "@/content/palettes";
import { drawDrape } from "@/lib/drape/render";
import { geometryFromLandmarks } from "@/lib/drape/geometry";
import type { StoredPhoto } from "@/lib/photoStore";
import { fitFontSize, wrapText, type Measure } from "./text";

export const CARD_W = 1080;
export const CARD_H = 1920;

const INK = "#2b2623";
const INK_SOFT = "#4a423d";
const MUTED = "#6b625b";
const ACCENT_INK = "#7d3a32";
const CREAM = "#fbf7f2";

export interface Fonts {
  serif: string;
  sans: string;
}

/** Font families from next/font (CSS variables on <html>), loaded before drawing. */
export async function loadCardFonts(): Promise<Fonts> {
  const css = getComputedStyle(document.documentElement);
  const serif = css.getPropertyValue("--font-fraunces").trim() || "Georgia, serif";
  const sans = css.getPropertyValue("--font-inter").trim() || "system-ui, sans-serif";
  try {
    await Promise.all([
      document.fonts.load(`500 100px ${serif}`),
      document.fonts.load(`italic 400 40px ${serif}`),
      document.fonts.load(`400 30px ${sans}`),
      document.fonts.load(`600 30px ${sans}`),
    ]);
  } catch {
    /* fall back to whatever is available */
  }
  return { serif, sans };
}

export interface CardOptions {
  season: SeasonPalette;
  fonts: Fonts;
  /** Include the user's face (with a drape of their best color). Default off for privacy. */
  photo?: StoredPhoto | null;
  /** Drape color for the face portrait (video frames cycle this). */
  drapeColor?: string;
}

// ─── Small drawing helpers ────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function measurer(ctx: CanvasRenderingContext2D, family: string, weight = 400, style = ""): Measure {
  return (text, size) => {
    ctx.font = `${style} ${weight} ${size}px ${family}`.trim();
    return ctx.measureText(text).width;
  };
}

function eyebrow(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fonts: Fonts, align: CanvasTextAlign = "center") {
  ctx.font = `600 26px ${fonts.sans}`;
  ctx.fillStyle = ACCENT_INK;
  ctx.textAlign = align;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
  ctx.fillText(text.toUpperCase(), x, y);
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
}

function logo(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const parts: Array<[number, number, string]> = [
    [-Math.PI / 2, 0, "#F4A98C"],
    [0, Math.PI / 2, "#B9735A"],
    [Math.PI / 2, Math.PI, "#6D1530"],
    [Math.PI, (3 * Math.PI) / 2, "#A9C9E8"],
  ];
  for (const [a0, a1, col] of parts) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  }
}

/** A labeled swatch: rounded chip + up to 2 lines of name underneath. */
function namedSwatch(
  ctx: CanvasRenderingContext2D,
  color: NamedColor,
  cx: number,
  top: number,
  size: number,
  nameSize: number,
  cellW: number,
  fonts: Fonts,
  round = false,
) {
  ctx.save();
  ctx.shadowColor = "rgba(43,38,35,0.14)";
  ctx.shadowBlur = size * 0.12;
  ctx.shadowOffsetY = size * 0.04;
  if (round) {
    ctx.beginPath();
    ctx.arc(cx, top + size / 2, size / 2, 0, Math.PI * 2);
  } else {
    roundRect(ctx, cx - size / 2, top, size, size, size * 0.24);
  }
  ctx.fillStyle = color.hex;
  ctx.fill();
  ctx.restore();
  // hairline ring so very light colors still read on cream
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.stroke();

  const m = measurer(ctx, fonts.sans, 400);
  const lines = wrapText(color.name, cellW - 12, nameSize, m, 2);
  ctx.font = `400 ${nameSize}px ${fonts.sans}`;
  ctx.fillStyle = INK_SOFT;
  ctx.textAlign = "center";
  lines.forEach((line, i) => ctx.fillText(line, cx, top + size + nameSize * 1.35 + i * nameSize * 1.2));
}

/**
 * Square crop of the photo (face + drape in `drapeColor`), `size` px wide.
 * Pre-render these once when drawing many frames (video).
 */
export function makePortrait(photo: StoredPhoto, drapeColor: string, size: number): HTMLCanvasElement {
  const src = photo.canvas;
  const off = document.createElement("canvas");
  off.width = src.width;
  off.height = src.height;
  const octx = off.getContext("2d");
  const out = document.createElement("canvas");
  out.width = out.height = size;
  const g = geometryFromLandmarks(photo.landmarks, src.width, src.height);
  if (octx) {
    octx.drawImage(src, 0, 0);
    drawDrape(octx, g, drapeColor);
    // A square centered a little above the chin, sized to show face + drape.
    const side = Math.min(g.faceW * 2.1, src.width, src.height);
    const sx = Math.max(0, Math.min(src.width - side, g.chinX - side / 2));
    const sy = Math.max(0, Math.min(src.height - side, g.chinY - side * 0.62));
    out.getContext("2d")?.drawImage(off, sx, sy, side, side, 0, 0, size, size);
  }
  off.width = off.height = 0;
  return out;
}

/** Draw a circular portrait (white ring + soft shadow). */
export function drawPortraitImage(ctx: CanvasRenderingContext2D, img: CanvasImageSource, cx: number, cy: number, diameter: number) {
  ctx.save();
  ctx.shadowColor = "rgba(43,38,35,0.18)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, diameter / 2 + 10, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, diameter / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - diameter / 2, cy - diameter / 2, diameter, diameter);
  ctx.restore();
}

/** Circular face portrait with the drape, cropped around the face. */
export function drawPortrait(
  ctx: CanvasRenderingContext2D,
  photo: StoredPhoto,
  drapeColor: string,
  cx: number,
  cy: number,
  diameter: number,
) {
  const img = makePortrait(photo, drapeColor, Math.round(diameter * 2));
  drawPortraitImage(ctx, img, cx, cy, diameter);
  img.width = img.height = 0;
}

// ─── Main card ────────────────────────────────────────────────────────────────

/**
 * Draw the full card into `ctx` (any size with a 9:16 ratio; layout is scaled from 1080×1920).
 */
export function drawCard(ctx: CanvasRenderingContext2D, opts: CardOptions) {
  const { season, fonts, photo } = opts;
  const W = ctx.canvas.width;
  const s = W / CARD_W;
  ctx.save();
  ctx.scale(s, s);
  const cx = CARD_W / 2;
  const face = !!photo;

  // Background: cream with soft glows of the season's own colors.
  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const glow = (x: number, y: number, r: number, color: string) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `${color}38`);
    g.addColorStop(1, `${color}00`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, CARD_W, CARD_H);
  };
  glow(cx, 260, 720, season.palette[1].hex);
  glow(CARD_W, CARD_H, 900, season.palette[8].hex);

  // Brand
  logo(ctx, cx - 120, 118, 20);
  ctx.font = `500 40px ${fonts.serif}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(site.name, cx - 88, 132);

  // Title
  eyebrow(ctx, "My color season", cx, 250, fonts);
  const nameSize = fitFontSize(season.name, 920, 150, 80, measurer(ctx, fonts.serif, 500));
  ctx.font = `500 ${nameSize}px ${fonts.serif}`;
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.fillText(season.name, cx, 250 + nameSize * 1.05);
  let y = 250 + nameSize * 1.05 + 70;
  const summaryLines = wrapText(season.summary, 860, 34, measurer(ctx, fonts.sans), 2);
  ctx.font = `400 34px ${fonts.sans}`;
  ctx.fillStyle = INK_SOFT;
  summaryLines.forEach((l, i) => ctx.fillText(l, cx, y + i * 46));
  y += (summaryLines.length - 1) * 46 + 50;

  // Optional face portrait
  if (face && photo) {
    const d = 300;
    drawPortrait(ctx, photo, opts.drapeColor ?? season.palette[0].hex, cx, y + d / 2 + 16, d);
    y += d + 50;
  }

  // Palette grid: 12 named colors (4 × 3)
  eyebrow(ctx, "My 12 colors", cx, y + 30, fonts);
  y += 70;
  const cellW = 225;
  const sw = face ? 100 : 150;
  const rowH = face ? 160 : 238;
  const gridLeft = (CARD_W - cellW * 4) / 2;
  season.palette.slice(0, 12).forEach((c, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    namedSwatch(ctx, c, gridLeft + cellW * col + cellW / 2, y + row * rowH, sw, face ? 24 : 27, cellW, fonts);
  });
  y += rowH * 3 + 24;

  // Neutrals + avoid, side by side
  const blockW = 430;
  const small = face ? 64 : 80;
  const blocks: Array<[string, NamedColor[], number]> = [
    ["Best neutrals", season.neutrals, 90],
    ["Avoid", season.avoid, CARD_W - 90 - blockW],
  ];
  for (const [title, colors, left] of blocks) {
    eyebrow(ctx, title, left + blockW / 2, y + 26, fonts);
    const cw = blockW / 4;
    colors.slice(0, 4).forEach((c, i) => namedSwatch(ctx, c, left + cw * i + cw / 2, y + 52, small, 21, cw, fonts, true));
  }
  y += 52 + small + (face ? 90 : 100);

  // Celebrities (names only)
  ctx.font = `400 26px ${fonts.sans}`;
  ctx.fillStyle = MUTED;
  ctx.textAlign = "center";
  ctx.fillText("Often associated with", cx, y + 20);
  const celeb = season.celebrities.join("  ·  ");
  const celebSize = fitFontSize(celeb, 900, 36, 24, measurer(ctx, fonts.serif, 400, "italic"));
  ctx.font = `italic 400 ${celebSize}px ${fonts.serif}`;
  ctx.fillStyle = INK;
  ctx.fillText(celeb, cx, y + 20 + celebSize * 1.5);

  // Watermark
  ctx.strokeStyle = "rgba(43,38,35,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 60, CARD_H - 110);
  ctx.lineTo(cx + 60, CARD_H - 110);
  ctx.stroke();
  ctx.font = `400 28px ${fonts.sans}`;
  ctx.fillStyle = MUTED;
  ctx.fillText(`Find yours free at ${site.domain}`, cx, CARD_H - 62);

  ctx.restore();
}

/** Render the card to a PNG blob at full 1080×1920. */
export async function renderCardBlob(opts: Omit<CardOptions, "fonts">): Promise<Blob> {
  const fonts = await loadCardFonts();
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  drawCard(ctx, { ...opts, fonts });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  canvas.width = canvas.height = 0;
  if (!blob) throw new Error("Could not create the image");
  return blob;
}
