-- AlterTable
ALTER TABLE "ExerciseProgress" ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ExerciseProgress" ADD COLUMN "lastAttemptAt" TIMESTAMP(3);
ALTER TABLE "ExerciseProgress" ADD COLUMN "attemptCountAtLastHint" INTEGER NOT NULL DEFAULT 0;

-- Grandfather existing unlocks so learners are not locked behind new attempt gates.
UPDATE "ExerciseProgress"
SET
  "attemptCount" = GREATEST("hintsUsed", CASE WHEN "solutionViewed" THEN 1 ELSE 0 END),
  "attemptCountAtLastHint" = GREATEST("hintsUsed", CASE WHEN "solutionViewed" THEN 1 ELSE 0 END)
WHERE "hintsUsed" > 0 OR "solutionViewed" = true;
