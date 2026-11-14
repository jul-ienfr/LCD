/**
 * T510 — Écran /hote/rapports : filtres, KPIs, mix canal, alertes, exports.
 *
 * Branche les alertes T509 (`construireAlertesReleves`) sur les données
 * réelles du tenant : impayés depuis les échéances en retard, marges
 * négatives depuis les mandats actifs.
 */
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisValide,
  nuitsEntre,
} from "@/domain/calendrier";
import { montantCommission } from "@/domain/commission";
import {
  calculerAggregats,
  calculerMixCanal,
} from "@/domain/releve-proprietaire";
import { construireAlertesReleves } from "@/domain/alertes-releve";
import { DrizzleRapportsRepository } from "@/infrastructure/db/repositories/rapports-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { traductionsRapports } from "@/lib/i18n-rapports";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

/**
 * Dérive le canal depuis la source de réservation.
 * Format source : `direct`, `widget`, `promo:X`, `utm:...`, `demande:X`,
 * `fournisseur:<code>`.
 */
function canalDepuisSource(source: string): string {
  if (source.startsWith("promo:")) return "promo";
  if (source.startsWith("utm:")) return "utm";
  if (source.startsWith("demande:")) return "demande";
  if (source.startsWith("fournisseur:")) return "fournisseur";
  if (source === "widget") return "widget";
  return "direct";
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const moisParam = event.url.searchParams.get("mois");
  const mois = moisParam && moisValide(moisParam) ? moisParam : moisCourant();
  const jours = joursDuMois(mois);
  const premier = jours[0]!;
  const dernier = jours[jours.length - 1]!;
  const dernierExclu = ajouterJours(dernier, 1);

  const rapportsRepo = new DrizzleRapportsRepository();

  const [reservationsPeriode, mandats, reservationsToutes, impayes] =
    await Promise.all([
      rapportsRepo.listerReservationsPeriode(tenantId, premier, dernierExclu),
      rapportsRepo.listerLogementsAvecMandat(tenantId),
      new DrizzleReservationRepository().listerTous(tenantId),
      new DrizzleEcheancesPaiementRepository().listerEnRetard(
        tenantId,
        dernierExclu,
      ),
    ]);

  // --- KPIs ---
  const reservationsNonAnnulees = reservationsPeriode.filter(
    (r) => r.statut !== "annulee",
  );
  const logementsActifs = new Set(mandats.map((m) => m.logementId)).size;

  const aggregats = calculerAggregats({
    logements: logementsActifs,
    moisDebut: mois,
    moisFin: mois,
    reservations: reservationsNonAnnulees.map((r) => ({
      nuits: nuitsEntre(r.debut, r.fin),
      montantCentimes: r.montantCentimes,
    })),
  });

  const caTotal = reservationsNonAnnulees.reduce(
    (s, r) => s + r.montantCentimes,
    0,
  );

  // --- Mix canal ---
  const mixCanal = calculerMixCanal(
    reservationsNonAnnulees.map((r) => ({
      canal: canalDepuisSource(r.source),
      montantCentimes: r.montantCentimes,
    })),
  );

  // --- Alertes T509 ---
  const resaParId = new Map(reservationsToutes.map((r) => [r.id, r]));
  const impayesAlertes = impayes.map((e) => {
    const resa = resaParId.get(e.reservationId);
    const joursRetard = Math.max(
      0,
      Math.round(
        (Date.parse(dernier) - Date.parse(e.exigibleLe)) / 86_400_000,
      ),
    );
    return {
      ref: resa?.ref ?? e.reservationId,
      montantCentimes: e.montantCentimes,
      exigibleLe: e.exigibleLe,
      joursRetard,
      clientNom: resa?.clientNom ?? null,
    };
  });

  // Marge négative par logement (lignes de relevé simplifiées)
  const lignesReleve = mandats.map((mandat) => {
    const resasLogement = reservationsNonAnnulees.filter(
      (r) => r.logementId === mandat.logementId,
    );
    const ca = resasLogement.reduce((s, r) => s + r.montantCentimes, 0);
    const commission = montantCommission(ca, mandat.commissionBp);
    const charges = mandat.chargesMensuellesCentimes;
    return {
      logementId: mandat.logementId,
      logementNom: mandat.logementNom,
      sejours: resasLogement.length,
      caCentimes: ca,
      commissionCentimes: commission,
      chargesCentimes: charges,
      netCentimes: ca - commission - charges,
    };
  });

  const alertes = construireAlertesReleves({
    impayes: impayesAlertes,
    lignesReleve,
  });

  // --- i18n ---
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const t = traductionsRapports(langue);
  const moisLibelle = new Intl.DateTimeFormat(
    langue === "fr" ? "fr-FR" : langue,
    { month: "long", year: "numeric" },
  ).format(new Date(`${mois}-01T12:00:00Z`));

  return {
    t,
    mois,
    moisLibelle,
    precedent: `/hote/rapports?mois=${decalerMois(mois, -1)}`,
    suivant: `/hote/rapports?mois=${decalerMois(mois, 1)}`,
    courant: `/hote/rapports?mois=${moisCourant()}`,
    kpis: [
      {
        libelle: t.kpiCa,
        valeur: formaterEuros(caTotal),
        note: t.sejours(reservationsNonAnnulees.length),
      },
      {
        libelle: t.kpiOccupation,
        valeur: `${Math.round(aggregats.tauxOccupation * 100)} %`,
        note: t.nuits(aggregats.nuitsReservees),
      },
      {
        libelle: t.kpiAdr,
        valeur: formaterEuros(aggregats.adrCentimes),
        note: "",
      },
      {
        libelle: t.kpiRevpar,
        valeur: formaterEuros(aggregats.revparCentimes),
        note: "",
      },
    ],
    mixCanal: mixCanal.map((c) => ({
      canal: c.canal,
      reservations: c.reservations,
      ca: formaterEuros(c.caCentimes),
      part: `${Math.round(c.partCa * 100)} %`,
    })),
    alertes: alertes.map((a) => ({
      id: a.id,
      severite: a.severite,
      message: a.message,
    })),
    parLogement: lignesReleve.map((l) => ({
      id: l.logementId,
      nom: l.logementNom,
      sejours: l.sejours,
      ca: formaterEuros(l.caCentimes),
      commission: formaterEuros(l.commissionCentimes),
      charges: formaterEuros(l.chargesCentimes),
      net: formaterEuros(l.netCentimes),
      netNegatif: l.netCentimes < 0,
    })),
  };
};
