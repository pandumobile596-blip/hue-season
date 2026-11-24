import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

const steps = [
  {
    title: "Snap or upload",
    body: "Use your front camera or pick a selfie. Natural daylight from a window works best.",
    icon: "M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8ZM12 16a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  },
  {
    title: "AI reads your coloring",
    body: "It looks at your skin undertone, eyes and hair — on your device — and scores four color dimensions.",
    icon: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Zm6 12 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z",
  },
  {
    title: "See your season",
    body: "Get your season and palette, try colors on live with virtual draping, and share it in one tap.",
    icon: "M12 21a9 9 0 1 1 0-18c4.97 0 9 3.58 9 8 0 2.5-2 4-4 4h-2a2 2 0 0 0-1.5 3.3A1.6 1.6 0 0 1 12 21ZM7.5 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm4-4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm5 4a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="py-16 sm:py-20">
      <Container>
        <SectionHeading id="how-title" eyebrow="How it works" title="Three steps. About thirty seconds." />
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="rounded-card bg-surface p-6 shadow-soft ring-1 ring-line sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent-ink">
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
                    <path d={s.icon} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-muted">Step {i + 1}</span>
              </div>
              <h3 className="mt-5 text-xl font-medium">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
