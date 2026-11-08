# Fournisseurs channel manager V2

**État : 25 octobre 2026.** La V2 embarque un registre de cinq fournisseurs.
Le super-admin active ceux qui sont autorisés pour la plateforme, puis choisit
celui réellement utilisé pour chaque logement. Un hôte ne peut ni activer un
fournisseur ni changer son affectation.

## 1. Les cinq fournisseurs

| Code | Fournisseur | Mode | Ce que la V2 fait réellement |
|---|---|---|---|
| `beds24` | **Beds24** | Complet | Disponibilités, tarifs, règles de séjour par date, réservations, webhooks |
| `channex` | **Channex** | Complet | Disponibilités, tarifs, règles de séjour par date, réservations, webhooks, white-label |
| `smoobu` | **Smoobu** | Partiel | Tarifs, durées min/max et réservations ; **pas d’écriture de disponibilité, de CTA/CTD ni de stop-sell** |
| `hostport` | **Host Port** | Lecture seule | Importer les réservations et lister les logements ; webhooks signés ; aucune écriture ARI |
| `nobeds` | **Nobeds** | Partiel | Disponibilités avec prix, réservations, webhooks si secret ; **aucune restriction** |

Les modes sont volontairement stricts : une opération non couverte lève une
erreur explicite (`FOURNISSEUR_LECTURE_SEULE` ou `FOURNISSEUR_INVALIDE`) au lieu
de faire croire à un succès.

## 2. Conseil par nombre de logements

| Logements | Conseillé | Alternative | Pourquoi |
|---:|---|---|---|
| **1–2** | **Beds24** | **Host Port Pro** | Beds24 est le pilote complet le moins cher. Host Port Pro à 9 €/logement/mois est moins cher en autonome, mais ne reçoit pas d’ARI de la V2. |
| **3–10** | **Beds24** | **Smoobu** | Beds24 reste moins cher et pousse tout l’ARI. Smoobu seulement si les disponibilités sont gérées ailleurs. |
| **11–29** | **Beds24** | **Channex** | Beds24 reste devant jusqu’au seuil d’environ 30 logements ; Channex prépare le white-label. |
| **30–99** | **Channex** | **Beds24** | Le fixe de Channex est amorti ; white-label et 77 OTA. |
| **100+** | **Channex** | **Nobeds API** | Nobeds à 99 $/mois jusqu’à 1 000 propriétés est à auditer (pas de CTA/CTD ni webhooks dans l’OpenAPI). |

Prix publics indicatifs hors taxes, constatés le 25 octobre 2026. Le taux de
change EUR/USD déplace le seuil Beds24 → Channex autour de 26–37 logements.

**Réponse courte pour 1 à 4 logements :** Beds24. C’est le seul pilote complet
à ce volume. Host Port Pro (9 €/logement/mois) est moins cher si tu veux
seulement lire les réservations et garder la gestion ARI dans Host Port ;
Smoobu est une option de simplicité si les disponibilités sont gérées dans
Smoobu. Ni Host Port ni Smoobu ne remplacent Beds24 comme pilote V2.

## 3. Utilisation dans la V2

1. Le super-admin ouvre **Supervision → Fournisseurs**.
2. Il vérifie que la clé serveur est présente, puis clique **Tester**.
3. Il active le fournisseur au niveau plateforme.
4. Dans le tableau des logements, il choisit le fournisseur et saisit les
   identifiants externes :
   - `externalPropertyId` : identifiant propriété ;
   - `externalRoomTypeId` : identifiant type de chambre / `roomId` ;
   - `externalRatePlanId` : plan tarifaire, requis par Channex pour les tarifs.
5. L’hôte voit le fournisseur en lecture seule sur
   **Planning → Channel manager**. Il continue d’utiliser les canaux iCal en
   complément.

Un seul fournisseur est actif par logement. Changer de fournisseur met à jour
la même ligne ; retirer l’affectation ne supprime pas les canaux iCal.
**Suspendre** met l’affectation en pause sans perdre les identifiants externes :
le push ARI s’arrête et le flux iCal du logement reste actif. **Reprendre** la
réactive, à condition que le fournisseur soit toujours activé au niveau
plateforme. C’est le kill switch de secours par logement.

