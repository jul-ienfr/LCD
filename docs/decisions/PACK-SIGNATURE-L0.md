# Pack de signature L0 — décisions à valider avant L2

**Date** : 2026-11-06
**Règle** : aucune brique L2-L7 (site public, paiement, messagerie, pricing,
API) n'est codée avant la signature de ces cinq décisions et la fixation d'un
plafond de dépense partenaires.

Chaque décision a une recommandation par défaut. Si tu acceptes tout tel quel,
réponds simplement **« L0 signé »** : je démarre L2.

---

## 1. Distribution temps réel — ADR-01

| | |
| --- | --- |
| **Recommandé** | Beds24 en pilote, Channex en alternative si Beds24 échoue |
| **Pourquoi** | le plus simple à brancher, tarif accessible, API documentée |
| **Coût** | à confirmer sur devis ; prévoir 0-50 €/mois pour 1-3 logements |
| **Risque** | dépendance à un intermédiaire ; sortie prévue par l'adapter |
| **Débloque** | ARI temps réel, webhooks, réservations OTA |

- [ ] Je signe Beds24 pilote / Channex alternative.
- [ ] Je préfère un autre fournisseur : ______________________

## 2. Paiement en ligne — ADR-02

| | |
| --- | --- |
| **Recommandé** | Stripe Checkout sur le compte marchand du tenant |
| **Pourquoi** | LCD ne devient pas PSP, l'argent va directement à l'hôte |
| **Coût** | frais Stripe standard, ~1,5 % + 0,25 € par paiement européen |
| **Risque** | onboarding Stripe par tenant ; pays non couverts |
| **Débloque** | acompte, solde, caution, remboursement |

- [ ] Je signe Stripe Checkout, compte marchand du tenant.
- [ ] Je préfère Stripe Connect : ______________________
- [ ] Je refuse le paiement en ligne pour l'instant.

## 3. Pricing dynamique — ADR-03

| | |
| --- | --- |
| **Recommandé** | PriceLabs en pilote, Beyond en alternative |
| **Pourquoi** | API simple, pas de reconstruction d'un moteur de revenue |
| **Coût** | abonnement par logement, à confirmer |
| **Risque** | coût récurrent ; qualité des données locales |
| **Débloque** | prix dynamiques, occupation, ADR/RevPAR |

- [ ] Je signe PriceLabs pilote / Beyond alternative.
- [ ] Je garde le pricing manuel + plages LCD.

## 4. Site public — ADR-04

| | |
| --- | --- |
| **Recommandé** | mini-builder LCD : 3 modèles, 4 pages, 7 blocs, domaine |
| **Pourquoi** | reste dans le produit, HTML-first, pas de WordPress |
| **Coût** | 0 € partenaire ; ~15 j-h de développement |
| **Risque** | périmètre : pas de blog ni de SEO avancé en v1 |
| **Débloque** | site direct, réservation directe, paiement |

- [ ] Je signe le mini-builder 3 modèles / 4 pages / 7 blocs.
- [ ] Je veux un CMS plus large : ______________________

## 5. Messagerie unifiée — ADR-05

| | |
| --- | --- |
| **Recommandé** | OTA + email + SMS en couches ; WhatsApp en phase 2 |
| **Pourquoi** | l'API messaging OTA n'est pas garantie ; email/SMS sont sûrs |
| **Coût** | Brevo/SMS existants ; WhatsApp plus tard |
| **Risque** | pas de messagerie OTA native tant que le partenaire ne l'ouvre pas |
| **Débloque** | boîte unifiée, réponses voyageur, historique |

- [ ] Je signe OTA + email + SMS, WhatsApp phase 2.
- [ ] Je veux WhatsApp dès la v1 : ______________________

---

## Plafond de dépense partenaires

| parc | plafond mensuel recommandé | commentaire |
| --- | --- | --- |
| 1 logement | 60 €/mois | distribution + pricing + SMS |
| 3 logements | 150 €/mois | tarifs dégressifs à négocier |
| 10 logements | 400 €/mois | au-delà, revue trimestrielle |

- [ ] Je fixe le plafond à ________ €/mois.
- [ ] Je veux un accord écrit avant tout dépassement.

## Actions humaines qui ne peuvent pas être automatisées

- [ ] Créer un compte sandbox Beds24 ou Channex.
- [ ] Créer un compte Stripe test (et décider compte tenant ou Connect).
- [ ] Demander un essai PriceLabs ou Beyond.
- [ ] Faire relire les mentions légales, CGV et la politique d'annulation.
- [ ] Confirmer que LCD ne touche jamais l'argent des voyageurs.

## Ce que je fais après signature

1. L2 : domaine `page-publique`, tables `sites_tenants` / `pages_site` /
   `sections_site` / `domaines`, mini-builder, site public HTML-first.
2. L2 paiement : Stripe Checkout, acompte, échéancier, caution.
3. L3 messagerie : boîte unifiée email/SMS, puis OTA si le partenaire l'ouvre.
4. L4 pricing : PriceLabs/Beyond, indicateurs occupation/ADR/RevPAR.
5. L5-L7 : Google VR, API publique, marketplace, apps.

Tant que ce pack n'est pas signé, je m'en tiens aux briques
provider-agnostiques et aux vérifications de sécurité.
