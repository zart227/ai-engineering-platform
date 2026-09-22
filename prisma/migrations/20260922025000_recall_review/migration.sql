-- CreateTable
CREATE TABLE "RecallReview" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekSlug" TEXT NOT NULL,
    "itemIndex" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "nextReviewAt" TIMESTAMP(3) NOT NULL,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecallReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecallReview_userId_weekSlug_itemIndex_key" ON "RecallReview"("userId", "weekSlug", "itemIndex");

-- CreateIndex
CREATE INDEX "RecallReview_userId_nextReviewAt_idx" ON "RecallReview"("userId", "nextReviewAt");

-- AddForeignKey
ALTER TABLE "RecallReview" ADD CONSTRAINT "RecallReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
