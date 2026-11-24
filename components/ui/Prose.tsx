import type { ReactNode } from "react";

/** Readable long-form text styling for legal/info pages. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 text-[1.05rem] leading-relaxed text-ink-soft [&_a]:font-medium [&_a]:text-accent-ink [&_a]:underline [&_a]:underline-offset-4 [&_h2]:pt-6 [&_h2]:text-2xl [&_h2]:font-medium [&_h2]:text-ink [&_li]:pl-1 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
      {children}
    </div>
  );
}
