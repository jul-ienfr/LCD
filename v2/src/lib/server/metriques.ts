/**
 * Métriques applicatives légères pour la supervision des opérations
 * de synchronisation, webhooks et messages. En mémoire, jamais persistées :
 * exposées via /api/metrics ou /supervision pour observabilité immédiate.
 *
 * Convention : compteur monotone + dernier timestamp. Pas de dépendance
 * externe (Prometheus client optionnel en couche API).
 */

export interface MetriqueCompteur {
  total: number;
  erreurs: number;
  derniereAt: string | null;
  derniereErreurAt: string | null;
}

export interface MetriquesSync {
  pushAri: MetriqueCompteur;
  pullReservations: MetriqueCompteur;
  webhookRecu: MetriqueCompteur;
  reconciliation: MetriqueCompteur;
  messagesEnvoyes: MetriqueCompteur;
  messagesRecus: MetriqueCompteur;
}

function creerCompteur(): MetriqueCompteur {
  return { total: 0, erreurs: 0, derniereAt: null, derniereErreurAt: null };
}

function initialiserMetriques(): MetriquesSync {
  return {
    pushAri: creerCompteur(),
    pullReservations: creerCompteur(),
    webhookRecu: creerCompteur(),
    reconciliation: creerCompteur(),
    messagesEnvoyes: creerCompteur(),
    messagesRecus: creerCompteur(),
  };
}

// Singleton module : survit au sein du même processus Node.
const metriques = initialiserMetriques();

/**
 * Incrémente un compteur de succès.
 */
export function enregistrerSucces(cle: keyof MetriquesSync): void {
  const compteur = metriques[cle];
  compteur.total += 1;
  compteur.derniereAt = new Date().toISOString();
}

/**
 * Incrémente un compteur d'erreur.
 */
export function enregistrerErreur(cle: keyof MetriquesSync): void {
  const compteur = metriques[cle];
  compteur.total += 1;
  compteur.erreurs += 1;
  compteur.derniereAt = new Date().toISOString();
  compteur.derniereErreurAt = new Date().toISOString();
}

/**
 * Lit l'état courant de toutes les métriques (copie immutable).
 */
export function lireMetriques(): MetriquesSync {
  return JSON.parse(JSON.stringify(metriques)) as MetriquesSync;
}

/**
 * Réinitialise toutes les métriques (usage test uniquement).
 */
export function reinitialiserMetriques(): void {
  const frais = initialiserMetriques();
  for (const cle of Object.keys(frais) as (keyof MetriquesSync)[]) {
    metriques[cle] = frais[cle];
  }
}
