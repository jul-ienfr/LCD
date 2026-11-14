/**
 * T608 — Repository Drizzle des demandes d'extras voyageur.
 *
 * Isolation tenant : toutes les opérations passent par `withTenant()` qui
 * positionne `app.tenant_id` ; la policy RLS de la table `demandes_extra`
 * filtre en défense profonde.
 *
 * Idempotence : une demande est unique par (tenant, ref) — un rejeu
 * d'enregistrement retourne la demande existante (`cree: false`).
 */
import { and, desc, eq } from "drizzle-orm";
import type {
  DemandesExtraRepository,
  FiltreDemandesExtra,
} from "@/application/ports/demandes-extra-repository";
import type {
  DemandeExtra,
  StatutDemandeExtra,
  TypeExtra,
} from "@/domain/demande-extra";
import { withTenant } from "../client";
import { demandesExtra, type DemandeExtraRow } from "../schema";

function versDemande(row: DemandeExtraRow): DemandeExtra {
  return {
    id: row.id,
    ref: row.ref,
    reservationId: row.reservationId,
    logementId: row.logementId,
    type: row.type as TypeExtra,
    prixCentimes: row.prixCentimes,
    message: row.message,
    statut: row.statut as StatutDemandeExtra,
    creeLe: row.creeLe.toISOString(),
    decideeLe: row.decideeLe ? row.decideeLe.toISOString() : null,
    decideePar: row.decideePar,
    motifRefus: row.motifRefus,
  };
}

export class DrizzleDemandesExtraRepository implements DemandesExtraRepository {
  async enregistrer(
    tenantId: string,
    demande: DemandeExtra,
  ): Promise<{ id: string; cree: boolean }> {
    return withTenant(tenantId, async (tx) => {
      const inseres = await tx
        .insert(demandesExtra)
        .values({
          tenantId,
          logementId: demande.logementId,
          reservationId: demande.reservationId,
          ref: demande.ref,
          type: demande.type,
          prixCentimes: demande.prixCentimes,
          message: demande.message,
          statut: demande.statut,
          creeLe: new Date(demande.creeLe),
          decideeLe: demande.decideeLe ? new Date(demande.decideeLe) : null,
          decideePar: demande.decideePar,
          motifRefus: demande.motifRefus,
        })
        .onConflictDoNothing({
          target: [demandesExtra.tenantId, demandesExtra.ref],
        })
        .returning({ id: demandesExtra.id });

      const premier = inseres[0];
      if (premier) return { id: premier.id, cree: true };

      // Rejeu : la demande existe déjà pour cette ref.
      const [existant] = await tx
        .select()
        .from(demandesExtra)
        .where(
          and(
            eq(demandesExtra.tenantId, tenantId),
            eq(demandesExtra.ref, demande.ref),
          ),
        )
        .limit(1);

      if (!existant) {
        throw new Error("Demande extra introuvable après conflit d'unicité.");
      }
      return { id: existant.id, cree: false };
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<DemandeExtra | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(demandesExtra)
        .where(
          and(
            eq(demandesExtra.tenantId, tenantId),
            eq(demandesExtra.id, id),
          ),
        )
        .limit(1);
      return row ? versDemande(row) : null;
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<DemandeExtra | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(demandesExtra)
        .where(
          and(
            eq(demandesExtra.tenantId, tenantId),
            eq(demandesExtra.ref, ref),
          ),
        )
        .limit(1);
      return row ? versDemande(row) : null;
    });
  }

  async lister(
    tenantId: string,
    filtre?: FiltreDemandesExtra,
  ): Promise<DemandeExtra[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(demandesExtra.tenantId, tenantId)];
      if (filtre?.logementId) {
        conditions.push(eq(demandesExtra.logementId, filtre.logementId));
      }
      if (filtre?.reservationId) {
        conditions.push(eq(demandesExtra.reservationId, filtre.reservationId));
      }
      if (filtre?.statut) {
        conditions.push(eq(demandesExtra.statut, filtre.statut));
      }
      const rows = await tx
        .select()
        .from(demandesExtra)
        .where(and(...conditions))
        .orderBy(desc(demandesExtra.creeLe))
        .limit(200);
      return rows.map(versDemande);
    });
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<DemandeExtra[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(demandesExtra)
        .where(
          and(
            eq(demandesExtra.tenantId, tenantId),
            eq(demandesExtra.reservationId, reservationId),
          ),
        )
        .orderBy(desc(demandesExtra.creeLe))
        .limit(50);
      return rows.map(versDemande);
    });
  }

  async marquerStatut(
    tenantId: string,
    id: string,
    statut: StatutDemandeExtra,
    options: {
      par: string;
      motifRefus?: string | null;
      maintenant?: string;
    },
  ): Promise<DemandeExtra | null> {
    return withTenant(tenantId, async (tx) => {
      const maintenant = options.maintenant ?? new Date().toISOString();
      const [row] = await tx
        .update(demandesExtra)
        .set({
          statut,
          decideeLe: new Date(maintenant),
          decideePar: options.par,
          motifRefus: options.motifRefus ?? null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(demandesExtra.tenantId, tenantId),
            eq(demandesExtra.id, id),
          ),
        )
        .returning();
      return row ? versDemande(row) : null;
    });
  }
}
