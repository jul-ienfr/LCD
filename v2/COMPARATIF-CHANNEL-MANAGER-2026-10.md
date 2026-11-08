# Channel managers : le moins cher et le plus complet — octobre 2026

**Recherche au 25 octobre 2026.** Tarifs publics, hors TVA, susceptibles
d'évoluer. Hypothèse de coût : un logement = un type de logement, trois canaux
(Airbnb, Booking, Abritel/Vrbo).

Voir aussi :

- [MATRICE-MUST-HAVE-CHANNEL-MANAGER.md](./MATRICE-MUST-HAVE-CHANNEL-MANAGER.md)
  — la matrice de décision V2, fonction par fonction ;
- [MARQUE-BLANCHE.md](./MARQUE-BLANCHE.md) — ce que change réellement la marque
  blanche, contrat, support, données et coût ;
- [FOURNISSEURS-CHANNEL-MANAGER.md](./FOURNISSEURS-CHANNEL-MANAGER.md) —
  registre V2, activation super-admin, variables serveur et conseils par parc.

## 0. Registre V2 : les cinq fournisseurs intégrés

La V2 ne parie plus sur un seul connecteur. Elle embarque un registre de cinq
fournisseurs, activables globalement par le super-admin, puis affectés logement
par logement dans `Supervision → Fournisseurs`. Le code de référence est
[`src/domain/fournisseur.ts`](./src/domain/fournisseur.ts) et le registre SQL
`fournisseurs_canaux` (migration `0067`).

| Fournisseur | Mode réel | Rôle dans la V2 | Fourchette conseillée |
|---|---|---|---|
| **Beds24** | Complet : ARI, tarifs, restrictions, réservations, webhooks | **Pilote principal** | **1–29 logements** |
| **Channex** | Complet : ARI, tarifs, restrictions, réservations, webhooks, white-label | **Pilote principal au-delà de 30**, ou dès le premier logement si revente sous marque LCD | **30–99 logements** ; **100+** avec alternative Nobeds |
| **Smoobu** | **Partiel** : tarifs et min stay, réservations et webhooks ; **pas d’écriture de disponibilité ni CTA/CTD** dans l’API publique | Alternative de simplicité, pas un pilote complet | **1–10 logements**, seulement si la V2 n’a pas besoin de pousser les disponibilités |
| **Host Port** | **Lecture seule** : API `bookings`, `calendar`, `reviews`, `earnings` + webhooks signés ; aucune écriture ARI | Import de réservations et tableau de bord ; option autonome pour un très petit parc | **1–2 logements** en autonome ; jamais comme pilote V2 |
| **Nobeds** | **Partiel** : disponibilités, tarifs, réservations ; min stay non poussé sans réécrire dispo/prix ; CTA/CTD et webhooks non documentés dans l’OpenAPI | Alternative de volume, à auditer avant production | **100+ logements**, en second choix derrière Channex |

### 0.1 Conseil par nombre de logements

| Nombre de logements | Choix conseillé | Alternative | Motif |
|---:|---|---|---|
| **1–2** | **Beds24** | **Host Port Pro** en autonome | Beds24 est le pilote complet le moins cher (17,15 €/mois avec 3 canaux). Host Port Pro à 9 €/logement/mois est moins cher en autonome, mais ne reçoit pas d’ARI de la V2. |
| **3–10** | **Beds24** | **Smoobu** | Beds24 reste moins cher et pousse tout l’ARI. Smoobu se justifie uniquement si la simplicité prime et que les disponibilités sont gérées ailleurs. |
| **11–29** | **Beds24** | **Channex** | Beds24 reste devant jusqu’au seuil d’environ 30 logements. Channex devient compétitif à l’approche du seuil, surtout en white-label. |
| **30–99** | **Channex** | **Beds24** | Le fixe de Channex (130 $/mois + 0,50 $/unité) est amorti : moins cher que Beds24, avec white-label et 77 OTA. |
| **100+** | **Channex** | **Nobeds API** | Channex reste la référence. Nobeds à 99 $/mois jusqu’à 1 000 propriétés est à tester, mais son OpenAPI ne documente ni CTA/CTD ni webhooks. |

