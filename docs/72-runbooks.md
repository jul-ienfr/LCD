# 72 — Runbooks d'exploitation (SAS LCD, local d'abord)

**Version** : 2026-10-19 · **Portée** : la pile locale (`deploy/`) et les boxes
(`lab/`), telles qu'elles tournent aujourd'hui sur cet hôte. Chaque runbook est
écrit pour être **applicable à froid**, sans mémoire du contexte : *symptôme →
diagnostic (commandes réelles) → action → vérification → trace*.

> Règle commune : **on ne déclare jamais « réparé » sans la vérification
> indiquée**. Un « docker dit up » n'est pas une preuve ; une batterie verte,
> oui. Les chemins sont relatifs à la racine du dépôt, les scripts dans
> `deploy/`.

| Réf. | Situation | Batterie de vérification |
|---|---|---|
| R-01 | Refaire démarrer la pile | `test-demarrage.ps1` (14/14) puis `test-deploy.ps1` |
| R-02 | Front 502 / 000 | `test-deploy.ps1`, `veille.ps1 -Echouer` |
| R-03 | IdP refuse ou boucle | `test-idp.ps1` (recette COMPLÈTE) |
| R-04 | Box muette | `test-sites.ps1` (12/12) |
| R-05 | Disque plein | `veille.ps1 -SeuilDisque 0` doit rester vert ensuite |
| R-06 | Restauration après sinistre | `test-backup.ps1` (10/10) |
| R-07 | Rotation d'un secret | `test-secrets.ps1` (23/23) |
| R-08 | Passage en LAN | `test-lan.ps1 -Exiger` (13/13) |
| R-09 | Passage sur Internet | `test-deploy.ps1` + accès externe daté |
| R-10 | Certificat | `veille.ps1` (contrôle certificat) |

---

## R-01 — Faire démarrer (ou redémarrer) la pile

**Symptôme** : après un redémarrage de l'hôte, plus rien ne répond ; ou on
reprend le poste des jours plus tard.

**Diagnostic**

```powershell
docker ps -a --filter "name=lcd-deploy" --format "{{.Names}}|{{.State}}|{{.Status}}"
deploy/veille.ps1            # dit ce qui manque, mesure par mesure
```

**Action**

```powershell
cd deploy
powershell -ExecutionPolicy Bypass -File ./demarrer.ps1
```

Le script vérifie les prérequis (Docker joignable, secrets présents, config IdP
**conforme au modèle**), démarre, attend la santé réelle (`authelia healthy`,
`web healthy`), sonde les 3 endpoints (portail, front, entrée TLS) et signale
la dépendance `gateway-parc` si la pile box est absente. Il sort en **code 1**
si un endpoint n'est pas servi.

**Vérification** : `demarrer.ps1` affiche `SAS demarre et SERVI` puis
`test-demarrage.ps1` → 14/14.

**Trace** : `git log --oneline -1`, heure de démarrage, durée affichée.

---

## R-02 — Le front répond 502 ou rien (000)

**Symptôme** : `https://lcd.test:4001` → 502 ; `http://127.0.0.1:3100` → 000.

