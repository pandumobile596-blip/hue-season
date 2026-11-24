import type { CSSProperties } from "react";
import { seasonPalettes } from "@/content/palettes";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { stripes } from "@/lib/gradient";

// One card per family for the hero "palette fan".
const fanSlugs = ["light-summer", "true-spring", "soft-autumn", "deep-winter"] as const;
const fan = fanSlugs.flatMap((slug) => seasonPalettes.filter((s) => s.slug === slug));
const tilt = ["-10deg", "-3.5deg", "3.5deg", "10deg"];

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#f4e3de,transparent)] opacity-80"
      />
      <Container className="relative grid items-center gap-10 pt-10 pb-12 sm:pt-16 md:grid-cols-[1.1fr_1fr] md:pb-24">
        {/* No entrance animation here: it would delay the Largest Contentful Paint. */}
        <div className="text-center md:text-left">
          <p className="mb-5 inline-flex rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium text-accent-ink ring-1 ring-line">
            Free AI color analysis · 12 seasons
          </p>
          <h1 id="hero-title" className="text-[2.6rem] leading-[1.05] font-medium sm:text-6xl">
            Find your color season <span className="text-accent-ink italic">in 30 seconds.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-ink-soft md:mx-0">
            Free. No sign-up. Your photo never leaves your phone — the AI runs right in your browser.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 md:items-start">
            <ButtonLink href="/analyze" size="lg" className="w-full max-w-xs">
              Start my free analysis
            </ButtonLink>
            <PrivacyBadge />
          </div>
        </div>

        <div aria-hidden="true" className="relative mx-auto h-72 w-full max-w-sm sm:h-80">
          {fan.map((s, i) => (
            // Outer: static tilt. Inner: translate-only float (runs on the GPU compositor, no main-thread work).
            <div
              key={s.slug}
              className="absolute bottom-0 w-[38%]"
              style={{ left: `${4 + i * 19.5}%`, transform: `rotate(${tilt[i]})`, transformOrigin: "bottom center", zIndex: i }}
            >
              <div
                className="animate-float rounded-card bg-surface p-2.5 shadow-lift ring-1 ring-line will-change-transform"
                style={{ animationDelay: `${i * 0.7}s` } as CSSProperties}
              >
                <div
                  className="h-44 rounded-soft sm:h-52"
                  style={{ backgroundImage: stripes(s.palette.slice(0, 6).map((c) => c.hex), "to bottom") }}
                />
                <p className="mt-2 truncate px-1 font-serif text-[0.9rem]">{s.name}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
