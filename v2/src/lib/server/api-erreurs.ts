/**
 * Enveloppe d'erreur des routes API (spec 006, FR-029).
 *
 * Un 5xx d'API ne doit jamais partir en page HTML — un client machine ne peut
 * rien en faire — et il n'est jamais silencieux : `handleError` (FR-020)
 * journalise déjà toute erreur serveur avec l'identifiant de requête. Ici on
 * garantit seulement la forme de la réponse : un JSON stable, non caché,
 * porteur de la référence à citer au support.
 */

export const CODE_ERREUR_INTERNE_API = "ERREUR_INTERNE";
export const MESSAGE_ERREUR_API =
  "Erreur interne du service ; l'incident a été journalisé.";

export function estRequeteApi(chemin: string): boolean {
  return chemin === "/api" || chemin.startsWith("/api/");
}

export interface ContexteErreurApi {
  chemin: string;
  statut: number;
  contentType: string | null;
}

/**
 * Vrai seulement pour une erreur serveur d'API rendue en HTML : les 5xx déjà
 * en JSON gardent leur format (l'API v1 a le sien), et les pages gardent leur
 * page d'erreur soignée.
 */
export function doitNormaliserErreurApi(contexte: ContexteErreurApi): boolean {
  if (!estRequeteApi(contexte.chemin)) return false;
  if (contexte.statut < 500) return false;
  return (contexte.contentType ?? "").toLowerCase().includes("text/html");
}

export function corpsErreurApi(requestId: string): string {
  return JSON.stringify({
    error: { code: CODE_ERREUR_INTERNE_API, message: MESSAGE_ERREUR_API },
    requestId,
  });
}

export function entetesErreurApi(requestId: string): Record<string, string> {
  return {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-request-id": requestId,
  };
}
