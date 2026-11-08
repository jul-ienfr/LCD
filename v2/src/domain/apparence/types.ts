import type { IdentiteSite } from "../identite-site";

export type Mode = "clair" | "sombre";

export type Palette = {
  fond: string;
  surface: string;
  surface2: string;
  bordure: string;
  encre: string;
  encreDouce: string;
  encreFaine: string;
  accent: string;
  accentFonce: string;
  accentDouce: string;
};

export type Typographie = {
  policeTexte: string;
  policeTitre: string;
  policeMono: string;
  graisseTitre: number;
  interlettrageTitre: string;
};

export type Formes = {
  rayonControle: string;
  rayonCarte: string;
  rayonGrand: string;
  rayonBouton: string;
  bordureLargeur: string;
};

export type Ombres = {
  carte: string;
  elevee: string;
};

export type Densite = {
  espaceSection: string;
  espaceCarte: string;
  hauteurControle: string;
};

export type Variantes = {
  nav: "pilule" | "souligne" | "bloc";
  entete: "gauche" | "centre" | "editorial";
};

export type Theme = {
  id: string;
  nom: string;
  description: string;
  clair: Palette;
  sombre: Palette;
  typographie: Typographie;
  formes: Formes;
  ombres: Ombres;
  densite: Densite;
  variantes: Variantes;
};

export type Apparence = {
  schemaVersion: 2;
  themeId: string;
  accent: string | null;
  identite: IdentiteSite;
};

export type ApparenceResolue = {
  apparence: Apparence;
  theme: Theme;
  identite: IdentiteSite;
  apercu: boolean;
};

export const APPARENCE_SCHEMA_VERSION = 2 as const;

export const IDENTITE_DEFAUT: IdentiteSite = {
  nom: "LCD Parc",
  logoUrl: null,
  emailContact: null,
  telephoneContact: null,
  adresseContact: null,
  accent: null,
};
