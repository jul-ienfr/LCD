# lab/README.md — lab Docker LCD (branche `lab/docker`).

# Code dans CE repo, tests ici, déploiement prod/box ENSUITE.
# 0 € logiciel (images `python:slim`, stdlib seule). LAN du lab = réseau
# docker interne, jamais WAN. Secrets FAUX de lab seuls, jamais de clés réelles.

## Démarrage

```sh
cd lab
cp secrets.lab.yaml.EXAMPLE secrets.lab.yaml   # valeurs FAUSSES déjà dedans
docker compose up -d --build
python3 tests_lab.py
```

Le lab FAIT OFFICE DE BOX : mêmes images génériques transférables, mêmes
ports, mêmes volumes — seule la config/logements/secrets change par box.
Nouveau logement = bloc `logements.lab.yaml` + `prestataires.lab/logX.yaml`,
0 rebuild. Export box : `sh export-box.sh` → `lcd-box-<date>.tar`
(`docker load -i ... && docker compose up -d` sur la box avec SES fichiers).

## Batterie (P2-14 : résa <60 s + conflit ICS ; P6-8 : dispatch prestataires)

`tests_lab.py` vérifie, dans l'ordre :
1. `/health` des 7 moteurs (8090→8096) ;
2. bornes prix 75/290 inviolables (pivot août ∈ [75,290]) ;
3. garde-fou copro P2-16 (`copro_verifiee=true` dans le lab, `false` dans le réel) ;
4. tunnel direct <60 s : `POST /devis` → `POST /resa` (brouillon) →
   `POST /confirmer` (1-tap `qui=test-lab-humain`) ;
5. conflit ICS : 2e résa mêmes dates refusée ;
6. garde-fous : `confirmer qui=auto` refusé 400, `debiter qui=auto` refusé 400 ;
7. taxe séjour Métropole NCA via `/taxe`.
8. dispatch P6-8 (§12.4-bis) : annuaire log1 (serrurier RC expirée =
   `suspendu_assurance`, alerte couverture <2), dispatch `fuite_eau` =
   `lab_plomb_01` (tri prix en zone), `panne_elec` hors zone = escalade + 2e
   choix (jamais auto), migration `zone:`→`zones:` (log2), mission
   `qui=auto` 400 + mission humaine 201 (dossier `interventions/`), mission
   RC expirée 403, sinistre airbnb 201 (échéance 14 j).

## Fichiers

- `Dockerfile.moteur` : image générique stdlib (build-args `SCRIPT` + `CONFIG`).
- `docker-compose.yml` : 7 moteurs + volumes state/logs + healthchecks.
- `export-box.sh` : `docker save` → `.tar` transférable (box = `docker load` + up).
- `prestataires.lab/log{1,2}.yaml` : annuaires FICTIFS lab (tri prix, hors zone,
  RC expirée, migration `zone:`) — le réel `custom/prestataires/` reste vide.
- `lab-config/*.yaml` : configs de LAB (URLs inter-services docker, `ha_url: ""`).
- `logements.lab.yaml` : COPIE lab (`verifiee:true`, `moteur_direct:maison`,
  noms fictifs) — le réel `custom/logements.yaml` garde `verifiee:false` BLOQUÉ.
- `secrets.lab.yaml` (gitignoré, à créer depuis `.EXAMPLE`) : faux secrets de lab.
- `branding.lab.yaml` : marque fictive (le réel `custom/branding.yaml` est privé).

## Teardown

```sh
docker compose down -v   # supprime conteneurs + volumes runtime
```

`lab/*state*/`, `lab/secrets.lab.yaml`, `lab/*.log` sont gitignorés (runtime,
jamais commités — cf. `.gitignore`). Seuls code + configs lab + gabarits sont
versionnés sur `lab/docker`.
