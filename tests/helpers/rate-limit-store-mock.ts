import { prisma } from "../../src/server/db";

type StoredBucket = { count: number; resetAt: Date };

type RateLimitTx = {
  rateLimitBucket: {
    findUnique: (args: { where: { key: string } }) => Promise<{ key: string; count: number; resetAt: Date } | null>;
    upsert: (args: {
      where: { key: string };
      create: StoredBucket & { key: string };
      update: Partial<StoredBucket>;
    }) => Promise<StoredBucket & { key: string }>;
    update: (args: {
      where: { key: string };
      data: Partial<StoredBucket> | { count: { increment: number } };
    }) => Promise<StoredBucket & { key: string }>;
    deleteMany: (args: { where: { resetAt: { lt: Date } } }) => Promise<{ count: number }>;
  };
  $queryRaw: (
    strings: TemplateStringsArray,
    ...values: unknown[]
  ) => Promise<Array<{ count: number; resetAt: Date }>>;
};

export function installRateLimitStoreMock() {
  const buckets = new Map<string, StoredBucket>();
  const keyLocks = new Map<string, Promise<void>>();
  const originalTransaction = prisma.$transaction;
  const originalDeleteMany = prisma.rateLimitBucket.deleteMany;

  async function acquireKeyLock(key: string): Promise<() => void> {
    const previous = keyLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    keyLocks.set(key, previous.then(() => gate));
    await previous;
    return release;
  }

  function createTx(heldLocks: Array<() => void>): RateLimitTx {
    return {
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
          update: Partial<StoredBucket>;
        }) => {
          if (buckets.has(key)) {
            if (Object.keys(update).length === 0) {
              const current = buckets.get(key)!;
              return { key, ...current };
            }
            const next = { ...buckets.get(key)!, ...update };
            buckets.set(key, next);
            return { key, ...next };
          }
          buckets.set(key, { count: create.count, resetAt: create.resetAt });
          return create;
        },
        update: async ({
          where: { key },
          data,
        }: {
          where: { key: string };
          data: Partial<StoredBucket> | { count: { increment: number } };
        }) => {
          const current = buckets.get(key);
          if (!current) {
            throw new Error(`missing bucket: ${key}`);
          }
          let nextCount = current.count;
          if ("count" in data && typeof data.count === "object" && data.count !== null && "increment" in data.count) {
            nextCount = current.count + data.count.increment;
          } else if ("count" in data && typeof data.count === "number") {
            nextCount = data.count;
          }
          const next = {
            count: nextCount,
            resetAt: "resetAt" in data && data.resetAt ? data.resetAt : current.resetAt,
          };
          buckets.set(key, next);
          return { key, ...next };
        },
        deleteMany: async ({ where: { resetAt } }: { where: { resetAt: { lt: Date } } }) => {
          let deleted = 0;
          for (const [key, bucket] of buckets.entries()) {
            if (bucket.resetAt < resetAt.lt) {
              buckets.delete(key);
              deleted += 1;
            }
          }
          return { count: deleted };
        },
      },
      $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
        const sql = strings.join("?");
        if (!sql.includes("FOR UPDATE") || !sql.includes("RateLimitBucket")) {
          throw new Error(`unsupported $queryRaw: ${sql}`);
        }
        const key = values[0] as string;
        const release = await acquireKeyLock(key);
        heldLocks.push(release);
        const bucket = buckets.get(key);
        return bucket ? [{ count: bucket.count, resetAt: bucket.resetAt }] : [];
      },
    };
  }

  prisma.$transaction = (async (callback: unknown) => {
    const run = callback as (tx: RateLimitTx) => Promise<unknown>;
    const heldLocks: Array<() => void> = [];
    try {
      return await run(createTx(heldLocks));
    } finally {
      for (const release of heldLocks.reverse()) {
        release();
      }
    }
  }) as unknown as typeof prisma.$transaction;

  prisma.rateLimitBucket.deleteMany = (async (args: { where: { resetAt: { lt: Date } } }) => {
    return createTx([]).rateLimitBucket.deleteMany(args);
  }) as unknown as typeof prisma.rateLimitBucket.deleteMany;

  return {
    buckets,
    restore() {
      prisma.$transaction = originalTransaction;
      prisma.rateLimitBucket.deleteMany = originalDeleteMany;
      buckets.clear();
      keyLocks.clear();
    },
  };
}