**Réponse courte pour 1 à 4 logements :** **Beds24**. C’est le seul pilote
complet à ce volume. Host Port Pro à 9 €/logement/mois est moins cher en
autonome, mais il ne reçoit pas d’ARI de la V2 ; Smoobu est une option de
simplicité si les disponibilités sont gérées dans Smoobu.

**Règle de sécurité :** Host Port ne doit jamais être présenté comme un pilote
complet. Smoobu et Nobeds sont marqués « partiels » dans le registre ; la V2
refuse de leur envoyer une opération non couverte plutôt que de simuler un
succès.

## 1. Réponse courte

Il n'y a pas un seul gagnant : cela dépend de ce que « complet » veut dire.

| Priorité | Meilleur choix intégrable V2 | Coût |
|---|---|---|
| Coût le plus bas, channel manager natif complet | **Beds24** | **17,15 €/mois** pour 1 logement + 3 canaux |
| API simple pour un petit parc, avec une couverture partielle | **Smoobu** | **35 €/mois** sans commission (ou 29 € + 0,9 %) |
| Marque blanche et API white-label | **Channex** | **130 $/mois + 0,50 $/unité** ; staging gratuit |
| White-label à volume, orienté éditeur PMS | **Rentals United** | à partir de **330 $/mois** pour 10–50 annonces |

Guesty Lite est moins cher mais **exclu** : aucune API exploitable par la V2.
Même logique pour QloApps, Vik, HotelRunner et Octorate.

**Pour la V2, le pilote complet est Beds24 jusqu’à ~29 logements, puis
Channex.** Beds24 est le moins cher (17,15 €/mois), avec webhooks booking et
inventory, mais une API bridée et un délai de webhook d’environ une minute.
**Smoobu n’est pas un pilote complet** : son API publique ne documente pas
l’écriture des disponibilités ni CTA/CTD. **Host Port est en lecture seule.**
**Nobeds est partiel** et doit être audité. **Pour revendre sous ta marque,
Channex est le moins cher des white-labels.**

## 2. Filtre V2 : intégrable ou non

Puisque la V2 doit piloter le canal, seules les solutions avec une **API
utilisable par la V2** comptent. Les autres sont éliminées, même si elles sont
moins chères.

| Solution | API V2 | Webhooks | White-label | Décision |
|---|---|---|---|---|
| **Smoobu** | Oui, clé API self-service | Oui | Non | **Retenu en partiel** : pas de push disponibilité |
| **Beds24** | Oui, API JSON | Oui (booking + inventory) | Non | **Retenu comme pilote complet** |
| **Channex** | Oui, API white-label | Oui | Oui | **Retenu comme pilote complet** |
| **Host Port** | API de **lecture seule** + webhooks | Oui, signés | Non | **Retenu en lecture seule** |
| **Nobeds** | Oui, OpenAPI | Non documentés | Oui | **Retenu en partiel, à auditer** |
| **Rentals United** | Oui, API B2B | Oui (RLNM/LNM) | Oui | Retenu seulement à volume |
| Guesty Lite | Non | Non | Non | **Exclu** |
| QloApps | Pas d'API channel manager white-label | Non | Non | **Exclu** |
| Vik/e4jConnect | Plugin WordPress, pas API V2 | Non | Non | **Exclu** |
| HotelRunner | API partenaire sur devis | À vérifier | Non | **Exclu du MVP** |
| Octorate | API partenaire sur devis | À vérifier | Non | **Exclu du MVP** |

**Conséquence :** le registre V2 retient **Beds24 et Channex comme pilotes
complets**, **Smoobu et Nobeds comme connecteurs partiels**, et **Host Port
comme source de lecture**. Rentals United reste une option de scale B2B.
Guesty Lite, QloApps, Vik, HotelRunner et Octorate ne sont pas de bonnes
solutions pour la V2, même à prix bas.

## 3. Ce que j'appelle « complet »

Un channel manager complet doit :

