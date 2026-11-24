import { site } from "@/config/site";
import { cn } from "@/lib/cn";

/** "🔒 100% on-device" reassurance — shown next to every camera/upload action. */
export function PrivacyBadge({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full bg-success-soft px-3.5 py-1.5 text-sm font-medium text-success",
        className,
      )}
    >
      <LockIcon className="size-4 shrink-0" />
      <span>{site.privacyBadge}</span>
    </p>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <rect x="4" y="9" width="12" height="8" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
