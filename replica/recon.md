# Recon map : Lodgify (web + apps natives)

Scope : la boucle « channel manager + PMS + site de réservation directe » pour un hôte ou une conciergerie de 1 à 50 logements.
For : décider ce que LCD V2 doit combler, ce qu'elle doit partenariser, et ce qu'elle ne doit pas copier.
Date : 2026-11-06.
Méthode : Replica (recon public) + discipline REA (comportement observé, preuves, limites). Aucun compte Lodgify utilisé, aucun code source lu, aucun endpoint privé appelé.

## Sources

| # | source | URL | notes |
| --- | --- | --- | --- |
| 1 | Site marketing FR | https://www.lodgify.com/fr/ | positionnement, fonctionnalités, preuves sociales (4,8/5, +5 000 avis) |
| 2 | Tarifs | https://www.lodgify.com/fr/tarifs/ | 4 plans, 0 % commission, 1 % de frais de paiement en ligne, essai 7 j |
| 3 | Centre d'aide (Zendesk, 334 articles FR) | https://help.lodgify.com/hc/fr | inventaire réel des écrans et réglages ; API publique Zendesk |
| 4 | Documentation API v1/v2 | https://docs.lodgify.com/ | endpoints, webhooks, rate limits, MCP beta |
| 5 | Pages produit | /fr/channel-manager-location-saisonniere/, /fr/generateur-sites-web-location-saisonniere/, /fr/boite-reception-unifiee/, /fr/application-mobile/, /fr/dynamic-pricing/, /fr/comptabilite/, /fr/proprietaires/, /fr/proteger-locations/, /fr/smart-locks/ | détail des modules |
| 6 | Intégrations | https://www.lodgify.com/fr/integrations/ | 25+ partenaires : Nuki, Yale, Vikey, Minut, Turno, PriceLabs, Beyond, Chekin, Duve, Safely, Zapier… |
| 7 | Comparatifs éditeur | /fr/comparaisons/lodgify-vs-guesty/, -smoobu, -beds24, -hostaway… | positionnement concurrentiel revendiqué (à lire comme du marketing) |
| 8 | Avis publics | Trustpilot / Google via pages Lodgify | signaux de satisfaction et de friction, non vérifiés indépendamment |

Ce que je n'ai pas pu observer : l'application connectée (pas de compte), les prix réels négociés, les SLA, le comportement exact des webhooks OTA, la qualité du support, les coûts de sortie. Ces points restent des **limites** explicites, pas des suppositions.

## Core loop

L'hôte connecte ses annonces OTA, laisse Lodgify synchroniser calendrier/prix/réservations, encaisse ses réservations directes sur son propre site, et répond aux voyageurs depuis une inbox unique — le tout dans un abonnement sans commission.

## Screens

Écrans inférés des pages publiques et du centre d'aide. Les identifiants sont stables et servent de référence au plan.

