# 77 — Identité, rôles, périmètres : ce qui est prouvé, ce qui ne l'est pas

**Rôle** : état daté (2026-10-19) de la chaîne « qui es-tu → où arrives-tu → que vois-tu ».
**Auteur** : constats mesurés, y compris les échecs. Un échec non écrit se rejoue.

---

## 1. Politique d'authentification (décision d'exploitation)

| Groupe | Politique | Raison |
|---|---|---|
| `parc_admin` (super admin + admin) | **`two_factor`** | un admin peut tout changer : jamais un mot de passe seul |
| `parc_operateur`, `parc_tiers` (opérateur, comptable, propriétaire, commercial) | **`one_factor`** | le 2FA reste **disponible** (activable depuis le portail), il n'est **plus imposé** |

**L'ordre des règles est porteur de sens** : le groupe admin est évalué **avant** la règle large,
sinon il tomberait dedans et perdrait l'obligation.

**Mesure** : `firstfactor` répond `status OK` **sans second facteur** pour `personne_03`,
`personne_04`, `personne_05`. Avant ce changement, ces trois comptes étaient **bloqués** sur un
écran d'enrôlement : seul `personne_01` possédait un secret TOTP enregistré.

---

## 2. Arrivée par rôle

**Défaut corrigé** : quatre rôles sur six avaient la même cible (`/hote`), et après
l'authentification le portail renvoyait sur `/login`, où une carte « Connecté » s'affichait
**sans rediriger**. Tout le monde restait donc au même endroit.

| Compte | Rôle | Cible |
|---|---|---|
| `personne_01` | super_admin | `/hote` |
| `personne_02` | admin | `/hote` |
| `personne_03` | opérateur | **`/planning`** |
| `personne_04` | comptable | **`/compta`** |
| `personne_05` | propriétaire | `/proprio?...` |
| `commercial_01` | commercial | `/commercial` |

