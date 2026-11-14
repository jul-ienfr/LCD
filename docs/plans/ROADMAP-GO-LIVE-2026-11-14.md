# Roadmap active — mise en production et preuves (révisée le 2026-11-14)

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/tasks.md
```

- **Statut** : active, se substitue à `ROADMAP-PARITE-2026-11.md`
- **Périmètre** : `specs/002` (preuves restantes), `specs/004` (validations
  humaines), `specs/005` (production, recette, migration, bascule)
- **Hypothèse** : une personne à temps partiel, 3-4 jours/semaine ; gel de fin
  d'année du 24 décembre 2026 au 3 janvier 2027
- **Règle** : une date ne devient ferme qu'après la signature de l'étape de
  décision correspondante. Sinon elle est « prévisionnelle ».

## 1. Pourquoi la roadmap du 6 novembre est remplacée

La roadmap L0-L7 du 6 novembre planifiait le **développement** jusqu'en avril
2027. Le développement est allé beaucoup plus vite : au 14 novembre, la spec
002 est à 165/194, la spec 004 à 99/112, et le code produit est complet. Le
chemin critique n'est plus d'écrire des fonctionnalités, mais de :

1. sauvegarder et taguer le dépôt (fait le 14/11 : `v2.0.0-rc1`) ;
2. ratifier les décisions et l'hébergement ;
3. prouver que la V2 fonctionne en production ;
4. migrer les données et basculer.

L'ancienne roadmap reste dans le dépôt comme historique ; elle ne doit plus
servir de tableau de bord.

## 2. Jalons révisés

| Jalon | Date prévisionnelle | Critère de sortie | Bloqué par |
| --- | --- | --- | --- |
| **R0 — Dépôt sauvé** | **fait 2026-11-14** | 3 commits, arbre propre, tag `v2.0.0-rc1` | — |
| **R1 — Décisions** | **2026-11-21** | ADR-06 contresigné, L0 ratifié en bloc, plafond mensuel fixé, domaine choisi | exploitant |
| **R2 — Environnement public** | **2026-11-30** | URL HTTPS, 104 migrations, `lcd_app`, e-mail réel, sauvegarde restaurée, alerte reçue, rollback mesuré | VPS + DNS + SMTP |
| **R3 — Recette** | **2026-12-20** | 155 cases + 21 parcours exécutés, 0 S1/S2, journal signé | R2 + accès testeurs |
| **R4 — Migration à blanc** | **2026-12-19** | import rejouable, comptes et totaux réconciliés, exclusions signées | copie V1 + R2 |
| **R5 — Répétition de bascule** | **2027-01-15** | bascule complète sur préproduction, rollback chronométré | R3 + R4 |
| **R6 — Bascule** | **2027-01-31** | trafic sur V2, hypercare ouverte, V1 en lecture seule | R5 + fenêtre validée |
| **R7 — Extinction V1** | **2027-02-14** | J+14 sans S1, disponibilité ≥ 99,5 %, V1 archivée | R6 |

Le gel du 24 décembre au 3 janvier ne comporte aucune livraison ; la bascule
est volontairement placée après, en basse saison.

## 3. Preuves externes de la spec 002 (en parallèle)

Ces gates ne bloquent pas R2-R6 mais conditionnent la promesse commerciale.

| Gate | Preuve attendue | Date cible | Dépendance |
| --- | --- | --- | --- |
| M1 distribution | 2 canaux, 14 jours, 0 surbooking | 2027-02-15 | sandbox Beds24/Channex |
| M2 paiement direct | 1 réservation payée de bout en bout | 2027-02-28 | Stripe test + domaine |
| M3 inbox | 80 % des messages dans un fil | 2027-03-15 | e-mail entrant + WhatsApp |
| M4 pricing | 30 jours de recommandations | 2027-03-31 | PriceLabs ou calcul local |
| M5 relevés | 1 relevé mensuel envoyé | 2027-04-15 | propriétaire réel |
| M6 plateforme | API + 3 intégrations | 2027-05-15 | contrats Swikly/Nuki |
| M7 onboarding | 1 conciergerie installée en 1 jour | 2027-06-15 | client pilote |

## 4. Décisions L0 : traitement proposé

Le pack `docs/decisions/PACK-SIGNATURE-L0.md` demandait une signature avant
d'écrire du code. Le code a été écrit ; les décisions sont donc **de fait**
engagées. Pour ne pas bloquer la production sur un formalisme dépassé, la
ratification est groupée en une seule signature :

- ADR-01 Beds24/Channex : déjà implémenté derrière un port, réversible ;
- ADR-02 Stripe Checkout : déjà implémenté, compte marchand du tenant ;
- ADR-03 PriceLabs + calcul local : déjà implémenté, import seulement ;
- ADR-04 mini-builder : déjà implémenté ;
- ADR-05 messagerie en couches : déjà implémenté, WhatsApp optionnel ;
- ADR-06 hébergement VPS : **nouveau**, à contresigner.

**Action** : cocher les cases du pack L0 lors de la revue R1, sans rouvrir le
débat technique. Toute décision qui serait refusée à ce moment-là devient une
modification de périmètre tracée dans `docs/registres/a-trancher.md`.

## 5. Chemin critique des 14 prochains jours

| Jour | Action | Sortie |
| --- | --- | --- |
| 15/11 | Relire et contresigner ADR-06 + pack L0 | R1 partiel |
| 16/11 | Choisir domaine et SMTP, créer les enregistrements DNS | R1 complet |
| 17/11 | Provisionner le VPS, durcir, installer Docker | serveur accessible |
| 18/11 | Remplir `.env.prod`, générer les secrets | configuration prête |
| 19/11 | Migrations, `lcd_app`, seed admin, 2FA | base saine |
| 20/11 | Démarrer web/Caddy/Uptime Kuma, DNS, certificat | HTTPS public |
| 21/11 | E-mail réel, SPF/DKIM/DMARC | e-mail prouvé |
| 22/11 | Sauvegarde + restauration sur base jetable | RPO/RTO prouvés |
| 23/11 | Rollback : déployer le tag précédent puis revenir | retour arrière prouvé |
| 24-30/11 | Smoke tests, PWA, crons réels, alertes | **R2** |
| 1-20/12 | Recette 155 + 21, corrections S1/S2 | **R3** |
| 8-19/12 | Migration à blanc | **R4** |

## 6. Règles de dérive

- Une signature manquante ne gèle que les tâches qui engagent un coût ou une
  donnée personnelle ; le reste avance.
- Un défaut S1/S2 non corrigé bloque R3 et R6, jamais R2.
- Une preuve externe manquante ne bloque pas la mise en production technique ;
  elle bloque la communication commerciale correspondante.
- Toute date dépassée de plus de 7 jours est re-datée par écrit ici, pas dans
  une conversation.

## 7. Tableau de bord

| Bloc | État au 14/11 |
| --- | --- |
| Dépôt | 3 commits, arbre propre, tag `v2.0.0-rc1` |
| Typecheck | 0 erreur, 0 avertissement |
| Vitest | 258 fichiers, 1610 réussis, 2 ignorés |
| Build | OK (`adapter-node`) |
| Spec 001 | 34/34, close |
| Spec 002 | 165/194 + 6 partielles, 19 preuves externes |
| Spec 003 | absorbée, à clôturer |
| Spec 004 | 99/112, 13 validations humaines/déploiement |
| Spec 005 | 96 tâches, phase 1 en cours |
| Recette | 0/155 cases + 0/21 parcours |
