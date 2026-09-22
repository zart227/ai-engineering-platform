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

/** Postgres-backed counter for auth paths; survives restarts and shares state across instances. */
export async function rateLimitPersisted(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + windowMs);

  return prisma.$transaction(async (tx) => {
    const current = await tx.rateLimitBucket.findUnique({ where: { key } });
    if (!current || current.resetAt < now) {
      await tx.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt: windowEnd },
        update: { count: 1, resetAt: windowEnd },
      });
      return { ok: true, remaining: limit - 1 };
    }
    if (current.count >= limit) {
      return { ok: false, remaining: 0 };
    }
    const updated = await tx.rateLimitBucket.update({
      where: { key },
      data: { count: current.count + 1 },
    });
    return { ok: true, remaining: limit - updated.count };
  });
}
