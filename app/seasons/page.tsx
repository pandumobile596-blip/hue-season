import type { Metadata } from "next";
import { Faq, type FaqItem } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { SeasonGrid } from "@/components/marketing/SeasonGrid";
import { Breadcrumbs } from "@/components/season/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "The 12 Color Seasons Explained (With Palettes)",
  description:
    "All 12 color seasons explained in plain English: Spring, Summer, Autumn and Winter and their sub-seasons, with palettes and a free AI test.",
  alternates: { canonical: "/seasons" },
};

const dims = [
  { name: "Undertone", text: "Is your coloring warm (golden, peachy) or cool (pink, rosy)? Springs and Autumns are warm; Summers and Winters are cool." },
  { name: "Depth", text: "How light or deep your coloring is overall — skin, hair and eyes together. Light seasons are airy; Deep seasons are rich." },
  { name: "Clarity", text: "Do you suit clear, bright colors or soft, muted ones? Bright seasons glow in saturated color; Soft seasons in gentle, dusty shades." },
  { name: "Contrast", text: "How different your hair, eyes and skin are from each other. High contrast can carry bold combinations; low contrast suits tonal looks." },
];

const faq: FaqItem[] = [
  {
    q: "What is seasonal color analysis?",
    a: "It's a way of finding the colors that harmonize with your natural coloring. Your skin undertone, hair and eyes are compared against four families — Spring, Summer, Autumn and Winter — each split into three sub-seasons.",
  },
  {
    q: "Why 12 seasons instead of 4?",
    a: "The original four-season system was too broad: many people sit between two seasons. Splitting each family into Light/True/Bright, Light/True/Soft, Soft/True/Deep and Deep/True/Bright gives a much closer match.",
  },
  {
    q: "Does skin tone decide my season?",
    a: "Not on its own. Every season includes a wide range of skin depths. Undertone, clarity and contrast between your skin, hair and eyes matter just as much — deep skin can be a Winter, an Autumn or even a Bright Spring.",
  },
];

export default function SeasonsPage() {
  return (
    <>
      <Container className="max-w-3xl pt-6 sm:pt-10">
        <Breadcrumbs
          items={[
            { name: "Home", href: "/" },
            { name: "Seasons", href: "/seasons" },
          ]}
        />
        <h1 className="mt-8 text-5xl leading-[1.05] font-medium sm:text-6xl">The 12 color seasons</h1>
        <div className="mt-5 space-y-4 text-lg leading-relaxed text-ink-soft">
          <p>
            Seasonal color analysis sorts natural coloring into four families named after the seasons. Spring and Autumn are warm; Summer
            and Winter are cool. Each family has three sub-seasons, giving twelve palettes in total.
          </p>
          <p>
            Your season isn&apos;t about what colors you like — it&apos;s about which colors make your skin look clear, your eyes bright and
            your features defined. The right colors make you look rested; the wrong ones can add shadows or make skin look sallow.
          </p>
        </div>
        <ButtonLink href="/analyze" size="lg" className="mt-8">
          Find your season free
        </ButtonLink>

        <section aria-labelledby="dims" className="mt-14">
          <h2 id="dims" className="text-3xl font-medium">
            The four things that decide your season
          </h2>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2">
            {dims.map((d) => (
              <div key={d.name} className="rounded-card bg-surface p-5 ring-1 ring-line">
                <dt className="font-serif text-xl font-medium">{d.name}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-soft">{d.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Container>

      <SeasonGrid />
      <FinalCta />
      <Faq items={faq} title="Color season questions" />
    </>
  );
}