- pousser les disponibilités ;
- pousser les tarifs ;
- pousser les restrictions (min/max nuits, arrivée/départ interdits, cut-off,
  stop-sell) ;
- recevoir les réservations, modifications et annulations ;
- couvrir plusieurs canaux ;
- exposer une API utilisable par la V2 ;
- si possible, envoyer des webhooks pour le temps réel.

La marque blanche est un critère séparé. Un outil peut être complet sans être
white-label, et inversement.

## 4. Coût total par nombre de logements

Hypothèse : un type de logement par bien, trois canaux.

| Solution | 1 logement | 5 logements | 10 logements | Commission |
|---|---:|---:|---:|---|
| **Beds24** | **17,15 €/mois** | **34,15 €/mois** | **55,40 €/mois** | 0 % |
| **Smoobu** (Prepaid) | 35 €/mois | ~73,40 €/mois | ~121,40 €/mois | 0 % |
| **Smoobu** (Flex) | 29 €/mois | ~67,40 €/mois | ~115,40 €/mois | 0,9 % |
| **Channex** | 130,50 $/mois | 132,50 $/mois | 135 $/mois | 0 % |
| **Rentals United** | non adapté | non adapté | 330 $/mois (10–50) | 0 % |

Guesty Lite (9 $/annonce), QloApps (30 $/logement) et Vik/e4jConnect sont moins
chers sur le papier, mais exclus du périmètre V2 : pas d'API channel manager
exploitable, ou plugin WordPress non intégrable.

### Calcul Beds24

Le calculateur officiel Beds24 applique :

```text
12,90 € de base
+ 2,60 € par chambre/logement
+ 0,55 € par type de logement × canal
```

Pour 1 logement, 1 type, 3 canaux :

```text
12,90 + 2,60 + (1 × 3 × 0,55) = 17,15 €/mois
```

Pour 5 logements, 5 types, 3 canaux :

```text
12,90 + (5 × 2,60) + (5 × 3 × 0,55) = 34,15 €/mois
```

Pour 10 logements, 10 types, 3 canaux :

```text
12,90 + (10 × 2,60) + (10 × 3 × 0,55) = 55,40 €/mois
```

Le private label Beds24 (sous-domaine de la page de réservation) coûte 19 €/mois
en plus. Il n'est pas nécessaire si la V2 sert d'interface.

## 5. Détail des candidats

### 4.1 Beds24 — le moins cher

**Prix :** 17,15 €/mois pour 1 logement + 3 canaux. Essai gratuit. Aucune
commission. Pas de frais de mise en place. Private label 19 €/mois.

**Complet :** oui. Beds24 est un PMS/channel manager certifié, utilisé par des
gestionnaires et des hôtels. L'API permet de lire et modifier les disponibilités,
les restrictions, les prix journaliers, les réservations et les messages.

**Limites :**

- API un appel à la fois, avec des pauses obligatoires ;
- **crédit API** : quota de **100 crédits par 5 minutes et par compte**, chaque
  requête ayant un coût variable ; au-delà, erreur 429 jusqu'au reset. Le quota
  peut passer à 200 crédits/5 min pour 10 €/mois par compte ;
- webhooks booking et inventory disponibles, mais délai moyen d'environ une
  minute et les changements de restrictions (min stay) ne déclenchent pas
  l'inventory webhook ;
- pas de white-label complet ; le private label ne concerne que la page de
  réservation ;
- couverture des plateformes françaises niche à vérifier.

**Verdict :** imbattable sur le prix, bon pour un petit parc si le polling est
acceptable. Moins bon pour une intégration temps réel à fort volume.

### 4.2 Smoobu — simple, mais partiel

**Prix :** 29 €/mois en Flex avec 0,9 % de frais de réservation, ou 35 €/mois
en Prepaid sans commission. Le seuil Flex/Prepaid est de **666,67 € de
réservations par mois** : au-delà, Prepaid est plus rentable. Chaque unité
supplémentaire à partir de 9,60 €/mois. Essai 14 jours.

