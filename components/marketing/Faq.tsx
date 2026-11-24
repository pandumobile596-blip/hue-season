import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

export interface FaqItem {
  q: string;
  a: string;
}

/** Accessible FAQ using native <details>, plus FAQPage JSON-LD for search engines. */
export function Faq({ items, title = "Questions, answered" }: { items: FaqItem[]; title?: string }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
  return (
    <section aria-labelledby="faq-title" className="py-16 sm:py-20">
      <Container className="max-w-3xl">
        <SectionHeading id="faq-title" eyebrow="FAQ" title={title} />
        <div className="mt-10 divide-y divide-line rounded-card bg-surface shadow-soft ring-1 ring-line">
          {items.map((item) => (
            <details key={item.q} className="group px-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-medium">
                {item.q}
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-lg text-accent-ink transition-transform duration-300 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-6 leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </section>
  );
}
