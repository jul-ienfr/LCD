# Plan de comblement des écarts Lodgify — LCD v1

**Date** : 2026-11-06
**Base** : `docs/analyses/LODGIFY-VS-LCD-2026-11.md`, `replica/recon.md`, `replica/features.csv`
**Exécution Spec Kit** : `specs/002-parite-lodgify/` (spec, plan, 72 exigences, 193 tâches, contrats)
**Périmètre** : V2 uniquement (`v2/`). La V1 et le lab restent gelés.
**Posture** : ne pas cloner Lodgify ; combler 5 écarts commerciaux, protéger 7 avantages LCD.

---

## 0. Décision et principes

### 0.1 Décision

LCD ne devient pas un clone de Lodgify. LCD devient **le PMS de conciergerie français** :

- distribution temps réel par partenaire certifié (pas d'API OTA native) ;
- site de réservation directe qui encaisse (mini-builder, pas Wix) ;
- inbox unifiée (fournisseur + email + SMS + WhatsApp) ;
- revenue management intégré (Beyond/PriceLabs, pas d'algo maison) ;
- profondeur ops et conformité FR (le moat).

### 0.2 Principes non négociables

1. **Un lot à la fois**, avec un gate de sortie. Pas de dispatch multi-lots.
2. **Partenariat plutôt que build** pour tout ce qui est certifié, régulé ou soumis à contrat : OTA, pricing, paiement, serrures, assurance, guide.
3. **Ports/adapters** : chaque partenaire derrière `src/application/ports/` + `src/infrastructure/adapters/`, avec plan de retrait.
4. **HTML-first** : le voyageur et le public restent sans JS obligatoire ; le checkout peut charger un îlot Stripe.
5. **Idempotence** : toute écriture rejouable porte une `ref` stable ; webhooks et imports sont rejouables.
6. **Tenant** : `tenant_id` vient de la session ; RLS et `withTenant()` pour toute table métier.
7. **Migrations immuables** après application ; expand/contract ; backup/restore testés.
8. **Pas de secret dans Git** ; clés partenaires en base chiffrée ou variables d'environnement.
9. **1-tap humain** pour tout geste sensible : envoi de message automatique, prix hors bornes, remboursement, caution.
10. **Coût** : l'infrastructure reste à 0-5 €/mois ; les partenaires sont des coûts variables refacturables, plafonnés et audités.

### 0.3 Ce que le plan ne fait pas

- Pas d'apps natives iOS/Android.
- Pas de builder de site complet (blog, 32 langues, thèmes infinis).
- Pas de marketplace 25+.
- Pas de financement/assurance embarquée.
- Pas de self-service avec essai gratuit avant 20 clients.
- Pas d'API OTA native sans contrat.
- Pas de refonte de la V1 ni du lab.

---

## 1. Hypothèses et dépendances

| # | hypothèse | conséquence si fausse |
| --- | --- | --- |
| H1 | Un fournisseur (Beds24 ou Channex) expose ARI + bookings + webhooks + messaging | Si messaging absent, l'inbox OTA se limite à email/SMS et il faut un second partenaire |
| H2 | Stripe Connect ou compte marchand du tenant est juridiquement acceptable | Sinon, cantonner LCD au suivi de paiement et laisser le tenant encaisser |
| H3 | Beyond ou PriceLabs expose une API de recommandations | Sinon, rester sur les stratégies internes + import manuel |
| H4 | Le trafic direct peut atteindre 20-30 % du CA | Sinon, le mini-builder reste un outil de crédibilité, pas de croissance |
| H5 | Une seule personne développe (temps partiel) | Calendrier ×1,5 ; paralléliser L4/L5 avec L6 |
| H6 | Les clients acceptent de payer le fournisseur de distribution en plus | Sinon, l'inclure dans PILOTAGE et ajuster le prix |

Dépendances existantes :

- `v2/CHANNEL-MANAGER.md` : socle iCal, registre 5 fournisseurs, orchestration.
- `v2/MATRICE-MUST-HAVE-CHANNEL-MANAGER.md` : seuils Beds24/Channex, coûts.
- `v2/FOURNISSEURS-CHANNEL-MANAGER.md` : adapters, cron, webhooks.
- `docs/panier-p0-chiffre.md` : budget terrain.
- `docs/revue-modele-eco-p10-10.md` : FULL/PILOTAGE/KIT, point mort.

---

## 2. Vue d'ensemble des lots

| Lot | Objectif | Durée | Dépend de | Gate de sortie |
| --- | --- | --- | --- | --- |
| **L0** | Trancher les 5 décisions structurantes | 1 sem | — | 5 ADR signés, budget plafonné |
| **L1** | Distribution temps réel via partenaire | 4 sem | L0 | 1 logement live Airbnb+Booking, 0 surbooking sur 14 j |
| **L2** | Site direct + paiement à la réservation | 5 sem | L0, L1 | Réservation directe payée de bout en bout |
| **L3** | Inbox unifiée + automatisations + IA | 3 sem | L1 | 80 % des messages dans un seul fil |
| **L4** | Revenue management intégré | 2 sem | L1, L2 | 1 logement en pricing dynamique 30 j, RevPAR comparé |
| **L5** | Reporting + relevés propriétaires récurrents | 2 sem | L2 | Relevé mensuel envoyé automatiquement |
| **L6** | API publique + 3 intégrations ciblées | 3 sem | L1-L3 | API documentée, 3 partenaires live |
| **L7** | Onboarding + go-to-market | 2 sem | L2-L5 | 1 conciergerie onboardée en 1 j sans le fondateur |

**Total** : 22 semaines à temps partiel, 18-20 semaines si L4/L5 chevauchent L6 et si L2 démarre pendant L1.

---

## 3. L0 — Décisions structurantes (1 semaine)

### Objectif

Éviter de coder avant d'avoir tranché ce qui coûte cher et ce qui engage.

### Décisions à prendre (5 ADR)

| ADR | question | options | critère de choix |
| --- | --- | --- | --- |
| ADR-01 | Fournisseur de distribution pilote | Beds24 / Channex | Coût, messaging, white-label, webhooks, couverture FR, contrat |
| ADR-02 | Architecture de paiement | Stripe Connect / compte marchand du tenant / suivi seul | Conformité DSP2, qui encaisse, qui rembourse, qui porte le risque |
| ADR-03 | Pricing | Beyond / PriceLabs / interne seulement | API, coût/logement, qualité FR, explicabilité |
| ADR-04 | Site direct | Mini-builder maison / templates statiques + widget / partenaire | Effort, maintenance, SEO, domaine, i18n |
| ADR-05 | Périmètre messagerie | Fournisseur seul / fournisseur + email / + WhatsApp | Ce que le fournisseur expose réellement |

### Livrables

- `docs/decisions/ADR-01-fournisseur-distribution.md` … `ADR-05-messagerie.md`.
- Une grille de benchmark Beds24 vs Channex sur : push ARI, import booking, webhook, messaging, white-label, tarif à 1/10/30 lots, DPA, plan de sortie : `docs/decisions/benchmark-grille.md`.
- Un budget partenaire plafonné : `docs/decisions/BUDGET-PARTENAIRES-2026-11.md`.

### Tests / preuves

- Un compte sandbox Beds24 et un staging Channex : créer 1 logement, 1 rate plan, 1 restriction, pousser dispo/prix, créer une réservation, recevoir le webhook, vérifier la signature.
- Vérifier dans le contrat : revente, DPA, SLA, résiliation, export des données, limites API.

### Effort

5 jours-homme. **Gate** : les 5 ADR sont signés, le budget est plafonné, le fournisseur pilote est choisi.

---

## 4. L1 — Distribution temps réel (4 semaines)

### Objectif

Passer du « iCal + fournisseur optionnel » à « un canal temps réel fiable, avec réconciliation ».

### Périmètre

1. **Durcir l'adapter du fournisseur pilote** :
   - `src/application/ports/fournisseur-canal.ts` : `pousserARI`, `importerReservations`, `lireStatut`, `verifierWebhook`.
   - `src/infrastructure/adapters/<fournisseur>/` : auth, retry, rate limit, mapping logement/rate plan.
   - Idempotence : `ref` = hash(logement, dates, payload) ; table `demandes_sync` existante.
2. **ARI sortant** :
   - disponibilités, prix, min/max stay, CTA/CTD, stop-sell ;
   - push par différence (pas de full sync) ;
   - outbox + cron + webhook de confirmation ;
   - gestion des 409/429 et du backoff.
3. **Réservations entrantes** :
   - import initial + webhooks ;
   - modifications, annulations, no-show ;
   - dédoublonnage par `external_id` + `channel` ;
   - réconciliation quotidienne (pull de sécurité).
4. **Santé des connexions** :
   - page `/hote/planning/canaux` enrichie : dernier push, dernier pull, erreurs, drift, bouton « resynchroniser » ;
   - alerte si un canal n'a pas répondu depuis X minutes.
5. **Cut-off et buffer** : vérifier que les règles existantes (0-365 j, 0-7 j) sont poussées et respectées.

### Livrables

- Adapter + tests de contrat (sandbox).
- Migration additive pour les colonnes de statut/erreur si nécessaire.
- Écran de santé canal.
- Runbook `docs/runbooks/distribution-temps-reel.md`.

### Tests d'acceptation

- Créer une réservation sur Airbnb sandbox → elle apparaît dans LCD en < 5 min.
- Modifier les dates → mise à jour sans doublon.
- Annuler → blocage libéré.
- Pousser un prix et un stop-sell → visibles côté canal.
- Rejouer 100 webhooks dans le désordre → état final identique.
- Couper le réseau 10 min → reprise sans perte.
- 14 jours de double-run iCal + API → 0 surbooking.

### Effort

20 jours-homme. **Gate** : 1 logement réel, 2 canaux, 14 jours, 0 incident.

### Risque principal

Le fournisseur ne pousse pas les restrictions ou ne signe pas les webhooks. Repli : iCal + polling + alertes, et documenter la limite au client.

---

## 5. L2 — Site direct et paiement à la réservation (5 semaines)

### Objectif

Faire du direct un canal qui convertit et qui encaisse, pas une vitrine.

### Périmètre

1. **Mini-builder** :
   - 3 templates (séjour, océan, sable) réutilisant les thèmes existants ;
   - 4 types de pages : accueil, logement, région, contact ;
   - blocs : hero, galerie, description, équipements, carte, avis, CTA réservation ;
   - SEO : title/meta, Open Graph, sitemap, données structurées `LodgingBusiness` ;
   - 6 langues : fr, en, it, es, de, nl (pt/ru plus tard) ;
2. **Domaine par tenant** :
   - table `domaines` (tenant, domaine, statut de vérification) ;
   - Caddy on-demand TLS ou instructions DNS manuelles ;
   - redirection canonique, HTTPS, `noindex` sur les aperçus.
3. **Widget** :
   - snippet `<script>` + iframe vers `/reserver?tenant=…&embed=1` ;
   - paramètres : logement, langue, thème ;
   - test sur WordPress/Wix/Squarespace.
4. **Paiement à la réservation** :
   - Stripe Checkout à la création de réservation ;
   - échéancier : acompte 30 % J0, solde J-30 (configurable) ;
   - caution : PaymentIntent `manual_capture` ou partenaire Swikly ;
   - confirmation, facture, email, webhook ;
   - 3DS2 géré par Stripe.
5. **Promotions** :
   - early bird, last minute, code, séjour long ;
   - règles par logement et par date ;
   - affichage du prix barré et du motif.
6. **Google Vacation Rentals** (si le fournisseur le permet) : flux ou connexion.

### Livrables

- Routes : `/site/[page]`, `/reserver` enrichi, `/api/widget`, `/api/paiement`.
- Tables : `pages_site`, `promotions`, `echeances_paiement`, `domaines`.
- Adapter Stripe étendu (checkout réservation, capture, remboursement).
- Tests e2e : réservation + paiement test + confirmation.

### Tests d'acceptation

- Créer un site, choisir un template, publier, visiter sur un domaine de test.
- Réserver en direct, payer par carte test, recevoir la confirmation, voir la réservation dans le planning.
- Vérifier l'échéancier et la caution.
- Vérifier le widget sur une page externe.
- Vérifier le SEO (sitemap, meta, JSON-LD).
- Vérifier le parcours sans JS (hors checkout).

### Effort

25 jours-homme. **Gate** : 1 réservation directe payée de bout en bout, 0 double réservation, site publié sur un domaine.

### Risque principal

Le cadre paiement (LCD encaisse pour le compte du propriétaire). Repli : le tenant encaisse sur son compte Stripe, LCD ne fait que le lien de paiement.

---

## 6. L3 — Inbox unifiée, automatisations, IA (3 semaines)

### Objectif

Un seul endroit pour tous les messages, avec des scénarios et une IA qui propose sans envoyer.

### Périmètre

1. **Modèle de fil unifié** :
   - `fils_voyageur` : `id`, `tenant_id`, `reservation_id`, `canal` (ota/email/sms/whatsapp/interne), `external_thread_id`, `participants`, `statut`, `assigne_a`.
   - `messages_voyageur` : ajout `fil_id`, `auteur`, `canal`, `pieces_jointes`, `lu_at`.
   - Migration additive, reprise des messages existants.
2. **Connecteurs** :
   - fournisseur OTA (si messaging exposé) ;
   - email entrant (IMAP ou webhook) + email sortant SMTP ;
   - SMS Brevo existant ;
   - WhatsApp Business API (phase 2, si le volume le justifie).
3. **Automatisations** :
   - déclencheurs : réservation confirmée, J-7, J-1, jour du départ, J+1, demande d'avis ;
   - conditions : logement, canal, langue, statut ;
   - templates avec variables ;
   - mode « brouillon à valider » par défaut, envoi auto uniquement après validation explicite.
4. **Assistant IA** :
   - contexte : réservation, logement, guide, historique ;
   - suggestion de réponse, ton, langue ;
   - 1-tap envoyer / modifier ;
   - audit de chaque envoi.
5. **Centre de notifications** : messages non lus, réservations à confirmer, tâches en retard.

### Livrables

- Routes : `/hote/messages` refondu, `/hote/messages/[id]`, `/hote/automatisations`.
- Tables : `fils_voyageur`, `automatisations`, `executions_automatisation`.
- Adapters : `email-entrant`, `whatsapp`, `ota-messaging`.
- Tests : webhook entrant, dédoublonnage, scénario J-1, IA en brouillon.

### Tests d'acceptation

- Un message Airbnb (sandbox) arrive dans le fil de la réservation.
- Un email voyageur arrive dans le même fil.
- Un SMS sortant est tracé.
- Le scénario J-1 envoie un brouillon, pas un message auto.
- L'IA propose une réponse contextuelle, l'humain valide, l'audit est écrit.

### Effort

15 jours-homme. **Gate** : 80 % des messages de test dans un seul fil, 0 envoi auto non validé.

### Risque principal

Les OTA ne donnent pas accès aux messages. Repli : email/SMS + copier-coller assisté, et ne pas promettre l'inbox OTA.

---

## 7. L4 — Revenue management intégré (2 semaines)

### Objectif

Un prix qui suit le marché, avec une explication et un override humain.

### Périmètre

1. **Adapter pricing** : `PricingPort` (`pousserParametres`, `lireRecommandations`, `appliquer`).
2. **Paramètres** : prix de base, min, max, occupation cible, stratégie, événements locaux.
3. **Recommandations** : import quotidien, 18 mois, par logement et par date.
4. **Écran « pourquoi ce prix »** : décomposition, facteurs, delta, historique, bouton appliquer/ignorer.
5. **Application** : 1-tap, bornes, audit, fallback manuel.
6. **Job quotidien** : pull, calcul, push ARI (via L1), alerte si écart.

### Livrables

- `src/application/ports/pricing.ts`, `src/infrastructure/adapters/beyond/` ou `pricelabs/`.
- Route `/hote/prix/recommandations`.
- Table `recommandations_prix`.
- Tests : import, bornes, override, push.

### Tests d'acceptation

- 1 logement, 30 jours de recommandations importées.
- Écran explicatif lisible.
- Application d'un prix → push canal → vérification.
- Override manuel tracé.
- Comparaison RevPAR avant/après sur 30 jours.

### Effort

10 jours-homme. **Gate** : 1 logement en dynamique 30 jours, décision documentée.

---

## 8. L5 — Reporting et relevés propriétaires (2 semaines)

### Objectif

Donner à la conciergerie les chiffres qu'elle vend à ses propriétaires.

### Périmètre

1. **KPIs** : taux d'occupation, ADR, RevPAR, CA par canal, pick-up, durée moyenne, annulations.
2. **Filtres** : période, logement, entité, propriétaire, canal.
3. **Relevé propriétaire** :
   - revenus, dépenses, commission, ménage, extras ;
   - PDF soigné, envoi email, récurrence mensuelle/trimestrielle ;
   - portail `/proprio` et API relevé.
4. **Exports** : CSV/PDF, compatibles compta.
5. **Alertes** : écart de rapprochement, impayé, marge négative.

### Livrables

- Route `/hote/rapports`.
- Tables : `releves_proprietaires`, `envois_releves`.
- Job cron de récurrence.
- Tests : calculs, arrondis, PDF, envoi.

### Tests d'acceptation

- Les KPIs correspondent aux réservations et paiements.
- Un relevé est généré, envoyé, archivé, consultable par le propriétaire.
- La récurrence fonctionne.
- Les exports sont exploitables par un comptable.

### Effort

10 jours-homme. **Gate** : 1 relevé réel envoyé à un propriétaire.

---

## 9. L6 — API publique et intégrations ciblées (3 semaines)

### Objectif

Ne pas être un silo : permettre à la conciergerie de connecter ses outils.

### Périmètre

1. **API publique lecture** : propriétés, réservations, disponibilités, prix, propriétaires.
   - clés API par tenant, scopes, rate limit, logs ;
   - documentation OpenAPI ;
   - versioning `/api/v1`.
2. **Webhooks** : déjà présents ; ajouter les événements réservation, message, tâche, paiement.
3. **3 intégrations** :
   - serrures (Nuki) : codes temporaires, révocation ;
   - guide voyageur (Duve ou Touch Stay) : lien, contenu ;
   - caution (Swikly) : empreinte, libération.
4. **Zapier/Make** : app générique basée sur l'API + webhooks.
5. **MCP** (optionnel, après API) : serveur local pour ChatGPT/Claude, lecture seule.

### Livrables

- `/api/v1/*`, clés, docs.
- Adapters Nuki, Duve/Touch Stay, Swikly.
- Page `/hote/integrations` enrichie.
- Tests de contrat.

### Tests d'acceptation

- Une clé API lit les réservations d'un tenant sans voir les autres.
- Un webhook réservation est livré et rejoué.
- Un code Nuki est créé et révoqué.
- Un guide est partagé au voyageur.
- Une caution est créée et libérée.

### Effort

15 jours-homme. **Gate** : 3 intégrations live, API documentée.

---

## 10. L7 — Onboarding et go-to-market (2 semaines)

### Objectif

Pouvoir vendre à une conciergerie sans que le fondateur fasse tout à la main.

### Périmètre

1. **Onboarding** : check-list, import logements, connexion canaux, site, paiements, équipe.
2. **Import** : CSV logements/réservations, reprise iCal, doublons.
3. **Démo** : jeu de données, visite guidée, mode lecture seule.
4. **Support** : base d'aide, tickets, SLA interne.
5. **Pricing page** : FULL/PILOTAGE/KIT, calculateur, FAQ.
6. **Académie** : 5 mini-vidéos (canaux, site, messages, prix, relevés).

### Livrables

- `/hote/onboarding` enrichi.
- `/aide` avec articles.
- Page pricing publique.
- Scripts de démo.

### Tests d'acceptation

- Un nouveau client crée son compte, importe 3 logements, connecte 2 canaux, publie un site, fait une réservation test en < 1 jour.
- Le support reçoit un ticket et le traite.

### Effort

10 jours-homme. **Gate** : 1 conciergerie onboardée sans intervention du fondateur.

---

## 11. Séquencement

```
S1      S2-S5        S6-S10        S11-S13      S14-S15     S16-S17     S18-S20     S21-S22
L0      L1           L2            L3           L4          L5          L6          L7
décisions distribution site+paiement inbox+IA   pricing     reporting   API+intégr. onboarding
```

Règles :

- L0 est bloquant.
- L1 et L2 peuvent se chevaucher d'une semaine (L2 commence par le mini-builder, qui ne dépend pas de L1).
- L3 dépend de L1 pour les messages OTA, mais l'email/SMS peut démarrer avant.
- L4 et L5 peuvent tourner en parallèle de L6 si la capacité le permet.
- Ne pas ouvrir L7 avant qu'un client pilote ait validé L2 et L5.

---

## 12. Budget

| Poste | Coût | Commentaire |
| --- | --- | --- |
| Fournisseur distribution (Beds24) | ~17 €/mois (1 logement) à ~55 €/mois (10) | Refacturable ; Channex ~130 $/mois si white-label |
| Pricing (Beyond/PriceLabs) | ~15-50 €/logement/mois | À refacturer ; option interne gratuite en fallback |
| Stripe | 1,4 % + 0,25 € (cartes EU) | Pas de frais plateforme |
| WhatsApp Business API | À l'usage | Phase 2 |
| Serrures / guide / caution | 0-50 €/mois selon partenaire | Optionnel |
| Domaine / TLS | ~10 €/an | Caddy + Let's Encrypt |
| Total pilote (1-3 logements) | **50-150 €/mois** | Refacturé au client ; plafond à valider en L0 |

Le « 0 € strict » reste la règle pour l'infrastructure (Oracle/VPS, Cloudflare, Mailpit). Les partenaires sont des coûts variables **refacturables**, pas des coûts fixes.

---

## 13. Critères d'acceptation globaux (DoD)

Chaque lot est clos si :

1. `npm run check`, `npm test`, `npm run build`, `npm run test:e2e` verts.
2. `npm run db:check`, `npm run db:test-migrations`, `npm run db:test-rls` verts.
3. Un test de contrat partenaire (sandbox) vert.
4. Un runbook daté + un plan de retrait.
5. Une ligne au changelog et une mise à jour de `docs/analyses/LODGIFY-VS-LCD-2026-11.md` si l'écart change.
6. Aucun secret dans Git ; clés en variables d'environnement.
7. HTML-first préservé : le parcours public/voyageur fonctionne sans JS (hors checkout).
8. Budget JS : voyageur < 50 Ko gzip, staff < 200 Ko.

---

## 14. KPIs

| KPI | Cible | Mesure |
| --- | --- | --- |
| Surbooking | 0 sur 30 jours | incidents, réconciliation |
| Délai de sync canal | < 5 min (webhook) | logs `demandes_sync` |
| Part du direct dans le CA | 20-30 % à 12 mois | réservations directes / total |
| Temps de réponse message | < 15 min (8h-22h) | inbox |
| RevPAR | +5-10 % après L4 | comparaison 30 j |
| Marge par lot | > point mort (3-5 FULL) | `journal_revenus` |
| Churn | < 10 %/an | contrats |
| NPS proprio/voyageur | ≥ 50 | enquête trimestrielle |
| Onboarding | < 1 jour | chrono |

---

## 15. Risques et replis

| Risque | Repli |
| --- | --- |
| Fournisseur sans messaging | Inbox email/SMS + copier-coller assisté ; ne pas promettre l'inbox OTA |
| Contrat OTA refusé | Rester iCal + fournisseur ; documenter la limite |
| Paiement interdit pour autrui | Le tenant encaisse sur son Stripe ; LCD génère le lien |
| Pricing trop cher | Stratégies internes + import manuel |
| Mini-builder trop long | 3 templates, 4 blocs, pas de blog ; widget en priorité |
| Capacité insuffisante | Un lot sur deux, L4/L5 après L6 |
| Dérive de coût partenaire | Plafond, audit trimestriel, refacturation |

---

## 16. Ce qu'on ne fait pas (et pourquoi)

- **Apps natives** : la PWA couvre le besoin, coût et maintenance disproportionnés.
- **Builder complet** : 3 templates + 4 blocs suffisent à la crédibilité.
- **Marketplace 25+** : 3-5 partenaires choisis, pas un catalogue.
- **API OTA native** : contrat, risque, délai ; le fournisseur fait le travail.
- **Financement / assurance** : produits régulés, partenariat seulement.
- **Self-service / essai gratuit** : avant 20 clients, le support coûterait plus que l'acquisition.
- **Refonte V1 / lab** : gelés, hors périmètre.

---

## 17. Prochaine action (7 jours)

1. **J1-J2** : benchmark Beds24 vs Channex sur sandbox (ARI, booking, webhook, messaging, white-label, coût à 1/10/30 lots).
2. **J3** : ADR-01 (fournisseur) et ADR-02 (paiement) rédigés, avis juridique/comptable demandé.
3. **J4** : prototype Stripe Checkout sur `/reserver` en mode test (sans toucher au schéma).
4. **J5** : maquette des 3 templates et des 4 blocs ; validation avec un client pilote.
5. **J6-J7** : chiffrage L1 et L2, mise à jour du plan, gate L0.

**Critère de réussite de la semaine** : les 5 ADR sont signés, le budget partenaire est plafonné, et le prototype de paiement fonctionne en test.

---

## 18. Annexes

- Analyse détaillée : `docs/analyses/LODGIFY-VS-LCD-2026-11.md`
- Recon : `replica/recon.md`
- Matrice : `replica/features.csv`
- Socle channel manager : `v2/CHANNEL-MANAGER.md`
- Matrice fournisseurs : `v2/MATRICE-MUST-HAVE-CHANNEL-MANAGER.md`
- Modèle éco : `docs/revue-modele-eco-p10-10.md`
- Fiche REA : `docs/registres/teardowns-rea.md` (R-09)
