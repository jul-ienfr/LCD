# Audit L1 — socle distribution existant

**Date** : 2026-11-06
**Méthode** : lecture du code, sans exécution ni sandbox partenaire.
**But** : éviter de reconstruire ce qui existe avant d'ouvrir L1.
**Limite** : cet audit ne remplace pas les tests de contrat sandbox ; il dit ce
que le code prétend faire, pas ce que le partenaire accepte réellement.

## 1. Composants déjà présents

| brique | fichier | état |
| --- | --- | --- |
| Catalogue fournisseurs | `v2/src/domain/fournisseur.ts` | 5 fournisseurs, capacités, recommandations par volume |
| Port canal | `v2/src/application/ports/fournisseur-canal.ts` | ARI, réservations, test, webhook |
| Adapters | `v2/src/infrastructure/adapters/fournisseurs/` | beds24, channex, smoobu, hostport, nobeds |
| Webhook entrant | `v2/src/routes/api/fournisseurs/[code]/webhook/+server.ts` | signature, taille max, filtre propriété, journal, 202 + file |
| Outbox / debounce | `v2/src/lib/server/fournisseur-outbox.ts` + `demandes_sync` | une ligne par logement, cycle complet |
| Scheduler | `v2/src/lib/server/fournisseur-scheduler.ts` | tick, intervalle, arrêt propre |
| Cycle de sync | `v2/src/lib/server/fournisseur-sync.ts` | verrou distribué, concurrence, import, push |
| Use case sync | `v2/src/application/use-cases/synchroniser-fournisseur.ts` | ARI complet, empreinte SHA-256, read-only, multi-plans |
| Import réservations | `v2/src/application/use-cases/importer-reservations-fournisseur.ts` | dédoublonnage, conflits, annulations, anti-doublon |
| Santé | `v2/src/lib/server/fournisseur-sante.ts` + `/api/cron/sante-fournisseurs` | seuils, retard, erreur, jamais |
| Écran santé | `/supervision/fournisseurs` | à vérifier visuellement |
| Verrou | `v2/src/infrastructure/db/verrou-systeme.ts` | bail renouvelable |
| Tests existants | `v2/tests/application/*fournisseur*`, `v2/tests/domain/*fournisseur*` | use cases et domaine couverts |

## 2. Couverture par capacité

| capacité | beds24 | channex | smoobu | hostport | nobeds |
| --- | --- | --- | --- | --- | --- |
| Lire réservations | oui | oui | oui | oui | oui |
| Pousser disponibilités | oui | oui | non | non | oui |
| Pousser tarifs | oui | oui | oui | non | oui |
| Pousser restrictions | oui | oui | partiel | non | non |
| Webhook signé | oui | oui | oui | oui | non |
| Messaging | non | non | non | non | non |
| Santé provider | non | non | non | non | non |

La santé actuelle est **déduite de la base** (dernière sync, statut, âge), pas
interrogée chez le fournisseur. C'est suffisant pour alerter, pas pour
diagnostiquer une clé révoquée.

## 3. Ce que le plan croyait manquant et qui existe

- mapping `logements_fournisseurs` ;
- outbox `demandes_sync` + planificateur ;
- webhook signé et route HTTP ;
- verrou distribué et concurrence ;
- empreinte pour éviter les push inutiles ;
- import initial, mises à jour, annulations, conflits ;
- scheduler et cron de secours ;
- écran de santé ;
- adapters pour 5 fournisseurs.

**Conséquence** : `operations_canal` a été retiré du data-model. Le socle
existant fait office d'outbox par logement ; une outbox par opération
dupliquerait l'état sans bénéfice mesuré.

## 4. Écarts réels

