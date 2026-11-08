import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import { formaterCommissionBp, montantCommission } from "@/domain/commission";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["proprietaire", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const demande = event.url.searchParams.get("mois");
  const mois = demande && moisValide(demande) ? demande : moisCourant();
  const estProprietaire = session.user.role === "proprietaire";

  const logements = estProprietaire
    ? await new DrizzleLogementProprietaireRepository().listerLogements(
        tenantId,
        session.user.id,
      )
    : await new DrizzleLogementRepository().listerParTenant(tenantId);

  if (logements.length === 0) {
    return {
      vide: true as const,
      mois,
      moisLabel: moisEnFrancais(mois),
      nom: session.user.name,
    };
  }

  const ids = new Set(logements.map((logement) => logement.id));
  const assignations = estProprietaire
    ? (
        await new DrizzleLogementProprietaireRepository().listerAssignations(
          tenantId,
        )
      ).filter((assignation) => assignation.userId === session.user.id)
    : [];
  const commissionParLogement = new Map(
    assignations.map((assignation) => [
      assignation.logementId,
      assignation.commissionBp,
    ]),
  );
  const chargesParLogement = new Map(
    assignations.map((assignation) => [
      assignation.logementId,
      assignation.chargesMensuellesCentimes,
    ]),
  );

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois invalide.");

  const reservations = (
    await new DrizzleReservationRepository().listerParMois(
      tenantId,
      premier,
      ajouterJours(dernier, 1),
    )
  ).filter((reservation) => ids.has(reservation.logementId));
  const factures = (
    await new DrizzleFactureRepository().listerParMois(
      tenantId,
      premier,
      dernier,
    )
  ).filter((facture) => ids.has(facture.logementId));

  const ca = reservations
    .filter((reservation) => reservation.statut !== "annulee")
    .reduce((total, reservation) => total + reservation.montantCentimes, 0);
  const ht = factures.reduce(
    (total, facture) => total + facture.montantHtCentimes,
    0,
  );
  const ttc = factures.reduce(
    (total, facture) => total + facture.montantTtcCentimes,
    0,
  );

  let commissionTotaleCentimes = 0;
  let chargesTotalesCentimes = 0;
  let netTotalCentimes = 0;

  const lignes = logements.map((logement) => {
    const resas = reservations.filter(
      (reservation) => reservation.logementId === logement.id,
    );
    const facts = factures.filter((facture) => facture.logementId === logement.id);
    const caLogement = resas
      .filter((reservation) => reservation.statut !== "annulee")
      .reduce((total, reservation) => total + reservation.montantCentimes, 0);
    const commissionBp = estProprietaire
      ? (commissionParLogement.get(logement.id) ?? 0)
      : null;
    const commission =
      commissionBp === null ? 0 : montantCommission(caLogement, commissionBp);
    const charges =
      commissionBp === null ? 0 : (chargesParLogement.get(logement.id) ?? 0);
    const net = caLogement - commission - charges;
    commissionTotaleCentimes += commission;
    chargesTotalesCentimes += charges;
    netTotalCentimes += net;
    return {
      id: logement.id,
      nom: logement.nom,
      sejours: resas.length,
      ca: formaterEuros(caLogement),
      commission: formaterEuros(commission),
      charges: formaterEuros(charges),
      taux: commissionBp === null ? null : formaterCommissionBp(commissionBp),
      net: formaterEuros(net),
      ht: formaterEuros(
        facts.reduce((total, facture) => total + facture.montantHtCentimes, 0),
      ),
      ttc: formaterEuros(
        facts.reduce((total, facture) => total + facture.montantTtcCentimes, 0),
      ),
    };
  });
  const nomsLogements = new Map(
    logements.map((logement) => [logement.id, logement.nom]),
  );
  const sejoursDetail = reservations
    .map((reservation) => ({
      id: reservation.id,
      ref: reservation.ref,
      logement: nomsLogements.get(reservation.logementId) ?? "",
      clientNom: reservation.clientNom,
      debut: reservation.debut,
      fin: reservation.fin,
      montant: formaterEuros(reservation.montantCentimes),
    }))
    .sort((a, b) => a.debut.localeCompare(b.debut));

  return {
    vide: false as const,
    mois,
    moisLabel: moisEnFrancais(mois),
    moisPrecedent: decalerMois(mois, -1),
    moisSuivant: decalerMois(mois, 1),
    moisCourant: moisCourant(),
    nom: session.user.name,
    estProprietaire,
    logements: lignes,
    sejoursDetail,
    sejours: reservations.length,
    factures: factures.length,
    ca: formaterEuros(ca),
    ht: formaterEuros(ht),
    ttc: formaterEuros(ttc),
    commissionTotale: formaterEuros(commissionTotaleCentimes),
    chargesTotales: formaterEuros(chargesTotalesCentimes),
    netTotal: formaterEuros(netTotalCentimes),
  };
};
