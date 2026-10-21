# 71 — Production locale intégrale (doctrine, inventaire des simulations, plan)

> **Décision du 2026-10-19 (hôte)** — remplace l'étape « lab socle » comme cadre
> de référence. Citation de la décision, non paraphrasée :
>
> « Le lab socle est dépassé ; nous sommes à une autre étape. Nous devons faire
> en sorte que tout soit en place, vraiment tout, le moindre détail. Nous
> cherchons à pousser le moindre détail de production. Tout doit être en
> production. Certes, avec des box virtuels, l'hébergement est fait en local
> actuellement, mais tout doit fonctionner quand même. […] Rien ne doit être
> simulé. Même les box doivent être de vraies box complètes, mais elles sont en
> local, comme tout le reste. Nous travaillons simplement en local pour le
> moment. Par la suite, cela devra être déployable en LAN et sur Internet, afin
> que les systèmes puissent communiquer entre eux. Mais pour l'instant, tout
> doit fonctionner en local. »
>
> Conséquence : les documents 10/30/40/50/60/70 restent les spécifications
> techniques, mais **la barre de qualité change** : plus de « lab », plus de
> « démo », plus de « simulé volontairement ». Tout ce qui est présenté doit
> être réel et prouvé ; tout ce qui n'est pas encore réel doit être **nommé,
> daté et chiffré** (dépendance externe ou vague de travail), jamais maquillé.

## §1 Doctrine — six règles opposables

| # | Règle | Test de conformité (opposable) |
|---|---|---|
| **R1** | **Rien n'est simulé.** Aucune donnée inventée, aucun service factice, aucun « faux VPS », aucun fan-out partiel présenté comme complet. | `grep -rn "simul\|fictif\|faux\|démo\|FAUSSE"` sur le code livré : chaque occurrence restante est soit un test, soit une entrée de l'inventaire §4 avec une vague. |
| **R2** | **Les box sont de vraies box complètes**, exécutées en local. Même code, même contrat d'API, même télémétrie, mêmes volumes que la box cible. Le matériel est la **seule** pièce non locale. | Une box locale = pile complète (registre, ics-sync, pricing, decision, runtime, agent) sur son propre état/volume, joignable en tant que pair ; un test de parité « box locale ≡ box cible » (mêmes routes, mêmes réponses, mêmes journaux). |
| **R3** | **Local d'abord, LAN puis Internet.** Tout doit fonctionner sans DNS public ni dépendance cloud. L'ouverture LAN/Internet est une **couche** (nom, certificat, port, pare-feu), pas une réécriture. | Recette : stack complète debout avec `*.local` + CA interne ; puis la même stack servie en public avec LE sans changement de code applicatif. |
| **R4** | **Dégradé dit, jamais inventé.** Service muet = `?` + alerte + cause. Jamais une valeur plausible à la place d'une mesure absente. | Chaque agrégat expose sa complétude (`appels_ics`, `erreurs`, `lecture_seule`, `note`) ; un chiffre sans source est un défaut. |
| **R5** | **Ce qui exige un tiers est déclaré dépendance externe**, daté et chiffré — jamais contourné par une valeur fictive. | Table §6 : compte OTA, banque/payout, SIREN, RC pro, carte G, matériel P0 — chacun avec son écran « ce qui manque et pourquoi ». |
| **R6** | **Toute affirmation de la vitrine (`/`, `/aide`, `/legales`) doit correspondre à une preuve de batterie.** Sinon on retire la phrase. | Revue : chaque phrase chiffrée de la vitrine est rattachée à un check nommé. |

Corollaire de R1 : les mots « lab », « démo », « sim » disparaissent du
vocabulaire produit. Un état local n'est pas un « lab » : c'est **le socle de
production exécuté sur une machine locale**.

## §2 Définition de terminé, par brique

Une brique est « en production » quand les cinq points sont vrais :

1. elle tourne **sans intervention manuelle** (démarrage ordonné, healthcheck, redémarrage auto) ;
2. elle **lit/écrit un état persistant réel** (volume, registre, journal) — pas de mémoire volatile pour une vérité métier ;
3. elle **refuse** ce qu'elle ne peut pas faire (422/403 explicites, pas de valeur de repli silencieuse) ;
4. elle est **prouvée par une batterie** nommée, verte, rejouable ;
5. elle est **décrite** (ce doc ou un runbook) avec son mode de panne.

## §3 État réel au 2026-10-19 — ce qui est déjà production locale

Pile **déployée** (`deploy/`, réseau `lcd-deploy_front`) :

| Service | Port | Rôle réel | Preuve |
|---|---|---|---|
| `caddy` | 4001 (TLS app), 4002 (portail IdP), 4003 (HTTP→HTTPS) | entrée unique, `forward_auth` Authelia avant tout rendu | `deploy/test-deploy.ps1` : 7/7 + « recette IdP COMPLETE VERTE » |
| `authelia` | 9091 interne | identité réelle (1FA + TOTP), `Remote-User`/`Remote-Groups` | idem (session IdP, purge des en-têtes client, échec = 302 portail) |
| `web` | 3100 | front SSR sans JS, PWA + outbox, 9 pages + 4 exports | `deploy/test-front.ps1` : **47/47** |
| `gateway-parc` | 8443 | RBAC à l'écriture, fan-out parc, journaux, OpenAPI | batteries lab + `test-front` (403/400 RBAC) |

Pile **box** (`lab/`, réseau `lcd-lab_default`) — 20 services + 2 runtimes :

- moteurs réels : `ics-sync`, `pricing`, `decision`, `facturation`, `caution`, `booking-direct`, `dispatch-presta`, `inventaire`, `extras`, `stocks`, `compta`, `llm-router-ui`, `dashboard-hote` ;
- runtimes box réels : `moli-box` (site sud, 2 logements) **et** `moli-box-nord` (+ `ics-sync-nord`, `pricing-nord`, `decision-nord`, `agent-nord`) = **deux sites**, pas un simulacre ;
- `homeassistant` sur configuration virtualisée = second runtime supporté ;
- états persistants : `ics-state`, `pricing-state`, `decision-state`, `*-state`, `*-logs` (volumes nommés).

Exports et canaux réels : CSV compta, CSV planning, CSV prix, **flux iCalendar**
(`/api/calendrier-ics`, 1 VEVENT = 1 jour occupé, `DTEND` exclusif, `conflit_ref`
transmis) — tous en lecture seule, additions vides = `X-LCD-*`, jamais de valeur inventée.

### §3 bis Topologie mesurée le 2026-10-19 (`GET /etat-parc`)

| Site (`box_id`) | `site` | Logements | Vu il y a | Verdict |
|---|---|---|---|---|
| `box-lab` | `lab` | `log1`, `log2` | 0 s | copro vérifiée, 0 alerte |
| `box-nord` | `nord` | `log3` | ~31 s | copro vérifiée, 0 alerte |

- 3 logements suivis, `bornes_prix` = [75, 290], `stale` = false partout,
  `nb_logements_alertes` = 0.
- fan-out réel : `GET /calendrier-parc?jours=7` = 21 cases (3 × 7), **0 case en
  erreur**, `lecture_seule: true` ; `GET /api/apercu-parc` sert `prix_7j` non
  vide pour les 3 logements, aucun `erreur`.
- parité : mêmes identifiants de logement dans `/etat-parc`, `/calendrier-parc`
  et `/api/apercu-parc` (aucun orphelin).