| # | écart | impact | tâche |
| --- | --- | --- | --- |
| G1 | Pas de journal `evenements_canal` | pas d'audit des webhooks, pas de rejeu | T104-T108 ✅ 2026-11-06 |
| G2 | Pas de réconciliation fournisseur (seulement ICS) | réservation OTA disparue non détectée | T119 ✅ 2026-11-06 |
| G3 | Pas de messaging OTA | inbox impossible | T102, T109, L3 |
| G4 | Pas de `lireSante` provider | diagnostic limité | T102, T112 |
| G5 | Push complet, pas de diff jour par jour | payload plus gros que nécessaire | T110 |
| G6 | Pas de tests de contrat sandbox | comportement partenaire non prouvé | T113-T115 |
| G7 | Anti-écho non explicite | risque de boucle webhook | T122 ✅ 2026-11-06 (contenu identique ignoré) |
| G8 | Webhook ne persiste pas l'événement brut | pas de preuve en cas de litige | T107-T108 ✅ 2026-11-06 (métadonnées + empreinte, sans PII) |
| G9 | Pas d'alerte « dernier pull > 15 min » | panne silencieuse | T125 |
| G10 | Frais par canal non modélisés | marge OTA incomplète | T129 |

## 5. Ce qu'il ne faut pas refaire

- Ne pas créer `connexions_canal`.
- Ne pas créer `operations_canal`.
- Ne pas réécrire `SynchroniserFournisseur` from scratch.
- Ne pas ajouter un second scheduler.
- Ne pas dupliquer le webhook dans `/api/webhooks/canal/...` : la route
  existante est `/api/fournisseurs/[code]/webhook`.

## 6. Ordre recommandé pour L1

1. **Audit runtime** : vérifier l'écran santé et les tests existants.
2. **Journal d'événements** : table `evenements_canal`, repository, écriture
   dans le webhook, rétention 90 j.
3. **Réconciliation** : pull de sécurité, comparaison par `ref`, rapport,
   alerte si écart.
4. **Anti-écho** : test explicite d'un événement issu de notre push.
5. **Santé provider** : `lireSante` + alerte clé/expiration.
6. **Tests de contrat** : uniquement quand les comptes sandbox existent.
7. **Diff ARI** : optimisation après mesure, pas avant.

## 7. Conclusion

L1 n'est pas un lot de construction : c'est un lot de **durcissement et de
preuve**. Le vrai chantier reste L2 (site + paiement), L3 (messagerie), L4
(pricing) et L6 (API). Le gate L0 reste obligatoire pour les tests de contrat,
pas pour le journal ni la réconciliation, qui sont provider-agnostiques.

## 8. Implémenté le 2026-11-06

### Journal d'événements (T104-T108)

- Migration `0085_evenements_canal.sql` : table, 4 index, FK, RLS et grant
  `lcd_app`.
- `v2/src/domain/canal.ts` : types `EvenementCanal`, `TypeEvenementCanal`,
  `StatutEvenementCanal`.
- `v2/src/application/ports/evenement-canal-repository.ts` + repository Drizzle
  idempotent (`cle_idempotence` unique).
- `v2/src/lib/server/evenement-canal.ts` : journalise le webhook **avant** la
  sync (propriété, taille, content-type, empreinte), sans stocker le corps brut.
- Webhook existant : journalise, met en file `demandes_sync`, répond 202 ; une
  panne de journal ne bloque jamais la synchronisation.
- `verifier-rls.mjs` vérifie la RLS, la policy et l'isolation réelle de la table
  (1 événement visible dans le tenant, 0 ailleurs, insertion croisée refusée).
- `db:test-mappings` audite les mappings fournisseur (0 doublon local).
- 4 tests d'idempotence et de non-fuite du corps brut.

### Réconciliation (T119)

- `v2/src/domain/reconciliation-fournisseur.ts` : comparaison pure
  (manquante, orpheline, dates, statut), aucune écriture.
- `v2/src/application/use-cases/reconcilier-canal.ts` : pull fournisseur +
  réservations locales, mappe les refs stables.
