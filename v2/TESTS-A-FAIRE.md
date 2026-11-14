# Tests restant à faire après déploiement

```text
Statut : ACTIF
Propriétaire : recette
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : code et environnement de recette
```

Ce document liste ce qui ne peut pas être validé tant que l’application n’est
pas déployée sur l’hébergement réel, ou tant que les services externes ne sont
pas configurés. Les tests locaux déjà faits sont rappelés en fin de document.

## 0. Pré-requis de la recette

- [ ] URL HTTPS publique stable.
- [ ] `DATABASE_URL` pointe sur le rôle **`lcd_app`**, pas le owner.
- [ ] `MIGRATION_DATABASE_URL` (owner) disponible pour migrations/backups.
- [ ] Migrations `0001` → `0103` appliquées (104 fichiers SQL).
- [ ] `npm run db:test-rls` exécuté sur la base de production :
  `RLS VALIDÉE : isolation tenant effective`.
  Déjà validé en local le 2026-10-26 (owner `lcd`, rôle `lcd_app`) ; les 45
  tests Playwright passent avec `DATABASE_URL` sur le rôle applicatif.
- [ ] `/api/health` → `200`, `/api/ready` → `200`, `db: up`, `schema: ok`.
- [ ] `/api/ready` bien **503 `schema: pending`** si une migration manque
  (test à faire sur une base de staging vide ou incomplète) ; le compteur
  `migrations` est comparé au journal Drizzle.
  Validé en local le 2026-10-26 sur base vide : 503 `db: up`, sept entrées
  `manquants` ; rejouer le test avec le journal courant (104 migrations).
- [ ] `/api/ready` → `200` avec toutes les migrations appliquées.

## 1. Auth, rôles et sécurité

- [ ] Connexion admin, déconnexion, reconnexion.
- [ ] Enrôlement TOTP, déconnexion, reconnexion avec code TOTP.
- [ ] `AUTH_2FA_REQUIRED=true` : un admin sans TOTP est renvoyé sur
  `/hote/securite` ; après activation, l’accès au reste de l’espace revient.
- [ ] Code TOTP invalide refusé ; trop de tentatives verrouillées.
- [ ] `/api/auth/sign-up/email` refusé (`400`) sur la production.
- [ ] `tenantId` et `role` refusés par `/api/auth/update-user`
  (`FIELD_NOT_ALLOWED`).
- [ ] Création d’un compte par admin, connexion du compte.
- [ ] Réinitialisation du mot de passe : sessions fermées.
- [ ] Sessions actives : deux navigateurs connectés, la session courante est
  marquée, « Fermer les autres sessions » ferme la seconde et laisse la
  première ouverte (audit `utilisateur.sessions`).
- [ ] Désactivation : session fermée, connexion refusée.
- [ ] Changement de rôle : accès recalculé sans reconnexion.
- [ ] Dernier admin : désactivation et retrait de rôle refusés.
- [ ] Non-admin : `/hote`, `/hote/utilisateurs`, `/hote/audit` refusés.
- [ ] Prestataire : `/hote/securite` accessible, `/hote` refusé.
- [ ] Exports CSV et JSON complets refusés aux non-admins/hôtes/comptables
  selon les règles.
- [ ] Aucun secret dans l’export JSON complet (webhooks, URLs ICS,
  credentials).
- [ ] Rate limit de connexion vérifié (trop de tentatives → refus temporaire).
- [ ] En-têtes HTTP en production : CSP, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS au
  proxy.
- [ ] 2FA réellement exigée après activation, sur un autre navigateur.

## 2. Gestion locative

- [ ] Création/modification logement, guide, WiFi, règles.
- [ ] Onboarding : nouveau logement « Non publiable » et absent de
  `/reserver` ; cocher la vérification copro le rend publiable ; « Publier le
  logement » le rend visible ; « Dépublier » le remasque (audits
  `logement.copro`, `logement.publication`).
- [ ] Archivage : double confirmation, logement masqué, restauration en
  brouillon ; réservation future non annulée → refus avec sa `ref`.
- [ ] Entité juridique : nature, régime, TVA, SIREN, adresse, mentions ;
  SIREN invalide refusé.
- [ ] Facture HTML/PDF/Factur-X : nom, adresse, SIREN et mentions de l’entité.
- [ ] Mandat logement : mode propre/mandat tiers, commission, statut, dates,
  notes ; commission forcée à 0 en mode propre.
