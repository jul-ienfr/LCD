import { ErreurMetier } from "./erreurs";

export interface MentionAnnonce {
  code: string;
  libelle: string;
  detail: string;
}

export const MENTIONS_ANNONCE: readonly MentionAnnonce[] = [
  {
    code: "surface",
    libelle: "Surface habitable",
    detail: "Surface en m² affichée sur l’annonce.",
  },
  {
    code: "pieces",
    libelle: "Nombre de pièces",
    detail: "Nombre de pièces principales et chambres.",
  },
  {
    code: "dpe",
    libelle: "Diagnostic de performance énergétique",
    detail: "Étiquette DPE (A à G) visible dans l’annonce.",
  },
  {
    code: "ges",
    libelle: "Émissions de gaz à effet de serre",
    detail: "Étiquette GES (A à G) visible dans l’annonce.",
  },
  {
    code: "classement",
    libelle: "Classement meublé de tourisme",
    detail: "Nombre d’étoiles ou mention « non classé ».",
  },
  {
    code: "taxe_sejour",
    libelle: "Taxe de séjour",
    detail: "Assujettissement et modalités de collecte indiqués.",
  },
  {
    code: "assurance",
    libelle: "Assurance responsabilité civile",
    detail: "Couverture du logement et des voyageurs précisée.",
  },
  {
    code: "enregistrement",
    libelle: "Numéro d’enregistrement mairie",
    detail: "Obligatoire dans les communes qui l’exigent.",
  },
  {
    code: "charges",
    libelle: "Charges et frais",
    detail: "Charges incluses, frais de ménage et options affichés.",
  },
];

export const TOTAL_MENTIONS = MENTIONS_ANNONCE.length;

export const ETIQUETTES_DPE = ["A", "B", "C", "D", "E", "F", "G"] as const;
export type EtiquetteEnergie = (typeof ETIQUETTES_DPE)[number];

export const CLASSEMENTS_MEUBLE = [
  "non_classe",
  "1_etoile",
  "2_etoiles",
  "3_etoiles",
  "4_etoiles",
  "5_etoiles",
] as const;
export type ClassementMeuble = (typeof CLASSEMENTS_MEUBLE)[number];

export const LIBELLES_CLASSEMENT: Record<ClassementMeuble, string> = {
  non_classe: "Non classé",
  "1_etoile": "1 étoile",
  "2_etoiles": "2 étoiles",
  "3_etoiles": "3 étoiles",
  "4_etoiles": "4 étoiles",
  "5_etoiles": "5 étoiles",
};

export interface ConformiteAnnonce {
  tenantId: string;
  logementId: string;
  mentions: Record<string, boolean>;
  dpeClasse: EtiquetteEnergie | null;
  gesClasse: EtiquetteEnergie | null;
  classement: ClassementMeuble | null;
  numeroEnregistrement: string | null;
  numeroCerfa: string | null;
  updatedAt: Date;
}

export function mentionsParDefaut(): Record<string, boolean> {
  return Object.fromEntries(MENTIONS_ANNONCE.map((m) => [m.code, false]));
}

export function etiquetteValide(
  valeur: string,
): valeur is EtiquetteEnergie {
  return (ETIQUETTES_DPE as readonly string[]).includes(valeur);
}

export function classementValide(
  valeur: string,
): valeur is ClassementMeuble {
  return (CLASSEMENTS_MEUBLE as readonly string[]).includes(valeur);
}

function texteOuNull(
  valeur: unknown,
  max: number,
  libelle: string,
): string | null {
  const texte = String(valeur ?? "").trim();
  if (!texte) return null;
  if (texte.length > max) {
    throw new ErreurMetier(
      "ANNONCE_INVALIDE",
      `${libelle} : ${max} caractères maximum.`,
    );
  }
  return texte;
}

export function normaliserConformite(input: {
  mentions: Record<string, boolean>;
  dpeClasse?: string | null;
  gesClasse?: string | null;
  classement?: string | null;
  numeroEnregistrement?: string | null;
  numeroCerfa?: string | null;
}): Omit<ConformiteAnnonce, "tenantId" | "logementId" | "updatedAt"> {
  const mentions = mentionsParDefaut();
  for (const mention of MENTIONS_ANNONCE) {
    mentions[mention.code] = input.mentions[mention.code] === true;
  }

  const dpeBrut = String(input.dpeClasse ?? "").trim().toUpperCase();
  const gesBrut = String(input.gesClasse ?? "").trim().toUpperCase();
  if (dpeBrut && !etiquetteValide(dpeBrut)) {
    throw new ErreurMetier(
      "ANNONCE_INVALIDE",
      "L’étiquette DPE doit être une lettre de A à G.",
    );
  }
  if (gesBrut && !etiquetteValide(gesBrut)) {
    throw new ErreurMetier(
      "ANNONCE_INVALIDE",
      "L’étiquette GES doit être une lettre de A à G.",
    );
  }

  const classementBrut = String(input.classement ?? "").trim();
  if (classementBrut && !classementValide(classementBrut)) {
    throw new ErreurMetier(
      "ANNONCE_INVALIDE",
      "Le classement meublé est invalide.",
    );
  }

  return {
    mentions,
    dpeClasse: dpeBrut ? (dpeBrut as EtiquetteEnergie) : null,
    gesClasse: gesBrut ? (gesBrut as EtiquetteEnergie) : null,
    classement: classementBrut
      ? (classementBrut as ClassementMeuble)
      : null,
    numeroEnregistrement: texteOuNull(
      input.numeroEnregistrement,
      64,
      "Numéro d’enregistrement",
    ),
    numeroCerfa: texteOuNull(input.numeroCerfa, 64, "Numéro Cerfa"),
  };
}

export function mentionsManquantes(
  mentions: Record<string, boolean>,
): MentionAnnonce[] {
  return MENTIONS_ANNONCE.filter((m) => mentions[m.code] !== true);
}

export function conformiteAnnonce(
  conformite: Pick<ConformiteAnnonce, "mentions" | "dpeClasse" | "gesClasse">,
): {
  faites: number;
  total: number;
  pourcentage: number;
  conforme: boolean;
  manquantes: MentionAnnonce[];
} {
  const manquantes = mentionsManquantes(conformite.mentions);
  const faites = TOTAL_MENTIONS - manquantes.length;
  const etiquettesOk = Boolean(conformite.dpeClasse && conformite.gesClasse);
  return {
    faites,
    total: TOTAL_MENTIONS,
    pourcentage: Math.round((faites / TOTAL_MENTIONS) * 100),
    conforme: manquantes.length === 0 && etiquettesOk,
    manquantes,
  };
}
