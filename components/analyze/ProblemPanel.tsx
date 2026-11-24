"use client";

import { Button } from "@/components/ui/Button";
import { PrivacyBadge } from "@/components/ui/PrivacyBadge";
import type { PhotoProblem } from "@/lib/analysis/pipeline";
import type { CameraProblem } from "@/lib/browser";
import { InAppHint } from "./InAppHint";

export type Problem =
  | { kind: "camera"; problem: CameraProblem }
  | { kind: "photo"; problem: PhotoProblem }
  | { kind: "ai-failed" }
  | { kind: "ai-timeout" }
  | { kind: "unsupported-browser" }
  | { kind: "bad-file" };

const COPY: Record<string, { title: string; body: string }> = {
  "camera:denied": {
    title: "We couldn't use your camera",
    body: "Camera access was blocked. You can allow it in your browser settings — or just upload a selfie instead.",
  },
  "camera:not-found": { title: "No camera found", body: "We couldn't find a front camera. Upload a selfie instead — it works just as well." },
  "camera:in-use": {
    title: "Your camera is busy",
    body: "Another app might be using the camera. Close it and try again, or upload a selfie.",
  },
  "camera:unsupported": {
    title: "This browser can't open the camera",
    body: "Some in-app browsers block the camera. Upload a selfie instead, or open this page in Safari or Chrome.",
  },
  "camera:unknown": { title: "The camera didn't start", body: "Something went wrong starting the camera. Try again, or upload a selfie." },
  "photo:no-face": {
    title: "We couldn't find a face",
    body: "Try a photo where you're looking at the camera, with your whole face visible and well lit.",
  },
  "photo:multiple-faces": {
    title: "We found more than one face",
    body: "For an accurate result, use a photo with just you in it.",
  },
  "photo:face-too-small": {
    title: "Your face is a bit small in this photo",
    body: "Get closer to the camera, or use a selfie where your face fills more of the frame.",
  },
  "photo:no-skin": {
    title: "We couldn't read your skin tone",
    body: "Make sure your cheeks and forehead are visible and not covered by hair, hands or shadows.",
  },
  "photo:too-dark": {
    title: "This photo is too dark",
    body: "Colors can't be read reliably in low light. Face a window or step into daylight and try again.",
  },
  "ai-failed": {
    title: "The AI couldn't load",
    body: "This can happen on a slow connection or an older device. Check your connection and try again.",
  },
  "ai-timeout": {
    title: "This is taking too long",
    body: "Your device may be busy. Close other apps or tabs and try again — a smaller photo can help too.",
  },
  "unsupported-browser": {
    title: "This browser is too old for the AI",
    body: "Please update your browser, or open this page in the latest Safari or Chrome.",
  },
  "bad-file": { title: "We couldn't open that image", body: "Try a different photo (JPG, PNG or HEIC)." },
};

function copyFor(p: Problem) {
  const key = p.kind === "camera" || p.kind === "photo" ? `${p.kind}:${p.problem}` : p.kind;
  return COPY[key] ?? COPY["camera:unknown"];
}

export function ProblemPanel({
  problem,
  onRetry,
  onUpload,
  onContinueAnyway,
}: {
  problem: Problem;
  onRetry: () => void;
  onUpload: () => void;
  onContinueAnyway?: () => void;
}) {
  const { title, body } = copyFor(problem);
  const cameraIssue = problem.kind === "camera";
  return (
    <div className="text-center" role="alert">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-warning-soft text-2xl" aria-hidden="true">
        {cameraIssue ? "📷" : "💡"}
      </div>
      <h1 className="mt-5 text-3xl leading-tight font-medium">{title}</h1>
      <p className="mx-auto mt-3 max-w-sm text-lg leading-relaxed text-ink-soft">{body}</p>

      <div className="mt-8 flex flex-col items-center gap-3">
        {cameraIssue ? (
          <>
            <Button size="lg" className="w-full max-w-xs" onClick={onUpload}>
              Upload a selfie instead
            </Button>
            <Button size="lg" variant="secondary" className="w-full max-w-xs" onClick={onRetry}>
              Try the camera again
            </Button>
          </>
        ) : (
          <>
            <Button size="lg" className="w-full max-w-xs" onClick={onRetry}>
              Try again
            </Button>
            <Button size="lg" variant="secondary" className="w-full max-w-xs" onClick={onUpload}>
              Upload a different photo
            </Button>
          </>
        )}
        {onContinueAnyway && (
          <button type="button" onClick={onContinueAnyway} className="min-h-12 text-ink-soft underline underline-offset-4">
            Use this photo anyway
          </button>
        )}
        <PrivacyBadge className="mt-2" />
      </div>
      {cameraIssue && <InAppHint force={problem.problem === "unsupported" || problem.problem === "denied"} className="mt-6" />}
    </div>
  );
}
