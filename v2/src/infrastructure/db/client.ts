import { sql as drizzleSql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  sql?: ReturnType<typeof postgres>;
};

// prepare: false = compatible PgBouncer / Neon pooler.
export const sql =
  globalForDb.sql ??
  postgres(env.DATABASE_URL, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });

if (env.NODE_ENV !== "production") globalForDb.sql = sql;

export const db = drizzle(sql, { schema });
export type Db = typeof db;

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
