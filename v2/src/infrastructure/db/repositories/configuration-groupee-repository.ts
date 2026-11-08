import { and, desc, eq } from "drizzle-orm";
import type {
  ConfigurationGroupeeRepository,
  EnteteVersionConfig,
  ModificationConfig,
  VersionConfig,
} from "@/application/ports/configuration-groupee-repository";
import type {
  LigneDiffConfig,
  LogementReglages,
} from "@/domain/configuration-groupee";
import type { StrategiePrix } from "@/domain/strategie-prix";
import { withTenant } from "../client";
import { configVersions, logements } from "../schema";

function versLogement(
  row: typeof logements.$inferSelect,
): LogementReglages {
  return {
    logementId: row.id,
    nom: row.nom,
    bufferJours: row.bufferJours,
    cutoffJours: row.cutoffJours,
    strategiePrix: row.strategiePrix as StrategiePrix,
  };
}

function versVersion(
  row: typeof configVersions.$inferSelect,
): VersionConfig {
  return {
    id: row.id,
    ref: row.ref,
    action: row.action === "restaurer" ? "restaurer" : "appliquer",
    auteurEmail: row.auteurEmail,
    lignes: row.lignes as LigneDiffConfig[],
    createdAt: row.createdAt,
  };
}

export class DrizzleConfigurationGroupeeRepository
  implements ConfigurationGroupeeRepository
{
  async listerLogements(tenantId: string): Promise<LogementReglages[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(logements)
        .where(eq(logements.tenantId, tenantId))
        .orderBy(logements.nom);
      return rows.map(versLogement);
    });
  }

  async appliquer(
    tenantId: string,
    modifications: readonly ModificationConfig[],
    entete: EnteteVersionConfig,
  ): Promise<VersionConfig> {
    return withTenant(tenantId, async (tx) => {
      for (const modification of modifications) {
        await tx
          .update(logements)
          .set({
            bufferJours: modification.valeurs.bufferJours,
            cutoffJours: modification.valeurs.cutoffJours,
            strategiePrix: modification.valeurs.strategiePrix,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(logements.tenantId, tenantId),
              eq(logements.id, modification.logementId),
            ),
          );
      }

      const [row] = await tx
        .insert(configVersions)
        .values({
          tenantId,
          ref: entete.ref,
          action: entete.action,
          auteurEmail: entete.auteurEmail,
          lignes: entete.lignes,
        })
        .returning();
      if (!row) throw new Error("Version de configuration non créée.");
      return versVersion(row);
    });
  }

  async listerVersions(
    tenantId: string,
    limite: number,
  ): Promise<VersionConfig[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(configVersions)
        .where(eq(configVersions.tenantId, tenantId))
        .orderBy(desc(configVersions.createdAt))
        .limit(Math.max(1, Math.min(limite, 50)));
      return rows.map(versVersion);
    });
  }

  async trouverVersion(
    tenantId: string,
    id: string,
  ): Promise<VersionConfig | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(configVersions)
        .where(
          and(
            eq(configVersions.tenantId, tenantId),
            eq(configVersions.id, id),
          ),
        )
        .limit(1);
      return row ? versVersion(row) : null;
    });
  }
}