- [ ] Portail propriétaire : commission et net cohérents avec le mandat.
- [ ] Prix par jour, plusieurs logements, isolation.
- [ ] Réservation manuelle, anti-chevauchement, annulation.
- [ ] Import ICS manuel : fichier valide, HTML refusé, doublons ignorés.
- [ ] Flux HTTPS réel Airbnb/Booking : import, rattachement `fluxIcsId`, dates
  et noms corrects ; URL `webcal://` normalisée en `https://`.
- [ ] Deux synchronisations consécutives : la seconde répond 304 ou « contenu
  inchangé », aucun doublon, une exécution dans l’historique.
- [ ] Déplacement d’un séjour dans l’OTA : dates mises à jour dans LCD ; séjour
  supprimé dans l’OTA : ligne supprimée après réconciliation.
- [ ] Conflit avec une réservation directe : l’événement OTA n’est pas inséré,
  le conflit est visible dans le flux et l’historique, les autres événements
  passent.
- [ ] Calendrier vide : premier cycle « partiel » sans suppression, second
  cycle confirme et supprime les séjours absents.
- [ ] Suppression du flux : les réservations importées restent, leur
  `fluxIcsId` devient nul, les autres flux ne sont pas affectés.
- [ ] Blocages OTA sans impact CA.
- [ ] Export ICS : abonnement Google Calendar ou Apple Calendar réel, rafraîchi
  avec `REFRESH-INTERVAL:PT5M`, ETag/304, `Last-Modified`.
- [ ] Lien ICS invalide → `401` ; mauvais logement → `401`.
- [ ] Planificateur : `ICS_SCHEDULER_ENABLED=true`, bail unique, reprise après
  expiration, arrêt propre sur SIGTERM ; `/api/ics/sante` cohérent.
- [ ] Cron de secours : `POST /api/cron/sync-ota?force=1` avec et sans
  `CRON_SECRET`, verrou déjà pris → réponse `verrouille: true`.
- [ ] Channel manager : ajout Airbnb avec URL iCal, flux lié au canal, état
  visible, synchronisation forcée, URL d’export par canal.
- [ ] Deux annonces Airbnb du même logement : clés distinctes, pas de doublon ;
  deux canaux différents avec la même URL → refus explicite.
- [ ] Export par canal : buffer de 1 jour après départ, réservations du flux
  cible exclues, réservations des autres flux et réservations directes incluses.
- [ ] Canal désactivé ou export coupé → URL par canal en `404` ; URL globale
  toujours valide.
- [ ] Suppression d’un canal : flux et historique supprimés, réservations
  importées conservées avec `fluxIcsId` nul.
- [ ] Reprise d’un flux existant après migration : canal `generique` hérité,
  édition sans collision de clé.
- [ ] Rotation `BETTER_AUTH_SECRET` : toutes les URLs par canal sont refusées.
- [ ] Connecteurs API natifs : non testés, car non activés sans contrat
  partenaire ; aucun écran ne doit laisser croire le contraire.
- [ ] Portail voyageur signé : séjour, guide, extras, incident.
- [ ] Voyageur sans JavaScript à 320 px sur un vrai téléphone ancien.
- [ ] PWA installée, hors ligne, rejeu IndexedDB.
- [ ] Facture : PDF, XML Factur-X, envoi email, paiement manuel, solde.
- [ ] Caution : réception, restitution, retenue motivée.
- [ ] Design : bascule des 4 thèmes, persistance après reconnexion, rendu
  mobile et contraste réel sur écran.
- [ ] Identité : nom, logo, accent et contacts visibles sur `/`, `/login`,
  `/legales` et le manifeste ; accent trop clair refusé ; retour au repli env.
- [ ] Stocks : rotation de ménage, seuils, liste de courses, réassort,
  historique des mouvements.
- [ ] Inventaire : QR imprimé scanné sur place, usage + lavage, état,
  alertes dormant/garantie/remplacement, coût par séjour.
- [ ] Tourisme : lieu global et lieu par logement, filtre `?cat=`, lien extra,
  désactivation, rendu sans JavaScript.
- [ ] Réservation directe : catalogue tenant, devis complet, dates sans tarif
  refusées, chevauchement refusé, email client enregistré, honeypot, lien
  espace séjour, visibilité en brouillon côté planning.
