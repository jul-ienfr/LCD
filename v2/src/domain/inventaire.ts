import { ErreurMetier } from "./erreurs";

export type EtatBien = 1 | 2 | 3 | 4 | 5;

export type Bien = {
  id: string;
  tenantId: string;
  logementId: string;
  qr: string;
  categorie: string;
  label: string;
  dateAchat: string | null;
  prixAchatCentimes: number | null;
  fournisseur: string | null;
  garantieFin: string | null;
  lavagesNb: number;
  utilisationsNb: number;
  derniereUtilisation: string | null;
  etat: EtatBien;
  photoUrl: string | null;
  notes: string | null;
};

export type BienInput = Omit<
  Bien,
  "id" | "lavagesNb" | "utilisationsNb" | "derniereUtilisation"
> & { id?: string };

export const SEUIL_DORMANT_JOURS = 90;
export const SEUIL_ETAT_REMPLACEMENT = 2;
export const SEUIL_GARANTIE_JOURS = 30;
export const ETATS_BIEN: readonly EtatBien[] = [1, 2, 3, 4, 5];

export const LIBELLES_ETAT: Record<EtatBien, string> = {
  1: "À remplacer",
  2: "Usé",
  3: "Correct",
  4: "Bon",
  5: "Neuf",
};

const QR_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{1,63}$/;

export function qrValide(qr: string): boolean {
  return QR_RE.test(qr);
}

export function etatValide(etat: number): etat is EtatBien {
  return Number.isInteger(etat) && etat >= 1 && etat <= 5;
}

function joursEntre(depuis: string, jusqua: string): number | null {
  const a = Date.parse(`${depuis.slice(0, 10)}T00:00:00.000Z`);
  const b = Date.parse(`${jusqua.slice(0, 10)}T00:00:00.000Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

export function inactiviteJours(
  bien: Pick<Bien, "derniereUtilisation" | "dateAchat">,
  aujourdHui: string,
): number | null {
  const reference = bien.derniereUtilisation ?? bien.dateAchat;
  if (!reference) return null;
  return joursEntre(reference, aujourdHui);
}

export function garantieJoursRestants(
  bien: Pick<Bien, "garantieFin">,
  aujourdHui: string,
): number | null {
  if (!bien.garantieFin) return null;
  return joursEntre(aujourdHui, bien.garantieFin);
}

export type AlertesInventaire = {
  dormants: { bien: Bien; inactiviteJours: number }[];
  remplacements: Bien[];
  garanties: { bien: Bien; joursRestants: number }[];
};

export function alertesInventaire(
  biens: readonly Bien[],
  aujourdHui: string,
): AlertesInventaire {
  const dormants: AlertesInventaire["dormants"] = [];
  const remplacements: Bien[] = [];
  const garanties: AlertesInventaire["garanties"] = [];

  for (const bien of biens) {
    const inactif = inactiviteJours(bien, aujourdHui);
    if (inactif !== null && inactif > SEUIL_DORMANT_JOURS) {
      dormants.push({ bien, inactiviteJours: inactif });
    }
    if (bien.etat <= SEUIL_ETAT_REMPLACEMENT) {
      remplacements.push(bien);
    }
    const garantie = garantieJoursRestants(bien, aujourdHui);
    if (garantie !== null && garantie >= 0 && garantie < SEUIL_GARANTIE_JOURS) {
      garanties.push({ bien, joursRestants: garantie });
    }
  }

  return { dormants, remplacements, garanties };
}

export type StatsInventaire = {
  nbBiens: number;
  ageMoyenJours: number | null;
  rotations: number;
  coutParSejour: { bien: Bien; coutCentimes: number }[];
  topUsure: Bien[];
  budgetPrevisionnelCentimes: number;
};

export function statsInventaire(
  biens: readonly Bien[],
  aujourdHui: string,
): StatsInventaire {
  const ages: number[] = [];
  let rotations = 0;
  let budget = 0;
  const couts: StatsInventaire["coutParSejour"] = [];

  for (const bien of biens) {
    rotations += bien.utilisationsNb;
    if (bien.prixAchatCentimes && bien.prixAchatCentimes > 0) {
      const cout =
        bien.utilisationsNb > 0
          ? Math.round(bien.prixAchatCentimes / bien.utilisationsNb)
          : bien.prixAchatCentimes;
      couts.push({ bien, coutCentimes: cout });
    }
    if (bien.dateAchat) {
      const age = joursEntre(bien.dateAchat, aujourdHui);
      if (age !== null && age >= 0) ages.push(age);
    }
    if (bien.etat <= SEUIL_ETAT_REMPLACEMENT) {
      budget += bien.prixAchatCentimes ?? 0;
    }
  }

  const topUsure = [...biens].sort((a, b) => {
    if (a.etat !== b.etat) return a.etat - b.etat;
    return b.utilisationsNb + b.lavagesNb - (a.utilisationsNb + a.lavagesNb);
  });

  return {
    nbBiens: biens.length,
    ageMoyenJours: ages.length
      ? Math.round((ages.reduce((t, a) => t + a, 0) / ages.length) * 10) / 10
      : null,
    rotations,
    coutParSejour: couts.sort((a, b) => b.coutCentimes - a.coutCentimes),
    topUsure: topUsure.slice(0, 10),
    budgetPrevisionnelCentimes: budget,
  };
}

export function validerBien(input: {
  qr: string;
  categorie: string;
  label: string;
  prixAchatCentimes: number | null;
  etat: number;
}): void {
  if (!qrValide(input.qr)) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      "QR invalide : 2 à 64 caractères A-Z, a-z, 0-9, point, tiret ou underscore.",
    );
  }
  if (input.categorie.trim().length < 1 || input.categorie.length > 60) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      "La catégorie doit contenir 1 à 60 caractères.",
    );
  }
  if (input.label.trim().length < 1 || input.label.length > 120) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      "Le libellé doit contenir 1 à 120 caractères.",
    );
  }
  if (
    input.prixAchatCentimes !== null &&
    (!Number.isInteger(input.prixAchatCentimes) ||
      input.prixAchatCentimes < 0 ||
      input.prixAchatCentimes > 10_000_000)
  ) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      "Le prix d’achat doit être compris entre 0 et 100 000 €.",
    );
  }
  if (!etatValide(input.etat)) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      "L’état doit être un entier de 1 (à remplacer) à 5 (neuf).",
    );
  }
}
