import { dateIsoValide } from "./calendrier";
import { ErreurMetier } from "./erreurs";

export type TypeEntretien = "entretien" | "reparation" | "controle";

export const TYPES_ENTRETIEN: readonly TypeEntretien[] = [
  "entretien",
  "reparation",
  "controle",
];

export const LIBELLES_TYPE_ENTRETIEN: Record<TypeEntretien, string> = {
  entretien: "Entretien",
  reparation: "Réparation",
  controle: "Contrôle",
};

export const TITRE_ENTRETIEN_MAX = 120;
export const DESCRIPTION_ENTRETIEN_MAX = 2000;
export const PRESTATAIRE_ENTRETIEN_MAX = 120;
export const COUT_ENTRETIEN_MAX_CENTIMES = 10_000_000;

export interface Entretien {
  id: string;
  tenantId: string;
  logementId: string;
  ref: string;
  date: string;
  type: TypeEntretien;
  titre: string;
  description: string;
  prestataire: string | null;
  coutCentimes: number;
  createdAt: Date;
  updatedAt: Date;
}

export function refEntretienValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function typeEntretienValide(type: string): type is TypeEntretien {
  return (TYPES_ENTRETIEN as readonly string[]).includes(type);
}

export function validerEntretien(input: {
  type: string;
  date: string;
  titre: string;
  description?: string;
  prestataire?: string;
  coutCentimes: number;
}): {
  type: TypeEntretien;
  date: string;
  titre: string;
  description: string;
  prestataire: string | null;
  coutCentimes: number;
} {
  if (!typeEntretienValide(input.type)) {
    throw new ErreurMetier(
      "ENTRETIEN_INVALIDE",
      "Le type d’intervention est invalide.",
    );
  }
  if (!dateIsoValide(input.date)) {
    throw new ErreurMetier(
      "ENTRETIEN_INVALIDE",
      "La date de l’intervention est invalide.",
    );
  }
  const titre = input.titre.trim();
  if (titre.length < 2 || titre.length > TITRE_ENTRETIEN_MAX) {
    throw new ErreurMetier(
      "ENTRETIEN_INVALIDE",
      `Le titre doit contenir 2 à ${TITRE_ENTRETIEN_MAX} caractères.`,
    );
  }
  const description = (input.description ?? "").trim();
  if (description.length > DESCRIPTION_ENTRETIEN_MAX) {
    throw new ErreurMetier(
      "ENTRETIEN_INVALIDE",
      `La description est limitée à ${DESCRIPTION_ENTRETIEN_MAX} caractères.`,
    );
  }
  const prestataire = (input.prestataire ?? "").trim();
  if (prestataire.length > PRESTATAIRE_ENTRETIEN_MAX) {
    throw new ErreurMetier(
      "ENTRETIEN_INVALIDE",
      `Le prestataire est limité à ${PRESTATAIRE_ENTRETIEN_MAX} caractères.`,
    );
  }
  if (
    !Number.isInteger(input.coutCentimes) ||
    input.coutCentimes < 0 ||
    input.coutCentimes > COUT_ENTRETIEN_MAX_CENTIMES
  ) {
    throw new ErreurMetier(
      "ENTRETIEN_INVALIDE",
      "Le coût doit être un montant positif valide.",
    );
  }
  return {
    type: input.type,
    date: input.date,
    titre,
    description,
    prestataire: prestataire || null,
    coutCentimes: input.coutCentimes,
  };
}

export function totalEntretiens(items: readonly Entretien[]): number {
  return items.reduce((total, item) => total + item.coutCentimes, 0);
}

export function compterParType(
  items: readonly Entretien[],
): Record<TypeEntretien, number> {
  const comptes: Record<TypeEntretien, number> = {
    entretien: 0,
    reparation: 0,
    controle: 0,
  };
  for (const item of items) comptes[item.type] += 1;
  return comptes;
}
