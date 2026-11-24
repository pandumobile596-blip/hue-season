/** Canvas text helpers (pure apart from the measure function, so they're testable). */

export type Measure = (text: string, fontSize: number) => number;

/** Largest font size ≤ max (and ≥ min) at which `text` fits in `maxWidth`. */
export function fitFontSize(text: string, maxWidth: number, max: number, min: number, measure: Measure): number {
  let size = max;
  while (size > min && measure(text, size) > maxWidth) size -= 2;
  return size;
}

/** Greedy word wrap. Returns at most `maxLines` lines; the last one gets "…" if text was cut. */
export function wrapText(text: string, maxWidth: number, fontSize: number, measure: Measure, maxLines = 2): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < words.length; i++) {
    const candidate = line ? `${line} ${words[i]}` : words[i];
    if (measure(candidate, fontSize) <= maxWidth || !line) {
      line = candidate;
      continue;
    }
    lines.push(line);
    line = words[i];
    if (lines.length === maxLines) {
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = `${last.replace(/[.,;:!?]?$/, "")}…`;
      return lines;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

/** Public link for a season — what "Copy link" and the share sheet send. */
export function seasonShareUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}/seasons/${slug}?ref=share`;
}

/** Friendly file name, e.g. "hue-season-soft-autumn.png". */
export function shareFileName(brand: string, slug: string, ext: string): string {
  const b = brand
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${b}-${slug}.${ext}`;
}
