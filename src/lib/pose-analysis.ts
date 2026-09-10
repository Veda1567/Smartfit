/**
 * SmartFit AI Camera Form Coach - Pose Analysis & Form Quality Engine
 *
 * Browser-side geometric posture analysis, angle calculations,
 * movement state machines, debouncing, and real-time form checks for:
 * 1. Squat
 * 2. Push-up
 * 3. Bicep Curl
 *
 * NOTE: This is a general fitness assistance system, NOT a medical or clinical diagnostic tool.
 */

// ============================================================================
// 1. STANDARD MEDIAPIPE POSE LANDMARK INDICES
// ============================================================================

export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// Landmark connections for rendering skeleton overlay
export const POSE_CONNECTIONS: [number, number][] = [
  // Torso
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // Left Arm
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  // Right Arm
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  // Left Leg
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  // Right Leg
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
];

// ============================================================================
// 2. DATA TYPES
// ============================================================================

export interface NormalizedLandmark {
  x: number;
  y: number;
  z?: number;
  visibility?: number;
}

export type ExerciseType = "squat" | "pushup" | "bicep_curl";

export type SquatPhase = "standing" | "descending" | "bottom" | "ascending";
export type PushupPhase = "top" | "descending" | "bottom" | "ascending";
export type CurlPhase = "extended" | "curling" | "contracted" | "extending";

export type MovementPhase = SquatPhase | PushupPhase | CurlPhase | "unknown";

export interface FormCheckIssue {
  type: string;
  severity: "warning" | "error" | "info";
  message: string;
}

export interface PoseAnalysisResult {
  exercise: ExerciseType;
  phase: MovementPhase;
  totalReps: number;
  correctReps: number;
  formWarnings: number;
  lastRepValid: boolean;
  currentAngle: number;
  targetAngleRange: [number, number];
  feedback: string;
  formScore: number; // 0 to 100
  isBodyVisible: boolean;
  issues: FormCheckIssue[];
  activeSide: "left" | "right" | "both";
  repJustCounted?: boolean;
}

// ============================================================================
// 3. GEOMETRY & MATH UTILITIES
// ============================================================================

/**
 * Checks if a landmark is valid and meets the minimum visibility threshold.
 */
export function isLandmarkVisible(
  landmark: NormalizedLandmark | undefined,
  minVisibility = 0.5
): boolean {
  if (!landmark) return false;
  if (landmark.visibility !== undefined && landmark.visibility < minVisibility) {
    return false;
  }
  // Check bounds
  if (
    Number.isNaN(landmark.x) ||
    Number.isNaN(landmark.y) ||
    landmark.x < -0.2 ||
    landmark.x > 1.2 ||
    landmark.y < -0.2 ||
    landmark.y > 1.2
  ) {
    return false;
  }
  return true;
}

/**
 * Checks if all required landmarks in an array are visible.
 */
export function areLandmarksVisible(
  landmarks: NormalizedLandmark[],
  indices: number[],
  minVisibility = 0.5
): boolean {
  if (!landmarks || landmarks.length === 0) return false;
  for (const idx of indices) {
    if (!isLandmarkVisible(landmarks[idx], minVisibility)) {
      return false;
    }
  }
  return true;
}

/**
 * Calculates the 2D planar angle at vertex B formed by segments BA and BC.
 * Returns angle in degrees [0, 180].
 */
export function calculateAngle(
  a: NormalizedLandmark,
  b: NormalizedLandmark,
  c: NormalizedLandmark
): number {
  const baX = a.x - b.x;
  const baY = a.y - b.y;
  const bcX = c.x - b.x;
  const bcY = c.y - b.y;

  const dot = baX * bcX + baY * bcY;
  const magBA = Math.sqrt(baX * baX + baY * baY);
  const magBC = Math.sqrt(bcX * bcX + bcY * bcY);

  if (magBA < 1e-6 || magBC < 1e-6) return 180;

  const cosine = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return Math.round((Math.acos(cosine) * 180) / Math.PI);
}

/**
 * Calculates Euclidean distance between two landmarks.
 */
