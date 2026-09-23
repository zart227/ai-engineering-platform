-- CreateTable
CREATE TABLE "ArtifactAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekSlug" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'self_check',
    "score" INTEGER NOT NULL DEFAULT 0,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "assessedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtifactAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RubricCriterionResult" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "criterionId" TEXT NOT NULL,
    "met" BOOLEAN NOT NULL DEFAULT false,
    "evidence" TEXT NOT NULL DEFAULT '',
    "weight" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RubricCriterionResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtifactAssessment_userId_passed_idx" ON "ArtifactAssessment"("userId", "passed");

-- CreateIndex
CREATE UNIQUE INDEX "ArtifactAssessment_userId_weekSlug_key" ON "ArtifactAssessment"("userId", "weekSlug");

-- CreateIndex
CREATE UNIQUE INDEX "RubricCriterionResult_assessmentId_criterionId_key" ON "RubricCriterionResult"("assessmentId", "criterionId");

-- AddForeignKey
ALTER TABLE "ArtifactAssessment" ADD CONSTRAINT "ArtifactAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RubricCriterionResult" ADD CONSTRAINT "RubricCriterionResult_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "ArtifactAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing completed artifacts keep week progress via explicit policy-approved state.
INSERT INTO "ArtifactAssessment" ("id", "userId", "weekSlug", "source", "score", "passed", "assessedAt", "updatedAt", "createdAt")
SELECT
  'legacy_' || "id",
  "userId",
  "weekSlug",
  'policy_approved',
  100,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "ArtifactProgress"
WHERE "completed" = true;
