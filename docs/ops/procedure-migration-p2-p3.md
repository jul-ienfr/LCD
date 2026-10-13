# PROCÉDURE MIGRATION — Bascule documentée P1 → P2 → P3

> **Objet.** Faire basculer l'hébergement LCD sans perte de données ni interruption visible : P1 (front Vercel + gateway VM Oracle) → P2 (front `next start` sur la VM + Caddy 2 blocs, sortie de Vercel) → P3 (VPS Hetzner/OVH ~5 €/mois, sortie d'Oracle). Chaque bascule a un plan de rollback < 30 min, testé avant le cutover DNS.
>
> **Prérequis.** P1 en service et DONE (voir `procedure-p1-mise-en-service.md`) ; `GET /v1/statut` répond et ses compteurs sont lus chaque semaine ; snapshot frais + backup chiffré `age` vérifié avant toute bascule ; `versions.lock` épinglé et archivé ; accès Oracle + Cloudflare + Vercel + (pour P3) compte Hetzner/OVH ; clé `age` hors ligne disponible ; créneau de bascule annoncé aux opérateurs.
>
> **Coût : 0 € (sauf P3 ~5 €/mois).** P1 → P2 = 0 € (même VM Oracle). P2/P3 = VPS Hetzner/OVH ~5 €/mois (facturation au prorata pendant la cohabitation, ~quelques jours). Prévoir le double run pendant la bascule.

## Règles intangibles

- **Jamais de secret en clair** : les secrets voyagent uniquement via le vault `age` (`/etc/lcd/vault`, `0600`) et des canaux chiffrés (SSH/WireGuard). `deploy-vps.sh check` vert avant ET après chaque bascule.
- Compteurs de vérité : `GET /v1/statut` (helper `statut_h.py`) expose `phase_conseillee`, `motif`, `seuils`, `etat` (lecture seule, sans secret ni PII). On ne bascule jamais « au feeling ».
- TTL DNS court (300 s) **au moins 48 h avant** tout cutover, pour un rollback < 30 min.
- Chaque bascule = snapshot + `versions.lock` archivé + test bout-en-bout + rollback répété. Pas d'étape sautée.

## §0. Lire les seuils (GET /v1/statut)

```bash
curl -s https://api.<domaine>/v1/statut | python3 -m json.tool
```

Réponse (champs utiles) :

```json
{
  "phase_conseillee": "p1",
  "motif": "defaut",
  "seuils": { "vercel_bande_go_mois": 100, "vm_cpu_pct_durable": 70, "vm_ram_pct_durable": 70, "nb_logements_p3": 10 },
  "etat": { "mesure": true, "uptime_s": 123456, "nb_logements": 3, "nb_boxes": 1,
            "vercel_bande_go_mois": 12, "vm_cpu_pct": 22, "vm_ram_pct": 41, "vm_disque_pct": 35,
            "base_octets": 245760 },
  "outbox_total": 0, "lecture_seule": true
}
```

Seuils câblés (`statut_h.py`, `SEUILS`) :

| Signal | Seuil | Phase conseillée |
|---|---|---|
| `vercel_bande_go_mois` ≥ 80 (≈ 80 % du quota 100 Go) | 80 Go/mois | **p2** (sortir de Vercel) |
| `vm_cpu_pct` ou `vm_ram_pct` durable ≥ 70 | 70 % | **p3** (VM saturée) |
| `vm_disque_pct` ≥ 90 | 90 % | **p3** (disque) |
| `nb_logements` ≥ 10 | 10 logements | **p3** (taille parc) |

« Durable » = 3 relevés consécutifs sur 7 jours (cron 5 min via `deploy-vps.sh statut`, relevé hebdo manuel). Un pic isolé ne déclenche rien.

## §1. Matrice de décision rester / basculer

| Situation | Décision | Justification |
|---|---|---|
| `phase_conseillee: p1`, tous compteurs < 70 % seuils | **Rester en P1** | 0 €, Vercel absorbe, VM large |
| Bande Vercel 60-79 % en croissance | **Préparer P2** (TTL 300, build `web/` sur VM en staging) sans cutover | Anticiper, pas subir |
| `phase_conseillee: p2` (bande ≥ 80) | **Basculer P1 → P2** | Quota Vercel menacé (surcoût ou coupure) |
| VM > 70 % durable OU disque ≥ 90 % | **Basculer vers P3** | Oracle Always Free au plafond |
| `nb_logements` ≥ ~10 | **Basculer vers P3** | Marge + SLA avant saturation |
| Incident Vercel ou Oracle (panne > 2 h) | **Basculer au palier suivant en urgence** | Procédure identique, créneau immédiat |
| Doute / compteurs `mesure: false` | **Rester, fiabiliser la mesure** | Pas de bascule aveugle |

