/**
 * T506 — Mapping domaine → options PDF pour le relevé propriétaire.
 *
 * Couche infrastructure : traduit un `ReleveProprietaire` (domaine pur)
 * en `ReleveProprietairePdfOptions` pour l'adapter `genererReleveProprietairePdf`.
 *
 * La logique de rendu reste dans `pdf-releve-proprietaire.ts` ; ce module
 * ne fait que la projection de structure.
 */
import type { ReleveProprietaire } from "@/domain/releve-proprietaire";
import type { ReleveProprietairePdfOptions } from "./pdf-releve-proprietaire";

const MOIS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

/** Formate un mois AAAA-MM en libellé français : « mars 2026 » ou « janvier – mars 2026 ». */
export function libellePeriodeReleve(moisDebut: string, moisFin: string): string {
  const [anneeD, moisD] = moisDebut.split("-").map(Number);
  const [anneeF, moisF] = moisFin.split("-").map(Number);
  if (moisDebut === moisFin) {
    return `${MOIS_FR[(moisD ?? 1) - 1]} ${anneeD}`;
  }
  return `${MOIS_FR[(moisD ?? 1) - 1]} – ${MOIS_FR[(moisF ?? 1) - 1]} ${anneeF}`;
}

/** Projette un relevé domaine vers les options de l'adapter PDF. */
export function versOptionsPdfReleve(
  releve: ReleveProprietaire,
  accent?: string | null,
): ReleveProprietairePdfOptions {
  return {
    proprietaire: releve.proprietaireNom,
    moisLabel: libellePeriodeReleve(releve.moisDebut, releve.moisFin),
    lignes: releve.lignes.map((ligne) => ({
      logement: ligne.logementNom,
      sejours: ligne.sejours,
      caCentimes: ligne.caCentimes,
      commissionCentimes: ligne.commissionCentimes,
      chargesCentimes: ligne.chargesCentimes,
      netCentimes: ligne.netCentimes,
    })),
    totalCaCentimes: releve.totalCaCentimes,
    totalCommissionCentimes: releve.totalCommissionCentimes,
    totalChargesCentimes: releve.totalChargesCentimes,
    totalNetCentimes: releve.totalNetCentimes,
    accent,
  };
}
