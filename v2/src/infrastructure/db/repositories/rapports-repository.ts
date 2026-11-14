/**
 * T504 — Implémentation Drizzle du port `RapportsRepository`.
 *
 * Isolation tenant : toutes les lectures passent par `withTenant()` qui
 * positionne `app.tenant_id` ; les policies RLS filtrent en défense profonde.
 * Les requêtes restent de simples projections : aucun calcul métier n'est
 * fait ici (il vit dans `src/domain/releve-proprietaire.ts`).
 */
import { and, eq, gt, lt } from "drizzle-orm";
import type {
  LogementAvecMandat,
  RapportsRepository,
  ReservationPeriodeRapport,
} from "@/application/ports/rapports-repository";
import { withTenant } from "../client";
import {
  logementProprietaires,
  logements,
  reservations,
  users,
} from "../schema";

export class DrizzleRapportsRepository implements RapportsRepository {
  async listerReservationsPeriode(
    tenantId: string,
    premierJour: string,
    dernierJourExclu: string,
  ): Promise<ReservationPeriodeRapport[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({
          logementId: reservations.logementId,
          debut: reservations.debut,
          fin: reservations.fin,
          statut: reservations.statut,
          montantCentimes: reservations.montantCentimes,
          source: reservations.source,
        })
        .from(reservations)
        .where(
          and(
            eq(reservations.tenantId, tenantId),
            lt(reservations.debut, dernierJourExclu),
            gt(reservations.fin, premierJour),
          ),
        );
      return rows.map((row) => ({
        logementId: row.logementId,
        debut: row.debut,
        fin: row.fin,
        statut: row.statut,
        montantCentimes: row.montantCentimes,
        source: row.source,
      }));
    });
  }

  async listerLogementsAvecMandat(
    tenantId: string,
  ): Promise<LogementAvecMandat[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({
          logementId: logements.id,
          logementNom: logements.nom,
          proprietaireId: users.id,
          proprietaireNom: users.name,
          proprietaireEmail: users.email,
          commissionBp: logementProprietaires.commissionBp,
          chargesMensuellesCentimes:
            logementProprietaires.chargesMensuellesCentimes,
        })
        .from(logementProprietaires)
        .innerJoin(
          logements,
          and(
            eq(logements.id, logementProprietaires.logementId),
            eq(logements.tenantId, tenantId),
          ),
        )
        .innerJoin(
          users,
          and(
            eq(users.id, logementProprietaires.userId),
            eq(users.tenantId, tenantId),
          ),
        )
        .where(
          and(
            eq(logementProprietaires.tenantId, tenantId),
            eq(logementProprietaires.statut, "actif"),
          ),
        );
      return rows.map((row) => ({
        logementId: row.logementId,
        logementNom: row.logementNom,
        proprietaireId: row.proprietaireId,
        proprietaireNom: row.proprietaireNom,
        proprietaireEmail: row.proprietaireEmail,
        commissionBp: row.commissionBp,
        chargesMensuellesCentimes: row.chargesMensuellesCentimes,
      }));
    });
  }
}
