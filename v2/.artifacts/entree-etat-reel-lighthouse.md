
- ERGONOMIE V2 2026-11-13 (suite, plan 004 — Lighthouse mesuré) : **SC-004 est
  vérifié et le checkpoint G5 est franchi**. Mesure Lighthouse 13.6.0 (récupérée
  dans le cache `npx`, jamais installée dans le dépôt) exécutée par
  `v2/.artifacts/ergonomie/mesurer-lighthouse.mjs` **sur le build de production**
  (`npm run build` puis `node build`, port 4180) et non sur `vite dev` : 6 routes
  (`/`, `/reserver`, `/voyageur`, `/login`, `/aide`, `/hote`) × mobile et desktop
  = 12 relevés dans `v2/.artifacts/ergonomie/lighthouse-resume.md` (+ un JSON par
  route). Résultat : **performance mobile 100 partout sauf `/reserver` 93 ;
  desktop 100 partout ; CLS ≤ 0,03 ; accessibilité et bonnes pratiques 100**.
  `/hote` et `/voyageur` sont mesurés avec session, via un profil Chrome
  persistant préparé par `.artifacts/ergonomie/preparer-profil-hote.mjs`.
  Corrections issues de la mesure : première carte de `/reserver` en
  `loading="eager"` + `fetchpriority="high"` (l'image LCP était en `lazy`),
  variantes 640 px et 768 px des photos générées par `npm run assets:photos`
  (`sharp` déjà présent via `@sveltejs/enhanced-img`) et servies par
  `srcsetLogement()` — `/reserver` mobile **80 → 93**, page **1 072 → 441 Kio**
  (−59 %). Vitest **257 fichiers / 1 593 réussis / 2 ignorés**, `npm run
  typecheck` **0 erreur / 0 avertissement**, build OK. **Piège de déploiement
  confirmé** : `ORIGIN` n'est pas lu à l'exécution (valeur figée dans
  `build/adapter-node.js` au build) ; sans `PROTOCOL_HEADER`/`HOST_HEADER`
  d'un reverse proxy, `adapter-node` suppose `https` et refuse **tous** les POST
  de formulaire en `403 Cross-site POST form submissions are forbidden` — le
  `Dockerfile` posant déjà ces variables, la production n'est pas affectée.
  **Ce qui reste non vérifié** : les indicateurs humains (SC-001, SC-003,
  SC-005 lecteur d'écran, SC-010, T045, T057, T071, T076, T077, T078, T107), la
  recette super-admin (T103) et le déploiement (T110), soit **13 tâches sur 112**
  — plus le **LCP simulé de `/reserver` mobile à 3,17 s** (> 2,5 s) dû au CSS de
  rendu (66 Kio, 340 ms), report assumé dans `resultats.md` § 4.
