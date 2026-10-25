import { ErreurMetier } from "./erreurs";

export type Consommable = {
  id: string;
  tenantId: string;
  logementId: string;
  code: string;
  label: string;
  stock: number;
  unite: string;
  seuil: number;
  cible: number;
  consoRotation: number;
};

export type ConsommableInput = Omit<Consommable, "id"> & { id?: string };

export type StatutStock = "rupture" | "bas" | "ok";

export type MouvementStock = {
  id: string;
  tenantId: string;
  logementId: string;
  consommableId: string;
  type: "creation" | "conso" | "reassort" | "ajustement";
  quantite: number;
  avant: number;
  apres: number;
  qui: string;
  ref: string;
};

const CODE_RE = /^[a-z0-9][a-z0-9_.-]{1,63}$/;

export function codeConsommableValide(code: string): boolean {
  return CODE_RE.test(code);
}

export function statutConsommable(
  c: Pick<Consommable, "stock" | "seuil">,
): StatutStock {
  if (c.stock <= 0) return "rupture";
  if (c.stock <= c.seuil) return "bas";
  return "ok";
}

export function quantiteACourse(c: Consommable): number {
  return statutConsommable(c) === "ok" ? 0 : Math.max(0, c.cible - c.stock);
}

export function appliquerConsommation(stock: number, quantite: number): number {
  return Math.max(0, stock - Math.max(0, quantite));
}

export function appliquerReassort(stock: number, cible: number): number {
  return Math.max(stock, cible);
}

export type LigneCourse = {
  consommable: Consommable;
  statut: StatutStock;
  quantite: number;
};

export function listeCourses(items: readonly Consommable[]): {
  ruptures: LigneCourse[];
  bas: LigneCourse[];
  totalArticles: number;
} {
  const lignes = items
    .map((consommable) => ({
      consommable,
      statut: statutConsommable(consommable),
      quantite: quantiteACourse(consommable),
    }))
    .filter((ligne) => ligne.statut !== "ok");

  return {
    ruptures: lignes.filter((ligne) => ligne.statut === "rupture"),
    bas: lignes.filter((ligne) => ligne.statut === "bas"),
    totalArticles: lignes.reduce((total, ligne) => total + ligne.quantite, 0),
  };
}

export function validerNombreEntier(
  valeur: number,
  nom: string,
  max = 100_000,
): number {
  if (!Number.isInteger(valeur) || valeur < 0 || valeur > max) {
    throw new ErreurMetier(
      "STOCK_INVALIDE",
      `${nom} invalide : entier entre 0 et ${max} attendu.`,
    );
  }
  return valeur;
}
