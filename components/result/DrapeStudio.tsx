"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { NamedColor, SeasonPalette } from "@/content/palettes";
import { InAppHint } from "@/components/analyze/InAppHint";
import { LoadingBar } from "@/components/analyze/LoadingBar";
import { Button } from "@/components/ui/Button";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { fileToCanvas, nextTimestamp } from "@/lib/analysis/pipeline";
import type { Point } from "@/lib/analysis/sample";
import { CameraError, startFrontCamera } from "@/lib/camera";
import { cn } from "@/lib/cn";
import { DrapeTracker, geometryFromLandmarks, type DrapeGeometry } from "@/lib/drape/geometry";
import { drawDivider, drawDrape } from "@/lib/drape/render";
import { acquireVision, releaseVision, type Vision } from "@/lib/mediapipe/loader";
import { getPhoto, setPhoto, type StoredPhoto } from "@/lib/photoStore";

type Mode = "best" | "avoid" | "split";
type Source = "photo" | "live";

/** Detect at most this often in live mode (≈ every 2nd frame); positions are interpolated in between. */
const LIVE_DETECT_MS = 66;
const LIVE_MAX_WIDTH = 720;

const MODES: Array<{ id: Mode; label: string }> = [
  { id: "best", label: "Best colors" },
  { id: "avoid", label: "Avoid" },
  { id: "split", label: "Split" },
];

