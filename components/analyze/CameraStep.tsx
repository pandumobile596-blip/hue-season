"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { LIVE_TIPS, checkLiveFrame, ovalGuide, type LiveStatus } from "@/lib/analysis/live";
import { nextTimestamp, toCanvas } from "@/lib/analysis/pipeline";
import type { Point } from "@/lib/analysis/sample";
import type { CameraProblem } from "@/lib/browser";
import { CameraError, startFrontCamera } from "@/lib/camera";
import { cn } from "@/lib/cn";
import type { Vision } from "@/lib/mediapipe/loader";
import { LoadingBar } from "./LoadingBar";

/** Run face detection at most this often (ms) — about every 3rd frame at 30 fps. */
const DETECT_EVERY_MS = 90;
const CHECK_FRAME_WIDTH = 160;

export function CameraStep({
  vision,
  loadPercent,
  onCapture,
  onFail,
  onBack,
  onUpload,
}: {
  vision: Vision | null;
  loadPercent: number;
  onCapture: (canvas: HTMLCanvasElement) => void;
  onFail: (problem: CameraProblem) => void;
  onBack: () => void;
  onUpload: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [status, setStatus] = useState<LiveStatus | null>(null);

  // Keep latest callbacks/vision in refs so the camera effect runs only once.
  const visionRef = useRef(vision);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    visionRef.current = vision;
    onFailRef.current = onFail;
  });

  // Start the camera; stop every track when leaving.
  useEffect(() => {
    let stop: (() => void) | null = null;
    const videoEl = videoRef.current;
    let raf = 0;
    let cancelled = false;
    let lastCheck = 0;
    let prevNose: Point | null = null;
    let lastStatus: LiveStatus | null = null;
    const small = document.createElement("canvas");
    const smallCtx = small.getContext("2d", { willReadFrequently: true });

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const video = videoRef.current;
      const v = visionRef.current;
      if (!video || !v || video.readyState < 2 || now - lastCheck < DETECT_EVERY_MS || !smallCtx) return;
      lastCheck = now;
      try {
        const res = v.face.detectForVideo(video, nextTimestamp());
        small.width = CHECK_FRAME_WIDTH;
        small.height = Math.round((CHECK_FRAME_WIDTH * video.videoHeight) / video.videoWidth) || 120;
        smallCtx.drawImage(video, 0, 0, small.width, small.height);
        const frame = smallCtx.getImageData(0, 0, small.width, small.height);
        const check = checkLiveFrame({ faces: (res.faceLandmarks ?? []) as Point[][], frame, previousNose: prevNose });
        prevNose = check.nose;
        if (check.status !== lastStatus) {
          lastStatus = check.status;
          setStatus(check.status);
        }
      } catch {
        /* a dropped frame is harmless */
      }
    };

    (async () => {
      if (!videoEl) return;
      try {
        const stopCamera = await startFrontCamera(videoEl);
        if (cancelled) {
          stopCamera();
          return;
        }
        stop = stopCamera;
        setSize({ w: videoEl.videoWidth, h: videoEl.videoHeight });
        raf = requestAnimationFrame(loop);
      } catch (err) {
        if (!cancelled) onFailRef.current(err instanceof CameraError ? err.problem : "unknown");
      }
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stop?.();
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    onCapture(toCanvas(video, video.videoWidth, video.videoHeight));
  };

  const ready = status === "ready";
  const oval = size ? ovalGuide(size.w, size.h) : null;
  const tip = vision ? (status ? LIVE_TIPS[status] : "Finding your face…") : "Getting the AI ready…";

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={onBack} className="inline-flex min-h-12 items-center gap-1 rounded-full px-2 text-ink-soft hover:text-ink">
          <span aria-hidden="true">←</span> Back
        </button>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink">Step 2 of 3</p>
      </div>

      <div
        className="relative mx-auto w-full overflow-hidden rounded-card bg-ink shadow-lift"
        style={{ aspectRatio: size ? `${size.w} / ${size.h}` : "3 / 4", maxHeight: "68dvh" }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          aria-label="Live camera preview"
          className="absolute inset-0 size-full -scale-x-100 object-contain"
        />
        {oval && size && (
          <svg viewBox={`0 0 ${size.w} ${size.h}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
            <defs>
              <mask id="oval-cutout">
                <rect width="100%" height="100%" fill="white" />
                <ellipse cx={oval.cx} cy={oval.cy} rx={oval.rx} ry={oval.ry} fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(20,16,14,0.45)" mask="url(#oval-cutout)" />
            <ellipse
              cx={oval.cx}
              cy={oval.cy}
              rx={oval.rx}
              ry={oval.ry}
              fill="none"
              stroke={ready ? "#7fd1a6" : "rgba(255,255,255,0.9)"}
              strokeWidth={Math.max(3, size.w / 160)}
              strokeDasharray={ready ? undefined : `${size.w / 40} ${size.w / 60}`}
              className="transition-[stroke] duration-300"
            />
          </svg>
        )}

        {!vision && (
          <div className="absolute inset-x-4 top-4 rounded-soft bg-surface/95 p-3 text-ink shadow-soft">
            <LoadingBar percent={loadPercent} />
          </div>
        )}

        <p
          aria-live="polite"
          className={cn(
            "absolute inset-x-4 bottom-4 rounded-full px-4 py-2.5 text-center text-[0.95rem] font-medium shadow-soft backdrop-blur",
            ready ? "bg-success text-white" : "bg-surface/90 text-ink",
          )}
        >
          {tip}
        </p>
      </div>

      <div className="mt-5 flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={capture}
          disabled={!size}
          className={cn("w-full max-w-xs", ready && "ring-4 ring-success/30")}
          aria-describedby="capture-help"
        >
          {ready ? "Capture now" : "Capture"}
        </Button>
        <p id="capture-help" className="text-center text-sm text-muted">
          The button lights up when everything looks good — or tap it any time.
        </p>
        <PrivacyBadge />
        <button type="button" onClick={onUpload} className="min-h-12 font-medium text-accent-ink underline underline-offset-4">
          Upload a photo instead
        </button>
      </div>
    </div>
  );
}
