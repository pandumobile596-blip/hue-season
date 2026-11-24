import Link from "next/link";
import type { NamedColor, SeasonPalette } from "@/content/palettes";
import { Swatch } from "@/components/ui/Swatch";

function Group({ title, colors, cols = "grid-cols-4" }: { title: string; colors: NamedColor[]; cols?: string }) {
  return (
    <div>
      <h3 className="font-sans text-sm font-semibold tracking-[0.12em] text-muted uppercase">{title}</h3>
      <div className={`mt-3 grid ${cols} gap-x-2 gap-y-4`}>
        {colors.map((c) => (
          <Swatch key={c.hex + c.name} color={c} />
        ))}
      </div>
    </div>
  );
}

export function PaletteSection({ season }: { season: SeasonPalette }) {
  return (
    <section aria-labelledby="palette-h" className="rounded-card bg-surface p-5 shadow-soft ring-1 ring-line sm:p-6">
      <h2 id="palette-h" className="text-2xl font-medium">
        The {season.name} palette
      </h2>
      <div className="mt-5 space-y-7">
        <Group title="Your signature colors" colors={season.palette} />
        <Group title="Best neutrals" colors={season.neutrals} />
        <Group title="Colors to avoid" colors={season.avoid} />
      </div>
      <div className="mt-7 rounded-soft bg-sand p-4">
        <h3 className="font-sans text-sm font-semibold tracking-[0.12em] text-muted uppercase">Often associated with</h3>
        <p className="mt-1.5 text-ink-soft">{season.celebrities.join(" · ")}</p>
      </div>
      <Link
        href={`/seasons/${season.slug}`}
        className="mt-5 inline-flex min-h-12 items-center font-medium text-accent-ink underline underline-offset-4"
      >
        Read the full {season.name} guide — makeup, hair &amp; jewelry
      </Link>
    </section>
  );
}
