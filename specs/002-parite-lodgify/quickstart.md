# Quickstart — validation de la parité Lodgify

**Feature**: 002-parite-lodgify
**But**: vérifier chaque incrément de bout en bout, sans compte de production.

## Prérequis

- `v2/` installé (`npm ci`), PostgreSQL accessible, `.env` local.
- Un compte sandbox du fournisseur choisi (Beds24 ou Channex).
- Un compte Stripe test.
- Un compte PriceLabs/Beyond sandbox si disponible.
- Node 22, Playwright installé.
- Aucune donnée de production, aucun secret réel.

## Baseline avant de commencer

```bash
cd v2
npm run check
npx vitest run
npm run build
npm run db:check
npm run db:test-rls
npm run test:e2e
```

Tous doivent être verts. Noter la taille du bundle JS :

```bash
npm run build
# vérifier les tailles dans .svelte-kit/output
```

## Scénario 1 — Distribution (US1)

1. Créer un tenant de test et un logement.
2. Ouvrir `/hote/planning/canaux`, connecter le fournisseur sandbox.
3. Vérifier le mapping logement/rate plan.
4. Pousser 30 jours de dispo, prix et restrictions.
5. Créer une réservation sur le canal sandbox.
6. Vérifier dans `/hote/planning` : réservation présente, canal correct,
   montant correct, délai < 5 min.
7. Modifier les dates côté canal, vérifier la mise à jour sans doublon.
8. Annuler côté canal, vérifier la libération des nuits.
9. Rejouer le webhook 3 fois, vérifier une seule réservation.
10. Couper le réseau 10 min, vérifier la reprise sans perte.

**Attendu** : 0 surbooking, 0 doublon, alertes visibles si erreur.

## Scénario 2 — Site et paiement (US2)

1. Ouvrir `/hote/design`, choisir un template, créer 3 pages.
2. Publier sur le domaine de test.
3. Vérifier HTTPS, redirection, sitemap, JSON-LD.
4. Ouvrir le site en navigation privée, sans JS : les pages doivent rester
   lisibles.
5. Réserver 3 nuits, appliquer un code promo.
6. Payer l'acompte avec `4242 4242 4242 4242`.
7. Vérifier : réservation confirmée, facture, email, échéancier J-30.
8. Vérifier la caution (empreinte) : aucun débit immédiat.
9. Rejouer le webhook Stripe, vérifier un seul paiement.
10. Rembourser partiellement, vérifier le recalcul.

**Attendu** : réservation payée de bout en bout, aucun double paiement.

## Scénario 3 — Inbox (US3)

1. Envoyer un message depuis le canal sandbox.
2. Envoyer un email au même voyageur.
3. Vérifier un seul fil dans `/hote/messages`.
4. Activer le scénario J-1 en mode brouillon.
5. Déclencher le job, vérifier le brouillon (pas d'envoi).
6. Valider le brouillon, vérifier l'envoi et l'audit.
7. Vérifier l'opt-out SMS : aucun envoi.
8. Vérifier qu'un autre tenant ne voit rien.

**Attendu** : 80 % des messages dans un fil, 0 envoi auto non validé.

## Scénario 4 — Pricing (US4)

1. Activer le flag pricing sur un logement.
2. Importer 30 jours de recommandations.
3. Vérifier prix actuel, prix recommandé, écart, facteurs.
4. Appliquer une recommandation dans les bornes.
5. Vérifier le push canal.
6. Tenter un prix hors bornes : refus ou confirmation.
7. Faire un override manuel, vérifier qu'il gagne.
8. Couper le partenaire : aucun prix ne change.

**Attendu** : recommandations explicables, application auditée.

## Scénario 5 — Relevé propriétaire (US5)

1. Créer un propriétaire avec 2 logements.
2. Générer un relevé sur un mois avec réservations et paiements.
3. Vérifier les totaux : revenus, dépenses, commission, net.
4. Envoyer le PDF, vérifier l'archive.
5. Se connecter comme propriétaire, télécharger le relevé.
6. Provoquer un écart de rapprochement, vérifier l'alerte.

**Attendu** : chiffres justes, envoi tracé, alerte avant envoi faux.

## Scénario 6 — Expérience voyageur (US6)

1. Publier un guide pour un logement.
2. Ouvrir le lien signé sans compte.
3. Vérifier les instructions d'arrivée.
4. Créer un code Nuki pour les dates.
5. Vérifier la validité et la révocation au départ.
6. Demander un départ tardif, vérifier la demande staff + prix.

**Attendu** : guide accessible, code valide puis révoqué, audit.

## Scénario 7 — API (US7)

1. Créer une clé avec `reservations:read`.
2. Appeler `/api/v1/reservations` : uniquement le tenant de la clé.
3. Appeler avec une clé d'un autre tenant : 404.
4. Retirer le scope : 403.
5. Dépasser le rate limit : 429 + `Retry-After`.
6. Créer un webhook, recevoir un événement signé, rejouer.
7. Créer un code Nuki via l'intégration.

**Attendu** : isolation stricte, webhooks signés, 3 intégrations.

## Scénario 8 — Onboarding (US8)

1. Créer un tenant vierge.
2. Suivre la check-list.
3. Importer 3 logements CSV, vérifier les erreurs ligne par ligne.
4. Connecter un canal sandbox.
5. Publier un site.
6. Faire une réservation test.
7. Chronométrer : objectif < 1 jour.

**Attendu** : aucune intervention du fondateur.

## Commandes de vérification finale

```bash
cd v2
npm run check
npx vitest run
npm run build
npm run db:check
npm run db:test-migrations
npm run db:test-rls
npm run test:e2e
```

Vérifier aussi :

- `git grep -n "sk_live\|whsec_\|PRIVATE KEY"` : aucun secret.
- Taille JS voyageur < 50 Ko gzip, staff < 200 Ko.
- Pages publiques sans JS : scénario Playwright avec `javaScriptEnabled: false`.
- `docs/registres/changelog.md` et `replica/features.csv` à jour.

## Critères de sortie

- [ ] US1 : 14 jours, 2 canaux, 0 surbooking.
- [ ] US2 : 1 réservation directe payée.
- [ ] US3 : 80 % des messages dans un fil.
- [ ] US4 : 30 jours de pricing dynamique.
- [ ] US5 : 1 relevé réel envoyé.
- [ ] US6 : 1 code serrure créé/révoqué.
- [ ] US7 : 3 intégrations live.
- [ ] US8 : 1 onboarding en 1 jour.
