"use client";

import { Button } from "@/components/ui/Button";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import { InAppHint } from "./InAppHint";

export function ChooseStep({
  onCamera,
  onUpload,
  lastSeasonName,
  onShowLast,
}: {
  onCamera: () => void;
  onUpload: () => void;
  lastSeasonName: string | null;
  onShowLast: () => void;
}) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink">Step 1 of 3</p>
      <h1 className="mt-3 text-4xl leading-tight font-medium">How would you like to start?</h1>
      <p className="mt-3 text-lg text-ink-soft">A live camera gives the best result. A recent selfie in daylight works too.</p>

      <div className="mt-8 flex flex-col gap-3">
        <Button size="lg" onClick={onCamera}>
          <CameraIcon /> Use my camera
        </Button>
        <Button size="lg" variant="secondary" onClick={onUpload}>
          <ImageIcon /> Upload a selfie
        </Button>
      </div>
      <PrivacyBadge className="mt-5" />

      <ul className="mt-8 space-y-2 rounded-card bg-surface p-5 text-left text-[0.95rem] text-ink-soft ring-1 ring-line">
        <li>☀️ Face a window — natural daylight works best</li>
        <li>👓 Remove glasses &amp; heavy makeup if you can</li>
        <li>🙂 Hair away from your face, no filters</li>
      </ul>

      <InAppHint className="mt-6" />

      {lastSeasonName && (
        <button
          type="button"
          onClick={onShowLast}
          className="mt-6 inline-flex min-h-12 items-center font-medium text-accent-ink underline underline-offset-4"
        >
          See your last result: {lastSeasonName}
        </button>
      )}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.7l1.3-2h5l1.3 2h1.7A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="9.5" cy="9.5" r="1.5" />
      <path d="m5 17 4.5-4.5 3 3L15 13l4 4" />
    </svg>
  );
}