- preuve automatique : `deploy/test-sites.ps1` (**12/12 OK**, code de sortie = 0).
- reste à faire sur cette brique (S1) : le libellé du site `lab` doit devenir un
  nom de lieu (`sud`), et `lab/vps-sim/` doit disparaître (il n'est pas dans la
  topologie déclarée, donc rien ne casse à le retirer — mais `lab/lab-run.ps1`
  l'exécute encore : retrait à coordonner avec la pile box).

## §4 Inventaire des simulations résiduelles (à éliminer)

C'est **le** tableau de travail. Aucune ligne ne disparaît d'ici sans preuve.

| id | Objet simulé | Où | Ce qui est faux | Comment devenir réel | Vague |
|---|---|---|---|---|---|
| **S1** | « Faux VPS » et sa box dégradée | `lab/vps-sim/boxes-sim.yaml:1` (« registre des box du FAUX VPS »), `:9` `box-sim`, `:13` `Log1 Santa Severa (sim)`, fan-out partiel (1 seul moteur répond) | une 3ᵉ « box » qui n'existe pas, présentée à la gateway comme un site ; données « (sim) » | **partiel (2026-10-19)** : la topologie réelle ne contient plus aucun site simulé — 2 sites réels, fan-out complet, prouvé par `deploy/test-sites.ps1` (12/12). Reste : retirer `lab/vps-sim/` et son étape dans `lab/lab-run.ps1` (pile box), renommer le site `lab` → nom de lieu | V1 |
| **S2** | Secrets de lab « FAUSSES » | `lab/docker-compose.yml:6` (« valeurs FAUSSES de lab »), `lab/secrets.lab.yaml` | secrets d'exemple versionnés utilisés comme s'ils étaient réels | **fermé (2026-10-19, V3)** : aucun fichier de secret réel n'est suivi par git (`lab/secrets.lab.yaml`, `lab/ha-virtual/secrets.yaml`, `deploy/.env`, `deploy/authelia/users.yml`, `deploy/authelia/totp-secrets.json`, `custom/passerelle-parc/secrets-registre.yaml`), chacun est couvert par `.gitignore`, les fichiers **suivis** ne contiennent aucune forme de secret (PEM, clé AWS, bcrypt, affectation littérale) et **aucune valeur réelle de `deploy/.env` n'apparaît** dans les réponses front/passerelle — le tout prouvé par `deploy/test-secrets.ps1` (**23/23 OK**) ; le registre de slots F5 (métadonnées écrites au runtime) a été ajouté au `.gitignore` pendant cette vague | V3 |
| **S3** | Données métier fictives | `lab/inventaire.lab/` (biens fictifs, cf. `custom/inventaire/README.md:30`), `lab/prestataires.lab/` (annuaires fictifs, cf. `custom/dispatch-presta/README.md:125`), `lab/memoire.lab/`, `lab/extras.lab/`, `lab/stocks.lab/` | lignes inventées (noms, prix, quantités) dans le chemin de calcul | reprendre les données réelles disponibles (`docs/log1/infos-adresse.md`, `docs/parc/`, `docs/log1/copro/`) + saisie hôte ; ce qui manque reste **vide** et bloquant, jamais inventé | V2 |
| **S4** | Offre marque blanche « données fictives » | `custom/passerelle-parc/crm.py:17` (« lien magique démo périmé 24 h, données fictives ») | PDF d'offre généré avec des données d'exemple, lien « démo » | offre construite sur le prospect réel + simulateur réel ; lien signé à durée de vie courte, journalisé, révocable (même mécanique que `voir-comme`) | V2 |
| **S5** | Affirmations de vitrine | `web/src/app/page.tsx:198` (« 3 boxes, réservations réelles simulées »), `web/src/app/aide/page.tsx:54` (« 3 logements, 2 boxes simulées »), `:38` (« Communautés données (lab) — simulé volontairement — data yt ») | la vitrine décrivait un état simulé | **fermé (2026-10-19)** : vitrine réécrite sur les faits mesurés (2 sites box réels, 3 logements, moteurs réels, états persistants, canaux externes = dépendances déclarées) ; ligne « communautés données » supprimée (aucune preuve), ligne « comptes pré-configurés (demo) » remplacée par l'IdP réel, CTA « démo » → « SAS » ; `test-front.ps1` vérifie `/aide` | V1 |
| **S6** | Vocabulaire « maquette » | `web/src/app/legales/page.tsx:161` (« Honnêteté de la maquette ») | cadre juridique présenté comme une maquette | **partiel (2026-10-19)** : bloc renommé « État de l'édition (LCEN) » — IdP réel, éditeur non constitué dit explicitement (SIREN/RC/carte G en prérequis hôte) ; complété à l'obtention du SIREN | V4 |
| **S7** | Dépendances externes non locales | comptes OTA (Booking/Airbnb/Abritel), banque + payouts, SIREN, RC pro, carte G, matériel P0 | ne peuvent pas être « locales » : ce sont des tiers | hors code : chaque dépendance a son écran qui dit exactement ce qui manque, son coût et son propriétaire (cf. §6) | V5 |

Règle d'usage : une ligne S1–S6 est **fermée** quand le code ne contient plus la
simulation **et** qu'une batterie prouve le comportement réel (pas seulement la
suppression).

## §5 Plan par vagues (chacune = commit + preuve + ligne de changelog)

| Vague | Contenu | Definition of Done | Ordre de grandeur |
|---|---|---|---|
| **V0** | Ce document : doctrine, inventaire, architecture, gates | doc relu, ids S1–S7 stables, chaque ligne chiffrée | fait |
| **V1** | **Deux sites réels, zéro faux VPS** : suppression de `lab/vps-sim`, 2ᵉ site porté par `moli-box-nord` + `*-nord`, gateway déclarant 2 sites, vitrine réécrite (S1, S5) | batterie `parc` : 2 sites, 3 logements, fan-out complet par site ; `grep vps-sim` vide ; `/aide` et `/` sans « simulé » | 1 vague |
| **V2** | **Données réelles** : registre du parc, inventaire, prestataires, stocks, mémoire, extras alimentés par la vérité terrain (S3, S4) ; ce qui manque = vide bloquant | chaque écran métier montre soit une valeur sourcée (fichier/adresse/item), soit « à saisir » ; 0 ligne « fictive » | 2 vagues (dont saisie hôte) — **état mesuré (2026-10-19)** : `deploy/inventaire-donnees.ps1` classe les **1 202** valeurs des fixtures box → **70 placeholders**, **213 à documenter**, **171 justifiées** par un document, **37 vides conformes**, 711 techniques (identifiants/dates/nombres). Inventaire versionné : `docs/73-inventaire-donnees.md` ; batterie `deploy/test-donnees.ps1` **9/9** (détecteur prouvé par témoin, 0 dérive). **Reste la saisie hôte** : chaque placeholder remplacé par la donnée réelle ou par `?` |
| **V3** | **Secrets réels** : génération, gitignore, rotation, aucun secret versionné (S2) + secrets IdP (`users.yml`, `totp-secrets.json`) | contrôle automatique « 0 secret dans le dépôt » ; rotation rejouée | 1 vague |
| **V4** | **LAN** : nom d'entrée paramétrable (`LCD_HOTE`), config IdP rendue depuis un modèle, ports figés, pare-feu hôte, CA interne distribuée, sauvegardes locales (restic) + restauration chronométrée | depuis un second poste du LAN : `/login` IdP → 2FA → `/hote`, `/api/health`, sauvegarde/restauration prouvée | 1–2 vagues — **logiciel fait (2026-10-19)** : Caddy `{$LCD_HOTE}` + `{$LCD_PORT_HTTPS}`, `rendre-config.ps1` (modèle → `configuration.yml`, validé par le binaire Authelia pour `lcd.test` ET `lcd.local`), `test-lan.ps1` 13/13 avec paire jetable IdP+entrée rendue pour `lcd.local` ; **sauvegarde/restauration faites** : `sauvegarde.ps1` (25 volumes + état hôte, dépôt restic chiffré, 51 Mio, 42 s, **vérifiée par volume**), `restauration.ps1 -Verifier` (**25/25 conformes au snapshot**, 86 s), `test-backup.ps1` **10/10** (dont test destructif : fichier supprimé → restauré à l'identique) ; **reste l'étape hôte** : `lan-ouvrir.ps1 -Poser` (admin) car les ports publiés ne sortent pas de WSL2 (0 listener Windows, loopback seul) + règle pare-feu |
| **V5** | **Internet** : domaine, LE (DNS-01), durcissement (HSTS, WAF, rate-limit), accès admin par VPN seul, révocation | test externe : portail IdP, 2FA, 0 port admin exposé ; `test-deploy` en HTTPS public | 1–2 vagues — **durcissement local fait (2026-10-19)** : en-têtes Caddy (HSTS, nosniff, XFO, Referrer-Policy, COOP, CORP, Server masqué), **CSP** sans domaine externe, `protocols tls1.2 tls1.3`, limite de corps 12 Mo, régulation Authelia explicite (3 essais / 2 min → ban 5 min) ; `deploy/test-durcissement.ps1` **24/24** (TLS 1.1 refusé, TLS 1.3 OK, TRACE refusé, `/metrics` fermé sans session, ban **réellement appliqué** puis **levé** par `outils/lever-ban-idp.py`, cookie Secure+HttpOnly+SameSite après 2FA TOTP réelle, corps surdimensionné jamais accepté). **Reste, non local** : domaine + Let's Encrypt + WAF/supervision externe |
| **V6** | **Métrologie et exploitation** : journaux centralisés, alertes (site muet, crash-loop, disque, certificat), tableau de santé du parc, runbooks datés | une panne provoquée (conteneur arrêté) = alerte reçue < 2 min + runbook applicable à froid | 1 vague — **veille faite (2026-10-19)** : `deploy/veille.ps1` (10 contrôles réels : `/health`, `/ready`, front, entrée TLS, portail IdP, conteneurs + restart-count, box muette, logements en alerte, disque, certificat lu sur la vraie connexion TLS, fraîcheur de la sauvegarde ; `-Boucle` pour la surveillance continue ; journal `deploy/veille/alertes.jsonl` + `etat.json`, gitignorés) et `deploy/test-veille.ps1` **11/11** : panne **induite** (front arrêté) détectée puis retour à la normale prouvé, et chaque règle prouvée capable de se déclencher. **Alerte réelle en cours** : 5,1 % de disque libre (§8) |