**Complet : non, partiel.** L’API documente les tarifs (`POST /api/rates`),
le `min_length_of_stay`, les réservations, les annulations et les webhooks
(`newReservation`, `updateRates`, etc.). En revanche, **aucun endpoint public
d’écriture des disponibilités n’est documenté** : `available` n’apparaît qu’en
lecture (`GET /api/rates`, webhook `updateRates`). Les CTA/CTD ne sont pas
documentés. Connexions Airbnb, Booking.com, Expedia ; Vrbo/Abritel à vérifier.

**Limites :**

- pas d’écriture de disponibilité ni de CTA/CTD dans l’API publique ;
- pas de marque blanche ;
- le tarif le plus bas inclut une commission de 0,9 % ;
- couverture des niches françaises limitée ;
- webhooks sans signature documentée : à sécuriser par URL secrète et relecture.

**Verdict :** bon connecteur pour un petit parc si les disponibilités sont
gérées dans Smoobu ou en iCal. **Ce n’est pas le pilote complet de la V2.**
Beds24 reste moins cher et pousse tout l’ARI ; Channex prend le relais au-delà
de ~30 logements.

### 4.3 Channex — le moins cher des white-labels

**Prix :** 130 $/mois de plateforme + 0,50 $/unité vacances. Staging gratuit,
sans carte. Pas de frais de mise en place, pas de commission.

**Complet :** oui. API white-label, disponibilités, tarifs, restrictions,
réservations, modifications, annulations, webhooks, 77+ canaux dont Booking.com,
Airbnb et Expedia. Certification Channex et autorisation des comptes OTA
nécessaires avant la production.

**Limites :**

- 130 $/mois même pour un seul logement, donc plus cher que Beds24/Smoobu en
  dessous de ~100 unités ;
- orientation éditeur de PMS, pas conciergerie ;
- couverture des niches françaises à vérifier ;
- la production n'est pas gratuite.

**Verdict :** le bon choix si tu veux vendre le channel manager sous ta marque
avec une API moderne et des webhooks. Le staging permet de développer à 0 €.

### 4.4 Guesty Lite — le moins cher pour 1 à 3 annonces

**Prix :** 9 $/annonce/mois, maximum 3 annonces, essai 14 jours.

**Complet :** oui pour un usage direct : sync temps réel Airbnb, Booking.com et
Vrbo/Abritel, multi-calendrier, tarifs, disponibilités et réservations.

**Limites :**

- pas d'API publique ni de white-label sur Lite ;
- pas intégrable dans la V2 ;
- restrictions (min stay, CTA/CTD) à confirmer ;
- au-delà de 3 annonces, passage en Pro sur devis.

**Verdict :** le moins cher si tu acceptes d'utiliser Guesty tel quel, sans
l'intégrer à la V2. Ce n'est pas la solution pour ton channel manager maison.

### 4.4.1 Guesty Pro — le PMS complet, pas une brique V2

**Prix :** sur devis, pour **4 à 199 logements**. Guesty ne publie pas le tarif
Pro ; il dépend du nombre de logements et des add-ons. Lite reste à 9 $/annonce
mais plafonne à 3 annonces.

**Complet :** oui, c'est un PMS complet : channel manager 60+ canaux (Airbnb,
Booking, Vrbo, Expedia, Google Vacation Rentals), multi-calendrier, messagerie,
site direct, owners portal, revenue management, comptabilité, automatisations,
Open API (Pro/Enterprise, à confirmer au devis) et support 24/7.

**Pourquoi ce n'est pas « le mieux » pour la V2 :**

- ce n'est pas un channel manager que tu branches : c'est un **concurrent de la
  V2**, qui la remplace ;
- prix sur devis, sans tarif public, avec onboarding et add-ons ;
- pour 4–199 logements, le coût dépasse largement Beds24/Channex ;
- l'Open API est un plus, mais payer un PMS complet pour n'en utiliser que la
  connectivité n'a pas de sens.

**Verdict :** excellent choix si tu veux **abandonner la V2** et acheter un
PMS clé en main. Mauvais choix si la V2 reste la source de vérité. Dans ce cas,
Beds24 (petit parc), Channex (scale/white-label) ou Smoobu (simplicité)
restent devant.

