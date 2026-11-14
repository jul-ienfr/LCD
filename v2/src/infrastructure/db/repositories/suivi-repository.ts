import { and, count, desc, eq, gte, lt, sql } from "drizzle-orm";
import type {
  EnregistrerEvenementSuiviInput,
  EvenementSuiviStocke,
  ResumeSuivi,
  SuiviRepository,
} from "@/application/ports/suivi";
import {
  configurationSuiviVide,
  validerConfigurationSuivi,
  type ConfigurationSuivi,
  type Consentement,
} from "@/domain/suivi";
import { withTenant } from "../client";
import { suiviConfiguration, suiviEvenements, type SuiviEvenementRow } from "../schema";

function versEvenement(row: SuiviEvenementRow): EvenementSuiviStocke {
  return {
    id: row.id,
    tenantId: row.tenantId,
    visiteurId: row.visiteurId,
    sessionId: row.sessionId,
    type: row.type as EvenementSuiviStocke["type"],
    nom: row.nom,
    page: row.page,
    referrer: row.referrer,
    campagne: row.campagne,
    valeurCentimes: row.valeurCentimes,
    metadata: row.metadata,
    consentement: row.consentement as unknown as Consentement,
    creeLe: row.creeLe.toISOString(),
  };
}

export class DrizzleSuiviRepository implements SuiviRepository {
  async lireConfiguration(
    tenantId: string,
  ): Promise<ConfigurationSuivi | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(suiviConfiguration)
        .where(eq(suiviConfiguration.tenantId, tenantId))
        .limit(1);
      if (!row) return null;
      try {
        return validerConfigurationSuivi({
          ...(row.configuration as Partial<ConfigurationSuivi>),
          actif: row.actif,
        });
      } catch {
        return configurationSuiviVide();
      }
    });
  }

  async enregistrerConfiguration(
    tenantId: string,
    configuration: ConfigurationSuivi,
  ): Promise<void> {
    const validee = validerConfigurationSuivi(configuration);
    await withTenant(tenantId, async (tx) => {
      await tx
        .insert(suiviConfiguration)
        .values({
          tenantId,
          actif: validee.actif,
          configuration: validee as unknown as Record<string, unknown>,
          majLe: new Date(),
        })
        .onConflictDoUpdate({
          target: suiviConfiguration.tenantId,
          set: {
            actif: validee.actif,
            configuration: validee as unknown as Record<string, unknown>,
            majLe: new Date(),
          },
        });
    });
  }

  async enregistrerEvenement(
    input: EnregistrerEvenementSuiviInput,
  ): Promise<EvenementSuiviStocke> {
    return withTenant(input.tenantId, async (tx) => {
      const [row] = await tx
        .insert(suiviEvenements)
        .values({
          tenantId: input.tenantId,
          visiteurId: input.visiteurId,
          sessionId: input.sessionId,
          type: input.evenement.type,
          nom: input.evenement.nom,
          page: input.evenement.page,
          referrer: input.evenement.referrer,
          campagne: input.evenement.campagne as Record<string, string>,
          valeurCentimes: input.evenement.valeurCentimes,
          metadata: input.evenement.metadata,
          consentement:
            input.consentement as unknown as Record<string, string | boolean>,
          ipHash: input.ipHash,
          userAgent: input.userAgent,
        })
        .returning();
      if (!row) throw new Error("Événement de suivi non enregistré.");
      return versEvenement(row);
    });
  }

  async listerEvenements(
    tenantId: string,
    options: { limite?: number; type?: string | null } = {},
  ): Promise<EvenementSuiviStocke[]> {
    const limite = Math.max(1, Math.min(options.limite ?? 100, 500));
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(suiviEvenements.tenantId, tenantId)];
      if (options.type) {
        conditions.push(eq(suiviEvenements.type, options.type));
      }
      const rows = await tx
        .select()
        .from(suiviEvenements)
        .where(and(...conditions))
        .orderBy(desc(suiviEvenements.creeLe))
        .limit(limite);
      return rows.map(versEvenement);
    });
  }

  async resume(tenantId: string, depuis: string): Promise<ResumeSuivi> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({
          type: suiviEvenements.type,
          total: count(),
          revenu: sql<number>`coalesce(sum(${suiviEvenements.valeurCentimes}), 0)`,
        })
        .from(suiviEvenements)
        .where(
          and(
            eq(suiviEvenements.tenantId, tenantId),
            gte(suiviEvenements.creeLe, new Date(depuis)),
          ),
        )
        .groupBy(suiviEvenements.type);
      const [visiteurs] = await tx
        .select({
          total: sql<number>`count(distinct ${suiviEvenements.visiteurId})`,
        })
        .from(suiviEvenements)
        .where(
          and(
            eq(suiviEvenements.tenantId, tenantId),
            gte(suiviEvenements.creeLe, new Date(depuis)),
          ),
        );
      const parType: Record<string, number> = {};
      let total = 0;
      let revenuCentimes = 0;
      for (const row of rows) {
        const nombre = Number(row.total);
        parType[row.type] = nombre;
        total += nombre;
        revenuCentimes += Number(row.revenu ?? 0);
      }
      return {
        total,
        parType,
        visiteurs: Number(visiteurs?.total ?? 0),
        conversions:
          parType.conversion ?? 0,
        revenuCentimes,
      };
    });
  }

  async purgerAvant(tenantId: string, avant: string): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const supprimes = await tx
        .delete(suiviEvenements)
        .where(
          and(
            eq(suiviEvenements.tenantId, tenantId),
            lt(suiviEvenements.creeLe, new Date(avant)),
          ),
        )
        .returning({ id: suiviEvenements.id });
      return supprimes.length;
    });
  }
}
