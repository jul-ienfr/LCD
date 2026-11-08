# Phase 0 — Recherche et décisions

**Feature**: 002-parite-lodgify
**Date**: 2026-11-06
**Statut**: décisions proposées, à confirmer par benchmark sandbox et avis
juridique avant implementation.

## Méthode

Les décisions ci-dessous s'appuient sur :

- `docs/analyses/LODGIFY-VS-LCD-2026-11.md` (analyse d'écart, sources publiques) ;
- `replica/recon.md` et `replica/features.csv` (123 fonctionnalités) ;
- `v2/CHANNEL-MANAGER.md`, `v2/MATRICE-MUST-HAVE-CHANNEL-MANAGER.md`,
  `v2/FOURNISSEURS-CHANNEL-MANAGER.md` (socle iCal et fournisseurs) ;
- les ports et adapters existants de `v2/src`.

Aucune donnée privée, aucun compte Lodgify, aucun scraping OTA.

## D1 — Distribution : fournisseur certifié, pas d'API OTA native

**Décision** : intégrer un fournisseur certifié, **Beds24 en pilote**,
**Channex en alternative white-label**. LCD ne demande pas de contrat
Connectivity Provider et n'appelle jamais directement les API Airbnb/Booking.

**Pourquoi** :

- Les programmes OTA sont fermés ou longs ; le fournisseur porte la
  certification, les webhooks et la maintenance des mappings.
- Le socle `FournisseurCanal` existe déjà (`v2/src/application/ports/fournisseur-canal.ts`)
  avec disponibilités, tarifs, restrictions, réservations et webhook.
- Beds24 est le moins cher au démarrage et couvre les besoins d'un pilote ;
  Channex offre un white-label plus propre pour revendre à des conciergeries.

**Alternatives rejetées** :

- API OTA native : contrat, délai, risque juridique, maintenance.
- Scraping : interdit par la constitution et les CGU.
- Smoobu : correct mais moins adapté au white-label et aux gros volumes.

**À vérifier en sandbox** : messaging OTA, webhooks signés, rate limits,
mapping multi-unités, Google Vacation Rentals, coût à 1/10/30 logements,
conditions de résiliation et export.

## D2 — Paiement : le tenant encaisse, LCD orchestre

**Décision** : le tenant encaisse sur **son compte Stripe** via **Stripe
Checkout** ; LCD crée la session, écoute le webhook, gère l'échéancier, la
caution et les remboursements. **Stripe Connect** est l'option si LCD doit
encaisser pour le compte du tenant, après avis juridique.

**Pourquoi** :

- LCD ne doit pas devenir prestataire de services de paiement ni porter le
  risque de crédit.
- Le port `Paiement` existe déjà (`v2/src/application/ports/paiement.ts`) et
  l'adaptateur Stripe gère Checkout, webhook et litiges.
- Checkout gère 3DS2, Apple Pay/Google Pay et la conformité PCI.

**Alternatives rejetées** :

- Encaisser sur le compte LCD : risque réglementaire et comptable.
- PayPal/Payyo en premier : couverture FR moindre, intégration supplémentaire ;
  PayPal pourra être ajouté en `MAY`.

**À vérifier** : compte marchand du tenant, TVA sur acompte, facture au nom du
tenant, politique de remboursement, caution (capture manuelle) et litiges.

## D3 — Pricing : partenaire, pas d'algorithme maison

**Décision** : intégrer **PriceLabs en pilote**, **Beyond en alternative**, via
un port `Pricing`. LCD importe des recommandations, les explique, les applique
dans des bornes et pousse les prix via D1.

**Pourquoi** :

- Un algorithme de marché crédible demande des données et des années.
- PriceLabs expose une API et un prix/logement accessible ; Beyond est déjà
  utilisé par Lodgify et couvre 18 mois.
- L'écran « pourquoi ce prix » est un différenciateur de confiance.

**Alternatives rejetées** :

- Construire un moteur de pricing : hors compétence et hors budget.
- Rester sur ±8/0/+10 % : ne répond pas au besoin de marge.

**À vérifier** : accès API, coût/logement, qualité sur les marchés FR,
explicabilité, webhooks, contrat de revente.

## D4 — Site direct : mini-builder, pas Wix

**Décision** : un mini-builder avec **3 templates**, **4 types de pages**
(accueil, logement, région, contact) et **7 blocs** (hero, galerie,
description, équipements, carte, avis, CTA). Pas de blog, pas de thèmes
infinis, pas de 32 langues. Widget embarquable et domaine personnalisé.

**Pourquoi** :

- 80 % de la valeur d'un builder tient dans une page logement crédible, un
  domaine et un tunnel qui encaisse.
- Le thème global existe (`apparence_versions`) et `parametres_site` porte des
  réglages plateforme, mais aucun des deux n'est un site par tenant : il faut
  créer `sites_tenants` comme racine du site public.
- Un builder complet est un produit à part entière, avec un coût de maintenance
  disproportionné.

**Alternatives rejetées** :

- Partenaire site (Wix/Squarespace) : perte du tunnel et du SEO maîtrisé.
- Builder complet : hors périmètre, cf. analyse.

**À vérifier** : rendu sans JS, Core Web Vitals, SEO, i18n, édition par un
non-technicien, domaine et TLS.

## D5 — Messagerie : couches, pas un seul connecteur

**Décision** : un fil unique, alimenté par **le fournisseur OTA** (si messaging
exposé), **IMAP/SMTP** pour l'email, **Brevo** pour le SMS, **WhatsApp Business
API** en phase 2. Automatisations en mode brouillon par défaut. IA en
suggestion, jamais en envoi autonome.

**Pourquoi** :

- Les OTA n'ouvrent pas tous le messaging ; il faut un repli email.
- Le staff a besoin d'un seul fil, pas de cinq onglets.
- L'IA apporte de la vitesse si l'humain garde la main.

**Alternatives rejetées** :

- Un inbox OTA uniquement : dépendance totale au fournisseur.
- Envoi automatique par défaut : risque de message faux ou hors ton.

**À vérifier** : accès messaging du fournisseur, parsing email, pièces
jointes, consentement WhatsApp, coût par conversation.

## D6 — Guide voyageur : d'abord le PWA, partenaire ensuite

**Décision** : construire un guide léger par logement, accessible par lien
signé, dans le PWA existant. Intégrer Duve ou Touch Stay en `MAY` si un client
le demande.

**Pourquoi** :

- Le guide est surtout du contenu et un lien ; le PWA couvre déjà l'accès.
- Un partenaire ajoute du coût et une dépendance pour une fonction simple.
- L'intégration partenaire reste possible via l'API (US7).

**À vérifier** : contenu riche (photos, cartes, langues), accès hors ligne,
signature des liens, analytics.

## D7 — Serrures : Nuki d'abord

**Décision** : intégrer **Nuki** (API, Bridge) pour les codes temporaires,
avec révocation au départ. Vikey en alternative si un client l'exige.

**Pourquoi** :

- API documentée, parc installé, coût accessible.
- Le besoin est simple : code valide sur les dates, révocable, audité.

**À vérifier** : modèle de serrure, Bridge, API cloud, latence, fallback code
manuel, RGPD.

## D8 — API publique : REST lecture d'abord

**Décision** : API REST `/api/v1` en lecture (logements, réservations,
disponibilités, prix), clés par tenant, scopes, rate limit, webhooks signés.
MCP en `MAY` après stabilisation.

**Pourquoi** :

- 80 % des intégrations ont besoin de lire, pas d'écrire.
- Une API d'écriture ouvre des risques de concurrence et de réconciliation.
- REST/OpenAPI est le plus simple à documenter et à consommer.

**Alternatives rejetées** :

- GraphQL : surdimensionné pour le besoin.
- API write-first : risque de double réservation.

## D9 — i18n : six langues publiques

**Décision** : fr, en, es, it, de, nl. Les cinq langues existantes sont
réutilisées ; le nl s'ajoute. pt et ru plus tard.

**Pourquoi** : couverture des marchés source réalistes (Benelux, Allemagne,
UK, Espagne, Italie) sans coût de traduction excessif.

## D10 — Données : migrations additives, pas de big-bang

**Décision** : réutiliser `canaux`, `demandes_sync`, `reservations`,
`paiements`, `cautions`, `factures`, `parametres_site`, `messages_voyageur`,
`tarifs`, `restrictions_sejour`, `webhooks`. Ajouter des tables par domaine,
en expand/contract, avec RLS et `withTenant()`.

**Pourquoi** : 73 tables existantes, des données réelles, une constitution qui
interdit les migrations destructrices.

## Questions ouvertes

| # | question | décision attendue | échéance |
| --- | --- | --- | --- |
| Q1 | Beds24 ou Channex au pilote ? | benchmark sandbox | L0 |
| Q2 | Le tenant encaisse-t-il ou LCD via Connect ? | avis juridique/comptable | L0 |
| Q3 | PriceLabs ou Beyond ? | test API + coût | L0 |
| Q4 | WhatsApp dès le pilote ? | volume + coût | L3 |
| Q5 | Google VR accessible via le fournisseur ? | test sandbox | L1 |
| Q6 | Duve/Touch Stay nécessaire ? | demande client | L6 |
| Q7 | MCP utile avant 20 clients ? | usage réel | L6 |

## Sources

- `docs/analyses/LODGIFY-VS-LCD-2026-11.md`
- `replica/recon.md`
- `replica/features.csv`
- `v2/CHANNEL-MANAGER.md`
- `v2/MATRICE-MUST-HAVE-CHANNEL-MANAGER.md`
- `v2/FOURNISSEURS-CHANNEL-MANAGER.md`
- `docs/registres/teardowns-rea.md` (R-09)