- `v2/src/application/use-cases/reference-fournisseur.ts` : fonction de ref
  partagée avec l'import (aucun changement de format).
- `v2/src/lib/server/fournisseur-reconciliation.ts` : verrou, boucle par
  affectation, rapport agrégé.
- `v2/src/routes/api/cron/reconcile-fournisseurs/+server.ts` : cron protégé
  par `CRON_SECRET`, 503 si écart ou erreur.
- `docs/runbooks/distribution-temps-reel.md` : crons, lecture des écarts,
  diagnostic, retour arrière.
- Tests : 10 domaine + 5 use case ; suite complète 789 tests, 0 échec ;
  `svelte-check` 0 erreur.

### Centre de notifications (T125)

- `v2/src/domain/alertes-fournisseur.ts` : erreur = danger, jamais = alerte,
  retard > 15 min = alerte, tri par gravité puis ancienneté.
- Section « Centre de notifications » sur `/supervision/fournisseurs`, avec
  lien direct vers le logement concerné.
- 6 tests dédiés.

### Runtime vérifié le 2026-11-06

Build de production servi avec `node --env-file=.env.local build` :

- `/api/health` → 200.
- `/api/ready` → 200, `role=lcd_app`, `rls=ok`.
- `/api/cron/reconcile-fournisseurs`, `/sante-fournisseurs`,
  `/sync-fournisseurs` → 200 en GET et POST avec `CRON_SECRET`.
- Sans `Authorization` → 401 sur les trois.
- `NODE_ENV=production` sans `DATABASE_URL` → démarrage refusé avec message
  explicite (plus de fallback owner silencieux).
- `npm run db:test-migrations` : 86 migrations appliquées sur base jetable,
  74 tables, 62 en RLS, 62 policies, base vide, rôle `lcd_app` autorisé.
- Un POST cron en `application/x-www-form-urlencoded` est bloqué par la
  protection CSRF de SvelteKit : utiliser GET ou un corps JSON.

Ces briques ne dépendent d'aucun partenaire. Les tests de contrat sandbox (G6)
restent bloqués par L0.

## 9. US2 — Site public, domaine, widget et paiement (2026-11-07)

### Site public et domaine (T209-T212)

- Routes publiques `/site/[tenant]/[page]` (HTML pur, `csr = false`), sitemap,
  six langues (`fr`, `en`, `es`, `it`, `de`, `nl`).