La V2 utilise **un compte fournisseur par plateforme**, pas un compte par
tenant : les clés vivent dans l’environnement serveur et toutes les propriétés
des tenants sont rattachées à ce compte via leurs identifiants externes. C’est
le modèle attendu pour une conciergerie qui centralise son stock ; des
identifiants par tenant exigeraient un coffre de secrets et une refonte du port,
non prévus ici. L’index unique `(fournisseur, propriété externe)` empêche deux
logements de pointer la même propriété.

## 4. Orchestration automatique

Plusieurs chemins déclenchent la même synchronisation idempotente :

- **Planificateur in-process** : `FOURNISSEUR_SYNC_ENABLED=true` sur un serveur
  persistant. Il tourne toutes les `FOURNISSEUR_SYNC_TICK_SECONDS` et prend un
  verrou distribué `fournisseur-sync`.
- **Cron HTTP** : `POST /api/cron/sync-fournisseurs` avec
  `Content-Type: application/json` et `Authorization: Bearer $CRON_SECRET`,
  paramètres optionnels `?fournisseur=channex&force=1&limite=50`. Sans
  `Content-Type` JSON, la protection CSRF de SvelteKit répond `403` avant le
  contrôle du secret.
- **Webhook** : `POST /api/fournisseurs/{code}/webhook`, avec
  `Content-Type: application/json` (sinon `403` CSRF), signature vérifiée par
  l’adaptateur. Le payload identifie une propriété quand le fournisseur expose
  `property_id`, `propertyId`, `apartment_id`, `hotel_id`, `listing_id` ou
  `rental_id` ; sinon la synchronisation couvre les affectations du fournisseur
  dans la limite `FOURNISSEUR_WEBHOOK_MAX_LOGEMENTS`.
- **Bouton manuel** : **Supervision → Fournisseurs → Synchroniser** pour un
  logement.
- **Santé** : `GET /api/cron/sante-fournisseurs` avec
  `Authorization: Bearer $CRON_SECRET` renvoie `200` si tout est à jour, sinon
  `503` avec les logements en retard, en erreur ou jamais synchronisés. Ce
  endpoint est prévu pour une sonde externe.

URL à déclarer dans chaque fournisseur :
`https://<domaine>/api/fournisseurs/{code}/webhook`. Vérification :

| Fournisseur | Preuve attendue |
|---|---|
| Beds24 | header personnalisé `x-lcd-webhook-secret` = `BEDS24_WEBHOOK_SECRET` |
| Channex | HMAC-SHA256 `timestamp.body`, headers `x-hmac-timestamp` / `x-hmac-signature-256` |
| Smoobu | header partagé `x-webhook-secret` = `SMOOBU_WEBHOOK_SECRET` |
| Host Port | `x-hostport-timestamp` + `x-hostport-signature: sha256=HMAC(timestamp.body)` |
| Nobeds | header partagé `x-webhook-secret` = `NOBEDS_WEBHOOK_SECRET` |

Si le fournisseur ne permet pas d’ajouter un header personnalisé, ne pas
activer son webhook : garder le cron, qui reste signé par `CRON_SECRET`.

Chaque cycle :

1. lit les réservations OTA de la propriété sur `FOURNISSEUR_SYNC_PAST_DAYS`
   → horizon (filtre `property_id`/`propertyId` quand l’API le permet) ;
2. importe ou met à jour les réservations dans la V2, avec `ref` stable
   `fournisseur:{code}:{externalId}`, source `fournisseur:{code}` ; les
   réservations d’une autre propriété ou d’une autre chambre sont ignorées
   lorsque le fournisseur expose `room_type_id` ;
3. refuse un chevauchement avec une réservation ou un blocage local et le
   journalise (`conflit`) plutôt que de créer un surbooking ;
4. construit l’ARI depuis les réservations, blocages, `tarifs` et
   `restrictions_sejour` locaux ;
5. pousse disponibilités, tarifs et règles de séjour si le fournisseur les
   accepte ;
6. enregistre `derniere_sync`, `dernier_statut`, `dernier_message` et une
   empreinte SHA-256 pour ne pas repousser un ARI identique.

