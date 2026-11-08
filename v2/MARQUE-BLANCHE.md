# Marque blanche : ce que ça change pour la V2

**Note au 25 octobre 2026.** Complément au
[comparatif channel managers](./COMPARATIF-CHANNEL-MANAGER-2026-10.md).

## 1. Définition

La marque blanche, c'est un accord qui permet de présenter un service sous **ta
marque** : ton domaine, ton logo, tes e-mails, ta facturation, ton support. Le
fournisseur technique reste derrière.

Ce n'est **pas un paramètre technique**. C'est un **contrat de distribution ou de
revente**. Un fournisseur non white-label peut interdire de masquer sa marque,
même si l'API le permet techniquement.

## 2. Ce que ça ne change pas

- la synchronisation OTA : mêmes canaux, mêmes API, mêmes tarifs, mêmes
  restrictions, mêmes réservations ;
- les voyageurs OTA : ils voient Airbnb ou Booking, jamais le channel manager ;
- la qualité de la connexion : elle dépend du fournisseur, pas du logo.

La marque blanche change l'emballage commercial, pas le tuyau.

## 3. Ce que ça change

| Aspect | White-label | Non white-label |
|---|---|---|
| Interface | Ton domaine, ton logo | Interface du fournisseur |
| E-mails / notifications | Ton nom | Nom du fournisseur |
| Facturation | Tu factures tes clients | Le fournisseur te facture |
| Support | Tu es en première ligne | Le fournisseur te supporte |
| Revente | Autorisée par contrat | Souvent interdite |
| Données | Souvent à toi, selon le DPA | Fournisseur sous-traitant |
| Prix | Plus cher | Moins cher |
| API | API partenaire, sous-comptes, webhooks | API standard |
| Responsabilité | Tu portes l'incident et le SLA | Le fournisseur porte l'incident |

### Les points qui coûtent vraiment

- **Support** : en white-label, tes clients appellent LCD, pas Channex. Il faut
  une astreinte, une base de connaissances et un process d'escalade.
- **Contrat** : il faut le droit de revendre, de sous-licencier, de rebrander et
  d'utiliser les API pour des tiers.
- **Données** : il faut un DPA conforme RGPD, savoir qui est responsable de
  quoi, et garantir l'export à la sortie.
- **Facturation** : tu deviens l'interlocuteur financier ; tu portes le risque
  d'impayés.
- **SLA** : tu promets une disponibilité que tu ne contrôles pas entièrement.

## 4. Pour la V2

### Usage interne de la conciergerie

**La marque blanche n'est pas nécessaire.** La V2 est déjà l'interface ; le
backend Smoobu ou Beds24 reste invisible pour tes propriétaires et tes équipes.
Tu paies l'API, pas le logo.

### Revente à d'autres conciergeries

**La marque blanche devient nécessaire** si tu vends le channel manager sous
LCD. Il faut alors un contrat de revendeur, des sous-comptes, une facturation
par client et un support de première ligne.

### Simple volonté de cacher le logo

Mauvais motif. Si le fournisseur n'autorise pas le rebranding, tu violes le
contrat. Si tu veux juste éviter de voir « Smoobu » dans un coin, ce n'est pas
un argument pour payer 130 $/mois.

## 5. Coût de la marque blanche

| Solution | Coût | White-label |
|---|---:|---|
| Smoobu | 35 €/mois sans commission | Non |
| Beds24 | 17,15 €/mois pour 1 logement + 3 canaux | Non |
| Channex | 130 $/mois + 0,50 $/unité | Oui |
| Rentals United | 330 $/mois minimum (10–50) | Oui, sur devis |

À un logement, Channex coûte environ **95 à 113 $/mois de plus** que
Smoobu/Beds24. Ce surcoût ne se justifie que si tu revends, si tu as besoin de
sous-comptes, ou si ton contrat l'exige.

## 6. Checklist contrat white-label

À vérifier avant de signer :

- droit de rebrander, de revendre et de sous-licencier ;
- droit d'utiliser l'API pour des comptes clients ;
- sous-comptes, domaines personnalisés, e-mails personnalisés ;
- webhooks, limites d'API, quotas, sandbox ;
- propriété des données, DPA, RGPD, export à la sortie ;
- SLA, support, escalade, incidents, compensation ;
- facturation, taxes, impayés, résiliation ;
- autorisation des comptes OTA pour chaque client ;
- responsabilité, assurance, conformité ;
- durée, préavis, réversibilité.

## 7. Décision

- **Interne** : pas de marque blanche. Smoobu ou Beds24.
- **Revente** : marque blanche. Channex, ou Rentals United à volume.
- **Logo seul** : ne pas payer pour ça ; vérifier le contrat.

La marque blanche est un choix **commercial et juridique**, pas une option
technique de la V2.

## 8. Sources

- [Channex — white-label](https://channex.io/white-label/)
- [Rentals United — white-label](https://rentalsunited.com/white-label-channel-manager/)
- [Smoobu — tarifs](https://www.smoobu.com/en/pricing/)
- [Beds24 — tarifs](https://beds24.com/en/pricing)
