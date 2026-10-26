import type {
  RechercheRepository,
  ResultatRecherche,
} from "../ports/recherche-repository";

export const RECHERCHE_MIN = 2;
export const RECHERCHE_MAX = 80;

export function requeteRechercheValide(q: string): boolean {
  const valeur = q.trim();
  return valeur.length >= RECHERCHE_MIN && valeur.length <= RECHERCHE_MAX;
}

export class RechercherRefs {
  constructor(private readonly recherche: RechercheRepository) {}

  async executer(tenantId: string, q: string): Promise<ResultatRecherche[]> {
    const valeur = q.trim();
    if (!requeteRechercheValide(valeur)) return [];
    return this.recherche.chercher(tenantId, valeur, 40);
  }
}
