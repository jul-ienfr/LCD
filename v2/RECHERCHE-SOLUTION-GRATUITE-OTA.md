# Recherche d'une solution channel manager gratuite

**Date de recherche :** 2026-10-25  
**Périmètre :** channel manager capable de lever les limites iCal (tarifs,
restrictions, réservations natives, latence), si possible gratuit et en marque
blanche.

## 1. Conclusion

**Il n'existe pas de channel manager certifié, natif et en marque blanche
réellement gratuit en production.** Toutes les options sérieuses facturent un
abonnement, une commission, ou les deux.

Trois choses gratuites existent, mais aucune ne lève les quatre limites en
production :

1. **Le channel manager iCal de la V2** : gratuit, à ta marque, mais
   disponibilités seulement et latence OTA de 1 à 3 h.
2. **Les calendriers iCal natifs des OTA** : gratuits, mais manuels et limités
   aux disponibilités.
3. **La sandbox Channex** : gratuite, sans carte, pour développer et tester une
   intégration API native complète. La mise en production est payante.

## 2. Ce que disent les documents du projet

Les documents internes confirment déjà cette conclusion :

- `docs/plans-archives/Plan Technique LCD - Pipeline automatisation complet.md:540` :
  « pas de temps réel gratuit viable — API Airbnb/Booking réservées aux
  partenaires agréés (pas de self-service), aucun channel manager open source
  maintenu avec push OTA (HotelDruid = moteur direct + iCal, pas de connecteur
  OTA) ».
- `docs/registres/benchmark-oss.md:21` : le channel manager Vik est à environ
  249 €/an, avec API 2-way Airbnb/Booking/Expedia, mais il faut le core
  VikBooking en plus. La recommandation est « acheter plutôt que réécrire » si
  le 2-way devient nécessaire.
- `docs/plans-archives/Plan Passerelle Generale Parc - Pilotage Complet v1.md:114-128` :
  Airbnb est fermé aux partenaires agréés, Booking demande une certification
  Connectivity Provider, iCal n'est pas une source de vérité en production, et
  un channel manager agréé est envisagé au-delà de 10 unités.
- `docs/registres/a-trancher.md:10` : T-03 impose le 0 € strict et la réécriture
  maison pour la V1 ; la V2 a livré le channel manager iCal, pas les API OTA.
- `custom/passerelle-parc/README.md:253-256` : jamais d'écriture OTA automatique,
  pas de channel manager 2-voies sans API fermée/certification.

## 3. Résultats de la recherche Internet

Le comparatif chiffré des offres payantes les moins chères est dans
[COMPARATIF-CHANNEL-MANAGER-2026-10.md](./COMPARATIF-CHANNEL-MANAGER-2026-10.md).
Le détail de la marque blanche (contrat, support, données, coût) est dans
[MARQUE-BLANCHE.md](./MARQUE-BLANCHE.md). La matrice de décision V2 est dans
[MATRICE-MUST-HAVE-CHANNEL-MANAGER.md](./MATRICE-MUST-HAVE-CHANNEL-MANAGER.md).

| Solution | Gratuit en production | Essai / sandbox gratuit | Natif OTA | Marque blanche | Verdict |
|---|---|---|---|---|---|
| V2 iCal | Oui | — | Non | Oui, c'est ton logiciel | Seule solution gratuite durable, mais limites iCal |
| Channex | Non : 130 $/mois + 0,50 $/unité | Oui : staging gratuit, sans carte | Oui | Oui, API white-label | Meilleur chemin pour développer gratuitement, puis payer au go-live |
| Beds24 | Non : dès 15,50 €/mois + 0,55 €/lien | Essai gratuit | Oui | Partielle : private label 19 €/mois pour la page de réservation | Le moins cher, API limitée mais webhooks booking/inventory disponibles |
| Guesty Lite | Non : dès 9 $/annonce/mois | 14 jours | Oui | Non | Bon marché, mais pas de marque blanche |
| Smoobu | Non : dès 29 €/mois | 14 jours | Oui | Non | Correct, mais pas de marque blanche |
| QloApps Channel Manager | Non : 30 $/mois/logement | Essai | Oui | Non | Module hôtelier, pas une API marque blanche |
| HotelRunner | Non : minimum 29,95 $/mois | Essai | Oui | Non | Pas gratuit |
| Rentals United | Non : Pro dès 330 $/mois | Démo | Oui | Oui, white-label B2B | Puissant mais orienté éditeurs PMS et volume |
| Vik Channel Manager | Non : ~249 €/an + core VikBooking | Non vérifié | Oui | Non | Option low-cost, mais pas gratuite |
| Open source (QloApps, HotelDruid, etc.) | Le code est gratuit | — | Non pour les connecteurs OTA certifiés | Oui | Pas d'accès API OTA : iCal ou modules payants |
| Certification directe Airbnb/Booking | Candidature possible | — | Oui | Oui | Booking suspend les nouveaux prestataires ; Airbnb sélectif ; coût réel élevé |

