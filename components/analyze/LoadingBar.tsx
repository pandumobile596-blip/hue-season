"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/** After this long, reassure people on slow phones/connections. */
const SLOW_AFTER_MS = 15_000;

/** "Loading AI… 40%" progress bar, with a friendly note if it takes a while. */
export function LoadingBar({ percent, label = "Loading AI", className }: { percent: number; label?: string; className?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex justify-between text-sm font-medium">
        <span>{label}…</span>
        <span aria-hidden="true">{p}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 overflow-hidden rounded-full bg-black/10"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${p}%` }} />
      </div>
      {slow && p < 100 && (
        <p className="mt-2 text-sm text-muted" role="status">
          Still working — this can take a minute on slower connections or older phones.
        </p>
      )}
    </div>
  );
}
