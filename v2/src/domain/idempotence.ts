import { createHash } from "node:crypto";

/**
 * Helpers d'idempotence purs (domaine). Toute écriture rejouable porte une
 * clé stable dérivée de ses composants métier. Le hash de payload permet de
 * comparer deux payloads sans stocker le contenu brut (PII).
 *
 * Convention : la clé est un SHA-256 hex des composants joints par « : ».
 * Les composants doivent être ordonnés de manière déterministe par l'appelant.
 */

/**
 * Génère une clé d'idempotence déterministe à partir de composants.
 * Les composants vides ou undefined sont exclus pour éviter les collisions
 * accidentelles entre clés de structure différente.
 *
 * @param composants - Liste ordonnée de composants (tenantId, entité, action…)
 * @returns Clé hex SHA-256 (64 caractères)
 */
export function cleIdempotence(...composants: (string | null | undefined)[]): string {
  const filtres = composants.filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );
  if (filtres.length === 0) {
    throw new Error("cleIdempotence : au moins un composant non vide requis");
  }
  return createHash("sha256").update(filtres.join(":")).digest("hex");
}

/**
 * Hash un payload (corps de webhook, payload API…) pour comparaison
 * idempotente sans conservation du contenu brut.
 *
 * @param payload - Contenu à hasher (string ou Buffer)
 * @returns Empreinte hex SHA-256 (64 caractères)
 */
export function hashPayload(payload: string | Buffer): string {
  return createHash("sha256").update(payload).digest("hex");
}

/**
 * Tronque une empreinte pour affichage/journalisation sans exposer
 * l'intégralité du hash (réduit la surface d'information).
 *
 * @param empreinte - Empreinte hex complète
 * @param longueur - Nombre de caractères à conserver (défaut 16)
 * @returns Préfixe de l'empreinte
 */
export function tronquerEmpreinte(empreinte: string, longueur: number = 16): string {
  return empreinte.slice(0, longueur);
}
