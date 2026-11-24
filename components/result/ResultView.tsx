"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { site } from "@/config/site";
import { getSeasonPalette } from "@/content/palettes";
import { Button, ButtonLink } from "@/components/ui/Button";
import { clearPhoto } from "@/lib/photoStore";
import { setRevealPending, useRevealPending, useSavedResult } from "@/lib/useStored";
import { DrapeStudio } from "./DrapeStudio";
import { PaletteSection } from "./PaletteSection";
import { Reveal } from "./Reveal";
import { SharePanel } from "./SharePanel";
import { WhySection } from "./WhySection";

export function ResultView() {
  const router = useRouter();
  const result = useSavedResult();
  const revealPending = useRevealPending();
  const [revealDone, setRevealDone] = useState(false);
  const [viewSecond, setViewSecond] = useState(false);

  // Next.js keeps this page mounted but hidden after navigating away; reset so a
  // new analysis replays the reveal and starts on the main season.
  useLayoutEffect(
    () => () => {
      setRevealDone(false);
      setViewSecond(false);
    },
    [],
  );

  if (result === undefined) {
    // First paint (before we can read this device's storage): a calm skeleton.
    return (
      <div className="animate-pulse space-y-4" aria-hidden="true">
        <div className="mx-auto h-5 w-32 rounded-full bg-sand" />
        <div className="mx-auto h-12 w-64 rounded-full bg-sand" />
        <div className="h-96 rounded-card bg-sand" />
      </div>
    );
  }

  if (result === null) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-4xl font-medium">No result yet</h1>
        <p className="mt-3 text-lg text-ink-soft">Find your season in about 30 seconds — it&apos;s free.</p>
        <ButtonLink href="/analyze" size="lg" className="mt-8 w-full max-w-xs">
          Find my season
        </ButtonLink>
      </div>
    );
  }

  const top = getSeasonPalette(result.season);
  const second = getSeasonPalette(result.second);
  if (!top || !second) return null;
  const season = viewSecond ? second : top;

  const finishReveal = () => {
    setRevealPending(false);
    setRevealDone(true);
  };

  const retake = () => {
    clearPhoto();
    router.push("/analyze");
  };

  return (
    <>
      {revealPending && !revealDone && <Reveal season={top} onDone={finishReveal} />}

      <header className="text-center">
        <p className="text-sm font-semibold tracking-[0.14em] text-accent-ink uppercase">
          {viewSecond ? "Previewing your close second" : "Your season is"}
        </p>
        <h1 className="mt-2 text-5xl leading-tight font-medium sm:text-6xl">{season.name}</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">{season.summary}</p>
        {!viewSecond && (
          <p className="mt-4 inline-flex flex-wrap justify-center gap-x-1 rounded-full bg-surface px-4 py-2 text-sm ring-1 ring-line">
            <span>{result.confidence}% match ·</span>
            <span>
              close second: <strong className="font-semibold">{second.name}</strong>
            </span>
          </p>
        )}
        <div className="mt-5 flex justify-center">
          <Button variant="secondary" onClick={() => setViewSecond((v) => !v)} aria-pressed={viewSecond}>
            {viewSecond ? `Back to ${top.name}` : `Try ${second.name} instead`}
          </Button>
        </div>
      </header>

      <div className="mt-8 space-y-5">
        {/* Keyed by result: a new analysis gets a fresh studio with the new photo. */}
        <DrapeStudio key={result.createdAt} season={season} />
        {/* Always shares the main result, even while previewing the close second. */}
        <SharePanel key={`share-${result.createdAt}`} season={top} />
        <PaletteSection season={season} />
        <WhySection result={result} seasonName={top.name} />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <Button size="lg" variant="secondary" className="w-full max-w-xs" onClick={retake}>
          Retake
        </Button>
        <p className="mt-3 max-w-sm text-center text-sm text-muted">{site.disclaimer}</p>
      </div>
    </>
  );
}