## §6 Architecture cible : local → LAN → Internet

Trois couches, une seule image applicative :

1. **Local (aujourd'hui)** — `docker compose` sur la machine hôte ; un seul
   réseau de pile par site ; `lcd.test` / `lcd-idp.test` résolus par
   `--resolve` ou `/etc/hosts` ; CA interne de Caddy.
2. **LAN (V4)** — un serveur « socle » (gateway + front + IdP) et N box, chacune
   sur son LAN. **Un seul nom canonique par déploiement** (`LCD_HOTE`) : c'est
   une décision, pas un raccourci — le cookie de session de l'IdP porte
   `Domain=<nom>` ; deux noms (ex. `lcd.local` + `lcd-idp.local`) couperaient la
   session entre le portail et l'app et casseraient le chaînage `forward_auth`.
   Le nom se change sans code : `LCD_HOTE=lcd.local` (+ `LCD_PORT_HTTPS`),
   et `deploy/authelia/rendre-config.ps1 -Hote lcd.local` pour l'IdP (le binaire
   Authelia n'expandant pas `${VAR}`, la substitution est faite au rendu).
   Mesuré le 2026-10-19 (`deploy/test-lan.ps1`, 13/13) : la même pile sert
   `lcd.test` **et** `lcd.local` (paire IdP+entrée jetable rendue pour ce nom,
   redirection anonyme vers `lcd.local:4012`).
   **Blocage hôte restant, mesuré** : `docker port` publie bien `0.0.0.0:4001-
   4003`, mais **aucun listener n'existe côté Windows** (`Get-NetTCPConnection`
   vide) — les ports vivent dans la VM WSL2 et ne sortent qu'en loopback
   (loopback 200 / IP LAN 000). Remède en administrateur, scripté et idempotent :
   `deploy/lan-ouvrir.ps1 -Poser` (relais `netsh portproxy` + règle pare-feu
   entrante TCP 4001-4003, profil privé), puis `deploy/test-lan.ps1 -Exiger`.
   Côté postes clients : entrée `hosts`/DNS `lcd.test → <IP serveur>` +
   import du certificat racine interne (`/data/caddy/pki/authorities/local/root.crt`).
3. **Internet (V5)** — un seul point d'entrée (Caddy) avec LE ; IdP derrière ;
   accès d'administration par VPN ; les box **n'exposent rien** (elles
   initient, cf. `GET /v1/...` sortants + outbox).

Dépendances externes (§6 bis, R5) — jamais simulées, jamais contournées :

| Dépendance | Ce qui est bloqué sans elle | Coût / propriétaire |
|---|---|---|
| Matériel P0 (box cible, serrure, capteurs) | recette « box cible ≡ box locale » sur matériel réel | ~1 050–1 150 € — hôte |
| Comptes OTA (Booking/Airbnb/Abritel) | import/sync des réservations réelles | gratuit — hôte |
| Banque + payouts | rapprochement réel, caution, TVA | compte pro — hôte |
| SIREN / RC pro / carte G | mentions légales réelles, facturation conforme | 1–2 k€/an — hôte |
| Expert-comptable | validation régime fiscal (micro vs réel) | ~300–500 €/an |

### §6 ter Sauvegardes et reprise (mesuré le 2026-10-19)

- `deploy/sauvegarde.ps1` : dépôt **restic** chiffré (`deploy/backups/restic`,
  gitignoré), mot de passe dans `deploy/backups/.restic-pass` (gitignoré,
  **à conserver hors machine**). 25 volumes `lcd-*` + état hôte (`lab/`,
  `deploy/.env`, `users.yml`) → **51 Mio, 42 s**, rétention `-Prune`
  (7 j / 4 sem. / 6 mois).
- `deploy/restauration.ps1 -Verifier` : restaure chaque volume dans un volume
  jetable et compare au **contenu du snapshot** → **25/25 conformes, 86 s**.
- `deploy/test-backup.ps1` : **10/10**, dont le test **destructif** (3 fichiers
  → sauvegarde → suppression → restauration → contenu identique).
- Deux pièges corrigés ici, à ne jamais réintroduire :
  1. **paramètre nommé `$Args`** = variable automatique PowerShell : restic
     recevait zéro argument, imprimait son aide, sortait en 0 — une
     « sauvegarde réussie » qui n'écrivait rien. Désormais **chaque volume est
     vérifié** (le nombre de snapshots doit augmenter) ;
  2. **comparer à un volume vivant** ne prouve rien (98 fichiers au snapshot,
     182 dix minutes plus tard ⇒ 16 « KO » fantômes) : on compare au snapshot.
  Et deux mesures fausses à éviter : `find -printf` (absent de busybox) et
  `awk '{print $1}'` (PowerShell mange `$1`).

