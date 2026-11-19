# Feature Specification: Autonomie d'exploitation, fiabilité et finitions produit

```text
Statut : BROUILLON — backlog cadré, à valider avant plan
Propriétaire : produit + exploitation
Dernière vérification : 2026-11-19
Remplace / remplacé par : —
Source de vérité : specs/006-autonomie-et-finitions/spec.md
```

**Feature Branch**: `006-autonomie-et-finitions`

**Created**: 2026-11-19

**Status**: Draft — 6 histoires priorisées ; la mise en production (005) reste le chemin critique, les exigences marquées « avant go-live » doivent être tirées dans son exécution

**Input**: Demande du 2026-11-19 : « autonome avec le moins d'intervention possible, fiable, performant, modulable, maintenable, avec la meilleure expérience, design et ergonomie au top du top ». Sources : analyse du PRD Maison Auréa confronté à la V2 (2026-11-19), trois états des lieux du 2026-11-19 (exploitation autonome, ergonomie, fiabilité/performance/maintenabilité), registre `docs/registres/a-trancher.md`.

## 1. Contexte et problème

La V2 est construite, l'ergonomie est mesurée (004), la mise en production est cadrée (005). Ce qui manque n'est plus « des fonctionnalités » mais ce qui fait tenir un produit sans qu'on s'en occupe tous les jours, et ce qui rend l'expérience irréprochable sur toutes les surfaces. Constats vérifiés dans le code :

