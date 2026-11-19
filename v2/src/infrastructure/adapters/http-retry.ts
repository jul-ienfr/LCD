/**
 * Politique de retry/backoff partagée des appels sortants (spec 006, FR-022).
 *
 * - 429, 5xx et erreurs réseau/timeout : transitoires → rejoués avec backoff
 *   exponentiel plafonné ;
 * - 4xx métier (400, 401, 402, 404, 409…) : jamais rejoués ;
 * - épuisement : le dernier statut HTTP est retourné (l'appelant garde son
 *   message d'erreur existant) ou la dernière erreur réseau est relancée.
 *
 * Les appelants doivent rendre leurs écritures idempotentes (clé
 * d'idempotence, ou opération de type upsert) avant de rejouer.
 */

export interface OptionsReessai {
  /** Nombre max de tentatives supplémentaires (défaut 2). */
  reessais?: number;
  /** Délai de base entre les tentatives en ms (défaut 500). */
  delaiBaseMs?: number;
  /** Délai max entre les tentatives en ms (défaut 8000). */
  delaiMaxMs?: number;
  /** Délai max d'une tentative (AbortSignal.timeout), en ms. */
  timeoutMs: number;
  /**
   * Rejouer une erreur réseau/timeout (défaut true). À passer false pour un
   * envoi sans clé d'idempotence (SMS, WhatsApp) : un 429/5xx est un refus
   * certain, rejouable, alors qu'un timeout peut cacher un envoi réussi —
   * mieux vaut ne pas risquer un doublon visible du destinataire.
   */
  rejouerErreurReseau?: boolean;
  /** fetch injectable pour les tests. */
  fetchImpl?: typeof fetch;
}

export function delaiBackoffMs(
  tentative: number,
  baseMs: number,
  maxMs: number,
): number {
  return Math.min(baseMs * 2 ** tentative, maxMs);
}

function estTransitoire(statut: number): boolean {
  return statut === 429 || statut >= 500;
}

export async function fetchAvecReessais(
  url: string | URL,
  init: RequestInit,
  options: OptionsReessai,
): Promise<Response> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxTentatives = 1 + Math.max(0, options.reessais ?? 2);
  const delaiBase = options.delaiBaseMs ?? 500;
  const delaiMax = options.delaiMaxMs ?? 8_000;
  const rejouerReseau = options.rejouerErreurReseau ?? true;

  let derniereErreur: unknown = null;
  let derniereReponse: Response | null = null;

  for (let tentative = 0; tentative < maxTentatives; tentative++) {
    if (tentative > 0) {
      await new Promise((resoudre) =>
        setTimeout(
          resoudre,
          delaiBackoffMs(tentative - 1, delaiBase, delaiMax),
        ),
      );
    }
    try {
      const reponse = await fetchImpl(url, {
        ...init,
        signal: init.signal ?? AbortSignal.timeout(options.timeoutMs),
      });
      if (!estTransitoire(reponse.status) || tentative === maxTentatives - 1) {
        return reponse;
      }
      derniereReponse = reponse;
      // Libère la connexion avant de rejouer.
      await reponse.text().catch(() => "");
    } catch (erreur) {
      if (!rejouerReseau) throw erreur;
      derniereErreur = erreur;
      derniereReponse = null;
    }
  }

  if (derniereReponse) return derniereReponse;
  throw derniereErreur instanceof Error
    ? derniereErreur
    : new Error("Requête sortante injoignable après plusieurs tentatives.");
}

/**
 * Rejoue une opération asynchrone non-HTTP (SMTP, …) selon la même
 * politique : seules les erreurs reconnues transitoires par l'appelant sont
 * rejouées, avec backoff exponentiel plafonné ; la dernière erreur est
 * relancée telle quelle après épuisement.
 */
export async function avecReessais<T>(
  operation: () => Promise<T>,
  options: {
    estTransitoire: (erreur: unknown) => boolean;
    /** Tentatives supplémentaires (défaut 2). */
    reessais?: number;
    delaiBaseMs?: number;
    delaiMaxMs?: number;
  },
): Promise<T> {
  const maxTentatives = 1 + Math.max(0, options.reessais ?? 2);
  const delaiBase = options.delaiBaseMs ?? 500;
  const delaiMax = options.delaiMaxMs ?? 8_000;

  let derniereErreur: unknown = null;
  for (let tentative = 0; tentative < maxTentatives; tentative++) {
    if (tentative > 0) {
      await new Promise((resoudre) =>
        setTimeout(
          resoudre,
          delaiBackoffMs(tentative - 1, delaiBase, delaiMax),
        ),
      );
    }
    try {
      return await operation();
    } catch (erreur) {
      if (!options.estTransitoire(erreur)) throw erreur;
      derniereErreur = erreur;
    }
  }
  throw derniereErreur;
}