- Widget intégrable : `/api/widget` (iframe autonome, CSP
  `frame-ancestors *` sur cette seule route) + `static/widget.js`
  (`data-tenant`, UTM de la page hôte transmis à l'iframe).
- Domaine personnalisé : `/hote/design/domaine` (ajout, vérification DNS TXT
  `_lcd-verification.<domaine>`, activation, suppression) ; TLS et redirection
  restent à la charge du proxy — T209 partiel assumé.
- Tests : `v2/e2e/site-public.spec.ts`, 3 tests sans JavaScript.

### Paiement de séjour (T213-T228)

- Domaine pur : `echeancier.ts` (acompte, solde, caution, politique
  d'annulation), `promotion.ts`, `attribution.ts`, `relance-paiement.ts`,
  `relance-panier.ts`.
- Migration `0087_rich_beast.sql` : table `echeances_paiement` (RLS + grant
  `lcd_app`, unique `(tenant, réservation, type)`), `paiements.facture_id`
  nullable, liens `reservation_id`/`echeance_id`/`external_id`, colonnes
  d'empreinte sur `cautions`.
- Ports/adapter Stripe : session Checkout, PaymentIntent manuel
  (`capture_method=manual`), capture partielle, annulation d'empreinte,
  remboursement (PaymentIntent `pi_` uniquement).
- Cas d'usage : `reserverDirect` (taxe, remise, échéancier), `payerEcheance`,
  `gererCaution` (empreinte → capture → libération), `annulerReservation`
  (politique, remboursement, échéances, cautions), `relancerPanierAbandonne`.
- Webhook `/api/webhooks/stripe` : idempotent par `ref`, gère facture **et**
  échéance (`metadata.echeance_id`) ; rejeu sans double paiement.
- Page voyageur `/reserver/[ref]` (échéances, statuts, bouton Payer) et
  endpoint `/reserver/[ref]/checkout` : sans `STRIPE_SECRET_KEY`, réponse 503
  explicite et aucun secret exposé.
- Crons : `/api/cron/relances-sejour` (échéances J-30 + paniers abandonnés si
  `PANIER_RELANCE_ENABLED=true`, `?simulation=1` pour lister sans envoyer).
- Attribution : `reservations.source` = `direct`, `widget`, `utm:…`, `promo:…`.

### Preuves du 2026-11-07

- `npm test` : **179 fichiers, 885 tests, 0 échec**.
- `npx playwright test e2e/reservation-directe-paiement.spec.ts --project=sans-js`
  : 4/4 ; `e2e/site-public.spec.ts` : 3/3.
- `npm run check` : 0 erreur, 0 avertissement.
- `npm run build` : OK (adapter-node).
- `npm run db:test-migrations` : **90 migrations, 81 tables, 69 en RLS,
  69 policies**, base vide, rôle `lcd_app` autorisé.
- `npm run db:test-rls` : isolation vérifiée, y compris `echeances_paiement`
  et `demandes_sejour` (1 ligne dans le tenant, 0 ailleurs, insertion croisée
  refusée).
- JS voyageur mesuré : 1,1 Ko gzip (cible 50 Ko).

## 10. US2 — Demande de séjour (enquiry) et prix par personne (2026-11-08)

### Pipeline de demande (T230, FR-068)

- Domaine `v2/src/domain/demande-sejour.ts` : quatre statuts, transitions
  autorisées, validation des saisies publiques (nom, email, dates cohérentes ou
  absentes, 1 à 20 voyageurs, message ≤ 4000 caractères).
- Migration `0089_demandes_sejour.sql` : table `demandes_sejour` (RLS + grant
  `lcd_app`, unicité `(tenant_id, ref)`, contrainte `voyageurs` 1-20).
- Cas d'usage : `CreerDemandeSejour` (référence stable dérivée du contenu, donc
  rejeu sans doublon), `QualifierDemande` (motif de refus obligatoire,
  transitions terminales verrouillées), `ConvertirDemandeEnReservation`
  (réservation créée depuis la demande sans ressaisie, source `demande:REF` ou
  UTM d'origine conservée).
- Site public : formulaire de demande dans les 6 langues. Le flag serveur
  `ENQUIRY_ENABLED` (faux par défaut) masque le formulaire **et** refuse toute
  soumission : sans flag, aucune donnée publique n'est écrite.
- Staff : `/hote/demandes` (filtre par statut, qualification, refus motivé,
  conversion avec choix du logement, audit `demande.statut` et
  `demande.convertir`).
- Tests : 8 tests unitaires (`v2/tests/application/demande-sejour.test.ts`),
  5 tests e2e sans JavaScript (`v2/e2e/demande-sejour.spec.ts`), dont une
  soumission réelle du formulaire par clic navigateur.

### Prix par personne (T222)

- Migration `0088_tarif_personnes.sql` : `tarifs.personnes_incluses` (défaut 2)
  et `tarifs.prix_par_personne_centimes` (nullable, contraintes ≥ 0).
- `devisDirect(debut, fin, tarifs, { voyageurs })` ajoute le supplément par nuit
  et par voyageur au-delà des personnes incluses et expose
  `supplementPersonnesCentimes` ; réglable depuis `/hote/prix` (jour et plage).
- Promotions : `CreerPromotion` + écran `/hote/promotions` (liste, activation,
  désactivation, audit).

### Ce qui reste bloqué

- T229 (réservation payée de bout en bout) exige des clés Stripe de test et un
  compte partenaire : non prouvable localement.
- T126/T127 (sandbox OTA) et T129 (frais par canal) dépendent de L0.
- Les ADR L0 ne sont pas signés ; le budget partenaire n'est pas plafonné.

## 11. US3 — Inbox voyageur unifiée (2026-11-09)

### Fils et messages

- Domaine `v2/src/domain/fil-voyageur.ts` : `cleRegroupement` (`ext:` par
  réservation, `email:`, `tel:`), consentements par canal, détection d'opt-out
  (`messageEstOptout`, `appliquerOptout`).
- Tables `fils_voyageur`, `pieces_jointes_message`, `automatisations`,
  `executions_automatisation` (migration `0090`), colonne `assigne_a` (`0091`),
  rattachement réel des messages existants (`0092`).
- Cas d'usage : `ouvrirFil`, `envoyerMessage` (+ `envoyerBrouillon`, idempotent
  par `ref`), `ajouterPieceJointe` (jpg/png/webp/pdf ≤ 8 Mo), canal
  `canal-message.ts` (SMTP, SMS Brevo, WhatsApp/OTA refusés en
  `CANAL_INDISPONIBLE`).
- Backfill mesuré sur la base locale : 264 messages, 0 orphelin, 248 fils
  (113 regroupés par e-mail, 135 par logement faute de contact connu). La
  migration `0090` seule laissait 100 % des messages orphelins : elle ne
  traitait que les messages porteurs d'une réservation, cas inexistant ici.

### Automatisations : brouillons uniquement

- `executerAutomatisation` écrit toujours un message `statut = brouillon` dans le
  fil ; l'envoi reste une action humaine (`envoyerBrouillon`).
- Le planificateur J-7 / J-1 / arrivée / départ / J+1 est déclenché par
  `/api/cron/messages-auto`, doublement protégé par `CRON_SECRET` et par
  `MESSAGES_AUTO_ENABLED` (faux par défaut) ; `?simulation=1` montre ce qui
  partirait sans rien écrire.

### Écrans staff livrés

- `/hote/messages/fils` : liste, filtres (statut, recherche, logement, assigné),
  badges non-lus et brouillons, assignation, opt-out.
- `/hote/messages/fils/[id]` : chronologie, réponse e-mail/SMS, validation de
  brouillon, pièces jointes, bascule de consentement.
- `/hote/automatisations` : création depuis les 5 modèles par défaut,
  activation, édition, suppression, audit.
- `/hote/notifications` : messages non lus, brouillons à valider, réservations
  `brouillon` à confirmer, échéances `a_payer` en retard (nouvelle méthode
  `listerEnRetard` sur le port des échéances).
- Écart assumé : `/hote/fils` héberge déjà les fils internes d'équipe ; l'inbox
  voyageur vit sous `/hote/messages/fils` et `/hote/messages` reste l'envoi par
  logement.

### Preuves du 2026-11-09

- 950 tests unitaires / 191 fichiers, 0 échec ; `npm run check` 0 erreur /
  0 avertissement ; `npm run build` OK.
- 93 migrations / 85 tables / 73 tables en RLS / 73 policies validées sur base
  vide ; `db:test-rls` ajoute « fils voyageur et automatisations isolés par
  tenant » ; `db:check` « Everything's fine ».
- e2e `inbox.spec.ts` 2/2 (js et sans JS) : regroupement, réponse reçue dans
  Mailpit, validation de brouillon, assignation ; `demande-sejour.spec.ts` 10/10
  (avec `ENQUIRY_ENABLED=true`), `messages.spec.ts`, `design.spec.ts` et
  `apparence.spec.ts` verts.

### Ce qui reste bloqué en US3

- T306 (messaging OTA) et T309 (WhatsApp Business) : aucune API accessible sans
  compte partenaire ; le canal existe mais l'envoi est refusé proprement.
- T307 (entrée IMAP) : la sortie SMTP fonctionne, l'entrée exige une boîte
  dédiée non fournie. T310 : tests de contrat limités au canal local.
- T315 (brouillons assistés par IA) et T316 (traduction) non commencés.



## 12. US4 — Revenue management explicable (2026-11-09)

### Principe : proposer, jamais imposer

- Une recommandation de prix est toujours créée en statut `proposee`. Aucun
  import ne modifie un prix : la décision reste humaine, dans
  `/hote/prix/recommandations`.
- `prixEffectif()` fixe la priorité : override manuel > recommandation appliquée
  > prix catalogue. Un prix manuel n'est donc jamais écrasé par un import.
- `PRICING_IMPORT_ENABLED` est faux par défaut : le cron d'import est inerte tant
  qu'un opérateur ne l'active pas.

### Ce qui a été livré

- Domaine `v2/src/domain/recommandation-prix.ts` : bornes par défaut 20 €–2 000 €,
  plancher et plafond absolus 10 €/5 000 €, arrondi à 50 centimes, seuil de
  confiance 40, impact maximal 300 %, `joursInclus` (une plage « du 1er au 3 »
  couvre trois jours, contrairement à un séjour dont la fin est exclusive).
- Domaine `v2/src/domain/performance-prix.ts` : ADR, taux d'occupation, RevPAR et
  comparaison de deux périodes de même durée — réutilisable par US5.
- Ports `pricing.ts` (`PricingPort`) et `recommandations-prix-repository.ts`,
  migration `0093` (`recommandations_prix`, RLS, contraintes de source, statut et
  confiance, unicité `(tenant, logement, jour, source)`).
- Adapters : `pricing-pricelabs.ts` (`X-API-Key`, parsing tolérant, refus
  `PRICING_INDISPONIBLE` sans clé ou sans référence) et `pricing-local.ts`
  (prix catalogue + occupation 30 jours, facteurs listés, fonctionne sans
  partenaire).
- Cas d'usage : `ImporterRecommandations` (partenaire si disponible, sinon local ;
  confiance < 40 écartée ; idempotent) et `AppliquerRecommandation` (prix borné et
  signalé, tarif écrit avec `source = recommandation`, audit, un échec de push
  canal n'annule pas l'application locale).
