/**
 * T515 — Repository Drizzle des paiements propriétaires (payouts).
 *
 * Isolation tenant : toutes les opérations passent par `withTenant()` qui
 * positionne `app.tenant_id` ; la policy RLS de la table
 * `paiements_proprietaires` filtre en défense profonde.
 *
 * Idempotence : un payout est unique par (tenant, ref) — un rejeu
 * d'enregistrement retourne le payout existant (`cree: false`).
 */
import { and, desc, eq } from "drizzle-orm";
import type {
  PaiementsProprietairesRepository,
} from "@/application/ports/paiements-proprietaires-repository";
import type {
  ModePayout,
  PayoutProprietaire,
  StatutPayout,
} from "@/domain/paiement-proprietaire";
import { withTenant } from "../client";
import {
  paiementsProprietaires,
  type PaiementProprietaireRow,
} from "../schema";

function versPayout(row: PaiementProprietaireRow): PayoutProprietaire {
  return {
    id: row.id,
    tenantId: row.tenantId,
    proprietaireId: row.proprietaireId,
    releveId: row.releveId,
    ref: row.ref,
    montantAttenduCentimes: row.montantAttenduCentimes,
    montantPayeCentimes: row.montantPayeCentimes,
    mode: row.mode as ModePayout,
    statut: row.statut as StatutPayout,
    datePaiement: row.datePaiement,
    note: row.note,
  };
}

export class DrizzlePaiementsProprietairesRepository
  implements PaiementsProprietairesRepository
{
  async enregistrer(
    tenantId: string,
    payout: PayoutProprietaire,
  ): Promise<{ id: string; cree: boolean }> {
    return withTenant(tenantId, async (tx) => {
      const inseres = await tx
        .insert(paiementsProprietaires)
        .values({
          tenantId,
          proprietaireId: payout.proprietaireId,
          releveId: payout.releveId,
          ref: payout.ref,
          montantAttenduCentimes: payout.montantAttenduCentimes,
          montantPayeCentimes: payout.montantPayeCentimes,
          mode: payout.mode,
          statut: payout.statut,
          datePaiement: payout.datePaiement,
          note: payout.note,
        })
        .onConflictDoNothing({
          target: [paiementsProprietaires.tenantId, paiementsProprietaires.ref],
        })
        .returning({ id: paiementsProprietaires.id });

      const premier = inseres[0];
      if (premier) return { id: premier.id, cree: true };

      // Rejeu : le payout existe déjà pour cette ref.
      const [existant] = await tx
        .select()
        .from(paiementsProprietaires)
        .where(
          and(
            eq(paiementsProprietaires.tenantId, tenantId),
            eq(paiementsProprietaires.ref, payout.ref),
          ),
        )
        .limit(1);

      if (!existant) {
        throw new Error("Payout introuvable après conflit d'unicité.");
      }
      return { id: existant.id, cree: false };
    });
  }

  async trouverParId(
    tenantId: string,
    payoutId: string,
  ): Promise<PayoutProprietaire | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(paiementsProprietaires)
        .where(
          and(
            eq(paiementsProprietaires.tenantId, tenantId),
            eq(paiementsProprietaires.id, payoutId),
          ),
        )
        .limit(1);
      return row ? versPayout(row) : null;
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<PayoutProprietaire | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(paiementsProprietaires)
        .where(
          and(
            eq(paiementsProprietaires.tenantId, tenantId),
            eq(paiementsProprietaires.ref, ref),
          ),
        )
        .limit(1);
      return row ? versPayout(row) : null;
    });
  }

  async listerParProprietaire(
    tenantId: string,
    proprietaireId: string,
    limite = 50,
  ): Promise<PayoutProprietaire[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(paiementsProprietaires)
        .where(
          and(
            eq(paiementsProprietaires.tenantId, tenantId),
            eq(paiementsProprietaires.proprietaireId, proprietaireId),
          ),
        )
        .orderBy(desc(paiementsProprietaires.createdAt))
        .limit(limite);
      return rows.map(versPayout);
    });
  }

  async listerParReleve(
    tenantId: string,
    releveId: string,
  ): Promise<PayoutProprietaire[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(paiementsProprietaires)
        .where(
          and(
            eq(paiementsProprietaires.tenantId, tenantId),
            eq(paiementsProprietaires.releveId, releveId),
          ),
        )
        .orderBy(desc(paiementsProprietaires.createdAt))
        .limit(20);
      return rows.map(versPayout);
    });
  }

  async listerParTenant(
    tenantId: string,
    options?: { statut?: PayoutProprietaire["statut"] },
  ): Promise<PayoutProprietaire[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(paiementsProprietaires.tenantId, tenantId)];
      if (options?.statut) {
        conditions.push(eq(paiementsProprietaires.statut, options.statut));
      }
      const rows = await tx
        .select()
        .from(paiementsProprietaires)
        .where(and(...conditions))
        .orderBy(desc(paiementsProprietaires.createdAt))
        .limit(200);
      return rows.map(versPayout);
    });
  }

  async mettreAJour(
    tenantId: string,
    payoutId: string,
    data: {
      statut: PayoutProprietaire["statut"];
      montantPayeCentimes?: number | null;
      datePaiement?: string | null;
      note?: string | null;
    },
  ): Promise<PayoutProprietaire | null> {
    return withTenant(tenantId, async (tx) => {
      const set: Record<string, unknown> = {
        statut: data.statut,
        updatedAt: new Date(),
      };
      if (data.montantPayeCentimes !== undefined) {
        set.montantPayeCentimes = data.montantPayeCentimes;
      }
      if (data.datePaiement !== undefined) {
        set.datePaiement = data.datePaiement;
      }
      if (data.note !== undefined) {
        set.note = data.note;
      }

      const [row] = await tx
        .update(paiementsProprietaires)
        .set(set)
        .where(
          and(
            eq(paiementsProprietaires.tenantId, tenantId),
            eq(paiementsProprietaires.id, payoutId),
          ),
        )
        .returning();
      return row ? versPayout(row) : null;
    });
  }
}
