/**
 * File de jobs durable — règles pures (spec 006, FR-025).
 *
 * Un job critique ne vit pas dans une minuterie mémoire : il est écrit dans
 * `jobs_outbox` avant d'être exécuté, puis réclamé, retenté avec backoff et
 * clos. Ce module ne touche ni la base ni l'horloge : il fixe les états, les
 * délais et les bornes, testables sans infrastructure.
 */

/** Statuts d'un job. `en_cours` n'est qu'une réclamation à bail. */
export const STATUTS_JOB = [
  "en_attente",
  "en_cours",
  "reussi",
  "echec",
] as const;

export type StatutJob = (typeof STATUTS_JOB)[number];

/** Cinq tentatives : assez pour absorber un incident court, borné. */
export const TENTATIVES_MAX_DEFAUT = 5;

/** Bail de réclamation : un worker mort libère sa place au bout de 10 min. */
export const BAIL_JOB_MINUTES = 10;

/** Taille d'un lot réclamé par passage : le cron reste court. */
export const LIMITE_LOT_JOBS = 20;

/** Backoff exponentiel 30 s, 1 min, 2 min, 4 min… plafonné à 1 h. */
export const DELAI_REESSAI_BASE_MS = 30_000;
export const DELAI_REESSAI_MAX_MS = 60 * 60_000;

/**
 * Délai avant la prochaine tentative, après `tentatives` échecs (1 = premier
 * échec). Jamais négatif, jamais au-delà du plafond.
 */
export function delaiReessaiMs(tentatives: number): number {
  const rang = Math.max(1, Math.floor(tentatives));
  return Math.min(
    DELAI_REESSAI_MAX_MS,
    DELAI_REESSAI_BASE_MS * 2 ** Math.min(rang - 1, 20),
  );
}

/** Un job qui a atteint son plafond passe en `echec` (visibilité supervision). */
export function doitAbandonner(tentatives: number, maximum: number): boolean {
  return tentatives >= Math.max(1, maximum);
}

/**
 * Statut et disponibilité après un échec. `tentativesApres` inclut l'échec
 * qui vient d'avoir lieu.
 */
export function apresEchec(
  tentativesApres: number,
  maximum: number,
  maintenant: Date,
): { statut: Extract<StatutJob, "en_attente" | "echec">; disponibleA: Date } {
  if (doitAbandonner(tentativesApres, maximum)) {
    return { statut: "echec", disponibleA: maintenant };
  }
  return {
    statut: "en_attente",
    disponibleA: new Date(
      maintenant.getTime() + delaiReessaiMs(tentativesApres),
    ),
  };
}

/** Un job réussi ou définitivement en échec ne sera plus réclamé. */
export function estTerminal(statut: StatutJob): boolean {
  return statut === "reussi" || statut === "echec";
}
