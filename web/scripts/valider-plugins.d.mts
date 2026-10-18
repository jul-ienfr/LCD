// Déclarations pour le chargeur plugins (JS écrit en ESM natif, consommé par
// la CLI node scripts/ ET par Vitest via import).
export type ResultatValidation = { dossier: string; actif?: boolean; erreurs: string[] };
export declare const ID_CONNUS: Set<string>;
export declare function parserYamlManifeste(texte: string): { obj: Record<string, unknown>; erreurs: string[] };
export declare function validerManifeste(
  obj: Record<string, unknown>,
  ctx: {
    dossier?: string;
    erreursParse?: string[];
    rolesConnus: Set<string>;
    flagsConnus: Set<string>;
    allow: { lecture: Set<string>; ecriture: Set<string>; prefixes: string[] };
    routeExiste: (route: string, dossier: string) => boolean;
    i18nFichier?: string | null;
  },
): { erreurs: string[]; actif: boolean };
export declare function validerTout(racine?: string): ResultatValidation[];
export declare function synchroniserFlags(): { features: Set<string>; erreurs: string[] } | null;