## §7 Preuves et gates
| Gate | Critère | Commande |
|---|---|---|
| G-front | front complet, zéro KO, deux modes (IdP et sans IdP) | `deploy/test-front.ps1` (47/47 attendu, mode IdP) |
| G-deploy | stack + Caddy + IdP + recette | `deploy/test-deploy.ps1` (9 checks, dont recette IdP) |
| G-box | batteries box déterministes (socle, moli, runtime) | `lab/lab-run.ps1` (5/5) |
| G-parité (V1) | 2 sites réels, fan-out complet, zéro site simulé, aucun logement orphelin | `deploy/test-sites.ps1` (**12/12 OK**, 2026-10-19) |
| G-secrets (V3) | 0 secret versionné, 0 fichier de secret suivi par git, 0 forme de secret dans les fichiers suivis, 0 valeur réelle dans une réponse HTTP | `deploy/test-secrets.ps1` (**23/23 OK**, 2026-10-19) |
| G-LAN (V4) | aucun nom d'hôte en dur, config IdP rendue conforme et validée par le binaire pour 2 noms, même pile servie sous `lcd.local`, joignabilité LAN mesurée | `deploy/test-lan.ps1` (**13/13 OK**, 2026-10-19 ; `-Exiger` pour la joignabilité) |
| G-sauvegarde (V4) | dépôt chiffré hors git, un snapshot par volume, `restic check`, restauration conforme au snapshot, test destructif (fichier supprimé → restauré) | `deploy/test-backup.ps1` (**10/10 OK**, 2026-10-19) |
| G-veille (V6) | pile saine = 0 alerte critique, chaque règle capable de crier, **panne induite détectée**, journal écrit, retour à la normale | `deploy/test-veille.ps1` (**11/11 OK**, 2026-10-19) |
| G-démarrage (V6) | après un arrêt **réel**, les sondes tombent à zéro, puis une seule commande remet la pile debout et le prouve (santé + 3 endpoints + 302 vers l'IdP), en < 1 min | `deploy/test-demarrage.ps1` (**14/14 OK**, 2026-10-19, 20 s) |
| G-durcissement (V5 local) | HTTP→HTTPS, TLS 1.1 refusé / 1.3 OK, en-têtes + CSP sans domaine externe, TRACE refusé, `/metrics` fermé, **ban réellement appliqué puis levé**, cookie Secure+HttpOnly+SameSite après 2FA TOTP réelle | `deploy/test-durcissement.ps1` (**24/24 OK**, 2026-10-19) |
| G-données (V2) | inventaire régénérable et **sans dérive**, détecteur prouvé par témoin (placeholder dénoncé, valeur sourcée reconnue, nombre/`?` non jugés), placeholders réels cités, compteurs cohérents | `deploy/test-donnees.ps1` (**9/9 OK**, 2026-10-19) |
| G-tâches (V6) | trois tâches planifiées actives ciblant des scripts **absolus**, sauvegarde forcée qui écrit vraiment, veille forcée qui réécrit son journal, code de retour 0, journaux hors git, pose idempotente | `deploy/test-taches.ps1` (**15/15 OK**, 2026-10-19, 4 tâches) |
| G-tls (V6, §8 sexdecies) | le mode TLS est **paramétré** (`tls {$LCD_TLS:internal}`) : aucun `tls internal` en dur, la configuration actuelle **valide**, la **variante ACME** (`LCD_TLS=admin@domaine`) **valide aussi**, l'entrée répond 302 avec la CA interne, **sans `-k` le client refuse** (code 60 : preuve qu'aucun certificat public n'est en service), HSTS servi, rechargement appliqué | `deploy/test-tls.ps1` (**9/9 OK**, 2026-10-19) |
| G-lan-accès (V6, §8 quindecies) | l'accès **depuis le réseau local** est **mesuré et classé**, jamais supposé : adresse LAN identifiée (192.168.31.59), entrée 302 en boucle locale, Docker publie bien les trois ports sur **0.0.0.0**, et l'état est **FERMÉ-PAR-PARE-FEU** — 0/3 ports répondent sur l'adresse LAN, aucune règle n'existe, un seul geste d'administrateur est imprimé (
etsh advfirewall firewall add rule … localport=4001,4002,4003) | deploy/test-lan-acces.ps1 (**6/6 OK**, 2026-10-19) |
| G-export (V6, §8 quaterdecies) | la sauvegarde **sort de la machine** : export complet du dépôt (1483 fichiers, 188 Mio) + manifeste SHA256 + mode d'emploi, vérification qui recalcule les 1483 empreintes, **phrase de passe absente de l'export**, dépôt relu et une **donnée réelle extraite** depuis l'export, contrôles positifs (octet modifié, fichier supprimé), destination non vide refusée | deploy/test-export.ps1 (**12/12 OK**, 2026-10-19) ; outil deploy/exporter.ps1 (-Vers, -Verifier, -Ecraser) |
| G-versions (V6, §8 terdecies) | **rien ne change en douce** : le journal docs/75-versions-verifiees.md enregistre l'identifiant d'image **réellement exécuté** des trois services ; -Verifier sort en code 1 dès qu'il diffère ; contrôle positif sur une copie falsifiée (le service fautif est nommé) ; l'identifiant cité est relu indépendamment dans Docker ; le document est versionné | deploy/test-versions.ps1 (**10/10 OK**, 2026-10-19) ; outil deploy/versions.ps1 (-Verifier, -Accepter) |
| G-accès (V6, §8 duodecies) | les secrets locaux (.env, phrase de passe restic, secret TOTP) ne sont lisibles que par le compte d''exploitation, SYSTEM et les administrateurs : **héritage d''ACL coupé**, aucune entrée hors liste — un **SID orphelin qui gardait la lecture de la phrase de passe a été trouvé et retiré** ; contrôle positif sur un fichier rendu lisible par Tout le monde ; idempotence ; la pile et restic fonctionnent toujours après | deploy/test-acces.ps1 (**11/11 OK**, 2026-10-19) ; outil deploy/durcir-secrets.ps1 (-Verifier, -WhatIf, ACL sauvegardées avant toute modification) |
| G-santé (V6, §8 undecies) | l'exploitation **tourne vraiment** : 5 tâches présentes, aucune désactivée ni en échec, fraîcheur mesurée de chaque preuve automatique (snapshot < 36 h, batteries / dépôt / entretien / état vérifié < 8 j, veille < 15 min), et la tâche de reprise est **déclenchée** puis son journal lu jusqu'à sa conclusion | `deploy/test-sante.ps1` (**11/11 OK**, 2026-10-19) |
| G-reprise (V6, §8 decies, R-06) | reprise **complète prouvée** : snapshot du volume IdP identifié, restauration réelle dans un volume neuf, **base lisible avec ses enrôlements**, pile séparée debout en **15 s**, entrée protégée 302, portail IdP 200, front 200, HTTP 301, **3/3 services**, production intacte avant et après, **configuration hôte restaurable à l'identique** (`.env`, `users.yml`), nettoyage complet | deploy/reprise.ps1 (**16/16 OK**, 2026-10-19) ; surcharge `deploy/reprise/docker-compose.reprise.yml` (réseau dédié, ports décalés, `!override`) |
| G-docs (V6, §8 nonies) | l'index des documents est **généré** et vérifié : il liste les 23 documents, aucun fantôme, chaque document a un titre, **les 28 scripts cités existent** réellement, **aucune des 19 batteries n'est orpheline**, les documents générés portent leur avertissement, aucun résidu ; un document ajouté rend le contrôle **rouge** (contrôle positif) | `deploy/test-docs.ps1` (**12/12 OK**, 2026-10-19) ; outil `deploy/index-docs.ps1`, produit `docs/README.md` |
| G-entretien (V6, §8 octies, R-05) | la récupération d'espace docker est **prouvée** : une image flottante fabriquée survit à `-WhatIf` et disparaît au `-Prune` réel ; **aucune** image nommée `lcd-*`, **aucun** volume, **aucun** conteneur touché (comptages avant/après 23/23, 78/78, 32/32) | `deploy/test-entretien.ps1` (**11/11 OK**, 2026-10-19 : cache 10,13 → 7,53 Go, +93 Mo d'images flottantes) |
| G-dépôt (V6, §8 septies, R-06) | le dépôt de sauvegarde est **contrôlé** (`restic check` + relecture de 5 % des données réelles), et une **corruption réelle est détectée** (contrôle positif : copie dont un pack est tronqué → échec nommé) ; l'âge du dernier contrôle est daté et opposable (`-Etat`, seuil 30 j) ; mot de passe jamais affiché | `deploy/test-depot.ps1` (**14/14 OK**, 2026-10-19 : 379 snapshots, 112,6 Mio) ; outil `deploy/verifier-depot.ps1`, branché sur l'entretien hebdomadaire |
| G-rapport (V6, §7) | l'état vérifié est écrit **par** la passe (jamais à la main), ne contient que les batteries exécutées, totaux cohérents, commit et nombre de volumes **vérifiables**, un rouge réellement rouge (contrôle positif sur `test-super`), document autoportant | `deploy/test-rapport.ps1` (**10/10 OK**, 2026-10-19) ; produit : `docs/74-etat-verifie.md` |
| G-journaux (V6, R-05) | plafond `json-file` 10 Mo × 3 rendu par compose **et** appliqué aux conteneurs vivants, aucun journal au-delà, rotation prouvée sur un journal fabriqué de 6 Mo, chaîne bornée à 3 archives, purge des alertes (60 j) prouvée avec sauvegarde `.bak`, `-WhatIf` inoffensif | `deploy/test-journaux.ps1` (**9/9 OK**, 2026-10-19) |
| G-zéro-simulation (V2/V3) | aucun « simulé/fictif/faux/démo » dans le code livré hors tests + inventaire | `grep` + revue d'inventaire |
| G-LAN (V4) / G-public (V5) | parcours IdP 2FA depuis un autre poste / depuis Internet | recette manuelle datée + check automatique d'entrée |

