import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  var __bagsArenaPrisma: PrismaClient | undefined;
  var __bagsArenaPrismaUrl: string | undefined;
}

function createPrismaClient(connectionString: string) {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
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