export function calculateDistance(
  a: NormalizedLandmark,
  b: NormalizedLandmark
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates the angle of vector AB relative to the vertical Y axis in degrees.
 * Useful for checking torso vertical tilt / forward lean.
 */
export function calculateVerticalAngle(
  top: NormalizedLandmark,
  bottom: NormalizedLandmark
): number {
  const dx = Math.abs(top.x - bottom.x);
  const dy = Math.abs(bottom.y - top.y);
  if (dy < 1e-6) return 90;
  return Math.round((Math.atan2(dx, dy) * 180) / Math.PI);
}

/**
 * Exponential moving average (EMA) smoothing for angle time-series.
 */
export function smoothValue(
  current: number,
  previous: number | null,
  alpha = 0.4
): number {
  if (previous === null || Number.isNaN(previous)) return current;
  return Math.round(alpha * current + (1 - alpha) * previous);
}

// ============================================================================
// 4. EXERCISE STATE MACHINE IMPLEMENTATIONS
// ============================================================================

export interface IExerciseDetector {
  readonly exerciseType: ExerciseType;
  readonly displayName: string;
  analyze(
    landmarks: NormalizedLandmark[],
    timestamp?: number
  ): PoseAnalysisResult;
  reset(): void;
}

// ----------------------------------------------------------------------------
// SQUAT DETECTOR
// ----------------------------------------------------------------------------
// SQUAT DETECTOR
// ----------------------------------------------------------------------------
export class SquatDetector implements IExerciseDetector {
  readonly exerciseType: ExerciseType = "squat";
  readonly displayName = "Squat";

  private phase: SquatPhase = "standing";
  private totalReps = 0;
  private correctReps = 0;
  private formWarnings = 0;
  private smoothedKneeAngle: number | null = null;
  private minKneeAngleInRep = 180;
  private maxTorsoLeanInRep = 0;
  private lastRepTimestamp = 0;
  private lastRepValid = true;
  private lastTimestamp = 0;

  // Thresholds
  private readonly STANDING_ANGLE = 155;
  private readonly DESCENDING_ANGLE = 145;
  private readonly VALID_DEPTH_ANGLE = 100; // Knee angle <= 100° for full squat
  private readonly MAX_TORSO_LEAN = 45; // Max 45 degrees forward lean
  private readonly MIN_REP_COOLDOWN_MS = 600;

  reset() {
    this.phase = "standing";
    this.totalReps = 0;
    this.correctReps = 0;
    this.formWarnings = 0;
    this.smoothedKneeAngle = null;
    this.minKneeAngleInRep = 180;
    this.maxTorsoLeanInRep = 0;
    this.lastRepTimestamp = 0;
    this.lastRepValid = true;
    this.lastTimestamp = 0;
  }

  analyze(
    landmarks: NormalizedLandmark[],
    timestamp = Date.now()
  ): PoseAnalysisResult {
    const issues: FormCheckIssue[] = [];

    // Check visibility of key leg landmarks (prefer side with higher visibility)
    const leftVisible = areLandmarksVisible(landmarks, [
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
    ]);
    const rightVisible = areLandmarksVisible(landmarks, [
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ]);

    if (!leftVisible && !rightVisible) {
      this.phase = "standing";
      this.minKneeAngleInRep = 180;
      this.maxTorsoLeanInRep = 0;
      return {
        exercise: "squat",
        phase: this.phase,
        totalReps: this.totalReps,
        correctReps: this.correctReps,
        formWarnings: this.formWarnings,
        lastRepValid: this.lastRepValid,
        currentAngle: this.smoothedKneeAngle ?? 180,
        targetAngleRange: [80, 100],
        feedback: "Step back so your hips, knees, and feet are visible",
        formScore: 0,
        isBodyVisible: false,
        issues: [
          {
            type: "visibility",
            severity: "error",
            message: "Leg landmarks not detected in frame",
          },
        ],
        activeSide: "both",
      };
    }

    // Determine active side
    const activeSide: "left" | "right" | "both" =
      leftVisible && !rightVisible
        ? "left"
        : rightVisible && !leftVisible
        ? "right"
        : "both";

    // Calculate knee angle
    let rawKneeAngle = 180;
    if (activeSide === "left") {
      rawKneeAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        landmarks[POSE_LANDMARKS.LEFT_ANKLE]
      );
    } else if (activeSide === "right") {
      rawKneeAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
      );
    } else {
      const leftAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_HIP],
        landmarks[POSE_LANDMARKS.LEFT_KNEE],
        landmarks[POSE_LANDMARKS.LEFT_ANKLE]
      );
      const rightAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_HIP],
        landmarks[POSE_LANDMARKS.RIGHT_KNEE],
        landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
      );
      rawKneeAngle = Math.min(leftAngle, rightAngle);
    }

    // Apply adaptive smoothing
    const dt = this.lastTimestamp > 0 ? timestamp - this.lastTimestamp : 33;
    this.lastTimestamp = timestamp;
    const effectiveAlpha = dt >= 150 ? Math.min(0.95, Math.max(0.45, 1 - Math.exp(-dt / 70))) : 0.45;
    this.smoothedKneeAngle = smoothValue(rawKneeAngle, this.smoothedKneeAngle, effectiveAlpha);
    const kneeAngle = this.smoothedKneeAngle;

    // Calculate torso lean (Shoulder relative to Hip)
    let torsoLean = 0;
    if (activeSide === "left" && isLandmarkVisible(landmarks[POSE_LANDMARKS.LEFT_SHOULDER])) {
      torsoLean = calculateVerticalAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP]
      );
    } else if (activeSide === "right" && isLandmarkVisible(landmarks[POSE_LANDMARKS.RIGHT_SHOULDER])) {
      torsoLean = calculateVerticalAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_HIP]
      );
    } else if (
      isLandmarkVisible(landmarks[POSE_LANDMARKS.LEFT_SHOULDER]) &&
      isLandmarkVisible(landmarks[POSE_LANDMARKS.LEFT_HIP])
    ) {
      torsoLean = calculateVerticalAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_HIP]
      );
    }

    // Track minimum knee angle and max torso lean throughout the rep
    if (this.phase !== "standing") {
      this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, rawKneeAngle, kneeAngle);
      this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);
    }

    let repJustCounted = false;
    let feedback = "Stand upright to begin your squat";
    let formScore = 95;

    // Movement State Machine
    switch (this.phase) {
      case "standing":
        this.minKneeAngleInRep = 180;
        this.maxTorsoLeanInRep = 0;
        if (kneeAngle <= this.VALID_DEPTH_ANGLE) {
          this.phase = "bottom";
          this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, rawKneeAngle, kneeAngle);
          this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);
          feedback = "Great depth! Now drive up through your heels";
        } else if (kneeAngle < this.DESCENDING_ANGLE) {
          this.phase = "descending";
          this.minKneeAngleInRep = Math.min(this.minKneeAngleInRep, rawKneeAngle, kneeAngle);
          this.maxTorsoLeanInRep = Math.max(this.maxTorsoLeanInRep, torsoLean);
          feedback = "Lower your hips smoothly";
        } else {
          feedback = "Ready. Initiate squat descent";
        }
        break;

      case "descending":
        if (kneeAngle <= this.VALID_DEPTH_ANGLE) {
          this.phase = "bottom";
          feedback = "Great depth! Now drive up through your heels";
        } else if (kneeAngle > this.minKneeAngleInRep + 12 && kneeAngle < this.STANDING_ANGLE) {
          this.phase = "ascending";
          feedback = "Driving up. Go deeper on the next rep";
        } else if (kneeAngle >= this.STANDING_ANGLE && this.minKneeAngleInRep > 150) {
          this.phase = "standing";
          feedback = "Descent paused. Lower into full squat";
        } else if (kneeAngle >= this.STANDING_ANGLE) {
          this.phase = "ascending";
        } else {
          feedback = "Lower a bit more to reach parallel depth";
        }
        break;

      case "bottom":
        if (kneeAngle > this.VALID_DEPTH_ANGLE + 10) {
          this.phase = "ascending";
          feedback = "Push up through your midfoot";
        } else {
          feedback = "Good bottom position. Drive back up";
        }
        break;

      case "ascending":
        if (kneeAngle >= this.STANDING_ANGLE) {
          const timeSinceLastRep = timestamp - this.lastRepTimestamp;
          if (timeSinceLastRep >= this.MIN_REP_COOLDOWN_MS) {
            if (this.minKneeAngleInRep <= 140) {
              this.totalReps++;
              this.lastRepTimestamp = timestamp;
              repJustCounted = true;

              const reachedDepth = this.minKneeAngleInRep <= this.VALID_DEPTH_ANGLE;
              const uprightTorso = this.maxTorsoLeanInRep <= this.MAX_TORSO_LEAN;

              if (reachedDepth && uprightTorso) {
                this.correctReps++;
                this.lastRepValid = true;
                feedback = "Excellent squat! Full depth and upright posture";
                formScore = 100;
              } else {
                this.formWarnings++;
                this.lastRepValid = false;
                if (!reachedDepth) {
                  issues.push({
                    type: "depth",
                    severity: "warning",
                    message: `Knee reached ${this.minKneeAngleInRep}°. Aim for parallel (<= 100°)`,
                  });
                  feedback = "Rep counted: Go a little deeper next time";
                  formScore = 70;
                }
                if (!uprightTorso) {
                  issues.push({
                    type: "torso",
                    severity: "warning",
                    message: `Torso leaned ${this.maxTorsoLeanInRep}°. Keep your chest up`,
                  });
                  feedback = "Rep counted: Keep your chest higher";
                  formScore = 75;
                }
              }
            }
          }
          this.phase = "standing";
        } else {
          feedback = "Rise all the way up to standing";
        }
        break;
    }

    return {
      exercise: "squat",
      phase: this.phase,
      totalReps: this.totalReps,
      correctReps: this.correctReps,
      formWarnings: this.formWarnings,
      lastRepValid: this.lastRepValid,
      currentAngle: kneeAngle,
      targetAngleRange: [80, 100],
      feedback,
      formScore,
      isBodyVisible: true,
      issues,
      activeSide,
      repJustCounted,
    };
  }
}