## 4. Détail des options

### 4.1 V2 iCal — gratuit, mais limits inchangées

C'est la seule solution qui répond au critère « gratuit » en production. Elle
est déjà livrée : canaux, import/export, buffer, URLs signées, RLS, reprise des
flux existants.

Elle ne peut pas transmettre de tarifs, de restrictions ni de réservations
natives, et la latence OTA reste de 1 à 3 h. Aucun développement iCal ne peut
lever ces limites : le format ne les transporte pas.

### 4.2 Channex — la meilleure découverte

Channex est une API de channel manager en marque blanche, destinée aux éditeurs
de PMS. Elle expose :

- disponibilités, tarifs et restrictions ;
- réservations, modifications et annulations ;
- webhooks pour les nouvelles réservations ;
- 77+ canaux, dont Booking.com, Airbnb, Expedia ;
- un staging gratuit, sans carte, avec l'API complète pour développer.

Tarif public : **130 $/mois de plateforme + 0,50 $/unité vacances** (ou 7 $ par
hôtel), sans frais de mise en place ni commission. La certification Channex et
l'autorisation des comptes OTA sont nécessaires avant la production.

C'est donc **gratuit pour développer et valider**, mais **pas gratuit pour
exploiter**. Pour 10 unités : 135 $/mois. C'est beaucoup moins cher que Rentals
United pour un petit parc.

