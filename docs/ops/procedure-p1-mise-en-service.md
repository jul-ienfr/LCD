# PROCÉDURE P1 — Mise en service 0 € (Vercel Hobby + VM Oracle Always Free)

> **Objet.** Mettre en service le palier P1 de la conciergerie LCD : front Next.js `web/` sur Vercel Hobby, gateway Python stdlib `:8443` sur VM Oracle Always Free, Caddy en frontal (`parc.<domaine>` + `api.<domaine>`, Authelia devant), WireGuard boxes → VM (`10.99.0.0/24`), SQLite `parc.db` sur volume persistant + backup chiffré `age` quotidien hors site. À la fin, un voyageur, un propriétaire, un commercial et un pilote accèdent au service de bout en bout.
>
> **Prérequis.** Un poste admin Linux/WSL avec `ssh`, `age`, `wireguard-tools`, `curl`, `git` ; accès aux comptes ci-dessous ; dépôt LCD cloné ; faux VPS `lab/vps-sim` vert en local (voir §0) ; `versions.lock` relu ; aucun secret existant à réutiliser (on génère tout sur la VM).
>
> **Coût : 0 € (sauf P3 ~5 €/mois).** P1 = 0 € : Vercel Hobby (quota gratuit), VM Oracle Always Free, Cloudflare gratuit, domaine hors chiffrage (déjà détenu). Aucune carte bancaire requise sauf compte Oracle (vérification).

## Règles intangibles (tout le document)

- **Jamais de secret en clair** : ni dans le dépôt, ni dans un ticket, ni sur stdout. Les clés vivent dans `/etc/lcd/vault` (chiffré `age`, `0600`), montées par `deploy-vps.sh`. `deploy-vps.sh check` refuse tout secret versionné.
- **Jamais de port du socle publié** : `:8123` (HA), `:4000`, `:8050`, `:8060`, `:8090-8100` restent joignables **uniquement** via WireGuard `10.99.0.0/24`. Seuls `443/tcp` (Caddy) et `51820/udp` (WireGuard) sont ouverts sur le pare-feu VM.
- Placeholders utilisés ci-dessous : `<domaine>`, `<email-admin>`, `<user-vps>`, `<ip-vm>`, `<box_id>`, `<ip-box>`. Remplacer au moment de taper, ne jamais les commiter avec des valeurs réelles.
- Versions épinglées : `custom/passerelle-parc/versions.lock` (`python 3.12-slim`, `caddy 2.8`, `age 1.1`, `wireguard kernel`). Toute mise à jour est manuelle + snapshot + rollback `docker load`.

## §0. Valider le lab local (obligatoire avant prod)

- [ ] Le faux VPS simule Caddy `tls internal` + 2 origines, sans Authelia/WireGuard (écart assumé et documenté dans `lab/vps-sim/Caddyfile`).
- [ ] Démarrer le sim et jouer la batterie :

```powershell
# Depuis la racine du dépôt, sur Windows :
docker compose -f lab/vps-sim/docker-compose.yml up -d
powershell -ExecutionPolicy Bypass -File lab/vps-sim/test-vps.ps1
```

```bash
# Équivalent lecture seule depuis WSL (résolution sans toucher à hosts) :
curl -k -m 15 --resolve "parc.test:4433:127.0.0.1" https://parc.test:4433/health
curl -k -m 15 --resolve "api.test:4443:127.0.0.1" https://api.test:4443/v1/statut
curl -k -m 15 --resolve "api.test:4443:127.0.0.1" https://api.test:4443/metrics
```

- [ ] Résultat attendu : `RESULTAT : faux VPS OK (TLS + 2 origines + allowlist + socle ferme)`. Sinon : STOP, ne pas toucher à la prod.

## §1. Comptes et domaine (prérequis)

