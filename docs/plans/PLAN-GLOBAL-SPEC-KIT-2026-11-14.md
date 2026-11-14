# Plan global Spec Kit — ce qu'il reste à faire

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/spec.md
```

**Date** : 2026-11-14
**Sources** : `docs/analyses/AUDIT-ET-PLAN-DOCUMENTATION-2026-11-14.md`,
`specs/001` à `004`, `docs/registres/etat-reel.md`, `v2/ECARTS-V1.md`,
`v2/TESTS-A-FAIRE.md`, `v2/docs/qa-manuel.md`,
`docs/checklist-taches-restantes.md`.
**But** : traduire l'audit en un plan exécutable avec Spec Kit, sans ajouter de
documentation parallèle.

---

## 1. Réponse courte

**Oui.** La spec 002 est déjà à 85 %, et Spec Kit porte l'essentiel du reste
logiciel. Il manque **une feature** pour tout ce qui n'est ni une
fonctionnalité produit ni une ergonomie :
**005 — mise en production, recette, migration V1 → V2 et bascule**.

Le reste à faire se répartit ainsi :

| Bloc | Reste | Où c'est piloté |
|---|---:|---|
| Décisions L0 | 5 ADR à signer, 7 critères | spec 002, phase 1 |
| Preuves externes | 19 gates (clés, contrats, données réelles) | spec 002 |
| Recette | 155 cases sur 155 + 21 parcours QA | **spec 005, US2** |
| Environnement public | 19 tâches US1 + 25 fondations | **spec 005, US1** |
| Migration V1 → V2 | ~15 tâches | **spec 005, US3** |
| Bascule et extinction V1 | ~18 tâches | **spec 005, US4** |
| Terrain, box, logement | 55 items | `docs/checklist-taches-restantes.md` |
| Documentation | 7 lots D1-D7 | audit §8 |
| Versionnement | 462 entrées non commitées | action P0 immédiate |

**Aucune fonctionnalité produit majeure n'est à développer.** Les 23 tâches
ouvertes de la spec 002 sont des preuves humaines ou externes ; 4 seulement sont
des tests de contrat qui attendent des clés sandbox.

---

## 2. Comment Spec Kit structure la suite

Le projet suit déjà le cycle `spec.md → plan.md → tasks.md → implémentation`.
On garde ce cycle, avec trois règles :

1. **Une feature = un résultat démontrable**, pas un thème. « Mettre la V2 en
   production » est une feature ; « améliorer la qualité » n'en est pas une.
2. **Une preuve = un critère de sortie.** Une tâche n'est `[x]` que si elle cite
   une commande, un fichier de preuve ou un signataire.
3. **Une feature close ne reste pas active.** 001 et 003 seront marquées
   `Terminé`, 004 passera en `Terminé sous réserve` après les validations
   humaines.

---

## 3. Carte des features

| Feature | Objet | État | Reste | Décision |
|---|---|---|---|---|
| **001** i18n staff | Traduction staff | 34/34 | 0 | clôturer |
| **002** parité Lodgify | Produit, canaux, paiement, inbox, pricing, API | 165/194 + 6 partielles | 23 ouvertes, 19 externes | laisser active jusqu'aux gates |
| **003** audit parité | Plan d'exécution de l'audit du 9/11 | 0/74 | 0 utile | **clôturer**, périmètre absorbé par 002/004 |
| **004** ergonomie | Accessibilité, parcours, thèmes | 99/112 | 13 humaines ou déploiement | clôturer après recette |
| **005** mise en production | Environnement, recette, migration, bascule | **créée 14/11** | 96 tâches | **démarrer maintenant** |

### Pourquoi une seule feature 005 et pas 005 + 006

Migration et bascule sont la dernière étape de la mise en production : les
séparer créerait deux plans qui se contredisent sur les données et la fenêtre
de gel. Si la bascule glisse après la mise en production, elle pourra être
extraite en 006 sans réécrire 005.

---

## 4. Détail du reste, feature par feature

### 4.1 Spec 002 — 23 tâches ouvertes, 6 partielles

| Catégorie | Tâches | Ce qui manque | Bloqué par |
|---|---|---|---|
| L0 | T001-T010 | benchmark, avis juridique, 5 ADR, budget | humain |
| US1 distribution | T113, T114, T126, T127 | tests de contrat, e2e sandbox, double-run 14 j | clés Beds24/Channex |
| US2 site/paiement | T229 | réservation payée de bout en bout | Stripe test + domaine |
| US3 inbox | T306 | gate de sortie US3 | preuves T307/T309 |
| US4 pricing | T414 | gate 30 jours | données réelles |
| US5 reporting | T514 | relevé réel envoyé | propriétaire réel |
| US7 API | T713, T718 | Swikly, 3 intégrations live | contrats |
| US8 onboarding | T811 | onboarding en 1 jour | client pilote |
| Convergence | T907, T908 | revue finale, clôture | toutes les preuves |
| Partielles | T110, T209, T307, T309, T404, T810 | sandbox ARI, domaine, email entrant, WhatsApp, PriceLabs, chrono onboarding | externe |

**Conclusion** : 19 tâches sur 23 exigent un tiers ou une décision humaine.
Aucune ne demande de nouvelle fonctionnalité.

### 4.2 Spec 003 — à clôturer

- 0/74, statut « Active », non suivie par Git.
- Son périmètre est livré dans 002 (L4-L7) et 004 (ergonomie).
- Action : bandeau `Statut: Terminé — absorbé par 002 et 004`, conserver
  l'historique, ne plus l'utiliser comme tableau de bord.
- Les tâches encore valides sont listées dans 005 ou dans la checklist terrain.

### 4.3 Spec 004 — 13 tâches, toutes humaines ou déploiement

| Tâche | Blocage |
|---|---|
| T007, T045, T057, T107 | panel de testeurs |
| T008 | validation exploitant |
| T011 | réponses humaines |
| T071, T103 | recette des 7 rôles |
| T076, T077, T078 | lecteur d'écran, téléphone réel, zoom |
| T072 | sans objet (aucun flag n'a existé) |
| T110 | déploiement public (traité par 005) |

Le plan 004 se clôt dès que la recette 005 est signée et que les 11 validations
humaines sont faites ou explicitement différées.

### 4.4 Spec 005 — mise en production, recette, migration, bascule

Quatre histoires, dans cet ordre :

| Histoire | Priorité | Résultat démontrable |
|---|---|---|
| US1 Environnement public sain | P1 | URL HTTPS, schéma à jour, email, sauvegarde, monitoring, rollback |
| US2 Recette complète | P1 | 155 cases + 21 QA exécutées, 0 S1/S2, preuves signées |
| US3 Migration V1 → V2 | P2 | données utiles reprises, réconciliées, import rejouable |
| US4 Bascule et extinction V1 | P3 | trafic sur V2, V1 archivée, retour arrière testé |

Fichiers créés :

```text
specs/005-mise-en-production/
├── spec.md
├── plan.md
├── tasks.md
├── contracts/exploitation.md
└── checklists/requirements.md
```

---

## 5. Ce qui n'entre pas dans Spec Kit

| Sujet | Pourquoi | Où le suivre |
|---|---|---|
| Terrain, box, serrures, énergie, sécurité | matériel et rendez-vous physiques | `docs/checklist-taches-restantes.md` |
| Documentation (index, archives, 18 docs périmés) | méta-projet | audit §8, lots D1-D7 |
| Contrats OTA, PriceLabs, Swikly, WhatsApp | dépendances externes | spec 002, gates |
| Juridique (RC pro, INPI, médiation) | décisions de l'exploitant | `docs/templates/`, `docs/strategie-famille/` |
| Budget et partenaires | ADR L0 | `docs/decisions/` |

---

## 6. Séquence et calendrier proposés

> Dates proposées, à valider. Si L0 n'est pas signé le 15/11, toutes les dates
> suivantes doivent être officiellement décalées.

| Période | Chantier | Sortie |
|---|---|---|
| **14-16 nov** | Sauvegarde Git, décision L0, démarrage 005 | dépôt sauvegardé, cible d'hébergement choisie |
| **17-30 nov** | 005 US1 : serveur, base, migrations, TLS, SMTP, sauvegardes, monitoring | `/api/ready` vert sur une URL publique |
| **1-15 déc** | 005 US2 : recette 155 + 21, corrections | recette signée, 0 S1/S2 |
| **8-19 déc** | 005 US3 : inventaire, mapping, import à blanc, réconciliation | migration rejouable sur copie |
| **15-31 déc** | Répétition de bascule, rollback, preuves | fenêtre de bascule validée |
| **janv. 2027** | 002 gates M1-M2 : double-run, réservation payée | 0 surbooking, 1 paiement réel |
| **févr. 2027** | 002 gates M3-M5 : inbox, pricing, relevé | preuves externes |
| **mars 2027** | 002 gates M6-M7 : API, onboarding | 3 intégrations, client pilote |
| **avr. 2027** | 005 US4 : bascule, hypercare, extinction V1 | V2 seule en production |

Le terrain (55 items) et les contrats externes avancent en parallèle ; ils ne
bloquent pas la mise en production technique, mais bloquent le go-live réel du
logement.

---

## 7. Dépendances et décisions

| Décision | Échéance | Conséquence si absente |
|---|---|---|
| Committer et taguer les 462 entrées | immédiat | aucun déploiement reproductible |
| Signer L0 ou re-dater M0-M7 | 15/11 | calendrier fictif, budget partenaire inconnu |
| Choisir l'hébergement (VPS recommandé) | 17/11 | 005 US1 ne peut pas démarrer |
| Choisir la base (région UE) | 17/11 | conformité RGPD et migrations bloquées |
| Choisir le domaine et le SMTP | 20/11 | emails et cookies de session non prouvés |
| Trancher le sort de l'UI Next | avant 005 US4 | bascule incomplète |

**Recommandation d'hébergement** : VPS Docker + Caddy + PostgreSQL, déjà
outillé (`compose.prod.yml`, `Caddyfile`, `DEPLOIEMENT-VPS.md`, `BACKUPS.md`).
Netlify n'est pas adapté en l'état : `netlify.toml` pointe encore `.next` et le
plan gratuit est épuisé. Cette recommandation doit être entérinée par un ADR
avant provisionnement.

---

## 8. Définition de « terminé »

Une tâche est terminée si :

1. le code est **commité** et la CI est verte ;
2. le test ou la preuve est **exécuté**, avec date et résultat ;
3. la documentation d'exploitation est **à jour** ;
4. le **retour arrière** est possible ou la décision de ne pas en avoir est
   écrite ;
5. le responsable a **signé** la preuve.

Une feature est terminée si toutes ses histoires sont terminées et si son
`tasks.md` ne contient plus de `[ ]` ni de `[~]` sans justification datée.

---

## 9. Prochaines 72 heures

1. **Committer** les 462 entrées en trois lots (specs/docs, code, tests) et
   poser un tag `v2.0.0-rc1`.
2. **Signer L0** ou publier une roadmap re-datée ; sans cela, 005 reste `Draft`.
3. **Trancher l'hébergement** (ADR-06) et créer le domaine.
4. **Exécuter 005 phase 1** : préflight, environnement, rôle applicatif.
5. **Lancer la recette** en parallèle dès que `/api/ready` est vert.

---

## 10. Ce qui a été produit ce jour

- `docs/analyses/AUDIT-ET-PLAN-DOCUMENTATION-2026-11-14.md` — audit complet.
- `docs/analyses/inventaire-documentation-2026-11-14.csv` — 306 documents.
- `docs/plans/PLAN-GLOBAL-SPEC-KIT-2026-11-14.md` — ce plan.
- `specs/005-mise-en-production/` — spec, plan, tâches, contrat, checklist.
