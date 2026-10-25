import { ErreurMetier } from "./erreurs";

export type StatutObjetTrouve = "trouve" | "reclame" | "envoye" | "donne";

export const STATUTS_OBJET_TROUVE: readonly StatutObjetTrouve[] = [
  "trouve",
  "reclame",
  "envoye",
  "donne",
];

export const LIBELLES_STATUT_OBJET: Record<StatutObjetTrouve, string> = {
  trouve: "Trouvé",
  reclame: "Réclamé",
  envoye: "Envoyé",
  donne: "Donné / stock",
};

export const FORFAIT_OBJET_CENTIMES = 1500;
export const JOURS_AVANT_DON = 30;
export const DESCRIPTION_OBJET_MAX = 500;
export const LIEU_OBJET_MAX = 120;
export const NOM_OBJET_MAX = 120;
export const CONTACT_OBJET_MAX = 200;

export interface ObjetTrouve {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  description: string;
  lieu: string;
  trouveLe: string;
  statut: StatutObjetTrouve;
  voyageurNom: string | null;
  contact: string | null;
  fraisCentimes: number;
  envoyeLe: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function refObjetTrouveValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function statutObjetValide(
  statut: string,
): statut is StatutObjetTrouve {
  return (STATUTS_OBJET_TROUVE as readonly string[]).includes(statut);
}

export function dateIsoValide(valeur: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const date = new Date(`${valeur}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === valeur;
}

export function aujourdHuiIso(maintenant: Date = new Date()): string {
  return maintenant.toISOString().slice(0, 10);
}

export function datePlusJours(iso: string, jours: number): string {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

export function joursDepuis(iso: string, maintenant: Date = new Date()): number {
  const debut = new Date(`${iso}T00:00:00Z`).getTime();
  const fin = new Date(
    `${aujourdHuiIso(maintenant)}T00:00:00Z`,
  ).getTime();
  return Math.floor((fin - debut) / 86_400_000);
}

export function validerObjetTrouve(input: {
  description: string;
  lieu: string;
  trouveLe: string;
  voyageurNom?: string | null;
  contact?: string | null;
}): {
  description: string;
  lieu: string;
  trouveLe: string;
  voyageurNom: string | null;
  contact: string | null;
} {
  const description = input.description.trim();
  if (description.length < 2 || description.length > DESCRIPTION_OBJET_MAX) {
    throw new ErreurMetier(
      "OBJET_TROUVE_INVALIDE",
      `La description doit contenir 2 à ${DESCRIPTION_OBJET_MAX} caractères.`,
    );
  }
  const lieu = input.lieu.trim();
  if (lieu.length < 2 || lieu.length > LIEU_OBJET_MAX) {
    throw new ErreurMetier(
      "OBJET_TROUVE_INVALIDE",
      `Le lieu doit contenir 2 à ${LIEU_OBJET_MAX} caractères.`,
    );
  }
  if (!dateIsoValide(input.trouveLe)) {
    throw new ErreurMetier(
      "OBJET_TROUVE_INVALIDE",
      "La date de découverte est invalide.",
    );
  }
  if (input.trouveLe > aujourdHuiIso()) {
    throw new ErreurMetier(
      "OBJET_TROUVE_INVALIDE",
      "La date de découverte ne peut pas être future.",
    );
  }
  const voyageurNom = input.voyageurNom?.trim() || null;
  if (voyageurNom && voyageurNom.length > NOM_OBJET_MAX) {
    throw new ErreurMetier(
      "OBJET_TROUVE_INVALIDE",
      `Le nom du voyageur doit contenir au plus ${NOM_OBJET_MAX} caractères.`,
    );
  }
  const contact = input.contact?.trim() || null;
  if (contact && (contact.length < 3 || contact.length > CONTACT_OBJET_MAX)) {
    throw new ErreurMetier(
      "OBJET_TROUVE_INVALIDE",
      `Le contact doit contenir 3 à ${CONTACT_OBJET_MAX} caractères.`,
    );
  }
  return { description, lieu, trouveLe: input.trouveLe, voyageurNom, contact };
}

export function eligibleAuDon(
  objet: Pick<ObjetTrouve, "trouveLe" | "statut">,
  maintenant: Date = new Date(),
): boolean {
  return (
    (objet.statut === "trouve" || objet.statut === "reclame") &&
    joursDepuis(objet.trouveLe, maintenant) >= JOURS_AVANT_DON
  );
}

export function joursRestantsAvantDon(
  objet: Pick<ObjetTrouve, "trouveLe">,
  maintenant: Date = new Date(),
): number {
  return Math.max(0, JOURS_AVANT_DON - joursDepuis(objet.trouveLe, maintenant));
}
