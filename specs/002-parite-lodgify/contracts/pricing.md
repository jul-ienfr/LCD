# Contrat — Revenue management

**Port cible**: `v2/src/application/ports/pricing.ts`
**Adapters**: `pricelabs/`, `beyond/`
**Statut**: proposition.

## 1. Interface

```ts
export interface Pricing {
  readonly source: "pricelabs" | "beyond";
  testerConnexion(): Promise<ResultatTest>;

  lireRecommandations(entree: {
    logementId: string;
    depuis: string;
    jusqua: string;
    devise: "EUR";
  }): Promise<RecommandationPrix[]>;

  pousserParametres(entree: {
    logementId: string;
    prixBaseCentimes: number;
    prixMinCentimes: number;
    prixMaxCentimes: number;
    occupationCible?: number;
    evenements?: EvenementLocal[];
  }): Promise<void>;
}

export interface RecommandationPrix {
  date: string;
  prixRecommandeCentimes: number;
  devise: "EUR";
  facteurs: Array<{
    code: "saison" | "occupation" | "evenement" | "delai" | "concurrence";
    libelle: string;
    impactCentimes: number;
  }>;
  confiance: "haute" | "moyenne" | "basse";
  source: "pricelabs" | "beyond";
}
```

## 2. Règles d'application

- Bornes `min`/`max` par logement, jamais dépassées sans confirmation.
- Un override manuel sur une date gagne sur la recommandation.
- L'application écrit `recommandations_prix.statut = appliquee`, l'auteur et
  l'heure.
- Le prix appliqué est poussé via `FournisseurCanal.pousserTarifs`.
- Si le push échoue, la recommandation reste `appliquee` mais une alerte est
  créée ; le prix local reste la référence.
- Un job quotidien importe 18 mois, mais n'applique rien automatiquement sans
  activation.

## 3. Écran « pourquoi ce prix »

Affiche :

- prix actuel, prix recommandé, écart en % et en € ;
- facteurs et leur impact ;
- comparaison marché (si fourni) ;
- confiance ;
- historique 30 jours ;
- actions : appliquer, ignorer, override.

## 4. Fallback

- Si le partenaire est indisponible : conserver les prix, alerter, ne pas
  appliquer de valeur par défaut.
- Si le logement n'a pas de bornes : demander min/max avant activation.
- Si la devise n'est pas EUR : refuser l'import (V2 est en euros).

## 5. Critères de contrat

- [ ] Import de 30 jours de recommandations.
- [ ] Facteurs affichés et compréhensibles.
- [ ] Application dans les bornes + audit.
- [ ] Override manuel respecté.
- [ ] Push canal vérifié.
- [ ] Panne partenaire : aucun prix modifié.
- [ ] Comparaison RevPAR avant/après.
