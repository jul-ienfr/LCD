/**
 * Enregistrement serveur des mesures d'ergonomie (T089–T092).
 *
 * Ce module est le seul point d'entrée utilisé par les routes : il vérifie le
 * consentement, l'activation du suivi du tenant, puis délègue à
 * `enregistrerEvenementSuivi`. **Il ne lève jamais** : mesurer ne doit pas
 * casser un parcours. Un refus de consentement ou une panne de suivi est
 * silencieux pour la personne, journalisé pour l'exploitant.
 */
import type { RequestEvent } from "@sveltejs/kit";
import { logErreur } from "@/lib/logger";
import {
  entreeSuiviDepuisMesure,
  type MesureEntree,
} from "@/lib/mesure/instrumentation";
import {
  enregistrerEvenementSuivi,
  lireConsentementRequete,
  suiviActifPourTenant,
} from "@/lib/server/suivi";

/**
 * @returns `true` si l'événement a été transmis au dépôt de suivi, `false` si
 * le consentement manque, si le suivi est inactif pour ce tenant ou si
 * l'enregistrement a échoué.
 */
export async function mesurerParcours(
  event: RequestEvent,
  tenantId: string,
  entree: MesureEntree,
): Promise<boolean> {
  try {
    const consentement = lireConsentementRequete(event);
    if (!consentement?.mesure) return false;
    if (!(await suiviActifPourTenant(tenantId))) return false;
    await enregistrerEvenementSuivi(
      event,
      tenantId,
      consentement,
      entreeSuiviDepuisMesure(entree),
      { consentementRequis: "mesure" },
    );
    return true;
  } catch (error) {
    logErreur("mesure.parcours", error, { tenantId, nom: entree.nom });
    return false;
  }
}
