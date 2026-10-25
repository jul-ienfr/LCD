import { ErreurMetier } from "./erreurs";

export type StatutAvis = "publie" | "masque";

export interface Avis {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string;
  ref: string;
  nom: string;
  note: number;
  commentaire: string;
  statut: StatutAvis;
  createdAt: Date;
  updatedAt: Date;
}

export const COMMENTAIRE_MAX = 1200;

export function noteAvisValide(note: number): boolean {
  return Number.isInteger(note) && note >= 1 && note <= 5;
}

export function validerAvis(input: {
  note: number;
  commentaire?: string;
  nom: string;
}): { note: number; commentaire: string; nom: string } {
  const nom = input.nom.trim();
  const commentaire = (input.commentaire ?? "").trim();
  if (nom.length < 2 || nom.length > 80) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Le nom doit contenir 2 à 80 caractères.",
    );
  }
  if (!noteAvisValide(input.note)) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "La note doit être comprise entre 1 et 5.",
    );
  }
  if (commentaire.length > COMMENTAIRE_MAX) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      `Le commentaire est limité à ${COMMENTAIRE_MAX} caractères.`,
    );
  }
  return { note: input.note, commentaire, nom };
}

export function moyenneAvis(notes: readonly number[]): number | null {
  if (notes.length === 0) return null;
  const total = notes.reduce((somme, note) => somme + note, 0);
  return Math.round((total / notes.length) * 10) / 10;
}