- [ ] Mémoire voyageur : opt-in, mise à jour, effacement, email absent de la
  base (seulement le hash), expiration à 24 mois, purge cron.
- [ ] Avis : dépôt voyageur sans JavaScript, un seul avis par séjour,
  moyenne des avis publiés, masquage/publication côté hôte, isolation tenant.
- [ ] États des lieux : constat depuis l’inventaire durable, bien manquant
  chiffré au prix d’achat, dégradations signalées, historique par logement,
  isolation tenant.
- [ ] Carnet d’entretien : intervention (entretien/réparation/contrôle), coût
  cumulé, prestataire, historique par logement, isolation tenant.
- [ ] Ménage : planification liée à un séjour, checklist cochée, avancement,
  passage à « fait » et consommation de rotation une seule fois, isolation
  tenant.
- [ ] Contrat : lien signé, parties/logement/séjour/prix exacts, caution
  affichée si présente, signature falsifiée refusée.
- [ ] Questionnaire : dépôt voyageur sans JS, une seule réponse par séjour,
  moyennes par critère côté hôte, isolation tenant.
- [ ] Phrases types : modèles installés une fois, variables remplacées,
  édition, suppression, isolation tenant.
- [ ] Formation : progression par module et par membre, reprise après
  rechargement, étapes inconnues ignorées.
- [ ] Objets trouvés : déclaration, réclamation à 15 €, envoi, don bloqué
  avant 30 jours, isolation tenant.
- [ ] Tranquillité : mesures dB jour/nuit, dépassements, attestations, lettre
  au syndic sur 12 mois glissants, isolation tenant.
- [ ] Annonce : 9 mentions, étiquettes DPE/GES, classement, conformité
  recalculée et persistance par logement.
- [ ] RGPD : 7 traitements, DPO, hébergement, durées, complétude et
  désactivation d’un traitement.
- [ ] Sinistres : déclaration idempotente, franchise, expertise,
  indemnisation, clôture et montants attendus.
- [ ] Dispatch : une offre active par mission, retrait, acceptation avec
  réassignation, réponse prestataire.
- [ ] Messages voyageurs : refus des codes d’accès, brouillon, envoi e-mail
  réel (Mailpit) ou marquage manuel, unicité et journalisation.
  Canal SMS : numéro normalisé et envoi Brevo si `SMS_ENABLED=true`.
  Validé en local le 2026-10-26 : message reçu par Mailpit avec l’adresse
  saisie, statut `envoye` après succès SMTP.
- [ ] Préférences séjour : bornes 0–30 jours, heure HH:MM, mise à jour
  idempotente par réservation, formulaire sans JS.
- [ ] Accès : registre nominatif, session courante non révocable, révocation
  effective (session supprimée et utilisateur déconnecté).
- [ ] Ménage : évaluation réservée aux rotations faites, bornes score 1–5,
  coût et durée, moyennes et alerte qualité sous 3,5.
- [ ] Assistant : routage selon intention/ton, prompt borné, refus des codes
  d’accès, comparaison neutre/chaleureux/concis, garde-fous de sortie
  (80 mots, PIN, promesses), quotas 20/heure et 100/mois, budget 10 €/mois,
  brouillon déterministe local, adapter LLM OpenAI-compatible optionnel avec
  repli local, enregistrement idempotent en message brouillon puis envoi
  e-mail ou marquage manuel.
- [ ] LLM distant (si `LLM_API_URL`/`LLM_API_KEY`) : génération réelle,
  modèle premium sur avis chaleureux, repli local si erreur HTTP ou timeout.
- [ ] Audit : bornes 90 jours par défaut, filtres 7/30/90 j et famille,
  recherche, export CSV filtré limité à 5 000 lignes, rétention affichée et
  purge manuelle protégée par confirmation.
- [ ] Mission : création staff, exécution prestataire, statuts.
- [ ] Portail propriétaire : rattachement, commission, relevé, isolation.
- [ ] CRM : prospect, offre, pipeline.
- [ ] Support : ticket, réponse, résolution.
- [ ] Recherche globale `/hote/recherche` : refs réservation/facture/paiement,
  groupement par catégorie, requête < 2 caractères refusée, isolation tenant.
- [ ] Audit : les actions ci-dessus apparaissent dans `/hote/audit`.

## 3. Paiements Stripe

Configuration requise : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, endpoint
public `/api/stripe/webhook`.

