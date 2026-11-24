# Hue Season — free, private AI color analysis

Find your color season (12-season system) in about 30 seconds with your phone camera or a selfie.
**All AI runs in the visitor's browser — photos are never uploaded or stored.**

Built with Next.js 16, TypeScript, Tailwind CSS 4 and MediaPipe (face landmarks + hair segmentation).

---

## 1. Run it on your computer

You need **Node.js 20 or newer** (check with `node -v`; download from <https://nodejs.org>).

```bash
npm install      # installs everything and copies the AI files into /public (one time)
npm run dev      # starts the site
```

Open <http://localhost:3000>.

> **Testing the camera on your phone:** phones only allow the camera on `https://` pages.
> With `npm run dev` running, open a second terminal and run `npx localtunnel --port 3000`,
> then open the `https://…` link it prints on your phone.

Other useful commands:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the automatic tests (color math, season matching, fairness across skin tones, share card text, page content) |
| `npm run lint` | Checks the code for common mistakes |
| `npm run typecheck` | Checks TypeScript types |
| `npm run build` then `npm start` | Runs the fast production version locally |
| `npm run setup:ai` | Re-downloads/copies the AI model files if they're missing |

## 2. Change the brand name (one file)

Open **`config/site.ts`** and edit:

- `name` — e.g. `"Hue Season"` → `"Glow Palette"`
- `tagline`, `headline`, `description`
- `domain` — shown as the watermark on share cards
- `url` — your full site address (or set `NEXT_PUBLIC_SITE_URL` on Vercel)
- `contactEmail` — **replace the placeholder before launch**
- `policyUpdated` — the date shown on the privacy policy

Everything — page titles, share cards, file names, the privacy page — reads from this file.
The logo mark is in `components/layout/Logo.tsx`; colors and fonts live in `app/globals.css`.

## 3. Tune how seasons are chosen

All the season logic lives in **`lib/seasons.ts`**, with comments explaining every number.

1. **How photos become scores** (`DIMENSIONS`): four scores from 0–100 —
   *undertone* (cool → warm), *value* (deep → light), *chroma* (soft → bright) and *contrast*.
2. **The target for each season** (`SEASON_PROFILES`): e.g. Soft Autumn = warm-ish, medium depth, very soft, low contrast.
3. **What each season cares about most** (`SEASON_EMPHASIS`, `DIMENSION_WEIGHTS`).
4. **How confident we sound** (`CONFIDENCE`).

How to tune safely:

```bash
npm test                     # every test should pass before and after your change
CALIBRATE=1 npm run calibrate   # (Mac/Linux) writes calibration.txt: scores + chosen season for 15 sample people
```

On Windows PowerShell use `$env:CALIBRATE='1'; npm run calibrate`.
The sample people (very fair → very deep skin) are in `tests/fixtures.ts` — add your own real-world
cases there. Change one number at a time and re-run.

Palettes, color names, neutrals, colors to avoid and celebrity examples are in **`content/palettes.ts`**.
The long-form guide text for each season page is in **`content/seasons/*.ts`**.

## 4. Deploy to Vercel (step by step)

1. Create a free account at <https://vercel.com> (sign in with GitHub is easiest).
2. Put this project on GitHub:
   - Create a new empty repository on <https://github.com/new>.
   - In this folder run:
     ```bash
     git add -A
     git commit -m "Initial version"
     git branch -M main
     git remote add origin https://github.com/YOUR-NAME/YOUR-REPO.git
     git push -u origin main
     ```
   - The AI model files in `public/models` (~4.5 MB) are committed on purpose, so deploys never depend on Google's servers.
3. In Vercel, click **Add New… → Project**, pick your repository, and click **Deploy**.
   Vercel detects Next.js automatically — no settings needed.
4. (Recommended) In **Project → Settings → Environment Variables**, add
   `NEXT_PUBLIC_SITE_URL` = `https://your-domain.com`, then redeploy. This makes canonical links,
   the sitemap and share links use your real domain.
5. Add your domain under **Project → Settings → Domains** and follow the DNS instructions.
6. After deploying, test on a real phone: the camera flow, sharing, and a season page.
   Submit `https://your-domain.com/sitemap.xml` in Google Search Console.

## 5. Where things are

```
app/                 pages (home, /analyze, /result, /seasons, /seasons/[slug], /privacy, /about,
                     sitemap.xml, robots.txt, share images)
components/          UI pieces (analyze flow, result & draping, share panel, marketing sections)
config/site.ts       brand name, domain, contact — change these first
content/             palettes + season page text
lib/seasons.ts       ★ season definitions & tuning knobs
lib/analysis/        sampling colors from the face, white balance, scores
lib/color/           color math (sRGB ⇄ CIELAB) and robust statistics
lib/mediapipe/       loads the AI (self-hosted, GPU with CPU fallback, cleans up memory)
lib/drape/           virtual draping geometry & drawing
lib/share/           9:16 share card, reveal video, share/download helpers
public/models/       AI model files (self-hosted)
scripts/             setup script that copies/downloads the AI files
tests/               automatic tests
```

## Privacy in one paragraph

Photos and video are processed only in the browser. The result page keeps the photo in memory
(for draping) and drops it on refresh/retake. Only the season name and a few numbers are saved in
the browser's local storage. There are no cookies, no analytics and no backend that receives images.
If you add analytics or ads later, update `app/privacy/page.tsx` first.