## §2. Préparation commune (P2 et P3)

- [ ] TTL DNS à 300 s sur `parc.`, `api.` (et `sejour.` si utilisé) **48 h avant** :

```bash
dig +short parc.<domaine>
# Vérifier TTL : dig parc.<domaine> | grep -E 'parc\..*IN.*A'
```

- [ ] Snapshot + `versions.lock` archivés (hors dépôt) :

```bash
# Sur la VM source :
sudo cp custom/passerelle-parc/versions.lock /opt/lcd/state/snapshot-$(date -u +%Y%m%dT%H%M%SZ)-versions.lock
ls -l /opt/lcd/state/snapshot-*-versions.lock
python3 custom/passerelle-parc/stockage.py --db /opt/lcd/state/parc/parc.db --check
```

- [ ] Backup chiffré frais + vérifié (voir `procedure-backup-restore.md`), archive `.age` récupérable hors site.
- [ ] `deploy-vps.sh check` vert sur la source.
- [ ] Noter l'heure de cutover, prévenir opérateurs (gel des écritures 1-tap pendant la fenêtre, 30 min max).

## §3. Bascule P1 → P2 (front `next start` sur VM)

Principe : le front `web/` tourne en `next start` sur la VM derrière le **2e bloc Caddy** (`parc.<domaine>` sert le front, `api.<domaine>` sert la gateway — les deux blocs existent déjà dans `custom/passerelle-parc/Caddyfile`). Le cutover DNS fait pointer le domaine public vers la VM au lieu de Vercel.

Architecture avant / après :

```text
AVANT (P1) : usager → Vercel (web/) → https://api.<domaine> → Caddy VM → gateway :8443
APRÈS (P2) : usager → Caddy VM :443 [parc.<domaine> → next start :3000 | api.<domaine> → gateway :8443]
```

- [ ] Sur la VM : installer Node pinned (noter la version dans le snapshot), builder le front :

```bash
node --version; npm --version
# Sur la VM, depuis une copie du dépôt :
cd /opt/lcd/depot/web
npm ci
npm run build
# Variables : le front lit LCD_GATEWAY_URL côté serveur :
echo "LCD_GATEWAY_URL=https://api.<domaine>" | sudo tee /opt/lcd/web.env > /dev/null
```

- [ ] Lancer `web/` en `next start` (systemd, port 3000 local uniquement) :

```bash
# /etc/systemd/system/lcd-web.service :
#   EnvironmentFile=/opt/lcd/web.env
#   WorkingDirectory=/opt/lcd/depot/web
#   ExecStart=/usr/bin/npm run start -- --port 3000 --hostname 127.0.0.1
sudo systemctl daemon-reload
sudo systemctl enable --now lcd-web
curl -s http://127.0.0.1:3000/ | head -c 300; echo
```

- [ ] Activer les 2 blocs Caddy (`parc.` → `127.0.0.1:3000`, `api.` → `gateway-parc:8443`, Authelia devant les deux — cf. `Caddyfile` §16.3) et recharger :

```bash
sudo caddy fmt --overwrite /etc/caddy/Caddyfile
sudo caddy reload --config /etc/caddy/Caddyfile
curl -sk https://parc.<domaine>/health
curl -sk https://api.<domaine>/health
```

- [ ] Tests pré-cutover (via `/etc/hosts` local ou `--resolve`, sans toucher au DNS public) :

```bash
curl -s http://127.0.0.1:3000/ | grep -i pilotage
curl -s https://parc.<domaine>/ | grep -oiE '(pilotage|séjour|relevé|prospect)'
curl -s https://api.<domaine>/v1/statut | python3 -m json.tool | head -20
```

- [ ] 4 parcours front sur la VM : `/` pilotage, `/voyageur`, `/proprio`, `/commercial` (mêmes critères que P1 §8).
- [ ] **Cutover DNS** : basculer l'enregistrement du domaine public (celui servi par Vercel) vers `<ip-vm>` (A, TTL 300). Attendre propagation :

```bash
dig +short <domaine-public>
curl -s https://<domaine-public>/ | head -c 300; echo
```