- [ ] Checkout test depuis une facture publique.
- [ ] Retour `?paiement=ok` et facture soldée.
- [ ] Webhook signé accepté ; signature invalide refusée.
- [ ] Rejeu du même webhook : idempotent, pas de double paiement.
- [ ] Paiement partiel, surpaiement refusé.
- [ ] Passage en mode live après validation test.

## 4. Emails

Configuration requise : `SMTP_URL`, `EMAIL_FROM`, `EMAIL_ENABLED=true`.

- [ ] Envoi d’une facture à une adresse réelle.
- [ ] Réception, expéditeur, reply-to, lien public.
- [ ] Email désactivé : l’application ne casse pas et affiche l’erreur.
- [ ] Domaine SPF/DKIM/DMARC si Brevo/OVH.
- [ ] Boîte de réception et spam vérifiés.

## 5. Intégrations et cron

- [ ] Webhook HA/Moli : création, secret, livraison, signature
  `X-LCD-Signature`.
- [ ] Adaptateur `RuntimeBox` réel : config `BOX_RUNTIME_CONFIG`, état,
  commande HA ou générique, Bearer token, timeout.
- [ ] Cron `/api/cron/webhooks` avec `CRON_SECRET` ; sans secret → `401/503`.
- [ ] Cron `/api/cron/sync-ota` avec `CRON_SECRET` ; flux réel.
- [ ] Cron `/api/cron/memoire` avec `CRON_SECRET` ; sans secret → `401/503`,
  purge réelle des entrées expirées.
- [ ] Cron `/api/cron/purge-police` : créer une fiche avec `purge_at` passée
  (SQL), lancer le cron, vérifier la suppression et le compteur `supprimees`.
- [ ] GitHub Actions `v2-sync-ota` et `v2-webhooks` avec secrets configurés.
- [ ] Test d’échec : URL webhook morte, retry/backoff, statut `failed`.
- [ ] Connecteurs HA/Moli spécifiques : adaptateur HTTP générique/HA testé ;
  API Moli propriétaire à cadrer avec le fournisseur.

## 6. Observabilité, sauvegardes et exploitation

- [ ] `SENTRY_DSN` configuré : une erreur serveur et une erreur client
  apparaissent dans Sentry.
- [ ] Uptime Kuma : monitors `/api/health`, `/api/ready`, `/login`.
- [ ] Alerte testée (email/ntfy) sur arrêt volontaire.
- [ ] `MIGRATION_DATABASE_URL` configuré dans GitHub Secrets.
- [ ] Backup GitHub Actions vert, artefact téléchargeable.
- [ ] Restauration réelle dans une base de staging : comptes, logements,
  réservations, factures, paiements.
  Validé en local le 2026-10-26 : checksum refusé si altéré, manifeste comparé
  (1 tenant, 196 users, 1 260 logements, 54 tables, 81 migrations).
- [ ] Copie hors site (R2/rsync) vérifiée.
- [ ] Rotation `BETTER_AUTH_SECRET` testée : liens voyageur/facture/calendrier
  invalidés, sessions invalides.
- [ ] Rotation du token Netlify et du mot de passe admin.
- [ ] Super-admin réel : `/supervision`, `/systeme`, `/secrets`, `/journal`
  avec `MIGRATION_DATABASE_URL` ; vérifier l’accès refusé pour un admin
  ordinaire et l’absence de valeur de secret dans le HTML.
- [ ] Retirer `MIGRATION_DATABASE_URL` : les quatre pages affichent un
  avertissement, sans repli sur la connexion RLS.
- [ ] « Voir comme » : bandeau, écritures refusées (formulaire et appel direct),
  arrêt, audit `apercu.demarrer/arreter`, cookie expiré après 2 h.

## 7. Performance et compatibilité

- [ ] Lighthouse mobile sur `/`, `/login`, `/voyageur`.
- [ ] Test 3G lente / CPU throttle sur un téléphone réel.
- [ ] 320 px, 360 px, 390 px, 768 px, desktop.
- [ ] Budget JS `/voyageur` mesuré : `npm run measure:js`.
- [ ] Marque blanche : `MARQUE`/`MARQUE_COURTE` changés puis redémarrage ;
  landing, titre d’onglet, manifeste et pied de page cohérents, sans
  « LCD Parc » résiduel.
- [ ] Charge : 30 utilisateurs simultanés, 100 réservations, 30 flux OTA.
- [ ] `pg_dump`/restore chronométré (RTO < 30 min).
- [ ] Aucun 5xx dans Sentry après 24 h de pilote.

