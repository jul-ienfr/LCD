# Plan pour lever les limites OTA

> **État au 1er novembre 2026.** Le registre des cinq fournisseurs et
> l’orchestration sont codés : activation super-admin, affectation par logement,
> push ARI idempotent, import des réservations OTA, cron et webhooks signés,
> pause/reprise d’une affectation sans perdre le mapping, outbox rejouable.
> Les règles de séjour sont saisies par date dans **Hôte → Prix** et poussées
> selon les capacités du fournisseur (Beds24/Channex complet, Smoobu min/max).
> Voir [FOURNISSEURS-CHANNEL-MANAGER.md](./FOURNISSEURS-CHANNEL-MANAGER.md).
> Le cut-off est configurable par logement et ferme les dates proches côté ARI
> et réservation directe. Le délai de préparation ferme les nuits après chaque
> départ. Les plans tarifaires par logement sont isolés et
> poussés à Channex ; les autres fournisseurs restent sur le tarif de base. Le
> flux iCal reste le filet de sécurité pour les OTA sans API certifiée.

## 1. Vérité de départ

Les quatre limites actuelles viennent d'une seule cause : **le canal utilisé est
iCal**. iCal ne transporte que des indisponibilités. Il ne peut pas porter des
tarifs, des restrictions, des réservations natives ni une synchronisation
temps réel.

Pour les lever, il faut une **API native OTA**. Trois chemins existent :

| Chemin | Délai réaliste | Coût | Marque | Lève les 4 limites |
|---|---|---|---|---|
| A. API d'un channel manager certifié | 3 à 5 mois | Abonnement fournisseur + intégration | Ton UI, fournisseur en coulisses | Oui |
| B. Devenir soi-même prestataire certifié | 12 à 24 mois | Équipe, sécurité, certification, support | Oui, total | Oui, si accepté |
| C. Rester iCal | 0 | 0 € | Oui | Non |

**Aucun chemin ne lève les quatre limites gratuitement.** La certification est
un contrat B2B. Booking.com annonce suspendre les intégrations de nouveaux
prestataires de connectivité jusqu'à nouvel ordre. Airbnb garde un programme
partenaire sélectif. Le chemin A est donc le seul réaliste à court terme.

## 2. Recommandation

Comparatif chiffré à jour :
[COMPARATIF-CHANNEL-MANAGER-2026-10.md](./COMPARATIF-CHANNEL-MANAGER-2026-10.md).

**Phase 1 : intégrer l'API d'un channel manager certifié dans la V2, en gardant
iCal comme secours.** La V2 reste l'interface et la marque ; le fournisseur
certifié porte les connexions OTA. C'est ce qui permet de lever tarifs,
restrictions, réservations natives et latence sans attendre une certification
propre.