### 4.5 QloApps — open source, mais channel manager payant

**Prix :** 30 $/mois par logement pour le module Channel Manager. Le core PMS est
open source et gratuit.

**Complet :** oui, mais orienté hôtel. Pas d'API white-label ni de webhooks
adaptés à la V2.

**Pourquoi QloApps a été écarté de la V2 :**

- ce n'était pas le channel manager cible : dans les plans V1, QloApps était le
  **moteur de réservation direct transitoire** de phase 1, avec bascule prévue
  vers `booking:8095` maison et fallback d'un mois ;
- la décision T-01 du 14 octobre 2026 l'a écarté de la v1 : poids de la stack
  PrestaShop, absence de multi-tenant `entite_id` et d'allowlist 1-tap ;
- son modèle est hôtelier (chambres = produits), pas celui d'une conciergerie
  multi-biens avec `tenant_id`, RLS, audit et liens voyageur signés ;
- son channel manager est un module payant à 30 $/logement/mois, sans API
  white-label ni webhooks adaptés à la V2 ;
- l'intégrer aurait imposé de maintenir deux stacks (PrestaShop/PHP + V2) et
  deux sources de vérité.

**Verdict :** intéressant pour un hôtel qui veut auto-héberger son PMS, pas pour
une conciergerie qui veut intégrer la V2.

### 4.6 Rentals United — white-label B2B

**Prix :** Pro à partir de 330 $/mois pour 10–50 annonces. White-label sur
devis.

**Complet :** oui, 90+ canaux, API directe, création d'annonces, messagerie,
réservations, white-label.

**Verdict :** puissant mais cher et orienté éditeurs de PMS. À envisager
seulement à partir d'un parc important ou si le white-label est stratégique.

### 4.7 Vik/e4jConnect — l'alternative WordPress

**Prix :** 149 € VikBooking + 89 € Vik Channel Manager en une fois, plus un
abonnement e4jConnect par canal et par mois. Essai 30 jours.

**Complet :** oui, 2-way Airbnb/Booking/Expedia/Vrbo, mais installé dans
WordPress/Joomla, pas une API white-label.

**Verdict :** pas le moins cher au démarrage, et pas adapté à une intégration
dans la V2. À garder si tu veux un site WordPress avec channel manager natif.

### 4.8 Les autres

- **HotelRunner** : channel manager à 1,25 % avec minimum 29,95 $/mois.
- **Octorate** : à partir de 8 €/chambre/mois (exemple 7 unités), essai 14 jours,
  orienté hôtel.
- **Hostaway, Lodgify, Uplisting, OwnerRez, Tokeet, Streamline, Avantio,
  BookingSync, Hostify, SiteMinder, Cloudbeds, Little Hotelier** : tous payants,
  souvent plus chers que Beds24/Smoobu pour un petit parc.

## 6. Ce qui restera en iCal

Même avec Beds24, Smoobu ou Channex, les plateformes françaises niche
(Gîtes de France, Clévacances, Leboncoin, certains camping/glamping) ne sont pas
toutes couvertes par une API. Il faudra garder :

- iCal pour les disponibilités ;
- saisie manuelle pour les tarifs/restrictions si le canal n'a pas d'API ;
- la V2 comme calendrier central et source de vérité.

Un channel manager « complet » ne veut donc pas dire « toutes les plateformes
françaises en API ». Cela veut dire « les grands canaux en API, le reste en
iCal ».

## 7. Couverture des plateformes

| Fournisseur | Canaux revendiqués | Couverture France | Limites |
|---|---|---|---|
| **Rentals United** | **90+ canaux**, toutes catégories (OTA, métarecherche, sites, wholesalers) | Abritel, Amivac, TUI Villas, Plum Guide | 330 $/mois minimum, B2B, 10–50 annonces |
| **Channex** | **77 canaux OTA** | Vrbo/Abritel, Ctoutvert, VacanceSelect, Pitchup, Hipcamp, GlampingHub | 130 $/mois + 0,50 $/unité ; pas de Gîtes de France, Clévacances, Leboncoin |
| **Beds24** | **une soixantaine** de canaux | Abritel, Airbnb, Booking, Expedia, Agoda, Trip.com, Go Voyages, Opodo, Lastminute, eDreams | API bridée ; webhooks booking/inventory avec ~1 min de délai |
| **Smoobu** | Grands canaux | Airbnb, Booking, Expedia ; Vrbo/Abritel à vérifier | Pas le plus large |