Source : [channex.io/pricing](https://channex.io/pricing/).

### 4.3 Beds24 — le moins cher, mais API contrainte

Beds24 est un PMS/channel manager avec API. L'API permet de lire et modifier
les disponibilités, restrictions, prix journaliers, réservations et messages.
Tarifs publics : à partir de 15,50 €/mois, 0,55 €/lien de canal, private label
19 €/mois pour le sous-domaine de réservation. Essai gratuit.

Limites : l'API Beds24 demande un appel à la fois, avec des pauses, et bloque
les usages excessifs. Le « crédit API » est un quota de débit : 100 crédits par
5 minutes et par compte, avec un coût variable par requête ; au-delà, erreur 429
jusqu'au reset. On peut passer à 200 crédits/5 min pour 10 €/mois par compte.
Les webhooks booking et inventory existent, mais le
webhook de réservation a un délai moyen d'environ une minute et les changements
de restrictions (min stay) ne déclenchent pas l'inventory webhook. Pour une
conciergerie, il faut donc prévoir un polling de secours et une architecture
prudente.

Sources : [beds24.com/api](https://beds24.com/api/),
[beds24.com/en/pricing](https://beds24.com/en/pricing),
[webhooks booking](https://wiki.beds24.com/index.php/Booking_Webhooks) et
[webhooks inventory](https://wiki.beds24.com/index.php/Inventory_Webhooks).

### 4.4 Guesty Lite, Smoobu, QloApps, HotelRunner

- **Guesty Lite** : 9 $/annonce/mois, 14 jours d'essai, sync native
  Airbnb/Booking/Vrbo. Pas de marque blanche.
- **Smoobu** : dès 29 €/mois, 14 jours, API avec tarifs, min stay et
  réservations ; **pas d’écriture de disponibilité ni de CTA/CTD** documentée,
  pas de marque blanche.
- **QloApps Channel Manager** : 30 $/mois/logement, essai, orienté hôtel.
- **HotelRunner** : channel manager à partir de 29,95 $/mois minimum.

Aucun n'est gratuit en production.

Également examinés et écartés faute d'offre gratuite en production : Hostaway,
Lodgify, Uplisting, OwnerRez, Tokeet, Streamline, Avantio, BookingSync,
Octorate, Hostify, SiteMinder, Cloudbeds et Little Hotelier. Tous sont des
abonnements, des démos ou des essais, pas des solutions gratuites durables.

### 4.5 Rentals United — white-label B2B

Rentals United propose une API white-label avec 90+ canaux, synchronisation
temps réel, création d'annonces, messagerie et réservations. C'est une offre
B2B pour éditeurs de PMS, avec tarification sur devis. L'offre Pro démarre à
330 $/mois pour 10 à 50 annonces ; le white-label est au-dessus.

Source : [white-label](https://rentalsunited.com/white-label-channel-manager/)
et [pricing](https://rentalsunited.com/pricing/).

### 4.6 Open source — attention au mirage

- **QloApps** : le core PMS est open source, mais le channel manager est un
  module payant à 30 $/mois/logement.
- **HotelDruid** : PMS gratuit, mais iCal uniquement, sans connecteur OTA
  certifié.
- **propflow-pms** : projet .NET intéressant, mais les adaptateurs Booking,
  Expedia et Airbnb sont encore dans la roadmap.
- **viljemd/channel-manager** : auto-hébergé, mais orienté iCal.
- **akaniklaus/channelmanager** : ancien projet Laravel, pas de preuve d'accès
  API OTA certifié ni de maintenance récente.

Un code open source ne donne pas l'autorisation d'utiliser les API OTA. Sans
contrat partenaire, il ne peut pas pousser légalement tarifs et réservations
dans Airbnb/Booking.

### 4.7 Automatisation navigateur / pseudo-API

L'idée : piloter l'extranet OTA avec un navigateur automatisé (Playwright,
Puppeteer, Selenium) ou appeler les endpoints internes repérés dans les outils
de développement. Ce n'est pas une API : c'est un humain simulé.

Pourquoi ce n'est pas une base V2 :

- **Contrat** : les CGU Airbnb/Booking/Expedia interdisent généralement le
  scraping et l'automatisation non autorisée. Risque de suspension du compte,
  d'annulation d'annonces et de blocage des paiements.
- **Technique** : 2FA, CAPTCHA, anti-bot, changement de DOM, expiration de
  session. Chaque mise à jour casse le script ; il faut quelqu'un en permanence.
- **Sécurité** : stocker les identifiants ou cookies de session OTA crée une
  cible critique. Une fuite expose les comptes, les voyageurs et les paiements.
- **Juridique** : contournement de protections et accès non autorisé = risque
  contractuel et pénal, à faire valider par un avocat.
- **Opérationnel** : double réservation, tarif erroné, restriction mal appliquée.
  Aucun support OTA, aucun SLA, aucune garantie.
- **Business** : un seul compte fermé coûte plus cher que des années de Smoobu
  ou Beds24. Ce n'est pas « infaillible », c'est un point de défaillance unique.

Seul usage défendable : un outil **interne**, sur **tes propres systèmes**, avec
accord écrit, en **human-in-the-loop** (le navigateur prépare, l'humain valide),
sans contourner 2FA/CAPTCHA et sans stocker les mots de passe. Ce n'est pas une
brique de production V2.

**Verdict :** à rejeter comme architecture. Si le budget est le problème :
iCal + e-mails + validation humaine, ou Smoobu/Beds24.

### 4.8 Certification directe

- **Booking.com** : le portail Connectivity annonce suspendre les intégrations
  de nouveaux prestataires jusqu'à nouvel ordre
  ([connect.booking.com](https://connect.booking.com/)).
- **Airbnb** : programme Software Partners sélectif, API partenaire
  ([software-partners](https://www.airbnb.com/software-partners),
  [developer.airbnb.com](https://developer.airbnb.com/)).
- **Expedia** : programme partenaire, non self-service.

La candidature peut être gratuite, mais l'ingénierie, la sécurité, le support,
la certification et l'exploitation ne le sont pas.

### 4.9 Offres freemium / low-cost : vérification

Les offres « API temps réel gratuite » ou « 10–20 €/mois » circulent, mais elles
ne correspondent pas toujours à ce qu'elles annoncent.

| Offre | Ce qui est vrai | Ce qui manque / piège | V2 |
|---|---|---|---|
| **Nobeds Free** | PMS + channel manager gratuits, 10 chambres, 3 canaux, sync 10 min | **API non incluse** : l'accès API est à **99 $/mois** ; le free n'est pas temps réel | Non pour l'API gratuite |
| **Nobeds API** | 99 $/mois, jusqu'à 1 000 propriétés, white-label, API dispo/prix/réservations (min stay via `/availability`, qui réécrit aussi dispo/prix) | **CTA/CTD et webhooks non documentés dans l’OpenAPI** ; fournisseur jeune, due diligence nécessaire | **À tester** |
| **CapDirect Free / Zen** | 0 € puis 9,90 €/mois, iCal Airbnb/Booking, site direct | **iCal seulement**, pas d'API native ; l'API est sur le plan Business | Non |
| **CapDirect Business** | 49 €/mois, 50 propriétés, API & webhooks, white-label | API « sur demande », pas de docs publiques ni sandbox ; à prouver | **À vérifier** |
| **BedLink** | 35 €/mois + 8 €/logement, 60+ plateformes, Airbnb/Booking/Abritel/Expedia, 30 jours d'essai | **Pas d'API publique documentée** : outil complet mais non intégrable à la V2 | Non |
| **Avirato** | 450+ OTAs revendiqués, 80 canaux listés, API incluse, PMS + channel manager | Prix sur devis, pas 10–20 €/mois ; outil complet, pas headless | À chiffrer |
| **Host Port Free** | 0 €, listings illimités, iCal, page de réservation directe, équipe, appli ; lecture des flux ~15 min | **Pas d’API de données** sur le free (réservée au paid), tarifs/restrictions non poussés ; la page Pricing dit « one-way » mais la page Free/FAQ décrit deux liens : incohérence à tester | Non pour la V2 ; bon 0 € autonome |
| **Host Port Pro** | **9 €/logement/mois** en zone euro, sync deux sens < 60 s, tarifs + min/max stay + CTA/CTD, Airbnb/Booking/Vrbo/Expedia/Agoda/Trip.com + 488 via Channex, **API Data Connections en lecture seule + webhooks** | **Pas d’API d’écriture ARI** : impossible de pousser dispos/tarifs/restrictions ; jeune acteur ; pas de channel manager white-label | Intégration partielle (lecture) ; **le moins cher en autonome pour 1–2 logements** |
| **Hospitable Essentials** | Gratuit : messagerie, sync Airbnb/Vrbo/Booking/Agoda, inventory, cleaning | Pas de site de réservation directe gratuit, pas d’API publique, pas de channel manager tarifs/restrictions | Non |
| **BNBForms** | 16 $/mois annuel ou 19 $/mois, illimité, widget + PMS | **iCal seulement**, pas d’API/webhooks | Non |
| **Plugins WordPress** | Widgets et iCal, versions gratuites | iCal seulement, pas de tarifs/restrictions, add-ons payants, pas d’API | Non |
| **QloApps** | PMS open source, iCal, channel manager réel | **30 $/mois ou 300 $/an par propriété**, pas un paiement unique ; pas d’API V2 | Non |
| **Hoteliera** | PMS gratuit ; Basic 15 € = site + moteur, Premium 25 € = channel manager ≤ 9 chambres ; API | API lecture + réservations, **pas de push ARI ni webhooks** ; 15 € ne donne pas le channel manager | Non (autonome) |
| **Lodgify / Smoobu / Beds24** | Essais gratuits puis payant ; API et widgets | Ce ne sont pas des offres freemium | Beds24/Smoobu oui |

**Conclusion :** aucune de ces offres ne donne une **API temps réel gratuite**.
Les offres à 0 € sont des widgets + iCal : elles ne poussent ni tarifs ni
restrictions, et ne garantissent pas le temps réel. **Host Port Pro à 9 €/mois
par logement** est néanmoins le moins cher des outils complets en autonome pour
1–2 logements (sync < 60 s, tarifs, stay rules, 488 canaux via Channex), mais
son API est **en lecture seule** : elle ne permet pas à la V2 de pousser les
dispos/tarifs/restrictions. La seule API d’écriture intéressante à tester reste
**Nobeds API à 99 $/mois** (jusqu’à 1 000 propriétés, white-label), avec
webhooks et CTA/CTD à vérifier. **Hoteliera à 25 €/mois** est réelle mais son
API ne pousse pas les tarifs/dispos. Pour un petit parc avec API, Beds24 reste
le moins cher et Smoobu le plus simple.

#### Host Port API (Data Connections)

Host Port **a bien une API**, contrairement à ce que j’ai écrit plus haut. Mais
ce n’est pas une API de channel manager : c’est une API de **lecture de
données**, réservée au plan payant et au propriétaire du compte.

- **Documentation** : <https://hostport.co/data-connections> (ancre `#api`),
  pas de portail développeur séparé.
- **Base** : `https://ntnzabbhtivotmfhwdnm.supabase.co/functions/v1/data-api/v1`.
- **Méthode** : `GET` uniquement ; JSON par défaut, CSV possible.
- **Auth** : `Authorization: Bearer hpk_…` pour un programme ; `?token=hpl_…`
  pour un lien tableur. Les clés sont affichées une fois, puis rotatives.
- **Datasets** : `bookings`, `calendar`, `reviews`, `earnings`.
- **Filtres** : `from`, `to` (24 mois max), `updated_since` (bookings/reviews),
  pagination `page`/`page_size` (max 1 000), jusqu’à 20 000 lignes.
- **Limites** : 500 appels/jour et 60/min par connexion ; 120/min par IP.
- **Webhooks** : nouveaux bookings et annulations, signés `hpw_…`, environ
  1–2 min, jusqu’à 10 tentatives, idempotence via `id` /
  `X-HostPort-Delivery`.

**Ce que ça permet pour la V2 :** importer les réservations et le calendrier
Host Port, recevoir les nouveaux bookings/annulations, faire un dashboard ou un
CRM. **Ce que ça ne permet pas :** créer/modifier une réservation, pousser une
disponibilité, un tarif ou une restriction, envoyer un message. Pour le sens
V2 → OTA, il faut passer par **Channex** (le backend de Host Port), **Beds24**
ou **Smoobu**.

Sources : [Nobeds tarifs](https://nobeds.com/prices/),
[Nobeds API](https://nobeds.com/api/),
[Nobeds OpenAPI](https://nobeds.com/api/openapi.json),
[CapDirect channel manager](https://www.capdirect.fr/en/channel-manager),
[CapDirect tarifs](https://www.capdirect.fr/tarifs),
[BedLink offres](https://www.bedlink.fr/offres),
[Avirato channel manager](https://avirato.com/channel-manager),
[Hospitable tarifs](https://hospitable.com/pricing),
[BNBForms tarifs](https://bnbforms.com/pricing),
[QloApps channel manager](https://qloapps.com/channel-manager/),
[Hoteliera tarifs](https://hoteliera.com/en/#pricing),
[Hoteliera API](https://hoteliera.com/kb/api/),
[Host Port tarifs](https://hostport.co/pricing),
[Host Port plan gratuit](https://hostport.co/free-channel-manager),
[Host Port canaux](https://hostport.co/channels),
[Host Port API Data Connections](https://hostport.co/data-connections),
[Host Port FAQ](https://hostport.co/faq).

## 5. Verdict

| Besoin | Solution gratuite ? |
|---|---|
| Synchroniser les disponibilités | Oui : V2 iCal |
| Pousser tarifs et restrictions | Non : API native payante ou certification |
| Recevoir les réservations natives | Non : API native payante ou certification |
| Temps réel | Non : API native payante ou certification |
| Marque blanche complète | Oui en iCal (ton logiciel) ; non en natif gratuit |
| Développer et tester une intégration native | Oui : sandbox Channex gratuite |
| Exploiter en production sans payer | Non |

## 6. La seule solution gratuite réellement live

Si « gratuit » est non négociable, la seule solution complète **en exploitation**
est un mode assisté, sans API OTA :

1. **Disponibilités** : le channel manager iCal de la V2, déjà en production.
   Import/export par canal, buffer, URLs signées.
2. **Réservations** : une boîte e-mail dédiée reçoit les confirmations OTA.
   La V2 lit la boîte en IMAP, reconnaît les modèles Airbnb/Booking/Abritel,
   crée ou met à jour la réservation, déduplique par numéro de confirmation et
   place les modèles inconnus dans une file de revue. Gratuit, quasi temps réel
   (quelques minutes), mais dépendant des e-mails et des modèles.
3. **Tarifs et restrictions** : la V2 génère une fiche de publication par
   canal et par période. Un opérateur recopie les valeurs dans l'extranet OTA,
   puis coche « publié ». Journal et contrôle d'écart. Gratuit, mais manuel.
4. **Latence** : disponibilités 1 à 3 h ; réservations quelques minutes ;
   tarifs/restrictions au rythme de la saisie humaine.

Ce mode est **complet opérationnellement** : toutes les plateformes sont
gérées, sans abonnement. Il n'est pas **complètement automatique** : les tarifs
et restrictions restent saisis dans les extranets, et les disponibilités
gardent la latence iCal.

Ses limites : pas de temps réel de disponibilité, pas de push automatique des
prix, dépendance aux e-mails, et vérification nécessaire des conditions OTA
pour l'ingestion des confirmations. C'est le prix réel du gratuit.

Si « complet » signifie « automatique et temps réel », il faut une API native
payante (Channex, Beds24, etc.). Aucune solution ne cumule gratuité, API native,
temps réel et marque blanche.

## 7. Recommandation

1. **Garder la V2 iCal en production** : elle est gratuite et déjà fiable.
2. **Ouvrir un compte staging Channex** pour construire l'adaptateur natif
   sans payer : l'API complète, les webhooks, les tarifs et les restrictions
   sont testables gratuitement.
3. **Décider du go-live** seulement après le pilote : 130 $/mois + 0,50 $/unité
   pour Channex, ou une autre offre si le volume justifie un contrat B2B.
4. **Ne pas utiliser** de dépôt open source promettant Airbnb/Booking sans
   certification : risque de violation des conditions OTA, de panne et de fuite
   de données.

## 8. Sources

- [Channex — tarifs](https://channex.io/pricing/)
- [Channex — documentation](https://docs.channex.io/)
- [Beds24 — API](https://beds24.com/api/)
- [Beds24 — API V2 et crédit API](https://wiki.beds24.com/index.php/Category:API_V2)
- [Beds24 — webhooks booking](https://wiki.beds24.com/index.php/Booking_Webhooks)
- [Beds24 — webhooks inventory](https://wiki.beds24.com/index.php/Inventory_Webhooks)
- [Beds24 — tarifs](https://beds24.com/en/pricing)
- [Guesty — tarifs](https://www.guesty.com/pricing/)
- [Smoobu — tarifs](https://www.smoobu.com/en/pricing/)
- [QloApps Channel Manager](https://qloapps.com/channel-manager/)
- [HotelRunner — tarifs](https://hotelrunner.com/pricing/)
- [Rentals United — white-label](https://rentalsunited.com/white-label-channel-manager/)
- [Rentals United — tarifs](https://rentalsunited.com/pricing/)
- [Booking.com Connectivity](https://connect.booking.com/)
- [Airbnb Software Partners](https://www.airbnb.com/software-partners)
- [Airbnb API](https://developer.airbnb.com/)
