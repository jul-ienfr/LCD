export type DernierStatutFlux = "ok" | "partiel" | "erreur";

export interface FluxIcs {
  id: string;
  tenantId: string;
  logementId: string;
  canalId: string | null;
  libelle: string;
  url: string;
  actif: boolean;
  intervalleMinutes: number;
  derniereSync: Date | null;
  derniereTentative: Date | null;
  prochainEssai: Date | null;
  dernierStatut: DernierStatutFlux | null;
  dernierMessage: string | null;
  echecsConsecutifs: number;
  videsConsecutifs: number;
  etag: string | null;
  derniereModification: string | null;
  empreinte: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const INTERVALLE_MINUTES_DEFAUT = 5;
export const INTERVALLE_MINUTES_MIN = 1;
export const INTERVALLE_MINUTES_MAX = 24 * 60;
export const BACKOFF_MAX_MINUTES = 60;

/**
 * Valide une URL de flux ICS. Refuse HTTP, localhost, les IP privées et les
 * domaines internes pour éviter les requêtes SSRF depuis le serveur.
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

  const host = parsed.hostname.toLowerCase().replace(/\.$/u, "");
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "[::1]" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".home.arpa")
  ) {
    return false;
  }
  if (
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[01])\./u.test(host)
  ) {
    return false;
  }
  // IPv6 privées, loopback et link-local (URL.hostname conserve les crochets).
  if (
    /^\[(?:fc|fd|fe80|::ffff:127\.|::ffff:10\.|::ffff:192\.168\.)/u.test(host)
  ) {
    return false;
  }
  return host.includes(".");
}

export function libelleFluxValide(libelle: string): boolean {
  const valeur = libelle.trim();
  return valeur.length >= 2 && valeur.length <= 60;
}

export function intervalleValide(minutes: number): boolean {
  return (
    Number.isInteger(minutes) &&
    minutes >= INTERVALLE_MINUTES_MIN &&
    minutes <= INTERVALLE_MINUTES_MAX
  );
}

/** Un flux est dû quand il n'a jamais été planifié ou que l'échéance est passée. */
export function fluxDu(flux: FluxIcs, maintenant = new Date()): boolean {
  return !flux.prochainEssai || flux.prochainEssai.getTime() <= maintenant.getTime();
}

/** Retard toléré avant de considérer un flux comme anormalement silencieux. */
export function fluxEnRetard(
  flux: FluxIcs,
  maintenant = new Date(),
  toleranceMinutes = 10,
): boolean {
  if (!flux.actif) return false;
  const reference = flux.derniereTentative ?? flux.createdAt;
  return (
    maintenant.getTime() - reference.getTime() >
    (flux.intervalleMinutes + toleranceMinutes) * 60_000
  );
}

function appliquerJitter(minutes: number, aleatoire: () => number): number {
  const facteur = 0.9 + aleatoire() * 0.2;
  return Math.max(1, Math.round(minutes * facteur));
}

/**
 * Prochaine échéance : intervalle du flux après un succès, backoff exponentiel
 * plafonné après un échec. Le jitter évite que tous les flux tapent ensemble.
 */
export function calculerProchainEssai(input: {
  maintenant: Date;
  intervalleMinutes: number;
  echecsConsecutifs: number;
  aleatoire?: () => number;
}): Date {
  const aleatoire = input.aleatoire ?? Math.random;
  const intervalle = intervalleValide(input.intervalleMinutes)
    ? input.intervalleMinutes
    : INTERVALLE_MINUTES_DEFAUT;
  const base =
    input.echecsConsecutifs > 0
      ? Math.min(
          BACKOFF_MAX_MINUTES,
          intervalle * 2 ** (input.echecsConsecutifs - 1),
        )
      : intervalle;
  return new Date(input.maintenant.getTime() + appliquerJitter(base, aleatoire) * 60_000);
}
