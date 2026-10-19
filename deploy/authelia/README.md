# deploy/authelia — IdP de la stack (F3, REQ-S-007)

Authelia **4.39.28** (pin stricte : `image: authelia/authelia:4.39.28`).
NORME, jamais une option : **toute** la stack `deploy` tourne derrière
`forward_auth` — l'entrée sans-IdP a disparu (§S3.1). Repli léger d'Authentik
(~50 Mo, sous le seuil 1 Go RAM §S3.2) : 1 login = 1 sujet, 2FA TOTP exigée.

## Ce que ce dossier contient

| Fichier | Statut | Rôle |
|---|---|---|
| `configuration.yml` | versionné (0 secret) | règles d'accès (bypass santé/voyageur, `two_factor` staff, deny par défaut), session `lcd_session` (Domain=.lcd.test), notifier filesystem → `/config/notification.log` |
| `users.yml` | **gitignoré** (P1-9) | comptes réels (displayname / username / hash bcrypt / groups) |
| `users.yml.EXAMPLE` | versionné | squelette de forme, hashs exemples |
| `totp-secrets.json` | **gitignoré** | secrets TOTP enrôlés, lus par `test-idp.ps1` (équivalent de l'app d'authentification ; `-ResetTotp` = re-enrôlement réel) |
| `db.sqlite` + `notification.log` | volume `authelia-data` | état runtime (sessions, TOTP, OTC émis) |

Générer un hash (binaire 4.39.28 vérifié — la commande est `crypto`, pas
`crypt`, et sans `${VAR}`) :

```bash
docker run --rm authelia/authelia:4.39.28 \
  authelia crypto hash generate bcrypt --password 'mot-de-passe-temporaire-a-changer' --no-confirm
# Digest: $2b$12$...
```

## Secrets (jamais commités)

Deux secrets sont **exigés au démarrage** : compose échoue clairement
(`${LCD_AUTHELIA_*:?}`) si `deploy/.env` est absent. Ils sont passés en
**env natives** `AUTHELIA_*` — le binaire 4.39.28 ne fait **aucune**
interpolation `${VAR}` dans le YAML (prouvé : il lit littéralement la
chaîne et devient inutilisable). En prod P2/P3, ils vivent dans
`/etc/lcd/vault` (age, §7).

```powershell
# Générer + écrire deploy/.env (voir aussi generer-secrets.ps1)
$L1 = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | %{[char]$_})
$L2 = -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | %{[char]$_})
# LCD_AUTHELIA_SESSION_SECRET=...  LCD_AUTHELIA_STORAGE_KEY=... (+ mots de passe comptes)
docker compose up -d   # authelia inclu, aucun --profile
```

## Chaîne réelle prouvée (recette automatisée : `deploy/test-idp.ps1`)

1. anonyme sur `https://lcd.test:4001/*` → **302** portail `:4002` avec `rd`
   conservé (fail-closed ; `/api/health` et `/voyageur` = seuls bypass 200) ;
2. `POST /api/firstfactor` → niveau 1 ; page protégée → **302** (redirection
   2FA : `two_factor` refuse le niveau 1) ;
3. `POST /api/secondfactor/totp` (HMAC-SHA1 6 chiffres/30 s, secret réel) →
   niveau 2 ; `/hote` → **200** avec l'identité rendue (`Remote-User`) ;
4. écriture avec compte **révoqué** (decision `/acces-revoquer`) → **403** ;
5. `POST /api/logout` (GET = 405) → niveau 0 ; `/hote` → **302** (acces perdu).

Enrôlement TOTP (exécuté une fois, ou via `-ResetTotp`) : niveau 1 →
`POST /api/user/session/elevation` (OTC écrit dans `/config/notification.log`
= le « canal email » réel du lab) → `PUT …/elevation {otc}` →
`PUT /api/secondfactor/totp/register` (generate) → `POST …/register {token}`
(confirm) → fenêtre TOTP suivante pour l'authentification (anti-replay
d'Authelia : « already used this code recently »).

## Rôle applicatif

Authelia ne prouve qu'une **identité** (`Remote-User` + `Remote-Groups`
recopiées par Caddy `copy_headers` après purge des valeurs client
`request_header -Remote-*`), jamais un droit. Le mapping sujet → rôle LCD
reste porté par `custom/acces.yaml` côté gateway, qui **refait son RBAC à
chaque écriture** : l'en-tête `forward_auth` ne décide de rien côté
applicatif. Le front lit `Remote-User` via `web/src/lib/identite.ts`
(`LCD_IDP=1`) — sans en-tête : anonyme, jamais de repli cookie.

## Mode lab sans IdP = batterie locale uniquement

Le front s'exécute aussi **sans** `LCD_IDP` (batterie locale
`deploy/test-front.ps1` contre `next start`, mode P1 lab) : c'est un outil
de test, pas une entrée de déploiement. `deploy/docker-compose.yml` fixe
`LCD_IDP=1` — l'entrée officielle `lcd.test:4001` est **toujours** IdP.
