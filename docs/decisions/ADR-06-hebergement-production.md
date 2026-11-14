# ADR-06 — Hébergement de production, base et exploitation

- **Statut** : Accepté par défaut technique — **contresignature exploitant
  requise avant tout engagement de coût ou achat de domaine**
- **Date** : 2026-11-14
- **Décideur** : exploitant LCD (fondateur) ; proposition et mise en œuvre
  technique par l'assistant
- **Feature** : `specs/005-mise-en-production` (T003, T004, T009, T134)
- **Remplace** : la cible Netlify implicite de `v2/netlify.toml`

## Contexte

La V2 est une application SvelteKit complète (`adapter-node`) avec :

- PostgreSQL et 104 migrations Drizzle ;
- des planificateurs in-process (ICS, fournisseurs) qui exigent un processus
  long ;
- des crons HTTP protégés par `CRON_SECRET` ;
- un volume persistant pour les photos de preuve ;
- Caddy comme reverse proxy et Terminaison TLS ;
- Uptime Kuma pour la supervision.

Netlify ne convient plus : `v2/netlify.toml` publie encore `.next` (reliquat de
l'ancienne application Next), le plan gratuit est épuisé, les fonctions
serverless ne portent ni les planificateurs in-process ni le volume photos, et
les workflows cron pointent vers une URL Netlify morte.

## Décision

### 1. Cible : un VPS unique, Docker Compose, région UE

| Élément | Choix retenu |
| --- | --- |
| Serveur | VPS **Debian 13** ou **Ubuntu 24.04 LTS**, 2 vCPU, 4 Go RAM, 40 Go SSD minimum |
| Localisation | Union européenne (France ou Allemagne), conforme RGPD |
| Orchestration | Docker Engine + plugin Compose, redémarrage au boot |
| Reverse proxy / TLS | Caddy 2, certificats Let's Encrypt automatiques |
| Application | conteneur `web` (`adapter-node`, Node 24) |
| Base | PostgreSQL 18 dans un conteneur dédié, volume `pgdata` |
| Fichiers | volume `photos` monté sur `/var/lib/lcd/photos` |
| Supervision | Uptime Kuma dans le compose ; Sentry optionnel |
| Sauvegardes | `db:backup` chiffré, copie hors serveur, rétention 30 jours |
| Fournisseurs pressentis | Hetzner (CX22/CX32), Scaleway (DEV1-M), OVH VPS — prix indicatifs 5-15 €/mois, à vérifier au provisionnement |

Le compose de production existe déjà : `v2/compose.prod.yml` (services
`postgres`, `web`, `caddy`, `tools`, `uptime-kuma`) et `v2/Caddyfile`.

**Pourquoi un seul VPS** : à l'échelle du pilote (1 à 10 logements), un VPS
2 vCPU / 4 Go absorbe l'application, la base et les sauvegardes locales. La
séparation base/serveur ajouterait du coût, de la latence et une surface
d'exploitation sans bénéfice mesurable avant plusieurs centaines de tenants.

### 2. Base de données, RPO et RTO

- **PostgreSQL 18 auto-hébergé** dans le compose, volume persistant.
- Rôle propriétaire `lcd` : migrations, seed, sauvegardes.
- Rôle applicatif `lcd_app` non-propriétaire : RLS réellement appliquée,
  vérifiée par `npm run db:test-rls`.
- **RPO : 24 h** — sauvegarde chiffrée quotidienne à 02:00 UTC, copie hors
  serveur le jour même.
- **RTO : 30 min** — restauration testée sur base jetable, procédure
  `db:restore-test` puis bascule du volume.
- Une base managée UE (Scaleway RDB, Neon, Supabase) reste possible via
  `compose.prod.external-db.yml` ; elle n'est pas retenue pour le pilote car
  elle ajoute 15-40 €/mois sans simplifier la restauration.

### 3. Netlify : retiré de la cible

- `v2/netlify.toml` est **supprimé** : il publie `.next`, ne correspond plus à
  l'application SvelteKit et entretient une cible morte.
- Les workflows GitHub qui appellent `https://lcd-parc.netlify.app` sont
  réécrits pour lire une variable `LCD_APP_URL` (secrets/variables du dépôt),
  avec `https://` obligatoire et échec explicite si elle manque.
- Netlify pourra rester un miroir statique de vitrine, jamais l'application.

### 4. Sort de `v2/src/app`

`v2/src/app` est l'ancienne application Next conservée comme référence. Elle
n'est **pas** supprimée avant la bascule : elle sert de comparaison de
comportement pendant la recette. Décision finale à T134, après la bascule :
suppression si aucun écran n'a été oublié, sinon conservation en lecture seule
avec un tag dédié.

### 5. Domaine, DNS et SMTP

- **DNS** : chez le registrar de l'exploitant, titulaire = exploitant. Un
  enregistrement `A` (et `AAAA` si IPv6) vers le VPS, TTL 300 s avant bascule.
- **Nom** : à confirmer par l'exploitant ; par défaut `lcd.<domaine>` pour le
  pilote, avec `www` en redirection.
- **SMTP** : Brevo (déjà utilisé pour le SMS) ou Postmark/Mailgun. SPF, DKIM et
  DMARC obligatoires avant le premier envoi réel. `EMAIL_ENABLED=false` tant
  que ces enregistrements ne sont pas vérifiés.
- **Webhook e-mail entrant** : `EMAIL_INBOUND_DOMAIN` séparé, secret HMAC
  dédié, jamais le même que `CRON_SECRET`.

### 6. Secrets

Générés sur le serveur avec `openssl rand`, stockés uniquement dans
`.env.prod` (`chmod 600`) et dans le gestionnaire de mots de passe de
l'exploitant. Jamais dans Git, jamais dans un ticket, jamais en clair dans un
rapport. Rotation documentée dans `docs/ops/runbook-production.md`.

## Options évaluées

| Option | Coût indicatif | Avantages | Blocages | Verdict |
| --- | --- | --- | --- | --- |
| **VPS Docker + Caddy** | 5-15 €/mois | processus long, cron, volume, TLS auto, tout outillé | exploitation à la charge de l'exploitant | **retenu** |
| Netlify payant | 19 $/mois+ | déploiement simple | `.next` obsolète, pas de planificateur ni volume, cron externe | rejeté |
| Render | 7 $/mois web + 6 $/mois base | gestion simplifiée | planificateurs in-process à revoir, coût base | repli |
| Oracle Cloud Free | 0 € | gratuit | ARM, quotas, opacité, région parfois hors UE | rejeté |
| Base managée UE seule | 15-40 €/mois | sauvegardes gérées | coût, latence, pas de gain à cette échelle | repli |

## Conséquences

**Positives**

- une seule cible, un seul runbook, un seul pipeline ;
- les planificateurs in-process fonctionnent sans contournement ;
- les photos et la base sont sur des volumes sauvegardables ;
- le retour arrière consiste à redéployer un tag, pas à changer de plateforme.

**Négatives / à assumer**

- l'exploitant devient responsable du durcissement, des mises à jour et de
  l'astreinte ;
- un seul VPS = pas de haute disponibilité ; acceptable pour le pilote, à
  revoir au-delà de 10 logements ;
- la restauration doit être testée, pas supposée.

## Actions de mise en œuvre

1. Contresigner cet ADR (case ci-dessous) et fixer le plafond mensuel.
2. Provisionner le VPS et le domaine (T040-T041).
3. Générer les secrets et remplir `.env.prod` (T008, T044).
4. Appliquer les migrations et créer `lcd_app` (T046-T047).
5. Vérifier `/api/ready`, l'e-mail réel, la sauvegarde restaurée, l'alerte et
   le rollback (T050-T057).

## Signature

- [ ] J'accepte la cible VPS Docker + Caddy + PostgreSQL UE.
- [ ] Je fixe le plafond d'hébergement à ______ €/mois.
- [ ] Je confirme le nom de domaine : ______________________
- [ ] Je confirme le fournisseur SMTP : ______________________

**Tant que cette case n'est pas cochée, aucun serveur payant n'est commandé.**
Les travaux locaux (scripts, runbook, preflight) restent exécutables sans
engagement.

## Révision

Décision à revoir : au passage à 10 logements actifs, à 100 tenants, ou si la
disponibilité mesurée tombe sous 99,5 % deux mois de suite.