// ----------------------------------------------------------------------------
// PUSH-UP DETECTOR
// ----------------------------------------------------------------------------
export class PushupDetector implements IExerciseDetector {
  readonly exerciseType: ExerciseType = "pushup";
  readonly displayName = "Push-up";

  private phase: PushupPhase = "top";
  private totalReps = 0;
  private correctReps = 0;
  private formWarnings = 0;
  private smoothedElbowAngle: number | null = null;
  private minElbowAngleInRep = 180;
  private worstBodyAlignmentInRep = 180;
  private lastRepTimestamp = 0;
  private lastRepValid = true;
  private lastTimestamp = 0;

  // Thresholds
  private readonly TOP_ANGLE = 150;
  private readonly DESCENDING_ANGLE = 140;
  private readonly BOTTOM_ANGLE = 95; // Elbow <= 95° at bottom
  private readonly MIN_ALIGNMENT_ANGLE = 150; // Shoulder-Hip-Ankle line
  private readonly MAX_ALIGNMENT_ANGLE = 195; // Disallow excessive hip sag
  private readonly MIN_REP_COOLDOWN_MS = 600;

  reset() {
    this.phase = "top";
    this.totalReps = 0;
    this.correctReps = 0;
    this.formWarnings = 0;
    this.smoothedElbowAngle = null;
    this.minElbowAngleInRep = 180;
    this.worstBodyAlignmentInRep = 180;
    this.lastRepTimestamp = 0;
    this.lastRepValid = true;
    this.lastTimestamp = 0;
  }

