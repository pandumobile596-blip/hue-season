"use client";

import { useSyncExternalStore } from "react";
import { detectInAppBrowser, isIOS, type InAppBrowser } from "@/lib/browser";
import { cn } from "@/lib/cn";

const noop = () => () => {};

/** Detects the in-app browser on the client only (server snapshot = none). */
export function useInAppBrowser(): InAppBrowser {
  return useSyncExternalStore(noop, () => detectInAppBrowser(), () => null);
}

/** "Open in Safari/Chrome" hint, shown only inside TikTok / Instagram / Facebook browsers. */
export function InAppHint({ className, force = false }: { className?: string; force?: boolean }) {
  const app = useInAppBrowser();
  const ios = useSyncExternalStore(noop, () => isIOS(), () => false);
  if (!app && !force) return null;
  const browser = ios ? "Safari" : "Chrome";
  return (
    <div className={cn("rounded-card bg-warning-soft p-4 text-left text-[0.95rem] text-warning", className)} role="note">
      <p className="font-semibold">
        {app ? `Looks like you're in the ${app} app.` : "Camera blocked by this browser?"}
      </p>
      <p className="mt-1 leading-relaxed">
        For the camera to work, tap the <span aria-label="menu">•••</span> menu and choose{" "}
        <strong>“Open in {browser}”</strong>. Or simply upload a selfie — that works right here.
      </p>
    </div>
  );
}
