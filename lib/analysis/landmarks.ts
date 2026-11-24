/**
 * MediaPipe Face Mesh landmark indices we rely on (478-point model incl. irises).
 * Reference: https://github.com/google-ai-edge/mediapipe (canonical face model)
 */
export const LM = {
  /** Cheek centers — classic "blush" points, well away from lips, eyes and nostrils. */
  cheekLeft: 50,
  cheekRight: 280,
  /** Mid-forehead, above the brows. */
  forehead: 151,
  /** Top of forehead / hairline-ish, chin, and face sides (for size & framing). */
  top: 10,
  chin: 152,
  faceLeft: 234,
  faceRight: 454,
  noseTip: 1,
  /** Eyelid points used to tell if eyes are open. */
  leftEyeUpper: 159,
  leftEyeLower: 145,
  leftEyeOuter: 33,
  leftEyeInner: 133,
  rightEyeUpper: 386,
  rightEyeLower: 374,
  rightEyeOuter: 263,
  rightEyeInner: 362,
  /** Iris: center + 4 ring points per eye. */
  irisA: { center: 468, ring: [469, 470, 471, 472] },
  irisB: { center: 473, ring: [474, 475, 476, 477] },
} as const;

/** Eye outline polygons (eyelid contours). */
export const EYE_POLYGONS: readonly (readonly number[])[] = [
  [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466],
];

/** Jawline from ear to ear through the chin — used to place the drape later. */
export const JAWLINE = [
  234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361, 323, 454,
] as const;
