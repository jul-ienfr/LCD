# Budget partenaires — pilote 2026-11

**Statut** : hypothèse à valider en L0
**Périmètre** : 1 à 3 logements, un tenant pilote
**Règle** : coûts variables, refacturables, plafonnés ; infrastructure 0-5 €/mois.

## 1. Hypothèses

- Un seul fournisseur de distribution actif (Beds24 ou Channex).
- Un seul partenaire de pricing (PriceLabs ou Beyond).
- Stripe Checkout sur le compte du tenant.
- Nuki pour une serrure pilote.
- WhatsApp non activé au pilote.
- Les prix sont des ordres de grandeur à confirmer par devis.

## 2. Coûts mensuels estimés

| poste | 1 logement | 3 logements | 10 logements | remarque |
| --- | --- | --- | --- | --- |
| Distribution (Beds24) | 15-25 € | 25-40 € | 50-80 € | selon palier |
| Distribution (Channex) | 80-150 € | 100-180 € | 150-250 € | white-label |
| Pricing (PriceLabs) | 15-25 € | 40-70 € | 120-200 € | par logement |
| Stripe | 1,4 % + 0,25 €/paiement | idem | idem | pas d'abonnement |
| Nuki | 0-10 € | 0-10 € | 0-20 € | cloud/Bridge |
| Domaine/TLS | ~1 € | ~1 € | ~1 € | Let's Encrypt |
| **Total pilote** | **30-60 €** | **65-120 €** | **170-300 €** | hors Stripe variable |

## 3. Refacturation

| offre | traitement partenaire | plafond |
| --- | --- | --- |
| FULL 25 % | inclus dans la commission | pas de ligne séparée |
| PILOTAGE 149 €/mois | inclus jusqu'à 2 logements, puis 15 €/logement | 45 €/mois |
| KIT 890 € | 3 mois de distribution inclus | 60 € |

Règles :

- Aucun client ne paie plus que le coût réel + 20 %.
- Le client peut fournir ses propres comptes partenaires (BYO).
- Un audit trimestriel vérifie la dérive.
- Si le coût dépasse le plafond, LCD absorbe ou renégocie, jamais de facture
  surprise.

## 4. Seuils de décision

- Si le coût partenaire > 15 % du CA PILOTAGE : renégocier ou changer.
- Si le coût distribution > 8 % du CA FULL : revoir le modèle.
- Si le pricing ne génère pas +5 % de RevPAR en 90 jours : désactiver.
- Si le messaging OTA n'est pas disponible : ne pas le facturer.

## 5. Preuves à joindre

- [ ] Devis Beds24 et Channex à 1/3/10 logements.
- [ ] Devis PriceLabs et Beyond.
- [ ] Grille Stripe et simulation de frais.
- [ ] Devis Nuki.
- [ ] Validation comptable de la refacturation.

## 6. Décision

À signer en L0 avec ADR-01, ADR-02 et ADR-03. Tant que le budget n'est pas
plafonné, L1 et L2 ne démarrent pas.
