import Link from "next/link";
import { familyLabels, seasonPalettes, type SeasonFamily } from "@/content/palettes";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { stripes } from "@/lib/gradient";

const families: SeasonFamily[] = ["spring", "summer", "autumn", "winter"];

/** Grid of all 12 seasons, grouped by family. Reused on the home and /seasons pages. */
export function SeasonGrid() {
  return (
    <section aria-labelledby="seasons-title" className="py-16 sm:py-20">
      <Container>
        <SectionHeading
          id="seasons-title"
          eyebrow="The 12 seasons"
          title="Which palette is yours?"
          intro="Every season has colors that make skin glow and eyes pop. Tap one to explore."
        />
        <div className="mt-12 space-y-12">
          {families.map((family) => (
            <div key={family}>
              <h3 className="mb-4 flex items-baseline gap-3 text-2xl font-medium">
                {familyLabels[family].name}
                <span className="font-sans text-sm font-normal text-muted">{familyLabels[family].blurb}</span>
              </h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                {seasonPalettes
                  .filter((s) => s.family === family)
                  .map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/seasons/${s.slug}`}
                        // 12 cards on screen: prefetching them all costs mobile CPU at load. Pages are small & static.
                        prefetch={false}
                        className="group block h-full rounded-card bg-surface p-3 shadow-soft ring-1 ring-line transition-shadow duration-300 hover:shadow-lift"
                      >
                        <div aria-hidden="true" className="flex h-16 flex-col overflow-hidden rounded-soft sm:h-24">
                          <span className="flex-1" style={{ backgroundImage: stripes(s.palette.slice(0, 6).map((c) => c.hex)) }} />
                          <span className="flex-1" style={{ backgroundImage: stripes(s.palette.slice(6, 12).map((c) => c.hex)) }} />
                        </div>
                        <div className="px-1 pt-3 pb-1 sm:px-2">
                          <p className="font-serif text-base font-medium sm:text-lg">{s.name}</p>
                          <p className="mt-0.5 hidden text-sm leading-snug text-ink-soft sm:block">{s.summary}</p>
                          <p className="mt-2 text-xs text-muted">
                            {s.palette
                              .slice(0, 4)
                              .map((col) => col.name)
                              .join(" · ")}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
