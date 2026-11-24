"use client";

import { useEffect, useRef, useState } from "react";
import type { SeasonPalette } from "@/content/palettes";
import { cn } from "@/lib/cn";

/** Timeline (ms). Total ≈ 4.2s — inside the 3–5s brief. */
const T = { name: 1300, swatches: 2100, exit: 3800, done: 4250 };

/**
 * Full-screen "Your season is… SOFT AUTUMN" reveal.
 * Skippable; skipped entirely for people who prefer reduced motion.
 */
export function Reveal({ season, onDone }: { season: SeasonPalette; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  const done = useRef(onDone);
  const skipRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    done.current = onDone;
  });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      done.current();
      return;
    }
    skipRef.current?.focus({ preventScroll: true });
    const a = window.setTimeout(() => setExiting(true), T.exit);
    const b = window.setTimeout(() => done.current(), T.done);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Your season is ${season.name}`}
      className={cn(
        "fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-cream px-6 text-center",
        exiting && "animate-fade-out",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background: `radial-gradient(60% 45% at 50% 45%, ${season.palette[1].hex}33, transparent 70%)`,
        }}
      />
      <p className="relative animate-fade-up font-serif text-2xl text-ink-soft italic sm:text-3xl">Your season is…</p>
      <h1
        className="relative mt-4 animate-name-in font-serif text-5xl font-medium text-ink uppercase sm:text-7xl"
        style={{ animationDelay: `${T.name}ms` }}
      >
        {season.name}
      </h1>
      <div className="relative mt-10 flex max-w-xs flex-wrap justify-center gap-2.5" aria-hidden="true">
        {season.palette.map((c, i) => (
          <span
            key={c.hex + c.name}
            className="size-9 animate-pop-in rounded-full shadow-soft ring-2 ring-white sm:size-11"
            style={{ backgroundColor: c.hex, animationDelay: `${T.swatches + i * 70}ms` }}
          />
        ))}
      </div>
      <button
        ref={skipRef}
        type="button"
        onClick={() => done.current()}
        className="absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] min-h-12 rounded-full px-5 text-ink-soft hover:text-ink"
      >
        Skip
      </button>
    </div>
  );
}