export function DrapeStudio({ season }: { season: SeasonPalette }) {
  const [photo, setLocalPhoto] = useState<StoredPhoto | null>(() => getPhoto());
  const [source, setSource] = useState<Source | null>(() => (getPhoto() ? "photo" : null));
  const [mode, setMode] = useState<Mode>("best");
  const [index, setIndex] = useState(0);
  const [liveState, setLiveState] = useState<"idle" | "starting" | "on" | "error">("idle");
  const [loadPercent, setLoadPercent] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const best = season.palette;
  const avoid = season.avoid;
  const list = mode === "avoid" ? avoid : best;
  const i = ((index % list.length) + list.length) % list.length;
  const current: NamedColor = list[i];
  const splitBest = best[((index % best.length) + best.length) % best.length];
  const splitAvoid = avoid[((index % avoid.length) + avoid.length) % avoid.length];
  const mirrored = source === "live";

  // Latest colors for the live render loop (which must not restart on every tap).
  const drawRef = useRef({ mode, current, splitBest, splitAvoid, mirrored });
  useEffect(() => {
    drawRef.current = { mode, current, splitBest, splitAvoid, mirrored };
  });

  const paintDrapes = useCallback((ctx: CanvasRenderingContext2D, g: DrapeGeometry) => {
    const d = drawRef.current;
    if (d.mode === "split") {
      // On a mirrored (selfie) view, the canvas's right half shows on the left of the screen.
      drawDrape(ctx, g, d.splitBest.hex, d.mirrored ? "right" : "left");
      drawDrape(ctx, g, d.splitAvoid.hex, d.mirrored ? "left" : "right");
      drawDivider(ctx, g);
    } else {
      drawDrape(ctx, g, d.current.hex);
    }
  }, []);

  // When the page is hidden (navigated away), don't silently restart the camera on return.
  useLayoutEffect(
    () => () => {
      const stored = getPhoto();
      setLocalPhoto(stored);
      setSource((s) => (s === "live" ? (stored ? "photo" : null) : stored ? s : null));
      setLiveState("idle");
    },
    [],
  );

  // ── Photo mode: redraw whenever the color or mode changes ──────────────────
  useEffect(() => {
    if (source !== "photo" || !photo) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const scale = Math.min(1, 900 / Math.max(photo.canvas.width, photo.canvas.height));
    canvas.width = Math.round(photo.canvas.width * scale);
    canvas.height = Math.round(photo.canvas.height * scale);
    ctx.drawImage(photo.canvas, 0, 0, canvas.width, canvas.height);
    paintDrapes(ctx, geometryFromLandmarks(photo.landmarks, canvas.width, canvas.height));
  }, [source, photo, mode, index, season, paintDrapes]);

  // ── Live mode: camera + detection every ~2 frames + smoothed drape ─────────
  useEffect(() => {
    if (source !== "live") return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!video || !canvas || !ctx) return;

    let cancelled = false;
    let raf = 0;
    let stopCamera: (() => void) | null = null;
    let acquired = false;
    let vision: Vision | null = null;
    let lastDetect = 0;
    const tracker = new DrapeTracker();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (video.readyState < 2) return;
      if (canvas.width !== Math.min(LIVE_MAX_WIDTH, video.videoWidth)) {
        canvas.width = Math.min(LIVE_MAX_WIDTH, video.videoWidth);
        canvas.height = Math.round((canvas.width * video.videoHeight) / video.videoWidth);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      if (vision && now - lastDetect >= LIVE_DETECT_MS) {
        lastDetect = now;
        try {
          const res = vision.face.detectForVideo(video, nextTimestamp());
          const lm = res.faceLandmarks?.[0] as Point[] | undefined;
          tracker.setTarget(lm ? geometryFromLandmarks(lm, canvas.width, canvas.height) : null);
        } catch {
          /* skip a frame */
        }
      }
      const g = tracker.step();
      if (g) paintDrapes(ctx, g);
    };

    setLiveState("starting");
    setMessage(null);
    (async () => {
      try {
        acquired = true;
        const visionPromise = acquireVision(setLoadPercent);
        stopCamera = await startFrontCamera(video);
        if (cancelled) return;
        setLiveState("on");
        raf = requestAnimationFrame(loop);
        vision = await visionPromise;
      } catch (err) {
        if (cancelled) return;
        setLiveState("error");
        setMessage(
          err instanceof CameraError
            ? err.problem === "denied"
              ? "Camera access was blocked. You can allow it in your browser settings, or use a photo instead."
              : "We couldn't start your camera here. Try a photo instead."
            : "The AI couldn't load. Check your connection and try again.",
        );
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stopCamera?.();
      if (acquired) releaseVision();
      tracker.reset();
    };
  }, [source, paintDrapes]);

  // ── Upload a photo to drape on (when there's no photo from the analysis) ───
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setMessage(null);
    setSource(null);
    setLiveState("starting");
    try {
      const canvas = await fileToCanvas(file);
      const vision = await acquireVision(setLoadPercent);
      try {
        const res = vision.face.detectForVideo(canvas, nextTimestamp());
        const faces = (res.faceLandmarks ?? []) as Point[][];
        if (faces.length !== 1) {
          setMessage(faces.length ? "Please use a photo with just one face." : "We couldn't find a face in that photo.");
          setLiveState("idle");
          return;
        }
        const p: StoredPhoto = { canvas, landmarks: faces[0], source: "upload" };
        setPhoto(p);
        setLocalPhoto(p);
        setSource("photo");
        setLiveState("idle");
      } finally {
        releaseVision();
      }
    } catch {
      setLiveState("idle");
      setMessage("We couldn't open that photo. Try another one.");
    }
  };

  // ── Navigation: swipe, arrows, buttons ─────────────────────────────────────
  const step = (dir: 1 | -1) => setIndex((n) => n + dir);
  const swipeStart = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    swipeStart.current = e.clientX;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    if (swipeStart.current === null) return;
    const dx = e.clientX - swipeStart.current;
    swipeStart.current = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 8) step(1); // a simple tap also cycles
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") step(1);
    if (e.key === "ArrowLeft") step(-1);
  };

  const showing = source === "photo" || (source === "live" && liveState === "on");

  return (
    <section aria-labelledby="drape-h" className="rounded-card bg-surface p-4 shadow-soft ring-1 ring-line sm:p-6">
      <h2 id="drape-h" className="text-2xl font-medium">
        Try your colors on
      </h2>
      <p className="mt-1 text-ink-soft">Swipe or tap the picture to change the fabric. See how your face lights up.</p>

      <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />
      <video ref={videoRef} className="hidden" playsInline muted aria-hidden="true" />

      {/* Mode tabs */}
      <div role="tablist" aria-label="Drape mode" className="mt-4 grid grid-cols-3 gap-1 rounded-full bg-sand p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            type="button"
            aria-selected={mode === m.id}
            onClick={() => {
              setMode(m.id);
              setIndex(0);
            }}
            className={cn(
              "min-h-11 rounded-full text-[0.95rem] font-medium transition-colors",
              mode === m.id ? "bg-surface text-ink shadow-soft" : "text-ink-soft hover:text-ink",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="relative mt-4">
        <div
          role="group"
          aria-roledescription="carousel"
          aria-label={
            mode === "split"
              ? `Split view: ${splitBest.name} (best) versus ${splitAvoid.name} (avoid). Use left and right arrow keys to change colors.`
              : `Drape color ${current.name}. Use left and right arrow keys to change colors.`
          }
          tabIndex={showing ? 0 : -1}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          className={cn(
            "relative mx-auto w-full touch-pan-y overflow-hidden rounded-soft bg-ink select-none",
            !showing && "hidden",
          )}
        >
          <canvas ref={canvasRef} className={cn("block h-auto max-h-[70dvh] w-full object-contain", mirrored && "-scale-x-100")} />
          {mode === "split" ? (
            <>
              <ColorTag className="left-3" label="Best" color={splitBest} />
              <ColorTag className="right-3" label="Avoid" color={splitAvoid} />
            </>
          ) : (
            <ColorTag className="left-1/2 -translate-x-1/2" label={mode === "best" ? "Best" : "Avoid"} color={current} />
          )}
          <p aria-live="polite" className="sr-only">
            {mode === "split" ? `${splitBest.name} versus ${splitAvoid.name}` : current.name}
          </p>
        </div>

        {showing && (
          <>
            <ArrowButton side="left" onClick={() => step(-1)} />
            <ArrowButton side="right" onClick={() => step(1)} />
          </>
        )}

        {!showing && (
          <div className="flex flex-col items-center gap-3 rounded-soft bg-sand px-4 py-10 text-center">
            {liveState === "starting" ? (
              <div className="w-full max-w-xs">
                <LoadingBar percent={loadPercent} label={source === "live" ? "Starting camera" : "Loading AI"} />
              </div>
            ) : (
              <>
                <p className="max-w-xs text-ink-soft">See your palette draped under your face — live, like a real color analyst.</p>
                <Button size="lg" onClick={() => setSource("live")} className="w-full max-w-xs">
                  Start live draping
                </Button>
                <Button variant="secondary" onClick={() => fileRef.current?.click()} className="w-full max-w-xs">
                  Use a photo instead
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {message && (
        <div className="mt-4 space-y-3" role="alert">
          <p className="rounded-soft bg-warning-soft p-3 text-[0.95rem] text-warning">{message}</p>
          {liveState === "error" && <InAppHint />}
        </div>
      )}

      {/* Color chips (names always visible) */}
      {mode !== "split" || showing ? (
        <div className="mt-4 -mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
          <ul className="flex w-max gap-2 pb-1" aria-label={mode === "avoid" ? "Colors to avoid" : "Your best colors"}>
            {(mode === "avoid" ? avoid : best).map((c, k) => {
              const active = mode === "split" ? splitBest === c : k === i;
              return (
                <li key={c.hex + c.name}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => setIndex(k)}
                    className={cn(
                      "flex min-h-12 items-center gap-2 rounded-full py-1.5 pr-3.5 pl-1.5 text-sm ring-1 transition-colors",
                      active ? "bg-ink text-white ring-ink" : "bg-cream text-ink ring-line hover:ring-accent/50",
                    )}
                  >
                    <span aria-hidden="true" className="size-8 rounded-full ring-1 ring-black/10" style={{ backgroundColor: c.hex }} />
                    {c.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {showing && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          {source === "photo" ? (
            <button type="button" onClick={() => setSource("live")} className="min-h-12 font-medium text-accent-ink underline underline-offset-4">
              Switch to live camera
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (photo ? setSource("photo") : fileRef.current?.click())}
              className="min-h-12 font-medium text-accent-ink underline underline-offset-4"
            >
              {photo ? "Use my photo instead" : "Use a photo instead"}
            </button>
          )}
          {source === "live" && (
            <button type="button" onClick={() => setSource(photo ? "photo" : null)} className="min-h-12 text-ink-soft underline underline-offset-4">
              Stop camera
            </button>
          )}
        </div>
      )}
      <PrivacyBadge className="mt-3" />
    </section>
  );
}

function ColorTag({ label, color, className }: { label: string; color: NamedColor; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute bottom-3 inline-flex items-center gap-2 rounded-full bg-surface/95 py-1.5 pr-3.5 pl-1.5 text-sm font-medium text-ink shadow-soft",
        className,
      )}
    >
      <span className="size-6 rounded-full ring-1 ring-black/10" style={{ backgroundColor: color.hex }} />
      <span>
        <span className="text-muted">{label}:</span> {color.name}
      </span>
    </span>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous color" : "Next color"}
      className={cn(
        "absolute top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-xl text-ink shadow-soft hover:bg-surface",
        side === "left" ? "left-2" : "right-2",
      )}
    >
      <span aria-hidden="true">{side === "left" ? "‹" : "›"}</span>
    </button>
  );
}
