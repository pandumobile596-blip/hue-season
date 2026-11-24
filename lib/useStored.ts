"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { AnalysisResult } from "@/lib/analysis/analyze";
import { RESULT_KEY, loadResult } from "@/lib/storage";

const noSubscribe = () => () => {};

function readStorage(kind: "local" | "session", key: string): string | null {
  try {
    return (kind === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
}

/**
 * The saved result, read without hydration mismatches.
 * Returns `undefined` during server render / first paint, `null` when nothing is saved.
 */
export function useSavedResult(): AnalysisResult | null | undefined {
  const raw = useSyncExternalStore(
    noSubscribe,
    () => readStorage("local", RESULT_KEY) ?? "",
    () => undefined,
  );
  return useMemo(() => (raw === undefined ? undefined : raw ? loadResult() : null), [raw]);
}

export const REVEAL_KEY = "hue-season:reveal";

/** True when we just finished an analysis and should play the reveal animation. */
export function useRevealPending(): boolean {
  return useSyncExternalStore(
    noSubscribe,
    () => readStorage("session", REVEAL_KEY) === "1",
    () => false,
  );
}

export function setRevealPending(on: boolean): void {
  try {
    if (on) window.sessionStorage.setItem(REVEAL_KEY, "1");
    else window.sessionStorage.removeItem(REVEAL_KEY);
  } catch {
    /* ignore */
  }
}