  analyze(
    landmarks: NormalizedLandmark[],
    timestamp = Date.now()
  ): PoseAnalysisResult {
    const issues: FormCheckIssue[] = [];

    // Check visibility of arm landmarks
    const leftVisible = areLandmarksVisible(landmarks, [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
    ]);
    const rightVisible = areLandmarksVisible(landmarks, [
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.RIGHT_WRIST,
    ]);

    if (!leftVisible && !rightVisible) {
      this.phase = "top";
      this.minElbowAngleInRep = 180;
      this.worstBodyAlignmentInRep = 180;
      return {
        exercise: "pushup",
        phase: this.phase,
        totalReps: this.totalReps,
        correctReps: this.correctReps,
        formWarnings: this.formWarnings,
        lastRepValid: this.lastRepValid,
        currentAngle: this.smoothedElbowAngle ?? 180,
        targetAngleRange: [80, 95],
        feedback: "Position camera so your upper body and arms are visible",
        formScore: 0,
        isBodyVisible: false,
        issues: [
          {
            type: "visibility",
            severity: "error",
            message: "Arm landmarks not detected in frame",
          },
        ],
        activeSide: "both",
      };
    }

    const activeSide: "left" | "right" | "both" =
      leftVisible && !rightVisible
        ? "left"
        : rightVisible && !leftVisible
        ? "right"
        : "both";

    // Calculate elbow angle
    let rawElbowAngle = 180;
    if (activeSide === "left") {
      rawElbowAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_WRIST]
      );
    } else if (activeSide === "right") {
      rawElbowAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      );
    } else {
      const leftAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
        landmarks[POSE_LANDMARKS.LEFT_ELBOW],
        landmarks[POSE_LANDMARKS.LEFT_WRIST]
      );
      const rightAngle = calculateAngle(
        landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
        landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
        landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      );
      rawElbowAngle = Math.min(leftAngle, rightAngle);
    }

    // Apply adaptive smoothing
    const dt = this.lastTimestamp > 0 ? timestamp - this.lastTimestamp : 33;
    this.lastTimestamp = timestamp;
    const effectiveAlpha = dt >= 150 ? Math.min(0.95, Math.max(0.45, 1 - Math.exp(-dt / 70))) : 0.45;
    this.smoothedElbowAngle = smoothValue(rawElbowAngle, this.smoothedElbowAngle, effectiveAlpha);
    const elbowAngle = this.smoothedElbowAngle;

    // Body alignment check (Shoulder - Hip - Ankle) if visible
    let bodyAlignment = 180;
    const bodyVisible =
      (leftVisible &&
        isLandmarkVisible(landmarks[POSE_LANDMARKS.LEFT_HIP]) &&
        isLandmarkVisible(landmarks[POSE_LANDMARKS.LEFT_ANKLE])) ||
      (rightVisible &&
        isLandmarkVisible(landmarks[POSE_LANDMARKS.RIGHT_HIP]) &&
        isLandmarkVisible(landmarks[POSE_LANDMARKS.RIGHT_ANKLE]));

    if (bodyVisible) {
      if (
        isLandmarkVisible(landmarks[POSE_LANDMARKS.LEFT_HIP]) &&
        isLandmarkVisible(landmarks[POSE_LANDMARKS.LEFT_ANKLE])
      ) {
        bodyAlignment = calculateAngle(
          landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
          landmarks[POSE_LANDMARKS.LEFT_HIP],
          landmarks[POSE_LANDMARKS.LEFT_ANKLE]
        );
      } else {
        bodyAlignment = calculateAngle(
          landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
          landmarks[POSE_LANDMARKS.RIGHT_HIP],
          landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
        );
      }
    }

    if (this.phase !== "top") {
      this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, rawElbowAngle, elbowAngle);
      if (bodyVisible) {
        this.worstBodyAlignmentInRep = Math.min(
          this.worstBodyAlignmentInRep,
          bodyAlignment
        );
      }
    }

    let repJustCounted = false;
    let feedback = "Get into plank position with straight arms";
    let formScore = 95;

    // Movement State Machine
    switch (this.phase) {
      case "top":
        this.minElbowAngleInRep = 180;
        this.worstBodyAlignmentInRep = 180;
        if (elbowAngle <= this.BOTTOM_ANGLE) {
          this.phase = "bottom";
          this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, rawElbowAngle, elbowAngle);
          if (bodyVisible) this.worstBodyAlignmentInRep = Math.min(this.worstBodyAlignmentInRep, bodyAlignment);
          feedback = "Good depth! Push back up through your palms";
        } else if (elbowAngle < this.DESCENDING_ANGLE) {
          this.phase = "descending";
          this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, rawElbowAngle, elbowAngle);
          if (bodyVisible) this.worstBodyAlignmentInRep = Math.min(this.worstBodyAlignmentInRep, bodyAlignment);
          feedback = "Lower your chest toward the floor";
        } else {
          feedback = "In plank position. Lower your body";
        }
        break;

      case "descending":
        if (elbowAngle <= this.BOTTOM_ANGLE) {
          this.phase = "bottom";
          feedback = "Good depth! Push back up through your palms";
        } else if (elbowAngle > this.minElbowAngleInRep + 12 && elbowAngle < this.TOP_ANGLE) {
          this.phase = "ascending";
          feedback = "Pushing up. Lower chest further on next rep";
        } else if (elbowAngle >= this.TOP_ANGLE && this.minElbowAngleInRep > 145) {
          this.phase = "top";
          feedback = "Descend smoothly to 90° elbow bend";
        } else if (elbowAngle >= this.TOP_ANGLE) {
          this.phase = "ascending";
        } else {
          feedback = "Lower down further for full range";
        }
        break;

      case "bottom":
        if (elbowAngle > this.BOTTOM_ANGLE + 12) {
          this.phase = "ascending";
          feedback = "Push up steadily to lock out arms";
        } else {
          feedback = "Hold bottom, then push back up";
        }
        break;

      case "ascending":
        if (elbowAngle >= this.TOP_ANGLE) {
          const timeSinceLastRep = timestamp - this.lastRepTimestamp;
          if (timeSinceLastRep >= this.MIN_REP_COOLDOWN_MS) {
            if (this.minElbowAngleInRep <= 135) {
              this.totalReps++;
              this.lastRepTimestamp = timestamp;
              repJustCounted = true;

              const reachedDepth = this.minElbowAngleInRep <= this.BOTTOM_ANGLE;
              const coreAligned =
                !bodyVisible ||
                (this.worstBodyAlignmentInRep >= this.MIN_ALIGNMENT_ANGLE &&
                  this.worstBodyAlignmentInRep <= this.MAX_ALIGNMENT_ANGLE);

              if (reachedDepth && coreAligned) {
                this.correctReps++;
                this.lastRepValid = true;
                feedback = "Excellent push-up! Full depth & straight line";
                formScore = 100;
              } else {
                this.formWarnings++;
                this.lastRepValid = false;
                if (!reachedDepth) {
                  issues.push({
                    type: "depth",
                    severity: "warning",
                    message: `Elbow reached ${this.minElbowAngleInRep}°. Aim for 90° bend`,
                  });
                  feedback = "Rep counted: Lower your chest more";
                  formScore = 70;
                }
                if (!coreAligned) {
                  issues.push({
                    type: "core",
                    severity: "warning",
                    message: "Keep your hips aligned with shoulders and feet",
                  });
                  feedback = "Rep counted: Keep your core tight, don't sag hips";
                  formScore = 75;
                }
              }
            }
          }
          this.phase = "top";
        } else {
          feedback = "Push all the way back to plank lockout";
        }
        break;
    }

    return {
      exercise: "pushup",
      phase: this.phase,
      totalReps: this.totalReps,
      correctReps: this.correctReps,
      formWarnings: this.formWarnings,
      lastRepValid: this.lastRepValid,
      currentAngle: elbowAngle,
      targetAngleRange: [80, 95],
      feedback,
      formScore,
      isBodyVisible: true,
      issues,
      activeSide,
      repJustCounted,
    };
  }
}

