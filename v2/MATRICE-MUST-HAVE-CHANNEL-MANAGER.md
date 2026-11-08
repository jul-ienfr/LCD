# Matrice « must-have V2 » vs channel managers

**Vérification au 25 octobre 2026.** Objectif : décider sur des faits, pas sur
les promesses marketing.

Statuts :

- ✅ documenté et utilisable ;
- ⚠️ partiel, dépend du canal, ou à vérifier contractuellement ;
- ❌ non disponible ou hors périmètre.

Voir [FOURNISSEURS-CHANNEL-MANAGER.md](./FOURNISSEURS-CHANNEL-MANAGER.md) pour
le registre V2, l’orchestration (cron/webhooks/import idempotent) et la
configuration serveur. Cette matrice décrit les fournisseurs, pas l’état
d’avancement du code V2.

Périmètre : **Beds24, Smoobu, Channex, Rentals United**, complétés par les deux
intégrations retenues dans le registre V2 : **Host Port** (lecture seule) et
**Nobeds** (partiel). Les autres sont exclus car non intégrables dans la V2
(Guesty Lite, QloApps, Vik, HotelRunner, Octorate).

## 1. Socle channel manager (P0)

| # | Besoin V2 | Beds24 | Smoobu | Channex | Rentals United |
|---|---|---|---|---|---|
| 1 | Pousser les disponibilités | ✅ | ❌ non documenté | ✅ | ✅ |
| 2 | Pousser les tarifs | ✅ | ✅ | ✅ | ✅ |
| 3 | Pousser les restrictions (min/max stay, CTA/CTD, stop-sell) | ✅ | ⚠️ min/max seulement, ni CTA/CTD ni stop-sell | ✅ | ✅ |
| 4 | Importer les réservations | ✅ | ✅ | ✅ | ✅ |
| 5 | Modifications et annulations | ✅ | ✅ | ✅ | ✅ |
| 6 | Webhooks réservations | ✅ (~1 min) | ✅ (sans signature documentée) | ✅ | ✅ |
| 7 | Webhooks prix/dispo | ⚠️ inventory oui, mais min stay ne déclenche pas | ⚠️ notification `updateRates`, pas un push | ⚠️ à vérifier | ✅ |
| 8 | Polling de secours / réconciliation | ✅ | ✅ | ✅ | ✅ |
| 9 | API REST/JSON | ✅ | ✅ | ✅ | ✅ REST/XML |
| 10 | Sandbox ou essai self-service | ✅ essai | ✅ essai + clé API | ✅ staging gratuit | ⚠️ démo/contrat |
| 11 | Multi-logements / multi-unités | ✅ | ✅ | ✅ | ✅ |
| 12 | Multi-comptes / sous-comptes | ⚠️ à valider | ⚠️ à valider | ✅ | ✅ |

**Lecture :** Beds24, Channex et Rentals United passent le socle P0. **Smoobu
est partiel** : il ne pousse pas les disponibilités et ne documente pas les
CTA/CTD. Host Port est hors socle (lecture seule) ; Nobeds est partiel
(disponibilités/tarifs, mais restrictions non poussées sans réécrire dispo/prix,
webhooks non documentés).

**Dans la V2 :** les règles de séjour sont saisies par date dans **Hôte → Prix**
et poussées selon le tableau ci-dessus : Beds24/Channex reçoivent min/max,
CTA/CTD et stop-sell, Smoobu seulement min/max. Le cut-off n’est pas encore
modélisé.

## 2. Couverture des plateformes

| Plateforme | Beds24 | Smoobu | Channex | Rentals United |
|---|---|---|---|---|
| Airbnb | ✅ | ✅ | ✅ | ✅ |
| Booking.com | ✅ | ✅ | ✅ | ✅ |
| Expedia | ✅ | ✅ | ✅ | ✅ |
| Vrbo / Abritel | ✅ | ⚠️ à vérifier | ✅ via Vrbo | ✅ |
| Agoda | ✅ | ⚠️ à vérifier | ✅ | ✅ |
| Trip.com | ✅ | ⚠️ à vérifier | ✅ | ✅ |
| Pitchup / Hipcamp / Glamping | ❌ | ❌ | ✅ | ⚠️ à vérifier |
| Gîtes de France | ❌ | ❌ | ❌ | ❌ |
| Clévacances | ❌ | ❌ | ❌ | ❌ |
| Leboncoin | ❌ | ❌ | ❌ | ❌ |
| **Total revendiqué** | **~60 canaux** | **grands canaux** | **77 OTA** | **90+ canaux** |

**Conclusion :** aucun ne couvre les niches françaises. Ces plateformes restent
en iCal ou en saisie manuelle. Le « plus large » est Rentals United, mais pas
forcément le plus utile pour un petit parc.

## 3. Marque, contrat, données