| ID | screen | route / comment y accéder | purpose | key components | states seen |
| --- | --- | --- | --- | --- | --- |
| S01 | Tableau de bord / Agenda | Accueil après login | Voir arrivées, départs, tâches, messages du jour | cartes KPI, agenda, notifications | vide, rempli, erreur |
| S02 | Calendrier unifié | Menu Calendrier | Disponibilités, prix, blocs, réservations multi-canaux | grille mensuelle, cellules prix, drawer réservation, filtres logement/canal | vide, chargé, conflit |
| S03 | Liste des réservations | Menu Réservations | Chercher, filtrer, ouvrir une réservation | table, filtres statut/canal/date, recherche | vide, paginé, erreur |
| S04 | Détail réservation / devis | Clic sur une réservation | Modifier, envoyer un devis, encaisser, messagerie | timeline, quote, paiements, messages, check-in/out | demande, devis, confirmée, annulée, archivée |
| S05 | Liste des hébergements | Menu Hébergements | Créer, dupliquer, archiver, publier | cartes/table, statut, photos | vide, brouillon, publié |
| S06 | Fiche hébergement | Clic sur un hébergement | Équipements, localisation, photos, unités, politiques | onglets, uploader, éditeur de contenu | incomplet, complet, publié |
| S07 | Calendrier des tarifs | Hébergement → Tarifs | Prix par nuit, saisons, promotions, restrictions | grille prix, éditeur de plage, règles | défaut, saison, promo |
| S08 | Plans tarifaires | Hébergement → Tarifs → Plans | Plusieurs plans, ajustements, héritage | table de plans, formule, priorité | actif, inactif |
| S09 | Promotions et extras | Menu Tarifs / Extras | Early bird, last minute, codes, services | formulaires, règles de date, codes | brouillon, actif, expiré |
| S10 | Connexions canaux | Menu Canaux | Connecter Airbnb, Booking, Vrbo, Expedia | cartes de connexion, statut, bouton connecter | non connecté, connecté, erreur, beta |
| S11 | Mapping canal | Après connexion | Associer logement/annonce/room type | table de mapping, import d'annonce | partiel, complet |
| S12 | Créateur de site | Menu Site web | Templates, pages, design, domaine, SEO, langues | éditeur par blocs, aperçu, publish | brouillon, publié, hors ligne |
| S13 | Moteur de réservation (public) | Site du client | Rechercher, voir dispo, réserver, payer | search bar, calendrier, quote, checkout | dispo, indispo, erreur paiement |
| S14 | Widget de réservation | Site externe | Intégrer le moteur sur WordPress/Wix | snippet, aperçu, réglages | actif, inactif |
| S15 | Boîte de réception | Menu Messagerie | Tous les messages OTA + email + WhatsApp | liste fils, fil, badges, filtres, pièces jointes | non lu, lu, assigné, fermé |
| S16 | Messages automatisés | Messagerie → Automatisations | Scénarios avant/pendant/après séjour | éditeur de triggers, variables, langues | actif, en pause, erreur |
| S17 | Assistant IA / AI Co-Host | Messagerie / menu IA | Suggerer des réponses, exécuter des actions | chat, suggestions, validation | beta, disponible |
| S18 | App / guide voyageur | Lien ou app Guest | Arrivée, Wi-Fi, règles, recommandations | guide, sections, accès | avant séjour, pendant, après |
| S19 | Enregistrement invités | Réservation / menu Conformité | Formulaire, contrat, transmission autorités | formulaire, signature, statut | à faire, envoyé, validé |
| S20 | Paiements | Menu Paiements / réservation | Encaisser, échéancier, caution, rembourser | cartes, échéancier, statut, litiges | en attente, payé, échoué, remboursé |
| S21 | Relevés propriétaires | Menu Comptabilité | Revenus, dépenses, commissions, envoi | table, filtres, export, récurrence | brouillon, envoyé |
| S22 | Rapports et analyses | Menu Rapports | Occupation, ADR, canaux, revenus | KPI, graphiques, filtres, export | vide, rempli |
| S23 | Tâches / PM | Menu Tâches | Ménage, maintenance, inspections | board, assignation, photos, checklist | à faire, en cours, fait, validé |
| S24 | Serrures connectées | Menu Serrures | Codes temporaires, accès, historique | liste serrures, codes, planning | actif, expiré, erreur |
| S25 | Utilisateurs et permissions | Menu Paramètres | Équipe, rôles, co-hôtes, propriétaires | table, rôles, invitations | actif, invité, révoqué |
| S26 | Applications mobiles | App Store / Google Play | Host, PM, Guest | apps natives | hors ligne, notifications |
| S27 | Marketplace | Menu Intégrations | Connecter 25+ outils | catalogue, filtres, fiches | disponible, beta |
| S28 | API / MCP | docs.lodgify.com | Intégrer ses propres outils / IA | clés, endpoints, webhooks, MCP | beta |

## Flows

