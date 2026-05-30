import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __kashmirPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__kashmirPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__kashmirPrisma__ = prisma;
}
