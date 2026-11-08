import type { CodeFournisseur } from "./fournisseur";

export const CODES_CANAUX = [
  "airbnb",
  "booking",
  "abritel",
  "agoda",
  "trip",
  "gites-de-france",
  "clevacances",
  "leboncoin",
  "pitchup",
  "hipcamp",
  "generique",
] as const;

export type CodeCanal = (typeof CODES_CANAUX)[number];

export type ApiCanal = "non" | "partenaire";

export interface FicheCatalogueCanal {
  code: CodeCanal;
  nom: string;
  famille: "ota" | "niche" | "generique";
  importIcs: boolean;
  exportIcs: boolean;
  api: ApiCanal;
  aVerifier: boolean;
  description: string;
}

export const CATALOGUE_CANAUX: readonly FicheCatalogueCanal[] = [
  {
    code: "airbnb",
    nom: "Airbnb",
    famille: "ota",
    importIcs: true,
    exportIcs: true,
    api: "partenaire",
    aVerifier: false,
    description:
      "Import et export iCal disponibles. L’API native est réservée aux partenaires agréés.",
  },
  {
    code: "booking",
    nom: "Booking.com",
    famille: "ota",
    importIcs: true,
    exportIcs: true,
    api: "partenaire",
    aVerifier: false,
    description:
      "Import et export iCal disponibles. L’API native exige le programme Connectivity Provider.",
  },
  {
    code: "abritel",
    nom: "Abritel / Vrbo",
    famille: "ota",
    importIcs: true,
    exportIcs: true,
    api: "partenaire",
    aVerifier: false,
    description:
      "Import et export iCal disponibles. L’API native dépend du programme partenaire Expedia.",
  },
  {
    code: "agoda",
    nom: "Agoda",
    famille: "ota",
    importIcs: true,
    exportIcs: true,
    api: "partenaire",
    aVerifier: true,
    description:
      "iCal à vérifier sur chaque compte. L’API native dépend d’un contrat partenaire.",
  },
  {
    code: "trip",
    nom: "Trip.com",
    famille: "ota",
    importIcs: true,
    exportIcs: true,
    api: "partenaire",
    aVerifier: true,
    description:
      "iCal à vérifier sur chaque compte. L’API native dépend d’un contrat partenaire.",
  },
  {
    code: "gites-de-france",
    nom: "Gîtes de France",
    famille: "niche",
    importIcs: true,
    exportIcs: true,
    api: "non",
    aVerifier: true,
    description:
      "Le format iCal dépend du portail départemental. Vérifiez l’export avant activation.",
  },
  {
    code: "clevacances",
    nom: "Clévacances",
    famille: "niche",
    importIcs: true,
    exportIcs: true,
    api: "non",
    aVerifier: true,
    description:
      "Le format iCal dépend du portail. Vérifiez l’export avant activation.",
  },
  {
    code: "leboncoin",
    nom: "Leboncoin",
    famille: "niche",
    importIcs: true,
    exportIcs: true,
    api: "non",
    aVerifier: true,
    description:
      "iCal à vérifier selon l’offre professionnelle. Pas d’API de disponibilité ouverte.",
  },
  {
    code: "pitchup",
    nom: "Pitchup",
    famille: "niche",
    importIcs: true,
    exportIcs: true,
    api: "non",
    aVerifier: true,
    description:
      "iCal à vérifier sur le compte. Pas d’API de disponibilité ouverte.",
  },
  {
    code: "hipcamp",
    nom: "Hipcamp",
    famille: "niche",
    importIcs: true,
    exportIcs: true,
    api: "non",
    aVerifier: true,
    description:
      "iCal à vérifier sur le compte. Pas d’API de disponibilité ouverte.",
  },
  {
    code: "generique",
    nom: "Autre canal iCal",
    famille: "generique",
    importIcs: true,
    exportIcs: true,
    api: "non",
    aVerifier: false,
    description:
      "Pour un portail non listé : import et export iCal standards, sans API native.",
  },
];

const PAR_CODE = new Map<string, FicheCatalogueCanal>(
  CATALOGUE_CANAUX.map((fiche) => [fiche.code, fiche]),
);

export const BUFFER_MAX_JOURS = 7;

export function ficheCanal(code: string): FicheCatalogueCanal | null {
  return PAR_CODE.get(code) ?? null;
}

export function codeCanalValide(code: string): code is CodeCanal {
  return PAR_CODE.has(code);
}

export function libelleCanalValide(libelle: string): boolean {
  const valeur = libelle.trim();
  return valeur.length >= 2 && valeur.length <= 80;
}

export function externalListingIdValide(
  externalListingId: string | null,
): boolean {
  if (externalListingId === null) return true;
  return (
    externalListingId.length <= 120 &&
    !/[\u0000-\u001f\u007f]/u.test(externalListingId)
  );
}

export function bufferJoursValide(jours: number): boolean {
  return Number.isInteger(jours) && jours >= 0 && jours <= BUFFER_MAX_JOURS;
}

export function cleCanal(
  code: string,
  externalListingId: string | null,
): string {
  const identifiant = externalListingId?.trim().toLowerCase() || "principal";
  return `${code}:${identifiant}`;
}

export interface Canal {
  id: string;
  tenantId: string;
  logementId: string;
  code: CodeCanal;
  libelle: string;
  cle: string;
  externalListingId: string | null;
  actif: boolean;
  exportActif: boolean;
  bufferJours: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type TypeEvenementCanal =
  | "webhook"
  | "reservation"
  | "modification"
  | "annulation"
  | "prix"
  | "dispo"
  | "erreur";

export type StatutEvenementCanal = "recu" | "traite" | "ignore" | "erreur";

export interface EvenementCanal {
  id: string;
  tenantId: string;
  logementFournisseurId: string;
  fournisseurCode: CodeFournisseur;
  type: TypeEvenementCanal;
  externalId: string | null;
  cleIdempotence: string;
  payload: Record<string, unknown>;
  statut: StatutEvenementCanal;
  message: string | null;
  traiteAt: Date | null;
  createdAt: Date;
}
