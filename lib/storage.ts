/**
 * Remembers the last result on this device only (localStorage).
 * Every access is wrapped in try/catch: private mode, in-app browsers and
 * blocked storage must never break the app.
 */
import type { AnalysisResult } from "@/lib/analysis/analyze";

export const RESULT_KEY = "hue-season:last-result";
const KEY = RESULT_KEY;

export function saveResult(result: AnalysisResult): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(result));
  } catch {
    /* storage unavailable — fine, the result just won't survive a refresh */
  }
}

export function loadResult(): AnalysisResult | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AnalysisResult>;
    return parsed && parsed.version === 1 && typeof parsed.season === "string"
      ? (parsed as AnalysisResult)
      : null;
  } catch {
    return null;
  }
}

export function clearResult(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