**Règles de séjour :** l’hôte les saisit dans **Hôte → Prix → Règles de
séjour**, une ligne par date. La table `restrictions_sejour` porte le minimum et
le maximum de nuits, l’arrivée autorisée/interdite, le départ
autorisé/interdit et le stop-sell. Aucune valeur par défaut n’est inventée : une
date sans règle n’est pas poussée. Beds24 et Channex reçoivent tout ; Smoobu ne
reçoit que les durées min/max ; Nobeds et Host Port ne reçoivent aucune
restriction. Channex exige son `externalRatePlanId` et Beds24 son
`externalRoomTypeId`. La saisie accepte une plage de dates et un filtre par
jours de semaine ; chaque date reste une ligne indépendante. Le cut-off est un
réglage par logement dans **Hôte → Prix → Configuration du canal** : il ferme
les dates trop proches dans l’ARI poussé et dans la réservation directe. C’est
une approximation native (aucun des cinq fournisseurs n’expose un cut-off
dédié) ; Smoobu, Nobeds et Host Port ne reçoivent pas ces disponibilités. Le
délai de préparation (`logements.buffer_jours`, 0–7) ferme les nuits qui suivent
chaque départ dans l’ARI et entre deux réservations directes. La
fonctionnalité est additive : il suffit de laisser les dates sans règle pour ne
rien pousser ; le retrait se fait par suppression des règles puis de l’écran et
du port, sans migration destructive.

**Plans tarifaires :** **Hôte → Prix → Plans tarifaires** permet de créer
plusieurs plans par logement (`plans_tarifaires`). Chaque plan porte son propre
`code`, son `external_rate_plan_id` fournisseur, son mode, son ajustement, sa
priorité et son état actif. Les prix (`tarifs`) et les règles
(`restrictions_sejour`) sont rattachés au plan par `plan_tarifaire_id` ; `NULL`
représente le tarif de base. L’isolation est garantie par deux index uniques
partiels par table (base et plan). Un plan **indépendant** ne porte que ses
propres prix et règles. Un plan **dérivé** applique son ajustement en pourcentage
aux prix de base absents, et hérite des règles de base si l’option est cochée ;
une ligne propre au plan prime toujours. Channex reçoit l’ARI de chaque plan
actif mappé à un `rate_plan_id` ; les autres fournisseurs continuent de recevoir
le tarif de base. Un plan encore utilisé par des tarifs ou des restrictions ne
peut pas être supprimé. La priorité est stockée et affichée, mais aucun arbitrage
automatique entre plans n’est encore appliqué.

Si la lecture des réservations échoue, **aucun ARI n’est poussé** : le statut
passe à `partiel` et le cycle suivant réessaie. Cela évite d’ouvrir des dates
déjà vendues pendant une panne d’API. Les réservations OTA lues mais non
importées (conflit local) bloquent quand même leurs dates dans l’ARI poussé.

**Connexion owner requise :** l’orchestration liste les affectations de tous les
tenants et écrit `derniere_sync` avec la connexion owner
(`MIGRATION_DATABASE_URL`). Sans elle, le cron répond `503` avec
`ownerDisponible: false`. Sur un hébergement serverless sans owner, garder les
connecteurs API désactivés ou ajouter une fonction SQL `SECURITY DEFINER`
équivalente avant de les activer.

**Quotas :** Host Port est espacé à 60 minutes (`FOURNISSEUR_HOSTPORT_INTERVAL_MINUTES`)
car son API plafonne à 500 appels/jour/connexion. Nobeds est espacé à 240
minutes (`FOURNISSEUR_NOBEDS_INTERVAL_MINUTES`) car chaque jour est un appel
d’écriture. Le bouton manuel et les webhooks ignorent ces intervalles, mais
partagent le verrou `fournisseur-sync` avec le cron : si un cycle tourne déjà,
ils répondent `409` (bouton) ou `503` avec `retry: true` (webhook), et le
fournisseur réessaie. Le cron automatique respecte les intervalles.

**Push opportuniste :** une modification de prix, de règle de séjour ou une
réservation locale écrit une demande durable dans `demandes_sync` puis déclenche
un cycle ciblé sur le logement après 1,5 s. Les modifications rapprochées sont
regroupées par révision ; un échec est réessayé avec backoff, et les intervalles
Host Port/Nobeds restent respectés. Le planificateur in-process traite les
demandes toutes les `FOURNISSEUR_SYNC_TICK_SECONDS` ; le cron les traite aussi
après son cycle, donc un redémarrage ne perd pas la demande.