- Cron `/api/cron/pricing` (`CRON_SECRET` + `PRICING_IMPORT_ENABLED`,
  `?simulation=1`, horizon 90 jours) via
  `v2/src/lib/server/planificateur-pricing.ts`.
- Écran `/hote/prix/recommandations` : prix actuel / recommandé / écart signé,
  facteurs et confiance (« pourquoi ce prix »), application ou rejet unitaire,
  sources disponibles avec leur état, bloc « RevPAR avant / après décision ».
  Accès depuis `/hote/prix`.

### Panne partenaire (T410)

- Si `PRICELABS_API_KEY` est absente, l'écran affiche « PriceLabs — indisponible »
  et l'import bascule sur la source locale ; un import impossible laisse tous les
  prix en place (« aucun prix n'a été modifié »). Aucun prix ne dépend de la
  disponibilité d'un partenaire.

### Preuves du 2026-11-09

- 976 tests unitaires / 195 fichiers, 0 échec (dont `tests/contract/pricing.test.ts`,
  nouveau dossier de contrat) ; `npm run check` 0 erreur / 0 avertissement ;
  `npm run build` OK.
- 94 migrations / 86 tables / 74 tables en RLS / 74 policies validées sur base
  vide ; `db:test-rls` ajoute « recommandations de prix isolées par tenant ».
- e2e `pricing.spec.ts` 2/2 (js et sans JavaScript) : import de 3 jours, écarts et
  facteurs affichés, application bornée (+ audit `prix.recommandation-appliquee`,
  tarif source `recommandation`), rejet sans toucher au prix, réimport idempotent
  qui ne réécrit ni le catalogue ni les décisions prises.

### Ce qui reste bloqué en US4

- T404 : l'adaptateur PriceLabs n'a jamais été exécuté contre l'API réelle
  (aucune clé disponible) ; seule la lecture du payload est couverte par un test.
- T414 (gate) : impossible sans clé partenaire et sans 30 jours de réservations
  réelles post-application.
- Le push canal d'un prix appliqué n'est exercé par aucun test : aucun canal de
  distribution n'est configuré dans l'environnement local.
- L'impact RevPAR affiché est une projection (prix appliqués × occupation
  réalisée), pas une mesure de 30 jours de réservations réelles.

