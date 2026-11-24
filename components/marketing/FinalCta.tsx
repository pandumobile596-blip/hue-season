import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";

export function FinalCta({ title = "Ready to meet your colors?" }: { title?: string }) {
  return (
    <section aria-labelledby="cta-title" className="py-8">
      <Container>
        <div className="rounded-card bg-accent-soft px-6 py-12 text-center sm:px-10">
          <h2 id="cta-title" className="text-3xl font-medium sm:text-4xl">
            {title}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">It&apos;s free and takes about 30 seconds.</p>
          <div className="mt-7 flex flex-col items-center gap-4">
            <ButtonLink href="/analyze" size="lg" className="w-full max-w-xs">
              Find your season free
            </ButtonLink>
            <PrivacyBadge />
          </div>
        </div>
      </Container>
    </section>
  );
}