| Besoin | Beds24 | Smoobu | Channex | Rentals United |
|---|---|---|---|---|
| White-label complet | ❌ private label page de réservation seulement | ❌ | ✅ | ✅ |
| Droit de revente | ⚠️ à vérifier | ⚠️ à vérifier | ✅ par contrat | ✅ par contrat |
| Sous-comptes clients | ⚠️ à valider | ⚠️ à valider | ✅ | ✅ |
| Propriété des données / DPA | ⚠️ à vérifier | ⚠️ à vérifier | ⚠️ à vérifier | ⚠️ à vérifier |
| Support / SLA contractuel | ⚠️ standard | ⚠️ standard | ⚠️ B2B | ⚠️ B2B |
| API partenaire / white-label | ❌ | ❌ | ✅ | ✅ |

**Point clé :** « white-label » n’est pas qu’un logo. C’est un contrat de
revendeur, avec support, données, facturation et responsabilité. Voir
[MARQUE-BLANCHE.md](./MARQUE-BLANCHE.md).

## 4. Coût

Hypothèse : 1 type de logement par bien, 3 canaux.

| Solution | 1 logement | 10 logements | Commission | Minimum |
|---|---:|---:|---|---|
| **Beds24** | **17,15 €/mois** | **55,40 €/mois** | 0 % | aucun |
| **Smoobu** | 35 €/mois | ~121,40 €/mois | 0 % (Flex : 0,9 %) | aucun |
| **Channex** | 130,50 $/mois | 135 $/mois | 0 % | aucun |
| **Rentals United** | non adapté | 330 $/mois (10–50) | 0 % | 10–50 annonces |

### 4.1 Seuils de bascule

Hypothèse : 1 type de logement par bien, 3 canaux, tarifs hors TVA, sans
commission. Les seuils sont indicatifs : le nombre de canaux, les types de
logement et le taux de change EUR/USD les déplacent.

| Nombre de logements | Le moins cher | Meilleur choix pratique |
|---:|---|---|
| 1–10 | **Beds24** | Beds24 ; Smoobu si tu veux l’API la plus simple |
| 11–25 | **Beds24** | Beds24 ; Channex seulement si white-label |
| ~25–30 | Bascule Beds24 → Channex | Channex si 77 OTA ou white-label |
| 30–50 | **Channex** | Channex ; RU seulement si 90+ canaux |
| 50–100 | **Channex** | Channex ; RU si partenariat B2B |
| 100+ | **Channex** | Channex ; RU sur devis |

**Calcul du seuil Beds24 → Channex :**

```text
Beds24  = 12,90 + 2,60 × N + 0,55 × N × 3
Channex = 130 + 0,50 × N
```

À parité EUR/USD, le point d’équilibre est autour de **32 logements**. Avec un
euro à 1,16 USD, il descend autour de **26 logements**. Avec 5 canaux, il descend
autour de **24 logements** ; avec 2 canaux, il monte autour de **37 logements**.

**Smoobu n’est jamais le moins cher** face à Beds24. C’est un premium pour la
simplicité de l’API et des webhooks. **Rentals United** n’est pas un choix de
coût : à 330 $/mois minimum, il ne devient intéressant que pour 90+ canaux, un
contrat B2B ou un volume important. **Channex** reste moins cher que RU jusqu’à
environ 400 logements à 0,50 $/unité.

**La marque blanche change la règle :** si tu revends sous LCD, Channex est le
choix dès le premier logement, même s’il est plus cher que Beds24.

### 4.3 Registre V2 : cinq fournisseurs et conseil par parc

| Nombre de logements | Choix conseillé | Alternative | Rôle de l’alternative |
|---:|---|---|---|
| **1–2** | **Beds24** | **Host Port Pro** | Autonome à 9 €/logement/mois ; lecture seule, pas de pilote V2. |
| **3–10** | **Beds24** | **Smoobu** | Simplicité, mais pas de push disponibilité. |
| **11–29** | **Beds24** | **Channex** | White-label ou approche du seuil de bascule. |
| **30–99** | **Channex** | **Beds24** | Beds24 reste le repli sans white-label. |
| **100+** | **Channex** | **Nobeds API** | 99 $/mois jusqu’à 1 000 propriétés, à auditer. |

Les cinq fournisseurs sont activables uniquement par le super-admin dans
`Supervision → Fournisseurs`, puis affectés logement par logement. Host Port ne
reçoit jamais d’ARI de la V2 ; Smoobu et Nobeds refusent les opérations non
couvertes par leur API.

### 4.2 Smoobu : Prepaid ou Flex ?

Smoobu Flex = **29 €/mois + 0,9 % des réservations**. Smoobu Prepaid =
**35 €/mois, 0 % de commission**. Le seuil est :

```text
29 + 0,009 × R = 35
R = 6 / 0,009 = 666,67 € de réservations par mois
```

