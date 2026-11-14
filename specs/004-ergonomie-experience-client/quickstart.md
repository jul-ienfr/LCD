# Quickstart — Ergonomie globale et expérience client

**Feature**: `004-ergonomie-experience-client`

**But**: reprendre la feature, mesurer la baseline, exécuter une phase et
prouver le résultat sans relire tout le plan.

## 1. Lire les documents dans cet ordre

1. [spec.md](./spec.md) — problème, personas, exigences, critères.
2. [plan.md](./plan.md) — phases, fichiers, gates, stratégie de test.
3. [research.md](./research.md) — audit de l'existant et décisions.
4. [data-model.md](./data-model.md) — navigation, parcours, critères, mesures.
5. [contracts/ergonomie.md](./contracts/ergonomie.md) — contrat par surface.
6. [contracts/navigation.md](./contracts/navigation.md) — navigation staff.
7. [contracts/mesure.md](./contracts/mesure.md) — événements et vie privée.
8. [tasks.md](./tasks.md) — exécution.
9. [checklists/ergonomie.md](./checklists/ergonomie.md) — revue finale.

## 2. Préparer l'environnement

```bash
cd v2
npm ci
docker compose -f compose.dev.yml up -d
npm run db:migrate
npm run db:seed
npm run db:seed-demo        # optionnel : données de démonstration
npm run dev -- --port 4173
```

Ouvrir <http://127.0.0.1:4173>.

Comptes de développement :

| Compte | Mot de passe | Rôle |
|---|---|---|
| `admin@lcd.test` | `ChangeMe-2026!` | à promouvoir super_admin si besoin |
| `super@lcd.test` | `ChangeMe-2026!` | super_admin |
| `presta@lcd.test` | `ChangeMe-2026!` | prestataire |
| `proprio@lcd.test` | `ChangeMe-2026!` | propriétaire |
| `commercial@lcd.test` | `ChangeMe-2026!` | commercial |

## 3. Mesurer la baseline

```bash
cd v2
npm run check
npm test
npm run build
npm run measure:js
npm run test:e2e
```

Puis, après ajout des scripts de la phase 1 :

```bash
npm run audit:a11y:verifier
npm run audit:ergonomie
npm run audit:320
```

Les scripts doivent produire un rapport daté dans
`v2/.artifacts/ergonomie/` (ignoré par Git) :

- `baseline-lighthouse.json` ;
- `baseline-axe.json` ;
- `baseline-320.json` ;
- `baseline-js.json` ;
- `baseline-temps.md` (tests utilisateurs).

## 4. Vérifier une phase

### Phase 0

- [ ] Cartographie des routes et des tâches.
- [ ] Baseline chiffrée.
- [ ] Panel de testeurs confirmé.
- [ ] Top 5 des tâches hôte validé.

### Phase 1

- [ ] `/design` passe axe.
- [ ] 320 px sans débordement.
- [ ] 100 % des contrôles ≥ 44 px.
- [ ] `lang` correct.
- [ ] Dictionnaire public complet dans les 5 langues.

### Phase 2

- [ ] Parcours de réservation en < 3 min pour 80 % des testeurs.
- [ ] Prix, dates et récapitulatif visibles.
- [ ] Sans JS, 320 px, 3G.
- [ ] Lighthouse mobile ≥ 90.

### Phase 3

- [ ] Wi-Fi, accès, départ et urgence au premier écran.
- [ ] Sections repliables et sommaire.
- [ ] Hors ligne et sans JS.
- [ ] 90 % des testeurs trouvent l'essentiel en < 10 s.

### Phase 4

- [ ] 7 entrées principales maximum.
- [ ] Recherche globale partout.
- [ ] Fil d'Ariane.
- [ ] Top 5 des tâches à ≤ 2 clics.
- [ ] Aucun lien hors rôle.

### Phase 5

