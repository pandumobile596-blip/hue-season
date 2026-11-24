/**
 * Brand & site settings — change the name, tagline, or domain HERE ONLY.
 * Every page, meta tag, share card, and watermark reads from this file.
 */
export const site = {
  /** Brand name shown in the header, titles, and share cards. */
  name: "Hue Season",
  /** Main tagline (hero, meta descriptions). */
  tagline: "Find your color season in 30 seconds. Free. Your photo never leaves your phone.",
  /** Short headline version of the tagline. */
  headline: "Find your color season in 30 seconds.",
  /** Default meta description. */
  description:
    "Free AI color analysis that runs on your phone. Find your 12-season palette, try colors on live and share your result. No sign-up, no uploads.",
  /** Bare domain, used for the watermark on share cards. */
  domain: "hueseason.com",
  /**
   * Full site URL (no trailing slash). Used for canonical URLs, sitemap, and OG tags.
   * On Vercel you can override it with the NEXT_PUBLIC_SITE_URL environment variable.
   */
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://hueseason.com").replace(/\/$/, ""),
  /** Privacy line shown next to every camera/upload action. */
  privacyBadge: "100% on-device — your photo never leaves your phone",
  /** Contact address shown on the privacy & about pages. Replace with a real inbox before launch. */
  contactEmail: "hello@hueseason.com",
  /** "Last updated" date on the privacy policy. Update it whenever the policy changes. */
  policyUpdated: "November 24, 2026",
  /** Short disclaimer shown in the footer and on results. */
  disclaimer:
    "For fun and inspiration. Lighting affects results — this is not a substitute for a professional color analyst.",
} as const;

export type SiteConfig = typeof site;