- [ ] Compte **Oracle Cloud** créé et vérifié (tenancy + compartiment notés, hors doc).
- [ ] Compte **Vercel** créé (plan Hobby), relié au fournisseur git du dépôt.
- [ ] Compte **Cloudflare** créé, domaine `<domaine>` délégué (nameservers Cloudflare actifs, DNSSEC activé si proposé).
- [ ] `<email-admin>` de contact ACME défini (reçoit les alertes Let's Encrypt).
- [ ] Inventaire noté hors dépôt : tenancy Oracle, zone Cloudflare, projet Vercel, `<email-admin>`. Aucun mot de passe dans le dépôt.

## §2. Créer la VM Oracle Always Free

Objectif : Ubuntu 24.04, forme Always Free, 2 ports ouverts seulement.

- [ ] Image : **Ubuntu 24.04 LTS** (x86_64 ou ARM selon dispo Always Free).
- [ ] Forme : **Always Free** (`VM.Standard.E2.1.Micro` ou `VM.Standard.A1.Flex` 1 OCPU / 6 Go — cocher explicitement « Always Free », sinon facturation).
- [ ] Réseau : VCN + sous-réseau public, IP publique réservée (ou éphémère notée), clé SSH publique injectée à la création (jamais de mot de passe).
- [ ] **Security List / NSG : autoriser uniquement** :

| Direction | Protocole | Port | Usage |
|---|---|---|---|
| Entrant | TCP | 443 | Caddy HTTPS (Let's Encrypt + usagers) |
| Entrant | UDP | 51820 | WireGuard boxes → VM |
| Entrant | TCP | 22 | SSH admin — restreindre à ton IP (`<ip-admin>/32`) |
| Sortant | Tout | Tous | ACME, apt, NTP, Object Storage |

- [ ] Vérifier depuis le poste admin :

```bash
ssh <user-vps>@<ip-vm> 'cat /etc/os-release | head -3; uname -m'
nc -zv <ip-vm> 443; echo "443 attendu FERME avant Caddy : code $?"
```

- [ ] Durcir la VM (une fois, en SSH) :

```bash
sudo apt update && sudo apt install -y age wireguard-tools ufw fail2ban unattended-upgrades
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 443/tcp
sudo ufw allow 51820/udp
sudo ufw limit 22/tcp
sudo ufw --force enable
sudo ufw status numbered
sudo systemctl enable --now fail2ban unattended-upgrades
```

- [ ] Créer le volume persistant : tout l'état sous `/opt/lcd/state` (montage persistant, sauvegardé ; jamais dans `/tmp`) :

```bash
sudo mkdir -p /opt/lcd/state/parc /etc/lcd/vault /etc/lcd/wg
sudo chmod 755 /opt/lcd /opt/lcd/state
```

## §3. `deploy-vps.sh` : `init` + `check`

Le script est dans `custom/passerelle-parc/deploy-vps.sh`. Il ne fait **aucun appel réseau** : il prépare le coffre `age`, le hub WireGuard et les squelettes — sans jamais écrire un secret en clair dans le dépôt ni l'afficher.

- [ ] Copier le dépôt (sans secrets) sur la VM :

```bash
# Depuis le poste admin :
scp -r custom/passerelle-parc <user-vps>@<ip-vm>:/tmp/passerelle-parc
ssh <user-vps>@<ip-vm> 'chmod +x /tmp/passerelle-parc/deploy-vps.sh'
```

- [ ] Initialiser le coffre + hub WireGuard :

```bash
ssh -t <user-vps>@<ip-vm> 'sudo LCD_VAULT_DIR=/etc/lcd/vault LCD_WG_DIR=/etc/lcd/wg LCD_DEPOT_DIR=/tmp/passerelle-parc /tmp/passerelle-parc/deploy-vps.sh init'
```

Attendu : `vault prêt ; hub dans /etc/lcd/wg/wg0.conf (0600, hors dépôt)`.

- [ ] **Exfiltrer la clé `age` hors ligne IMMÉDIATEMENT** (sans elle, le vault est perdu ; avec un accès root, il est lisible — risque documenté) :

```bash
ssh -t <user-vps>@<ip-vm> 'sudo cat /etc/lcd/vault/age-key.txt'
# → recopier la sortie DANS un gestionnaire de mots de passe / coffre physique,
# puis effacer le terminal (clear + historique). Ne JAMAIS la coller dans git/ticket.
```

- [ ] Créer le squelette utilisateurs Authelia (hash hors dépôt) :

```bash
ssh -t <user-vps>@<ip-vm> 'sudo /tmp/passerelle-parc/deploy-vps.sh authelia-users'
# Générer chaque hash (ne jamais réutiliser un mot de passe existant) :
docker run --rm authelia/authelia:2024.10 authelia hash-password 'mot-de-passe-temporaire-à-changer'
# → coller chaque hash dans /etc/authelia/users_docker.yml côté VM (0600), groupes parc_admin / parc_operateur.
```

- [ ] Relecture de sûreté (doit sortir `check OK`) :

```bash
ssh <user-vps>@<ip-vm> 'sudo /tmp/passerelle-parc/deploy-vps.sh check'
```

- [ ] Démarrer WireGuard hub :

```bash
ssh -t <user-vps>@<ip-vm> 'sudo wg-quick up wg0; sudo wg show'
```

## §4. Caddy + gateway (compose ou systemd)

Variables gateway (stdlib seule, `gateway.py --serve`) : `LCD_HTTP_PORT` (défaut `8443`), `LCD_BIND` (`127.0.0.1` derrière Caddy sur la même VM), `LCD_STATE_DIR` (`/opt/lcd/state`), `LCD_QUI` (`passerelle_parc`). Caddy lit `{$ZONE}` (= `<domaine>`), `{$API_ZONE}` (= `api.<domaine>` par défaut), `{$ADMIN_EMAIL}`.

- [ ] Vérifier `versions.lock` avant d'installer quoi que ce soit :

```bash
cat custom/passerelle-parc/versions.lock
# Attendu : python "3.12-slim", caddy "2.8", age "1.1", wireguard "kernel".
```

- [ ] Option A (recommandée) — `compose` Caddy + gateway + Authelia sur la VM. Exemple minimal à adapter (fichier sur la VM uniquement, jamais commité avec des secrets) :

```yaml
# /opt/lcd/compose.yml (sur la VM uniquement)
services:
  gateway-parc:
    image: python:3.12-slim
    command: ["python3", "/app/gateway.py", "--boxes", "/app/boxes.yaml", "--config", "/app/config.yaml", "--serve"]
    volumes:
      - /tmp/passerelle-parc:/app:ro
      - /opt/lcd/state:/opt/lcd/state
    environment:
      LCD_HTTP_PORT: "8443"
      LCD_BIND: "0.0.0.0"
      LCD_STATE_DIR: "/opt/lcd/state"
      LCD_QUI: "passerelle_parc"
    networks: [parc]
  caddy:
    image: caddy:2.8
    ports: ["443:443", "80:80"]
    volumes:
      - /tmp/passerelle-parc/Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
      - caddy-config:/config
    environment:
      ZONE: "<domaine>"
      API_ZONE: "api.<domaine>"
      ADMIN_EMAIL: "<email-admin>"
    networks: [parc]
    depends_on: [gateway-parc]
  authelia:
    image: authelia/authelia:2024.10
    volumes:
      - /etc/authelia:/config:ro
      - /etc/lcd/vault:/vault:ro
    networks: [parc]
networks: { parc: {} }
volumes: { caddy-data: {}, caddy-config: {} }
```

```bash
ssh <user-vps>@<ip-vm> 'cd /opt/lcd && sudo docker compose -f compose.yml up -d && sleep 5 && sudo docker compose -f compose.yml ps'
```

- [ ] Option B — `systemd` (sans Docker, Python stdlib + binaire Caddy 2.8) :

```bash
# Sur la VM :
sudo useradd -r -s /usr/sbin/nologin lcd || true
sudo cp -r /tmp/passerelle-parc /opt/lcd/passerelle-parc
sudo chown -R root:lcd /opt/lcd/passerelle-parc
# /etc/systemd/system/lcd-gateway.service :
#   Environment=LCD_HTTP_PORT=8443 LCD_BIND=127.0.0.1 LCD_STATE_DIR=/opt/lcd/state LCD_QUI=passerelle_parc
#   ExecStart=/usr/bin/python3 /opt/lcd/passerelle-parc/gateway.py --boxes /opt/lcd/passerelle-parc/boxes.yaml --config /opt/lcd/passerelle-parc/config.yaml --serve
sudo systemctl daemon-reload
sudo systemctl enable --now lcd-gateway caddy authelia
sudo systemctl status lcd-gateway caddy authelia --no-pager
```

- [ ] Contrôle local (sur la VM, jamais exposé) :

```bash
curl -s http://127.0.0.1:8443/health
curl -s http://127.0.0.1:8443/ready
curl -s http://127.0.0.1:8443/v1/statut | head -c 600; echo
```

## §5. DNS Cloudflare (A + wildcard)

- [ ] Enregistrements (proxy **désactivé** — gris, pas orange — Caddy gère ACME ; TTL court pour bascule future) :

| Type | Nom | Valeur | TTL |
|---|---|---|---|
| A | `parc` | `<ip-vm>` | 300 |
| A | `api` | `<ip-vm>` | 300 |
| A | `sejour` | `<ip-vm>` | 300 (réservé PWA, inactif en P1) |

Pas de wildcard `*` en P1 (surface minimale ; `sejour.` ajouté au cutover P2/P3 si besoin).

```bash
# Vérification propagation (depuis le poste admin) :
dig +short parc.<domaine>
dig +short api.<domaine>
curl -s https://parc.<domaine>/health
curl -s https://api.<domaine>/health
```

- [ ] Attendre le certificat Let's Encrypt (Caddy log `certificate obtained`), puis :

```bash
curl -sI https://parc.<domaine>/health | grep -i strict
curl -sI https://api.<domaine>/health | grep -i strict
# Attendu : Strict-Transport-Security présent (HSTS).
```

## §6. Vercel (front `web/`, `LCD_GATEWAY_URL`)

- [ ] Importer le dépôt dans Vercel : **Root Directory = `web/`**, framework **Next.js**, build `next build`.
- [ ] Variable d'environnement (Production + Preview) :

```text
LCD_GATEWAY_URL=https://api.<domaine>
```

(Jamais de secret dans cette variable : c'est une URL publique. Les clés restent dans `/etc/lcd/vault` côté VM.)

- [ ] Redéployer, puis vérifier le domaine Vercel `https://<projet>.vercel.app/` : la page pilotage charge (même dégradée si la gateway est injoignable, jamais page blanche).
- [ ] Quotas Hobby notés (bande passante, build minutes) — alerte à 80 % (seuil P2, voir procédure migration).

## §7. WireGuard : 1ère box

- [ ] Générer la conf chiffrée + peer hub (sur la VM) :

```bash
ssh -t <user-vps>@<ip-vm> 'sudo /tmp/passerelle-parc/deploy-vps.sh wg-key box-log1 10.99.0.2 && sudo wg show'
```

Attendu : `peer box-log1 ajouté (10.99.0.2/32)`, conf chiffrée `/etc/lcd/vault/wg/box-log1.conf.age`.

- [ ] Transférer la conf à la box **par canal chiffré uniquement** (jamais par mail/chat en clair) :

```bash
# Sur la VM : déchiffrer vers stdout puis pipe SSH vers la box (rien ne reste en clair sur disque) :
sudo age -d -i /etc/lcd/vault/age-key.txt /etc/lcd/vault/wg/box-log1.conf.age | ssh <user-box>@<ip-box-locale> 'sudo tee /etc/wireguard/wg0.conf > /dev/null && sudo chmod 600 /etc/wireguard/wg0.conf'
```

- [ ] Monter le tunnel des deux côtés et tester via le réseau WG uniquement (jamais en WAN direct) :

```bash
ssh <user-box>@<ip-box-locale> 'sudo wg-quick up wg0; ping -c3 10.99.0.1'
ssh <user-vps>@<ip-vm> 'ping -c3 10.99.0.2; sudo wg show'
```

## §8. Tests bout-en-bout (copiables)

Exécuter dans l'ordre, noter chaque sortie. Tout échec bloque le DONE.

```bash
# 1. Santé gateway via Caddy (Authelia : session requise pour /v1/*, /health public selon config) :
curl -s https://api.<domaine>/health
curl -s https://api.<domaine>/ready
curl -s https://api.<domaine>/v1/statut
curl -s https://api.<domaine>/metrics | head -c 800; echo

# 2. Socle NON exposé (doit ÉCHOUER en WAN — comportement voulu) :
curl -m 8 -sI http://<ip-vm>:8123/ ; echo "8123 WAN attendu : timeout/refusé (code $?)"
curl -m 8 -sI http://<ip-vm>:8443/health ; echo "8443 WAN direct attendu : refusé (code $?)"

# 3. En-têtes sécurité :
curl -sI https://parc.<domaine>/ | grep -Ei 'strict|x-content-type|x-frame|referrer|permissions'

# 4. Relecture sûreté finale :
ssh <user-vps>@<ip-vm> 'sudo /tmp/passerelle-parc/deploy-vps.sh check'
```

- [ ] Front Vercel — 4 parcours (cocher après essai réel) :
  - [ ] `/` **Pilotage** : cartes logements visibles, 1 action 1-tap d'essai (`ref` unique, `qui` opérateur) → `200` + double log (journal parc + journal moteur box).
  - [ ] `/voyageur` **Séjour** : devis/contrat relayé par l'hôte (jamais d'écriture anonyme), PWA installable.
  - [ ] `/proprio` **Relevé** : lecture seule du portail tiers, sans PII bancaire (référence `env:`/`vault:` uniquement).
  - [ ] `/commercial` **Prospects** : pipeline + simulateur, scope `commercial_01` strict.
- [ ] Idempotence vérifiée : rejouer le même `POST /v1/action` avec le même `ref` → réponse `idempotent: true`, aucun doublon moteur.

## §9. Critères DONE (tout doit être coché)

- [ ] `deploy-vps.sh check` → `check OK`.
- [ ] `test-vps.ps1` local toujours vert (non-régression lab).
- [ ] `https://parc.<domaine>/health` → `{"ok": true}` ; `https://api.<domaine>/v1/statut` → `phase_conseillee: "p1"`.
- [ ] Front Vercel : 4 parcours OK (pilotage/voyageur/proprio/commercial).
- [ ] 1ère box en WireGuard (`10.99.0.2` ping OK des deux côtés), peer `/32` + `PersistentKeepalive = 25`.
- [ ] Clé `age` hors ligne (coffre physique/gestionnaire), `users_docker.yml` en `0600` hors dépôt, hash Authelia changés (plus de temporaires).
- [ ] Backup quotidien chiffré actif (voir procédure backup/restore), 1er backup testé.
- [ ] Ports WAN : seuls `443/tcp` + `51820/udp` (+ `22/tcp` restreint) répondent ; socle injoignable en WAN.
- [ ] `versions.lock` archivé avec la date de mise en service (snapshot noté hors dépôt).

## Dépannage rapide

| Symptôme | Cause probable | Commande |
|---|---|---|
| `523` / timeout sur `parc.` | DNS pas propagé ou Caddy sans cert | `dig +short parc.<domaine>` ; `docker logs caddy` / `journalctl -u caddy` |
| `401` sur `/v1/*` | Session Authelia absente | Se connecter sur `parc.<domaine>`, vérifier `users_docker.yml` + groupes |
| `wg show` sans handshake | `51820/udp` fermé ou peer `/32` faux | `sudo ufw status` ; `sudo wg show` ; `ping 10.99.0.1` depuis box |
| Front Vercel « gateway injoignable » | `LCD_GATEWAY_URL` faux ou Caddy down | Vérifier env Vercel, `curl https://api.<domaine>/health` |
| `check` KO « secret en clair » | Vraie valeur collée dans `.example` | Supprimer le fichier fautif, régénérer via `deploy-vps.sh`, rejouer `check` |