```
F01 Connecter Airbnb et importer une annonce
    S10 -> S11 -> S06 -> S02
    happy path clicks: ~6
    edge: annonce non éligible, room type multiple, photos manquantes, conflit de calendrier

F02 Recevoir une réservation Booking.com
    S02 (bloc) -> S03 -> S04 -> S15 (message) -> S23 (ménage)
    happy path clicks: 2 pour voir, 0 pour la synchro
    edge: annulation, modification de dates, webhook hors ordre, doublon

F03 Vendre en direct avec paiement
    S13 -> S04 (quote) -> S20 (paiement) -> S15 (confirmation)
    happy path clicks: ~5
    edge: paiement échoué, 3DS2, promo expirée, dispo prise pendant le checkout

F04 Créer son site et le publier
    S12 (template) -> S12 (pages) -> S12 (domaine) -> S12 (SEO) -> publish
    happy path clicks: ~10
    edge: DNS non propagé, domaine déjà pris, langue non traduite

F05 Piloter les prix
    S07 (saisie) -> S08 (plan) -> S09 (promo) -> S02 (vérif) -> push OTA
    happy path clicks: ~8
    edge: min stay, stop-sell, prix OTA majoré, dynamic pricing qui écrase la saisie

F06 Automatiser les messages
    S16 (trigger) -> S16 (template) -> S16 (langue) -> test -> actif
    happy path clicks: ~7
    edge: canal qui refuse l'envoi, variable manquante, message après annulation

F07 Arrivée voyageur
    S19 (enregistrement) -> S18 (guide) -> S24 (code) -> S01 (suivi)
    happy path clicks: 0 côté hôte si tout est automatique
    edge: formulaire non rempli, code non synchronisé, serrure hors ligne

F08 Relevé propriétaire
    S21 (période) -> S21 (filtre) -> S21 (export/envoi) -> récurrence
    happy path clicks: ~5
    edge: dépense non affectée, commission, litige, remboursement

F09 Ménage après départ
    S01/S02 (départ) -> S23 (tâche auto) -> S23 (photos) -> S23 (validation)
    happy path clicks: ~3
    edge: prestataire indisponible, photo manquante, inspection refusée

F10 Migrer depuis un autre outil
    S05 (import) -> S10 (canaux) -> S12 (site) -> S20 (paiements) -> S25 (équipe)
    happy path clicks: ~15
    edge: doublons, historique, documents, abonnements en cours
```

## Components

| component | variants | states | used on |
| --- | --- | --- | --- |
| Calendrier mensuel | multi-logements, mono-logement, tarifs, disponibilités | vide, chargé, conflit, hors ligne | S01, S02, S07 |
| Cellule de prix | prix fixe, plage, promo, restriction | normal, modifié, verrouillé, erreur | S02, S07 |
| Drawer réservation | création, édition, devis, annulation | demande, devis, confirmée, annulée | S02, S03, S04 |
| Table de réservations | filtres, tri, pagination, export | vide, rempli, chargement, erreur | S03 |
| Éditeur de messages | template, trigger, langue, variables | brouillon, actif, pause, erreur | S15, S16 |
| Fil de messagerie | OTA, email, WhatsApp, interne | non lu, lu, assigné, fermé | S15 |
| Éditeur de site | blocs, pages, thème, aperçu | brouillon, publié, hors ligne | S12 |
| Tunnel de réservation | recherche, dispo, quote, checkout | dispo, indispo, paiement en cours, échec | S13 |
| Échéancier de paiement | acompte, solde, caution, remboursement | en attente, payé, échoué, remboursé | S20 |
| Table de relevé | revenus, dépenses, commissions | brouillon, envoyé, payé | S21 |
| Board de tâches | ménage, maintenance, inspection | à faire, en cours, fait, validé | S23 |
| Catalogue d'intégrations | canal, outil pro, beta | disponible, connecté, erreur | S27 |
| Assistant IA | suggestion, action, explication | disponible, beta, erreur | S17 |

## Inferred data model

```
Account        id, name, plan, billing_cycle, currency, locale
               evidence: S25, tarifs, aide "Compte"
               confidence: high

User           id, account_id, email, role, permissions, co_host_of
               evidence: S25, aide "Gérer vos comptes utilisateurs"
               confidence: high

Property       id, account_id, name, address, type, amenities, photos, status
               evidence: S05, S06
               confidence: high

RoomType       id, property_id, name, capacity, units
               evidence: aide "types de chambre et unités", S06
               confidence: high

RatePlan       id, property_id, name, adjustment, priority, rules
               evidence: S08
               confidence: high

Rate           property_id, room_type_id, date, price, min_stay, max_stay, cta, ctd, stop_sell
               evidence: S07, API rates
               confidence: high

Availability   property_id, room_type_id, date, units_available
               evidence: API availability, S02
               confidence: high

Booking        id, property_id, room_type_id, channel, status, check_in, check_out,
               guest_id, amount, currency, external_id
               evidence: S03, S04, API reservations
               confidence: high

Enquiry        id, property_id, guest_id, message, status, source
               evidence: aide "enquiries", API
               confidence: high

Quote          id, booking_id, lines, total, deposit, balance_due, status
               evidence: S04, API quote
               confidence: high

Payment        id, booking_id, amount, method, status, due_date, transaction_id
               evidence: S20, aide "calendrier de paiement"
               confidence: high

Guest          id, name, email, phone, language, registration_status
               evidence: S19, S18
               confidence: high

MessageThread  id, booking_id, channel, participants, unread, assigned_to
               evidence: S15, API messaging
               confidence: high

Message        id, thread_id, author, body, attachments, sent_at, read_at
               evidence: S15
               confidence: high

Task           id, property_id, booking_id, type, assignee, due_date, status, photos
               evidence: S23, aide PM Modules
               confidence: high

Owner          id, account_id, name, properties, payout_rules
               evidence: S21
               confidence: high

OwnerStatement id, owner_id, period, revenue, expenses, commission, status
               evidence: S21
               confidence: high

ChannelConnection id, account_id, channel, status, credentials_ref
               evidence: S10, S11
               confidence: high

Website        id, account_id, domain, template, languages, published_version
               evidence: S12
               confidence: high

Promotion      id, property_id, type, code, dates, discount
               evidence: S09
               confidence: high

Lock           id, property_id, provider, device_id, codes
               evidence: S24
               confidence: medium (intégrations tierces)

Webhook        id, account_id, url, events, secret, deliveries
               evidence: API webhooks
               confidence: high
```