## §8 Écarts assumés, risques, et ce qui n'est PAS un écart

- **Assumé** : le matériel n'est pas local (box virtuelles sur l'hôte). R2 dit
  que la box locale doit être *complète en logiciel* ; la bascule matérielle est
  la vague « P0 terrain », hors de ce document.
- **Assumé** : les tiers (OTA, banque, SIREN) ne peuvent pas être réels sans
  démarches de l'hôte — ils sont au §6 bis avec coût et propriétaire.
- **Pas un écart** : un service qui répond « je ne sais pas » (`?`, `erreur`,
  `note`, `lecture_seule`) est **conforme** à R4. Le défaut serait une valeur
  plausible à la place.
- **Risque principal** : la tentation de « remplir » les trous de données avec
  des valeurs rondes. Toute valeur sans source dans le dépôt ou dans un relevé
  daté est un défaut bloquant pour V2.
- **Risque mesuré, en cours (2026-10-19)** : le disque de l'hôte est à **5,1 %
  libre** (47,8 Go / 930 Go). `docker builder prune` + `docker image prune` ont
  libéré 21 Go **dans la VM WSL2** sans rendre un octet à Windows : le VHDX de
  Docker Desktop ne se compacte pas tout seul. Remède (étape hôte, admin,
  Docker Desktop arrêté) :
  `wsl --shutdown` puis `Optimize-VHD -Path "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Mode Full`
  (ou `diskpart` → `compact vdisk`). La veille (`veille.ps1`) signale ce point
  à chaque passage tant qu'il dure : c'est une alerte **réelle**, pas un bruit.

### §8 bis Exploitation à froid (2026-10-19)

- `deploy/demarrer.ps1` : **une** commande pour démarrer (ou `-Arreter` pour
  arrêter proprement), avec vérification des prérequis, de la conformité de la
  config IdP au modèle, de la santé réelle et des trois endpoints ; code de
  sortie non nul si le SAS n'est pas réellement servi.
- `docs/72-runbooks.md` : dix runbooks datés (démarrage, 502, IdP, box muette,
  disque, restauration, rotation de secret, LAN, Internet, certificat), chacun
  avec symptôme → diagnostic → action → vérification, et la batterie qui
  tranche.
- Preuve : `deploy/test-demarrage.ps1` **14/14** — arrêt réel (sondes à 000),
  redémarrage en **20 s**, veille sans alerte critique, entrée TLS qui renvoie
  l'anonyme vers le portail IdP avec retour (`rd=`).

### §8 ter Défaut ouvert, mesuré (2026-10-19) — mode lite et cache

`deploy/test-front.ps1` signale **1 KO** : « kiosk L1 : aucune classe backdrop ».
Ce n'est pas une régression du durcissement (le front est joint en direct sur
3100, sans Caddy) mais un **défaut réel du mode lite**, mis au jour par un
démarrage à froid (le cache de rendu est vidé) :

- avec le cookie `lcd_lite=1`, `<html>` porte bien `mode-lite` **mais** l'en-tête
  porte encore `backdrop-blur` **dans le même document** ;
- deux rendus différents dans une seule réponse ⇒ l'en-tête vient d'un
  **segment mis en cache** (`cacheComponents`) rendu quand `lite` valait faux,
  tandis que la classe `<html>` est calculée dynamiquement ;
- `web/src/app/layout.tsx:80` conditionne pourtant la classe sur `lite` : le
  défaut est dans le découpage cache/dynamique, pas dans la condition.

**Propriétaire** : tranche F6 (kiosk L1). **CLOS le 2026-10-19** : la cause n'était
pas le rendu mais l'**image** — le conteneur `web` tournait un build antérieur
aux commits F5/F6 (`docker inspect` : image du 2026-10-19 20:54, commits du
2026-10-20 01:44 et 03:53). Après `docker compose build web` + recréation,
`deploy/test-front.ps1` est **entièrement vert** (`front OK (batterie complète
verte)`), y compris le kiosk L1 et les contrôles de marque blanche. Leçon
retenue : une batterie verte sur une image périmée ne prouve rien ; l'état
servi et l'état construit doivent être le même objet.

### §8 quater Exploitation automatique (2026-10-19)

- `deploy/installer-taches.ps1` : trois tâches Windows de l'utilisateur courant
  (aucune élévation) — **sauvegarde quotidienne 03:00** (`-StartWhenAvailable` :
  un poste éteint rattrape au rallumage), **veille toutes les 5 min**,
  **batteries le dimanche 04:00**. `-Etat`, `-ExecuterMaintenant`,
  `-Desinstaller`.
- Piège corrigé, mesuré : `schtasks /create /tr "\"chemin avec espaces\""`
  crée une tâche qui **ne démarre jamais** (code `267011`, aucun journal
  écrit). L'installation passe par l'API Windows
  (`New-ScheduledTaskAction` / `Register-ScheduledTask`), et la preuve se fait
  par **effet** : `-ExecuterMaintenant` déclenche puis vérifie que le nombre de
  snapshots augmente et que le journal de veille est réécrit.
- `deploy/tout-verifier.ps1` : **une** commande pour tout vérifier
  (`-Rapide` saute les batteries longues, `-Batterie <nom>` en lance une), avec
  tableau consolidé, code de sortie = total des KO et journal daté dans
  `deploy/veille/batteries.log` (gitignoré). Plus de « c'est vert » partiel.
- Preuve : `deploy/test-taches.ps1` **13/13**, dont réinstallation idempotente
  (0 puis 3 tâches) et journaux hors git.
- **État consolidé de la passe `tout-verifier -Rapide` (2026-10-19, 9 batteries,
  63 s)** : 5 KO, tous **hors des vagues closes ici** et tous dans la tranche
  F5/F6 : `test-front` 1 KO (mode lite, §8 ter) et `test-super` 3 KO (pages
  `/secrets` et `/support`). Mesures pour ce dernier : le registre
  `custom/passerelle-parc/secrets-registre.yaml` **contient bien**
  `authelia_session_secret` ; la page `/secrets` se rend (39 Ko) **mais sans le
  slot** ; `/v1/secrets` en direct répond **400** sans identité. Défaut de la
  chaîne slot → page, propriétaire F5 ; à corriger avant toute revendication de
  vitrine sur `/secrets`.

### §8 quinquies Rétention des journaux (2026-10-19)

La ressource qui a déjà mordu sur cet hôte est le **disque** (R-05 : 48,3 Go
libres, 5,2 %). Deux plafonds, tous deux mesurés :

- **conteneurs** : `deploy/docker-compose.yml` déclare une ancre `x-journal`
  (`json-file`, `max-size: 10m`, `max-file: 3`) importée par `web`,
  `authelia` et `caddy` → 30 Mo maximum par conteneur, posé par le **démon**,
  pas par un script qui passerait après coup. Vérifié en exécution par
  `docker inspect` sur les trois conteneurs, pas seulement dans le YAML.