// ----------------------------------------------------------------------------
// BICEP CURL DETECTOR
// ----------------------------------------------------------------------------
export class BicepCurlDetector implements IExerciseDetector {
  readonly exerciseType: ExerciseType = "bicep_curl";
  readonly displayName = "Bicep Curl";

  private phase: CurlPhase = "extended";
  private totalReps = 0;
  private correctReps = 0;
  private formWarnings = 0;
  private smoothedElbowAngle: number | null = null;
  private minElbowAngleInRep = 180;
  private maxElbowAngleInRep = 0;
  private lastRepTimestamp = 0;
  private lastRepValid = true;
  private lastTimestamp = 0;

  // Thresholds
  private readonly EXTENDED_ANGLE = 150; // Arm extended > 150°
  private readonly CURLING_ANGLE = 135;
  private readonly CONTRACTED_ANGLE = 60; // Peak curl <= 60°
  private readonly MIN_REP_COOLDOWN_MS = 500;

  reset() {
    this.phase = "extended";
    this.totalReps = 0;
    this.correctReps = 0;
    this.formWarnings = 0;
    this.smoothedElbowAngle = null;
    this.minElbowAngleInRep = 180;
    this.maxElbowAngleInRep = 0;
    this.lastRepTimestamp = 0;
    this.lastRepValid = true;
    this.lastTimestamp = 0;
  }

