/**
 * T503 — Repositories Drizzle des relevés propriétaires et de leurs envois.
 *
 * Isolation tenant : toutes les opérations passent par `withTenant()` qui
 * positionne `app.tenant_id` ; les policies RLS des tables
 * `releves_proprietaires` et `envois_releves` filtrent en défense profonde.
 *
 * Idempotence :
 * - un relevé est unique par (tenant, propriétaire, moisDebut, periode) :
 *   un rejeu de génération retourne le relevé existant (`cree: false`) ;
 * - un envoi est unique par (tenant, envoiRef) : un rejeu d'envoi ne
 *   duplique pas la trace.
 */
import { and, desc, eq, gte, lte } from "drizzle-orm";
import type {
  EnvoiReleve,
  EnvoisRelevesRepository,
  RelevesRepository,
} from "@/application/ports/releves-repository";
import type {
  LigneReleve,
  PeriodeReleve,
  ReleveProprietaire,
} from "@/domain/releve-proprietaire";
import { withTenant } from "../client";
import {
  envoisReleves,
  relevesProprietaires,
  type EnvoiReleveRow,
  type ReleveProprietaireRow,
} from "../schema";

function versReleve(row: ReleveProprietaireRow): ReleveProprietaire {
  return {
    id: row.id,
    tenantId: row.tenantId,
    proprietaireId: row.proprietaireId,
    proprietaireNom: row.proprietaireNom,
    moisDebut: row.moisDebut,
    moisFin: row.moisFin,
    periode: row.periode as PeriodeReleve,
    lignes: (row.lignes ?? []) as LigneReleve[],
    totalCaCentimes: row.totalCaCentimes,
    totalCommissionCentimes: row.totalCommissionCentimes,
    totalChargesCentimes: row.totalChargesCentimes,
    totalNetCentimes: row.totalNetCentimes,
    genereAt: row.genereAt.toISOString(),
  };
}

function versEnvoi(row: EnvoiReleveRow): EnvoiReleve {
  return {
    id: row.id,
    tenantId: row.tenantId,
    releveId: row.releveId,
    proprietaireId: row.proprietaireId,
    canal: row.canal as EnvoiReleve["canal"],
    destinataire: row.destinataire,
    envoiRef: row.envoiRef,
    envoyeAt: row.envoyeAt.toISOString(),
    statut: row.statut as EnvoiReleve["statut"],
    erreur: row.erreur,
  };
}

export class DrizzleRelevesProprietairesRepository
  implements RelevesRepository
{
  async enregistrer(
    tenantId: string,
    releve: ReleveProprietaire,
  ): Promise<{ id: string; cree: boolean }> {
    return withTenant(tenantId, async (tx) => {
      const inseres = await tx
        .insert(relevesProprietaires)
        .values({
          tenantId,
          proprietaireId: releve.proprietaireId,
          proprietaireNom: releve.proprietaireNom,
          moisDebut: releve.moisDebut,
          moisFin: releve.moisFin,
          periode: releve.periode,
          lignes: [...releve.lignes],
          totalCaCentimes: releve.totalCaCentimes,
          totalCommissionCentimes: releve.totalCommissionCentimes,
          totalChargesCentimes: releve.totalChargesCentimes,
          totalNetCentimes: releve.totalNetCentimes,
          genereAt: new Date(releve.genereAt),
        })
        .onConflictDoNothing({
          target: [
            relevesProprietaires.tenantId,
            relevesProprietaires.proprietaireId,
            relevesProprietaires.moisDebut,
            relevesProprietaires.periode,
          ],
        })
        .returning({ id: relevesProprietaires.id });
      const premier = inseres[0];
      if (premier) return { id: premier.id, cree: true };

      // Rejeu : le relevé existe déjà pour cette période.
      const [existant] = await tx
        .select()
        .from(relevesProprietaires)
        .where(
          and(
            eq(relevesProprietaires.tenantId, tenantId),
            eq(relevesProprietaires.proprietaireId, releve.proprietaireId),
            eq(relevesProprietaires.moisDebut, releve.moisDebut),
            eq(relevesProprietaires.periode, releve.periode),
          ),
        )
        .limit(1);
      if (!existant) {
        throw new Error("Relevé introuvable après conflit d'unicité.");
      }
      return { id: existant.id, cree: false };
    });
  }

  async trouverParId(
    tenantId: string,
    releveId: string,
  ): Promise<ReleveProprietaire | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(relevesProprietaires)
        .where(
          and(
            eq(relevesProprietaires.tenantId, tenantId),
            eq(relevesProprietaires.id, releveId),
          ),
        )
        .limit(1);
      return row ? versReleve(row) : null;
    });
  }

  async trouverParPeriode(
    tenantId: string,
    proprietaireId: string,
    moisDebut: string,
    periode: string,
  ): Promise<ReleveProprietaire | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(relevesProprietaires)
        .where(
          and(
            eq(relevesProprietaires.tenantId, tenantId),
            eq(relevesProprietaires.proprietaireId, proprietaireId),
            eq(relevesProprietaires.moisDebut, moisDebut),
            eq(relevesProprietaires.periode, periode),
          ),
        )
        .limit(1);
      return row ? versReleve(row) : null;
    });
  }

  async listerParProprietaire(
    tenantId: string,
    proprietaireId: string,
    limite = 24,
  ): Promise<ReleveProprietaire[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(relevesProprietaires)
        .where(
          and(
            eq(relevesProprietaires.tenantId, tenantId),
            eq(relevesProprietaires.proprietaireId, proprietaireId),
          ),
        )
        .orderBy(desc(relevesProprietaires.genereAt))
        .limit(limite);
      return rows.map(versReleve);
    });
  }

  async listerParTenant(
    tenantId: string,
    options?: { moisDebut?: string; moisFin?: string },
  ): Promise<ReleveProprietaire[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(relevesProprietaires.tenantId, tenantId)];
      if (options?.moisDebut) {
        conditions.push(
          gte(relevesProprietaires.moisDebut, options.moisDebut),
        );
      }
      if (options?.moisFin) {
        conditions.push(lte(relevesProprietaires.moisDebut, options.moisFin));
      }
      const rows = await tx
        .select()
        .from(relevesProprietaires)
        .where(and(...conditions))
        .orderBy(desc(relevesProprietaires.genereAt))
        .limit(200);
      return rows.map(versReleve);
    });
  }
}

