"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { getSeasonPalette } from "@/content/palettes";
import { buildResult } from "@/lib/analysis/analyze";
import type { UserAnswers } from "@/lib/analysis/dimensions";
import { PhotoError, analyzePhoto, fileToCanvas, type PhotoAnalysis } from "@/lib/analysis/pipeline";
import { canRunAI, type CameraProblem } from "@/lib/browser";
import { acquireVision, releaseVision, type Vision } from "@/lib/mediapipe/loader";
import { setPhoto } from "@/lib/photoStore";
import { saveResult } from "@/lib/storage";
import { setRevealPending, useSavedResult } from "@/lib/useStored";
import { CameraStep } from "./CameraStep";
import { ChooseStep } from "./ChooseStep";
import { LoadingBar } from "./LoadingBar";
import { ProblemPanel, type Problem } from "./ProblemPanel";
import { QuestionsStep } from "./QuestionsStep";

type Source = "camera" | "upload";

/** Give up on a single photo analysis after this long (normally < 2s). */
const ANALYSIS_TIMEOUT_MS = 30_000;
class AnalysisTimeout extends Error {}
type Step =
  | { name: "choose" }
  | { name: "camera" }
  | { name: "processing" }
  | { name: "problem"; problem: Problem; retry: Source; pending?: PhotoAnalysis }
  | { name: "questions"; analysis: PhotoAnalysis };

export function AnalyzeFlow() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: "choose" });
  const [vision, setVision] = useState<Vision | null>(null);
  const [loadPercent, setLoadPercent] = useState(0);
  const visionPromise = useRef<Promise<Vision> | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const saved = useSavedResult();

  /** Start loading the AI (once). Safe to call many times. */
  const ensureVision = useCallback((): Promise<Vision> => {
    if (!visionPromise.current) {
      const p = acquireVision((pct) => setLoadPercent(pct));
      visionPromise.current = p;
      p.then((v) => {
        if (visionPromise.current === p) setVision(v); // ignore if we left the page meanwhile
      }).catch(() => {
        if (visionPromise.current !== p) return;
        visionPromise.current = null;
        releaseVision(); // balance the failed acquire
      });
    }
    return visionPromise.current;
  }, []);

  // Leaving the page (Next.js hides it with <Activity>, which runs this cleanup):
  // free the models and start fresh next time. The camera stops in CameraStep's own cleanup.
  useLayoutEffect(
    () => () => {
      if (visionPromise.current) {
        visionPromise.current = null;
        releaseVision();
      }
      setVision(null);
      setLoadPercent(0);
      setStep({ name: "choose" });
    },
    [],
  );

  // Move focus & scroll to the top of each new step (screen readers + small screens).
  useEffect(() => {
    topRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  }, [step.name]);

  const runAnalysis = useCallback(
    async (getCanvas: () => Promise<HTMLCanvasElement>, source: Source) => {
      setStep({ name: "processing" });
      let canvas: HTMLCanvasElement;
      try {
        canvas = await getCanvas();
      } catch {
        setStep({ name: "problem", problem: { kind: "bad-file" }, retry: source });
        return;
      }
      let v: Vision;
      try {
        v = await ensureVision();
      } catch {
        setStep({ name: "problem", problem: { kind: "ai-failed" }, retry: source });
        return;
      }
      try {
        // Guard against a stuck GPU/WASM on very slow or unusual devices.
        const analysis = await Promise.race([
          analyzePhoto(canvas, v),
          new Promise<never>((_, reject) => window.setTimeout(() => reject(new AnalysisTimeout()), ANALYSIS_TIMEOUT_MS)),
        ]);
        // Keep the photo in memory only, so the result page can drape colors on it.
        setPhoto({ canvas, landmarks: analysis.landmarks, source });
        if (analysis.issues.includes("too-dark")) {
          setStep({ name: "problem", problem: { kind: "photo", problem: "too-dark" }, retry: source, pending: analysis });
        } else {
          setStep({ name: "questions", analysis });
        }
      } catch (err) {
        canvas.width = canvas.height = 0; // unusable photo: drop the pixels right away
        const problem: Problem =
          err instanceof PhotoError
            ? { kind: "photo", problem: err.problem }
            : err instanceof AnalysisTimeout
              ? { kind: "ai-timeout" }
              : { kind: "ai-failed" };
        setStep({ name: "problem", problem, retry: source });
      }
    },
    [ensureVision],
  );

  const openUpload = () => fileInput.current?.click();

  const unsupported = (retry: Source) => {
    if (canRunAI()) return false;
    setStep({ name: "problem", problem: { kind: "unsupported-browser" }, retry });
    return true;
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file || unsupported("upload")) return;
    void runAnalysis(() => fileToCanvas(file), "upload");
  };

  const startCamera = () => {
    if (unsupported("camera")) return;
    void ensureVision();
    setStep({ name: "camera" });
  };

  const finish = (analysis: PhotoAnalysis, answers: UserAnswers) => {
    const result = buildResult(analysis.features, { issues: analysis.issues, whiteBalance: analysis.whiteBalance }, answers);
    saveResult(result);
    setRevealPending(true);
    router.push("/result");
  };

  return (
    <div ref={topRef} tabIndex={-1} className="outline-none">
      <input ref={fileInput} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={onFile} />

      {step.name === "choose" && (
        <ChooseStep
          onCamera={startCamera}
          onUpload={openUpload}
          lastSeasonName={saved ? (getSeasonPalette(saved.season)?.name ?? null) : null}
          onShowLast={() => router.push("/result")}
        />
      )}

      {step.name === "camera" && (
        <CameraStep
          vision={vision}
          loadPercent={loadPercent}
          onCapture={(canvas) => void runAnalysis(async () => canvas, "camera")}
          onFail={(problem: CameraProblem) =>
            setStep({ name: "problem", problem: { kind: "camera", problem }, retry: "camera" })
          }
          onBack={() => setStep({ name: "choose" })}
          onUpload={openUpload}
        />
      )}

      {step.name === "processing" && (
        <div className="py-16 text-center" role="status" aria-live="polite">
          {vision ? (
            <>
              <div className="mx-auto size-14 animate-spin rounded-full border-4 border-accent-soft border-t-accent motion-reduce:animate-none" aria-hidden="true" />
              <h1 className="mt-6 text-3xl font-medium">Reading your colors…</h1>
              <p className="mt-2 text-ink-soft">Skin undertone, eyes, hair and contrast — all on your device.</p>
            </>
          ) : (
            <div className="mx-auto max-w-xs">
              <h1 className="mb-6 text-3xl font-medium">Getting the AI ready</h1>
              <LoadingBar percent={loadPercent} />
              <p className="mt-4 text-sm text-muted">One-time download. Next time it&apos;s instant.</p>
            </div>
          )}
        </div>
      )}

      {step.name === "problem" && (
        <ProblemPanel
          problem={step.problem}
          onRetry={() => (step.retry === "camera" ? startCamera() : openUpload())}
          onUpload={openUpload}
          onContinueAnyway={step.pending ? () => setStep({ name: "questions", analysis: step.pending! }) : undefined}
        />
      )}

      {step.name === "questions" && (
        <QuestionsStep hairDetected={step.analysis.features.hair !== null} onDone={(a) => finish(step.analysis, a)} />
      )}
    </div>
  );
}
