# Channel manager V2 — périmètre et exploitation

> **Mise à jour du 25 octobre 2026.** Le socle iCal reste le filet de sécurité,
> mais la V2 ajoute un **registre de cinq fournisseurs API** : Beds24, Channex,
> Smoobu, Host Port et Nobeds. Le super-admin les active et choisit celui utilisé
> par logement dans `Supervision → Fournisseurs`. Voir
> [FOURNISSEURS-CHANNEL-MANAGER.md](./FOURNISSEURS-CHANNEL-MANAGER.md). Les
> connecteurs API disposent d’un cron, de webhooks signés et d’un import
> idempotent des réservations ; les limites ci-dessous décrivent le socle iCal
> seul, pas les connecteurs API.

## 1. Décision

La V2 dispose d’un **channel manager maison centré sur iCal**. Il remplace la
juxtaposition de flux isolés par un objet métier `canal` : une plateforme, une
annonce, un flux d’import, un calendrier d’export et des règles de diffusion.

Cette décision applique le principe « 0 € strict, réécrire maison » du registre
`T-03`. Le socle iCal n’appelle **aucune API native Airbnb, Booking ou Expedia**
directement : ces API sont fermées aux partenaires agréés ou soumises au
programme Connectivity Provider. Les connecteurs API optionnels passent par des
fournisseurs certifiés (Beds24, Channex, etc.) et non par un accès direct non
autorisé.

## 2. Ce que le module fait réellement

- Catalogue de canaux : Airbnb, Booking.com, Abritel/Vrbo, Agoda, Trip.com,
  Gîtes de France, Clévacances, Leboncoin, Pitchup, Hipcamp et canal iCal
  générique.
- Plusieurs annonces par logement et par plateforme, distinguées par
  `externalListingId` et une clé stable.
- Import iCal automatique par canal, avec l’ensemble du moteur existant :
  ETag/304, empreinte SHA-256, backoff, réconciliation, détection de conflits,
  confirmation d’un calendrier vide, historique et verrou distribué.
- Export iCal signé **par canal**, avec :
  - un buffer de ménage de 0 à 7 jours après chaque départ ;
  - l’exclusion des réservations du flux cible pour éviter le phénomène
    d’écho OTA ;
  - les réservations et blocages des autres canaux, des réservations directes
    et des blocages manuels.
- Page hôte `/hote/planning/canaux` : ajout, modification, suppression,
  synchronisation forcée, retrait du flux, état de santé et URL d’abonnement.
- Orchestration API optionnelle : cron `/api/cron/sync-fournisseurs`, webhooks
  `/api/fournisseurs/{code}/webhook`, import des réservations OTA et push
  disponibilités/tarifs avec empreinte anti-doublon.
- RLS tenant sur `canaux`, `flux_ics` et l’ensemble des tables liées.
- Migration additive `0066_canaux.sql`, avec reprise automatique des flux
  existants sous forme de canaux `generique` hérités.

## 3. Ce que le module ne fait pas

- Pas d’écriture native directe dans les OTA depuis le socle iCal. Les
  connecteurs API activés (Beds24, Channex, Smoobu, Nobeds) passent par leur
  API ; Host Port reste en lecture seule.
- Pas de tarifs, promotions, minimum de séjour ou restrictions poussés par
  iCal : le format iCal ne transporte que des indisponibilités. Les tarifs et
  les règles de séjour passent par un fournisseur API qui les supporte ; les
  règles sont saisies par date dans **Hôte → Prix**.
- Pas de réservation instantanée ni de messagerie OTA.
- Pas de garantie temps réel par iCal : une OTA relit généralement son
  abonnement toutes les 1 à 3 heures. Les webhooks API réduisent cette latence
  quand le fournisseur les propose.

Ces limites sont volontaires. Un connecteur API natif devra être ajouté derrière
un contrat partenaire, sans changer le modèle `canal` ni l’UI.

## 4. Modèle de données

```text
logements 1 ── n canaux 1 ── 0..1 flux_ics
     │              │
     │              └── token iCal signé (canalId)
     │
     └── 0..1 logements_fournisseurs ── 1 fournisseurs_canaux
```

- `canaux` : `code` catalogue, `libelle`, `cle` stable, `external_listing_id`,
  `actif`, `export_actif`, `buffer_jours`, `notes`.
- `flux_ics.canal_id` : lien unique vers le flux d’import du canal. La
  suppression du canal supprime le flux et son historique ; les réservations
  déjà importées restent dans le planning avec `flux_ics_id = NULL`.
- Le token de calendrier porte un `canalId` optionnel. Les anciens tokens
  globaux restent valides.

## 5. Exploitation

1. Ouvrir `/hote/planning/canaux`.
2. Choisir le logement.
3. Ajouter un canal : plateforme, nom, identifiant d’annonce, URL iCal
   d’import, buffer, export.
4. Coller l’URL d’abonnement du canal dans la plateforme.
5. Contrôler l’état « Import iCal » et lancer une synchronisation si besoin.
6. Pour arrêter l’import sans supprimer le canal : « Retirer l’import iCal ».
7. Pour arrêter l’export : décocher « Export actif » ou désactiver le canal.

Un canal sans flux d’import reste utile : il publie le calendrier des autres
canaux, mais ne lit aucune réservation de sa plateforme.

## 6. Sécurité

- L’URL d’export est signée HMAC et liée au tenant, au logement et au canal.
- La rotation de `BETTER_AUTH_SECRET` invalide toutes les URLs : il faut les
  recoller dans chaque plateforme.
- Les lectures et écritures passent par `withTenant()` et la RLS.
- Le flux d’import doit être HTTPS public ; les adresses locales, privées et
  les identifiants dans l’URL sont refusés.
- Les URLs iCal OTA contiennent souvent un secret : ne pas les diffuser.

## 7. Validation

```bash
npm run typecheck
npm test -- --run
npm run db:check
npm run db:test-migrations
npm run db:test-rls
npm run db:test-ics
npm run build
```

`db:test-ics` crée un canal, son flux, son buffer, le modifie, le supprime et
vérifie la cascade, en plus du scénario de synchronisation complet.

## 8. Retrait

Le module est additif. Le retrait applicatif consiste à masquer la route
`/hote/planning/canaux` et à cesser d’utiliser les URLs par canal. La table
`canaux` et la colonne `flux_ics.canal_id` peuvent rester en place sans effet.
Ne pas modifier `0066_canaux.sql` après application.
