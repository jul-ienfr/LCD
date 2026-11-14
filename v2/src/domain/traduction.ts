import type { LanguePublique } from "./page-publique";
import { LANGUES_PUBLIQUES } from "./page-publique";
import { ErreurMetier } from "./erreurs";
import { contientCodeSensible } from "./message-voyageur";

export const TRADUCTION_CARACTERES_MAX = 4_000;

const NOMS_LANGUES: Record<LanguePublique, string> = {
  fr: "français",
  en: "anglais",
  es: "espagnol",
  it: "italien",
  de: "allemand",
  nl: "néerlandais",
};

export function langueTraductionValide(
  valeur: string,
): valeur is LanguePublique {
  return (LANGUES_PUBLIQUES as readonly string[]).includes(valeur);
}

export function normaliserLangue(valeur: string | null | undefined): LanguePublique {
  const propre = (valeur ?? "").trim().toLowerCase().slice(0, 2);
  return langueTraductionValide(propre) ? propre : "fr";
}

export function nomLangue(langue: LanguePublique): string {
  return NOMS_LANGUES[langue];
}

const LANGUES_AVEC_ARTICLE_DEFINI = new Set<LanguePublique>(["fr", "nl"]);

function depuisLangue(langue: LanguePublique): string {
  const nom = nomLangue(langue);
  return LANGUES_AVEC_ARTICLE_DEFINI.has(langue)
    ? `du ${nom}`
    : `de l’${nom}`;
}

function versLangue(langue: LanguePublique): string {
  const nom = nomLangue(langue);
  return LANGUES_AVEC_ARTICLE_DEFINI.has(langue)
    ? `vers le ${nom}`
    : `vers l’${nom}`;
}

export interface InviteTraduction {
  texte: string;
  de: LanguePublique;
  vers: LanguePublique;
}

/**
 * Invite volontairement minimale : la traduction ne doit ni enrichir ni
 * réécrire le message. Un code d'accès bloque la traduction plutôt que d'être
 * envoyé au fournisseur LLM.
 */
export function construireInviteTraduction(input: InviteTraduction): string {
  const texte = input.texte.trim();
  if (!texte) {
    throw new ErreurMetier("TRADUCTION_INVALIDE", "Le texte est vide.");
  }
  if (texte.length > TRADUCTION_CARACTERES_MAX) {
    throw new ErreurMetier(
      "TRADUCTION_INVALIDE",
      `Le texte est limité à ${TRADUCTION_CARACTERES_MAX} caractères.`,
    );
  }
  if (contientCodeSensible(texte)) {
    throw new ErreurMetier(
      "TRADUCTION_INVALIDE",
      "La traduction d’un message contenant un code d’accès est refusée.",
    );
  }
  return [
    `Traduis le message suivant ${depuisLangue(input.de)} ${versLangue(input.vers)}.`,
    "Conserve le sens, le ton, les noms propres et les dates. N’ajoute aucune information.",
    "Réponds uniquement par la traduction, sans préambule ni guillemets.",
    "",
    texte,
  ].join("\n");
}

export function verifierTraduction(texte: string): string[] {
  const propre = texte.trim();
  const alertes: string[] = [];
  if (!propre) alertes.push("La traduction est vide.");
  if (propre.length > TRADUCTION_CARACTERES_MAX) {
    alertes.push(
      `La traduction dépasse ${TRADUCTION_CARACTERES_MAX} caractères.`,
    );
  }
  if (contientCodeSensible(propre)) {
    alertes.push("La traduction contient un code d’accès.");
  }
  return alertes;
}