`voirComme` (super admin → rôle emprunté) : depuis `/`, `/login` ou `/hote`, on atterrit chez le rôle
emprunté ; depuis un écran précis, on y reste (on veut voir **cet** écran avec d'autres yeux).

### RESOLU et MESURE (meme jour) — la redirection part
Premiere mesure : `/hote` affichait l'identite (« Sam · operateur ») mais `/login` n'en voyait
aucune. **Cause** : `/login` est servie sans dependre de la requete (rendu anticipe), donc
`headers()` n'y voit pas le `Remote-User` pose par Caddy. Une redirection ecrite **dans la page**
ne pouvait donc pas se declencher.
**Correction** : la redirection est deplacee dans `web/src/middleware.ts`, qui tourne AVANT le
rendu et voit toujours les en-tetes. Regle : un utilisateur authentifie qui atterrit sur `/login`
repart chez lui ; jamais de redirection sans identite, avec un parametre d'erreur, ou vers `/login`.
La table `PROFILS` reste la seule source de verite (aucun `if` par role).

Mesure apres deploiement (trois sessions reelles, mot de passe seul pour les roles non-admin) :

| Compte | Role | `/login` renvoie | Attendu | |
|---|---|---|---|---|
| `personne_03` | operateur | `/planning` | `/planning` | OK |
| `personne_04` | comptable | `/compta` | `/compta` | OK |
| `personne_05` | proprietaire | `/proprio?logement=log1&qui=personne_05` | idem | OK |
| `commercial_01` | commercial | non teste — **mot de passe absent de `deploy/.env`** | `/commercial` | a completer |

Controle du a la politique d'authentification (le point qui compte) :

| Session | `/hote` | Lecture |
|---|---|---|
| `personne_01` (admin) **sans** second facteur | **302** vers le portail | le 2FA est bien **obligatoire** pour un admin |
| `personne_03` (operateur) sans second facteur | **200** | le 2FA est bien **optionnel** hors admin |

**Note d'outillage** : l'appel direct a `/api/authz/forward-auth` en ligne de commande renvoie
`400 Bad Request` (jeu d'en-tetes `X-Original-*` incomplet). Cette voie de mesure est inutilisable
en l'etat — ne pas la retenter a l'identique.
**Erreur de ma part, corrigée** : j'avais annoncé que ``commercial_01`` n'avait pas de mot de passe.
C'était faux — il figure en clair dans ``deploy/.env`` comme les cinq autres, et son parcours est
vert (``firstfactor`` OK, ``/login`` -> 307 ``/commercial``, ``/commercial`` -> 200). J'avais conclu
trop vite sur une lecture partielle du fichier. **Une affirmation non mesurée reste une erreur, même
quand elle est prudente.**
## 3. Périmètres : « un propriétaire ne voit que ses biens »

**Déclaré** dans `custom/acces.yaml` (une ligne par personne, `logements:`) :
```yaml
personne_05   role: proprietaire   sous_role: proprio_logement   logements: [log1, log2]
personne_03   role: operateur                                     logements: [log1]
personne_01   role: super_admin                                   logements: [log1, log2, log3]
```

**Imposé** par la passerelle (`custom/passerelle-parc/gateway.py`) :
```python
perimetre = personne.get("logements", [])
if logement_id not in perimetre:
    return refus(403, f"hors perimetre : {qui} n'a pas {logement_id} ...")
```
et pour les décisions du moteur : `decision:403 qui=… hors perimetre`.

**Ce que cela garantit** : un propriétaire qui fabrique l'URL d'un autre logement reçoit **403**.
Le cloisonnement n'est donc pas visuel, il est serveur.

### MESURE puis CORRECTION (2026-10-19) — lectures : d'abord NON tenu, **aujourd'hui tenu**
Batterie dédiée : `deploy/test-perimetres.ps1` (mesure par le réseau interne, la passerelle n'étant pas publiée).

```
[OK] personne_05 : ses propres logements sont servis (log1, log2)
[KO] personne_05 : aucun logement hors perimetre -- fuite : log3, log66496, xq6649701, xq6649702
[OK] personne_03 : ses propres logements sont servis (log1)
[KO] personne_03 : aucun logement hors perimetre -- fuite : log2, log3, log66496, xq6649701, xq6649702
[KO] portail-proprio sur log3 (hors perimetre) refuse -- HTTP 200, le parametre est ignore
[OK] ecriture hors perimetre refusee (403 attendu)
RESULTAT : 3 ECHEC(S) -- cloisonnement des LECTURES non tenu
```

**Lecture du résultat, sans détour** : l'autorisation en **écriture** est bien appliquée (403),
mais les **lectures** servent le parc entier — `/etat-parc`, `/parc/logements` — et
`/portail-proprio` accepte n'importe quel `logement` sans vérifier le périmètre. Un propriétaire
voit donc `log3`, qui n'est pas à lui, et un opérateur voit tout le parc. **L'exigence « chacun ses
biens » n'est pas satisfaite aujourd'hui**, elle est satisfaite pour les écritures seulement.

**Où corriger** (passerelle, pas le front) : les trois gestionnaires de lecture doivent filtrer par
`personne["logements"]` **avant** de sérialiser :
- `/etat-parc` — retirer les `boxes` et `logements` hors périmètre ;
- `/parc/logements` — ne renvoyer que les logements du périmètre ;
- `/portail-proprio` — refuser en **403** un `logement` hors périmètre au lieu de l'ignorer.

Tant que ce n'est pas fait, la batterie reste **rouge** : c'est voulu, elle décrit l'état réel.

### CORRECTION APPLIQUEE — la batterie est passee au VERT

Trois filtres ajoutes dans la passerelle (`custom/passerelle-parc/gateway.py`), **avant** serialisation,
appliques des que `qui` est fourni (perimetre lu dans `acces.yaml`) :

| Endpoint | Correction |
|---|---|
| `/etat-parc` | `logements`, `boxes` (box vide -> retiree), `sans_entite`, `alertes` filtres par perimetre |
| `/parc/logements` | liste reduite au perimetre |
| `/portail-proprio` | un `logement` hors perimetre est **refuse en 403** (il etait ignore) |

Enseignement utile : le logement fuyait encore par un champ inattendu (`sans_entite`), pas par
`logements` — c'est un **parcours recursif des cles** qui l'a nomme, pas une relecture a l'oeil.

Sortie finale de `deploy/test-perimetres.ps1` :
```
[OK] personne_05 : ses propres logements sont servis (log1, log2)
[OK] personne_05 : aucun logement hors perimetre dans les reponses
[OK] personne_03 : ses propres logements sont servis (log1)
[OK] personne_03 : aucun logement hors perimetre dans les reponses
[OK] portail-proprio sur log3 (hors perimetre) refuse
[OK] ecriture hors perimetre refusee (403 attendu)
RESULTAT : perimetres tenus (lecture + ecriture)
```

Deux details de methode, appris a la dure :
- une **403 cite le logement refuse** dans son message ; compter ces mots comme une fuite fait
  echouer la batterie sur son propre refus -> seules les reponses **200** sont analysees ;
- le code de la passerelle vit dans l'**image** (pas en volume) : un `docker restart` ne suffit pas,
  il faut `docker compose -f lab/docker-compose.yml up -d --build gateway-parc`.
## 4. Ce qui reste, dans l'ordre

1. **Débloquer la redirection par rôle** (§2) — une mesure d'en-tête sur `/login`, puis correction.
2. **Batterie des périmètres** (§3) — deux sessions, deux périmètres, un 403 attendu.
3. **Portail sans port visible** pendant la connexion (`https://auth.<hote>`), pour que l'adresse
   affichée reste `https://<hote>` de bout en bout.

## 5. Ce qu'il ne faut pas refaire

- Insérer une règle YAML **entre une ressource et son `policy:`** — cela casse la règle précédente,
  et le journal d'Authelia répond alors par une **cascade** d'erreurs trompeuses (cookies, storage,
  notifier) au lieu de la vraie faute.
- Écrire une expression régulière avec des antislashs entre **guillemets doubles** dans ce YAML :
  utiliser des guillemets simples (`'^/favicon[.]ico$'`).
- Croire qu'une règle `access_control` est active après `docker compose up -d` : un fichier de
  configuration monté ne recrée pas le conteneur. Il faut `docker compose restart authelia`.
