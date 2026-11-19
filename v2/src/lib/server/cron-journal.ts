/**
 * Enveloppe de journalisation des routes de cron (spec 006, FR-001).
 *
 * Chaque route `/api/cron/*` déclarée dans le référentiel est enveloppée :
 * une exécution authentifiée = une ligne dans `executions_taches`.
 *
 * Un appel sans secret ou avec un mauvais secret n'est PAS journalisé :
 * ainsi, un déclencheur système mal configuré produit une absence visible
 * (le contrôle à 2× la cadence alerte), au lieu d'une exécution fantôme.
 *
 * Correspondance statut HTTP → statut d'exécution :
 *   2xx/3xx → ok ; `statutsIgnores` → ignore (module désactivé, verrou
 *   tenu) ; tout autre 4xx/5xx → erreur.
 */

import type { RequestHandler } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { executerTache, type StatutExecution } from "./journal-execution";

export interface OptionsCronJournal {
  /** Codes HTTP où la tâche a tourné sans rien faire (module désactivé). */
  statutsIgnores?: number[];
  /** Codes HTTP comptés comme succès de la tâche (ex. sonde dégradée). */
  statutsSucces?: number[];
}

export function cronAvecJournal(
  nom: string,
  handler: RequestHandler,
  options: OptionsCronJournal = {},
): RequestHandler {
  const statutsIgnores = new Set(options.statutsIgnores ?? []);
  const statutsSucces = new Set(options.statutsSucces ?? []);
  return async (event) => {
    // Sans secret configuré ou avec un secret invalide, la route répond
    // elle-même 503/401 : on ne journalise pas, l'absence fera foi.
    const authentifie =
      Boolean(env.CRON_SECRET) &&
      cronSecretValide(
        event.request.headers.get("authorization"),
        env.CRON_SECRET,
      );
    if (!authentifie) {
      return handler(event);
    }

    return executerTache(nom, "cron", async () => {
      const reponse = await handler(event);
      const statutHttp = reponse.status;
      let statut: StatutExecution = "ok";
      if (
        statutHttp >= 400 &&
        !statutsSucces.has(statutHttp) &&
        !statutsIgnores.has(statutHttp)
      ) {
        throw new Error(`La route de cron a répondu ${statutHttp} (échec).`);
      }
      if (statutsIgnores.has(statutHttp) && statutHttp >= 400) {
        statut = "ignore";
      }
      return {
        valeur: reponse,
        statut,
        compteurs: { statutHttp },
      };
    });
  };
}