**Limites assumées :** une demande en échec est réessayée automatiquement avec
l’empreinte ARI pour éviter les pushs identiques ; le super-admin peut aussi la
relancer depuis **Supervision → Fournisseurs → Demandes de synchronisation**.
Nobeds exige un prix sur chaque jour et une écriture jour par jour ;
la V2 borne son horizon à 90 jours, espace le cron à 4 h et refuse de pousser
si un jour n’a pas de tarif. Sans webhook documenté, sa latence
automatique peut donc atteindre 4 h : le bouton manuel reste disponible.
Les blocages OTA sans réservation (statut Beds24 `black`, blocage Smoobu) sont
importés comme réservations en attente : ils bloquent les dates, mais
apparaissent dans le planning comme des séjours à qualifier. L’ARI pousse une
disponibilité binaire (0/1) : affecter un type de chambre multi-unités
écraserait son inventaire, donc un logement = une unité vendable. Une réservation
qui disparaît du flux sans statut annulé n’est pas supprimée automatiquement :
il faut la traiter dans l’extranet ou la planning, sinon elle continue de
bloquer les dates. Retirer une affectation ne supprime pas les réservations
déjà importées : les annuler dans la V2 si nécessaire.
Un import via webhook/API ne remplace pas un flux iCal déjà actif pour la même
réservation : l’import est dédoublonné par référence exacte, sinon conserver un
seul mécanisme par OTA.

## 5. Configuration serveur

Les secrets ne sont jamais saisis dans l’interface et ne sont jamais renvoyés au
client. Ils vivent dans l’environnement du serveur :

```dotenv
# Beds24 — jeton long (lecture seule) ou refresh token (écriture)
BEDS24_API_TOKEN=
BEDS24_REFRESH_TOKEN=
BEDS24_WEBHOOK_SECRET=

# Channex
CHANNEX_API_KEY=
CHANNEX_WEBHOOK_SECRET=

# Smoobu — HMAC obligatoire
SMOOBU_API_KEY=
SMOOBU_API_SECRET=
SMOOBU_WEBHOOK_SECRET=

# Host Port — API Data Connections, lecture seule
HOSTPORT_API_KEY=
HOSTPORT_WEBHOOK_SECRET=

# Nobeds — jeton dans le chemin
NOBEDS_API_TOKEN=
NOBEDS_WEBHOOK_SECRET=
```

Bases surchargeables pour le staging :

```dotenv
BEDS24_API_BASE=https://api.beds24.com/v2
CHANNEX_API_BASE=https://staging.channex.io/api/v1
SMOOBU_API_BASE=https://login.smoobu.com/api
HOSTPORT_API_BASE=https://ntnzabbhtivotmfhwdnm.supabase.co/functions/v1/data-api/v1
NOBEDS_API_BASE=https://api.nobeds.com
FOURNISSEUR_HTTP_TIMEOUT_MS=12000
FOURNISSEUR_SYNC_ENABLED=false
FOURNISSEUR_SYNC_INTERVAL_MINUTES=15
FOURNISSEUR_SYNC_TICK_SECONDS=300
FOURNISSEUR_SYNC_CONCURRENCE=2
FOURNISSEUR_SYNC_MAX_LOGEMENTS=200
FOURNISSEUR_SYNC_LEASE_MINUTES=10
FOURNISSEUR_SYNC_HORIZON_JOURS=365
FOURNISSEUR_SYNC_PAST_DAYS=365
FOURNISSEUR_HOSTPORT_INTERVAL_MINUTES=60
FOURNISSEUR_NOBEDS_INTERVAL_MINUTES=240
FOURNISSEUR_WEBHOOK_MAX_LOGEMENTS=20
CRON_SECRET=
```

**Beds24 :** un jeton long est en lecture seule. Pour écrire l’ARI, utilisez un
refresh token avec les scopes `inventory`, `bookings`, `properties` et
`all:`/`write:` nécessaires. La V2 rafraîchit le jeton automatiquement.
**Smoobu :** l’ancien header `Api-Key` est déprécié (fin annoncée au
31 octobre 2026) ; la V2 signe en HMAC-SHA256.
**Host Port :** la clé `hpk_` va dans `Authorization: Bearer` ; le lien `hpl_`
est réservé aux tableurs et ne doit pas être utilisé par la V2.
**Nobeds :** le token est dans le chemin ; les écritures de disponibilité
exigent aussi un prix. L’endpoint `/availability` réécrit disponibilité et prix
en même temps ; il n’accepte pas les règles de séjour, que la V2 laisse donc
dans l’extranet Nobeds.

