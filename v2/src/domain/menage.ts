import { dateIsoValide } from "./calendrier";
import { ErreurMetier } from "./erreurs";

export type StatutMenage = "planifie" | "fait";

export const STATUTS_MENAGE: readonly StatutMenage[] = ["planifie", "fait"];

export const LIBELLES_STATUT_MENAGE: Record<StatutMenage, string> = {
  planifie: "Planifié",
  fait: "Fait",
};

export const TACHES_MENAGE_DEFAUT: readonly string[] = [
  "Sols",
  "Sanitaires",
  "Cuisine",
  "Literie",
  "Poubelles",
  "Réassort consommables",
];

export const TACHES_MENAGE_MAX = 30;
export const LIBELLE_TACHE_MAX = 120;
export const NOTES_MENAGE_MAX = 2000;

export interface TacheMenage {
  libelle: string;
  fait: boolean;
}

export interface Menage {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  date: string;
  statut: StatutMenage;
  notes: string;
  taches: TacheMenage[];
  createdAt: Date;
  updatedAt: Date;
}

export function refMenageValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function statutMenageValide(statut: string): statut is StatutMenage {
  return (STATUTS_MENAGE as readonly string[]).includes(statut);
}

export function tachesParDefaut(): TacheMenage[] {
  return TACHES_MENAGE_DEFAUT.map((libelle) => ({ libelle, fait: false }));
}

export function validerTaches(
  taches: readonly { libelle: string; fait?: boolean }[],
): TacheMenage[] {
  if (taches.length === 0 || taches.length > TACHES_MENAGE_MAX) {
    throw new ErreurMetier(
      "MENAGE_INVALIDE",
      `La checklist doit contenir 1 à ${TACHES_MENAGE_MAX} tâches.`,
    );
  }
  return taches.map((tache) => {
    const libelle = tache.libelle.trim();
    if (libelle.length < 2 || libelle.length > LIBELLE_TACHE_MAX) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `Chaque tâche doit contenir 2 à ${LIBELLE_TACHE_MAX} caractères.`,
      );
    }
    return { libelle, fait: tache.fait === true };
  });
}

export function validerMenage(input: {
  date: string;
  notes?: string;
  taches?: readonly { libelle: string; fait?: boolean }[];
}): { date: string; notes: string; taches: TacheMenage[] } {
  if (!dateIsoValide(input.date)) {
    throw new ErreurMetier("MENAGE_INVALIDE", "La date du ménage est invalide.");
  }
  const notes = (input.notes ?? "").trim();
  if (notes.length > NOTES_MENAGE_MAX) {
    throw new ErreurMetier(
      "MENAGE_INVALIDE",
      `Les notes sont limitées à ${NOTES_MENAGE_MAX} caractères.`,
    );
  }
  const taches = validerTaches(input.taches ?? tachesParDefaut());
  return { date: input.date, notes, taches };
}

export function avancementMenage(taches: readonly TacheMenage[]): {
  faites: number;
  total: number;
  pourcentage: number;
} {
  const total = taches.length;
  const faites = taches.filter((t) => t.fait).length;
  return {
    faites,
    total,
    pourcentage: total === 0 ? 0 : Math.round((faites / total) * 100),
  };
}
