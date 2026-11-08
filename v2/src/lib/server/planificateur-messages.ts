import {
  DECLENCHEURS_DATES,
  dateDeclenchement,
  type Automatisation,
} from "@/domain/automatisation-message";
import { nuitsEntre } from "@/domain/calendrier";
import type { StatutReservation } from "@/domain/reservation";
import { dbAdmin, withTenant } from "@/infrastructure/db/client";
import {
  automatisations,
  logements,
  reservations,
  tenants,
} from "@/infrastructure/db/schema";
import { DrizzleAutomatisationsRepository } from "@/infrastructure/db/repositories/automatisations-repository";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { jourParis } from "@/lib/date-paris";
import { logErreur, logInfo } from "@/lib/logger";
import { ExecuterAutomatisation } from "@/application/use-cases/executer-automatisation";
import { OuvrirFil } from "@/application/use-cases/ouvrir-fil";
import { eq } from "drizzle-orm";

export interface ReservationPlanifiable {
  id: string;
  ref: string;
  logementId: string;
  logementNom: string;
  clientNom: string;
  clientEmail: string | null;
  debut: string;
  fin: string;
  statut: string;
}

export interface DeclenchementDu {
  automatisation: Automatisation;
  reservation: ReservationPlanifiable;
}

/** Statuts pour lesquels un message de séjour a du sens. */
export const STATUTS_PLANIFIABLES: readonly StatutReservation[] = [
  "confirmee",
  "en_sejour",
];

/**
 * Croise les automatisations datées avec les réservations pour une date
 * donnée. Fonction pure : facile à tester sans base.
 */
export function declenchementsDu(
  date: string,
  reservationsDuTenant: readonly ReservationPlanifiable[],
  automatisationsDuTenant: readonly Automatisation[],
): DeclenchementDu[] {
  const actives = automatisationsDuTenant.filter(
    (automatisation) =>
      automatisation.actif &&
      DECLENCHEURS_DATES.includes(automatisation.declencheur),
  );
  const resultats: DeclenchementDu[] = [];
  for (const automatisation of actives) {
    for (const reservation of reservationsDuTenant) {
      if (!STATUTS_PLANIFIABLES.includes(reservation.statut as StatutReservation)) {
        continue;
      }
      const cible = dateDeclenchement(
        automatisation.declencheur,
        reservation.debut,
        reservation.fin,
      );
      if (cible === date) resultats.push({ automatisation, reservation });
    }
  }
  return resultats;
}

export interface ResultatPlanification {
  tenants: number;
  candidats: number;
  brouillons: number;
  ignores: number;
  deja: number;
}

/**
 * Parcourt les tenants actifs et prépare les brouillons de messages dus
 * (J-7, J-1, arrivée, départ, J+1). Aucun envoi automatique : les brouillons
 * attendent une validation humaine dans l'inbox.
 */
export async function executerPlanificationMessages(
  options: { date?: string; tenantIds?: string[] } = {},
): Promise<ResultatPlanification> {
  const date = options.date ?? jourParis();
  const resultat: ResultatPlanification = {
    tenants: 0,
    candidats: 0,
    brouillons: 0,
    ignores: 0,
    deja: 0,
  };

  let cibles: { id: string }[] = [];
  if (options.tenantIds && options.tenantIds.length > 0) {
    cibles = options.tenantIds.map((id) => ({ id }));
  } else if (dbAdmin) {
    cibles = await dbAdmin
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.statut, "actif"));
  } else {
    throw new Error("Base d'administration indisponible pour la planification.");
  }

  for (const tenant of cibles) {
    resultat.tenants += 1;
    try {
      const { automatisationsActives, reservationsDuTenant } = await withTenant(
        tenant.id,
        async (tx) => {
          const lignesAutomatisations = await tx
            .select()
            .from(automatisations)
            .where(eq(automatisations.tenantId, tenant.id));
          const lignesReservations = await tx
            .select({
              id: reservations.id,
              ref: reservations.ref,
              logementId: reservations.logementId,
              logementNom: logements.nom,
              clientNom: reservations.clientNom,
              clientEmail: reservations.clientEmail,
              debut: reservations.debut,
              fin: reservations.fin,
              statut: reservations.statut,
            })
            .from(reservations)
            .innerJoin(logements, eq(logements.id, reservations.logementId))
            .where(eq(reservations.tenantId, tenant.id));
          return {
            automatisationsActives: lignesAutomatisations.map((row) => ({
              id: row.id,
              tenantId: row.tenantId,
              code: row.code,
              libelle: row.libelle,
              declencheur: row.declencheur,
              canal: row.canal,
              sujet: row.sujet,
              modele: row.modele,
              conditions: (row.conditions ?? {}) as Record<string, unknown>,
              actif: row.actif,
              createdAt: row.createdAt,
              updatedAt: row.updatedAt,
            })) as Automatisation[],
            reservationsDuTenant: lignesReservations.map((row) => ({
              ...row,
              clientNom: row.clientNom ?? "Voyageur",
            })) as ReservationPlanifiable[],
          };
        },
      );

      const du = declenchementsDu(date, reservationsDuTenant, automatisationsActives);
      resultat.candidats += du.length;
      if (du.length === 0) continue;

      const depotFils = new DrizzleFilsVoyageurRepository();
      const executeur = new ExecuterAutomatisation(
        new DrizzleAutomatisationsRepository(),
        depotFils,
        new OuvrirFil(depotFils),
      );

      for (const { automatisation, reservation } of du) {
        try {
          const execution = await executeur.executer({
            tenantId: tenant.id,
            automatisation,
            contexte: {
              reservationId: reservation.id,
              reference: reservation.ref,
              logementId: reservation.logementId,
              logementNom: reservation.logementNom,
              clientNom: reservation.clientNom,
              clientEmail: reservation.clientEmail,
              arrivee: reservation.debut,
              depart: reservation.fin,
              nuits: nuitsEntre(reservation.debut, reservation.fin),
              statutReservation: reservation.statut,
            },
          });
          if (!execution || execution.statut === "ignore") resultat.ignores += 1;
          else if (execution.statut === "deja_executee") resultat.deja += 1;
          else resultat.brouillons += 1;
        } catch (erreur) {
          logErreur("messages.planification.ligne", erreur, {
            tenantId: tenant.id,
            reservation: reservation.ref,
            automatisation: automatisation.code,
          });
        }
      }
    } catch (erreur) {
      logErreur("messages.planification.tenant", erreur, { tenantId: tenant.id });
    }
  }

  logInfo("messages.planification.fin", { ...resultat, date });
  return resultat;
}