- **Moins de ~667 €/mois de réservations** : Flex peut être moins cher.
- **Plus de ~667 €/mois** : Prepaid est plus rentable.
- Un logement à 100 €/nuit loué 7 nuits = 700 € : le seuil est déjà dépassé.

Pour une conciergerie en activité, **Prepaid sans commission est presque toujours
le bon choix**. Mais Beds24 reste moins cher que les deux (17,15 €/mois, 0 %).

## 5. Verdict par fournisseur

### Beds24 — le moins cher

- **Force :** 17,15 €/mois, ~60 canaux, webhooks booking + inventory, API
  complète, aucun engagement.
- **Faiblesse :** API à crédits (100 crédits/5 min/compte, 200 pour 10 €/mois)
  et appels sérialisés, webhook ~1 min, min stay non couvert par l’inventory
  webhook, pas de white-label.
- **Choisir si :** usage interne, petit parc, budget prioritaire, polling de
  secours acceptable.

### Smoobu — simple, mais partiel

- **Force :** API et webhooks propres, tarifs, min stay et réservations, mise en
  place rapide, 35 €/mois sans commission.
- **Faiblesse :** **pas d’écriture de disponibilité ni de CTA/CTD dans l’API
  publique**, couverture plus étroite, webhooks sans signature documentée, pas
  de white-label.
- **Choisir si :** tu veux importer les réservations et pousser les tarifs, en
  acceptant que les disponibilités soient gérées dans Smoobu ou en iCal.

### Channex — le meilleur white-label

- **Force :** 77 OTA, API white-label, webhooks, sous-comptes, staging gratuit.
- **Faiblesse :** 130 $/mois + 0,50 $/unité, production payante, autorisation
  OTA nécessaire, niches françaises absentes.
- **Choisir si :** tu revends le channel manager sous LCD ou tu veux la
  couverture maximale avec webhooks modernes.

### Rentals United — le plus large, mais B2B

- **Force :** 90+ canaux, white-label, API, sous-comptes, messaging.
- **Faiblesse :** 330 $/mois minimum, 10–50 annonces, orienté éditeurs PMS,
  webhooks avec polling de secours recommandé.
- **Choisir si :** volume, revente, ou besoin d’un partenariat white-label B2B.

## 6. Ce qu’aucun ne fait

- Couvrir Gîtes de France, Clévacances, Leboncoin en API native.
- Gérer les promotions, politiques, litiges, avis et paiements à ta place.
- Garantir zéro surbooking : il faut buffer, réconciliation et surveillance.
- Remplacer un PMS : ménage, maintenance, facturation, taxe de séjour.
- Remplacer un revenue manager : ils poussent les prix, ils ne décident pas.
- Supporter toutes les combinaisons de rate plans/restrictions sur tous les
  canaux : le support varie par canal.

## 7. Test à faire avant de signer

1. Ouvrir un essai Beds24, un essai Smoobu et le staging Channex.
2. Créer 1 logement, 2 rate plans, 3 restrictions (min stay, CTA, stop-sell).
3. Vérifier : push dispo, push prix, push restrictions, création/modification/
   annulation de réservation, payload et signature du webhook.
4. Tester les doublons, les webhooks hors ordre, le polling de secours et les
   quotas API.
5. Faire tourner V2 + fournisseur + OTA en double pendant 2 semaines.
6. Vérifier le contrat : revente, DPA/RGPD, SLA, sous-comptes, limites API,
   résiliation et export des données.

## 8. Décision recommandée

- **MVP interne, budget minimal et pilote complet : Beds24 (1–29 logements).**
- **Pilote complet au-delà de ~30 logements : Channex.**
- **Revente / white-label : Channex.**
- **Smoobu : connecteur partiel de simplicité, jamais pilote complet.**
- **Host Port : lecture seule, jamais pilote V2.**
- **Nobeds : alternative de volume à auditer.**
- **Volume / partenariat B2B : Rentals United.**

Aucun choix ne dispense de garder **iCal + réconciliation** pour les niches et
les cas limites.

## 9. Sources

- [Beds24 — API](https://beds24.com/api/)
- [Beds24 — API V2 et crédit API](https://wiki.beds24.com/index.php/Category:API_V2)
- [Beds24 — webhooks booking](https://wiki.beds24.com/index.php/Booking_Webhooks)
- [Beds24 — webhooks inventory](https://wiki.beds24.com/index.php/Inventory_Webhooks)
- [Beds24 — channel manager](https://beds24.com/en/channel-manager)
- [Smoobu — API](https://docs.smoobu.com/)
- [Smoobu — channel manager](https://www.smoobu.com/en/channel-manager/)
- [Channex — intégrations 77 OTA](https://channex.io/integrations/)
- [Channex — documentation](https://docs.channex.io/)
- [Rentals United — API](https://developer.rentalsunited.com/)
- [Rentals United — channel manager 90+](https://rentalsunited.com/channel-manager/)
- [Rentals United — white-label](https://rentalsunited.com/white-label-channel-manager/)
