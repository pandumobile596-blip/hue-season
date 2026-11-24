import type { Metadata } from "next";
import { site } from "@/config/site";
import { Breadcrumbs } from "@/components/season/Breadcrumbs";
import { Container } from "@/components/ui/Container";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { Prose } from "@/components/ui/Prose";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} protects your privacy: your photos are analyzed on your device and never uploaded, stored or shared.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-2xl pt-6 pb-8 sm:pt-10">
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Privacy", href: "/privacy" },
        ]}
      />
      <h1 className="mt-8 text-5xl leading-tight font-medium">Privacy policy</h1>
      <p className="mt-2 text-sm text-muted">Last updated: {site.policyUpdated}</p>
      <PrivacyBadge className="mt-5" />

      <div className="mt-8">
        <Prose>
          <p>
            <strong>The short version:</strong> your photos and camera video are analyzed entirely inside your browser, on your own device.
            They are never uploaded to us or anyone else, never stored on a server, and never seen by a person. We don&apos;t use
            accounts, advertising cookies or tracking analytics.
          </p>

          <h2>Who we are</h2>
          <p>
            {site.name} ({site.domain}) is a free color analysis website. For any privacy question, email{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>

          <h2>Your photos and camera</h2>
          <ul>
            <li>When you use the camera or upload a selfie, the image is processed by AI models that run in your browser.</li>
            <li>The image never leaves your device. There is no upload, and our servers have no way of receiving it.</li>
            <li>
              The photo is kept in your browser&apos;s memory only while you use the result page (for example, for live draping), and is
              discarded when you refresh, retake or close the tab.
            </li>
            <li>The camera is switched off as soon as you leave the camera or draping screen.</li>
            <li>
              Share cards and videos are created on your device. They only go somewhere if <em>you</em> choose to share or download them.
              Including your photo on a share card is off by default.
            </li>
          </ul>

          <h2>What is saved on your device</h2>
          <p>
            To keep your result after a refresh, your browser&apos;s local storage holds your season name and a few numbers (the four color
            scores and color codes for the measured skin, eye and hair tones). It never contains an image. You can delete it any time by
            clearing this site&apos;s data in your browser settings.
          </p>

          <h2>What we don&apos;t collect</h2>
          <ul>
            <li>No accounts, names, emails or phone numbers.</li>
            <li>No advertising or tracking cookies, and no third-party analytics.</li>
            <li>No selling or sharing of personal data — we don&apos;t have any to share.</li>
          </ul>

          <h2>Hosting and technical logs</h2>
          <p>
            Like every website, our hosting provider automatically processes basic technical information (such as IP address, browser type
            and the pages requested) to deliver the site and protect it from abuse. These logs are kept for a short time and never include
            your photos. Fonts and AI model files are served from our own domain, so loading them doesn&apos;t contact third parties.
          </p>

          <h2>Your rights (UK GDPR and EU GDPR)</h2>
          <p>
            You have the right to access, correct or delete personal data about you, and to object to processing. Because we don&apos;t
            collect personal data beyond the short-lived technical logs above, there is usually nothing for us to return or delete — but
            you&apos;re always welcome to contact us. You can also complain to the UK Information Commissioner&apos;s Office (ico.org.uk)
            or your local data protection authority.
          </p>

          <h2>Children</h2>
          <p>{site.name} is designed for a general audience and is not directed at children under 13.</p>

          <h2>Changes</h2>
          <p>
            If we ever change how data is handled — for example, by adding privacy-friendly analytics or ads — we&apos;ll update this page
            and the date above first. Your photos will always be processed on your device.
          </p>
        </Prose>
      </div>
    </Container>
  );
}
