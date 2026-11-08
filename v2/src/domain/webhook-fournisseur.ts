const CLES_PROPRIETE = new Set([
  "propertyid",
  "apartmentid",
  "hotelid",
  "listingid",
  "rentalid",
]);

const CLES_OBJET_PROPRIETE = new Set([
  "property",
  "apartment",
  "hotel",
  "listing",
  "rental",
]);

/**
 * Extrait un identifiant de propriété d'un payload de webhook hétérogène.
 * Retourne null si aucun champ connu n'est trouvé : l'appelant peut alors
 * synchroniser toutes les affectations du fournisseur.
 */
export function extraireProprieteExterne(corps: string): string | null {
  let donnees: unknown;
  try {
    donnees = JSON.parse(corps);
  } catch {
    return null;
  }

  let trouvee: string | null = null;
  const parcourir = (valeur: unknown, profondeur: number): void => {
    if (trouvee || profondeur > 8 || !valeur || typeof valeur !== "object") {
      return;
    }
    for (const [cle, enfant] of Object.entries(valeur)) {
      const normalisee = cle.toLowerCase().replace(/[_-]/gu, "");
      if (
        CLES_PROPRIETE.has(normalisee) &&
        (typeof enfant === "string" || typeof enfant === "number")
      ) {
        const texte = String(enfant).trim();
        if (texte) {
          trouvee = texte;
          return;
        }
      }
      if (
        CLES_OBJET_PROPRIETE.has(normalisee) &&
        enfant &&
        typeof enfant === "object" &&
        "id" in enfant
      ) {
        const id = (enfant as { id?: unknown }).id;
        if (typeof id === "string" || typeof id === "number") {
          const texte = String(id).trim();
          if (texte) {
            trouvee = texte;
            return;
          }
        }
      }
      parcourir(enfant, profondeur + 1);
      if (trouvee) return;
    }
  };

  parcourir(donnees, 0);
  return trouvee;
}
