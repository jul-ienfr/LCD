/**
 * Chiffrement applicatif des identifiants partenaires (clés API, tokens).
 * Utilise AES-256-GCM (authentifié) avec une clé maître dérivée de
 * l'environnement. Jamais de secret en clair en base ni dans les logs.
 *
 * Convention : le résultat est `iv:tag:ciphertext` en base64url.
 * La clé maître vient de CHIFFREMENT_MASTER_KEY (env) ou BETTER_AUTH_SECRET.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHME = "aes-256-gcm";
const IV_TAILLE = 12;
const TAG_TAILLE = 16;

let cleMaitreCache: Buffer | null = null;

/**
 * Dérive une clé AES-256 (32 octets) à partir du secret maître.
 * SHA-256 est suffisant ici car le secret est déjà aléatoire (≥32 chars).
 */
function deriverCle(secret?: string): Buffer {
  if (cleMaitreCache && !secret) return cleMaitreCache;
  const source = secret ?? process.env.CHIFFREMENT_MASTER_KEY ?? process.env.BETTER_AUTH_SECRET ?? "dev-only-change-me-please-32chars-min";
  const cle = createHash("sha256").update(`lcd-chiffrement:${source}`).digest();
  if (!secret) cleMaitreCache = cle;
  return cle;
}

/**
 * Chiffre une donnée sensible (clé API, token fournisseur).
 * @param clair - Donnée en clair à protéger
 * @param secret - Clé maître optionnelle (défaut : env)
 * @returns String format `iv:tag:ciphertext` en base64url
 */
export function chiffrer(clair: string, secret?: string): string {
  const cle = deriverCle(secret);
  const iv = randomBytes(IV_TAILLE);
  const cipher = createCipheriv(ALGORITHME, cle, iv);
  const chiffre = Buffer.concat([cipher.update(clair, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    chiffre.toString("base64url"),
  ].join(":");
}

/**
 * Déchiffre une donnée protégée par `chiffrer()`.
 * @param chiffre - String format `iv:tag:ciphertext` en base64url
 * @param secret - Clé maître optionnelle (défaut : env)
 * @returns Donnée en clair
 * @throws Si le format est invalide ou l'authentification échoue
 */
export function dechiffrer(chiffre: string, secret?: string): string {
  const parties = chiffre.split(":");
  if (parties.length !== 3) {
    throw new Error("chiffrement : format invalide (attendu iv:tag:ciphertext)");
  }
  const [ivB64, tagB64, dataB64] = parties;
  const iv = Buffer.from(ivB64!, "base64url");
  const tag = Buffer.from(tagB64!, "base64url");
  const data = Buffer.from(dataB64!, "base64url");

  if (iv.length !== IV_TAILLE || tag.length !== TAG_TAILLE) {
    throw new Error("chiffrement : IV ou tag de taille incorrecte");
  }

  const cle = deriverCle(secret);
  const decipher = createDecipheriv(ALGORITHME, cle, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data, undefined, "utf8") + decipher.final("utf8");
}

/**
 * Vérifie qu'un payload chiffré est déchiffrable sans le révéler.
 * Utile pour valider la rotation de clé sans exposer le secret.
 */
export function verifierChiffrement(chiffre: string, secret?: string): boolean {
  try {
    dechiffrer(chiffre, secret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Réinitialise le cache de clé (usage test uniquement).
 */
export function reinitialiserCleMaitre(): void {
  cleMaitreCache = null;
}
