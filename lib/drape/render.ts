/** Draws the fabric drape on a canvas (browser only). */
import { drapeOutline, type DrapeGeometry } from "./geometry";

function tracePath(ctx: CanvasRenderingContext2D, g: DrapeGeometry, h: number) {
  const o = drapeOutline(g, h);
  ctx.beginPath();
  ctx.moveTo(o.leftEdge.x, o.bottom);
  ctx.lineTo(o.leftEdge.x, o.leftEdge.y);
  ctx.quadraticCurveTo(o.leftShoulder.x, o.leftShoulder.y - g.faceW * 0.05, o.neckLeft.x, o.neckLeft.y);
  ctx.quadraticCurveTo(o.neckControl.x, o.neckControl.y, o.neckRight.x, o.neckRight.y);
  ctx.quadraticCurveTo(o.rightShoulder.x, o.rightShoulder.y - g.faceW * 0.05, o.rightEdge.x, o.rightEdge.y);
  ctx.lineTo(o.rightEdge.x, o.bottom);
  ctx.closePath();
  return o;
}

/**
 * Draw one drape. `clip` restricts it to the left or right half of the face
 * (in canvas coordinates) for split-screen mode.
 */
export function drawDrape(
  ctx: CanvasRenderingContext2D,
  g: DrapeGeometry,
  color: string,
  clip?: "left" | "right",
) {
  const { width: W, height: H } = ctx.canvas;
  ctx.save();
  if (clip) {
    ctx.beginPath();
    if (clip === "left") ctx.rect(0, 0, g.chinX, H);
    else ctx.rect(g.chinX, 0, W - g.chinX, H);
    ctx.clip();
  }
  const o = drapeOutline(g, H);
  ctx.translate(o.pivot.x, o.pivot.y);
  ctx.rotate(o.angle);
  ctx.translate(-o.pivot.x, -o.pivot.y);

  // Soft shadow where the fabric meets the neck, then the solid fabric.
  ctx.shadowColor = "rgba(0,0,0,0.28)";
  ctx.shadowBlur = g.faceW * 0.06;
  ctx.shadowOffsetY = g.faceW * 0.015;
  tracePath(ctx, g, H);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = "transparent";

  // Fabric shading: gentle top-to-bottom light falloff + vertical folds.
  ctx.save();
  tracePath(ctx, g, H);
  ctx.clip();
  const top = o.neckLeft.y;
  const light = ctx.createLinearGradient(0, top, 0, top + g.faceW * 2.2);
  light.addColorStop(0, "rgba(255,255,255,0.10)");
  light.addColorStop(0.5, "rgba(0,0,0,0)");
  light.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = light;
  ctx.fillRect(o.leftEdge.x, top - g.faceW, o.rightEdge.x - o.leftEdge.x, o.bottom);

  const folds = ctx.createLinearGradient(o.leftEdge.x, 0, o.rightEdge.x, 0);
  const n = 9;
  for (let i = 0; i <= n; i++) folds.addColorStop(i / n, i % 2 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)");
  ctx.fillStyle = folds;
  ctx.fillRect(o.leftEdge.x, top, o.rightEdge.x - o.leftEdge.x, o.bottom);
  ctx.restore();

  ctx.restore();
}

/** Thin divider through the face center for split-screen mode. */
export function drawDivider(ctx: CanvasRenderingContext2D, g: DrapeGeometry) {
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = Math.max(2, g.faceW * 0.012);
  ctx.setLineDash([g.faceW * 0.04, g.faceW * 0.03]);
  ctx.beginPath();
  ctx.moveTo(g.chinX, 0);
  ctx.lineTo(g.chinX, ctx.canvas.height);
  ctx.stroke();
  ctx.restore();
}
