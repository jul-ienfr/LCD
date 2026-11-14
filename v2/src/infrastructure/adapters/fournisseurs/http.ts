import { ErreurMetier } from "@/domain/erreurs";

export interface RequeteFournisseur {
  url: string;
  methode?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  entetes?: Record<string, string>;
  corps?: unknown;
  corpsBrut?: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  /** Nombre max de tentatives supplémentaires (défaut 0 = pas de retry). */
  reessais?: number;
  /** Délai de base entre les tentatives en ms (défaut 500). */
  delaiBaseMs?: number;
  /** Délai max entre les tentatives en ms (défaut 8000). */
  delaiMaxMs?: number;
}

function messageErreur(donnees: unknown, statut: number): string {
  if (typeof donnees === "string" && donnees.trim()) {
    return donnees.trim().slice(0, 300);
  }
  if (donnees && typeof donnees === "object") {
    const objet = donnees as Record<string, unknown>;
    const candidat =
      objet.message ?? objet.error ?? objet.detail ?? objet.errors ?? null;
    if (typeof candidat === "string") return candidat.slice(0, 300);
    if (candidat && typeof candidat === "object") {
      return JSON.stringify(candidat).slice(0, 300);
    }
  }
  return `HTTP ${statut}`;
}

/**
 * Classifie une erreur HTTP fournisseur pour un retry sélectif.
 * - 429 : rate limit → retry après délai
 * - 5xx : serveur en erreur → retry avec backoff
 * - timeout / réseau : transitoire → retry avec backoff
 * - 409 : conflit métier → pas de retry
 * - 4xx autre : erreur client → pas de retry
 */
function estTransitoire(statut: number | null): boolean {
  if (statut === null) return true; // réseau / timeout
  if (statut === 429) return true;
  return statut >= 500;
}

function erreurPourStatut(statut: number, donnees: unknown): ErreurMetier {
  const message = messageErreur(donnees, statut);
  if (statut === 429) {
    return new ErreurMetier(
      "FOURNISSEUR_RATE_LIMIT",
      `Fournisseur en limitation de débit (429) : ${message}`,
    );
  }
  if (statut === 409) {
    return new ErreurMetier(
      "FOURNISSEUR_CONFLIT",
      `Fournisseur en conflit (409) : ${message}`,
    );
  }
  return new ErreurMetier(
    "FOURNISSEUR_INDISPONIBLE",
    `Fournisseur en erreur (${statut}) : ${message}`,
  );
}

function delaiBackoff(tentative: number, baseMs: number, maxMs: number): number {
  const delai = baseMs * 2 ** tentative;
  return Math.min(delai, maxMs);
}

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requeteFournisseur<T>(
  requete: RequeteFournisseur,
): Promise<T> {
  const fetchImpl = requete.fetchImpl ?? fetch;
  const maxTentatives = 1 + (requete.reessais ?? 0);
  const delaiBase = requete.delaiBaseMs ?? 500;
  const delaiMax = requete.delaiMaxMs ?? 8_000;
  const corps =
    requete.corpsBrut ??
    (requete.corps === undefined ? undefined : JSON.stringify(requete.corps));

  let derniereErreur: ErreurMetier | null = null;

  for (let tentative = 0; tentative < maxTentatives; tentative++) {
    if (tentative > 0 && derniereErreur) {
      await attendre(delaiBackoff(tentative - 1, delaiBase, delaiMax));
    }

    let reponse: Response;
    try {
      reponse = await fetchImpl(requete.url, {
        method: requete.methode ?? "GET",
        headers: {
          Accept: "application/json",
          ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
          ...requete.entetes,
        },
        body: corps,
        signal: AbortSignal.timeout(requete.timeoutMs),
      });
    } catch (error) {
      // Réseau / timeout : transitoire, retry possible.
      derniereErreur = new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        `Fournisseur injoignable : ${
          error instanceof Error ? error.message : "erreur réseau"
        }`,
      );
      continue;
    }

    const texte = await reponse.text();
    let donnees: unknown = null;
    if (texte) {
      try {
        donnees = JSON.parse(texte) as unknown;
      } catch {
        donnees = texte;
      }
    }

    if (reponse.ok) {
      return donnees as T;
    }

    derniereErreur = erreurPourStatut(reponse.status, donnees);

    // 409 et 4xx autres (hors 429) : pas de retry.
    if (!estTransitoire(reponse.status)) {
      throw derniereErreur;
    }
  }

  throw derniereErreur ?? new ErreurMetier(
    "FOURNISSEUR_INDISPONIBLE",
    "Fournisseur injoignable après plusieurs tentatives.",
  );
}

export function urlAvecParametres(
  base: string,
  chemin: string,
  parametres: Record<string, string | number | boolean | undefined>,
): string {
  const url = new URL(
    `${base.replace(/\/+$/u, "")}/${chemin.replace(/^\/+/u, "")}`,
  );
  for (const [cle, valeur] of Object.entries(parametres)) {
    if (valeur !== undefined) url.searchParams.set(cle, String(valeur));
  }
  return url.toString();
}

export function exigerCle(valeur: string | undefined, nom: string): string {
  const cle = valeur?.trim();
  if (!cle) {
    throw new ErreurMetier(
      "FOURNISSEUR_INDISPONIBLE",
      `Clé ${nom} absente de la configuration serveur.`,
    );
  }
  return cle;
}

export function centimes(valeur: unknown): number | null {
  if (typeof valeur === "number" && Number.isFinite(valeur)) {
    return Math.round(valeur * 100);
  }
  if (typeof valeur === "string" && valeur.trim()) {
    const nombre = Number(valeur);
    return Number.isFinite(nombre) ? Math.round(nombre * 100) : null;
  }
  return null;
}

export function texteOuNull(valeur: unknown): string | null {
  return typeof valeur === "string" && valeur.trim() ? valeur.trim() : null;
}
