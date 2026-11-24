# Final checklist report — Hue Season MVP

Date: 2026-11-24 · Next.js 16.4 · React 19 · Tailwind 4 · MediaPipe Tasks Vision 1.2.3

## ✅ What's done

| Area | Status | Notes |
| --- | --- | --- |
| Brand config in one file | ✅ | `config/site.ts` (name, tagline, domain, URL, contact, policy date) |
| Design system | ✅ | Tokens in `app/globals.css`; Fraunces + Inter via `next/font` (self-hosted) |
| Home page | ✅ | Hero, how it works, privacy section, 12-season grid, FAQ (+JSON-LD), CTA |
| Camera + upload flow | ✅ | Face-oval guide, live tips (light, framing, stillness), manual or "ready" capture |
| Self-hosted AI, lazy loaded | ✅ | Face landmarker + hair segmenter in `public/models`; WASM copied on install; only loads on /analyze & draping |
| GPU → CPU fallback | ✅ | Probes the GPU graph once, falls back automatically |
| Color algorithm | ✅ | Landmark-based skin/iris/hair sampling, outlier removal, medians, CIELAB/LCh, sclera or gray-world white balance, 4 scores, 12 seasons + runner-up + confidence |
| Tunable season file | ✅ | `lib/seasons.ts`, fully commented |
| Inclusivity | ✅ | Depth-relative undertone, depth-adjusted chroma, relative contrast; "too dark" never triggered by dark skin |
| Optional questions | ✅ | Natural vs dyed hair; gold vs silver (small nudge) |
| Result reveal | ✅ | ~4.2 s animation, skippable, skipped with reduced motion |
| Live virtual draping | ✅ | Camera or photo; best / avoid / split; swipe, tap, arrows, keyboard; smoothed tracking |
| "Try the other season" / Retake | ✅ | |
| Result saved on device | ✅ | localStorage (numbers only), wrapped in try/catch |
| 9:16 share card | ✅ | 1080×1920 PNG; palette, neutrals, avoid, celebrities, watermark; face optional (off by default) |
| Share / Download / Copy link | ✅ | Web Share with file → download fallback; long-press tip in in-app browsers |
| Reveal video (bonus) | ✅ | ~7.5 s MP4/WebM via MediaRecorder; button hidden when unsupported |
| 12 SEO season pages | ✅ | 852–1,116 words each; unique title/description; canonical; OG image; Article + Breadcrumb + FAQ JSON-LD; related links |
| /seasons, /privacy, /about | ✅ | Privacy is plain English and UK GDPR-friendly |
| sitemap.xml, robots.txt | ✅ | 17 URLs; /result excluded from indexing |
| Edge cases | ✅ | No face, multiple faces, face too small, no skin visible, too dark, glare, warm/cool light, camera denied/missing/busy, in-app browsers, old browsers, slow loading, stuck analysis (30 s time limit) |
| Memory/cleanup | ✅ | Camera tracks stopped, models closed (reference-counted), canvases freed, object URLs revoked; works with Next 16's hidden-page caching |
| README | ✅ | Run, rename, tune, deploy to Vercel |

## 🧪 What was tested

**Automated (72 tests, `npm test`)**
- Color math against reference values (sRGB ⇄ Lab, LCh, hex, luminance), robust statistics.
- Pixel sampling on synthetic faces: accurate skin/iris/hair colors, deep skin not flagged as "too dark",
  warm/cool light detection and correction, closed eyes, missing hair mask.
- Season matching: every profile maps to itself; 15 sample people from very fair to very deep skin;
  fairness checks (warm vs cool at every depth, depth doesn't bias undertone, deep skin reaches ≥4 seasons).
- Draping geometry and smoothing; share-card text fitting; file names; video format choice.
- Content: all 12 pages exist, unique titles/descriptions, length limits, ≥580 words of guide text, valid related links.

**In the browser (Chrome, phone-size 375×812 and desktop)**
- Every page renders with no sideways scrolling and no console errors.
- Full flow with a test face image: AI loading → detection → questions → reveal → result → draping
  (best/avoid/split, verified by reading canvas pixels) → share card (with and without photo) → video (7.5 s MP4).
- Error paths: no face, camera blocked (fallback to upload), refresh on the result page, Retake.

**Quality audits**
- **WCAG contrast:** all 16 text/background token pairs pass AA (lowest 5.1:1).
- **Lighthouse mobile** (production build, median of 3 runs, this laptop):

| Page | Performance | Accessibility | Best Practices | SEO |
| --- | --- | --- | --- | --- |
| Home | 81–90 | 100 | 100 | 100 |
| /seasons | 86 | 100 | 100 | 100 |
| /seasons/soft-autumn | 87 (best 93) | 100 | 100 | 100 |
| /privacy | 86 | 100 | 100 | 100 |
| /about | 85 | 100 | 100 | 100 |
| /analyze | 82 (best 93) | 100 | 100 | 100 |

Improvements made in this phase: home went from 66 → 81–90 (fonts 166 KB → 84 KB, compositor-only hero
animation, no mass link prefetching, ~170 fewer DOM elements).

**Honest note on performance:** Accessibility, Best Practices and SEO are 100 everywhere, and layout shift is 0.
Performance medians are 81–87, short of the ≥90 target. Two reasons:
1. This laptop's CPU speed swung between ~1,000 and ~2,300 on Lighthouse's benchmark during testing. Runs on
   the faster CPU scored 90–93 on the same build.
2. The remaining cost is the shared Next.js/React runtime (~158 KB of JS) that every page loads, not code specific
   to this app. Even the plain-text privacy page scores the same.

Measure the real number with PageSpeed Insights (<https://pagespeed.web.dev>) after deploying to Vercel, which
adds a CDN, compression and HTTP/2.

**Not tested (needs real devices)**
- iPhone Safari and Android Chrome *on real phones* (live camera, GPU vs CPU path, sharing to apps, video recording on iOS).
- TikTok and Instagram in-app browsers.
- The analysis on real faces across many skin tones and lighting conditions. The automated tests use realistic
  color values, but real-world calibration still needs real people.

## ⚠️ Known limitations

- **Selfie color analysis is approximate.** Lighting, phone auto white balance, makeup and filters all shift results.
  The app says so and shows a runner-up season and a confidence %.
- **Thresholds need real-world tuning.** They're set from color theory plus synthetic test cases, not a labeled dataset.
- **First visit downloads ~19 MB of AI files** (cached for 30 days). Slow connections see a progress bar and a reassurance message.
- **The drape is a flat shape.** It doesn't go behind long hair over the shoulders.
- **Share images use the default font** for the 1200×630 OG images (the in-app share card uses Fraunces/Inter).
- **The contact email is a placeholder** (`hello@hueseason.com`).
- **No music on the reveal video.**

## ➡️ Suggested next steps

1. **Deploy and test on real phones.** Use iPhone Safari, Android Chrome, and the TikTok and Instagram in-app
   browsers, then run PageSpeed Insights on the live URL.
2. **Collect calibration data with consent.** Ask 30–50 volunteers, including a wide range of skin tones, who know
   their professionally analyzed season. Record only the four scores (no photos) and tune `lib/seasons.ts`.
3. **Privacy-friendly analytics** (e.g. Plausible or Vercel Web Analytics, no cookies) to see where people drop off.
   Update the privacy page first.
4. **Monetization slots.** Add affiliate "shop your palette" links per season, and ads in the spacing between
   season-page sections.
5. **More languages** (UK spelling variant, then Spanish or Portuguese) and more SEO content (e.g. "best lipstick for Soft Autumn").
6. **Bundle Fraunces into the OG images** to make link previews match the brand.
