import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

declare global {
  var __bagsArenaPrisma: PrismaClient | undefined;
  var __bagsArenaPrismaUrl: string | undefined;
  var __bagsArenaPool: Pool | undefined;
  var __bagsArenaPoolUrl: string | undefined;
}

function readPoolMax() {
  const fallback =
    process.env.VERCEL || process.env.GITHUB_ACTIONS || process.env.CI ? "1" : "5";
  const value = Number(process.env.DATABASE_POOL_MAX ?? fallback);

  if (!Number.isFinite(value) || value <= 0) {
    return Number(fallback);
  }

  return Math.floor(value);
}

function createPrismaClient(connectionString: string) {
  const pool =
    global.__bagsArenaPool && global.__bagsArenaPoolUrl === connectionString
      ? global.__bagsArenaPool
      : new Pool({
          connectionString,
          max: readPoolMax(),
          idleTimeoutMillis: 5_000,
          connectionTimeoutMillis: 10_000,
        });

  global.__bagsArenaPool = pool;
  global.__bagsArenaPoolUrl = connectionString;

  return new PrismaClient({
    adapter: new PrismaPg(pool),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }

  if (
    !global.__bagsArenaPrisma ||
    global.__bagsArenaPrismaUrl !== connectionString
  ) {
    global.__bagsArenaPrisma = createPrismaClient(connectionString);
    global.__bagsArenaPrismaUrl = connectionString;
  }

  return global.__bagsArenaPrisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    return getPrismaClient()[property as keyof PrismaClient];
  },
});