- [ ] Garder Vercel déployé **7 jours** (rollback instantané), puis suspendre le projet (pas supprimer : historique + env conservés).
- [ ] `deploy-vps.sh check` vert post-bascule.

**Rollback P2 → P1 (< 30 min) :**

```bash
# 1. Re-pointer le DNS public vers Vercel (valeur notée avant cutover, ex. cname Vercel) :
#    Cloudflare : remettre l'enregistrement, TTL 300.
# 2. Vérifier :
curl -s https://<domaine-public>/ | head -c 200; echo
curl -s https://api.<domaine>/v1/statut | grep phase_conseillee
# 3. Stopper lcd-web si besoin (la gateway reste identique, aucune donnée migrée) :
sudo systemctl stop lcd-web
```

Aucune donnée à réimporter en P1 → P2 (même `parc.db`, même VM). Durée typique : propagation DNS (≤ 5 min à TTL 300) + vérif.

## §4. Bascule P1/P2 → P3 (VPS Hetzner/OVH ~5 €)

Principe : nouveau VPS (~5 €/mois), on y rejoue `init`, on importe `parc.db` + registres YAML + volumes `state`, on re-paire WireGuard (nouveau hub = nouvelles clés), on teste, puis cutover DNS.

- [ ] Créer le VPS cible : Ubuntu 24.04, 2 vCPU / 4 Go min, IP `<ip-vps-p3>`. Ouvrir uniquement `443/tcp` + `51820/udp` (+ `22/tcp` restreint). Même durcissement qu'en P1 §2 (`ufw`, `fail2ban`, `age`, `wireguard-tools`).
- [ ] Snapshot source : registres + `versions.lock` + base :

```bash
# Sur la VM SOURCE :
sudo python3 custom/passerelle-parc/stockage.py --db /opt/lcd/state/parc/parc.db --check
sudo python3 custom/passerelle-parc/stockage.py --db /opt/lcd/state/parc/parc.db --export > /tmp/registres-export.yaml
sudo cp custom/passerelle-parc/versions.lock /tmp/versions.lock.snapshot
# Backup chiffré age (voir procédure backup) → archive /tmp/lcd-p3-migration.age (hors site aussi).
```

- [ ] Sur le VPS P3 : `init` + `check` (nouveau vault, nouvelles clés — on ne copie JAMAIS `/etc/lcd/vault` ni `/etc/lcd/wg/wg0.conf` de la source) :

```bash
scp -r custom/passerelle-parc <user-vps>@<ip-vps-p3>:/tmp/passerelle-parc
ssh -t <user-vps>@<ip-vps-p3> 'sudo /tmp/passerelle-parc/deploy-vps.sh init'
# → exfiltrer la NOUVELLE clé age hors ligne (coffre physique, étiquetée "P3").
ssh <user-vps>@<ip-vps-p3> 'sudo /tmp/passerelle-parc/deploy-vps.sh authelia-users'
# → recréer users_docker.yml (nouveaux hash, jamais copiés de P1/P2 en clair).
```

- [ ] Importer `parc.db` (via `VACUUM INTO`, jamais de copie à chaud sans checkpoint) :

```bash
# Sur la SOURCE : figée écrite (stop gateway ou gel écritures), snapshot cohérent :
ssh <user-vps>@<ip-source> 'sudo sqlite3 /opt/lcd/state/parc/parc.db "PRAGMA wal_checkpoint(TRUNCATE); VACUUM INTO '"'"'/tmp/parc-export.db'"'"';" && ls -l /tmp/parc-export.db'
# Transfert chiffré + import cible :
scp <user-vps>@<ip-source>:/tmp/parc-export.db /tmp/parc-export.db
scp /tmp/parc-export.db <user-vps>@<ip-vps-p3>:/tmp/parc-export.db
ssh -t <user-vps>@<ip-vps-p3> 'sudo install -o lcd -g lcd -m 640 /tmp/parc-export.db /opt/lcd/state/parc/parc.db && sudo python3 /tmp/passerelle-parc/stockage.py --db /opt/lcd/state/parc/parc.db --check'
```

- [ ] Importer registres YAML + volumes `state` (snapshots, journal, outbox) :

