import { ajouterJours, joursDuMois } from "@/domain/calendrier";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { traductionsTableauBord } from "@/lib/i18n-dashboard";
import { lireApercu } from "@/lib/server/apercu";
import {
  estSuperAdmin,
  requireRole,
  tenantIdDeSession,
} from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const apercu = lireApercu(event, session);
  const tenantId = tenantIdDeSession(session);
  const roleEffectif = apercu?.role ?? session.user.role ?? "";
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const aujourdHui = new Date().toISOString().slice(0, 10);
  const mois = aujourdHui.slice(0, 7);
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois courant invalide.");

  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    ajouterJours(dernier, 1),
  );

  const caMois = reservations
    .filter((reservation) => reservation.statut !== "annulee")
    .reduce((total, reservation) => total + reservation.montantCentimes, 0);
  const dans7Jours = ajouterJours(aujourdHui, 7);
  const nomLogement = (id: string) =>
    logements.find((logement) => logement.id === id)?.nom ?? id;

  return {
    t: traductionsTableauBord(langue),
    langue,
    nom: session.user.name,
    email: session.user.email,
    roleEffectif,
    tenantId,
    apercu: Boolean(apercu),
    superAdmin: estSuperAdmin(session) && !apercu,
    stats: {
      logements: logements.filter((logement) => logement.statut !== "archive").length,
      reservations: reservations.length,
      caMois: formaterEuros(caMois),
    },
    arrivees: reservations
      .filter(
        (reservation) =>
          reservation.debut >= aujourdHui && reservation.debut <= dans7Jours,
      )
      .sort((a, b) => a.debut.localeCompare(b.debut))
      .map((reservation) => ({
        id: reservation.id,
        date: reservation.debut,
        logement: nomLogement(reservation.logementId),
        montant: formaterEuros(reservation.montantCentimes),
      })),
    departs: reservations
      .filter(
        (reservation) =>
          reservation.fin >= aujourdHui && reservation.fin <= dans7Jours,
      )
      .sort((a, b) => a.fin.localeCompare(b.fin))
      .map((reservation) => ({
        id: reservation.id,
        date: reservation.fin,
        logement: nomLogement(reservation.logementId),
        montant: formaterEuros(reservation.montantCentimes),
        confirme: Boolean(reservation.departConfirmeLe),
      })),
  };
};
