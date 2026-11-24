/** Share / download / copy helpers with graceful fallbacks (browser only). */

export type ShareOutcome = "shared" | "downloaded" | "cancelled" | "failed";

/** Can this browser share files through the native share sheet? (mostly mobile) */
export function canShareFiles(file: File): boolean {
  try {
    return typeof navigator !== "undefined" && !!navigator.canShare && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

/** Trigger a normal file download. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Native share sheet with the file on mobile; download fallback elsewhere. */
export async function shareFile(file: File, data: { title: string; text: string; url: string }): Promise<ShareOutcome> {
  if (canShareFiles(file)) {
    try {
      await navigator.share({ files: [file], title: data.title, text: `${data.text} ${data.url}` });
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
      // Some browsers reject file shares at the last moment — fall through to download.
    }
  }
  try {
    downloadBlob(file, file.name);
    return "downloaded";
  } catch {
    return "failed";
  }
}

/** Copy text, with an old-school fallback for in-app browsers without the Clipboard API. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