```bash
# Registres versionnés (boxes.yaml, logements, annonces, entites, mandats, prospects, llm, config) :
scp custom/passerelle-parc/{boxes.yaml,annonces.yaml,entites.yaml,mandats.yaml,prospects.yaml,llm.yaml,config.yaml} <user-vps>@<ip-vps-p3>:/tmp/
# Volumes state (hors base) :
ssh <user-vps>@<ip-source> 'sudo tar -czf /tmp/state-volumes.tgz -C /opt/lcd/state --exclude=parc/parc.db --exclude=parc/parc.db-wal --exclude=parc/parc.db-shm .'
scp <user-vps>@<ip-source>:/tmp/state-volumes.tgz /tmp/
scp /tmp/state-volumes.tgz <user-vps>@<ip-vps-p3>:/tmp/
ssh -t <user-vps>@<ip-vps-p3> 'sudo tar -xzf /tmp/state-volumes.tgz -C /opt/lcd/state && sudo chown -R lcd:lcd /opt/lcd/state'
```

- [ ] Re-pair WireGuard (chaque box reçoit une conf du NOUVEAU hub, canal chiffré) :

```bash
# Pour chaque box (ex. box-log1 10.99.0.2) — sur le VPS P3 :
ssh -t <user-vps>@<ip-vps-p3> 'sudo /tmp/passerelle-parc/deploy-vps.sh wg-key box-log1 10.99.0.2'
# Transférer comme en P1 §7 (age -d | ssh tee), UNE box à la fois, ping 10.99.0.1 après chacune.
# Garder l'ancien tunnel vers P1/P2 actif jusqu'au cutover (2 confs possibles côté box en bascule manuelle).
```

- [ ] Monter Caddy + gateway (+ `lcd-web` si P2) sur P3 à l'identique (même `Caddyfile`, mêmes `LCD_*`, `ZONE=<domaine>`), puis tests **sans cutover** (via `--resolve` vers `<ip-vps-p3>`) :

```bash
curl -k -m 15 --resolve "parc.<domaine>:443:<ip-vps-p3>" https://parc.<domaine>/health
curl -k -m 15 --resolve "api.<domaine>:443:<ip-vps-p3>" https://api.<domaine>/v1/statut
curl -k -m 15 --resolve "api.<domaine>:443:<ip-vps-p3>" https://api.<domaine>/metrics | head -c 400; echo
```

- [ ] 4 parcours front + 1 écriture 1-tap d'essai (`ref` unique `P3-TEST-1`) + rejou idempotent.
- [ ] **Cutover DNS** : `parc.` + `api.` (+ `sejour.` si actif) → `<ip-vps-p3>` (A, TTL 300). Vérifier propagation + certificats (Caddy obtient ses propres certs LE sur P3) :

```bash
dig +short parc.<domaine>; dig +short api.<domaine>
curl -s https://parc.<domaine>/health
curl -s https://api.<domaine>/v1/statut | grep phase_conseillee
```

- [ ] Fenêtre de gel : couper les écritures sur l'ancien palier AVANT le cutover final (sinon divergence `parc.db`) ; rejouer l'export `VACUUM INTO` final si des écritures ont eu lieu pendant les tests.
- [ ] Garder l'ancien palier **7 jours** en veille (stop services, VM conservée), puis le détruire. `deploy-vps.sh check` vert sur P3.

**Rollback P3 → palier précédent (< 30 min) :**

```bash
# 1. DNS : re-pointer parc./api. vers l'ancienne IP (notée avant cutover), TTL 300.
# 2. Sur l'ancien palier : redémarrer les services (ils sont intacts, base d'avant-cutover) :
sudo systemctl start lcd-gateway lcd-web  # ou : docker compose -f /opt/lcd/compose.yml up -d
#    ou, si des écritures P3 doivent être récupérées : VACUUM INTO inverse P3 → ancien (même procédure §4).
# 3. Vérifier :
curl -s https://api.<domaine>/health
curl -s https://api.<domaine>/v1/statut | grep phase_conseillee
```

Durée typique : DNS (≤ 5 min) + redémarrage (≤ 5 min) + vérif (≤ 10 min). Si divergence de base > 30 min de réconciliation : restaurer le backup `age` pré-cutover (voir procédure backup/restore) plutôt que fusionner à la main.

## §5. Après chaque bascule (ne pas oublier)

- [ ] Mettre à jour l'inventaire hors dépôt (IP active, palier courant, date, `versions.lock` archivé).
- [ ] Restaurer TTL DNS normaux (3600) après 7 jours de stabilité.
- [ ] Relever `/v1/statut` : `phase_conseillee` doit redevenir `p1` (ou le palier attendu) avec `mesure: true`.
- [ ] Re-tester le backup quotidien sur le nouveau palier (1er cycle `age` vérifié).
- [ ] Clore le créneau : opérateurs notifiés, gel levé, DONE signé.
