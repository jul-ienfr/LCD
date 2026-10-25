import { ErreurMetier } from "./erreurs";

export type CategoriePhrase = "arrivee" | "depart" | "urgence" | "general";

export const CATEGORIES_PHRASE: readonly CategoriePhrase[] = [
  "arrivee",
  "depart",
  "urgence",
  "general",
];

export const LIBELLES_CATEGORIE_PHRASE: Record<CategoriePhrase, string> = {
  arrivee: "Arrivée",
  depart: "Départ",
  urgence: "Urgence",
  general: "Général",
};

export const TITRE_PHRASE_MAX = 120;
export const CONTENU_PHRASE_MAX = 4000;

export const VARIABLES_PHRASE = [
  "voyageur",
  "logement",
  "debut",
  "fin",
  "heure",
] as const;

export type VariablePhrase = (typeof VARIABLES_PHRASE)[number];
export type VariablesPhrase = Record<VariablePhrase, string>;

export interface Phrase {
  id: string;
  tenantId: string;
  logementId: string | null;
  ref: string;
  categorie: CategoriePhrase;
  titre: string;
  contenu: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhraseDefaut {
  code: string;
  categorie: CategoriePhrase;
  titre: string;
  contenu: string;
}

export const PHRASES_DEFAUT: readonly PhraseDefaut[] = [
  {
    code: "arrivee",
    categorie: "arrivee",
    titre: "Message d’arrivée",
    contenu:
      "Bonjour {voyageur}, votre séjour au {logement} commence le {debut}. L’arrivée est possible à partir de {heure}. À très vite !",
  },
  {
    code: "depart",
    categorie: "depart",
    titre: "Message de départ",
    contenu:
      "Bonjour {voyageur}, votre séjour au {logement} se termine le {fin}. Merci de laisser les clés sur la table et de fermer à clé. Bon voyage !",
  },
  {
    code: "urgence",
    categorie: "urgence",
    titre: "Consignes d’urgence",
    contenu:
      "En cas d’urgence au {logement}, contactez-nous immédiatement. Numéros utiles : 112 (urgences), 18 (pompiers).",
  },
  {
    code: "general",
    categorie: "general",
    titre: "Remerciement",
    contenu:
      "Merci {voyageur} pour votre séjour au {logement} ! Au plaisir de vous accueillir à nouveau.",
  },
];

export function refPhraseValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function categoriePhraseValide(
  categorie: string,
): categorie is CategoriePhrase {
  return (CATEGORIES_PHRASE as readonly string[]).includes(categorie);
}

export function validerPhrase(input: {
  categorie: string;
  titre: string;
  contenu: string;
}): { categorie: CategoriePhrase; titre: string; contenu: string } {
  if (!categoriePhraseValide(input.categorie)) {
    throw new ErreurMetier(
      "PHRASE_INVALIDE",
      "La catégorie de la phrase est invalide.",
    );
  }
  const titre = input.titre.trim();
  if (titre.length < 2 || titre.length > TITRE_PHRASE_MAX) {
    throw new ErreurMetier(
      "PHRASE_INVALIDE",
      `Le titre doit contenir 2 à ${TITRE_PHRASE_MAX} caractères.`,
    );
  }
  const contenu = input.contenu.trim();
  if (contenu.length < 2 || contenu.length > CONTENU_PHRASE_MAX) {
    throw new ErreurMetier(
      "PHRASE_INVALIDE",
      `Le message doit contenir 2 à ${CONTENU_PHRASE_MAX} caractères.`,
    );
  }
  return { categorie: input.categorie, titre, contenu };
}

export function appliquerVariables(
  contenu: string,
  variables: VariablesPhrase,
): string {
  return contenu.replace(/\{(\w+)\}/g, (entier, nom: string) => {
    if ((VARIABLES_PHRASE as readonly string[]).includes(nom)) {
      return variables[nom as VariablePhrase];
    }
    return entier;
  });
}
