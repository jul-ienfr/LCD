# Lodgify vs LCD V2 — analyse d'écart détaillée

**Date** : 2026-11-06
**Périmètre** : Lodgify (web + apps natives) vs LCD V2 (SvelteKit, Postgres, self-hosted)
**Méthode** : Replica recon (`replica/recon.md`, `replica/features.csv`) + discipline REA (sources publiques, comportement observé, limites explicites)
**Statut** : analyse, pas encore de code. Le plan d'exécution est dans `Plan Comblement Ecarts Lodgify - LCD v1.md`.

---

## 0. Résumé exécutif

Lodgify et LCD ne vendent pas la même chose.

- **Lodgify vend un abonnement logiciel** à des hôtes et gestionnaires (1 à 50+ logements), dans 180 pays : channel manager certifié, site de réservation no-code, inbox OTA, paiements, pricing dynamique, apps natives. 0 % de commission, 1 % de frais sur les paiements en ligne, à partir de 12 €/mois, essai 7 jours. 4,8/5 sur +5 000 avis.
- **LCD vend une conciergerie outillée** en France : FULL (25 % du brut HT + ménage, plancher 149 €/mois), PILOTAGE (149 €/logement/mois), KIT (890 € + 240 €/an). Le logiciel est le poste de pilotage d'une opération réelle : ménage, EDL, police, factures, propriétaires, sinistres, stocks.

Conséquence : **cloner Lodgify serait une erreur stratégique**. Il faut combler les 5 écarts qui empêchent de vendre à une conciergerie (distribution temps réel, site direct qui convertit, messagerie unifiée, paiement à la réservation, revenue management), et **assumer les 7 différences qui sont des avantages LCD** (conformité FR, ops terrain, RLS, auto-hébergement, PWA, multi-entités, mandats).

Les 10 constats qui structurent le plan :

1. **La distribution est le vrai écart** : Lodgify est connectivité officielle Airbnb/Booking/Vrbo/Expedia ; LCD est en iCal ou passe par Beds24/Channex/Smoobu. Sans temps réel, pas de conciergerie sérieuse au-delà de 10 lots.
2. **L'inbox OTA manque** : Lodgify centralise Airbnb + Booking + Vrbo + email + WhatsApp ; LCD a email/SMS et des fils internes. C'est le premier coût caché d'une conciergerie.
3. **Le site direct est un tunnel de vente, pas une vitrine** : Lodgify a templates, pages, blog, domaine, 32 langues, widget, Google Vacation Rentals. LCD a une vitrine unique, 5 langues, pas de domaine par tenant.
4. **Le paiement à la réservation manque** : Lodgify encaisse carte/PayPal, gère acompte/solde, caution pré-autorisée, 3DS2. LCD encaisse des factures via Stripe Checkout, pas la réservation.
5. **Le pricing dynamique est un produit, pas un réglage** : Lodgify s'appuie sur Beyond (données marché, quotidien, 18 mois, explicable). LCD a 3 stratégies ±8/0/+10 %. Il faut intégrer, pas construire.
6. **Les apps natives ne sont pas un avantage décisif** : la PWA LCD est plus rapide, moins chère, offline. Ne pas construire d'apps iOS/Android.
7. **La profondeur ops est l'arme de LCD** : EDL, sinistres, stocks, entretien, dispatch, objets trouvés, formation, tranquillité. Lodgify n'a pas ça.
8. **La conformité FR est l'arme de LCD** : Factur-X, fiche de police, taxe de séjour, rapprochement bancaire, multi-entités, mandats. Lodgify est international, pas français.
9. **La plateforme est un écart de maturité** : Lodgify a API v1/v2, webhooks, 25+ intégrations, MCP beta. LCD a des webhooks et une API interne, pas de programme développeur.
10. **Le modèle économique protège LCD** : Lodgify doit acquérir des milliers de comptes self-service ; LCD doit servir 20-50 conciergeries avec un produit profond. Ce n'est pas le même funnel, ni le même support.

