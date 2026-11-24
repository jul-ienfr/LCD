import { fail } from "@sveltejs/kit";

/**
 * Conservation de la saisie après une erreur de validation (FR-041, spec 006).
 *
 * Une action qui refuse une saisie renvoie `fail` avec les valeurs du
 * formulaire : la page se réaffiche avec `form.erreur` et `form.valeurs`, le
 * module client de la racine replace ces valeurs dans les champs de même nom
 * (`src/lib/client/soumissions.ts`) et l'erreur reste annoncée. Une
 * redirection ne transporte pas la saisie : elle est réservée aux succès et
 * aux erreurs système sans champ à corriger.
 */

/** Valeurs d'un formulaire, texte uniquement, prêtes à être réaffichées. */
export type ValeursSaisie = Record<string, string | string[]>;

/**
 * Champs jamais réaffichés : un secret ne doit pas revenir dans le HTML ni
 * être recopié par le navigateur après un échec.
 */
const SENSIBLES =
  /(mot.?de.?passe|password|secret|token|jeton|confirmation|captcha|otp|code.?acces)/i;

function ajouter(valeurs: ValeursSaisie, nom: string, valeur: string): void {
  const existante = valeurs[nom];
  if (existante === undefined) {
    valeurs[nom] = valeur;
  } else if (Array.isArray(existante)) {
    existante.push(valeur);
  } else {
    valeurs[nom] = [existante, valeur];
  }
}

/**
 * Extrait les valeurs réaffichables d'un `FormData`. Les fichiers sont
 * ignorés (ils ne peuvent pas être rejoués depuis une valeur texte) et les
 * champs sensibles sont écartés sauf demande explicite.
 */
export function valeursSaisie(
  donnees: FormData,
  options: { exclure?: readonly string[]; garderSensibles?: readonly string[] } = {},
): ValeursSaisie {
  const exclure = new Set(options.exclure ?? []);
  const garder = new Set(options.garderSensibles ?? []);
  const valeurs: ValeursSaisie = {};
  for (const [nom, valeur] of donnees) {
    if (typeof valeur !== "string") continue;
    if (exclure.has(nom)) continue;
    if (SENSIBLES.test(nom) && !garder.has(nom)) continue;
    ajouter(valeurs, nom, valeur);
  }
  return valeurs;
}

/**
 * Échec de validation : 400 avec le motif et la saisie, jamais une
 * redirection qui perdrait les champs déjà remplis.
 */
export function echecSaisie(
  donnees: FormData,
  erreur: string,
  options: { statut?: number; exclure?: readonly string[] } = {},
) {
  return fail(options.statut ?? 400, {
    erreur,
    valeurs: valeursSaisie(donnees, options),
  });
}
