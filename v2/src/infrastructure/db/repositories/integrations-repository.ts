/**
 * US7 (T703) — Repository Drizzle des intégrations partenaires par tenant.
 *
 * Upsert idempotent par (tenant, fournisseur) : réenregistrer une intégration
 * remplace sa configuration sans créer de doublon. `config` ne doit contenir
 * aucun secret : les tokens restent en variables d'environnement.
 */
import { and, asc, eq } from "drizzle-orm";
import type {
  FournisseurIntegration,
  IntegrationsRepository,
} from "@/application/ports/api-integrations";
import { withTenant } from "../client";
import { integrationsTenant, type IntegrationsTenantRow } from "../schema";

function versIntegration(row: IntegrationsTenantRow) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    fournisseur: row.fournisseur as FournisseurIntegration,
    actif: row.actif,
    config: row.config,
    creeLe: row.creeLe.toISOString(),
    majLe: row.majLe.toISOString(),
  };
}

export class DrizzleIntegrationsRepository implements IntegrationsRepository {
  async lister(tenantId: string) {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(integrationsTenant)
        .where(eq(integrationsTenant.tenantId, tenantId))
        .orderBy(asc(integrationsTenant.fournisseur));
      return rows.map(versIntegration);
    });
  }

  async trouver(tenantId: string, fournisseur: FournisseurIntegration) {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(integrationsTenant)
        .where(
          and(
            eq(integrationsTenant.tenantId, tenantId),
            eq(integrationsTenant.fournisseur, fournisseur),
          ),
        )
        .limit(1);
      return row ? versIntegration(row) : null;
    });
  }

  async enregistrer(
    tenantId: string,
    fournisseur: FournisseurIntegration,
    data: { actif: boolean; config: Record<string, unknown> },
  ) {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .insert(integrationsTenant)
        .values({
          tenantId,
          fournisseur,
          actif: data.actif,
          config: data.config,
        })
        .onConflictDoUpdate({
          target: [
            integrationsTenant.tenantId,
            integrationsTenant.fournisseur,
          ],
          set: {
            actif: data.actif,
            config: data.config,
            majLe: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Intégration non enregistrée.");
      return versIntegration(row);
    });
  }

  async supprimer(
    tenantId: string,
    fournisseur: FournisseurIntegration,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(integrationsTenant)
        .where(
          and(
            eq(integrationsTenant.tenantId, tenantId),
            eq(integrationsTenant.fournisseur, fournisseur),
          ),
        );
    });
  }
}
