import { dateIsoValide } from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import {
  numeroFactureValide,
  totalLigne,
  totauxFacture,
  type FactureLigne,
} from "@/domain/facture";
import type { FactureRepository } from "../ports/facture-repository";

export interface CreerFactureInput {
  tenantId: string;
  logementId: string;
  reservationId?: string | null;
  numero: string;
  clientNom: string;
  clientEmail?: string | null;
  dateEmission: string;
  echeance?: string | null;
  tvaCentimes: number;
  taxeSejourCentimes: number;
  notes?: string | null;
  lignes: {
    designation: string;
    quantite: number;
    prixUnitaireCentimes: number;
  }[];
}

function ligneValide(ligne: CreerFactureInput["lignes"][number]): boolean {
  return (
    ligne.designation.trim().length >= 2 &&
    ligne.designation.trim().length <= 200 &&
    Number.isInteger(ligne.quantite) &&
    ligne.quantite > 0 &&
    Number.isInteger(ligne.prixUnitaireCentimes) &&
    ligne.prixUnitaireCentimes >= 0
  );
}

/** Cas d'usage : créer une facture simple avec lignes et totaux calculés. */
export class CreerFacture {
  constructor(private readonly repo: FactureRepository) {}

  async executer(input: CreerFactureInput) {
    const numero = input.numero.trim().toUpperCase();
    const clientNom = input.clientNom.trim();

    if (!input.tenantId || !input.logementId) {
      throw new ErreurMetier("TENANT_INVALIDE", "Tenant et logement requis.");
    }
    if (!numeroFactureValide(numero)) {
      throw new ErreurMetier(
        "FACTURE_INVALIDE",
        "Numéro invalide (majuscules, chiffres, tirets ; 3 à 32 caractères).",
      );
    }
    if (clientNom.length < 2 || clientNom.length > 120) {
      throw new ErreurMetier(
        "FACTURE_INVALIDE",
        "Le nom du client doit faire 2 à 120 caractères.",
      );
    }
    if (!dateIsoValide(input.dateEmission)) {
      throw new ErreurMetier("FACTURE_INVALIDE", "Date d'émission invalide.");
    }
    if (
      input.echeance &&
      (!dateIsoValide(input.echeance) || input.echeance < input.dateEmission)
    ) {
      throw new ErreurMetier(
        "FACTURE_INVALIDE",
        "L'échéance doit être une date valide postérieure à l'émission.",
      );
    }
    if (!Number.isInteger(input.tvaCentimes) || input.tvaCentimes < 0) {
      throw new ErreurMetier("FACTURE_INVALIDE", "TVA invalide.");
    }
    if (
      !Number.isInteger(input.taxeSejourCentimes) ||
      input.taxeSejourCentimes < 0
    ) {
      throw new ErreurMetier("FACTURE_INVALIDE", "Taxe de séjour invalide.");
    }
    if (input.lignes.length === 0 || !input.lignes.every(ligneValide)) {
      throw new ErreurMetier(
        "FACTURE_INVALIDE",
        "Au moins une ligne valide est requise.",
      );
    }

    const lignes: Omit<FactureLigne, "id">[] = input.lignes.map((ligne) => ({
      designation: ligne.designation.trim(),
      quantite: ligne.quantite,
      prixUnitaireCentimes: ligne.prixUnitaireCentimes,
      totalCentimes: totalLigne(ligne.quantite, ligne.prixUnitaireCentimes),
    }));

    const { htCentimes, ttcCentimes } = totauxFacture(
      lignes,
      input.tvaCentimes,
      input.taxeSejourCentimes,
    );

    return this.repo.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId ?? null,
      numero,
      clientNom,
      clientEmail: input.clientEmail?.trim() || null,
      dateEmission: input.dateEmission,
      echeance: input.echeance ?? null,
      montantHtCentimes: htCentimes,
      tvaCentimes: input.tvaCentimes,
      taxeSejourCentimes: input.taxeSejourCentimes,
      montantTtcCentimes: ttcCentimes,
      statut: "brouillon",
      notes: input.notes?.trim() || null,
      lignes,
    });
  }
}
