import { PrismaClient } from "@prisma/client";

/**
 * Neon/Vercel Postgres pooled endpoints run PgBouncer in transaction mode,
 * which requires Prisma's `pgbouncer=true` flag (otherwise: "prepared
 * statement already exists" errors). The integration-managed DATABASE_URL
 * doesn't include it, so append it whenever the host is a pooler.
 */
function resolveDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  if (url.includes("pgbouncer=")) return url;
  const isPooled = /-pooler\./.test(url) || /pgbouncer/i.test(url);
  if (!isPooled) return url;
  return url + (url.includes("?") ? "&" : "?") + "pgbouncer=true&connect_timeout=15";
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: resolveDatabaseUrl() });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
