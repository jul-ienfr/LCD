/**
 * US7 (T703) — Repository Drizzle des clés API.
 *
 * Toutes les opérations passent par `withTenant` sauf `trouverParHash`, qui
 * intervient avant que le tenant ne soit connu : elle appelle la fonction
 * `api_cle_par_hash` (SECURITY DEFINER, migration 0099), seule lecture
 * cross-tenant et strictement limitée à une empreinte.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import type { ClesApiRepository } from "@/application/ports/api-integrations";
import type { CleApi, ScopeApi } from "@/domain/cle-api";
import { db, withTenant } from "../client";
import { clesApi, type ClesApiRow } from "../schema";

function versCle(row: ClesApiRow): CleApi {
  return {
    id: row.id,
    tenantId: row.tenantId,
    nom: row.nom,
    prefixe: row.prefixe,
    hash: row.hash,
    scopes: row.scopes as ScopeApi[],
    expireLe: row.expireLe ? row.expireLe.toISOString() : null,
    creeLe: row.creeLe.toISOString(),
    dernierUsageLe: row.dernierUsageLe
      ? row.dernierUsageLe.toISOString()
      : null,
    revoqueLe: row.revoqueLe ? row.revoqueLe.toISOString() : null,
  };
}

interface LigneFonctionCle {
  id: string;
  tenant_id: string;
  nom: string;
  prefixe: string;
  scopes: string[] | null;
  expire_le: string | Date | null;
  dernier_usage_le: string | Date | null;
  revoque_le: string | Date | null;
  cree_le: string | Date;
}

function dateIso(valeur: string | Date | null): string | null {
  if (!valeur) return null;
  return valeur instanceof Date ? valeur.toISOString() : new Date(valeur).toISOString();
}

export class DrizzleClesApiRepository implements ClesApiRepository {
  async creer(
    tenantId: string,
    data: {
      nom: string;
      prefixe: string;
      hash: string;
      scopes: ScopeApi[];
      expireLe?: string | null;
    },
  ): Promise<CleApi> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .insert(clesApi)
        .values({
          tenantId,
          nom: data.nom,
          prefixe: data.prefixe,
          hash: data.hash,
          scopes: data.scopes,
          expireLe: data.expireLe ? new Date(data.expireLe) : null,
        })
        .returning();
      if (!row) throw new Error("Clé API non créée.");
      return versCle(row);
    });
  }

  async trouverParHash(hash: string): Promise<CleApi | null> {
    const rows = (await db.execute(
      sql`select * from public.api_cle_par_hash(${hash})`,
    )) as unknown as LigneFonctionCle[];
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      tenantId: row.tenant_id,
      nom: row.nom,
      prefixe: row.prefixe,
      hash,
      scopes: (row.scopes ?? []) as ScopeApi[],
      expireLe: dateIso(row.expire_le),
      creeLe: dateIso(row.cree_le) ?? new Date(0).toISOString(),
      dernierUsageLe: dateIso(row.dernier_usage_le),
      revoqueLe: dateIso(row.revoque_le),
    };
  }

  async trouverParId(tenantId: string, id: string): Promise<CleApi | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(clesApi)
        .where(and(eq(clesApi.tenantId, tenantId), eq(clesApi.id, id)))
        .limit(1);
      return row ? versCle(row) : null;
    });
  }

  async listerParTenant(tenantId: string): Promise<CleApi[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(clesApi)
        .where(eq(clesApi.tenantId, tenantId))
        .orderBy(desc(clesApi.creeLe))
        .limit(100);
      return rows.map(versCle);
    });
  }

  async marquerUsage(
    tenantId: string,
    id: string,
    quand?: string,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(clesApi)
        .set({ dernierUsageLe: new Date(quand ?? new Date().toISOString()) })
        .where(and(eq(clesApi.tenantId, tenantId), eq(clesApi.id, id)));
    });
  }

  async revoquer(
    tenantId: string,
    id: string,
    quand?: string,
  ): Promise<CleApi | null> {
    return withTenant(tenantId, async (tx) => {
      const [existant] = await tx
        .select()
        .from(clesApi)
        .where(and(eq(clesApi.tenantId, tenantId), eq(clesApi.id, id)))
        .limit(1);
      if (!existant) return null;
      if (existant.revoqueLe) return versCle(existant);

      const [row] = await tx
        .update(clesApi)
        .set({ revoqueLe: new Date(quand ?? new Date().toISOString()) })
        .where(and(eq(clesApi.tenantId, tenantId), eq(clesApi.id, id)))
        .returning();
      return row ? versCle(row) : null;
    });
  }
}
