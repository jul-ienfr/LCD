export type DernierStatutFlux = "ok" | "erreur";

export interface FluxIcs {
  id: string;
  tenantId: string;
  logementId: string;
  libelle: string;
  url: string;
  actif: boolean;
  derniereSync: Date | null;
  dernierStatut: DernierStatutFlux | null;
  dernierMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Valide une URL de flux ICS. Refuse HTTP, localhost, les IP privées et les
 * domaines .local pour éviter les requêtes SSRF depuis le serveur.
 */
export function urlIcsValide(url: string): boolean {
  if (!url || url.length > 2_000) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local")
  ) {
    return false;
  }
  if (
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return false;
  }
  return host.includes(".");
}

export function libelleFluxValide(libelle: string): boolean {
  const valeur = libelle.trim();
  return valeur.length >= 2 && valeur.length <= 60;
}
