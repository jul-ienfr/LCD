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
| **V2** | **Données réelles** : registre du parc, inventaire, prestataires, stocks, mémoire, extras alimentés par la vérité terrain (S3, S4) ; ce qui manque = vide bloquant | chaque écran métier montre soit une valeur sourcée (fichier/adresse/item), soit « à saisir » ; 0 ligne « fictive » | 2 vagues (dont saisie hôte) |
| **V3** | **Secrets réels** : génération, gitignore, rotation, aucun secret versionné (S2) + secrets IdP (`users.yml`, `totp-secrets.json`) | contrôle automatique « 0 secret dans le dépôt » ; rotation rejouée | 1 vague |
| **V4** | **LAN** : DNS local (`lcd.local`, `lcd-idp.local`), CA interne distribuée, ports figés, mDNS, pare-feu hôte, sauvegardes locales (restic) + restauration chronométrée | depuis un second poste du LAN : `/login` IdP → 2FA → `/hote`, `/api/health`, sauvegarde/restauration prouvée | 1–2 vagues |
| **V5** | **Internet** : domaine, LE (DNS-01), durcissement (HSTS, WAF, rate-limit), accès admin par VPN seul, révocation | test externe : portail IdP, 2FA, 0 port admin exposé ; `test-deploy` en HTTPS public | 1–2 vagues |
| **V6** | **Métrologie et exploitation** : journaux centralisés, alertes (site muet, crash-loop, disque, certificat), tableau de santé du parc, runbooks datés | une panne provoquée (conteneur arrêté) = alerte reçue < 2 min + runbook applicable à froid | 1 vague |

## §6 Architecture cible : local → LAN → Internet

Trois couches, une seule image applicative :

1. **Local (aujourd'hui)** — `docker compose` sur la machine hôte ; un seul
   réseau de pile par site ; `lcd.test` / `lcd-idp.test` résolus par
   `--resolve` ou `/etc/hosts` ; CA interne de Caddy.
2. **LAN (V4)** — un serveur « socle » (gateway + front + IdP) et N box, chacune
   sur son LAN ; noms `lcd.local`, `lcd-idp.local`, `box-<site>.local` ;
   certificats par CA interne ; aucun port public.
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

## §7 Preuves et gates

| Gate | Critère | Commande |
|---|---|---|
| G-front | front complet, zéro KO, deux modes (IdP et sans IdP) | `deploy/test-front.ps1` (47/47 attendu, mode IdP) |
| G-deploy | stack + Caddy + IdP + recette | `deploy/test-deploy.ps1` (9 checks, dont recette IdP) |
| G-box | batteries box déterministes (socle, moli, runtime) | `lab/lab-run.ps1` (5/5) |
| G-parité (V1) | 2 sites réels, fan-out complet, zéro site simulé, aucun logement orphelin | `deploy/test-sites.ps1` (**12/12 OK**, 2026-10-19) |
| G-secrets (V3) | 0 secret versionné, 0 fichier de secret suivi par git, 0 forme de secret dans les fichiers suivis, 0 valeur réelle dans une réponse HTTP | `deploy/test-secrets.ps1` (**23/23 OK**, 2026-10-19) |
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
