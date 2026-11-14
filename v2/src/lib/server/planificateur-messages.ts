import {
  DECLENCHEURS_DATES,
  dateDeclenchement,
  type Automatisation,
} from "@/domain/automatisation-message";
import { nuitsEntre } from "@/domain/calendrier";
import type { StatutReservation } from "@/domain/reservation";
import { creerLienGuide, expirationLienGuide } from "@/domain/guide-voyageur";
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
import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";
import {
  CreerAccesSerrure,
  type CreerAccesSerrureInput,
  type ResultatCreerAccesSerrure,
} from "@/application/use-cases/creer-acces-serrure";
import { ExecuterAutomatisation } from "@/application/use-cases/executer-automatisation";
import { InviterAvisVoyageur } from "@/application/use-cases/gerer-avis-voyageur";
import { OuvrirFil } from "@/application/use-cases/ouvrir-fil";
import type { AccesSerrureRepository } from "@/application/ports/guides-repository";
import type { SerrureConnecteePort } from "@/application/ports/serrure-connectee";
import { DrizzleAvisVoyageurRepository } from "@/infrastructure/db/repositories/avis-voyageur-repository";
import { DrizzleAccesSerrureRepository } from "@/infrastructure/db/repositories/guides-repository";
import { creerSerrureNuki } from "@/infrastructure/adapters/serrures/nuki";
import { creerTokenVoyageur } from "@/lib/voyageur-token";
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
  /** Codes d'accès préparés (ou retrouvés) à J-7 — T605. */
  accesSerrure: number;
}

export interface DependancesAccesArrivee {
  acces: AccesSerrureRepository;
  serrure: SerrureConnecteePort;
}

/**
 * T605 — Prépare le code d'accès d'un séjour qui arrive à J-7.
 *
 * Le code est dérivé d'une référence stable (`refAcces`) : un rejeu du job ne
 * reprogramme jamais un code déjà posé, il retourne l'accès existant. Si la
 * serrure connectée est indisponible (ou échoue), `CreerAccesSerrure` bascule
 * en repli manuel : le voyageur a toujours un code.
 *
 * Cette fonction ne bloque **jamais** la préparation du message : toute erreur
 * est journalisée puis absorbée (`null`). C'est le seul contrat attendu par le
 * planificateur, qui ne doit pas perdre un message à cause d'une serrure.
 */
export async function preparerAccesArrivee(
  deps: DependancesAccesArrivee,
  input: CreerAccesSerrureInput,
): Promise<ResultatCreerAccesSerrure | null> {
  try {
    const acces = await new CreerAccesSerrure(deps.acces, deps.serrure).executer(
      input,
    );
    logInfo("messages.planification.serrure", {
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId ?? null,
      ref: acces.ref,
      fournisseur: acces.fournisseur,
      existant: acces.existant,
      repli: acces.fallback,
    });
    return acces;
  } catch (erreur) {
    logErreur("messages.planification.serrure", erreur, {
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId ?? null,
    });
    return null;
  }
}

/**
 * Parcourt les tenants actifs et prépare les brouillons de messages dus
 * (J-7, J-1, arrivée, départ, J+1). Aucun envoi automatique : les brouillons
 * attendent une validation humaine dans l'inbox.
 */
export async function executerPlanificationMessages(
  options: { date?: string; tenantIds?: string[]; simulation?: boolean } = {},
): Promise<ResultatPlanification> {
  const date = options.date ?? jourParis();
  const resultat: ResultatPlanification = {
    tenants: 0,
    candidats: 0,
    brouillons: 0,
    ignores: 0,
    deja: 0,
    accesSerrure: 0,
  };
  const depotAcces = new DrizzleAccesSerrureRepository();
  const serrure = creerSerrureNuki();

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
      if (options.simulation) continue;

      const depotFils = new DrizzleFilsVoyageurRepository();
      const executeur = new ExecuterAutomatisation(
        new DrizzleAutomatisationsRepository(),
        depotFils,
        new OuvrirFil(depotFils),
      );
      const avisRepo = new DrizzleAvisVoyageurRepository();
      const baseUrl = env.APP_URL.replace(/\/+$/, "");

      for (const { automatisation, reservation } of du) {
        try {
          // T605 : à J-7, on prépare le code d'accès du séjour dans le même
          // tick que les automatisations. Idempotent par `ref` (un rejeu ne
          // reprogramme pas de code) et jamais bloquant : sans identifiant de
          // serrure configuré, `choisirFournisseur` bascule en repli manuel et
          // le voyageur a malgré tout un code à son arrivée.
          if (automatisation.declencheur === "j-7") {
            const acces = await preparerAccesArrivee(
              { acces: depotAcces, serrure },
              {
                tenantId: tenant.id,
                logementId: reservation.logementId,
                reservationId: reservation.id,
                arrivee: reservation.debut,
                depart: reservation.fin,
              },
            );
            if (acces) resultat.accesSerrure += 1;
          }

          // T609 : l'invitation à laisser un avis est créée à J+1, de façon
          // idempotente (ref stable + unicité par réservation).
          if (automatisation.declencheur === "j+1") {
            try {
              await new InviterAvisVoyageur(avisRepo).executer({
                tenantId: tenant.id,
                reservationId: reservation.id,
                logementId: reservation.logementId,
                depart: reservation.fin,
              });
            } catch (erreur) {
              logErreur("messages.planification.avis", erreur, {
                tenantId: tenant.id,
                reservation: reservation.ref,
              });
            }
          }

          const jetonVoyageur = creerTokenVoyageur({
            tenantId: tenant.id,
            logementId: reservation.logementId,
            reservationId: reservation.id,
            exp: expirationLienGuide(reservation.fin),
          });
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
              lienGuide: `${baseUrl}/guide/${creerLienGuide(env.BETTER_AUTH_SECRET, {
                tenantId: tenant.id,
                logementId: reservation.logementId,
                reservationId: reservation.id,
                exp: expirationLienGuide(reservation.fin),
              })}`,
              lienAvis: `${baseUrl}/avis/${jetonVoyageur}`,
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
