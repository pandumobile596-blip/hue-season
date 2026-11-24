import { site } from "@/config/site";

/** Four-quadrant mark — one quadrant per season family. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path d="M16 16V2a14 14 0 0 1 14 14Z" fill="#F4A98C" />
      <path d="M16 16h14a14 14 0 0 1-14 14Z" fill="#B9735A" />
      <path d="M16 16v14A14 14 0 0 1 2 16Z" fill="#6D1530" />
      <path d="M16 16H2A14 14 0 0 1 16 2Z" fill="#A9C9E8" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark className="size-7" />
      <span className="font-serif text-xl font-medium tracking-tight">{site.name}</span>
    </span>
  );
}
