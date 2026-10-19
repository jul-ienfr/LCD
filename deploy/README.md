# deploy/ — stack auto-hébergée LCD (self-hosted local, 0 €)

> Entrée unique `https://lcd.test:4001` (TLS interne) → **forward_auth
> Authelia** (F3 : aucune entrée sans IdP) → front Next SSR :3100 → gateway
> lab :8443. Portail de login = `https://lcd.test:4002`.
> Le lab FAIT office de box (moteurs + gateway + HA) : `deploy/` ajoute
> front + Caddy + Authelia.
> Batterie lab §52/§72 inchangée : elle scrute `custom/.../Caddyfile` +
> `lab/vps-sim/*`, jamais `deploy/`.

## Démarrage (2 commandes)

```powershell
cd lab; docker compose up -d --build          # lab d'abord (vérité runtime)
cd ../deploy; docker compose up -d --build    # front + Caddy + Authelia ensuite
powershell ./test-deploy.ps1                 # 7 checks + recette IdP (ou sh)
```

Prérequis : `deploy/.env` (généré, gitignoré — voir `authelia/README.md`) :
secrets Authelia + mots de passe comptes. Sans lui, compose échoue
clairement (`:?`).

## Architecture

```
navigateur → Caddy :4001 (TLS interne, lcd.test, HSTS+nosniff)
  forward_auth authelia:9091  (purge Remote-* client puis copy_headers ;
                              sans session valide → 302 portail :4002)
  /api/lite*  → web :3100 (pref optin mode degrade)
  /api/*      → gateway-parc :8443 (strip /api, fan-out parc + 1-tap)
  *           → web :3100 (Next standalone, SSR + Server Actions)
lcd.test:4002 → Authelia (portail login + TOTP + logout)  [meme Domain cookie]
lcd.test:4003 → HTTP → HTTPS 4001
```

- Mode IdP : `LCD_IDP=1` côté web (identité = `Remote-User`, aucun repli
  cookie) ; lab sans IdP = batterie locale uniquement (`test-front.ps1`).
- Réseaux : `web` branché sur `front` + `lab` (`lcd-lab_default` external) ;
  `caddy` branché sur les DEUX (sinon `lookup gateway-parc: i/o timeout` → 502, constaté).
- `LCD_GATEWAY_URL=http://gateway-parc:8443` (nom Docker, jamais 127.0.0.1 : loopback par conteneur).
- Ports hôte : **4003** (HTTP→HTTPS) + **4001** (HTTPS app) + **4002**
  (portail). (4000 pris par un outil externe de l'hôte — jamais mappé.)
  Socle (:8090-8100, :8123, :8443, :8050, :8060, :3100 exposé mais hors TLS
  = démo/SAS local) jamais exposé comme entrée officielle.
- Secrets : aucun côté compose web/caddy ; Authelia lit `deploy/.env`
  (gitignoré). Fixtures = lab, reset = `lab/seed-reset.ps1`.
- Image front : `lcd-deploy-web` (~281 Mo, `node:24-slim` multi-stage, user `lcd`, `output: standalone`).

## Batteries (exit 0 = tout vert)

- `test-deploy.ps1` : **7 checks anonyme** — `/`, `/api/v1/statut`,
  `/proprio` en **302 portail** (fail-closed, preuve que rien n'est ouvert),
  `/api/health` + `/voyageur` en 200 (seuls bypasss réels), HSTS+nosniff,
  0 fuite de secret — puis **délègue `test-idp.ps1` (22 checks)** : 302 →
  redirection 2FA → TOTP réel niveau 2 → chip identité Remote-User →
  403 révocation → logout 302 + bandeau/journal voir-comme.
- `test-front.ps1` : batterie lab P1 (sans `LCD_IDP`, contre `next start`)
  — 46 checks, la preuve que la bascule `LCD_IDP` ne casse pas le mode lab.
- `test-pwa.ps1` : **recette PWA/offline réelle** (F4) — `sw.js` servi +
  versionné, puis `web/scripts/recette-pwa.mjs` : Edge headless (`msedge`,
  0 navigateur téléchargé) + coupure réseau **réelle** (`context.setOffline`
  CDP) → guide lisible sans WAN, écriture offline mise en attente (outbox
  IndexedDB), rejeu automatique au retour réseau, **preuve serveur non
  simulable** (rejeuter la même ref → `idempotent=true` sur la table 24 h de
  la passerelle = le navigateur a exécuté la ref), 3 allers-retours = 0
  perdue / 0 doublon, purge `lcd-purge` = 0 cache restant.
  ⚠ écrit dans le lab (`box-lab/log1` : commandes extras + sinistres) :
  relancer `seed-reset` avant `tests_lab.py` (finances exactes).
- `test-deploy.sh` : jumeau sh (mêmes 7 checks + délégation).

## Teardown

```powershell
cd deploy; docker compose down -v   # entrée seule (lab intact)
```
