import { dateIsoValide } from "./calendrier";
import { ErreurMetier } from "./erreurs";
import { etatValide, type EtatBien } from "./inventaire";

export type TypeEtatDesLieux = "entree" | "sortie";

export const TYPES_ETAT_DES_LIEUX: readonly TypeEtatDesLieux[] = [
  "entree",
  "sortie",
];

export const NOTES_EDL_MAX = 2000;
export const COMMENTAIRE_EDL_MAX = 500;

export interface LigneEtatDesLieux {
  bienId: string | null;
  qr: string;
  libelle: string;
  etatReference: EtatBien;
  prixReferenceCentimes: number | null;
  etatConstate: EtatBien | null;
  manquant: boolean;
  commentaire: string;
}

export interface EtatDesLieux {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  type: TypeEtatDesLieux;
  date: string;
  notes: string;
  lignes: LigneEtatDesLieux[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyseEtatDesLieux {
  manquants: LigneEtatDesLieux[];
  degrades: LigneEtatDesLieux[];
  coutRemplacementCentimes: number;
}

export function refEtatDesLieuxValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function typeEtatDesLieuxValide(
  type: string,
): type is TypeEtatDesLieux {
  return (TYPES_ETAT_DES_LIEUX as readonly string[]).includes(type);
}

export function validerEtatDesLieux(input: {
  type: string;
  date: string;
  notes?: string;
}): { type: TypeEtatDesLieux; date: string; notes: string } {
  if (!typeEtatDesLieuxValide(input.type)) {
    throw new ErreurMetier(
      "ETAT_DES_LIEUX_INVALIDE",
      "Le type doit être « entrée » ou « sortie ».",
    );
  }
  if (!dateIsoValide(input.date)) {
    throw new ErreurMetier(
      "ETAT_DES_LIEUX_INVALIDE",
      "La date de l’état des lieux est invalide.",
    );
  }
  const notes = (input.notes ?? "").trim();
  if (notes.length > NOTES_EDL_MAX) {
    throw new ErreurMetier(
      "ETAT_DES_LIEUX_INVALIDE",
      `Les notes sont limitées à ${NOTES_EDL_MAX} caractères.`,
    );
  }
  return { type: input.type, date: input.date, notes };
}

export function validerConstat(input: {
  etatReference: EtatBien;
  etatConstate: number | null;
  manquant: boolean;
  commentaire?: string;
}): {
  etatConstate: EtatBien | null;
  manquant: boolean;
  commentaire: string;
} {
  const commentaire = (input.commentaire ?? "").trim();
  if (commentaire.length > COMMENTAIRE_EDL_MAX) {
    throw new ErreurMetier(
      "ETAT_DES_LIEUX_INVALIDE",
      `Un commentaire est limité à ${COMMENTAIRE_EDL_MAX} caractères.`,
    );
  }
  if (input.manquant) {
    return { etatConstate: null, manquant: true, commentaire };
  }
  const etatConstate = input.etatConstate ?? 0;
  if (!etatValide(etatConstate)) {
    throw new ErreurMetier(
      "ETAT_DES_LIEUX_INVALIDE",
      "Indiquez l’état constaté ou cochez « manquant ».",
    );
  }
  return {
    etatConstate,
    manquant: false,
    commentaire,
  };
}

export function analyserEtatDesLieux(
  lignes: readonly LigneEtatDesLieux[],
): AnalyseEtatDesLieux {
  const manquants = lignes.filter((ligne) => ligne.manquant);
  const degrades = lignes.filter(
    (ligne) =>
      !ligne.manquant &&
      ligne.etatConstate !== null &&
      ligne.etatConstate < ligne.etatReference,
  );
  const coutRemplacementCentimes = manquants.reduce(
    (total, ligne) => total + (ligne.prixReferenceCentimes ?? 0),
    0,
  );
  return { manquants, degrades, coutRemplacementCentimes };
}