  analyze(
    landmarks: NormalizedLandmark[],
    timestamp = Date.now()
  ): PoseAnalysisResult {
    const issues: FormCheckIssue[] = [];

    const leftVisible = areLandmarksVisible(landmarks, [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
    ]);
    const rightVisible = areLandmarksVisible(landmarks, [
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.RIGHT_WRIST,
    ]);

    if (!leftVisible && !rightVisible) {
      this.phase = "extended";
      this.minElbowAngleInRep = 180;
      this.maxElbowAngleInRep = 0;
      return {
        exercise: "bicep_curl",
        phase: this.phase,
        totalReps: this.totalReps,
        correctReps: this.correctReps,
        formWarnings: this.formWarnings,
        lastRepValid: this.lastRepValid,
        currentAngle: this.smoothedElbowAngle ?? 180,
        targetAngleRange: [40, 60],
        feedback: "Position your arm and torso clearly in the camera view",
        formScore: 0,
        isBodyVisible: false,
        issues: [
          {
            type: "visibility",
            severity: "error",
            message: "Arm landmarks not detected in frame",
          },
        ],
        activeSide: "both",
      };
    }

    // Determine active arm by movement or visibility
    const leftAngle = leftVisible
      ? calculateAngle(
          landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
          landmarks[POSE_LANDMARKS.LEFT_ELBOW],
          landmarks[POSE_LANDMARKS.LEFT_WRIST]
        )
      : 180;
    const rightAngle = rightVisible
      ? calculateAngle(
          landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
          landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
          landmarks[POSE_LANDMARKS.RIGHT_WRIST]
        )
      : 180;

    let activeSide: "left" | "right" | "both" = "left";
    let rawAngle = 180;

    if (leftVisible && !rightVisible) {
      activeSide = "left";
      rawAngle = leftAngle;
    } else if (rightVisible && !leftVisible) {
      activeSide = "right";
      rawAngle = rightAngle;
    } else {
      // Both visible - pick arm currently showing more contraction (lower angle)
      if (leftAngle < rightAngle) {
        activeSide = "left";
        rawAngle = leftAngle;
      } else {
        activeSide = "right";
        rawAngle = rightAngle;
      }
    }

    // Apply adaptive smoothing
    const dt = this.lastTimestamp > 0 ? timestamp - this.lastTimestamp : 33;
    this.lastTimestamp = timestamp;
    const effectiveAlpha = dt >= 150 ? Math.min(0.95, Math.max(0.45, 1 - Math.exp(-dt / 70))) : 0.45;
    this.smoothedElbowAngle = smoothValue(rawAngle, this.smoothedElbowAngle, effectiveAlpha);
    const elbowAngle = this.smoothedElbowAngle;

    if (this.phase !== "extended") {
      this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, rawAngle, elbowAngle);
      this.maxElbowAngleInRep = Math.max(this.maxElbowAngleInRep, rawAngle, elbowAngle);
    }

