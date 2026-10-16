# deploy/ — stack auto-hébergée LCD (self-hosted local, 0 €)

> Entrée unique `https://lcd.test:4001` (TLS interne) → front Next SSR :3100 → gateway lab :8443.
> Le lab FAIT office de box (moteurs + gateway + HA) : `deploy/` n'ajoute QUE front + Caddy.
> Batterie lab §52/§72 inchangée : elle scrute `custom/.../Caddyfile` + `lab/vps-sim/*`, jamais `deploy/`.

## Démarrage (2 commandes)

```powershell
cd lab; docker compose up -d --build          # lab d'abord (vérité runtime)
cd ../deploy; docker compose up -d --build    # front + Caddy ensuite
powershell ./test-deploy.ps1                 # 7 checks (ou sh test-deploy.sh)
```

## Architecture

```
navigateur → Caddy :4001 (TLS interne, lcd.test, HSTS+nosniff)
  /            → web :3100 (Next standalone, SSR + Server Actions)
  /api/*       → gateway-parc :8443 (strip /api, fan-out parc + 1-tap)
```

- Réseaux : `web` branché sur `front` + `lab` (`lcd-lab_default` external) ;
  `caddy` branché sur les DEUX (sinon `lookup gateway-parc: i/o timeout` → 502, constaté).
- `LCD_GATEWAY_URL=http://gateway-parc:8443` (nom Docker, jamais 127.0.0.1 : loopback par conteneur).
- Ports hôte : **4000** (HTTP→HTTPS) + **4001** (HTTPS). Socle (:8090-8100, :8123, :8443, :8050, :8060) jamais publié.
- Secrets : aucun (fixtures = lab, reset = `lab/seed-reset.ps1`).
- Image front : `lcd-deploy-web` (~281 Mo, `node:24-slim` multi-stage, user `lcd`, `output: standalone`).

## Preuves 2026-10-16

- `test-deploy.ps1` : 7/7 exit 0 (pilotage SSR, /api/health, /api/v1/statut, /proprio, /voyageur, HSTS+nosniff, 0 fuite).
- Écriture 1-tap via Caddy : `POST /api/v1/action` prix → `moteur_code 200` + rejeu `idempotent: true`.

## Teardown

```powershell
cd deploy; docker compose down -v   # entrée seule (lab intact)
```
