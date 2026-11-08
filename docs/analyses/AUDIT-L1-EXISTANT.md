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

