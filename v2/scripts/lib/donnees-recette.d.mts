/**
 * Déclarations de types pour `donnees-recette.mjs` (le projet compile en
 * `allowJs: false`, et `scripts/` est hors du programme TypeScript : ce fichier
 * donne au module testé sa surface typée).
 */

export interface LogementRecette {
  code?: string | null;
  nom?: string | null;
}

export interface EtapePurge {
  id: string;
  table: string;
  description: string;
}

export declare const CODES_VITRINE: readonly string[];
export declare const NOMS_VITRINE: readonly string[];
export declare const CONSERVER_EMAIL_DEFAUT: string;
export declare const DOMAINES_RECETTE: readonly RegExp[];
export declare const ETAPES: readonly EtapePurge[];

export declare function estLogementDeRecette(logement: LogementRecette): boolean;
export declare function estCompteDeRecette(
  email: string | null | undefined,
  conserver?: string,
): boolean;
export declare function nomBaseRessembleARecette(
  nomBase: string | null | undefined,
): boolean;
export declare function ordreEtapes(): string[];