**L'exploitation dépend encore d'un humain qui regarde.**
- 8 des 12 tâches planifiées (`purge-police`, `memoire`, `relances`, `relances-sejour`, `releves`, `messages-auto`, `pricing`, `reconcile-fournisseurs`) n'ont aucun journal d'exécution ; un cron qui cesse de tourner est invisible, y compris les purges RGPD.
- Aucun envoi d'alerte dans le code (`v2/src`) : les sondes (`/api/health/systeme`, `/api/ics/sante`, `sante-fournisseurs`, `/supervision`) renvoient des codes HTTP, mais rien n'atteint un humain sans configuration manuelle d'Uptime Kuma, jamais vérifiée.
- Le moniteur vit sur le serveur surveillé (`profiles: ["monitoring"]` non actif par défaut) : une panne VPS ne produit aucune alerte.
- Copie hors-site manuelle (`v2/DEPLOIEMENT-VPS.md` §), volume photos absent des sauvegardes, restauration de contrôle (`db:restore-test`) jamais planifiée.
- Retour arrière non automatique (`v2/scripts/deployer.sh` s'arrête et exige `revenir.sh`), aucun bot de mise à jour des dépendances, `SENTRY_DSN` vide = no-op silencieux.
- Les flags par tenant sont morts : `v2/src/lib/server/feature-flags.ts` documente une colonne `tenants.flags` (jsonb) absente du schéma et de toute migration ; `flagActif` n'a aucun appelant hors tests.
- Pas de mode maintenance global, pas de création de tenant sans SSH (`db:seed` seul), logs applicatifs consultables uniquement en SSH, rétention non bornée sur `webhook_deliveries` et `executions_automatisation`, purge d'audit manuelle.

**Des fragilités structurelles.**
- Aucun `handleError` ni `+error.svelte` dans `v2/src` : erreurs de page en 500 par défaut, non journalisées, sans page soignée.
- Retry HTTP branché uniquement pour Beds24 ; Channex, Smoobu, HostPort, Nobeds, Nuki, PriceLabs, email, SMS, WhatsApp, LLM échouent au premier 429/5xx. Aucun disjoncteur.
- ~24 routes API sans gestion d'erreur ; file de jobs non durable (`QueueMemoire` seul) ; événements Stripe non tracés (pas de rejeu) ; listes non bornées (`listerTous`) et N+1 sur `/hote/notifications`.

**La boucle de preuve terrain, différenciateur du métier, est incomplète.**
- Pas de pointage début/fin horodaté (la table `missions` n'a qu'une heure prévue), alors que l'aide publique promet « pointage » et « temps pointé » (`v2/src/lib/i18n/public/aide.ts`).
- Statuts `planifie`/`fait` seulement : pas de circuit soumis → validé/refusé motivé → reprise ; score porté par le ménage sans champ d'intervenant assigné, donc pas de score par intervenant.
- Checklist en libellés libres (pas de référentiel par pièce) ; inventaire = registre d'objets, pas de photo de référence par pièce.

**Des frictions d'expérience vérifiées.**
- `/presta` : aucune erreur affichée (échec totalement silencieux), aucune traduction, pas de layout (menu, langue).
- 2 confirmations seulement dans tout `src/routes` pour les actions destructrices ; aucun `use:enhance`, aucun bouton désactivé pendant une soumission ; des formulaires perdent leurs valeurs après erreur (137 `fail(` contre 208 `redirect(303` dans `hote/`) ; statuts techniques affichés bruts ; alertes sans rôles ARIA sur `missions`, `recherche`, `formation` ; indicateur hors-ligne limité au voyageur.

**Des modules attendus par le métier sont absents.** Dépenses avec justificatif et imputation, annuaire de prestataires (spécialités, tarifs, zones), escalade de messagerie (délai, urgence), zones opérationnelles, export FEC.

**Objectif** : rendre le produit autonome (il tourne, se sauvegarde, se surveille, se met à jour et alerte sans intervention quotidienne), fiable et performant à l'échelle du parc visé (20–150 biens), modulable et maintenable, avec une expérience au top sur toutes les surfaces.

## 2. Relation avec les specs existantes

- **005 (mise en production)** : met en production et prouve une fois. 006 rend l'exploitation durable et complète le produit. Les exigences 006 marquées **« avant go-live »** doivent être tirées dans l'exécution de 005, pas attendre.
- **004 (ergonomie)** : 13 tâches humaines restantes ; 006 reprend les frictions non soldées (retours d'action, confirmations, valeurs conservées) et ne rouvre pas la mesure.
- **002 (parité Lodgify)** : 006 ne rouvre pas la parité ; il ajoute des modules absents (dépenses, annuaire, zones, FEC).
- **PRD Maison Auréa** : la boucle de preuve (US3) en vient ; c'est un différenciateur métier, pas une contrainte technique.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - L'exploitation tourne seule et alerte avant les clients (Priority: P1)

L'exploitant ne consulte pas l'application tous les jours. Si une tâche planifiée cesse de tourner, si un disque se remplit, si un certificat approche de l'expiration, si un fournisseur tombe ou si le site devient indisponible, une alerte atteint un humain par un canal configuré. Les sauvegardes partent hors du serveur sans intervention et leur restauration est prouvée automatiquement. Les dépendances se mettent à jour par des propositions prouvées par la CI.

**Why this priority**: C'est le cœur de la demande — « autonome avec le moins d'intervention possible ». Sans cela, chaque panne silencieuse est découverte par un client, pas par le système.

**Independent Test**: couper un déclencheur de cron, simuler un disque plein, couper le site, échouer un fournisseur : l'alerte arrive sur le canal ; lancer une restauration hebdomadaire automatique et vérifier la preuve datée.

**Acceptance Scenarios**:

1. **Given** une tâche planifiée de cadence connue, **When** elle n'a pas tourné depuis 2× sa cadence, **Then** `/supervision` l'affiche en alerte et une notification atteint le canal configuré.
2. **Given** le site indisponible (VPS ou réseau), **When** le moniteur externe sonde, **Then** l'alerte est reçue en moins de 5 minutes depuis l'extérieur du serveur surveillé.
3. **Given** la sauvegarde quotidienne, **When** elle s'exécute, **Then** elle est copiée hors du serveur automatiquement ; **When** la copie manque, **Then** une alerte est envoyée.
4. **Given** une restauration de contrôle hebdomadaire automatique, **When** elle réussit, **Then** une preuve datée est conservée ; **When** elle échoue, **Then** une alerte est envoyée.
5. **Given** le volume photos, **When** la sauvegarde s'exécute, **Then** les photos sont couvertes (incluses ou archivées) avec une preuve de complétude.
6. **Given** un déploiement dont les contrôles post-déploiement échouent, **When** le déploiement se termine, **Then** le retour arrière est appliqué automatiquement (ou déclenché en une commande) et une alerte part.
7. **Given** une nouvelle version d'une dépendance (CVE incluse), **When** le bot ouvre une proposition, **Then** la CI la prouve et l'application ne dépend pas d'une veille manuelle.
8. **Given** un incident résolu, **When** l'exploitant revient sur l'alerte, **Then** le runbook correspondant était accessible depuis l'alerte elle-même.
9. **Given** un nouveau tenant, **When** l'administrateur le crée, **Then** tenant, compte admin et premier logement sont créés depuis l'interface, sans SSH ni seed.
10. **Given** un module activé pour un tenant, **When** l'exploitant le désactive, **Then** l'effet est immédiat, sans redéploiement, et tracé.

---

### User Story 2 - Fiabilité et performance à l'échelle du parc (Priority: P1)

Une erreur de page produit un journal corrélé et une page soignée. Un fournisseur en panne ne bloque pas la file ni ne retente à l'infini. Les écrans restent rapides avec 150 logements et deux ans d'historique.

**Why this priority**: « Fiable, performant » — la croissance du parc est l'hypothèse de travail (PRD : 20–150 biens). Les fragilités actuelles sont invisibles au go-live et douloureuses à 100 logements.

**Independent Test**: provoquer une erreur de page (log + page), un 429 fournisseur (retry puis pause), charger 150 logements de données de test (listes paginées, p95 tenu), redémarrer l'application pendant une file active (aucune perte).

**Acceptance Scenarios**:

1. **Given** une erreur de page, **When** elle survient, **Then** elle est journalisée avec un identifiant de requête, une page d'erreur soignée s'affiche, et Sentry la reçoit si configuré.
2. **Given** un fournisseur qui répond 429/5xx, **When** la synchronisation s'exécute, **Then** elle réessaie avec backoff sans perdre la demande, et après échecs répétés l'intégration est mise en pause avec alerte et reprise manuelle.
3. **Given** 150 logements et deux ans d'historique, **When** les écrans liste s'ouvrent, **Then** chaque liste est paginée côté SQL et le p95 reste sous 800 ms.
4. **Given** l'application redémarrée pendant qu'une file est active, **When** elle redémarre, **Then** aucun job critique n'est perdu.
5. **Given** un événement Stripe rejoué après incident, **When** il est retraité, **Then** aucun doublon n'est créé et l'échec initial est visible et rejouable.
6. **Given** une page publique servie, **When** elle est rechargée, **Then** les en-têtes de cache sont adaptés (pas de `no-store` par défaut) sans exposer de session.

---

### User Story 3 - La boucle de preuve terrain complète (Priority: P2)

L'intervenant pointe son arrivée, coche la checklist pièce par pièce, photographie avant/après, pointe sa sortie et soumet. La gérante valide ou refuse avec un motif ; un refus renvoie la mission en reprise, motif visible. Le score par intervenant se construit sur les validations. L'inventaire photo de référence par pièce permet la comparaison. Le propriétaire peut voir la preuve.

**Why this priority**: C'est le différenciateur métier désigné par la synthèse du PRD Maison Auréa (checklist → photo → pointage → validation → score). LCD a les briques (missions, photos avant/après, score) mais pas le circuit fermé — et l'aide publique promet déjà le pointage.

**Independent Test**: exécuter une intervention complète de bout en bout (pointage, checklist par pièce, photos, soumission), la valider puis la refuser, vérifier le score par intervenant et la comparaison à l'inventaire de référence.

**Acceptance Scenarios**:

1. **Given** une mission, **When** l'intervenant commence, **Then** le début est horodaté par le serveur ; **When** il termine, **Then** la fin est horodatée et la durée réelle est comparée à la durée prévue.
2. **Given** un pointage effectué hors ligne, **When** l'appareil se resynchronise, **Then** l'heure locale et l'heure de synchronisation sont conservées et distinguées.
3. **Given** une intervention soumise, **When** la gérante la consulte, **Then** elle peut valider ou refuser avec un motif obligatoire ; un refus renvoie la mission en reprise avec le motif visible côté intervenant.
4. **Given** des interventions validées sur une période, **When** la gérante ouvre les rapports, **Then** elle voit un score par intervenant (qualité, ponctualité, écarts de durée), filtrable.
5. **Given** un logement, **When** sa checklist est définie, **Then** elle est structurée par pièce et l'intervenant coche pièce par pièce.
6. **Given** l'inventaire photo de référence d'un logement, **When** une preuve d'après-intervention est consultée, **Then** elle est comparable côte à côte avec la référence de la pièce.
7. **Given** l'aide publique qui promet « pointage » et « temps pointé », **When** la fonctionnalité est livrée, **Then** la promesse et la donnée coïncident (ou la promesse est corrigée).
8. **Given** un propriétaire, **When** il consulte une intervention de son bien, **Then** il voit la preuve (photos, pointage, validation) selon la visibilité configurée.

---

### User Story 4 - Expérience au top sur toutes les surfaces (Priority: P2)

Le prestataire sur mobile, la gérante au bureau, le propriétaire : chaque action donne un retour, rien n'est perdu, rien de destructeur n'est irréversible par accident, chaque libellé est dans la langue choisie.

**Why this priority**: « Le design, l'ergonomie au top du top ». Les mesures 004 sont excellentes sur les parcours mesurés ; les frictions restantes sont concentrées sur `/presta` et les retours d'action.

**Independent Test**: exécuter sur `/presta` une action qui échoue (mission déjà prise), une suppression sans confirmation, un double clic de soumission, une erreur de formulaire : à chaque fois, un retour visible, aucune perte, aucun doublon.

**Acceptance Scenarios**:

1. **Given** une action prestataire qui échoue, **When** elle est soumise, **Then** un message d'erreur visible s'affiche, la valeur reste dans le formulaire, et l'espace presta est traduit dans les langues supportées avec son propre layout (menu, langue).
2. **Given** une action destructive (suppression, publication, archivage), **When** elle est déclenchée, **Then** une confirmation explicite est demandée (flux serveur en deux étapes, modèle de `/hote/annonce`).
3. **Given** une soumission en cours, **When** l'utilisateur clique à nouveau, **Then** le contrôle est désactivé, un état d'attente est visible, et aucun doublon n'est créé côté serveur.
4. **Given** une erreur de validation, **When** la page se réaffiche, **Then** les valeurs saisies sont conservées et l'erreur est annoncée aux technologies d'assistance.
5. **Given** un échec d'action, **When** il survient, **Then** une notification in-app le signale en plus du message contextuel.
6. **Given** un utilisateur, **When** il ouvre ses préférences, **Then** il peut régler langue, thème (clair/sombre/système), densité et notifications.
7. **Given** un événement qui concerne un utilisateur, **When** il ouvre le centre de notifications, **Then** la liste est paginée et filtrable.
8. **Given** le staff terrain hors réseau, **When** il utilise l'application, **Then** un indicateur hors-ligne s'affiche (parité voyageur) et ses actions sont mises en file.
9. **Given** une page ouverte avec `?lang=`, **When** elle s'affiche, **Then** la langue demandée est respectée partout (y compris `/hote/missions`).
10. **Given** un statut technique (`planifiee`, `en_cours`…), **When** il est affiché, **Then** il est présenté traduit, jamais en code brut.

---

### User Story 5 - Les modules métier attendus (Priority: P3)

La gérante saisit une dépense avec justificatif, imputée au bien ou au propriétaire, et la retrouve dans le relevé. Elle gère un annuaire de prestataires (spécialités, tarifs, zones) qui alimente le dispatch. Une règle d'escalade alerte quand un voyageur attend. Les zones opérationnelles filtrent planning et dispatch. Un export FEC est produit si un expert-comptable le demande.

**Why this priority**: Ces modules renforcent la transparence (déjà le point fort du produit) et le dispatch réel. Ils ne sont pas des préalables au go-live.

**Independent Test**: saisir une dépense et la retrouver dans un relevé propriétaire ; créer un prestataire et le voir proposé au dispatch ; laisser un fil sans réponse et recevoir l'escalade ; filtrer le planning par zone ; produire un FEC.

**Acceptance Scenarios**:

1. **Given** une dépense avec justificatif, **When** elle est enregistrée, **Then** elle est imputée au bien/propriétaire et apparaît dans le relevé du propriétaire.
2. **Given** un prestataire enregistré, **When** le dispatch cherche un intervenant, **Then** ses spécialités, tarifs et zones sont utilisés.
3. **Given** un fil voyageur, **When** aucun opérateur n'a répondu sous le délai configuré, **Then** une alerte est envoyée ; un mot-clé d'urgence déclenche une escalade immédiate.
4. **Given** des zones opérationnelles, **When** le planning s'affiche, **Then** il se filtre par zone et le dispatch propose des intervenants de la zone.
5. **Given** un exercice comptable, **When** l'export FEC est demandé, **Then** il est produit au format attendu.

---

### User Story 6 - Options, configurations et futurs à décider (Priority: P3)

L'exploitant dispose d'un inventaire des options non construites, chacune cadrée et chiffrable à la demande : magic link, vérification d'identité voyageur, itinéraires staff, glisser-déposer du calendrier et vue multi-biens, upsells, prévisions de revenus, multi-entités. Aucune n'est un préalable ; chacune devient une décision tracée (registre `a-trancher.md`, T-14).

**Why this priority**: La demande inclut « quel autre futur serait manquant ». Cette histoire existe pour que ces futurs soient écrits, pas oubliés — et explicitement pas construits maintenant.

**Independent Test**: relire l'inventaire, décider pour chacune (construire / différer / écarter) et tracer la décision.

**Acceptance Scenarios**:

1. **Given** l'inventaire des options, **When** une décision est prise, **Then** elle est tracée dans le registre avec son motif.
2. **Given** une option retenue, **When** elle est planifiée, **Then** elle devient une histoire d'une spec dédiée, jamais un ajout implicite.

---

### Edge Cases

- Une tâche planifiée s'exécute deux fois (cron et planificateur in-process) : le verrou à bail existant (`verrous_systeme`) doit rester la garantie d'unicité, prouvée.
- Le canal d'alerte tombe : la file d'alertes est persistée et rejouée ; un test périodique prouve que le canal fonctionne encore.
- Tempête d'alertes (un incident produit 50 alertes) : regroupement par incident, pas d'inondation.
- Clé de chiffrement des sauvegardes perdue : procédure documentée et testée (déjà 005).
- Horloge du téléphone fausse lors d'un pointage : le serveur horodate à la réception ; le client ne fournit qu'un déclencheur et, hors ligne, une heure locale distincte de l'heure de synchronisation.
- Preuve déjà validée : les transitions sont bornées (on ne refuse pas une preuve validée sans trace).
- Quota photos atteint pendant une intervention : éviction documentée, jamais de perte silencieuse.
- Téléphone d'entrée de gamme : l'espace presta reste utilisable à 320 px avec des cibles de 44 px.
- Restauration de contrôle pendant que la production tourne : base jetable uniquement, jamais la production.
- Multi-instance (futur) : le rate limiter en mémoire n'est pas partagé ; assumé mono-instance au go-live, à revoir si le parc l'exige.
- Une migration échoue à mi-parcours pendant un déploiement : comportement déjà cadré par 005, non rouvert ici.

## Requirements *(mandatory)*

### Functional Requirements

**Exploitation autonome**

- **FR-001**: Chaque tâche planifiée MUST avoir un déclencheur unique, versionné dans le dépôt, et un journal d'exécution (tâche, début, fin, statut, compteurs, erreur) consultable.
- **FR-002**: Le système MUST détecter l'absence d'exécution d'une tâche au-delà de 2× sa cadence et le signaler (vue supervision et alerte). « avant go-live »
- **FR-003**: Un canal d'alerte sortant MUST être configurable et testable (email, webhook ou push), avec preuve de réception par un humain. « avant go-live »
- **FR-004**: La supervision MUST être déployée par défaut (profil actif, configuration versionnée, portée non exposée publiquement). « avant go-live »
- **FR-005**: Un moniteur externe, hébergé hors du serveur surveillé, MUST sonder la disponibilité publique et alerter. « avant go-live »
- **FR-006**: La sauvegarde quotidienne MUST être copiée hors du serveur automatiquement ; l'absence de copie MUST alerter. « avant go-live »
- **FR-007**: Les photos MUST être couvertes par la sauvegarde ou archivées séparément avec une preuve de complétude. « avant go-live »
- **FR-008**: Une restauration MUST être vérifiée automatiquement (hebdomadaire) avec preuve datée ; un échec MUST alerter.
- **FR-009**: Le RTO (< 30 min) et le RPO (< 24 h) MUST rester prouvés périodiquement, pas seulement au go-live.
- **FR-010**: Un déploiement dont les contrôles post-déploiement échouent MUST déclencher le retour arrière (automatique ou une commande unique) et une alerte.
- **FR-011**: Les mises à jour de dépendances MUST être proposées automatiquement et prouvées par la CI.
- **FR-012**: En production, l'absence d'une brique de supervision critique (Sentry, canal d'alerte, sauvegarde chiffrée, token de santé) MUST être visible et alerter, jamais silencieuse.
- **FR-013**: Tout interrupteur d'environnement MUST être déclaré dans le schéma env et visible dans `/secrets`.
- **FR-014**: Les seuils d'alerte (disque, TLS, heartbeat box) et les cadences MUST être modifiables sans redéploiement.
- **FR-015**: Les purges MUST être planifiées et la rétention bornée : audit, événements canal, livraisons webhook, exécutions d'automatisation, tentatives de connexion.
- **FR-016**: Les journaux applicatifs récents MUST être consultables depuis l'interface super-admin, sans SSH.
- **FR-017**: Un mode maintenance global MUST suspendre le site proprement (page dédiée) sans redéploiement.
- **FR-018**: La création d'un tenant complet (tenant, compte admin, premier logement) MUST être possible depuis l'interface super-admin, sans SSH.
- **FR-019**: Les métriques exposées MUST être collectées par un scraper configuré, ou leur absence documentée ; les compteurs MUST être dérivés de la base ou survivre au redémarrage.

**Fiabilité et performance**

- **FR-020**: Toute erreur de page MUST être journalisée avec un identifiant de requête et produire une page d'erreur soignée par surface (`handleError` + pages dédiées).
- **FR-021**: L'identifiant de requête MUST être propagé sur toutes les surfaces serveur (staff, crons, API), pas seulement l'API v1.
- **FR-022**: Tout appel à un fournisseur externe MUST passer par une politique de retry/backoff (429, 5xx, réseau), idempotente.
- **FR-023**: Après échecs répétés, une intégration MUST être mise en pause (disjoncteur) avec alerte et reprise manuelle traçée.
- **FR-024**: Les événements Stripe MUST être tracés (identifiant) pour permettre le rejeu des échecs.
- **FR-025**: Les jobs critiques MUST être persistants (outbox) et survivre au redémarrage.
- **FR-026**: Toutes les listes MUST être paginées côté SQL ; aucun écran ne charge un tenant entier en mémoire.
- **FR-027**: Les requêtes N+1 identifiées MUST être corrigées (notifications en premier).
- **FR-028**: Les pages SSR publiques MUST poser des en-têtes de cache adaptés, sans exposer de contenu de session.
- **FR-029**: Toutes les routes API MUST gérer leurs erreurs : aucun 500 non journalisé.
- **FR-030**: La couverture de tests MUST être mesurée avec un seuil appliqué en CI ; les tests e2e MUST s'exécuter au moins une fois par jour sur la branche principale.

**Boucle de preuve terrain**

- **FR-031**: Le pointage début/fin MUST être horodaté par le serveur (y compris après un pointage hors ligne) et la durée réelle comparée à la durée prévue.
- **FR-032**: Le cycle de preuve MUST être : soumise → validée ou refusée (motif obligatoire) → reprise, avec historique des transitions.
- **FR-033**: Un refus MUST être visible côté intervenant, avec le motif, et permettre la correction et la resoumission.
- **FR-034**: Un score par intervenant (qualité, ponctualité, écarts de durée) MUST être agrégé à partir des interventions et validations, filtrable par période.
- **FR-035**: Les checklists MUST être structurées par pièce, avec un référentiel par logement, et cochées pièce par pièce.
- **FR-036**: Un inventaire photo de référence par pièce MUST permettre la comparaison côte à côte avec les preuves d'intervention.
- **FR-037**: La promesse publique (aide) MUST coïncider avec la donnée livrée ; la preuve MUST être visible côté propriétaire selon sa visibilité configurée.

**Expérience et finitions**

- **FR-038**: L'espace presta MUST afficher un retour pour chaque action (succès/erreur), être traduit dans les langues supportées et disposer de son layout (menu, langue).
- **FR-039**: Toute action destructive MUST demander une confirmation explicite (flux serveur en deux étapes).
- **FR-040**: Toute soumission MUST désactiver le contrôle, afficher un état d'attente, et empêcher le doublon côté serveur.
- **FR-041**: Les valeurs saisies MUST être conservées après une erreur de validation (`fail`, jamais une redirection qui perd la saisie).
- **FR-042**: Une notification in-app MUST signaler le résultat des actions (échec en priorité) en complément du message contextuel.
- **FR-043**: Un centre de notifications paginé et des préférences utilisateur (langue, thème clair/sombre/système, densité, notifications) MUST exister.
- **FR-044**: Les libellés techniques MUST être traduits, les alertes MUST porter les rôles ARIA adaptés, et les zones à défilement MUST être focusables et nommées.
- **FR-045**: Le staff terrain MUST disposer d'un indicateur hors-ligne et d'une file d'actions, en parité avec le voyageur.
- **FR-046**: La langue demandée (`?lang=`) MUST être respectée sur toutes les pages, y compris `/hote/missions`.
- **FR-047**: Les écarts d'ergonomie documentés (004, `resultats.md` § 4) MUST être soldés ou explicitement acceptés et tracés.

**Modules métier**

- **FR-048**: Les dépenses MUST être saisissables avec justificatif, catégorie et imputation bien/propriétaire, et reprises dans le relevé propriétaire.
- **FR-049**: Un annuaire de prestataires MUST porter spécialités, tarifs, zones et contact, et alimenter le dispatch et les entretiens.
- **FR-050**: Les règles d'escalade de messagerie (délai de première réponse, mot-clé d'urgence) MUST exister, alerter et être tracées.
- **FR-051**: Les zones opérationnelles MUST être un référentiel (logements affectés) utilisé par le planning, le dispatch et les rapports.
- **FR-052**: L'export FEC MUST pouvoir être produit à la demande d'un expert-comptable.
- **FR-053**: Les nouvelles données (dépenses, pointage, validations) MUST respecter le RGPD : base légale, minimisation, rétention, purge.

**Options et futurs (sous décision, jamais préalables)**

- **FR-054**: Magic link (confort d'authentification) : à décider (T-14).
- **FR-055**: Vérification d'identité voyageur : à décider selon la clientèle (T-14).
- **FR-056**: Optimisation d'itinéraire staff : à décider (T-14).
- **FR-057**: Glisser-déposer du calendrier et vue multi-biens : à décider (T-14).
- **FR-058**: Upsells, prévisions de revenus, multi-entités : futurs documentés, à décider (T-14).

### Key Entities

- **Exécution de tâche planifiée** : tâche, déclencheur, début, fin, statut, compteurs, erreur ; support du contrôle d'absence.
- **Alerte d'exploitation** : source, sévérité, message, canal, acquittement, runbook associé, regroupement par incident.
- **Canal de notification** : type, destination, état, dernière preuve de réception.
- **Sauvegarde** : date, taille, empreinte, localisation hors-site, preuve de restauration associée.
- **Pointage** : mission, intervenant, début, fin, source (en ligne/hors ligne), heures serveur et locale.
- **Preuve d'intervention** : photos, checklist par pièce, statut (soumise, validée, refusée), motif de refus, validateur, historique.
- **Référentiel de pièces et inventaire photo de référence** : logement, pièce, tâches, photos de référence datées.
- **Dépense** : bien, propriétaire, montant, catégorie, justificatif, date, rétention.
- **Prestataire** : identité, spécialités, tarifs, zones, contact.
- **Zone opérationnelle** : nom, logements affectés.
- **Préférence utilisateur** : langue, thème, densité, notifications.
- **Flag de tenant** : clé, valeur, effet immédiat, traçabilité.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des tâches planifiées ont un journal d'exécution et une alerte d'absence (2× cadence), prouvé par test.
- **SC-002**: Une indisponibilité du site est alertée depuis l'extérieur en moins de 5 minutes (test de coupure réel).
- **SC-003**: 100 % des sauvegardes quotidiennes copiées hors-site, absence alertée, et une restauration prouvée automatiquement chaque semaine.
- **SC-004**: Les photos sont couvertes par la sauvegarde, avec preuve de complétude.
- **SC-005**: Aucun fournisseur externe sans retry/backoff ; aucune intégration en panne retentée à l'infini sans pause ni alerte.
- **SC-006**: Aucune erreur de page non journalisée ; aucune route API sans gestion d'erreur.
- **SC-007**: p95 sous 800 ms sur les écrans liste avec 150 logements et deux ans de données de charge.
- **SC-008**: 100 % des interventions terrain portent pointage, checklist par pièce et photos ; validation/rejet tracé ; score par intervenant disponible.
- **SC-009**: `/presta` : aucune action silencieuse, espace traduit à 100 %, utilisable à 320 px.
- **SC-010**: Aucune action destructive sans confirmation ; aucun formulaire ne perd sa saisie après erreur ; aucun double envoi possible.
- **SC-011**: Un module s'active et se désactive par tenant sans redéploiement (preuve e2e).
- **SC-012**: Un tenant complet se crée depuis l'interface admin en moins de 10 minutes, sans SSH.
- **SC-013**: Couverture de tests supérieure ou égale à 80 % sur `src/domain` et `src/application`, seuil appliqué en CI.
- **SC-014**: Une mise à jour de dépendance passe du bot à l'application sans veille manuelle (proposition + CI + fusion).

## Assumptions

- Mono-instance au go-live ; le multi-instance (rate limiter partagé, files) est un futur, pas un préalable.
- La cible d'hébergement reste VPS + Docker + Caddy + PostgreSQL (005) ; les seuils par défaut (disque, TLS, heartbeat) sont conservés sauf décision.
- Le canal d'alerte (T-11) et l'hébergement du moniteur externe (T-12) et de la copie hors-site (T-13) sont des décisions ouvertes, tranchées avant le go-live.
- Les options de l'histoire 6 ne sont pas des préalables ; chacune devient une décision tracée (T-14) puis, si retenue, une histoire d'une spec dédiée.
- Les données de démonstration et leur nettoyage relèvent de 005 (décision A27 de 004).
- Les features 002 peuvent rester désactivées par flag à l'ouverture ; 006 ne rouvre pas leurs preuves externes.

## Décisions à trancher

| Réf | Question | Proposition par défaut | Réf. spec 006 |
|---|---|---|---|
| T-11 | Canal d'alerte d'exploitation : email SMTP existant vs ntfy auto-hébergé vs webhook tiers | email (SMTP déjà branché) + ntfy en secours, 0 € | US1, FR-003 |
| T-12 | Moniteur externe hors site : Uptime Kuma hébergé ailleurs vs service gratuit (BetterStack/Healthchecks) | service gratuit avec alerte email | US1, FR-005 |
| T-13 | Copie hors-site des sauvegardes : rsync serveur secondaire vs S3/R2 vs artefact GitHub | rsync secondaire 0 €, R2 si volume photos | US1, FR-006 |
| T-14 | Options produit futures : export FEC, vérification d'identité, magic link, upsells, prévisions, itinéraires, DnD calendrier | chacune évaluée à la demande ; jamais préalable au go-live | US6 |

## Out of Scope

- La mise en production elle-même (005) : 006 en dépend, ne la remplace pas.
- La parité Lodgify restante et ses 19 preuves externes (002).
- Les API OTA natives sans certification partenaire (T-03), le multi-devises, les 32 langues, le blog.
- Le matériel, Home Assistant, les serrures (déjà hors périmètre de 005).
- Le remplacement des fournisseurs en place (Stripe, Brevo, Beds24/Channex, PriceLabs, Nuki).
- La refonte du design system : il est mesuré au niveau ; 006 solde les frictions, pas les fondations.
