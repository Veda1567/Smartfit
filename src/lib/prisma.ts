import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton instance for Next.js.
 * In development, prevents multiple instances from being created on hot-reload,
 * which avoids database connection pool exhaustion.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