    let repJustCounted = false;
    let feedback = "Extend your arm fully downward";
    let formScore = 95;

    // Movement State Machine
    switch (this.phase) {
      case "extended":
        this.minElbowAngleInRep = 180;
        this.maxElbowAngleInRep = 0;
        if (elbowAngle <= this.CONTRACTED_ANGLE) {
          this.phase = "contracted";
          this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, rawAngle, elbowAngle);
          feedback = "Peak contraction! Squeeze the bicep, then lower down";
        } else if (elbowAngle < this.CURLING_ANGLE) {
          this.phase = "curling";
          this.minElbowAngleInRep = Math.min(this.minElbowAngleInRep, rawAngle, elbowAngle);
          feedback = "Curl upward toward your shoulder";
        } else {
          feedback = "Arm fully extended. Ready to curl";
        }
        break;

      case "curling":
        if (elbowAngle <= this.CONTRACTED_ANGLE) {
          this.phase = "contracted";
          feedback = "Peak contraction! Squeeze the bicep, then lower down";
        } else if (elbowAngle > this.minElbowAngleInRep + 15 && elbowAngle < this.EXTENDED_ANGLE) {
          this.phase = "extending";
          feedback = "Lowering arm. Curl higher on next rep";
        } else if (elbowAngle >= this.EXTENDED_ANGLE && this.minElbowAngleInRep > 140) {
          this.phase = "extended";
          feedback = "Complete the curl all the way up";
        } else if (elbowAngle >= this.EXTENDED_ANGLE) {
          this.phase = "extending";
        } else {
          feedback = "Keep curling up to shoulder height";
        }
        break;

      case "contracted":
        if (elbowAngle > this.CONTRACTED_ANGLE + 15) {
          this.phase = "extending";
          feedback = "Control the descent, extend your arm fully";
        } else {
          feedback = "Squeeze at top, now lower slowly";
        }
        break;

