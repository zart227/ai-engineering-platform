import { prisma } from "@/server/db";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { ok: boolean; remaining: number };

/** In-process counter for low-risk paths (e.g. tutor). */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (current.count >= limit) {
    return { ok: false, remaining: 0 };
  }
  current.count += 1;
  return { ok: true, remaining: limit - current.count };
}

/**
 * Postgres-backed counter for auth paths; survives restarts and shares state across instances.
 * Uses row-level locking (SELECT … FOR UPDATE) plus atomic increment to avoid read-modify-write races.
 */
export async function rateLimitPersisted(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  return prisma.$transaction(async (tx) => {
    await tx.rateLimitBucket.upsert({
      where: { key },
      create: { key, count: 0, resetAt: windowEnd },
      update: {},
    });

    const rows = await tx.$queryRaw<{ count: number; resetAt: Date }[]>`
      SELECT count, "resetAt" FROM "RateLimitBucket" WHERE key = ${key} FOR UPDATE
    `;
    const current = rows[0];
    if (!current) {
      return { ok: true, remaining: limit - 1 };
    }

    if (current.resetAt < now) {
      await tx.rateLimitBucket.update({
        where: { key },
        data: { count: 1, resetAt: windowEnd },
      });
      return { ok: true, remaining: limit - 1 };
    }

    if (current.count >= limit) {
      return { ok: false, remaining: 0 };
    }

    const updated = await tx.rateLimitBucket.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { ok: true, remaining: limit - updated.count };
  });
}

/** Deletes buckets whose window has expired. Safe to run periodically (index on resetAt). */
export async function cleanupExpiredRateLimitBuckets(asOf: Date = new Date()): Promise<number> {
  const { count } = await prisma.rateLimitBucket.deleteMany({
    where: { resetAt: { lt: asOf } },
  });
  return count;
}
