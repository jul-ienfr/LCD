import { redirect } from "@sveltejs/kit";

/**
 * Flux serveur en deux étapes des actions destructrices (FR-039, spec 006).
 *
 * Utilisation dans une action destructrice, une fois les champs lus :
 *
 * ```ts
 * exigerConfirmation(event, donnees, {
 *   action: "supprimer",
 *   retour: "/hote/phrases",
 *   cible: id,
 *   parametres: { logement: logementId },
 * });
 * // ... le reste de l'action ne s'exécute qu'après confirmation
 * ```
 *
 * Premier envoi : la fonction redirige (303) vers la page de retour avec
 * `?confirmer=<jeton>&cible=…`, sans toucher aux données ; la page affiche la
 * question et un formulaire qui renvoie `confirmation=<jeton>`. Second envoi :
 * le champ est présent, l'action s'exécute. Aucun chemin ne détruit donc une
 * donnée sur un seul envoi.
 */
export interface OptionsConfirmation {
  /** Nom de l'action confirmée (`supprimer`, `revoquer`, `retirer`, ...). */
  action: string;
  /**
   * Jeton de confirmation quand une même action porte plusieurs gestes
   * (`statut` porte aussi « terminer » : seule l'annulation confirme).
   * Défaut : `action`.
   */
  jeton?: string;
  /** Page de retour, chemin absolu, éventuellement avec paramètres. */
  retour: string;
  /** Élément visé, reporté dans l'URL pour que la page sache quoi confirmer. */
  cible?: string | null;
  /** Paramètres de la page à conserver (logement, langue, mois, ...). */
  parametres?: Record<string, string | null | undefined>;
}

/** Jeton effectif de la confirmation. */
export function jetonConfirmation(options: OptionsConfirmation): string {
  return options.jeton ?? options.action;
}

/** Chemin de retour qui demande la confirmation (première étape). */
export function cheminConfirmation(options: OptionsConfirmation): string {
  const url = new URL(options.retour, "http://local.invalid");
  for (const [cle, valeur] of Object.entries(options.parametres ?? {})) {
    if (valeur !== null && valeur !== undefined && valeur !== "") {
      url.searchParams.set(cle, valeur);
    }
  }
  url.searchParams.set("confirmer", jetonConfirmation(options));
  if (options.cible !== null && options.cible !== undefined && options.cible !== "") {
    url.searchParams.set("cible", options.cible);
  }
  return `${url.pathname}${url.search}`;
}

/** Vrai si l'envoi porte la confirmation de ce geste (seconde étape). */
export function confirmationFournie(
  donnees: FormData,
  jeton: string,
): boolean {
  return donnees.get("confirmation") === jeton;
}

/**
 * Bloque l'action tant que la confirmation n'est pas jointe : sans le champ,
 * la fonction lève la redirection de la première étape.
 */
export function exigerConfirmation(
  donnees: FormData,
  options: OptionsConfirmation,
): void {
  if (confirmationFournie(donnees, jetonConfirmation(options))) return;
  redirect(303, cheminConfirmation(options));
}
