import Link from "next/link";
import { site } from "@/config/site";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";

const links = [
  { href: "/analyze", label: "Find your season" },
  { href: "/seasons", label: "The 12 seasons" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-sand">
      <Container className="grid gap-8 py-12 sm:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-sm text-sm leading-relaxed text-ink-soft">{site.tagline}</p>
          <p className="max-w-sm text-sm leading-relaxed text-muted">{site.disclaimer}</p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  prefetch={false}
                  className="inline-flex min-h-12 items-center text-[0.95rem] text-ink-soft hover:text-ink"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
      <Container className="border-t border-line/80 py-6 text-sm text-muted">
        © {site.name}. Made with care — no ads, no tracking, no uploads.
      </Container>
    </footer>
  );
}
