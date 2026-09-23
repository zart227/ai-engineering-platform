/** Minimum trimmed practice body length to count as a meaningful attempt. */
export const MEANINGFUL_ATTEMPT_MIN_CHARS = 8;

export type ProgressionState = {
  hintsUsed: number;
  solutionViewed: boolean;
  attemptCount: number;
  attemptCountAtLastHint: number;
};

export function isMeaningfulAttemptBody(body: string) {
  return body.trim().length >= MEANINGFUL_ATTEMPT_MIN_CHARS;
}

export function shouldCountAttempt(previousBody: string | null | undefined, nextBody: string) {
  if (!isMeaningfulAttemptBody(nextBody)) return false;
  if (previousBody == null) return true;
  return previousBody.trim() !== nextBody.trim();
}

/**
 * Next hint unlocks only after a new meaningful attempt since the last hint
 * (or since start when no hints unlocked yet).
 */
export function canUnlockNextHint(state: ProgressionState, hintTotal: number) {
  if (hintTotal <= 0) return false;
  if (state.hintsUsed >= hintTotal) return false;
  return state.attemptCount > state.attemptCountAtLastHint;
}

/**
 * Solution unlocks after all hints are revealed. If the exercise has zero hints,
 * at least one meaningful attempt is required.
 */
export function canUnlockSolution(state: ProgressionState, hintTotal: number) {
  if (state.solutionViewed) return true;
  if (hintTotal <= 0) return state.attemptCount >= 1;
  return state.hintsUsed >= hintTotal;
}

/** Grandfather legacy rows that predate attempt fields. */
export function normalizeProgressionState(raw: {
  hintsUsed: number;
  solutionViewed: boolean;
  attemptCount: number;
  attemptCountAtLastHint: number;
}): ProgressionState {
  let attemptCount = raw.attemptCount;
  let attemptCountAtLastHint = raw.attemptCountAtLastHint;
  if (raw.hintsUsed > 0 && attemptCount === 0) {
    attemptCount = raw.hintsUsed;
    attemptCountAtLastHint = raw.hintsUsed;
  }
  if (raw.solutionViewed && attemptCount === 0) {
    attemptCount = Math.max(raw.hintsUsed, 1);
    attemptCountAtLastHint = Math.max(raw.hintsUsed, attemptCountAtLastHint);
  }
  return {
    hintsUsed: raw.hintsUsed,
    solutionViewed: raw.solutionViewed,
    attemptCount,
    attemptCountAtLastHint,
  };
}