- [ ] Lighthouse ≥ 90 partout.
- [ ] axe 0 sérieuse/critique.
- [ ] Clavier, lecteur d'écran, zoom 200 %.
- [ ] Budgets JS conservés.
- [ ] Publication de thème bloquée si non conforme.

### Phase 6

- [ ] Deuxième test utilisateur.
- [ ] Comparaison baseline / après.
- [ ] 5 frictions corrigées.
- [ ] Déploiement par surface et retour arrière testé.
- [ ] Registres mis à jour.

## 5. Commandes de contrôle

```bash
cd v2
npm run check          # types + Svelte
npm test               # Vitest
npm run build          # build adapter-node
npm run db:check       # migrations cohérentes
npm run test:e2e       # Playwright js + sans-js
npm run measure:js     # budget JS
```

Tests ciblés :

```bash
npx vitest run tests/ergonomie
npx playwright test e2e/ergonomie.spec.ts
npx playwright test e2e/accessibilite.spec.ts
npx playwright test e2e/tactile-320.spec.ts
```

## 6. Recette manuelle minimale

### Clavier

1. Ouvrir `/`.
2. Tabuler : le skip link doit apparaître en premier.
3. Aller au contenu, ouvrir un logement, choisir des dates.
4. Vérifier que le focus reste visible et qu'aucun piège ne bloque.

### Lecteur d'écran

1. Activer NVDA ou VoiceOver.
2. Vérifier `lang`, `h1`, labels, erreurs et statuts.
3. Parcourir `/voyageur` avec un lien signé.

### Mobile

1. 320×568 et 360×640.
2. Vérifier l'absence de défilement horizontal.
3. Vérifier les cibles ≥ 44 px.
4. Vérifier que la barre d'action ne masque pas le contenu.

### Sans JS

1. Désactiver JavaScript.
2. Réserver un séjour.
3. Signaler un incident.
4. Vérifier les POST natifs et les messages serveur.

### Hors ligne

1. Ouvrir `/voyageur` avec un lien signé.
2. Activer le mode avion.
3. Vérifier que le guide, le Wi-Fi et l'urgence restent lisibles.
4. Rejouer une écriture au retour réseau.

## 7. Definition of Done

Une phase est terminée quand :

- les tâches de la phase sont cochées ;
- les gates sont vertes ;
- `npm run check`, `npm test`, `npm run build`, `npm run db:check` passent ;
- les tests E2E concernés passent ;
- les captures et rapports sont archivés ;
- la documentation (`/design`, `ECARTS-V1.md`, `TESTS-A-FAIRE.md`,
  changelog) est à jour ;
- aucun secret ni donnée personnelle n'a été ajouté.

## 8. Pièges connus

- Ne pas ajouter de JS obligatoire sur le public/voyageur.
- Ne pas ajouter de librairie UI.
- Ne pas ajouter de thème par utilisateur.
- Ne pas modifier les migrations pour l'ergonomie.
- Ne pas mesurer avec un outil qui dépose un cookie tiers.
- Ne pas traduire à la volée : utiliser le dictionnaire typé.
- Ne pas confondre 44 px (cible tactile) et 24 px (minimum WCAG 2.2 AA).
- Ne pas casser le mode lite, le sans-JS ou l'offline.

## 9. Rituel de revue mensuelle (T096)

Une fois par mois, 45 minutes, mêmes personnes que la baseline (une personne
produit, une personne cliente, un développeur). Le rituel est court et
reproductible : on relit les chiffres, on décide, on écrit la décision.

### 9.1 Avant la réunion (15 min, le développeur)

