import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LockIcon } from "@/components/ui/PrivacyBadge";

const points = [
  "The AI runs inside your browser — nothing is sent to a server.",
  "Photos and video are never uploaded, saved, or seen by anyone.",
  "No account, no email, no tracking cookies.",
];

export function PrivacyHighlight() {
  return (
    <section aria-labelledby="privacy-title" className="py-8">
      <Container>
        <div className="grid gap-8 rounded-card bg-surface p-7 shadow-soft ring-1 ring-line sm:p-10 md:grid-cols-[auto_1fr] md:items-center">
          <span className="grid size-16 place-items-center rounded-full bg-success-soft text-success">
            <LockIcon className="size-8" />
          </span>
          <div>
            <h2 id="privacy-title" className="text-2xl font-medium sm:text-3xl">
              Your photo never leaves your phone.
            </h2>
            <ul className="mt-5 space-y-3">
              {points.map((p) => (
                <li key={p} className="flex gap-3 leading-relaxed text-ink-soft">
                  <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-success" />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href="/privacy"
              className="mt-4 inline-flex min-h-12 items-center font-medium text-accent-ink underline underline-offset-4"
            >
              Read our plain-English privacy policy
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
