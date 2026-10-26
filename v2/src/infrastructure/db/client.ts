import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
  sqlAdmin?: ReturnType<typeof postgres>;
};

const options = (url: string) => ({
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
  ssl: url.includes("sslmode=require") ? ("require" as const) : false,
});

// prepare: false = compatible PgBouncer / Neon pooler.
export const sql =
  globalForDb.sql ??
  postgres(env.DATABASE_URL, { ...options(env.DATABASE_URL), max: 10 });

if (env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export type Db = typeof db;

/**
 * Connexion owner réservée aux pages super-admin (agrégats cross-tenant,
 * catalogue système). Absente en hébergement sans `MIGRATION_DATABASE_URL` :
 * les pages se dégradent alors proprement, elles ne basculent jamais sur la
 * connexion applicative filtrée par RLS.
 */
export const sqlAdmin = env.MIGRATION_DATABASE_URL
  ? (globalForDb.sqlAdmin ??
    postgres(env.MIGRATION_DATABASE_URL, options(env.MIGRATION_DATABASE_URL)))
  : null;

if (env.NODE_ENV !== "production" && sqlAdmin) {
  globalForDb.sqlAdmin = sqlAdmin;
}

export const dbAdmin = sqlAdmin ? drizzle(sqlAdmin, { schema }) : null;

/**
 * Exécute une opération dans une transaction avec `app.tenant_id` positionné.
 * Les policies RLS PostgreSQL peuvent alors filtrer par tenant, même si un
 * `where tenant_id` a été oublié dans une requête.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (tx: Db) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(
      drizzleSql`select set_config('app.tenant_id', ${tenantId}, true)`,
    );
    return fn(tx as unknown as Db);
  });
}
