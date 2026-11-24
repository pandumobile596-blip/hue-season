import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { site } from "@/config/site";
import { familyLabels, getSeasonPalette, seasonPalettes, type NamedColor } from "@/content/palettes";
import { getSeasonContent } from "@/content/seasons";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Breadcrumbs } from "@/components/season/Breadcrumbs";
import { JsonLd } from "@/components/season/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { Swatch } from "@/components/ui/Swatch";
import { stripes } from "@/lib/gradient";

// All 12 real seasons are prerendered below, so navigating to them is instant in production.
// Only unknown slugs (which 404) render on demand — allow that to block.
export const instant = false;

export function generateStaticParams() {
  return seasonPalettes.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/seasons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const content = getSeasonContent(slug);
  const palette = getSeasonPalette(slug);
  if (!content || !palette) return {};
  const url = `/seasons/${slug}`;
  return {
    title: { absolute: content.seoTitle },
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${palette.name} — ${palette.summary}`,
      description: content.metaDescription,
      siteName: site.name,
    },
    twitter: { card: "summary_large_image", title: content.seoTitle, description: content.metaDescription },
  };
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="py-8">
      <h2 id={id} className="text-2xl leading-tight font-medium sm:text-3xl">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SwatchRow({ colors, cols }: { colors: NamedColor[]; cols: string }) {
  return (
    <div className={`grid ${cols} gap-x-2 gap-y-5`}>
      {colors.map((c) => (
        <Swatch key={c.hex + c.name} color={c} size="lg" />
      ))}
    </div>
  );
}

export default async function SeasonPage({ params }: PageProps<"/seasons/[slug]">) {
  const { slug } = await params;
  const content = getSeasonContent(slug);
  const palette = getSeasonPalette(slug);
  if (!content || !palette) notFound();

  const family = familyLabels[palette.family];
  const related = content.related.map((r) => getSeasonPalette(r)).filter((r) => r !== undefined);
  const traitRows: Array<[string, string]> = [
    ["Undertone", content.traits.undertone],
    ["Depth", content.traits.depth],
    ["Clarity", content.traits.clarity],
    ["Contrast", content.traits.contrast],
  ];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: content.seoTitle,
          description: content.metaDescription,
          mainEntityOfPage: `${site.url}/seasons/${slug}`,
          publisher: { "@type": "Organization", name: site.name, url: site.url },
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[760px] -translate-x-1/2 rounded-full opacity-50"
          style={{ background: `radial-gradient(closest-side, ${palette.palette[1].hex}55, transparent)` }}
        />
        <Container className="relative max-w-3xl pt-6 pb-10 sm:pt-10">
          <Breadcrumbs
            items={[
              { name: "Home", href: "/" },
              { name: "Seasons", href: "/seasons" },
              { name: palette.name, href: `/seasons/${slug}` },
            ]}
          />
          <p className="mt-8 text-sm font-semibold tracking-[0.14em] text-accent-ink uppercase">
            {family.name} family · {family.blurb}
          </p>
          <h1 className="mt-2 text-5xl leading-[1.05] font-medium sm:text-6xl">{palette.name}</h1>
          <p className="mt-4 max-w-xl text-xl leading-relaxed text-ink-soft">{palette.summary}</p>
          <div
            aria-hidden="true"
            className="mt-8 h-24 rounded-card shadow-lift ring-1 ring-line sm:h-32"
            style={{ backgroundImage: stripes(palette.palette.map((c) => c.hex)) }}
          />
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/analyze" size="lg">
              Find your season free
            </ButtonLink>
            <PrivacyBadge />
          </div>
        </Container>
      </section>

      <Container className="max-w-3xl">
        <article>
          <div className="space-y-4 text-lg leading-relaxed text-ink-soft">
            {content.intro.map((p) => (
              <p key={p.slice(0, 24)}>{p}</p>
            ))}
          </div>

          <Section id="traits" title={`${palette.name} at a glance`}>
            <dl className="grid gap-3 sm:grid-cols-2">
              {traitRows.map(([label, text]) => (
                <div key={label} className="rounded-card bg-surface p-5 ring-1 ring-line">
                  <dt className="text-sm font-semibold tracking-[0.12em] text-accent-ink uppercase">{label}</dt>
                  <dd className="mt-1.5 leading-relaxed text-ink-soft">{text}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="recognize" title={`You might be a ${palette.name} if…`}>
            <ul className="space-y-3">
              {content.recognize.map((r) => (
                <li key={r} className="flex gap-3 leading-relaxed text-ink-soft">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="best-colors" title="Best colors">
            <SwatchRow colors={palette.palette} cols="grid-cols-3 sm:grid-cols-6" />
            <p className="mt-6 leading-relaxed text-ink-soft">{content.bestColors}</p>
          </Section>

          <Section id="neutrals" title="Best neutrals">
            <SwatchRow colors={palette.neutrals} cols="grid-cols-4" />
            <p className="mt-6 leading-relaxed text-ink-soft">{content.neutrals}</p>
          </Section>

          <Section id="avoid" title="Colors to avoid">
            <SwatchRow colors={palette.avoid} cols="grid-cols-4" />
            <p className="mt-6 leading-relaxed text-ink-soft">{content.avoid}</p>
          </Section>

          <Section id="wardrobe" title="Build your wardrobe">
            <p className="leading-relaxed text-ink-soft">{content.wardrobe}</p>
          </Section>

          <Section id="makeup" title="Makeup tips">
            <dl className="space-y-4">
              {content.makeup.map((m) => (
                <div key={m.label}>
                  <dt className="font-semibold">{m.label}</dt>
                  <dd className="mt-1 leading-relaxed text-ink-soft">{m.text}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section id="hair" title="Hair color ideas">
            <ul className="space-y-3">
              {content.hair.map((h) => (
                <li key={h} className="flex gap-3 leading-relaxed text-ink-soft">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
                  {h}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="jewelry" title="Jewelry: gold or silver?">
            <p className="inline-flex rounded-full bg-surface px-4 py-2 font-medium ring-1 ring-line">Best metals: {content.jewelry.metals}</p>
            <p className="mt-4 leading-relaxed text-ink-soft">{content.jewelry.text}</p>
          </Section>

          <Section id="celebrities" title={`Celebrities often associated with ${palette.name}`}>
            <p className="font-serif text-xl">{palette.celebrities.join(" · ")}</p>
            <p className="mt-2 text-sm text-muted">
              Celebrity seasons are popular opinions, not official analyses — lighting, makeup and hair color change how anyone looks
              on camera.
            </p>
          </Section>
        </article>
      </Container>

      <FinalCta title={`Are you a ${palette.name}?`} />

      <Container className="max-w-3xl pt-12">
        <section aria-labelledby="related">
          <h2 id="related" className="text-2xl font-medium sm:text-3xl">
            Compare with nearby seasons
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/seasons/${r.slug}`}
                  className="block h-full rounded-card bg-surface p-3 shadow-soft ring-1 ring-line transition-shadow hover:shadow-lift"
                >
                  <div
                    aria-hidden="true"
                    className="h-14 rounded-soft"
                    style={{ backgroundImage: stripes(r.palette.slice(0, 6).map((c) => c.hex)) }}
                  />
                  <p className="mt-3 px-1 font-serif text-lg font-medium">{r.name}</p>
                  <p className="px-1 pb-1 text-sm text-ink-soft">{r.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/seasons" className="mt-5 inline-flex min-h-12 items-center font-medium text-accent-ink underline underline-offset-4">
            See all 12 seasons
          </Link>
        </section>
      </Container>

      <Faq items={content.faq} title={`${palette.name} FAQ`} />
    </>
  );
}
