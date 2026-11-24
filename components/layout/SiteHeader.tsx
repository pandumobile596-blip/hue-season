import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { site } from "@/config/site";
import { Logo } from "./Logo";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-cream/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label={`${site.name} home`} className="rounded-soft">
          <Logo />
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/seasons"
            className="hidden min-h-12 items-center rounded-full px-4 text-[0.95rem] text-ink-soft hover:text-ink sm:inline-flex"
          >
            The 12 seasons
          </Link>
          <ButtonLink href="/analyze" className="min-h-11 px-4 text-sm sm:min-h-12 sm:px-5">
            Find my season
          </ButtonLink>
        </nav>
      </Container>
    </header>
  );
}
