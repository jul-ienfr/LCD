import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { LIBELLES_MODE_PAIEMENT, totalPaiements } from "@/domain/paiement";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { traductionsCompta } from "@/lib/i18n-compta";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const moisParam = event.url.searchParams.get("mois");
  const mois = moisParam && moisValide(moisParam) ? moisParam : moisCourant();
  const jours = joursDuMois(mois);
  const premier = jours[0]!;
  const dernier = jours[jours.length - 1]!;

  const [logements, reservations, factures, paiements] = await Promise.all([
    new DrizzleLogementRepository().listerParTenant(tenantId),
    new DrizzleReservationRepository().listerParMois(
      tenantId,
      premier,
      ajouterJours(dernier, 1),
    ),
    new DrizzleFactureRepository().listerParMois(tenantId, premier, dernier),
    new DrizzlePaiementRepository().listerParMois(tenantId, premier, dernier),
  ]);

  const caReservations = reservations
    .filter((reservation) => reservation.statut !== "annulee")
    .reduce((total, reservation) => total + reservation.montantCentimes, 0);
  const ht = factures.reduce((total, facture) => total + facture.montantHtCentimes, 0);
  const tva = factures.reduce((total, facture) => total + facture.tvaCentimes, 0);
  const taxe = factures.reduce((total, facture) => total + facture.taxeSejourCentimes, 0);
  const ttc = factures.reduce((total, facture) => total + facture.montantTtcCentimes, 0);
  const encaisse = totalPaiements(paiements);
  const parFacture = new Map(factures.map((facture) => [facture.id, facture]));

  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsCompta(langue);
  const moisLibelle = new Intl.DateTimeFormat(langue === "fr" ? "fr-FR" : langue, {
    month: "long",
    year: "numeric",
  }).format(new Date(`${mois}-01T12:00:00Z`));

  return {
    t,
    mois,
    role: session.user.role,
    moisLibelle,
    precedent: `/hote/compta?mois=${decalerMois(mois, -1)}`,
    suivant: `/hote/compta?mois=${decalerMois(mois, 1)}`,
    courant: `/hote/compta?mois=${moisCourant()}`,
    kpis: [
      { libelle: t.kpiCa, valeur: formaterEuros(caReservations), note: t.sejours(reservations.length) },
      { libelle: t.kpiHt, valeur: formaterEuros(ht), note: t.nbFactures(factures.length) },
      {
        libelle: t.kpiTva,
        valeur: formaterEuros(tva + taxe),
        note: t.tvaEtTaxe(formaterEuros(tva), formaterEuros(taxe)),
      },
      { libelle: t.kpiTtc, valeur: formaterEuros(ttc), note: t.horsCa },
      {
        libelle: t.kpiEncaisse,
        valeur: formaterEuros(encaisse),
        note: t.nbPaiements(paiements.length),
      },
    ],
    parLogement: logements.map((logement) => {
      const resas = reservations.filter((reservation) => reservation.logementId === logement.id);
      const facts = factures.filter((facture) => facture.logementId === logement.id);
      return {
        id: logement.id,
        nom: logement.nom,
        code: logement.code,
        sejours: resas.length,
        ca: formaterEuros(
          resas
            .filter((reservation) => reservation.statut !== "annulee")
            .reduce((total, reservation) => total + reservation.montantCentimes, 0),
        ),
        factures: facts.length,
        ttc: formaterEuros(
          facts.reduce((total, facture) => total + facture.montantTtcCentimes, 0),
        ),
      };
    }),
    paiements: paiements.map((paiement) => {
      const facture = parFacture.get(paiement.factureId ?? "");
      return {
        id: paiement.id,
        date: paiement.datePaiement,
        factureId: facture?.id ?? null,
        numero: facture?.numero ?? paiement.factureId,
        mode: LIBELLES_MODE_PAIEMENT[paiement.mode],
        reference: paiement.reference ?? paiement.ref,
        montant: formaterEuros(paiement.montantCentimes),
      };
    }),
  };
};
