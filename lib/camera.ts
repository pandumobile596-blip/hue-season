/** Front-camera helper shared by the capture step and live draping. */
import { cameraProblemFromError, canUseCamera, type CameraProblem } from "@/lib/browser";

export class CameraError extends Error {
  constructor(public problem: CameraProblem) {
    super(problem);
  }
}

/**
 * Start the front camera into `video`. Resolves with a stop() function that
 * releases the camera (the indicator light turns off).
 */
export async function startFrontCamera(video: HTMLVideoElement): Promise<() => void> {
  if (!canUseCamera()) throw new CameraError("unsupported");
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
      audio: false,
    });
  } catch (err) {
    throw new CameraError(cameraProblemFromError(err));
  }
  const stop = () => {
    stream.getTracks().forEach((t) => t.stop());
    if (video.srcObject === stream) video.srcObject = null;
  };
  try {
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
  } catch (err) {
    stop();
    throw new CameraError(cameraProblemFromError(err));
  }
  return stop;
}
