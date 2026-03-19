import Redis from "ioredis";

import { env } from "@/lib/env";

let redisClient: Redis | null = null;
const memoryLastRun = new Map<string, number>();

export function getRedisClient() {
  if (!env.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(env.redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return redisClient;
}

export async function withRedisLock<T>(
  key: string,
  ttlMs: number,
  task: () => Promise<T>,
): Promise<{ acquired: boolean; value?: T }> {
  const client = getRedisClient();

  if (!client) {
    return {
      acquired: true,
      value: await task(),
    };
  }

  const token = `${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const acquired = await client.set(key, token, "PX", ttlMs, "NX");

  if (acquired !== "OK") {
    return {
      acquired: false,
    };
  }

  try {
    return {
      acquired: true,
      value: await task(),
    };
  } finally {
    try {
      const currentToken = await client.get(key);
      if (currentToken === token) {
        await client.del(key);
      }
    } catch {
      // Best-effort release. Expiry still clears the lock if Redis is unavailable.
    }
  }
}

export async function runIntervalTask<T>(
  key: string,
  intervalMs: number,
  lockTtlMs: number,
  task: () => Promise<T>,
): Promise<{ ran: boolean; value?: T; reason?: "busy" | "interval" }> {
  const client = getRedisClient();
  const now = Date.now();

  if (!client) {
    const lastRunAt = memoryLastRun.get(key) ?? 0;
    if (now - lastRunAt < intervalMs) {
      return {
        ran: false,
        reason: "interval",
      };
    }

    const value = await task();
    memoryLastRun.set(key, now);
    return {
      ran: true,
      value,
    };
  }

  const lockKey = `${key}:lock`;
  const lastRunKey = `${key}:last-run`;
  const token = `${process.pid}-${now}-${Math.random().toString(36).slice(2)}`;
  const acquired = await client.set(lockKey, token, "PX", lockTtlMs, "NX");

  if (acquired !== "OK") {
    return {
      ran: false,
      reason: "busy",
    };
  }

  try {
    const lastRunRaw = await client.get(lastRunKey);
    const lastRunAt = lastRunRaw ? Number(lastRunRaw) : 0;

    if (now - lastRunAt < intervalMs) {
      return {
        ran: false,
        reason: "interval",
      };
    }

    const value = await task();
    await client.set(lastRunKey, String(now));

    return {
      ran: true,
      value,
    };
  } finally {
    try {
      const currentToken = await client.get(lockKey);
      if (currentToken === token) {
        await client.del(lockKey);
      }
    } catch {
      // Best-effort release. Lock expiry still prevents deadlocks.
    }
  }
}