export class DrizzleEnvoisRelevesRepository implements EnvoisRelevesRepository {
  async enregistrer(
    tenantId: string,
    envoi: Omit<EnvoiReleve, "id">,
  ): Promise<{ id: string; cree: boolean }> {
    return withTenant(tenantId, async (tx) => {
      const inseres = await tx
        .insert(envoisReleves)
        .values({
          tenantId,
          releveId: envoi.releveId,
          proprietaireId: envoi.proprietaireId,
          canal: envoi.canal,
          destinataire: envoi.destinataire,
          envoiRef: envoi.envoiRef,
          envoyeAt: new Date(envoi.envoyeAt),
          statut: envoi.statut,
          erreur: envoi.erreur,
        })
        .onConflictDoNothing({
          target: [envoisReleves.tenantId, envoisReleves.envoiRef],
        })
        .returning({ id: envoisReleves.id });
      const premier = inseres[0];
      if (premier) return { id: premier.id, cree: true };

      const existant = await this.trouverParRefDans(tx, tenantId, envoi.envoiRef);
      if (!existant) {
        throw new Error("Envoi introuvable après conflit d'unicité.");
      }
      return { id: existant.id, cree: false };
    });
  }

  async listerParReleve(
    tenantId: string,
    releveId: string,
  ): Promise<EnvoiReleve[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(envoisReleves)
        .where(
          and(
            eq(envoisReleves.tenantId, tenantId),
            eq(envoisReleves.releveId, releveId),
          ),
        )
        .orderBy(desc(envoisReleves.envoyeAt))
        .limit(100);
      return rows.map(versEnvoi);
    });
  }

  async trouverParRef(
    tenantId: string,
    envoiRef: string,
  ): Promise<EnvoiReleve | null> {
    return withTenant(tenantId, async (tx) =>
      this.trouverParRefDans(tx, tenantId, envoiRef),
    );
  }

  async mettreAJourStatut(
    tenantId: string,
    envoiId: string,
    statut: EnvoiReleve["statut"],
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(envoisReleves)
        .set({ statut })
        .where(
          and(
            eq(envoisReleves.tenantId, tenantId),
            eq(envoisReleves.id, envoiId),
          ),
        );
    });
  }

  private async trouverParRefDans(
    tx: Parameters<Parameters<typeof withTenant>[1]>[0],
    tenantId: string,
    envoiRef: string,
  ): Promise<EnvoiReleve | null> {
    const [row] = await tx
      .select()
      .from(envoisReleves)
      .where(
        and(
          eq(envoisReleves.tenantId, tenantId),
          eq(envoisReleves.envoiRef, envoiRef),
        ),
      )
      .limit(1);
    return row ? versEnvoi(row) : null;
  }
}