Relationships : Account 1-n User, Account 1-n Property, Property 1-n RoomType, Property 1-n RatePlan, Property 1-n Booking, Booking 1-n Payment, Booking 1-n MessageThread, Booking 1-n Task, Owner 1-n Property, Owner 1-n OwnerStatement, Account 1-n ChannelConnection, Account 1-n Website.

## Feature matrix

Voir `replica/features.csv` : 123 lignes, 40 must, 54 should, 21 could, 8 skip.
Répartition LCD : 54 fonctionnalités déjà couvertes, 39 partielles, 30 absentes.

Les 10 écarts qui comptent commercialement :

1. API OTA native temps réel (Airbnb, Booking, Vrbo) — Lodgify oui, LCD via fournisseur.
2. Boîte de réception OTA unifiée — Lodgify oui, LCD non.
3. Site de réservation no-code multi-pages + domaine + 32 langues — Lodgify oui, LCD vitrine unique.
4. Paiement en ligne à la réservation + échéancier + caution — Lodgify oui, LCD partiel.
5. Dynamic pricing marché — Lodgify oui (Beyond), LCD non.
6. Google Vacation Rentals — Lodgify oui, LCD non.
7. Applications natives hôte/PM/voyageur — Lodgify oui, LCD PWA.
8. Marketplace 25+ intégrations — Lodgify oui, LCD partenariats ciblés.
9. API publique + MCP — Lodgify oui/beta, LCD non.
10. Support/académie/onboarding self-service — Lodgify oui, LCD opérateur.

À l'inverse, LCD avance sur : Factur-X, fiche de police, taxe de séjour, rapprochement bancaire, EDL, sinistres, stocks, entretien, dispatch prestataires, RLS, auto-hébergement, PWA offline, multi-entités, mandats.

## Out of scope (cannot or should not be cloned)

- **La certification OTA** : Lodgify est Connectivity Provider officiel Airbnb/Booking/Vrbo/Expedia. On ne copie pas un contrat ; on passe par Beds24/Channex ou on signe un partenariat.
- **Le réseau et les 180 pays** : Lodgify a 12 ans d'ancienneté, 5 000 avis, une équipe support multilingue. Ce n'est pas une feature.
- **Le site builder complet** : un Wix verticalisé n'est pas le métier de LCD. Partenariat (Squarespace/WordPress + widget) ou mini-builder suffisant.
- **Les apps natives** : la PWA est un avantage de coût et de vitesse ; les stores ajoutent maintenance, review, policies.
- **Le financement (Lodgify Capital)** et l'assurance embarquée : produits régulés, à partenariser.
- **La marketplace** : 25 intégrations = 25 contrats, 25 maintenances. LCD doit choisir 5 partenaires, pas 25.
- **Le contenu et la marque Lodgify** : textes, templates, visuels, logo. Clean-room strict.

## Size

Écrans inférés : 28. Flows : 10. Entités : 19. Morceaux durs : synchronisation OTA temps réel, inbox multi-canal, paiement à la réservation, dynamic pricing, builder de site, apps natives.

Taille du clone complet : **XL** (une équipe, un an, des contrats OTA).
Taille du slice utile à LCD : **L** (3 à 6 mois à temps partiel, avec partenaires), découpé en 6 lots dans le plan.