1. Regénérer les mesures à froid, serveur de prévisualisation démarré :

   ```bash
   cd v2
   npm run build && node build &          # ou npm run dev
   node scripts/audit-a11y.mjs                       # axe, entêtes, storage
   node scripts/mesurer-cibles.mjs                   # cibles 44 px, 320 px
   node scripts/audit-ergonomie.mjs                  # audit 320 px
   npx vitest run tests/ergonomie/                   # contrastes, garde-fous
   node scripts/audit-ergonomie.mjs --ecrire --sans-audit   # rapport agrégé
   ```

   Ces commandes n'ont pas de script npm dédié : les lancer directement
   depuis `v2/` (le `package.json` n'expose que `measure:js`).

2. Vérifier que `.artifacts/ergonomie/contrastes.json` est vert : six thèmes,
   clair et sombre, aucun ratio sous 4,5:1, hauteur de contrôle ≥ 44 px.

3. Déposer le rapport agrégé du mois :
   `specs/004-ergonomie-experience-client/baseline/rapport-<AAAA-MM>.md`
   (copie de `v2/.artifacts/ergonomie/rapport-ergonomie.md`).

### 9.2 Pendant la réunion (20 min)

| Sujet | Source | Question |
|---|---|---|
| Parcours P1 | tableau de bord mesure | démarrés / réussis / abandonnés, temps médian |
| Erreurs de formulaire | top 5 des erreurs | quelle étape revient le plus ? |
| Recherche | volume, sans résultat | quelles requêtes échouent ? |
| Accessibilité | `baseline-axe.json`, `rapport-ergonomie.md` | violations axe, débordements, cibles < 44 px |
| Performance | `baseline-js-*.json`, Lighthouse | budgets JS conservés ? |
| Support | tickets liés à la navigation/réservation | combien, sur quels écrans ? |
| Satisfaction | SEQ / retours utilisateur | score, verbatims anonymes |

Règles de la réunion :

- aucun détail nominatif, aucune session individuelle : uniquement des comptes
  et des médianes ;
- pas de refonte de périmètre : on choisit au maximum **trois** corrections ;
- chaque constat est rattaché à une route mesurée.

### 9.3 Après la réunion (10 min)

1. Écrire la décision dans le backlog : trois corrections maximum, chacune avec
   sa route, son critère de réussite et son propriétaire.
2. Si un gate du contrat (`G1`…`G6`) est rouge, ouvrir une tâche prioritaire et
   la traiter avant le mois suivant.
3. Mettre à jour `v2/README.md` (section « Qualité et rituel mensuel ») si une
   commande ou un seuil a changé.
4. Archiver les rapports du mois : ils servent de baseline au mois suivant.

## 10. Protocole de test utilisateurs (T007, T045, T057, T107)

C'est la seule partie du plan qu'un agent ne peut pas exécuter : elle demande des
personnes. Le protocole ci-dessous la rend prête à l'emploi — une session de
2 heures suffit pour le premier round, une seconde pour le round de contrôle.

### 10.1 Ce qui est mesuré

| Critère | Mesure | Cible | Tâche |
| --- | --- | --- | --- |
| SC-001 | demande de réservation réussie, chronométrée, sans aide | 80 % des testeurs en < 3 min | T045 |
| SC-003 | Wi-Fi, accès et heure de départ trouvés sur `/voyageur` | 90 % en < 10 s | T057 |
| SC-002 | 5 tâches hôte (`P-HOTE-5`) atteintes depuis `/hote` | ≤ 2 clics | T008, T071 |
| SC-005 | trois parcours P1 au lecteur d'écran réel | aucun blocage | T076 |
| — | zoom 200 % (reflow) et téléphone réel 320 px | aucun défilement horizontal | T077, T078 |
| SC-010 | SUS après le round, SEQ après chaque tâche | SUS ≥ 80 ou SEQ ≥ 5,5/7 | T107 |

### 10.2 Préparer la session

1. Serveur de démonstration, base `lcd_demo`, avec le formulaire de demande
   public actif (`ENQUIRY_ENABLED=true`) :
   Le shell du poste est PowerShell : les variables d'environnement se posent
   avec `$env:`, pas avec un préfixe à la bash.
   ```powershell
   cd v2
   # exporter d'abord DATABASE_URL et MIGRATION_DATABASE_URL depuis .env.demo.local
   $env:ENQUIRY_ENABLED = "true"
   $env:APP_URL = "http://127.0.0.1:4173"
   $env:BETTER_AUTH_URL = "http://127.0.0.1:4173"
   npm run dev -- --mode demo --port 4173 --host 127.0.0.1
   ```
   Sans `ENQUIRY_ENABLED`, la vitrine ne rend pas le formulaire `?/demande` et
   les tests de demande de séjour échouent à tort.
2. Comptes : `super@lcd.test` / `ChangeMe-2026!` (super-admin),
   `admin@lcd.test` / `ChangeMe-2026!`, puis les comptes de rôle
   `presta@`, `proprio@`, `commercial@lcd.test` (mot de passe dans
   `.env.local`). Créer un compte par testeur hôte depuis
   `/hote/utilisateurs` (rôle `hote`) pour ne pas partager un identifiant.
3. Un lien voyageur signé par testeur (généré depuis l'espace hôte) : ne jamais
   réutiliser le lien d'un autre testeur, il porte des données personnelles.
4. Chronomètre, feuille de relevé (§ 10.5) et consentement à l'enregistrement
   d'écran si la session est filmée.

### 10.3 Déroulé (par testeur, 20 min)

Règles d'animation : le testeur **pense à voix haute**, l'animateur ne touche
jamais la souris, n'indique jamais où cliquer et reformule seulement la tâche.
Toute aide comptabilise la tâche comme échouée.

1. **Voyageur** — « Vous cherchez un logement pour 4 personnes du 12 au 15 du
   mois prochain. Réservez-le. » → chrono, nombre d'erreurs, moment d'hésitation.
2. **Voyageur** — « Vous venez d'arriver. Où est le Wi-Fi ? À quelle heure
   devez-vous partir ? Comment entrez-vous ? » → chrono jusqu'à la réponse.
3. **Voyageur** — « Le chauffe-eau fuit. Signalez-le. » → vérifier que le délai
   et le numéro de suivi sont compris sans explication.
4. **Hôte** — les cinq tâches de `P-HOTE-5` : vérifier le planning du jour,
   répondre à un message, planifier un ménage, suivre une facture en retard,
   modifier une information logement. Compter les clics depuis `/hote`.
5. Après chaque tâche : poser la SEQ (« Sur une échelle de 1 à 7, cette tâche
   était-elle facile ? »).
6. En fin de session : questionnaire SUS (§ 10.4).

### 10.4 Questionnaire SUS (à recopier tel quel)

Barème de 1 (pas du tout d'accord) à 5 (tout à fait d'accord). Score =
(somme des contributions − 10) × 2,5 ; cible ≥ 80.

| # | Affirmation | Contribution |
| --- | --- | --- |
| 1 | Je pense que j'aimerais utiliser ce site souvent. | réponse − 1 |
| 2 | J'ai trouvé le site inutilement complexe. | 5 − réponse |
| 3 | J'ai trouvé le site facile à utiliser. | réponse − 1 |
| 4 | Je pense avoir besoin d'aide pour pouvoir utiliser ce site. | 5 − réponse |
| 5 | J'ai trouvé les fonctions du site bien intégrées. | réponse − 1 |
| 6 | J'ai trouvé qu'il y avait trop d'incohérences dans le site. | 5 − réponse |
| 7 | J'imagine que la plupart des gens apprendront à utiliser ce site très vite. | réponse − 1 |
| 8 | J'ai trouvé le site très lourd à utiliser. | 5 − réponse |
| 9 | Je me suis senti en confiance en utilisant le site. | réponse − 1 |
| 10 | J'ai eu besoin d'apprendre beaucoup de choses avant de pouvoir utiliser le site. | 5 − réponse |

### 10.5 Feuille de relevé

| Testeur | Profil | Tâche | Réussie | Aide | Temps | SEQ | Friction observée | Route |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

À la fin de la session :

1. recopier les frictions dans `v2/.artifacts/ergonomie/frictions.md` (nouveau
   tableau « Panel du <date> », une ligne par friction, avec la route) ;
2. écrire les scores SC-001, SC-003 et SC-010 dans
   `resultats.md` § 6 (les passer de **reporté** à **vérifié** ou **non
   atteint** — ne pas arrondir) ;
3. cocher T045, T057, T107 et le volet humain de T076, T077, T078 ;
4. corriger au maximum trois frictions, puis rejouer les tâches concernées avec
   deux testeurs du round précédent (c'est T058 côté voyageur et T109 côté
   produit).

### 10.6 Recette des 7 rôles (T071) et de la publication de thème (T103)

- **T071** : se connecter successivement en `super_admin`, `admin`, `hote`,
  `operateur`, `comptable`, `presta`, `proprietaire`, `commercial` et vérifier
  trois choses par rôle : la surface d'atterrissage attendue
  (`destinationRole` : `/hote`, `/presta`, `/proprio`, `/commercial`), l'absence
  de lien vers une surface interdite dans la navigation, et l'accès direct par
  URL à une surface interdite (doit rediriger). Attention : `super_admin`
  contourne volontairement tous les gardes et `operateur` est normalisé en
  `hote`.
- **T103** : depuis `/supervision/apparence`, créer un brouillon de thème, le
  prévisualiser, tenter de le publier avec un contraste insuffisant puis avec
  une cible < 44 px (les deux refus doivent être lisibles), corriger, publier,
  vérifier le rendu sur `/hote` puis revenir au thème par défaut.

### 10.7 Lighthouse (T003, T081)

Lighthouse n'est pas installé dans le dépôt et les scripts ne l'installent
jamais. Le script `.artifacts/ergonomie/mesurer-lighthouse.mjs` le récupère dans
le cache `npx` (`npx --yes lighthouse@13 --version` une fois) puis l'exécute
avec `node` — indispensable sous Windows, où `npx` n'est qu'un `.ps1`.

**Mesurer sur le build de production, jamais sur `vite dev`** : les scores d'un
serveur de développement ne sont pas représentatifs (CSS non minifié, modules
séparés).

```powershell
# 1. build, puis serveur de production avec les en-têtes de proxy
$env:ORIGIN = "http://127.0.0.1:4180"; $env:PORT = "4180"; $env:HOST = "127.0.0.1"
$env:PROTOCOL_HEADER = "x-forwarded-proto"; $env:HOST_HEADER = "x-forwarded-host"
npm run build; node build

# 2. session hôte dans un profil Chrome persistant (pour /hote)
$env:BASE = "http://127.0.0.1:4180"; node .artifacts/ergonomie/preparer-profil-hote.mjs

# 3. mesure des 6 routes en mobile et desktop
$env:BASE = "http://127.0.0.1:4180"; node .artifacts/ergonomie/mesurer-lighthouse.mjs les-deux
```

**Piège vérifié le 2026-11-13** : `ORIGIN` n'est **pas** lu à l'exécution.
`build/adapter-node.js` contient `export const origin = <valeur figée au build>`
(`handler.js` retombe alors sur `get_origin(req.headers)`). Sans
`PROTOCOL_HEADER`/`HOST_HEADER`, `adapter-node` suppose `https` et répond
`403 Cross-site POST form submissions are forbidden` à **tous** les POST de
formulaire, connexion comprise : à retenir pour tout déploiement derrière un
reverse proxy.

Routes mesurées : `/`, `/reserver`, `/voyageur`, `/login`, `/aide`, `/hote`
(les deux dernières avec session). Les résultats vont dans
`.artifacts/ergonomie/lighthouse-resume.md` (plus un JSON par route) ; reporter
la note de performance, de LCP et de CLS dans `resultats.md` § 6. Attention :
`npm run audit:ergonomie:ecrire` ne lit **pas** les scores — il constate
seulement la présence de Lighthouse et, sinon, écrit « absent » dans la
section 3 du rapport agrégé ; ce sont les scores relevés ici qui alimentent
SC-004 et T081.