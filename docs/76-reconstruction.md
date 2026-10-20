# 76 — Reconstruire le SAS sur une machine nue

**Rôle** : la procédure complète pour repartir de zéro (machine morte, volée, noyée) et remettre
le SAS en service, avec **la preuve** de chaque étape.
**Public** : la personne qui exploite, à froid, sans contexte.
**Généré ?** Non — ce document est **écrit et relu à la main**, et ses commandes sont vérifiées par
`deploy/test-docs.ps1` (chaque script cité doit exister) et par les batteries qu'il référence.

---

## 1. Ce qu'il faut avoir en main (4 éléments, et rien d'autre)

| Élément | Où il vit | Sans lui |
|---|---|---|
| Le **dépôt git** | `github.com/jul-ienfr/LCD`, branche `lab/docker` | pas de code (compose, Caddyfile, scripts) |
| L'**export restic** | dossier hors machine (NAS, disque, cloud) — produit par `deploy/exporter.ps1` | pas de données |
| La **phrase de passe restic** | coffre / papier / gestionnaire de mots de passe — **jamais avec l'export** | l'export est un bloc illisible |
| Le **domaine** (Internet) ou le **nom local** (LAN) | registraire / DNS | pas de TLS public |

Les deux premiers sont **prouvés** : le dépôt est poussé (`git push` vérifié), l'export est vérifié
empreinte par empreinte et **chiffré** (`deploy/test-export.ps1`, 12/12). La phrase de passe doit
voyager **séparément** — la batterie vérifie qu'elle n'est dans aucun fichier de l'export.

---

## 2. Procédure (7 étapes, ~15 minutes)

### Étape 1 — Récupérer le code
```powershell
git clone https://github.com/jul-ienfr/LCD.git
git checkout lab/docker
```
**Preuve que c'est suffisant** : les 24 documents et les 31 scripts cités existent dans le dépôt
(`deploy/test-docs.ps1`) ; le Caddyfile, les compose et tous les scripts d'exploitation y sont.

### Étape 2 — Récupérer les données
```powershell
# depuis le dossier d'export (copié sur la machine neuve)
deploy/exporter.ps1 -Vers <dossier-export> -Verifier
```
**Attendu** : `fichiers verifies : N, mauvais : 0` et `export chiffre : True`.
**Preuve** : `deploy/test-export.ps1` (12/12) — contrôle positif inclus (un octet modifié est vu).

### Étape 3 — Remettre le dépôt restic en service
Copier le contenu de l'export dans `deploy/backups/restic`, puis recréer la phrase de passe :
```powershell
# le fichier doit contenir EXACTEMENT la phrase de passe utilisée à l'export
notepad deploy/backups/.restic-pass
```
**Vérification** :
```powershell
deploy/verifier-depot.ps1 -Donnees
```
**Attendu** : `restic check` vert, données relues à 5 %.
**Preuve** : `deploy/test-depot.ps1` (14/14).

### Étape 4 — Restaurer la configuration hôte
```powershell
deploy/reprise.ps1
```
Le drill restaure **réellement** le volume IdP dans un volume neuf, restaure la configuration
(`.env`, `users.yml`) et compare ses empreintes à celles en service. **Attendu : 16/16, service
debout en ~20 s, production intacte avant et après.**
Si `.env` ou `users.yml` manquent à la racine de `deploy/`, les reprendre depuis le snapshot
`hote=lcd` (le drill montre comment le sélectionner par son tag).
**Preuve** : `deploy/reprise.ps1` lui-même — un drill qui échoue dit lequel des 16 contrôles.

### Étape 5 — Démarrer la pile
```powershell
deploy/demarrer.ps1          # ou : docker compose -p lcd-deploy up -d
```
**Attendu** : `https://<nom>:4001` → 302 vers le portail, `:4002` → 200.
**Preuve** : `deploy/test-demarrage.ps1` (14/14, démarrage à froid).

### Étape 6 — Vérifier l'ensemble
```powershell
deploy/tout-verifier.ps1
```
**Attendu** : 26 batteries, `docs/74-etat-verifie.md` réécrit. Un rouge est **nommé** et compte
dans le code de sortie — jamais masqué. C'est le seul mode d'écriture du document d'état.

### Étape 7 — Ouvrir le réseau
- **LAN** : `deploy/test-lan-acces.ps1` dit l'état exact. S'il est `FERMÉ-PAR-PARE-FEU`, exécuter en
  administrateur la commande qu'il imprime (`netsh advfirewall firewall add rule … localport=4001,4002,4003`),
  puis relancer : il doit passer à `OUVERT`.
- **Internet** : un domaine qui pointe sur l'IP publique, un e-mail, les ports 80/443 ouverts, puis
  `LCD_TLS=admin@<domaine>` et `LCD_HOTE=<domaine>` dans `deploy/.env`, et
  `docker compose restart caddy`. La variante ACME est **déjà validée** (`deploy/test-tls.ps1`, 9/9).

---

## 3. Ce qui est vérifié automatiquement, et par quoi

| Affirmation | Batterie | Compte |
|---|---|---|
| le dépôt est complet et cohérent | `test-docs` | 12/12 |
| la sauvegarde sort de la machine, chiffrée, vérifiable | `test-export` | 12/12 |
| le dépôt restic est sain | `test-depot` | 14/14 |
| la sauvegarde restaure le service **et** la configuration | `reprise` | 16/16 |
| la pile démarre à froid | `test-demarrage` | 14/14 |
| l'authentification et le 2FA tiennent | `test-idp`, `test-durcissement` | 7/7, 24/24 |
| les accès réseau sont classés, pas supposés | `test-lan-acces`, `test-tls` | 6/6, 9/9 |
| les secrets locaux ne sont lisibles que par l'exploitation | `test-acces` | 11/11 |
| rien ne change en douce | `test-versions` | 10/10 |
| l'exploitation tourne vraiment (fraîcheur des preuves) | `test-sante` | 11/11 |
| l'espace disque est réellement récupéré | `test-entretien` | 11/11 |
| les tâches planifiées existent et s'exécutent | `test-taches` | 17/17 |

---

## 4. Ce qui reste humain (et ne peut pas être prouvé ici)

| Élément | Pourquoi |
|---|---|
| Ouverture des ports (pare-feu) | demande les droits d'administrateur |
| Domaine, DNS, e-mail ACME | achats et comptes |
| Matériel définitif (P0, ~1 050–1 150 €) | budget |
| Comptes OTA, banque/payouts | contrats et vérifications d'identité |
| SIREN, RC pro, carte G, expert-comptable | statut juridique |
| Compaction du VHDX | opération d'administrateur sur l'hôte |

---

## 5. Pièges mesurés (à ne pas refaire)

1. **`restore latest` prend le snapshot le plus récent tous volumes confondus** — d'où l'identification
   par tag partout (`volume=<nom>`, `hote=lcd`).
2. **Compose fusionne les listes `ports`** dans une surcharge : sans `!override`, le drill meurt sur
   « port is already allocated ».
3. **Les packs restic sont en lecture seule** : lever l'attribut avant toute écriture.
4. **Lire un journal pendant qu'une tâche l'écrit** échoue (« en cours d'utilisation ») : lecture partagée.
5. **`Get-NetIPAddress` est cassé** sur cet hôte : lire `ipconfig`.
6. **Un `.ps1` sans BOM reste ASCII** : un tiret cadratin dans une chaîne casse le parseur PowerShell 5.1.
7. **Ne jamais purger `totp_configurations`** : le secret y est chiffré, une réinsertion en clair casse le 2FA
   pour tout le monde (mesuré, réparé par restauration restic).