### 7.1 Ergonomie et accessibilité (plan 004, restant à faire)

Automatisé et déjà rejouable localement : `npm run audit:a11y:verifier`,
`npm run audit:a11y:staff`, `npm run audit:a11y:public`, `npm run audit:cibles`,
`npm run audit:ergonomie:ecrire`, `npm run audit:ergonomie:verifier`,
`npm run audit:ergonomie:staff`, `npm run audit:ergonomie:public`,
`npx vitest run tests/ergonomie/`.

Les deux déclinaisons `:staff` dérivent la liste des routes du disque
(`src/routes/{hote,supervision,support,presta}`) : une page staff créée demain
est auditée sans retoucher le script. Les deux déclinaisons `:public` font de
même pour **tout le reste du dépôt** (21 routes), en écartant `/login`
(redirige vers `/hote` avec une session) et `/two-factor` (atteignable
seulement en cours de 2FA, parcourue par `e2e/deux-facteurs.spec.ts`). Les
quatre modes exigent une session (`AUDIT_EMAIL`/`AUDIT_MOT_DE_PASSE` ou
`AUDIT_STORAGE`) et sortent en code 1 si le contrat casse, donc utilisables en
vérification. `npm run audit:a11y:verifier` est le mode P1 (quatre routes
mesurées sans risque, `apres-axe.json`), et le relevé de référence
(`baseline-320.json`, `baseline-axe.json`) n'est jamais écrasé sans
`AUDIT_ECRASER=1` (friction R-10).

- [x] **Lighthouse ≥ 90 sur les 6 routes** — SC-004, **fait le 2026-11-13** :
  mesuré sur le build de production (`npm run build` puis `node build`, port
  4180, en-têtes de proxy `PROTOCOL_HEADER`/`HOST_HEADER`) par
  `node .artifacts/ergonomie/mesurer-lighthouse.mjs les-deux`. Mobile 100 partout
  sauf `/reserver` **93** au dernier relevé (93–95 selon la passe) ; desktop 100
  partout ; CLS **0** sur onze routes et
  0,03 sur `/reserver`. Résultats dans
  `v2/.artifacts/ergonomie/lighthouse-resume.md` (+ un JSON par route).
- [x] **Cibles tactiles 44 px et scripts tiers non bloquants** — **fait le
  2026-11-13** : `npm run audit:ergonomie:ecrire` donne `smallTargets = 0` et
  `overflow = 0` sur les quatre routes P1 à 320 px (le thème « souligné » laissait
  « Aide » à 31 px de large : `min-width: 44 px` ajouté), et
  `npx vitest run tests/lib/suivi.test.ts` refuse tout `<script src=…>` tiers en
  `defer` (Plausible et les autres tiers sont injectés après `load`). Le CLS de police (0,289 mesuré sur
  `/voyageur`) est verrouillé par la police de repli métrique d'`app.css`.
- [x] **Les 70 routes staff au même contrat 320 px** — **fait le 2026-11-13** :
  `npm run audit:ergonomie:staff` (routes dérivées de `src/routes`, session
  `AUDIT_EMAIL`/`AUDIT_STORAGE`) donne **0 cible sous 44 px, 0 débordement,
  0 erreur, 0 champ sans étiquette** sur **70 routes** — premier relevé :
  96 cibles, 3 débordements, 1 erreur, puis 32 champs sans étiquette. Relevé dans
  `v2/.artifacts/ergonomie/apres-320-staff.json` ; la recette manuelle
  correspondante (parcourir ces routes au doigt, sur un téléphone réel) reste à
  faire ci-dessous.
- [x] **axe sur les 70 routes staff (WCAG 2.0/2.1 A+AA, 320 px)** — **fait le
  2026-11-13** : `npm run audit:a11y:staff` donne **0 violation** (premier
  relevé : 10 routes en échec sur `scrollable-region-focusable`, corrigées en
  rendant chaque zone à défilement horizontal focusable et nommée). Rapport :
  `v2/.artifacts/ergonomie/apres-axe-staff.json`.
