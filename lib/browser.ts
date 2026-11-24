/** Browser capability & in-app browser detection (client-side only). */

export type InAppBrowser = "TikTok" | "Instagram" | "Facebook" | "Snapchat" | null;

export function detectInAppBrowser(ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent): InAppBrowser {
  if (/musical_ly|BytedanceWebview|TikTok|ByteLocale/i.test(ua)) return "TikTok";
  if (/Instagram/i.test(ua)) return "Instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "Facebook";
  if (/Snapchat/i.test(ua)) return "Snapchat";
  return null;
}

export function isIOS(ua: string = typeof navigator === "undefined" ? "" : navigator.userAgent): boolean {
  return /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && typeof document !== "undefined" && "ontouchend" in document);
}

export function canUseCamera(): boolean {
  return typeof window !== "undefined" && window.isSecureContext && !!navigator.mediaDevices?.getUserMedia;
}

/** The on-device AI needs WebAssembly and a 2D canvas (every browser from ~2018 on). */
export function canRunAI(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return typeof WebAssembly === "object" && !!document.createElement("canvas").getContext("2d");
  } catch {
    return false;
  }
}

export type CameraProblem = "denied" | "not-found" | "in-use" | "unsupported" | "unknown";

export function cameraProblemFromError(err: unknown): CameraProblem {
  const name = err instanceof DOMException || err instanceof Error ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError" || name === "PermissionDeniedError") return "denied";
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") return "not-found";
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") return "in-use";
  if (name === "TypeError" || name === "NotSupportedError") return "unsupported";
  return "unknown";
}
