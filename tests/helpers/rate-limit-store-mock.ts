import { prisma } from "../../src/server/db";

type StoredBucket = { count: number; resetAt: Date };

export function installRateLimitStoreMock() {
  const buckets = new Map<string, StoredBucket>();
  const originalTransaction = prisma.$transaction;

  prisma.$transaction = (async (callback: unknown) => {
    const run = callback as (tx: {
      rateLimitBucket: {
        findUnique: (args: { where: { key: string } }) => Promise<{ key: string; count: number; resetAt: Date } | null>;
        upsert: (args: {
          where: { key: string };
          create: StoredBucket & { key: string };
          update: StoredBucket;
        }) => Promise<StoredBucket & { key: string }>;
        update: (args: { where: { key: string }; data: { count: number } }) => Promise<StoredBucket & { key: string }>;
      };
    }) => Promise<unknown>;
    const tx = {
      rateLimitBucket: {
        findUnique: async ({ where: { key } }: { where: { key: string } }) => {
          const bucket = buckets.get(key);
          return bucket ? { key, ...bucket } : null;
        },
        upsert: async ({
          where: { key },
          create,
          update,
        }: {
          where: { key: string };
          create: StoredBucket & { key: string };
          update: StoredBucket;
        }) => {
          const next = buckets.has(key) ? { key, ...update } : create;
          buckets.set(key, { count: next.count, resetAt: next.resetAt });
          return next;
        },
        update: async ({
          where: { key },
          data,
        }: {
          where: { key: string };
          data: { count: number };
        }) => {
          const current = buckets.get(key);
          if (!current) {
            throw new Error(`missing bucket: ${key}`);
          }
          const next = { ...current, count: data.count };
          buckets.set(key, next);
          return { key, ...next };
        },
      },
    };
    return run(tx);
  }) as unknown as typeof prisma.$transaction;

  return {
    buckets,
    restore() {
      prisma.$transaction = originalTransaction;
      buckets.clear();
    },
  };
}
