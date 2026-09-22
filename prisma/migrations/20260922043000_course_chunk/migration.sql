CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "CourseChunk" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "weekSlug" TEXT,
    "title" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseChunk_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseChunk_embedding_idx" ON "CourseChunk" USING hnsw ("embedding" vector_cosine_ops);