- [x] **Les 21 routes publiques au même contrat 320 px et axe** — **fait le
  2026-11-13** : `npm run audit:ergonomie:public` et `npm run audit:a11y:public`
  dérivent les routes hors staff du disque et donnent **0 cible sous 44 px,
  0 débordement, 0 champ sans étiquette, 0 violation axe** (premier relevé :
  `/journal` 188 cibles, `/tarifs` 2, `/mot-de-passe-oublie` 1). `/login` et
  `/two-factor` sont exclues avec motif (session ou 2FA en cours) ; test négatif
  au seuil 60 px : 216 cibles, sortie 1. Les trois défauts ont aussi été
  contre-vérifiés sur le **build de production** (`node build`, port 4180) :
  0 cible, 0 débordement. Relevé :
  `v2/.artifacts/ergonomie/apres-320-public.json`.
- [x] **Gate axe P1 rejouable** — `npm run audit:a11y:verifier`
  mesure `/`, `/reserver`, `/login`, `/voyageur` et sort en code 1 en cas de
  violation : **4 routes, 0 violation** (2026-11-13). Le relevé de référence
  axe n'est plus écrasable par cette commande.

- [ ] **Lighthouse rejoué après tout changement d'images, de police ou de CSS** :
  la première mesure avait révélé deux régressions invisibles à l'œil (image LCP en
  `loading="lazy"`, photos de 1000 px dans une vignette de 360 px), la seconde un
  CLS de 0,289 déclenché par la simple largeur des liens de navigation. Relancer
  `npm run assets:photos` après avoir changé une photo, puis la commande
  ci-dessus : le protocole exact est dans
  `specs/004-ergonomie-experience-client/quickstart.md` § 10.7.
- [ ] **Test utilisateurs n° 2 (5 personnes)** : demande de réservation sans aide
  en < 3 min (SC-001), 80 % de réussite, SUS ≥ 80 ou SEQ ≥ 5,5/7 (SC-010).
- [ ] **Test voyageur** : trouver Wi-Fi, accès et heure de départ en < 10 s sur
  `/voyageur` (SC-003).
- [ ] **Lecteur d'écran réel** (NVDA ou VoiceOver) sur les trois parcours P1 :
  `/` → `/reserver` → confirmation, `/voyageur`, `/hote` → `/hote/planning`.
  axe ne remplace pas une navigation réelle au lecteur d'écran.
- [ ] **Thème non conforme** : tenter de publier un thème échouant au contraste
  AA et tenter un thème échouant aux cibles 44 px ; vérifier les deux refus
  (SC-012, `/supervision/apparence`).
- [ ] **Recette super-admin ergonomie** : brouillon, aperçu, blocage,
  correction, publication sur un thème réel (T103).
- [ ] **Parcours mesurés en conditions réelles** : après quelques jours
  d'usage, relire `suivi_evenements` (P-RESA, P-SEJOUR, P-RECHERCHE, P-HOTE-5)
  et confirmer qu'aucune donnée personnelle n'y apparaît ; vérifier la purge
  (`npm run db:purge-suivi`).
- [ ] **Appareil mobile réel 320 px** : confirmer l'absence de défilement
  horizontal et le confort des cibles tactiles sur un téléphone étroit.
- [ ] **Rejouer la suite e2e sur un serveur provisionné** : le serveur de
  démonstration lancé à la main n'a pas `ENQUIRY_ENABLED`, ce qui fait échouer à
  tort les 10 tests de `demande-sejour.spec.ts` (`?/demande` n'est rendu que si le
  drapeau est actif). Pour une passe complète et verte :
  `ENQUIRY_ENABLED=true`, `APP_URL`/`BETTER_AUTH_URL` sur le port du serveur, plus
  `DATABASE_URL`/`MIGRATION_DATABASE_URL` exportés depuis `.env.demo.local` (base
  `lcd_demo`) avant `npx playwright test`. Résultat attendu : 260 tests, 0 échec
  (voir `specs/004-ergonomie-experience-client/resultats.md` § 2.1).
- [ ] **Incohérence de rôle à instruire** : `admin@lcd.test` est `admin` dans la
  base `lcd` mais `super_admin` dans `lcd_demo`, et `/support` ne reconnaît comme
  staff que `admin`/`hote` alors que `requireRole` laisse tout faire à
  `super_admin` (`src/routes/support/+page.server.ts:18`). Décider si
  `super_admin` doit être staff partout, puis aligner les deux bases de
  démonstration.

### 7.2 Rejouer la suite e2e sans pollution

