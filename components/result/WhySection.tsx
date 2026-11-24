import type { AnalysisResult } from "@/lib/analysis/analyze";
import type { LightingIssue } from "@/lib/analysis/sample";
import type { Dimension } from "@/lib/seasons";

const DIM_LABELS: Record<Dimension, [string, string, string]> = {
  undertone: ["Undertone", "Cool", "Warm"],
  value: ["Depth", "Deep", "Light"],
  chroma: ["Clarity", "Soft", "Bright"],
  contrast: ["Contrast", "Low", "High"],
};

export const ISSUE_COPY: Record<LightingIssue, string> = {
  "too-dark": "The photo was quite dark, so colors may read deeper than they are.",
  "too-bright": "Strong light washed out part of your face — results may read lighter.",
  "warm-cast": "Your lighting looked warm (yellowish). We corrected for it, but daylight gives a truer result.",
  "cool-cast": "Your lighting looked cool (bluish). We corrected for it, but daylight gives a truer result.",
};

/** "Why this season?" — what we measured and the four scores. */
export function WhySection({ result, seasonName }: { result: AnalysisResult; seasonName: string }) {
  const measured = [
    { label: "Your skin", hex: result.swatches.skin },
    result.swatches.eyes ? { label: "Your eyes", hex: result.swatches.eyes } : null,
    result.swatches.hair && result.answers.naturalHair !== false ? { label: "Your hair", hex: result.swatches.hair } : null,
  ].filter((x): x is { label: string; hex: string } => x !== null);

  return (
    <section aria-labelledby="why-h" className="rounded-card bg-surface p-5 shadow-soft ring-1 ring-line sm:p-6">
      <h2 id="why-h" className="text-2xl font-medium">
        Why {seasonName}?
      </h2>
      <p className="mt-1 text-ink-soft">What the AI measured on your device:</p>
      <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
        {measured.map((m) => (
          <li key={m.label} className="flex items-center gap-2">
            <span aria-hidden="true" className="size-9 rounded-full ring-1 ring-black/10" style={{ backgroundColor: m.hex }} />
            <span className="text-sm text-ink-soft">{m.label}</span>
          </li>
        ))}
      </ul>
      <dl className="mt-6 space-y-5">
        {(Object.keys(DIM_LABELS) as Dimension[]).map((d) => {
          const [label, lo, hi] = DIM_LABELS[d];
          const v = result.dimensions[d];
          return (
            <div key={d}>
              <dt className="flex justify-between text-sm">
                <span className="font-medium">{label}</span>
                <span className="text-muted">
                  {lo} ↔ {hi}
                </span>
              </dt>
              <dd className="mt-2">
                <div
                  className="relative h-2 rounded-full bg-sand"
                  role="img"
                  aria-label={`${label}: ${v} out of 100, where 0 is ${lo} and 100 is ${hi}`}
                >
                  <span
                    className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent ring-2 ring-surface"
                    style={{ left: `${v}%` }}
                  />
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
      {result.issues.length > 0 && (
        <ul className="mt-6 space-y-2 rounded-soft bg-warning-soft p-4 text-[0.95rem] text-warning">
          {result.issues.map((i) => (
            <li key={i}>💡 {ISSUE_COPY[i]}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
