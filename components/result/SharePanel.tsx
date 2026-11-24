"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { site } from "@/config/site";
import type { SeasonPalette } from "@/content/palettes";
import { useInAppBrowser } from "@/components/analyze/InAppHint";
import { LoadingBar } from "@/components/analyze/LoadingBar";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getPhoto } from "@/lib/photoStore";
import { renderCardBlob } from "@/lib/share/card";
import { copyText, downloadBlob, shareFile } from "@/lib/share/share";
import { seasonShareUrl, shareFileName } from "@/lib/share/text";
import { canRecordVideo, recordRevealVideo, type VideoResult } from "@/lib/share/video";

const noSubscribe = () => () => {};

type VideoState = { status: "idle" } | { status: "recording"; progress: number } | { status: "ready"; video: VideoResult; url: string } | { status: "error" };

export function SharePanel({ season }: { season: SeasonPalette }) {
  const hasPhoto = useSyncExternalStore(noSubscribe, () => getPhoto() !== null, () => false);
  const videoSupported = useSyncExternalStore(noSubscribe, canRecordVideo, () => false);
  const inApp = useInAppBrowser();

  const [includeFace, setIncludeFace] = useState(false);
  const [card, setCard] = useState<{ blob: Blob; url: string; key: string } | null>(null);
  const [video, setVideo] = useState<VideoState>({ status: "idle" });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const urls = useRef<string[]>([]);

  const cardKey = `${season.slug}:${includeFace && hasPhoto ? "face" : "palette"}`;

  // (Re)render the card when the season or face option changes.
  useEffect(() => {
    let cancelled = false;
    renderCardBlob({ season, photo: includeFace ? getPhoto() : null })
      .then((blob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        urls.current.push(url);
        setCard({ blob, url, key: cardKey });
      })
      .catch(() => {
        if (!cancelled) setCard(null);
      });
    return () => {
      cancelled = true;
    };
  }, [season, includeFace, cardKey]);

  // Free all object URLs when leaving.
  useEffect(() => {
    const list = urls.current;
    return () => {
      list.forEach((u) => URL.revokeObjectURL(u));
      window.clearTimeout(toastTimer.current);
    };
  }, []);

  const say = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3000);
  };

  const link = () => seasonShareUrl(window.location.origin, season.slug);
  const shareText = `I'm a ${season.name}! 🎨 Find your color season free —`;
  const ready = card?.key === cardKey ? card : null;

  const onShare = async () => {
    if (!ready) return;
    const file = new File([ready.blob], shareFileName(site.name, season.slug, "png"), { type: "image/png" });
    const out = await shareFile(file, { title: `${season.name} · ${site.name}`, text: shareText, url: link() });
    if (out === "downloaded") say("Image saved — check your downloads.");
    if (out === "failed") say("Couldn't share here. Press and hold the image to save it.");
  };

  const onDownload = () => {
    if (!ready) return;
    downloadBlob(ready.blob, shareFileName(site.name, season.slug, "png"));
    say("Image saved — check your downloads.");
  };

  const onCopy = async () => say((await copyText(link())) ? "Link copied!" : "Couldn't copy — the link is " + link());

  const onMakeVideo = async () => {
    setVideo({ status: "recording", progress: 0 });
    try {
      const result = await recordRevealVideo(season, includeFace ? getPhoto() : null, (p) =>
        setVideo({ status: "recording", progress: p }),
      );
      const url = URL.createObjectURL(result.blob);
      urls.current.push(url);
      setVideo({ status: "ready", video: result, url });
    } catch {
      setVideo({ status: "error" });
    }
  };

  const onShareVideo = async () => {
    if (video.status !== "ready") return;
    const file = new File([video.video.blob], shareFileName(site.name, season.slug, video.video.ext), { type: video.video.mime });
    const out = await shareFile(file, { title: `${season.name} · ${site.name}`, text: shareText, url: link() });
    if (out === "downloaded") say("Video saved — check your downloads.");
  };

  return (
    <section aria-labelledby="share-h" className="rounded-card bg-surface p-5 shadow-soft ring-1 ring-line sm:p-6">
      <h2 id="share-h" className="text-2xl font-medium">
        Share your season
      </h2>
      <p className="mt-1 text-ink-soft">A story-sized card (9:16) for TikTok, Instagram or your group chat.</p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="w-48 shrink-0 sm:w-52">
          {ready ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob URL, not optimizable
            <img
              src={ready.url}
              width={1080}
              height={1920}
              alt={`Share card: ${season.name}, with its 12-color palette, best neutrals, colors to avoid and the ${site.domain} watermark${includeFace && hasPhoto ? ", plus your photo" : ""}.`}
              className="h-auto w-full rounded-soft shadow-lift ring-1 ring-line"
            />
          ) : (
            <div className="aspect-[9/16] w-full animate-pulse rounded-soft bg-sand" aria-label="Creating your card…" role="img" />
          )}
          {inApp && ready && <p className="mt-2 text-center text-xs text-muted">Tip: press and hold the image to save it.</p>}
        </div>

        <div className="flex w-full flex-col gap-3">
          <label
            className={cn(
              "flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-soft bg-cream px-4 py-2 ring-1 ring-line",
              !hasPhoto && "cursor-not-allowed opacity-60",
            )}
          >
            <span>
              <span className="block font-medium">Include my photo</span>
              <span className="block text-sm text-muted">
                {hasPhoto ? "Off by default — the palette-only card is more private." : "Available right after an analysis."}
              </span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={includeFace && hasPhoto}
              disabled={!hasPhoto}
              onChange={(e) => setIncludeFace(e.target.checked)}
              className="size-6 shrink-0 accent-accent"
            />
          </label>

          <Button size="lg" onClick={onShare} disabled={!ready}>
            Share
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onDownload} disabled={!ready}>
              Download image
            </Button>
            <Button variant="secondary" onClick={onCopy}>
              Copy link
            </Button>
          </div>

          {videoSupported && (
            <div className="mt-2 rounded-soft bg-sand p-4">
              {video.status === "idle" && (
                <Button variant="ghost" className="w-full" onClick={onMakeVideo}>
                  🎬 Make a 7-second video
                </Button>
              )}
              {video.status === "recording" && <LoadingBar percent={video.progress * 100} label="Making your video" />}
              {video.status === "error" && (
                <p className="text-sm text-warning">
                  Video didn&apos;t work on this browser.{" "}
                  <button type="button" className="underline" onClick={() => setVideo({ status: "idle" })}>
                    Try again
                  </button>
                </p>
              )}
              {video.status === "ready" && (
                <div className="space-y-3">
                  <video
                    src={video.url}
                    controls
                    playsInline
                    muted
                    loop
                    aria-label={`Reveal video for ${season.name}`}
                    className="mx-auto aspect-[9/16] w-40 rounded-soft bg-ink"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Button onClick={onShareVideo}>Share video</Button>
                    <Button
                      variant="secondary"
                      onClick={() => downloadBlob(video.video.blob, shareFileName(site.name, season.slug, video.video.ext))}
                    >
                      Download
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p aria-live="polite" className={cn("mt-4 min-h-6 text-center text-sm font-medium text-success", !toast && "invisible")}>
        {toast ?? " "}
      </p>
    </section>
  );
}
