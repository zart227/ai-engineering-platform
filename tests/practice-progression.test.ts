import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canUnlockNextHint,
  canUnlockSolution,
  isMeaningfulAttemptBody,
  normalizeProgressionState,
  shouldCountAttempt,
} from "../src/server/practice-progression";

describe("practice progression", () => {
  it("requires a meaningful body change to count an attempt", () => {
    assert.equal(isMeaningfulAttemptBody("short"), false);
    assert.equal(isMeaningfulAttemptBody("длинная попытка"), true);
    assert.equal(shouldCountAttempt(null, "длинная попытка"), true);
    assert.equal(shouldCountAttempt("длинная попытка", "длинная попытка"), false);
    assert.equal(shouldCountAttempt("длинная попытка", "другая попытка!"), true);
  });

  it("blocks the next hint until a new attempt after the previous hint", () => {
    assert.equal(
      canUnlockNextHint(
        { hintsUsed: 0, solutionViewed: false, attemptCount: 0, attemptCountAtLastHint: 0 },
        3
      ),
      false
    );
    assert.equal(
      canUnlockNextHint(
        { hintsUsed: 0, solutionViewed: false, attemptCount: 1, attemptCountAtLastHint: 0 },
        3
      ),
      true
    );
    assert.equal(
      canUnlockNextHint(
        { hintsUsed: 1, solutionViewed: false, attemptCount: 1, attemptCountAtLastHint: 1 },
        3
      ),
      false
    );
    assert.equal(
      canUnlockNextHint(
        { hintsUsed: 1, solutionViewed: false, attemptCount: 2, attemptCountAtLastHint: 1 },
        3
      ),
      true
    );
  });

  it("blocks solution until all hints are unlocked", () => {
    assert.equal(
      canUnlockSolution(
        { hintsUsed: 2, solutionViewed: false, attemptCount: 3, attemptCountAtLastHint: 2 },
        3
      ),
      false
    );
    assert.equal(
      canUnlockSolution(
        { hintsUsed: 3, solutionViewed: false, attemptCount: 3, attemptCountAtLastHint: 3 },
        3
      ),
      true
    );
    assert.equal(
      canUnlockSolution(
        { hintsUsed: 0, solutionViewed: false, attemptCount: 0, attemptCountAtLastHint: 0 },
        0
      ),
      false
    );
    assert.equal(
      canUnlockSolution(
        { hintsUsed: 0, solutionViewed: false, attemptCount: 1, attemptCountAtLastHint: 0 },
        0
      ),
      true
    );
  });

  it("grandfathers legacy unlock rows without attempt counters", () => {
    const normalized = normalizeProgressionState({
      hintsUsed: 2,
      solutionViewed: false,
      attemptCount: 0,
      attemptCountAtLastHint: 0,
    });
    assert.equal(normalized.attemptCount, 2);
    assert.equal(normalized.attemptCountAtLastHint, 2);
    assert.equal(canUnlockNextHint(normalized, 3), false);
  });
});