## 6. Points de vigilance

- **Aucun fournisseur ne garantit zéro surbooking.** Garder buffer,
  réconciliation et surveillance.
- **Host Port** ne peut pas recevoir de disponibilités, tarifs ni restrictions.
- **Smoobu** ne documente pas l’écriture des disponibilités, les CTA/CTD ni le
  stop-sell. Le webhook `updateRates` est une notification, pas une API de push.
- **Nobeds** ne documente ni CTA/CTD ni webhooks dans son OpenAPI ; le
  fournisseur est jeune, prévoir un audit contractuel.
- **Webhooks sans signature cryptographique** (Beds24, Smoobu, Nobeds) : la V2
  exige un header partagé (`x-lcd-webhook-secret` ou `x-webhook-secret`). Si
  l’interface du fournisseur ne permet pas d’ajouter ce header, ne pas activer
  son webhook : le cron assure la synchronisation. Ne jamais se contenter d’une
  URL secrète, qui fuit dans les logs et les proxies.
- **Webhooks signés** : Channex (HMAC `timestamp.body`) et Host Port
  (`sha256=HMAC(timestamp.body)`), avec tolérance de 300 secondes.
- **Quotas** : Beds24 100 crédits/5 min par défaut ; Channex 10 requêtes
  ARI/minute/propriété ; Smoobu 700 req/min ; Host Port 60 req/min et
  500 req/jour/connexion.
- **iCal reste le filet de sécurité** pour les plateformes françaises sans API
  (Gîtes de France, Clévacances, Leboncoin) et pour les canaux non certifiés.

## 7. Fichiers

- Domaine et catalogue : [`src/domain/fournisseur.ts`](./src/domain/fournisseur.ts)
- Port : [`src/application/ports/fournisseur-canal.ts`](./src/application/ports/fournisseur-canal.ts)
- Dépôt : [`src/application/ports/fournisseur-repository.ts`](./src/application/ports/fournisseur-repository.ts)
- Adaptateurs : [`src/infrastructure/adapters/fournisseurs/`](./src/infrastructure/adapters/fournisseurs/)
- Écran super-admin : [`src/routes/supervision/fournisseurs/`](./src/routes/supervision/fournisseurs/)
- Synchronisation : [`src/application/use-cases/synchroniser-fournisseur.ts`](./src/application/use-cases/synchroniser-fournisseur.ts)
- Import OTA : [`src/application/use-cases/importer-reservations-fournisseur.ts`](./src/application/use-cases/importer-reservations-fournisseur.ts)
- Règles de séjour : [`src/domain/restriction-sejour.ts`](./src/domain/restriction-sejour.ts), [`src/application/use-cases/definir-restriction-sejour.ts`](./src/application/use-cases/definir-restriction-sejour.ts), [`src/application/use-cases/definir-plage-restrictions.ts`](./src/application/use-cases/definir-plage-restrictions.ts)
- Écran hôte : [`src/routes/hote/prix/`](./src/routes/hote/prix/)
- Cron : [`src/routes/api/cron/sync-fournisseurs/`](./src/routes/api/cron/sync-fournisseurs/)
- Webhook : [`src/routes/api/fournisseurs/[code]/webhook/`](./src/routes/api/fournisseurs/[code]/webhook/)
- Migrations : `drizzle/0067_tired_doctor_doom.sql` (registre + RLS),
  `drizzle/0068_slim_invaders.sql` (plan tarifaire),
  `drizzle/0069_restreindre_fournisseurs_canaux.sql` (registre plateforme en
  lecture seule pour le rôle applicatif),
  `drizzle/0070_etat_sync_fournisseur.sql` (empreinte et index propriété
  externe), `drizzle/0071_pale_vance_astro.sql` (règles de séjour + RLS),
  `drizzle/0072_short_spectrum.sql` (stop-sell),
  `drizzle/0073_amused_phantom_reporter.sql` (demandes de synchronisation + RLS),
  `drizzle/0074_sloppy_rage.sql` (cut-off par logement),
  `drizzle/0075_military_doctor_spectrum.sql` (plans tarifaires + RLS),
  `drizzle/0076_concerned_cannonball.sql` (plans dérivés : mode, ajustement,
  héritage des règles), `drizzle/0077_brainy_alex_power.sql` (délai de
  préparation par logement).
