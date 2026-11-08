# Grille de benchmark L0

**Date** : 2026-11-06
**But** : objectiver les choix ADR-01 (distribution), ADR-02 (paiement),
ADR-03 (pricing), ADR-05 (messagerie).
**Règle** : note 0 (absent) à 3 (excellent), preuve obligatoire, pas de note
sans capture ou document.

## 1. Distribution

| critère | poids | Beds24 | Channex | Smoobu | preuve attendue |
| --- | --- | --- | --- | --- | --- |
| Push ARI temps réel | 3 | | | | capture sandbox |
| Webhook signé + rejeu | 3 | | | | doc + test |
| Import résa + modif + annulation | 3 | | | | test |
| Messaging OTA | 3 | | | | test entrant/sortant |
| Multi-unités / rate plans | 2 | | | | mapping |
| Google Vacation Rentals | 2 | | | | doc |
| White-label | 2 | | | | doc/contrat |
| Coût à 1 logement | 2 | | | | grille tarifaire |
| Coût à 10 logements | 2 | | | | grille tarifaire |
| Coût à 30 logements | 2 | | | | grille tarifaire |
| DPA / hébergement UE | 2 | | | | contrat |
| Export / résiliation | 2 | | | | contrat |
| Support FR / doc | 1 | | | | test support |
| **Total pondéré** | | | | | |

Seuil de décision : **≥ 75 %** du maximum et aucun critère poids 3 noté 0.
Si Beds24 et Channex sont à égalité, prendre le moins cher au pilote.

## 2. Paiement

| critère | poids | Tenant Stripe | Stripe Connect | PayPal | Payyo | preuve |
| --- | --- | --- | --- | --- | --- | --- |
| Conformité DSP2 | 3 | | | | | avis juridique |
| Qui porte le risque | 3 | | | | | contrat |
| Checkout + 3DS2 | 3 | | | | | test |
| Acompte/solde | 3 | | | | | test |
| Empreinte caution | 3 | | | | | test |
| Remboursement partiel | 2 | | | | | test |
| Frais | 2 | | | | | grille |
| UX mobile | 2 | | | | | test |
| Support FR | 1 | | | | | doc |
| **Total pondéré** | | | | | | |

Seuil : **≥ 80 %** et conformité juridique validée. Sinon repli « suivi seul ».

## 3. Pricing

| critère | poids | PriceLabs | Beyond | preuve |
| --- | --- | --- | --- | --- |
| API recommandations 18 mois | 3 | | | doc/test |
| Facteurs explicables | 3 | | | test |
| Qualité marchés FR | 3 | | | échantillon |
| Coût/logement/mois | 2 | | | grille |
| Contrat de revente | 2 | | | contrat |
| Fallback / export | 2 | | | doc |
| **Total pondéré** | | | | |

Seuil : **≥ 75 %** et coût compatible avec la marge PILOTAGE.

## 4. Messagerie

| critère | poids | Fournisseur OTA | Email IMAP | SMS Brevo | WhatsApp | preuve |
| --- | --- | --- | --- | --- | --- | --- |
| Réception | 3 | | | | | test |
| Envoi | 3 | | | | | test |
| Pièces jointes | 2 | | | | | test |
| Regroupement par fil | 3 | | | | | test |
| Coût/conversation | 2 | | | | | grille |
| Consentement/opt-out | 3 | | | | | doc |
| **Total pondéré** | | | | | | |

Seuil : l'OTA seul n'est pas obligatoire ; email + SMS doivent couvrir 100 %
des parcours critiques.

## 5. Fiche de mesure

Pour chaque test :

- date, environnement (sandbox/staging), version du partenaire ;
- action exacte (endpoint, payload) ;
- résultat observé (code, latence, capture) ;
- écart avec l'attendu ;
- décision : retenu / rejeté / à revoir.

## 6. Règles

- Aucune donnée de production, aucun secret réel.
- Aucun scraping, aucun contournement d'auth.
- Une note sans preuve vaut 0.
- Le benchmark est refait si un partenaire change son contrat ou son API.
- Le résultat est archivé dans `docs/decisions/` et référencé dans l'ADR.