Le meilleur point de départ est la **sandbox gratuite Channex** : API complète,
webhooks, tarifs et restrictions, sans carte. La production Channex est ensuite
facturée 130 $/mois + 0,50 $/unité vacances. Beds24 reste l'alternative la moins
chère, avec une API plus contrainte mais des webhooks booking/inventory
disponibles (délai d'environ une minute).

**Phase 2, optionnelle : viser la certification directe** seulement si le volume
et la stratégie le justifient. Booking étant en pause, la certification directe
ne peut pas être le plan de départ.

## 3. Architecture cible

```text
V2 (SvelteKit)
  └── CanalService
        ├── IcalAdapter          (existant, secours et long tail)
        ├── ApiAdapter Beds24    (pilote économique)
        ├── ApiAdapter RU        (marque blanche, scale)
        └── ApiAdapter direct    (plus tard, si certification)
```

Chaque canal porte un mode et des capacités :

```ts
type ModeSync = "ical" | "api";

type CapacitesCanal = {
  tarifs: boolean;
  restrictions: boolean;
  reservations: boolean;
  tempsReel: boolean;
  contenu: boolean;
  messagerie: boolean;
};
```

Le port applicatif reste stable :

```ts
interface ConnecteurCanal {
  code: string;
  capacites: CapacitesCanal;
  testerConnexion(): Promise<ResultatConnexion>;
  pousserDisponibilites(demande: DemandeDisponibilites): Promise<void>;
  pousserTarifs(demande: DemandeTarifs): Promise<void>;
  pousserRestrictions(demande: DemandeRestrictions): Promise<void>;
  recupererReservations(depuis: Date): Promise<ReservationExterne[]>;
  traiterWebhook(requete: RequeteWebhook): Promise<void>;
}
```

## 4. Ce qui lève chaque limite

### 4.1 Tarifs

- Ajouter un modèle de tarif par canal et par rate plan.
- Pousser les prix à chaque changement de `tarifs`, saison, extra ou taxe.
- Gérer la devise, les arrondis, les frais de ménage et les taxes.
- Prévoir un `outbox` pour ne pas perdre un push si l'API est indisponible.
- Réconcilier chaque nuit le prix publié avec le prix local.

### 4.2 Restrictions

Nouveau domaine `restriction` :

- séjour minimum et maximum ;
- arrivée interdite / départ interdit ;
- cut-off de réservation ;
- stop-sell ;
- fenêtre de dates et jours de semaine ;
- priorité entre restriction globale, canal et rate plan.

Les restrictions sont poussées par API, pas déduites de l'iCal.

**Implémenté :** une ligne `restrictions_sejour` par logement et par date, avec
minimum/maximum de nuits, CTA/CTD et stop-sell. La saisie **Hôte → Prix** accepte
une date ou une plage de dates, avec filtre par jours de semaine. Le cut-off est
un réglage par logement (`logements.cutoff_jours`, 0–365) : les dates trop
proches sont poussées indisponibles et refusées à la réservation directe. Le
délai de préparation (`logements.buffer_jours`, 0–7) ferme les nuits qui suivent
chaque départ dans l’ARI et entre deux réservations directes. Les
plans tarifaires (`plans_tarifaires`) isolent prix et règles par plan ; un plan
peut être indépendant ou dérivé du tarif de base avec un ajustement en
pourcentage et l’héritage des règles. Channex reçoit chaque plan actif mappé à un
`rate_plan_id`. La réservation directe applique les règles de base (stop-sell,
arrivée/départ, durée minimale/maximale) avant de créer un brouillon. La priorité
est stockée mais l’arbitrage automatique entre plans reste à définir.

### 4.3 Réservations natives

- Webhooks du fournisseur pour création, modification, annulation.
- Polling de secours si le webhook est manquant.
- Upsert idempotent avec `(tenant_id, canal_id, external_reservation_id)`.
- Statuts externes, dates, montants, voyageur, commission.
- Journal d'événements et possibilité de rejouer un webhook.
- Résolution des conflits avec les réservations directes et les autres canaux.

### 4.4 Latence

- Push événementiel : une modification locale déclenche un job immédiat.
- Webhook entrant traité en moins de 5 secondes.
- Objectif : p95 de propagation < 60 secondes, selon le fournisseur.
- iCal reste le filet de sécurité si l'API tombe.
- Surveillance de la latence par canal et alerte si le décalage dépasse 5 min.

**Implémenté :** les modifications de prix, de règle de séjour et de réservation
locale écrivent une demande dans `demandes_sync`, dédupliquée par logement et
révisée à chaque changement, puis déclenchent une synchronisation ciblée après
1,5 s. Les échecs sont réessayés avec backoff ; le planificateur in-process et le
cron traitent les demandes restantes après un redémarrage. La supervision affiche
la fraîcheur de chaque synchronisation (à jour, partiel, en retard, erreur) avec
un seuil adapté au cycle et aux fournisseurs à quota. L’endpoint
`GET /api/cron/sante-fournisseurs` expose le même état en JSON pour une sonde
externe (200/503).

## 5. Modèle de données à ajouter

- `canaux.mode` : `ical` ou `api`.
- `canaux.fournisseur` : `beds24`, `rentals-united`, `direct-airbnb`, etc.
- `canaux.external_property_id`, `external_rate_plan_id`.
- `canaux.capacites` : JSON des capacités réellement disponibles.
- `canaux.derniere_sync_api`, `canaux.sante_api`.
- `canal_credentials` : secrets chiffrés, versionnés, jamais renvoyés à l'UI.
- `restrictions` : dates, min/max nuits, CTA/CTD, cut-off, stop-sell.
- `tarifs_canaux` ou extension de `tarifs` avec `canal_id` et `rate_plan_id`.
- `sync_outbox` : événements à pousser, tentatives, prochain essai.
- `webhook_events` : clé d'idempotence, hash, statut, erreur.
- `reservations.external_reservation_id`, `external_status`, `canal_id`.
- `blocages` : source canal et identifiant externe.

Toutes les tables restent sous RLS tenant. Les secrets sont chiffrés avec une
clé d'enveloppe (KMS ou secret manager), jamais en clair dans Postgres.

## 6. Phases

| Phase | État au 2026-11-01 | Ce qui reste |
|---|---|---|
| 0 — Cadrage et choix fournisseur | Externe | Ouvrir les sandboxes, chiffrer le parc réel, décider et signer. |
| 1 — Abstraction V2 | **Fait** | Port, schéma, outbox, webhooks, faux adaptateur et tests sont en place. |
| 2 — Adaptateur fournisseur | **Fait en sandbox** | Les cinq adaptateurs sont codés ; la preuve de contrat dépend des clés. |
| 3 — Pilote | Externe | 1 logement, 2 canaux, double run iCal + API, rapport de pilote. |
| 4 — Déploiement | **Partiel** | Kill switch, outbox/DLQ, replay, santé et runbook sont faits ; réconciliation quotidienne (lecture retour) reste. |
| 5 — Certification directe | Externe | Société, audit, SLA, partenariat OTA. |

### Phase 0 — Cadrage et choix du fournisseur (1 semaine)

- Lister les canaux réellement utilisés et le volume d'annonces.
- Comparer Channex, Beds24, Rentals United, Hostaway, Guesty sur :
  - tarifs, restrictions, réservations, webhooks ou polling ;
  - limites d'API et qualité de la sandbox ;
  - white-label, marque, domaine ;
  - prix au logement et engagement ;
  - support et SLA.
- Obtenir une sandbox et les clés de test.
- Décider : staging Channex (gratuit pour développer, production à 130 $/mois),
  pilote Beds24 (économique, API contrainte) ou RU (marque blanche/scale).

**Livrable :** décision écrite, budget, propriétaire.

### Phase 1 — Abstraction V2 (2 à 3 semaines) — **faite**

- Créer `ConnecteurCanal`, `ModeSync`, `CapacitesCanal`.
- Ajouter `canaux.mode`, `fournisseur`, `capacites`.
- Ajouter `sync_outbox`, `webhook_events`, `restrictions`.
- Ajouter le worker outbox et la route webhook signée.
- Implémenter un faux adaptateur pour les tests.
- Garder iCal intact : aucun canal existant ne change de comportement.

**Livrable :** socle testé, sans dépendance à un fournisseur.

### Phase 2 — Adaptateur fournisseur (3 à 6 semaines)

- Authentification et stockage des secrets.
- Mapping logement/annonce/rate plan.
- Push disponibilités, tarifs, restrictions.
- Pull et webhooks réservations si le fournisseur en expose ; sinon polling
  fréquent avec quotas respectés.
- Gestion des erreurs, quotas, retries, idempotence.
- Tests de contrat contre la sandbox.

**Livrable :** un canal natif de bout en bout en sandbox.

### Phase 3 — Pilote (2 à 4 semaines) — **externe**

- 1 logement, 2 canaux.
- Double run iCal + API pour comparer.
- Mesurer : latence, doublons, conflits, taux d'erreur.
- Corriger les mappings et les cas limites.
- Former l'équipe et écrire le runbook.

**Livrable :** rapport de pilote et feu vert.

### Phase 4 — Déploiement (2 à 4 semaines) — **partielle**

Déjà en place :

- Monitoring et tableau de santé par logement (`sante-fournisseurs`, 200/503).
- Outbox `demandes_sync` avec déduplication, backoff et rejeu super-admin.
- Kill switch non destructif par affectation : **Suspendre** arrête le push ARI
  sans supprimer le mapping, le flux iCal du logement reste actif ; **Reprendre**
  réactive. La désactivation globale d’un fournisseur reste disponible.
- Migration progressive possible logement par logement.

Fait :

- Runbook d’exploitation et astreinte (`RUNBOOK-OTA.md`) : contrôles
  quotidiens, seuils, kill switch, rejeu, webhooks, panne prolongée et
  migration progressive.

Reste à faire :

- Réconciliation quotidienne prix/disponibilités entre l’ARI local et le
  fournisseur (lecture retour), avec alerte sur écart.
- Migration de tous les canaux après le pilote.

**Livrable :** canaux natifs en production.

### Phase 5 — Certification directe (optionnelle, 12 à 24 mois) — **externe**

À n'engager que si le volume le justifie :

- société et contrat partenaire ;
- sécurité, PCI/PII, GDPR, DPA ;
- documentation API, sandbox, tests de certification ;
- SLA, support, assurance ;
- intégration directe Airbnb/Booking/Expedia.

Booking.com ne prend actuellement pas de nouveaux prestataires. Cette phase est
donc à traiter comme un projet stratégique, pas comme un prérequis du plan.

## 7. Sécurité et conformité

- Secrets chiffrés, rotation, accès least-privilege.
- Signature HMAC des webhooks, anti-rejeu, fenêtre de temps.
- Idempotence obligatoire sur tous les événements.
- Minimisation des données voyageur, rétention, droit à l'effacement.
- DPA avec le fournisseur, sous-traitants, transferts hors UE.
- PCI DSS si des cartes transitent ; sinon, ne jamais stocker de PAN.
- Respect des conditions OTA : pas de scraping, pas de contournement d'API.

## 8. Tests obligatoires

- Contrat sandbox pour chaque endpoint.
- Webhook dupliqué, hors ordre, retardé, signé invalide.
- Création, modification, annulation de réservation.
- Tarif et restriction sur dates, saisons, rate plans, devises.
- Conflit avec réservation directe et autre canal.
- Panne fournisseur, timeout, quota, 429, 500.
- Reprise outbox après redémarrage.
- Changement d'heure, année bissextile, fuseau Europe/Paris.
- Charge : 1000 événements, 100 annonces, 30 canaux.
- Bascule API → iCal et retour.

## 9. Coûts et ressources

- **Fournisseur** : abonnement par logement et par connexion. Channex est
  gratuit en staging puis 130 $/mois + 0,50 $/unité ; Beds24 est l'option la
  moins chère en production ; Rentals United est orienté marque blanche et
  volume. Demander un devis pour le parc réel.
- **Intégration** : 1 développeur senior pendant 3 à 5 mois, plus revue
  sécurité et support.
- **Certification directe** : 1 à 2 ETP pendant 12 à 24 mois, audit, support,
  infrastructure, assurance. Coût très supérieur à l'option A.
- **Exploitation** : astreinte, surveillance, réconciliation, support OTA.

## 10. Risques

| Risque | Impact | Réduction |
|---|---|---|
| Booking suspend les nouveaux connecteurs | Blocage du chemin B | Passer par un fournisseur déjà certifié |
| Airbnb refuse le partenariat | Blocage du chemin B | Rester en API fournisseur |
| Dépendance au fournisseur | Prix, roadmap, panne | Contrat, SLA, adaptateur interchangeable, iCal de secours |
| Double réservation | Critique | Idempotence, verrou par logement, réconciliation, tests de conflit |
| Quotas API | Sync incomplète | Outbox, backoff, priorisation, cache |
| Fuite de secrets | Critique | Chiffrement, rotation, audit, moindre privilège |
| Complexité tarifaire | Erreurs de prix | Modèle unique, tests par canal, réconciliation nightly |

## 11. Indicateurs de réussite

- 100 % des tarifs et restrictions publiés.
- p95 de propagation < 60 s.
- 0 double réservation sur 90 jours.
- Taux de succès de sync > 99,5 %.
- MTTR < 15 min.
- Aucun webhook perdu ou traité deux fois.
- Bascule iCal testée et documentée.

## 12. Décision immédiate

1. Ouvrir la sandbox Channex gratuite et une sandbox Beds24 pour comparer.
2. La phase 1 (abstraction + schéma + outbox + webhook + kill switch) est faite.
3. Piloter un logement sur le fournisseur retenu (clés sandbox requises).
4. Décider ensuite du déploiement et, plus tard, de la certification directe.

Tant que le fournisseur n'est pas choisi, la V2 reste en iCal : elle fonctionne,
mais les quatre limites restent.

## Sources

- [Booking.com Connectivity Portal](https://connect.booking.com/) — suspension
  des intégrations de nouveaux prestataires.
- [Airbnb Software Partners](https://www.airbnb.com/software-partners) et
  [Airbnb API](https://developer.airbnb.com/).
- [Channex](https://channex.io/pricing/) — API white-label, staging gratuit,
  production 130 $/mois + 0,50 $/unité.
- [Beds24 API](https://beds24.com/api/) — tarifs, disponibilités, restrictions,
  réservations ; [webhooks booking](https://wiki.beds24.com/index.php/Booking_Webhooks)
  et [inventory](https://wiki.beds24.com/index.php/Inventory_Webhooks).
- [Rentals United white-label](https://rentalsunited.com/white-label-channel-manager/)
  et [tarifs](https://rentalsunited.com/pricing/).