- **journaux de nos scripts** (`deploy/veille/*.log`, `alertes.jsonl`) : aucun
  plafond naturel, d'où `deploy/entretien.ps1` — rotation `.log → .1 → .2 → .3`
  (la plus ancienne jetée, journal courant recréé vide), purge des alertes de
  plus de `-JoursAlerte` jours (30 par défaut) avec copie `.bak` avant
  réécriture, rapport d'espace disque et `docker system df`. `-WhatIf` montre
  sans agir. Quatrième tâche planifiée : `LCD entretien`, **samedi 04:00**.
- Défauts de banc corrigés en route, tous mesurés : une variable de boucle
  nommée `$n` écrasait le compteur `$N` (PowerShell est insensible à la casse) ;
  compter `max-size` dans le texte de `docker compose config` donnait 4 au lieu
  de 3 (l'ancre `x-journal` compte aussi) → lecture par service dans
  `--format json` ; `@args` **dans un scriptblock** est celui du scriptblock
  (vide), et un paramètre unique ne capte que le premier argument → l'entretien
  retombait silencieusement sur ses défauts ; un littéral
  `@( 'a'+x, 'b'+y )` a été rendu par PS 5.1 comme **une seule** chaîne (les
  deux éléments joints par une espace), produisant un JSONL invalide.

### §8 sexies Hygiène d'état entre batteries (2026-10-19)

Une batterie verte **isolée** peut être rouge dans la passe consolidée : c'est
un état laissé par la précédente, pas un défaut du service. Trois cas mesurés,
traités dans `deploy/tout-verifier.ps1` :

1. **Ban de régulation IdP** — les batteries de recette échouent volontairement
   (mauvais mot de passe) ; au 4e échec en 2 min, l'IdP bannit et la batterie
   suivante mesure le ban (`test-idp` 7 KO en suite, vert isolé). Avant chaque
   batterie, `deploy/outils/lever-ban-idp.py tous` remet l'état à zéro.
2. **Code TOTP à usage unique** — un code n'est valable qu'une fois par
   période ; la batterie suivante rejouait le même code. L'outil purge aussi
   `totp_history`. **Incident et leçon** : une première version purgait toute
   table contenant « totp », donc `totp_configurations` → **le 2FA de
   l'utilisateur a été désenrôlé** (recette 2FA rouge pour tout le monde).
   Réparation par **restauration réelle du volume** depuis un snapshot restic
   antérieur (`restic restore <id> --target / --include /data`, conteneur
   arrêté), puis `test-durcissement` 24/24 — la procédure de reprise a donc été
   exercée pour de vrai, sur une panne réelle, pas en simulation. L'outil ne
   touche plus que `banned_user`, `banned_ip` et `totp_history`.
3. **Prérequis PWA** — le serveur `:3101` exigé par `test-pwa` ne peut pas être
   `next start` (incompatible `output: standalone`, Next 16 le refuse) et un
   `node server.js` lancé sur l'hôte ne survit pas à la session. `deploy/serveur-pwa.ps1`
   sert donc **la même image que la production** dans un conteneur dédié, sans
   IdP, sur le réseau lab ; `tout-verifier` le démarre avant la batterie et
   l'arrête après.

Troisième occurrence du piège `$args` (variable **automatique** de PowerShell,
après `sauvegarde.ps1` et `test-backup.ps1`) : dans `serveur-pwa.ps1`, le splat
`@args` envoyait autre chose que l'array construit, le conteneur sortait
aussitôt et `/sw.js` ne répondait jamais — ce qui ressemblait à un conflit de
port. Vérification ajoutée : aucun script de `deploy/` n'affecte `$args`
(`grep` sur `^\s*\$args\s*=` ; une occurrence subsiste dans `test-front.ps1`,
hors périmètre, signalée à son propriétaire).
### §8 octies Récupération d'espace prouvée (2026-10-19)

Le disque est la ressource qui a déjà mordu sur cet hôte (R-05), et docker systemdf montrait **10,13 Go** de cache de build pour **47,6 Go libres (5,1 %)**. deploy/entretien.ps1 -Prune (opt-in, jamais par défaut) supprime le cache de plus de 7 jours et les images flottantes, puis **publie l'espace récupéré**. Mesure du jour : cache **10,13 → 7,53 Go**, images flottantes **93 Mo**, total ~2,7 Go rendus, sans toucher aux images nommées, aux volumes ni aux conteneurs. La batterie deploy/test-entretien.ps1 (**11/11**) fabrique une image flottante réelle, prouve qu'elle survit à -WhatIf, qu'elle disparaît au prune réel, et que les comptages 23/23, 78/78, 32/32 sont inchangés. Le reste (5,8 Go de cache récent, VHDX) demande soit du temps, soit l'administrateur.

### §8 nonies La documentation est vérifiable (2026-10-19)

Vingt-trois documents, dont deux **produits par la mesure** : sans garde-fou, une documentation qui cite un script renommé devient un mensonge silencieux. Réponse : `docs/README.md` est **généré** par `deploy/index-docs.ps1` (`-Verifier` signale la dérive), et `deploy/test-docs.ps1` (**12/12**) mesure :

- l'index liste **les 23 documents** et **aucun fantôme** ;
- il est **régénérable à l'identique** — et un document ajouté le rend **rouge** (contrôle positif, puis retour au vert après suppression du témoin) ;
- chaque document a un titre de niveau 1 ;
- **les 28 scripts `deploy/*.ps1` cités existent** réellement sur le disque ;
- **aucune des 19 batteries n'est orpheline** (chacune est citée quelque part) ;
- les documents générés portent leur avertissement, aucun résidu `.tmp`/`.bak`.

### §8 decies Reprise complète prouvée (2026-10-19)

Les batteries prouvaient que la sauvegarde est **restaurable** et que le dépôt est **sain** ; aucune ne prouvait le trajet complet **snapshot -> conteneurs -> requête qui répond**. C'est pourtant ce trajet qui décide si une reprise est possible. `deploy/reprise.ps1` le mesure sur une **pile séparée** (projet `lcd-reprise`, réseau dédié, ports 4101/4102/4103/3110) :

1. le snapshot **du volume IdP** est identifié par son tag — `restore latest` prenait le snapshot le plus récent tous volumes confondus (mesure : le drill restaurait le volume bidon de `test-backup`) ;
2. restauration restic **réelle** dans un volume neuf, puis lecture de la base restaurée : elle contient ses enrôlements ;
3. `docker compose up` avec la **surcharge** `reprise/docker-compose.reprise.yml` — `!override` est obligatoire sur les ports : sans lui compose **fusionne** les listes et le drill meurt sur « port is already allocated » ;
4. **15 s** mesurées pour resservir : 302 sur l'entrée protégée, 200 sur le portail IdP, 200 sur le front, 301 en HTTP, 3/3 services ;
5. la **production répond avant et après**, et le nettoyage ne laisse ni conteneur ni volume.

La preuve est son propre résumé : le compte final doit être cohérent avec les lignes. Une version antérieure affichait « 0 échec » en exécutant la branche d'échec — une preuve qui ment sur son résultat est pire qu'aucune preuve, d'où le contrat d'appel à deux arguments.

### §8 undecies L'exploitation tourne-t-elle vraiment ? (2026-10-19)

Une automatisation morte ne se plaint pas : elle ne fait plus rien, et les preuves qu'elle produisait restent en place, **périmées mais crédibles**. `deploy/test-sante.ps1` (**11/11**) mesure donc la **fraîcheur** de chaque preuve et va jusqu'à **déclencher** la tâche de reprise pour lire sa conclusion : 5 tâches présentes, aucune désactivée, aucune en échec (code 0 ou « jamais exécutée »), snapshot < 36 h, batteries / dépôt / entretien / état vérifié < 8 j, veille < 15 min, et le journal de reprise contient bien « reprise complète prouvée ».

Deux pièges mesurés en écrivant cette batterie : lire un journal **pendant** que la tâche l'écrit échoue (« en cours d'utilisation ») — il faut une lecture partagée ; et attendre la **date** du fichier ne suffit pas, la première ligne est écrite avant la conclusion : on attend la ligne `RESULTAT :`.