      case "extending":
        if (elbowAngle >= this.EXTENDED_ANGLE) {
          const timeSinceLastRep = timestamp - this.lastRepTimestamp;
          if (timeSinceLastRep >= this.MIN_REP_COOLDOWN_MS) {
            if (this.minElbowAngleInRep <= 125) {
              this.totalReps++;
              this.lastRepTimestamp = timestamp;
              repJustCounted = true;

              const fullContraction = this.minElbowAngleInRep <= this.CONTRACTED_ANGLE;

              if (fullContraction) {
                this.correctReps++;
                this.lastRepValid = true;
                feedback = "Great curl! Clean range of motion";
                formScore = 100;
              } else {
                this.formWarnings++;
                this.lastRepValid = false;
                issues.push({
                  type: "contraction",
                  severity: "warning",
                  message: `Reached ${this.minElbowAngleInRep}°. Curl closer to shoulder (<= 60°)`,
                });
                feedback = "Rep counted: Complete full curl next time";
                formScore = 75;
              }
            }
          }
          this.phase = "extended";
        } else {
          feedback = "Lower arm all the way down to full extension";
        }
        break;
    }

    return {
      exercise: "bicep_curl",
      phase: this.phase,
      totalReps: this.totalReps,
      correctReps: this.correctReps,
      formWarnings: this.formWarnings,
      lastRepValid: this.lastRepValid,
      currentAngle: elbowAngle,
      targetAngleRange: [40, 60],
      feedback,
      formScore,
      isBodyVisible: true,
      issues,
      activeSide,
      repJustCounted,
    };
  }
}


// ============================================================================
// 5. DETECTOR FACTORY & REGISTRY
// ============================================================================

export function createExerciseDetector(type: ExerciseType): IExerciseDetector {
  switch (type) {
    case "squat":
      return new SquatDetector();
    case "pushup":
      return new PushupDetector();
    case "bicep_curl":
      return new BicepCurlDetector();
    default:
      throw new Error(`Unsupported exercise type: ${type}`);
  }
}

/**
 * Metadata for UI selectors and instructional guidance.
 */
export const EXERCISE_CONFIGS: Record<
  ExerciseType,
  {
    id: ExerciseType;
    label: string;
    description: string;
    targetMuscle: string;
    targetAngleDesc: string;
    cameraSetupTip: string;
    metValue: number; // Approximate Metabolic Equivalent of Task for calorie burn
  }
> = {
  squat: {
    id: "squat",
    label: "Bodyweight Squats",
    description: "Compound lower-body exercise targeting quadriceps, glutes, and core stability.",
    targetMuscle: "Quads & Glutes",
    targetAngleDesc: "Knee bend: parallel to floor (<= 100°)",
    cameraSetupTip: "Step back 6–8 feet so your full body from head to feet is visible in frame.",
    metValue: 5.0,
  },
  pushup: {
    id: "pushup",
    label: "Standard Push-ups",
    description: "Upper body pushing movement building chest, triceps, and anterior shoulder stamina.",
    targetMuscle: "Chest & Triceps",
    targetAngleDesc: "Elbow bend: 90° at bottom",
    cameraSetupTip: "Place device on floor or low table with side-profile view of your plank line.",
    metValue: 8.0,
  },
  bicep_curl: {
    id: "bicep_curl",
    label: "Bicep Curls",
    description: "Isolated arm flexor movement targeting the biceps brachii through full extension.",
    targetMuscle: "Biceps",
    targetAngleDesc: "Elbow flexion: <= 60° at peak contraction",
    cameraSetupTip: "Keep upper torso and full arm visible from shoulder to wrist.",
    metValue: 4.0,
  },
};

/**
 * Calculates estimated active calorie expenditure from camera workout session.
 */
export function calculateCameraSessionCalories(
  exercise: ExerciseType,
  durationMinutes: number,
  repsCount: number,
  userWeightKg = 70
): number {
  const met = EXERCISE_CONFIGS[exercise]?.metValue ?? 5.0;
  // Calorie formula: (MET * 3.5 * weightKg / 200) * minutes
  const timeMinutes = Math.max(0.5, durationMinutes);
  const baseCalories = (met * 3.5 * userWeightKg) / 200 * timeMinutes;
  // Add slight intensity boost proportional to total reps completed
  const repBoost = repsCount * 0.35;
  return Math.round(baseCalories + repBoost);
}
