/**
 * US8 (T807) — Parcours de réservation test guidé.
 *
 * Crée un séjour de test sur un logement actif, affiche le lien guide signé
 * (vérification du parcours voyageur), puis permet de l'annuler. Aucun impact
 * sur les réservations réelles : `source = "test"` et préfixe `TEST-`.
 */
import { redirect } from "@sveltejs/kit";
import { ajouterJours } from "@/domain/calendrier";
import { creerLienGuide } from "@/domain/guide-voyageur";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { jourParis } from "@/lib/date-paris";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const [logements, reservations] = await Promise.all([
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleReservationRepository().listerTous(tenantId),
  ]);
  const actifs = logements.filter((logement) => logement.statut === "actif");
  const parId = new Map(logements.map((logement) => [logement.id, logement]));
  const secret = env.BETTER_AUTH_SECRET ?? "";

  return {
    logements: actifs.map((logement) => ({ id: logement.id, nom: logement.nom })),
    demain: ajouterJours(jourParis(), 7),
    surlendemain: ajouterJours(jourParis(), 9),
    tests: reservations
      .filter(
        (reservation) =>
          reservation.source === "test" || reservation.ref.startsWith("TEST-"),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map((reservation) => ({
        id: reservation.id,
        ref: reservation.ref,
        logement: parId.get(reservation.logementId)?.nom ?? "Logement",
        debut: reservation.debut,
        fin: reservation.fin,
        statut: reservation.statut,
        lienGuide:
          secret &&
          parId.has(reservation.logementId) &&
          reservation.statut !== "annulee"
            ? `/guide/${creerLienGuide(secret, {
                tenantId,
                logementId: reservation.logementId,
                reservationId: reservation.id,
              })}`
            : null,
      })),
    cree: event.url.searchParams.get("cree"),
    annulee: event.url.searchParams.get("annulee"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const debut = texte(donnees, "debut");
    const fin = texte(donnees, "fin");
    const depot = new DrizzleReservationRepository();

    try {
      const logement = await new DrizzleLogementRepository().trouverParId(
        tenantId,
        logementId,
      );
      if (!logement) {
        redirect(303, "/hote/onboarding/reservation-test?erreur=logement");
      }
      if (!debut || !fin || fin <= debut) {
        redirect(303, "/hote/onboarding/reservation-test?erreur=dates");
      }
      const chevauche = await depot.chevauche(
        tenantId,
        logementId,
        debut,
        fin,
      );
      if (chevauche) {
        redirect(303, "/hote/onboarding/reservation-test?erreur=chevauchement");
      }

      const ref = `TEST-${Date.now().toString(36).toUpperCase()}`;
      const reservation = await depot.creer({
        tenantId,
        logementId,
        ref,
        clientNom: "Voyageur test",
        voyageurs: 2,
        debut,
        fin,
        montantCentimes: 0,
        source: "test",
        statut: "confirmee",
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "reservation.test_creer",
          cible: reservation.id,
          ref,
          payload: { logementId, debut, fin },
        }),
      );

      redirect(
        303,
        `/hote/onboarding/reservation-test?cree=${encodeURIComponent(ref)}`,
      );
    } catch (error) {
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/onboarding/reservation-test?erreur=${encodeURIComponent(error.message)}`,
        );
      }
      if (error && typeof error === "object" && "status" in error) throw error;
      logErreur("onboarding.reservation-test.creer", error, { tenantId });
      redirect(303, "/hote/onboarding/reservation-test?erreur=inattendu");
    }
  },

  annuler: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const reservationId = texte(donnees, "reservationId");
    if (!reservationId) {
      redirect(303, "/hote/onboarding/reservation-test");
    }

    try {
      const reservation = await new DrizzleReservationRepository().annuler(
        tenantId,
        reservationId,
      );
      if (reservation && reservation.source === "test") {
        await withTenant(tenantId, (tx) =>
          tx.insert(auditLogs).values({
            tenantId,
            qui: session.user.email,
            action: "reservation.test_annuler",
            cible: reservation.id,
            ref: reservation.ref,
            payload: {},
          }),
        );
      }
    } catch (error) {
      logErreur("onboarding.reservation-test.annuler", error, {
        tenantId,
        reservationId,
      });
      redirect(303, "/hote/onboarding/reservation-test?erreur=inattendu");
    }

    redirect(303, "/hote/onboarding/reservation-test?annulee=1");
  },
} satisfies Actions;
