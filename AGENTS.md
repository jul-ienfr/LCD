# AGENTS.md — Location courte durée (LCD)

## Périmètre actif : V2

La version en cours de développement est `v2/` (Next.js + Postgres/Mailpit locaux).
La V1 et le lab sont **gelés** : ils restent la source de référence (code, plans,
docs, registres, données) mais **ne doivent plus être lancés**.

## Interdictions (gel du 2026-10-26)

Ne PAS exécuter, même pour « vérifier » ou « tester » :

- `deploy/demarrer.ps1` (pile V1 : web + Authelia + Caddy)
- `deploy/installer-taches.ps1` (réactive la veille/sauvegarde/entretien)
- `lab/lab-run.ps1` et tout `docker compose up` dans `deploy/` ou `lab/`
- `docker start` des conteneurs `lcd-*` (V1 et lab)

État posé : les 28 conteneurs `lcd-*` sont arrêtés avec `restart=no`, les 5 tâches
planifiées `LCD *` sont désactivées. Toute remise en route exige un accord
explicite de l'utilisateur.

## À ne jamais supprimer

`deploy/`, `lab/`, `web/`, `custom/`, `homeassistant/`, `docs/` et leurs données
(volumes Docker, `lab/*.lab/`, backups, secrets locaux) : ce sont les sources de
la V1 et du lab, conservées volontairement.

## Hors périmètre

Ne pas arrêter l'infra sans rapport : Docker Desktop, conteneurs `v2-*`,
`opencode-vpn-*`, serveur proxy opencode :4000.