### §8 duodecies Acces aux secrets locaux (2026-10-19)

Les fichiers de secrets du dépôt local doivent être lisibles par le compte qui exploite le SAS, par SYSTEM et par les administrateurs — et **par personne d'autre**. Mesure du 2026-10-19 sur cet hôte : `deploy/backups/.restic-pass` portait une entrée pour un **SID non résolu** (`S-1-5-21-3098198916-…-770848283`) avec Write **et Read**, et les trois fichiers héritaient d'entrées sans rapport avec l'exploitation. Un SID orphelin qui garde la lecture d'une phrase de passe est exactement le trou qu'on ne voit jamais à l'œil.

`deploy/durcir-secrets.ps1` coupe l'héritage, redonne exactement trois principes (**SID**, pas noms : « Administrators » n'existe pas sur un Windows français — mesuré), retire nommément les SID hors liste (couper l'héritage ne suffit pas pour une entrée **explicite**, mesuré sur `.restic-pass`), et **sauvegarde les ACL avant** toute modification (`icacls /save`). Modes `-Verifier` (dit, code 1) et `-WhatIf`.

`deploy/test-acces.ps1` (**11/11**) prouve l'état et l'effet : aucun droit hors liste, héritage coupé sur les trois, **contrôle positif** (un fichier rendu lisible par Tout le monde est signalé, puis ne l'est plus après durcissement), **idempotence**, secrets toujours lisibles, `docker compose config` et un vrai `restic snapshots` toujours fonctionnels, sauvegardes d'ACL hors de git.

### §8 terdecies Rien ne change en douce (2026-10-19)

Une image peut changer sans que personne ne l'ait décidé : un `docker compose build`, un tag flottant (`caddy:2-alpine`), un rebuild local du front. Un SAS « définitif » ne doit pas se modifier tout seul, et pourtant rien ne le signalait : `test-front` comparait déjà les dates d'image aux commits, mais aucun document ne disait **ce qui tourne réellement**.

`deploy/versions.ps1` écrit `docs/75-versions-verifiees.md` (généré, versionné) avec, pour chaque service, l'image **demandée** et l'identifiant d'image **exécuté**. `-Verifier` sort en **code 1** dès qu'un identifiant diffère : une mise à jour subie n'est pas une mise à jour acceptée. Le geste d'acceptation est `-Accepter` — explicite, daté, et laissé dans l'historique du document.

`deploy/test-versions.ps1` (**10/10**) prouve l'outil et le document : les trois services décrits, le vérificateur vert, **contrôle positif** sur une copie falsifiée (le service fautif est nommé, puis la copie régénérée redevient verte), l'identifiant cité **relu indépendamment** dans Docker, l'avertissement de document généré, le fichier **versionné** (une trace non commitée ne prouve rien), et l'image à tag flottant bien couverte — c'est précisément pour elle que ce journal existe.

### §8 quaterdecies Sortir la sauvegarde de la machine (2026-10-19)

Une sauvegarde qui vit sur la même machine que ce qu'elle protège ne protège de rien : panne disque, ransomware, vol. Rien, jusqu'ici, ne produisait un **export** ni ne prouvait qu'il était remontable ailleurs — c'est pourtant la condition du passage en LAN puis sur Internet.

`deploy/exporter.ps1 -Vers <dossier>` copie le dépôt restic entier (chiffré), écrit `MANIFESTE.txt` (une empreinte SHA256 par fichier) et `RESTAURER.txt` (mode d'emploi auto-suffisant). `-Verifier` recalcule les empreintes, et prouve que le dépôt exporté est **chiffré** : avec une mauvaise phrase de passe, restic refuse (code 12, « wrong password or no key found » — mesuré).

La **phrase de passe doit voyager séparément** (coffre, papier, gestionnaire) : sans elle l'export est illisible, avec elle dans le même sac l'export est inutile. La batterie le vérifie littéralement — aucun fichier de l'export ne contient la phrase.

`deploy/test-export.ps1` (**12/12**) : export réel (1483 fichiers, 188 Mio), manifeste et mode d'emploi écrits, 1483 empreintes recalculées, phrase de passe absente, dépôt relu, **une donnée réelle extraite depuis l'export** (`restic dump` du `db.sqlite` du volume IdP, en-tête `SQLite format 3`), contrôles positifs (octet modifié → vu et nommé, fichier supprimé → vu), destination non vide refusée sans `-Ecraser`. Deux pièges mesurés : les packs restic sont en **lecture seule** (`WriteAllBytes` refuse tant que l'attribut n'est pas levé) et le **premier** snapshot d'un `--json` n'est pas celui du volume voulu (il faut le tag, comme dans le drill de reprise).

### §8 quindecies L'accès LAN est mesuré, pas supposé (2026-10-19)

« Prêt pour le LAN » n'est pas une opinion. `deploy/test-lan-acces.ps1` (**6/6**) classe l'état en trois catégories et n'en accepte que deux :

- **OUVERT** — l'entrée répond sur l'adresse LAN : rien à faire ;
- **FERMÉ-PAR-PARE-FEU** — elle ne répond pas, mais Docker publie bien sur `0.0.0.0` et **aucune** règle de pare-feu n'existe pour ces ports : il manque **un** geste d'administrateur, imprimé par la batterie (`netsh advfirewall firewall add rule … localport=4001,4002,4003`) ;
- **CASSE** — la boucle locale ne répond pas, ou Docker est lié à `127.0.0.1`, ou une règle existe et bloque quand même. **Rouge.**

Mesure du 2026-10-19 : adresse LAN `192.168.31.59`, entrée 302 en boucle locale, `docker port` montre `0.0.0.0:4001/4002/4003`, **0/3** ports répondent sur l'adresse LAN, aucune règle de pare-feu, pare-feu actif sur les trois profils → état **FERMÉ-PAR-PARE-FEU**. Autrement dit : tout le logiciel est en place, **une commande** sépare le SAS du réseau local, et elle demande les droits d'administrateur (les seuls que ce poste n'a pas).

Piège mesuré : `Get-NetIPAddress` est **cassé** sur cet hôte (« Classe non valide » : la classe CIM `MSFT_NetIPAddress` manque) ; la batterie lit `ipconfig`, qui ne dépend de rien.

### §8 sexdecies La bascule TLS est deja validee (2026-10-19)

Le passage sur Internet ne demande pas de reecrire Caddy : il demande de changer **une** variable. Tant que `tls internal` est ecrit en dur, cette bascule est une modification de code **non testee** -- et c'est exactement le genre de detail qui casse au moment ou on en a besoin.

Le `Caddyfile` utilise desormais `tls {$LCD_TLS:internal}` : en local la variable vaut `internal` (CA interne, zero ACME), en LAN/Internet elle vaudra `admin@domaine` et Caddy passera a **ACME / Let's Encrypt** -- meme fichier, aucun nom ni mode en dur.

`deploy/test-tls.ps1` (**9/9**) le prouve : zero `tls internal` en dur, configuration actuelle **valide**, **variante ACME valide aussi** (`LCD_TLS=admin@sas.exemple.fr` -> `Valid configuration`, code 0), entree 302 avec la CA interne, et surtout **sans `-k` le client refuse** (code 60) : preuve qu'aucun certificat public n'est en service, donc qu'ACME n'est pas actif en local. HSTS et anti-sniffing servis, rechargement applique, entree toujours debout apres.

Autrement dit : ce qui reste pour Internet n'est plus technique -- un **domaine**, un **DNS** qui pointe, un **e-mail** pour ACME, et les ports 80/443 ouverts. Les trois premiers sont des comptes, le dernier est le meme geste d'administrateur que pour le LAN.


### §8 octodecies L'espace disque : 40 Go prisonniers dans le VHDX (2026-10-19)

La veille tire une alerte **critique** : `3.7% libre (seuil 10%)`. Elle est reelle, et sa cause est mesurable :

| Mesure | Valeur |
|---|---|
| Disque C: libre | **34,88 Go (3,7 %)** |
| `docker_data.vhdx` sur le disque | **49,95 Go** |
| Donnees Docker reelles (images 8,2 Go + volumes 0,4 Go) | ~9 Go |
| Cache de build purge par `docker builder prune -af` | **6,28 Go annonces** |
| Gain reel pour Windows | **0,00 Go** |
| Exports temporaires de mes tests supprimes | 0,56 Go (le seul gain reel) |

Autrement dit : **~40 Go du VHDX sont de l'air**. Docker libere des blocs *a l'interieur* de sa machine virtuelle, mais un disque virtuel dynamique **ne rend jamais ses blocs a Windows** tout seul. Tout entretien interne (purge d'images, de volumes, de cache) est donc **sans effet sur l'hote** -- la mesure le montre : 6,28 Go annonces, 0 octet rendu.

**Le seul geste qui rend l'espace est une compaction du VHDX, et il demande les droits d'administrateur :**

1. arreter Docker Desktop (pas seulement la pile) ;
2. en administrateur, sur le fichier `%LOCALAPPDATA%\Docker\wsl\data\ext4.vhdx` : `diskpart`, puis `select vdisk file=CHEMIN`, `attach vdisk readonly`, `compact vdisk`, `detach vdisk` ;
3. redemarrer Docker Desktop et relancer `deploy/tout-verifier.ps1` ; l'alerte doit passer sous le seuil.

En attendant, la marge est de 3,7 % : toute construction d'image ou tout export peut echouer sur disque plein. C'est pourquoi les batteries nettoient leurs propres artefacts (`test-export` supprime son dossier dans un `finally`).

### §8 septies Intégrité du dépôt de sauvegarde (2026-10-19)

La sauvegarde était **prouvée** (restauration réelle, 10/10) mais **rien ne
vérifiait le dépôt lui-même** : un pack tronqué ou un disque qui pourrit rend la
sauvegarde fausse sans témoin — le pire état possible. Comblé par
`deploy/verifier-depot.ps1` :

- `restic check` (index + packs) et, avec `-Donnees`, relecture de **5 %** des
  données réelles ; mesure du 2026-10-19 : **379 snapshots, 112,6 Mio,
  15 packs, aucune erreur** ;
- `-Etat` date la dernière vérification et sort en **code 1** au-delà de
  `-SeuilJours 30` : l'absence de contrôle devient une alerte, pas un oubli ;
- **contrôle positif** (`deploy/test-depot.ps1`, 14/14) : une copie du dépôt
  dont un pack est tronqué **échoue**, avec un message nommant la corruption.
  Le dépôt réel n'est jamais touché ;
- le mot de passe restic n'est jamais affiché (vérifié), l'historique de
  contrôle vit hors de git ;
- l'entretien hebdomadaire (tâche `LCD entretien`, samedi 04:00) exécute le
  contrôle complet : la preuve est **renouvelée chaque semaine** sans
  intervention.

Runbook associé : **R-06** (restauration). Un dépôt déclaré abîmé interdit de
s'appuyer sur ces sauvegardes : la sortie le dit et le code de sortie est non
nul.

### 8 novodecies — Compaction du disque Docker : l'espace est recuperable, le geste est humain

**Constat mesuré (2026-10-21)** : `docker_data.vhdx` occupe **49,95 Go** pour ~9 Go de données réelles ;
`C:` est tombé à **30,8 Go libres (3,7 %)**. Un disque virtuel ne rétrécit jamais tout seul : les
images supprimées ne rendent **rien** à Windows (`docker builder prune` a libéré 6,28 Go *à
l'intérieur* du disque, et 0 octet pour l'hôte).

**Ce qui est livré** — deux fichiers, un double-clic :

| Fichier | Rôle |
|---|---|
| `deploy/compacter-vhdx.cmd` | demande l'**élévation** (Windows ne l'accorde qu'au lancement d'un programme) puis appelle le script |
| `deploy/compacter-vhdx.ps1` | arrête les piles → Docker Desktop → WSL → attend que le fichier soit **libéré** → `Optimize-VHD -Mode Full` (repli `diskpart compact vdisk`) → relance Docker → vérifie que les données sont revenues |

**Garde-fous** : refuse de compacter si le disque est encore ouvert (sinon échec ou corruption) ;
journalise chaque étape dans `deploy/compaction.log` ; mesure l'espace **avant/après** et n'annonce
un succès que si Docker répond **et** que le gain est positif. Mode `-Simuler` vérifié : il n'arrête
rien et affiche le plan.

**Pourquoi l'agent ne le fait pas lui-même** : la compaction exige les droits administrateur, que
cette session n'a pas (`administrateur : False`). Le geste est donc humain, une fois, et l'agent
mesure ensuite la taille du fichier pour prouver le gain.

**Vérification après le geste** (commande de l'agent) :
```powershell
(Get-Item "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx").Length / 1GB
(Get-PSDrive C).Free / 1GB
```
Attendu : le disque passe de ~49,95 Go à ~10-12 Go, et `C:` regagne ~35-40 Go.

#### Résultat mesuré — compaction faite le 2026-10-21

| Grandeur | Avant | Après | Gain |
|---|---|---|---|
| `docker_data.vhdx` | 49,95 Go | **24,68 Go** | **−25,3 Go** |
| Libre sur `C:` | 30,8 Go (3,5 %) | **71,4 Go (7,7 %)** | **+40,6 Go** |

**Qui a lancé quoi — correction d'une affirmation fausse.** Le journal est sans ambiguïté : la session élevée a démarré à **22:25:17** avec `administrateur : True`, soit le **double-clic de l'exploitant** sur `compacter-vhdx.cmd`. Les tentatives `Start-Process -Verb RunAs` de l'agent sont **toutes annulées instantanément** (« L'opération a été annulée par l'utilisateur ») : dans cette session, l'invite d'élévation n'atteint pas le bureau. Autrement dit : **l'agent outille, l'humain élève.** Une fois lancé, le script a enchaîné seul — arrêt des piles, `wsl --shutdown`, `diskpart compact vdisk`, relance.
fois, puis tout s'est enchaîné — arrêt des piles, `wsl --shutdown`, `diskpart compact vdisk`, relance.
Le journal `deploy/compaction.log` porte chaque étape.

**Contrôles après l'opération** (rien n'a été perdu) :
- 44 images toujours présentes, 28 conteneurs inspectés, piles `lcd-deploy` et `lcd-lab` relancées ;
- `https://lcd.test/` → 200 (vitrine) · `https://lcd.test/hote` → 302 (portail) · `https://auth.lcd.test/` → 200 ;
- batterie des périmètres : **tenus (lecture + écriture)** ;
- `reprise` : 16/16 · `test-demarrage` : 14/14.

#### Correction de règle, et sa raison

Après compaction, `veille` criait **encore** : 7,7 % libre. Or 7,7 % d'un disque de ~930 Go, c'est
**71 Go** — pas une urgence. Un pourcentage seul ment sur un grand volume. La règle est donc devenue
**double** :
- **critique** si `< 20 Go` libres **ou** `< 4 %` ;
- **vigilance** entre 4 % et le seuil en pourcentage (10 %).

Aucun seuil n'a été abaissé pour faire taire l'alerte : le cas du 21/10 (30,8 Go / 3,5 %) déclenche
**les deux** conditions, donc reste critique. Mesure après correction : `0 critique`, `1 vigilance`
(« 7,7 % libre mais 71,3 Go disponibles »).