**Recommandation** : un plan en 8 lots (L0 de décisions + 7 lots de réalisation) sur ~22 semaines à temps partiel, dont 4 lots « parity » (distribution, site/paiement, messagerie, pricing) et 3 lots « moat/scale » (reporting, API/intégrations, onboarding). Budget partenaire : ~50-150 €/mois au démarrage, pas 0 € absolu — le « 0 € strict » reste la règle pour l'infrastructure, pas pour un fournisseur de distribution dont dépend le revenu.

---

## 1. Méthode, preuves et limites

### 1.1 Ce qui a été observé

- 44 pages marketing FR téléchargées et extraites (fonctionnalités, tarifs, channel manager, site, inbox, mobile, pricing, compta, propriétaires, protection, MCP, intégrations).
- 334 articles du centre d'aide FR listés via l'API publique Zendesk (titres et structure ; pas de contournement d'auth).
- Documentation API v1/v2 via `docs.lodgify.com/llms.txt` (endpoints, webhooks, rate limits, MCP beta).
- 25+ intégrations listées sur la page publique.
- Aucun compte Lodgify, aucun essai, aucun code source, aucune API privée, aucun scraping OTA.

### 1.2 Ce que je n'ai pas observé (limites)

- L'UI connectée réelle, les états vides, les erreurs, les permissions fines.
- Les prix négociés, les remises annuelles, les coûts de sortie.
- Les SLA réels, la qualité du support, le délai de réponse.
- Le comportement exact des webhooks OTA et la latence de propagation.
- La qualité du dynamic pricing (les 40 % de revenus en plus sont une revendication Beyond, pas une preuve).
- Les contrats OTA (Connectivity Provider) et les conditions de revente.

Toute affirmation ci-dessous est donc soit **observée** (page publique, doc, article d'aide), soit **inférée** (marquée comme telle). Les zones grises sont dans `replica/recon.md` §Sources.

### 1.3 Statuts utilisés

| statut | sens |
| --- | --- |
| **Oui** | fonctionnalité documentée et utilisable chez Lodgify |
| **Partiel** | existe mais incomplet, dépend d'un canal, ou en beta |
| **Non** | absent ou hors périmètre |
| **Avance LCD** | LCD fait mieux ou plus profond |
| **Parité** | fonctionnalité équivalente |

---

## 2. Lodgify en 12 points

| # | point | fait observé |
| --- | --- | --- |
| 1 | Modèle | Abonnement SaaS, 0 % de commission, 1 % de frais sur paiements en ligne, essai 7 jours sans carte |
| 2 | Plans | Basic (1 logement), Starter (≤2), Professional, Ultimate ; Dynamic Pricing inclus Pro/Ultimate |
| 3 | Prix | 12 €/mois (Basic, 1 bien, facturé 2 ans) à ~53 €/mois (Ultimate, même base) ; mensuel plus cher |
| 4 | Distribution | API officielle Airbnb, Booking.com, Vrbo/Abritel, Expedia ; iCal pour le reste ; Google Vacation Rentals |
| 5 | Site | Builder no-code, templates, pages illimitées, blog, domaine, SEO, 32 langues, widget externe, white-label |
| 6 | Messagerie | Inbox unifiée Airbnb/Booking/Vrbo + email + WhatsApp, réponses rapides, automatisations, assistant IA |
| 7 | Paiements | Stripe, PayPal, Payyo ; acompte/solde, caution, pré-autorisation, 3DS2, factures, remboursements |
| 8 | Pricing | Dynamic Pricing propulsé par Beyond, quotidien, jusqu'à 18 mois, explication du prix |
| 9 | Ops | Tâches, ménage, inspections, PM Modules, serrures connectées, guide voyageur, enregistrement |
| 10 | Finance | Relevés propriétaires, dépenses, commissions, récurrence, rôles propriétaires, Lodgify Capital |
| 11 | Plateforme | API v1/v2, webhooks, 25+ intégrations, MCP beta, Zapier, apps Host/PM/Guest |
| 12 | Preuve | 180 pays, 4,8/5, +5 000 avis, 12 ans d'existence |

---

## 3. LCD V2 en 12 points

| # | point | fait vérifié dans le repo |
| --- | --- | --- |
| 1 | Modèle | Conciergerie opérée : FULL 25 % brut HT, PILOTAGE 149 €/logement/mois, KIT 890 € + 240 €/an |
| 2 | Stack | SvelteKit 3, Svelte 5, Tailwind 4, Postgres, Drizzle, Better Auth, adapter-node |
| 3 | Socle | 73 tables, RLS tenant, `withTenant()`, migrations immuables, 83 pages et 40 endpoints |
| 4 | Distribution | iCal import/export + 5 fournisseurs API (Beds24, Channex, Smoobu, Host Port, Nobeds) |
| 5 | Site | Vitrine unique, 6 thèmes, 5 langues (fr/en/it/es/de), moteur de réservation directe |
| 6 | Messagerie | Messages voyageur email/SMS Brevo, phrases types, assistant IA, fils internes |
| 7 | Paiements | Stripe Checkout sur facture, webhook, litiges ; cautions suivies, pas pré-autorisées |
| 8 | Pricing | Tarifs par date/plage, plans tarifaires, restrictions, 3 stratégies ±8/0/+10 % |
| 9 | Ops | Ménage, EDL, incidents, sinistres, stocks, entretien, dispatch, prestataires, objets trouvés |
| 10 | Finance | Factur-X, compta, TVA, taxe de séjour, rapprochement bancaire, relevés propriétaires |
| 11 | Plateforme | Webhooks sortants, API interne, PWA offline, multi-tenant, auto-hébergé |
| 12 | Conformité | Fiche de police, RGPD, contrats, questionnaires, multi-entités, mandats |

---

## 4. Les 12 écarts structurants

### 4.1 Modèle économique et cible

| | Lodgify | LCD |
| --- | --- | --- |
| Cible | Hôte individuel, gestionnaire, conciergerie 1-50 lots | Conciergerie FR, propriétaire délégant, 1-50 lots |
| Revenu | Abonnement + 1 % paiement | 25 % FULL, 149 €/mois PILOTAGE, KIT |
| Acquisition | Self-service, essai, onboarding, académie | Terrain, mandat, bouche-à-oreille |
| Support | Chat/téléphone/email, académie | Opérateur, runbooks |

**Impact** : Lodgify optimise le volume de comptes ; LCD optimise la marge par lot et la rétention. Les features qui font gagner un compte self-service (site builder, 32 langues, apps) ne sont pas celles qui font gagner un mandat de conciergerie (ops, conformité, marge, propriétaires).

**Décision** : assumer. Ne pas construire un funnel self-service avant 20 clients.

### 4.2 Distribution : connectivité certifiée vs iCal + fournisseurs

**Lodgify** : API officielle Airbnb, Booking.com, Vrbo/Abritel, Expedia. Synchronisation bidirectionnelle en temps réel : disponibilités, tarifs, réservations, restrictions. Google Vacation Rentals. iCal pour les niches.

**LCD** : iCal import/export (ETag, SHA-256, buffer, anti-écho, santé) + cinq fournisseurs API optionnels. Pas d'écriture native OTA. Le registre est déjà tranché : Beds24 pour 1-29 lots, Channex au-delà, Smoobu partiel, Host Port lecture seule, Nobeds à auditer.

**Impact** : c'est l'écart n°1. Sans temps réel :
- risque de surbooking résiduel (iCal 1-3 h) ;
- pas de push tarifs/restrictions sans fournisseur ;
- pas de messages OTA (le fournisseur ne les expose pas toujours) ;
- la conciergerie garde un pied dans chaque extranet.

**Décision** : **partenariat obligatoire**, pas de développement natif. Choisir un fournisseur pilote (Beds24 ou Channex) et durcir l'adapter existant. Budget 17-130 €/mois selon parc. C'est le seul endroit où le « 0 € strict » doit être discuté : un fournisseur de distribution est un coût variable légitime, refacturable au client.

### 4.3 Site de réservation : builder vs vitrine

**Lodgify** : builder no-code, templates, pages illimitées, blog, domaine personnalisé, SEO, 32 langues, widget pour site externe, white-label, Google Vacation Rentals.

**LCD** : une vitrine unique (`/`), un thème global publié par le super-admin, 6 thèmes, 5 langues, un moteur de réservation HTML-first (`/reserver`). Pas de pages libres, pas de blog, pas de domaine par tenant, pas de widget.

**Impact** : la réservation directe est le levier de marge (0 % commission). Sans site crédible et sans paiement en ligne, le direct reste marginal. Mais construire un Wix verticalisé est un piège : 6-12 mois, maintenance infinie, aucun différenciateur.

**Décision** : **mini-builder, pas Wix**. Trois briques suffisent : pages éditoriales (accueil, logement, région, contact), domaine par tenant, widget intégrable. Le reste (blog, 32 langues) est « could ».

### 4.4 Messagerie : inbox OTA vs email/SMS

**Lodgify** : inbox unifiée par réservation, Airbnb + Booking + Vrbo + email + WhatsApp, réponses rapides, automatisations par étape, assistant IA, pièces jointes, multi-utilisateurs, SMS (Ultimate).

**LCD** : messages voyageur email/SMS Brevo, phrases types, assistant IA (`/hote/assistant`), fils internes, notifications. Pas de fil OTA, pas de WhatsApp, pas de scénarios.

**Impact** : une conciergerie passe 30-50 % de son temps dans les messages. Sans inbox, elle paie quelqu'un pour copier-coller entre extranets. C'est un argument de vente direct.

**Décision** : **combler par étapes** : (1) fil unifié email + SMS + messages fournisseur si disponible ; (2) automatisations par étape ; (3) WhatsApp Business API ; (4) IA en brouillon 1-tap, jamais d'envoi auto (règle §S5).

### 4.5 Paiements : encaissement à la réservation vs suivi/facture

**Lodgify** : Stripe/PayPal/Payyo, paiement à la réservation, acompte/solde, caution pré-autorisée, 3DS2, remboursements, litiges, factures.

**LCD** : Stripe Checkout sur facture (`/facture/[token]`), webhook, preuves de litige. Les cautions sont suivies, pas bloquées. Pas de PayPal, pas d'échéancier contractuel, pas de pré-autorisation.

**Impact** : sans paiement à la réservation, la conversion directe s'effondre et le risque d'impayé augmente. La caution pré-autorisée est un attendu des conciergeries.

**Décision** : **combler** : Stripe Checkout à la réservation, échéancier (acompte J0, solde J-30), caution via PaymentIntent manual capture ou partenaire (Swikly). Vérifier le cadre réglementaire : LCD ne doit pas devenir prestataire de services de paiement ; Stripe Connect ou compte marchand du tenant.

### 4.6 Revenue management : Beyond vs stratégies manuelles

**Lodgify** : Dynamic Pricing by Beyond, quotidien, 18 mois, facteurs marché/events/week-end/demande, prix minimum, explication du changement, inclus Pro/Ultimate.

**LCD** : tarifs par date/plage, plans, restrictions, 3 stratégies (remplissage -8 %, équilibre 0, revenu +10 %), pas de données marché, pas de recalcul quotidien.

**Impact** : sur 20 lots, 5-10 % de RevPAR = plusieurs milliers d'euros par an. C'est un argument de vente, pas un confort.

**Décision** : **intégrer** Beyond ou PriceLabs via API, ne pas construire l'algo. Écran « pourquoi ce prix » (décomposition pivot × coefficients) pour garder le contrôle humain. Le `pricing-engine` existant peut rester le fallback gratuit.

### 4.7 Expérience voyageur : apps natives vs PWA

**Lodgify** : apps Host, PM, Guest ; guide numérique, check-in, Wi-Fi, règles, recommandations ; notifications.

**LCD** : PWA voyageur (`/voyageur`) avec séjour, préférences, extras, incidents, EDL, avis, tourisme, fiche police ; PWA staff ; offline/outbox.

**Impact** : la PWA couvre 90 % du besoin, sans review Apple/Google, sans double maintenance, avec un budget JS maîtrisé. Les apps natives sont un signe de maturité, pas un différenciateur pour une conciergerie FR.

**Décision** : **assumer la PWA**, améliorer le guide (contenu riche, photos, recommandations, check-in) et les notifications. Ne pas construire d'apps natives.

### 4.8 Opérations : tâches vs profondeur conciergerie

**Lodgify** : tâches, ménage, inspections, PM Modules, photos, Slack, Turno, serrures.

**LCD** : ménage, tâches, EDL avec lignes et photos, incidents, sinistres, tranquillité, stocks/consommables, entretien, dispatch prestataires, espace prestataire, objets trouvés, inventaire, formation.

**Impact** : c'est le moat. Lodgify ne sait pas faire un EDL français, un sinistre avec preuves, un stock de consommables, un dispatch multi-prestataires. Une conciergerie FR choisira LCD pour ça, pas pour les templates de site.

**Décision** : **ne pas copier Lodgify sur les ops** ; au contraire, industrialiser (qualité, SLA, photos, preuves) et le mettre en avant.

### 4.9 Conformité : international vs France

**Lodgify** : enregistrement des invités, contrats, taxes, facturation électronique aux autorités (selon pays), RGPD de base.

**LCD** : Factur-X, fiche de police, taxe de séjour, paramètres fiscaux, simulateur micro/réel, rapprochement bancaire, registre RGPD, multi-entités, mandats, contrats, questionnaires.

**Impact** : la conformité FR est un argument de vente et une barrière à l'entrée. Lodgify ne sera jamais aussi précis sur la police, la taxe de séjour ou Factur-X.

**Décision** : **avance LCD**, à documenter et à vendre. Ne pas diluer dans un « international » prématuré.

### 4.10 Propriétaires : relevés vs mandats

**Lodgify** : relevés propriétaires (revenus, dépenses, commissions), envoi récurrent, rôles, paiements.

**LCD** : mandats, propriétaires, relevé mensuel, portail `/proprio`, API relevé, sorties d'argent.

**Impact** : parité sur le cœur, Lodgify est plus « self-service » (récurrence, export), LCD est plus « juridique » (mandat, multi-entités). La récurrence et le PDF soigné manquent côté LCD.

**Décision** : **combler la récurrence et le rendu**, garder l'avance mandats/multi-entités.

### 4.11 Plateforme : API/marketplace vs auto-hébergé/RLS

**Lodgify** : API v1/v2, webhooks, 25+ intégrations, MCP beta, Zapier, apps.

**LCD** : API interne, webhooks sortants, PWA, RLS, auto-hébergé, pas de programme développeur.

**Impact** : Lodgify peut être le hub d'un écosystème ; LCD est un produit vertical. Pour vendre à des conciergeries, il faut au minimum : webhooks, API de lecture, Zapier/Make, et 5 intégrations ciblées (pricing, locks, guide, assurance, compta).

**Décision** : **API publique plus tard**, 5 partenariats maintenant. Le MCP est une opportunité à faible coût après l'API.

### 4.12 Onboarding et support

**Lodgify** : essai 7 jours, onboarding guidé, spécialiste, académie, chat/téléphone.

**LCD** : onboarding interne, runbooks, formation équipe, support opérateur.

**Impact** : Lodgify vend à distance ; LCD vend en face à face. Le self-service n'est pas nécessaire avant d'avoir 20 clients, mais un « onboarding checklist » et une base d'aide sont utiles.

**Décision** : **plus tard**, sauf la check-list d'onboarding déjà présente dans `/hote/onboarding`.

---

## 5. Matrice détaillée par domaine

Légende : **L** = Lodgify, **C** = LCD. Statuts : O = oui, P = partiel, N = non.

### 5.1 Distribution

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| API Airbnb | O | N | Lodgify natif | Partenariat Beds24/Channex |
| API Booking.com | O | N | Lodgify natif | Partenariat |
| API Vrbo/Abritel | O | N | Lodgify natif | Partenariat |
| API Expedia | O | N | Lodgify natif | Via Channex si besoin |
| Google Vacation Rentals | O | N | Lodgify natif | Partenariat / flux |
| iCal | O | O | Parité, LCD plus robuste | Garder |
| Sync dispo temps réel | O | P | Critique | Partenariat |
| Sync tarifs | O | P | Critique | Partenariat |
| Restrictions min/max, CTA/CTD, stop-sell | O | P | Critique | Partenariat |
| Import réservations OTA | O | P | Critique | Partenariat |
| Modifs/annulations | O | P | Critique | Partenariat |
| Webhooks OTA | O | P | Important | Partenariat |
| Anti-surbooking | O | O | Parité | Garder |
| Multi-annonces | O | O | Parité | Garder |
| Multi-unités | O | P | Niche hôtel | Plus tard |
| Buffer ménage | O | O | Parité | Garder |
| Santé des connexions | O | P | Confort | Ajouter |
| Niches FR (Gîtes de France, Clévacances, Leboncoin) | N | P | Avance LCD | Garder |
| Majoration par canal | O | P | Important | Ajouter |
| Frais par canal | O | N | Important | Ajouter |

### 5.2 Site et réservation directe

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| Builder no-code | O | N | Lodgify | Mini-builder |
| Templates | O | P | Lodgify | 3-4 templates |
| Domaine personnalisé | O | P | Lodgify | Ajouter |
| Pages libres / blog | O | N | Lodgify | Pages oui, blog non |
| SEO | O | P | Lodgify | Ajouter |
| 32 langues | O | P (5) | Lodgify | 6-8 langues |
| Widget externe | O | N | Lodgify | Ajouter |
| Moteur direct | O | O | Parité | Garder |
| Paiement à la réservation | O | N | Critique | Ajouter |
| Promotions / codes | O | P | Lodgify | Ajouter |
| Extras | O | O | Parité | Garder |
| Avis sur site | O | O | Parité | Garder |
| Contrats / politiques | O | O | Parité | Garder |
| GA / pixels | O | P | Confort | Plus tard |
| White-label | O | P | Lodgify | Plus tard |

### 5.3 Tarifs et revenue

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| Tarifs saisonniers | O | O | Parité | Garder |
| Tarifs par durée | O | O | Parité | Garder |
| Tarifs par personne | O | P | Lodgify | Ajouter |
| Plans tarifaires | O | O | Parité | Garder |
| Dynamic pricing marché | O | N | Critique | Intégrer Beyond/PriceLabs |
| Prix explicable | O | P | Lodgify | Écran |
| Min/max, CTA/CTD | O | O | Parité | Garder |
| Last minute / early bird | O | P | Lodgify | Ajouter |
| Pick-up / occupation | O | N | Lodgify | Ajouter au reporting |
| Multi-devises | O | N | Lodgify | Plus tard |

### 5.4 Réservations et front office

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| Calendrier unifié | O | O | Parité | Garder |
| Réservation manuelle / devis | O | O | Parité | Garder |
| Enquiry / pipeline | O | P | Lodgify | Ajouter léger |
| Statuts | O | O | Parité | Garder |
| Check-in/out | O | O | Parité | Garder |
| Corbeille | O | P | Lodgify | Plus tard |
| Direct sans compte | O | O | Parité | Garder |
| Tarification nuit/séjour | O | O | Parité | Garder |
| Cautions | O | O | Parité | Renforcer |
| Assurance annulation | O | N | Lodgify | Partenaire |

### 5.5 Messagerie

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| Inbox OTA unifiée | O | N | Critique | Combler |
| Messages Airbnb/Booking/Vrbo | O | N | Critique | Combler |
| Email + WhatsApp | O | P | Lodgify | WhatsApp plus tard |
| Réponses rapides | O | O | Parité | Garder |
| Automatisations par étape | O | P | Critique | Combler |
| Assistant IA | O | P | Lodgify | Renforcer |
| Traduction auto | O | P | Lodgify | Ajouter |
| Pièces jointes | O | P | Lodgify | Ajouter |
| Multi-utilisateurs | O | O | Parité | Garder |
| SMS | O | O | Parité | Garder |
| Centre de notifications | O | P | Lodgify | Ajouter |

### 5.6 Paiements et finance

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| Stripe | O | O | Parité (facture) | Étendre réservation |
| PayPal | O | N | Lodgify | Plus tard |
| Pré-auth caution | O | N | Critique | Ajouter |
| Échéancier | O | P | Critique | Ajouter |
| Factures voyageurs | O | O | Avance LCD (Factur-X) | Garder |
| Relances | O | O | Parité | Garder |
| Rapprochement bancaire | P | O | Avance LCD | Garder |
| Compta / TVA | O | O | Parité | Garder |
| Relevés propriétaires | O | O | Parité | Garder |
| Paiements propriétaires | O | P | Lodgify | Ajouter |
| Litiges / chargeback | O | O | Parité | Garder |
| Financement | O | N | Lodgify | Ne pas faire |
| 3DS2 | O | P | Lodgify | Via Stripe |

### 5.7 Opérations

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| Ménage | O | O | Parité | Garder |
| Inspections / photos | O | O | Parité | Garder |
| EDL | P | O | Avance LCD | Garder |
| Incidents / sinistres | P | O | Avance LCD | Garder |
| Stocks | N | O | Avance LCD | Garder |
| Entretien | N | O | Avance LCD | Garder |
| Dispatch prestataires | P | O | Avance LCD | Garder |
| Objets trouvés | N | O | Avance LCD | Garder |
| Formation | N | O | Avance LCD | Garder |
| Guide / app voyageur | O | P | Lodgify | Renforcer |
| Enregistrement / police | O | O | Parité FR | Garder |
| Serrures | O | P | Lodgify | Partenaire |
| Turno | O | N | Lodgify | Partenaire |

### 5.8 Conformité, reporting, plateforme

| Fonction | L | C | Écart | Décision |
| --- | --- | --- | --- | --- |
| Factur-X | N | O | Avance LCD | Garder |
| Taxe de séjour | P | O | Avance LCD | Garder |
| Fiche de police | P | O | Avance LCD | Garder |
| Contrat | O | O | Parité | Garder |
| RGPD | P | O | Avance LCD | Garder |
| Multi-entités | P | O | Avance LCD | Garder |
| Mandats | P | O | Avance LCD | Garder |
| Dashboard CA | O | O | Parité | Garder |
| Taux d'occupation | O | P | Lodgify | Ajouter |
| ADR / RevPAR | O | N | Lodgify | Ajouter |
| Analyse par canal | O | P | Lodgify | Ajouter |
| Exports | O | O | Parité | Garder |
| Relevés récurrents | O | P | Lodgify | Ajouter |
| API publique | O | N | Lodgify | Plus tard |
| Webhooks | O | O | Parité | Garder |
| MCP | O (beta) | N | Lodgify | Plus tard |
| Zapier | O | N | Lodgify | Webhooks suffisent |
| Marketplace | O | N | Lodgify | 5 partenaires |
| Multi-tenant | O | O | Parité | Garder |
| RLS | P | O | Avance LCD | Garder |
| Auto-hébergé | N | O | Avance LCD | Garder |
| PWA / offline | P | O | Avance LCD | Garder |
| Apps natives | O | N | Lodgify | Ne pas faire |
| i18n 32 | O | P (5) | Lodgify | 8 langues |
| Marque blanche | O | P | Lodgify | Plus tard |
| Onboarding self-service | O | P | Lodgify | Plus tard |
| Académie / support | O | N | Lodgify | Ne pas faire |
| Essai gratuit | O | N | Lodgify | Plus tard |
| Tarif par logement | O | N | Modèle différent | Assumer |

---

## 6. Ce que Lodgify fait mieux (et qu'il faut prendre au sérieux)

1. **La distribution temps réel** : c'est le cœur de son produit, pas un module. Sans ça, LCD reste un PMS + iCal.
2. **L'inbox OTA** : c'est le premier gain de temps perçu par une conciergerie. Un fil par réservation, tous canaux.
3. **Le tunnel direct** : site + paiement + confirmation en quelques minutes. C'est ce qui fait la marge d'une conciergerie.
4. **Le pricing explicable** : Beyond donne un prix et une raison. La confiance se gagne là.
5. **La santé des connexions** : statut par canal, alertes, support. Une conciergerie ne peut pas se permettre un calendrier muet.
6. **Le relevé propriétaire** : propre, récurrent, exportable. C'est un livrable commercial.
7. **L'onboarding** : check-list, spécialiste, académie. Réduit le churn.
8. **L'écosystème** : 25+ intégrations, API, Zapier. Ça évite de tout construire.

## 7. Ce que LCD fait mieux (et qu'il faut vendre)

1. **La conformité française** : Factur-X, fiche de police, taxe de séjour, RGPD, multi-entités, mandats.
2. **Les opérations terrain** : EDL, sinistres, stocks, entretien, dispatch, objets trouvés, formation, tranquillité.
3. **Le rapprochement bancaire** et la comptabilité réelle, pas un export CSV.
4. **La sécurité et la souveraineté** : RLS, auto-hébergement, audit, sauvegardes testées.
5. **La PWA offline** : le staff travaille dans un appartement sans réseau.
6. **Le multi-tenant réel** : un opérateur, plusieurs entités, plusieurs propriétaires.
7. **Le coût** : pas de 1 % sur les paiements, pas d'abonnement par logement.
8. **La proximité** : un opérateur qui connaît le terrain, pas un support tiers.

## 8. Ce qu'il ne faut pas copier (7 pièges)

1. **Les API OTA natives sans contrat** : programme Connectivity Provider fermé, conditions strictes, risque juridique et technique. Passer par un fournisseur certifié.
2. **Le site builder complet** : un Wix verticalisé demande des années. Un mini-builder suffit.
3. **Les apps natives** : doubles équipes, reviews, policies. La PWA est un avantage.
4. **La marketplace 25+** : 25 contrats, 25 maintenances. Cinq partenaires bien choisis valent mieux.
5. **Le self-service avec essai gratuit** : sans support, le churn explose. LCD vend en face à face.
6. **Le financement / l'assurance embarquée** : produits régulés. Partenariat, pas build.
7. **Le copying marketing** : textes, templates, visuels, wording. Clean-room strict (§S10).

## 9. Risques du plan

| Risque | Probabilité | Impact | Mitigation |
| --- | --- | --- | --- |
| Dépendance à un fournisseur (Beds24/Channex) | Haute | Haut | Contrat, plan de sortie, iCal en filet, abstraction `FournisseurCanal` |
| Coût fournisseur qui mange la marge | Moyenne | Haut | Refacturer au client, seuil de bascule, audit trimestriel |
| API OTA qui ferme l'accès messaging | Moyenne | Haut | Ne pas promettre l'inbox OTA avant contrat ; email/SMS en fallback |
| Réglementation paiement (LCD collecte pour autrui) | Moyenne | Très haut | Stripe Connect / compte marchand du tenant, avis juridique |
| Complexité du mini-builder | Haute | Moyen | 3 templates, 4 blocs, pas de blog |
| Dynamic pricing opaque | Moyenne | Moyen | Écran d'explication, override manuel, bornes |
| RGPD / WhatsApp / IA | Moyenne | Haut | DPA, consentement, purge, pas d'envoi auto |
| Dispersion (trop de lots en parallèle) | Haute | Haut | Un lot à la fois, gates, critères d'acceptation |
| Concurrence Lodgify sur le prix | Basse | Moyen | Ne pas se battre sur le prix, se battre sur la profondeur FR |

## 10. Décision recommandée

**Positionnement** : « Le PMS de conciergerie français, pas le clone de Lodgify. »

- Cible : conciergeries FR de 10 à 50 lots, multi-propriétaires, multi-entités.
- Promesse : moins de surbooking, moins de temps dans les extranets, plus de marge directe, conformité FR sans tableur.
- Preuve : distribution temps réel via partenaire, inbox unifiée, site direct qui encaisse, ops terrain, conformité.

**Cinq paris** :

1. **Distribution** : Channex (white-label, 77 OTA) ou Beds24 (coût, 1-29 lots) — décision contractuelle au lot L0.
2. **Direct** : mini-builder + domaine + paiement + Google Vacation Rentals + 8 langues.
3. **Messagerie** : inbox unifiée (fournisseur + email + SMS + WhatsApp), automatisations, IA en brouillon 1-tap.
4. **Revenue** : intégration Beyond/PriceLabs + écran « pourquoi ce prix ».
5. **Moat FR** : Factur-X, police, taxe, EDL, sinistres, stocks, propriétaires, multi-entités.

**Ce que LCD ne fera pas** : apps natives, marketplace 25+, builder complet, financement, assurance embarquée, self-service avant 20 clients.

---

## 11. Annexes

- Recon complet : `replica/recon.md`
- Matrice 123 lignes : `replica/features.csv`
- Plan d'exécution : `Plan Comblement Ecarts Lodgify - LCD v1.md`
- Fiche REA : `docs/registres/teardowns-rea.md` (R-09)
- Sources : voir `replica/recon.md` §Sources.
