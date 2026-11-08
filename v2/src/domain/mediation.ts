// Médiation de la consommation : coordonnées de l'éditeur, affichées sur les
// mentions légales et rappelées sur les factures. Pur, sans framework.

export interface CoordonneesMediateur {
  nom: string;
  url: string | null;
  adresse: string | null;
}

function texteOuNull(valeur: string | null | undefined): string | null {
  const propre = valeur?.trim() ?? "";
  return propre ? propre : null;
}

/**
 * Construit les coordonnées depuis la configuration d'exploitation. Un nom
 * absent signifie « médiateur non désigné » : on ne fabrique jamais un nom.
 */
export function mediateurDepuisEnv(input: {
  nom?: string | null;
  url?: string | null;
  adresse?: string | null;
}): CoordonneesMediateur | null {
  const nom = texteOuNull(input.nom);
  if (!nom) return null;
  return {
    nom,
    url: texteOuNull(input.url),
    adresse: texteOuNull(input.adresse),
  };
}

/** Mention lisible, sans coordonnée inventée. */
export function mentionMediation(
  mediateur: CoordonneesMediateur | null,
): string | null {
  if (!mediateur) return null;
  const morceaux = [`Médiation de la consommation : ${mediateur.nom}`];
  if (mediateur.adresse) morceaux.push(mediateur.adresse);
  if (mediateur.url) morceaux.push(mediateur.url);
  return morceaux.join(" — ");
}

export function mediateurConfigure(
  mediateur: CoordonneesMediateur | null,
): boolean {
  return mediateur !== null;
}