**Diagnostic** (dans l'ordre, chaque étape élimine une cause)

```powershell
docker inspect --format "{{.State.Health.Status}}" lcd-deploy-web-1
docker inspect --format "{{.State.Running}}" lcd-deploy-caddy-1
docker inspect --format "{{.State.Running}}" lcd-lab-gateway-parc-1
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:8443/health
deploy/veille.ps1
```

- `web` non healthy → logs : `docker logs --tail 50 lcd-deploy-web-1`.
- `caddy` arrêté → `docker compose up -d caddy` (dans `deploy/`).
- `gateway-parc` arrêté → **c'est la dépendance box** : `lab/lab-run.ps1`
  (le front reste servi, seules les routes `/api/*` échouent : état **dégradé
  assumé**, R4).

**Action** : relancer le service manquant, pas « tout ».

**Vérification** : `deploy/test-deploy.ps1` (0 KO) + `deploy/veille.ps1`
(0 critique hors disque).

---

## R-03 — L'IdP refuse la connexion ou boucle sur le login

**Symptôme** : mot de passe refusé alors qu'il est bon ; ou retour en boucle
sur `/login` ; ou 400 Bad Request du portail.

**Causes réelles déjà rencontrées** (2026-10-19) :

1. la configuration IdP **a dérivé** du modèle (nom d'hôte resté sur `lcd.test`
   alors que l'entrée sert un autre nom) → Authelia répond **400** ;
2. la config a été modifiée à la main : Authelia **n'expanse pas** `${VAR}` dans
   son YAML, les secrets viennent de l'environnement du conteneur ;
3. cookie de session lié au nom : **un seul nom canonique** par déploiement
   (`LCD_HOTE`) ; deux noms = chaînage `forward_auth` cassé.

**Diagnostic**

```powershell
deploy/authelia/rendre-config.ps1 -Verifier      # doit sortir 0
docker logs --tail 30 lcd-deploy-authelia-1
```

**Action**

```powershell
deploy/authelia/rendre-config.ps1 -Hote lcd.test -PortIdp 4002
cd deploy; docker compose restart authelia
```

**Vérification** : `deploy/test-idp.ps1` → « recette IdP COMPLETE VERTE »
(2FA, session, rôles, déconnexion).

---

## R-04 — Une box est muette (site muet)

**Symptôme** : la veille signale `site-muet-<box>` (aucune remontée depuis plus
de `-SeuilSite`, 300 s par défaut).

**Diagnostic**

```powershell
curl.exe -s http://127.0.0.1:8443/ready
curl.exe -s http://127.0.0.1:8443/etat-parc   # boxes[].last_seen
docker ps --filter "name=lcd-lab" --format "{{.Names}}|{{.Status}}"
```

**Action** : relancer la box concernée (`lab/lab-run.ps1`), pas la plateforme.
Si le conteneur tourne mais ne remonte pas, lire ses logs
(`docker logs --tail 50 <conteneur>`) : le heartbeat est la preuve de vie, pas
le statut Docker.

**Vérification** : `deploy/test-sites.ps1` → 12/12, et la veille repasse à
0 critique sur ce point.

---

## R-05 — Disque plein (⚠ situation mesurée le 2026-10-19 : 5,1 % libre)

**Symptôme** : la veille signale `disque - espace disque faible`.

**Piège mesuré** : `docker builder prune` + `docker image prune` ont libéré
**21 Go dans la VM WSL2** sans rendre un octet à Windows — le disque virtuel de
Docker Desktop ne se compacte pas seul.

**Diagnostic**

```powershell
Get-PSDrive C | Select-Object Used,Free
docker system df
```

**Action (deux temps)**

1. dedans : `docker system prune -a --volumes` **uniquement** si l'on accepte
   de perdre images/volumes inutilisés (jamais `lcd-*` en service) ;
2. dehors (nécessite **administrateur** et **Docker Desktop arrêté**) :

```powershell
wsl --shutdown
Optimize-VHD -Path "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Mode Full
# variante sans Hyper-V : diskpart -> select vdisk file="..." -> compact vdisk
```

**Vérification** : `deploy/veille.ps1` sans alerte `disque` ; `test-backup.ps1`
toujours 10/10 (le dépôt doit rester intact).

---

## R-06 — Restauration après sinistre

**Symptôme** : volume perdu, données incohérentes, machine remplacée.

**Diagnostic**

```powershell
cd deploy
powershell -ExecutionPolicy Bypass -File ./restauration.ps1          # liste les volumes sauvegardés
```

**Action**

```powershell
# contrôle complet : chaque volume restauré dans un volume jetable et comparé
# au CONTENU DU SNAPSHOT (jamais au volume vivant)
powershell -ExecutionPolicy Bypass -File ./restauration.ps1 -Verifier

# restauration réelle d'un volume (geste humain, jamais automatique)
powershell -ExecutionPolicy Bypass -File ./restauration.ps1 -Volume lcd-lab_dispatch-state -Cible lcd-lab_dispatch-state
```

Le mot de passe du dépôt (`deploy/backups/.restic-pass`) doit être conservé
**hors machine** : sans lui, le dépôt est illisible — c'est le point unique de
défaillance à documenter dans le coffre du dirigeant.

**Vérification** : `test-backup.ps1` → 10/10 (dont le test destructif :
fichier supprimé puis restauré à l'identique).

---

## R-07 — Rotation d'un secret

**Symptôme** : secret échu, fuite suspectée, départ d'un prestataire.

**Action**

1. changer la valeur dans `deploy/.env` (jamais dans un fichier suivi) ;
2. si c'est un secret IdP (`AUTHELIA_SESSION_SECRET`,
   `AUTHELIA_STORAGE_ENCRYPTION_KEY`) : régénérer, puis
   `cd deploy; docker compose up -d authelia` (**toutes les sessions tombent** :
   c'est attendu, à annoncer) ;
3. noter la rotation dans le registre de slots (écran `/secrets`, rôle
   `super_admin` : métadonnées seules, **jamais la valeur**).

**Vérification** : `test-secrets.ps1` → 23/23 (dont la recette de fuite : les
valeurs réelles sont cherchées dans 6 réponses HTTP) + `test-idp.ps1` vert.

---

## R-08 — Passer en LAN

**Symptôme / objectif** : servir le SAS aux postes du réseau local.

**Diagnostic** (le blocage est **mesuré**, pas supposé) :

```powershell
Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue   # vide = rien n'écoute côté Windows
```

Les ports publiés par Docker vivent dans la VM WSL2 : sans relais, seul le
loopback répond (200 en local, 000 depuis un autre poste).

**Action (administrateur)**

```powershell
deploy/lan-ouvrir.ps1              # état seul, sans rien modifier
deploy/lan-ouvrir.ps1 -Poser       # netsh portproxy 4001/4002/4003 + règle pare-feu "LCD SAS LAN"
```

Puis, sur chaque poste client : entrée `LCD_HOTE` dans le fichier hosts et
certificat de la CA interne (Caddy) approuvé — sinon le navigateur avertit.

**Vérification** : `deploy/test-lan.ps1 -Exiger` → 13/13 avec joignabilité
réelle ; puis, depuis un second poste : `/login` → 2FA → `/hote`.

---

## R-09 — Passage sur Internet (dépend de tiers)

Non exécutable sans : **nom de domaine** (achat), **compte** chez l'hébergeur
ou ouverture de ports, **Let's Encrypt** (automatique mais exige un nom
public), et pour l'activité : SIREN, RC pro, expert-comptable.

**Action préparée** : `LCD_HOTE` + `LCD_PORT_HTTPS` suffisent à servir un autre
nom (aucun nom en dur dans `Caddyfile`) ; `rendre-config.ps1` régénère l'IdP
pour ce nom ; la veille surveille déjà certificat, disque et sites muets.

**Vérification** : `test-lan.ps1` sur le nouveau nom, puis accès externe daté
et consigné ici.

---

## R-10 — Certificat

**Symptôme** : alerte `certificat` ; navigateur qui refuse.

Deux régimes, volontairement distingués par la veille :

- **CA interne Caddy** : feuille de 12 h renouvelée automatiquement. Une
  alerte « non renouvelé » (validité > 3 j) signifie que le renouvellement ne
  tourne plus → `docker compose restart caddy` puis revérifier ;
- **certificat public** (V5) : alerte si l'expiration est à moins de
  `-SeuilCertJours` (14 j) ; renouvellement Let's Encrypt automatique, vérifier
  le journal de Caddy en cas d'échec.

**Vérification** : `deploy/veille.ps1` → contrôle `certificat=...` sans alerte.

---

## Ce que ces runbooks ne couvrent pas (et pourquoi)

- **Perte du mot de passe restic** : non récupérable par conception. Action de
  prévention : copie hors machine, dans un coffre.
- **Panne matérielle de l'hôte** : les box sont logicielles ; la bascule
  matérielle (P0 terrain) est un autre chantier, chiffré au doc 71 §6 bis.
- **Tiers** (OTA, banque, SIREN) : hors de portée d'un runbook local ;
  propriétaires et coûts au doc 71 §6 bis.
