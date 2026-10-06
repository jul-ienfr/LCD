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

## Batterie (P2-14 : résa <60 s + conflit ICS)

`tests_lab.py` vérifie, dans l'ordre :
1. `/health` des 6 moteurs (8090→8095) ;
2. bornes prix 75/290 inviolables (pivot août ∈ [75,290]) ;
3. garde-fou copro P2-16 (`copro_verifiee=true` dans le lab, `false` dans le réel) ;
4. tunnel direct <60 s : `POST /devis` → `POST /resa` (brouillon) →
   `POST /confirmer` (1-tap `qui=test-lab-humain`) ;
5. conflit ICS : 2e résa mêmes dates refusée ;
6. garde-fous : `confirmer qui=auto` refusé 400, `debiter qui=auto` refusé 400 ;
7. taxe CASA +44 % via `/taxe`.

## Fichiers

- `Dockerfile.moteur` : image générique stdlib (build-args `SCRIPT` + `CONFIG`).
- `docker-compose.yml` : 6 moteurs + volumes state/logs + healthchecks.
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
