# LCD Parc — Démarrage 60 secondes

SAS de gestion locative saisonnière (3 logements, 2 boxe sim). Tout tourne
en local, sans cloud payant. Fonctionne SANS JavaScript (formulaire natifs),
i18n ×5 sur le parcours voyageur.

## 1. Lancer le lab complet (test + démo, ~3 min)

```
pwsh lab/lab-run.ps1
```

Verdict partagé 0-5/5 : reset fixtures → rebuild → santé 19 ports →
batterie passerelle (74 sections) → vps-sim 7/7 → build front + stack
self-hosted (deploy 7 checks fail-closed + recette IdP 22/22 + batterie
front 46/46) → down -v.
Ajouter `-NoDeploy` pour sauter l'étape front.

## 2. Ou : garder le SAS durablement UP (démo continue)

```
pwsh lab/start-all.ps1
```

 reste UP (lab + vps-sim + deploy), idempotent, pas de teardown.

## 3. Ouvrir le produit

| URL | Quoi |
| --- | --- |
| <http://127.0.0.1:3100> | **SAS front** direct (démo/SAS local, sans TLS — l'entrée officielle est celle du dessous) |
| <https://lcd.test:4001> | **Entrée officielle** (TLS interne Caddy, HSTS+nosniff) — redirige vers le portail IdP |
| <https://lcd.test:4002> | Portail Authelia (login 1FA + TOTP 2FA + logout) |
| <http://127.0.0.1:8060> | Dashboard hôte (18 ports lab) |

Se connecter : l'entrée `lcd.test:4001` exige la session IdP (F3) —
comptes/mots de passe dans `deploy/.env` (`personne_01` = Claire 👑
super_admin, `personne_03` = Sam opérateur …), 2FA TOTP exigée. La bascule
« Voir comme » (admins, après connexion) change de rôle visuellement et est
**tracée** (bandeau + journal 90 j) ; une écriture hors-rôle reste REFUSÉE
par la passerelle (403).

## 4. Ce qui est réel vs simulé

Page `/aide` (dans le produit) = le tableau contractuel.
Bref : gestions/actions/registres/onboarding réel, données = échantillon
lab, paiements/cloud/matériel = absents (chiffrés dans `docs/`).

## 5. Évolutivité du code (où ranger quoi)

```
web/                 Next.js 16 front (SSR, cacheComponents, sans-JS)
custom/passerelle-parc/   passerelle RBAC (écritures allowlist, §6bis)
custom/*/            moteurs métier 1 req (pricing, compta, dispatch…)
lab/                 docker compose, boxes, seed-reset, batterie, lab-run
deploy/              stack self-hosted (Dockerfile front + Caddy) + tests
docs/registres/      changelog + etat-reel (R5 : état réel ICI uniquement)
docs/checklist-taches-restantes.md, docs/panier-p0-chiffre.md
                     restes terrain chiffrés (P0/cloud/RC)
```

## 6. Reset après manipulation des fixtures

```
pwsh lab/seed-reset.ps1          # fixtures seules (rapide)
pwsh lab/seed-reset.ps1 -Volumes # + volumes runtime (prérequis batteries
                                 # à comptages EXACTS, ex. carnet T2)
```

## 7. Points d'attention Windows (leçons consolidées)

- Le quoting JSON inline pwsh→curl corrompt les corps : passer par un
  fichier temp (`--data-binary "@fichier.json"`).
- Fichiers avec accents : lire avec le Read tool puis éditer (ancre
  exacte), jamais de retape manuelle.
- Un échec transient de la passerelle pendant l'édition des fichiers lab
  par un collègue agent = lab reste, réessayer après 30-60 s.
