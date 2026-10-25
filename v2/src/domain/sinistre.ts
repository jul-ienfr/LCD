import { ErreurMetier } from "./erreurs";
import { aujourdHuiIso, dateIsoValide } from "./objet-trouve";

export type TypeSinistre =
  | "degat_eaux"
  | "incendie"
  | "vol"
  | "casse"
  | "autre";

export type StatutSinistre = "declare" | "expertise" | "indemnise" | "clos";

export const TYPES_SINISTRE: readonly TypeSinistre[] = [
  "degat_eaux",
  "incendie",
  "vol",
  "casse",
  "autre",
];

export const LIBELLES_TYPE_SINISTRE: Record<TypeSinistre, string> = {
  degat_eaux: "Dégât des eaux",
  incendie: "Incendie",
  vol: "Vol",
  casse: "Casse",
  autre: "Autre",
};

export const STATUTS_SINISTRE: readonly StatutSinistre[] = [
  "declare",
  "expertise",
  "indemnise",
  "clos",
];

export const LIBELLES_STATUT_SINISTRE: Record<StatutSinistre, string> = {
  declare: "Déclaré",
  expertise: "En expertise",
  indemnise: "Indemnisé",
  clos: "Clos",
};

export const DESCRIPTION_SINISTRE_MAX = 2000;
export const MONTANT_SINISTRE_MAX_CENTIMES = 1_000_000_00;

export interface Sinistre {
  id: string;
  tenantId: string;
  logementId: string;
  ref: string;
  type: TypeSinistre;
  date: string;
  description: string;
  montantEstimeCentimes: number;
  franchiseCentimes: number;
  statut: StatutSinistre;
  montantIndemniseCentimes: number | null;
  numeroDeclaration: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function refSinistreValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function typeSinistreValide(type: string): type is TypeSinistre {
  return (TYPES_SINISTRE as readonly string[]).includes(type);
}

export function statutSinistreValide(
  statut: string,
): statut is StatutSinistre {
  return (STATUTS_SINISTRE as readonly string[]).includes(statut);
}

export function statutSuivant(
  statut: StatutSinistre,
): StatutSinistre | null {
  switch (statut) {
    case "declare":
      return "expertise";
    case "expertise":
      return "indemnise";
    case "indemnise":
      return "clos";
    default:
      return null;
  }
}

function montantValide(centimes: number, libelle: string): number {
  if (
    !Number.isInteger(centimes) ||
    centimes < 0 ||
    centimes > MONTANT_SINISTRE_MAX_CENTIMES
  ) {
    throw new ErreurMetier(
      "SINISTRE_INVALIDE",
      `${libelle} doit être un montant positif raisonnable.`,
    );
  }
  return centimes;
}

export function validerDeclaration(input: {
  type: string;
  date: string;
  description: string;
  montantEstimeCentimes: number;
  franchiseCentimes?: number | null;
  numeroDeclaration?: string | null;
}): {
  type: TypeSinistre;
  date: string;
  description: string;
  montantEstimeCentimes: number;
  franchiseCentimes: number;
  montantIndemniseCentimes: null;
  numeroDeclaration: string | null;
} {
  if (!typeSinistreValide(input.type)) {
    throw new ErreurMetier(
      "SINISTRE_INVALIDE",
      "Le type de sinistre est invalide.",
    );
  }
  if (!dateIsoValide(input.date)) {
    throw new ErreurMetier("SINISTRE_INVALIDE", "La date est invalide.");
  }
  if (input.date > aujourdHuiIso()) {
    throw new ErreurMetier(
      "SINISTRE_INVALIDE",
      "La date du sinistre ne peut pas être future.",
    );
  }
  const description = input.description.trim();
  if (
    description.length < 10 ||
    description.length > DESCRIPTION_SINISTRE_MAX
  ) {
    throw new ErreurMetier(
      "SINISTRE_INVALIDE",
      `La description doit contenir 10 à ${DESCRIPTION_SINISTRE_MAX} caractères.`,
    );
  }
  const montantEstimeCentimes = montantValide(
    input.montantEstimeCentimes,
    "Le montant estimé",
  );
  const franchiseCentimes = montantValide(
    input.franchiseCentimes ?? 0,
    "La franchise",
  );
  if (franchiseCentimes > montantEstimeCentimes) {
    throw new ErreurMetier(
      "SINISTRE_INVALIDE",
      "La franchise ne peut pas dépasser le montant estimé.",
    );
  }
  const numero = String(input.numeroDeclaration ?? "").trim();
  if (numero.length > 64) {
    throw new ErreurMetier(
      "SINISTRE_INVALIDE",
      "Le numéro de déclaration est limité à 64 caractères.",
    );
  }
  return {
    type: input.type,
    date: input.date,
    description,
    montantEstimeCentimes,
    franchiseCentimes,
    montantIndemniseCentimes: null,
    numeroDeclaration: numero || null,
  };
}

export function avancerStatut(input: {
  statut: StatutSinistre;
  montantIndemniseCentimes?: number | null;
}): { statut: StatutSinistre; montantIndemniseCentimes: number | null } {
  const suivant = statutSuivant(input.statut);
  if (!suivant) {
    throw new ErreurMetier("SINISTRE_INVALIDE", "Le dossier est déjà clos.");
  }
  if (suivant === "indemnise") {
    if (
      input.montantIndemniseCentimes === null ||
      input.montantIndemniseCentimes === undefined
    ) {
      throw new ErreurMetier(
        "SINISTRE_INVALIDE",
        "Indiquez le montant indemnisé.",
      );
    }
    return {
      statut: suivant,
      montantIndemniseCentimes: montantValide(
        input.montantIndemniseCentimes,
        "Le montant indemnisé",
      ),
    };
  }
  return { statut: suivant, montantIndemniseCentimes: null };
}

export function montantAttendu(
  sinistre: Pick<
    Sinistre,
    "montantEstimeCentimes" | "franchiseCentimes" | "montantIndemniseCentimes"
  >,
): number {
  if (sinistre.montantIndemniseCentimes !== null) {
    return sinistre.montantIndemniseCentimes;
  }
  return Math.max(
    0,
    sinistre.montantEstimeCentimes - sinistre.franchiseCentimes,
  );
}

export interface ResumeSinistres {
  total: number;
  ouverts: number;
  declares: number;
  expertises: number;
  indemnises: number;
  clos: number;
  totalEstimeCentimes: number;
  totalIndemniseCentimes: number;
  resteAttenduCentimes: number;
}

export function resumeSinistres(
  sinistres: readonly Sinistre[],
): ResumeSinistres {
  const ouverts = sinistres.filter((s) => s.statut !== "clos");
  return {
    total: sinistres.length,
    ouverts: ouverts.length,
    declares: sinistres.filter((s) => s.statut === "declare").length,
    expertises: sinistres.filter((s) => s.statut === "expertise").length,
    indemnises: sinistres.filter((s) => s.statut === "indemnise").length,
    clos: sinistres.filter((s) => s.statut === "clos").length,
    totalEstimeCentimes: sinistres.reduce(
      (somme, s) => somme + s.montantEstimeCentimes,
      0,
    ),
    totalIndemniseCentimes: sinistres.reduce(
      (somme, s) => somme + (s.montantIndemniseCentimes ?? 0),
      0,
    ),
    resteAttenduCentimes: ouverts.reduce(
      (somme, s) => somme + montantAttendu(s),
      0,
    ),
  };
}
