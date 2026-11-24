import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/config/site";
import { Breadcrumbs } from "@/components/season/Breadcrumbs";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "About",
  description: `What ${site.name} is, how the on-device AI color analysis works, and what it can and can't tell you.`,
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <Container className="max-w-2xl pt-6 pb-8 sm:pt-10">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "About", href: "/about" },
        ]}
      />
      <h1 className="mt-8 text-5xl leading-tight font-medium">About {site.name}</h1>
      <p className="mt-4 text-xl leading-relaxed text-ink-soft">
        A free, private way to discover the colors that make you glow — no appointment, no sign-up, no upload.
      </p>

      <div className="mt-8">
        <Prose>
          <h2>How it works</h2>
          <p>
            When you start an analysis, the AI models download to your browser and run on your own device. They find your face, then
            measure color from your cheeks and forehead (avoiding shadows, shine, lips and brows), your irises and your hair.
          </p>
          <p>Those colors are converted into four simple scores:</p>
          <ul>
            <li>
              <strong>Undertone</strong> — warm or cool
            </li>
            <li>
              <strong>Depth</strong> — light or deep
            </li>
            <li>
              <strong>Clarity</strong> — soft or bright
            </li>
            <li>
              <strong>Contrast</strong> — how different your skin, hair and eyes are
            </li>
          </ul>
          <p>
            The scores are matched to the closest of the <Link href="/seasons">12 color seasons</Link>, along with your second-closest
            season, so you can compare both with live virtual draping.
          </p>

          <h2>Made for every skin tone</h2>
          <p>
            Many color tools quietly assume light skin. We don&apos;t. Our analysis judges undertone relative to skin depth, adjusts
            clarity for darker tones, and measures contrast in a way that works from very fair to very deep skin. Every season includes a
            wide range of skin tones.
          </p>

          <h2>How accurate is it?</h2>
          <p>
            It&apos;s a well-informed starting point, not a final verdict. Lighting has a big effect: warm lamps, colored walls and
            phone filters can all shift the result. Daylight from a window, no filters and minimal makeup give the most reliable reading.
            If your result feels off, retake it in better light and use the draping tool to compare your top two seasons on yourself.
          </p>

          <h2>Disclaimer</h2>
          <p>
            {site.disclaimer} Celebrity examples are popular opinions, not official analyses.
          </p>

          <h2>Privacy first</h2>
          <p>
            Your photos never leave your phone. Read the details in our <Link href="/privacy">privacy policy</Link>.
          </p>

          <h2>Contact</h2>
          <p>
            Questions, ideas or a result that seems wrong? Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>
        </Prose>
      </div>

      <div className="mt-10 flex flex-col items-start gap-3">
        <ButtonLink href="/analyze" size="lg">
          Find your season free
        </ButtonLink>
        <PrivacyBadge />
      </div>
    </Container>
  );
}