## 13. US6 — Expérience voyageur : guide, extras, avis, codes d'accès (2026-11-10)

### Principe : le voyageur n'a besoin d'aucun compte, et rien ne dépend d'une serrure

- Le guide d'arrivée et le dépôt d'avis passent par un lien signé
  (payload base64url + HMAC-SHA256, validité 60 jours) vérifié **avant** toute
  lecture (règle 11) : un jeton falsifié ne fait fuiter ni adresse, ni code wifi,
  ni numéro d'urgence.
- Aucun écran voyageur n'exige JavaScript : `/guide/[token]` et `/avis/[token]`
  sont en `csr = false`, `noindex`, avec formulaires natifs ; le parcours complet
  est rejoué avec JavaScript désactivé (projet Playwright `sans-js`).
- Une serrure connectée est un confort, jamais une condition : `CreerAccesSerrure`
  tente le fournisseur puis retombe sur un code manuel, et le job J-7 qui prépare
  le code d'arrivée ne bloque jamais l'envoi du message (erreur journalisée,
  message publié).
- La publication d'un avis reste une décision humaine : le domaine n'automatise
  ni la publication ni le masquage, et un avis négatif n'est jamais caché.

### Ce qui a été livré

- Domaines purs `v2/src/domain/` : `guide-voyageur.ts` (6 langues, 5 sections
  arrivée/wifi/séjour/départ/urgence, validation et résolution de contenu, lien
  signé), `acces-serrure.ts` (fenêtre d'accès, code numérique, révocation),
  `demande-extra.ts` (6 types, statuts et prix) et `avis-voyageur.ts` (cycle
  invité → déposé → publié/masqué, note 1-5) ; erreurs typées `GUIDE_INVALIDE`,
  `SERRURE_INDISPONIBLE`, `DEMANDE_EXTRA_INVALIDE` dans `erreurs.ts`.
- Migrations `0096` (`guide_contenus`, `acces_serrure`), `0097` (idempotence des
  accès, expand/contract) et `0098` (`demandes_extra`, `avis_voyageur`) : RLS plus
  grant `lcd_app`, contrôlées par `scripts/verifier-rls.mjs`.
- Ports `guides-repository.ts`, `serrure-connectee.ts`,
  `demandes-extra-repository.ts`, `avis-voyageur-repository.ts` et adapters
  Drizzle correspondants ; `serrures/nuki.ts` (création `PUT authorization`,
  révocation `DELETE`, `estDisponible()` qui ne lève jamais, révocation
  idempotente sur 404) avec son contrat `tests/contract/nuki.test.ts`.
- Cas d'usage `creer-acces-serrure.ts` (idempotent par `ref`, repli manuel),
  `demander-extra.ts` / `decider-demande-extra.ts`, `gerer-avis-voyageur.ts`
  (inviter, déposer, modérer) et `preparerAccesArrivee` branché au planificateur
  de messages J-7.
- Voyageur : `/guide/[token]` (sections dans la langue du lien, wifi, urgence,
  demande d'extra et suivi de ses demandes avec statut, prix et motif de refus) et
  `/avis/[token]` (avis sans compte).
- Staff : éditeur `/hote/logements/[id]/guide`, écran serrure
  `/hote/logements/[id]/serrure` (réservation ou plage libre, révocation motivée),
  `/hote/demandes-extra` et `/hote/avis-voyageur` ; les avis publiés remontent au
  site public par `listerPublies` dans `/site/[slug]/[[page]]` (`BlocAvis`).
- Installation PWA (`/hote/installation`, `static/pwa.js`, manifeste) et
  navigation staff complétée des écrans US3/US6 absents du menu, avec libellés
  dans les cinq langues (`i18n-nav.ts`).

### Preuves du 2026-11-10

- `npm run check` : 0 erreur / 0 avertissement ; `npm run build` : OK.
- `node node_modules/vitest/vitest.mjs run` : 221 fichiers, 1 278 tests verts,
  2 sautés (sandbox Nuki, hors clés).
- `npm run db:test-migrations` : 99 migrations, 93 tables, 81 en RLS, 81 policies,
  base vide, rôle `lcd_app` autorisé ; `npm run db:test-rls` : « demandes extra et
  avis voyageur isolés par tenant » (accès inter-tenant refusé).
- e2e `v2/e2e/experience-voyageur.spec.ts` : 1/1 sur `js` (19,9 s) et 1/1 sur
  `sans-js` (9,3 s) — guide signé lisible sans compte, jeton falsifié refusé,
  demande d'extra puis validation staff, création puis révocation d'un code,
  dépôt puis publication d'un avis.

### Limites assumées

- Révocation côté fournisseur Nuki impossible : aucun `serrure_id` n'est persisté.
  La révocation reste locale au produit et le code expire en fin de fenêtre.
- Aucun envoi réel de message : l'automatisation ne produit que des brouillons,
  `MESSAGES_AUTO_ENABLED` reste faux par défaut.
- Le contrat sandbox Nuki (création/révocation réelles) est sauté sans
  `NUKI_API_TOKEN` et `NUKI_SANDBOX_SERRURE_ID`.

---

## 14. i18n staff : libellés paramétrés non sérialisables (2026-11-10)

**Constat.** Les dictionnaires staff contiennent des libellés paramétrés
(fonctions : `avancement(nom)`, `aMots(mots, max)`, …). SvelteKit refuse de
sérialiser une fonction : `Data returned from load while rendering /hote is not
serializable: Cannot stringify a function (data.tNav.apercuLectureSeule)`.
`masquerFonctions()` (`src/lib/i18n-staff.ts`) les rend non énumérables pour que
le payload reste sérialisable : la fonction existe côté serveur mais **est
absente du payload client**.

**Effet.** Un écran qui appelle `data.t.<libellé>(…)` s'affiche correctement en
chargement complet mais casse en navigation interne (clic menu) :
`TypeError: data.t.avancement is not a function` → page « Internal Error »
(500). Reproduit sur `/hote/onboarding?logement=<id>` puis corrigé en
pré-rendant les libellés dans le `load` (`avancementTexte`,
`progressionTexte`, `pretNoteTexte`).

**Règle de conception.** Un composant qui utilise un libellé paramétré
reconstruit son dictionnaire côté client :
`const t = $derived(traductionsXxx(data.langue));` (le `load` expose `langue`).
Sinon le libellé est pré-rendu côté serveur dans une chaîne du `load`. Ne jamais
appeler `data.t.<libellé>(…)` dans un template hydraté : les libellés simples
(chaînes) sont sûrs, les libellés paramétrés ne le sont pas.

**État au 2026-11-10.** Écrans convertis au dictionnaire client (dont
`/hote/factures`, `/hote/compta`, `/hote/planning`, `/hote/logements/[id]`,
`/hote/assistant`) ; `load` de `/hote/onboarding` pré-rend les trois libellés
paramétrés. Dernier appel résiduel corrigé dans
`src/routes/hote/assistant/+page.svelte` (+ `langue` exposée par son `load`).
