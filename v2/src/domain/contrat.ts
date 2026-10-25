import { dateIsoValide } from "./calendrier";
import { ErreurMetier } from "./erreurs";
import { nuitsSejour } from "./planning";

export const CLAUSES_CONTRAT: readonly string[] = [
  "Le logement est mis à disposition pour la période et le nombre de voyageurs indiqués ci-dessus.",
  "Le voyageur s’engage à respecter le règlement intérieur et les consignes de sécurité remis avec ce contrat.",
  "Le logement doit être rendu dans l’état où il a été reçu ; les dégradations sont facturées au prix de remplacement.",
  "Toute annulation ou modification suit les conditions générales de vente acceptées à la réservation.",
  "Le dépôt de garantie, lorsqu’il est prévu, est restitué après l’état des lieux de sortie.",
];

export interface ContratSejour {
  reference: string;
  hote: { nom: string; adresse: string | null; email: string | null };
  voyageur: { nom: string; email: string | null };
  logement: { nom: string; adresse: string | null };
  sejour: { debut: string; fin: string; nuits: number; voyageurs: number };
  montantCentimes: number;
  cautionCentimes: number | null;
  clauses: readonly string[];
}

function texteOuNull(valeur: string | null | undefined): string | null {
  const texte = (valeur ?? "").trim();
  return texte || null;
}

export function construireContrat(input: {
  refReservation: string;
  hoteNom: string;
  hoteAdresse?: string | null;
  hoteEmail?: string | null;
  voyageurNom?: string | null;
  voyageurEmail?: string | null;
  logementNom: string;
  logementAdresse?: string | null;
  debut: string;
  fin: string;
  voyageurs: number;
  montantCentimes: number;
  cautionCentimes?: number | null;
}): ContratSejour {
  const ref = input.refReservation.trim();
  if (!ref) {
    throw new ErreurMetier(
      "CONTRAT_INVALIDE",
      "La référence de réservation est requise.",
    );
  }
  if (!dateIsoValide(input.debut) || !dateIsoValide(input.fin)) {
    throw new ErreurMetier("CONTRAT_INVALIDE", "Les dates sont invalides.");
  }
  if (input.fin <= input.debut) {
    throw new ErreurMetier(
      "CONTRAT_INVALIDE",
      "La date de fin doit suivre la date de début.",
    );
  }
  if (
    !Number.isInteger(input.voyageurs) ||
    input.voyageurs < 1 ||
    input.voyageurs > 30
  ) {
    throw new ErreurMetier(
      "CONTRAT_INVALIDE",
      "Le nombre de voyageurs doit être compris entre 1 et 30.",
    );
  }
  if (!Number.isInteger(input.montantCentimes) || input.montantCentimes < 0) {
    throw new ErreurMetier("CONTRAT_INVALIDE", "Le montant est invalide.");
  }
  const caution = input.cautionCentimes ?? null;
  if (caution !== null && (!Number.isInteger(caution) || caution < 0)) {
    throw new ErreurMetier("CONTRAT_INVALIDE", "Le dépôt de garantie est invalide.");
  }

  return {
    reference: `CT-${ref}`,
    hote: {
      nom: input.hoteNom.trim() || "Hôte",
      adresse: texteOuNull(input.hoteAdresse),
      email: texteOuNull(input.hoteEmail),
    },
    voyageur: {
      nom: texteOuNull(input.voyageurNom) ?? "Voyageur",
      email: texteOuNull(input.voyageurEmail),
    },
    logement: {
      nom: input.logementNom.trim() || "Logement",
      adresse: texteOuNull(input.logementAdresse),
    },
    sejour: {
      debut: input.debut,
      fin: input.fin,
      nuits: nuitsSejour(input.debut, input.fin),
      voyageurs: input.voyageurs,
    },
    montantCentimes: input.montantCentimes,
    cautionCentimes: caution,
    clauses: CLAUSES_CONTRAT,
  };
}