**Le plus large sur le papier : Rentals United (90+).** Mais c'est un outil B2B
cher, orienté éditeurs de PMS, avec un minimum de 10–50 annonces.

**Le pilote complet V2 : Beds24 jusqu’à ~29 logements, Channex au-delà** si tu
veux la plus large couverture API et la marque blanche. **Smoobu** est une
alternative simple mais partielle ; **Host Port** ne fait que de la lecture ;
**Nobeds** reste à auditer.

**Aucun ne couvre les niches françaises** (Gîtes de France, Clévacances,
Leboncoin) en API native. Ces plateformes restent en iCal ou en saisie manuelle.
Si on compte l'iCal, la V2 peut couvrir toute plateforme qui expose un calendrier
iCal — mais sans tarifs, restrictions ni réservations natives.

## 8. Recommandation finale

### Si tu veux le moins cher absolu

**Beds24**, 17,15 €/mois pour un logement et trois canaux. Accepte l'API bridée
et le délai de webhook d'environ une minute.

### Si tu veux le moins cher avec une API complète

**Beds24**, 17,15 €/mois pour un logement et trois canaux, avec écriture ARI,
tarifs, restrictions, réservations et webhooks. **Smoobu** n’est pas retenu
comme pilote complet : son API publique ne pousse pas les disponibilités.

### Si tu veux revendre sous ta marque

**Channex**, 130 $/mois + 0,50 $/unité. Commence par le staging gratuit, paie
seulement au go-live.

### Si tu veux du gratuit

**iCal V2 uniquement**, avec les limites déjà connues. Aucun des outils
ci-dessus n'est gratuit en production.

## 9. Sources

- [Beds24 — tarifs](https://beds24.com/en/pricing)
- [Beds24 — API](https://beds24.com/api/)
- [Beds24 — API V2 et crédit API](https://wiki.beds24.com/index.php/Category:API_V2)
- [Beds24 — webhooks booking](https://wiki.beds24.com/index.php/Booking_Webhooks)
- [Beds24 — webhooks inventory](https://wiki.beds24.com/index.php/Inventory_Webhooks)
- [Beds24 — channel manager et liste des canaux](https://beds24.com/en/channel-manager)
- [Smoobu — tarifs](https://www.smoobu.com/en/pricing/)
- [Smoobu — API](https://docs.smoobu.com/)
- [Smoobu — channel manager](https://www.smoobu.com/en/channel-manager/)
- [Channex — tarifs](https://channex.io/pricing/)
- [Channex — documentation](https://docs.channex.io/)
- [Channex — 77 canaux OTA](https://channex.io/integrations/)
- [Host Port — tarifs](https://hostport.co/pricing)
- [Host Port — Data Connections](https://hostport.co/data-connections)
- [Nobeds — tarifs](https://nobeds.com/prices/)
- [Nobeds — API](https://nobeds.com/api/)
- [Guesty — tarifs](https://www.guesty.com/pricing/)
- [QloApps — Channel Manager](https://qloapps.com/channel-manager/)
- [Rentals United — tarifs](https://rentalsunited.com/pricing/)
- [Rentals United — channel manager 90+](https://rentalsunited.com/channel-manager/)
- [Rentals United — white-label](https://rentalsunited.com/white-label-channel-manager/)
- [Vik Channel Manager](https://www.vikwp.com/plugin/vikchannelmanager/)
- [e4jConnect — tarifs](https://e4jconnect.com/pricing/)
- [HotelRunner — tarifs](https://hotelrunner.com/pricing/)
- [Octorate — tarifs](https://octorate.com/pricing/)