La base de démonstration `lcd_demo` **accumule les fixtures** des passes
précédentes : au 2026-11-13 elle contient 617 logements (dont 64 publiés : 48
fixtures « …E2E… », 13 « Onboarding <horodatage> », 3 vrais logements de
démonstration) et seuls 3 logements publiés non-fixtures ont des tarifs.
L'accueil public n'affichant que **trois** cartes, le tunnel de réservation peut
tomber sur trois fixtures sans tarif et échouer six fois de suite : c'est la
friction **R-11** (`.artifacts/ergonomie/frictions.md`), pas un défaut produit.

- [ ] **Au déploiement, après le déploiement** (décision du 2026-11-13) :
  supprimer les **faux comptes et faux logements créés pour tester** — 120 comptes
  `@lcd.test`, 614 logements sur 617 (fixtures `E2E…`, `Onboarding…`,
  `Logement plan/dérivé/Archive/Recherche…`, `Relevé…`, `Import…`,
  `Proprio A/B…`, `Diag…`) et leurs dépendances — en gardant Villa Santa Severa,
  Le Mas des Oliviers, Le Loft du Port. Ces données sont nécessaires pour tester :
  on ne les supprime pas maintenant. Procédure complète et outil dédié (lecture
  seule par défaut, trois verrous avant écriture) : `DEPLOIEMENT.md` § 8 et
  `npm run db:nettoyer-recette`.
  Tant que ce n'est pas fait, deux tests au moins (`confiance.spec.ts`,
  `ergonomie-reservation.spec.ts`) peuvent échouer sur « le tunnel de réservation
  n'a abouti sur aucune des six tentatives » : échec connu, accepté et tracé
  (friction R-11).
- [ ] Correctif de fond à instruire : que chaque spec qui crée un logement le
  supprime en fin de test (ou travaille dans un tenant dédié). Élargir le vivier
  du tunnel au sélecteur des 64 logements a été mesuré **contre-productif**
  (2 → 5 échecs) : 61 candidats sur 64 n'ont pas de tarif.

## 8. Conformité et facturation

- [ ] Mentions légales, RGPD, politique de confidentialité, DPA.
- [ ] Factur-X validé par une plateforme de dématérialisation (PDF/A-3 signé
  non implémenté).
- [ ] ZIP mensuel `/api/exports/factur-x` déposé sur une PDP/Chorus de test :
  factures acceptées, doublons et mois vide refusés proprement.
- [ ] Rapprochement sur un relevé bancaire réel anonymisé : formats
  débit/crédit séparés, virements internes, orphelines >7 j, alerte 2 %.
- [ ] Vérification SIREN/TVA de l’entité émettrice.
- [ ] Numérotation de factures continue et sans trou.
- [ ] Export complet du tenant testé sur la production (admin).
- [ ] Procédure d’effacement/archivage client définie.

## Déjà validé localement

- SvelteKit 3 : `npm run check` à 0 erreur / 0 avertissement, `npm run build`
  vert (adapter-node).
- Vitest : **761/761** (2026-11-04), `npm run check` à 0 erreur.
- Playwright SvelteKit : 10/10 (apparence avec et sans JS, application du
  thème au public, au voyageur et au staff, smoke de toutes les routes
  publiques et staff avec et sans JS).
- Migrations depuis zéro : `npm run db:test-migrations` à rejouer ; le journal
  courant contient 104 migrations (`0001` → `0103`).
- Playwright : **47/47** sur `next build` + `next start`, y compris une passe
  complète avec `DATABASE_URL`
  sur le rôle applicatif `lcd_app` (RLS active), et une passe complète sur la
  pile compose VPS avec PostgreSQL 18, RLS, seed admin/presta/proprio/
  commercial, Mailpit et Caddy.
- RLS : sans tenant = 0, avec tenant = total, autre tenant = 0, y compris sur
  une base compose fraîchement migrée et seedée.
- Entité juridique et mandats : validation, E2E, factures HTML/PDF/Factur-X.
- Build Netlify et build Docker standalone.
- Pile compose VPS : PostgreSQL 18, migrations `0031`, seed, web, Caddy HTTPS,
  headers, `/api/health`, `/api/ready`.
- Sauvegarde + restauration complètes : 54 tables, comptes, logements,
  réservations, factures, paiements, blocages, manifeste et checksum.
- 2FA TOTP de bout en bout.
- Inscription publique fermée, tenant/rôle non modifiables, exports protégés.
- PWA : cache voyageur, factures/portails privés non cachés, noindex.
