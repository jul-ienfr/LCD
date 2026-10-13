"""annonces.py — fiches annonce OTA (plan §6bis), sans PyYAML.

Même philosophie que `registre.py` : le fichier `annonces.yaml` est versionné
et lu par des humains, donc on n'utilise PAS un parseur→réécriture qui
reformaterait tout et perdrait les commentaires. Ici le format est le nôtre
(contrairement à `logements.yaml`, imposé par les moteurs), ce qui permet deux
choses en plus :
  - les descriptions multilingues sont écrites en bloc YAML replié (`>-`), donc
    un texte long reste lisible dans le fichier et dans un `git diff` ;
  - une clé inconnue d'un bloc géré est conservée telle quelle en fin de bloc
    (on ne perd jamais une ligne qu'on ne modélise pas).

Tout ce qui est au-dessus de `annonces:` (en-tête, `global:`) est recopié
octet pour octet.

Aucune règle métier ici : les bornes prix, les mentions légales ou la copro
sont jugées ailleurs (moteurs / `checklist()` ci-dessous ne fait que RÉUNIR ce
que les moteurs ont dit).
"""
import os
import re
import shutil
import time

# Langues du socle (§4) — une annonce doit au moins porter la langue par défaut.
LANGUES = ("fr", "en", "es", "it", "de")
# Cycle de vie d'une annonce (§6bis) : jamais d'écriture OTA auto sans humain.
STATUTS = ("brouillon", "pret", "publie_manuel", "synchronise", "archive")
# Canaux réellement pilotables en v1 (pas de channel manager 2-voies : voir §6bis
# « réalisme octobre 2026 », Airbnb = API fermée aux partenaires agréés).
CANAUX = ("airbnb", "booking", "direct")


def utcnow_iso():
    t = time.gmtime()
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", t)


class ErreurRegistre(Exception):
    """Erreur métier du registre (code HTTP à porter par l'appelant)."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


def _sans_commentaire(ligne):
    """Coupe après ` #` hors guillemets (même règle que registre.py)."""
    dans = None
    for i, ch in enumerate(ligne):
        if dans:
            if ch == dans:
                dans = None
        elif ch in "\"'":
            dans = ch
        elif ch == "#" and i > 0 and ligne[i - 1] == " ":
            return ligne[:i].rstrip()
    return ligne.rstrip()


def _citer(valeur):
    """Valeur scalaire → yaml simple (nombres et booléens nus, texte cité)."""
    s = str(valeur)
    if s.lower() in ("true", "false", "null", "~", ""):
        return s.lower() if s else '""'
    try:
        float(s)
        return s
    except ValueError:
        pass
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}(T[\d:]+Z?)?", s):
        return s                       # dates/horodatages en clair (lisibles)
    return '"' + s.replace('"', "'") + '"'


def _ligne_scalaire(cle, valeur):
    return "    " + cle + ": " + (_citer(valeur) if str(valeur) != "" else "")


class RegistreAnnonces:
    """Lecture + écriture d'un `annonces.yaml` (fiches annonce du parc)."""

    # champs scalaires d'un bloc, dans l'ordre d'écriture
    SCALAIRES = ("logement_id", "titre", "statut", "copro_note",
                 "publie_le", "publie_par", "canaux", "preuve", "maj_le")
    # champs structurés gérés (le reste est reporté tel quel en fin de bloc)
    STRUCTURES = ("descriptions", "photos", "equipements", "regles", "geoloc")

    def __init__(self, chemin, snapshots_dir=None):
        self.chemin = chemin
        self.snapshots_dir = snapshots_dir or os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(chemin)), "..",
                         "snapshots"))

    # -- lecture ---------------------------------------------------------- #
    def _lire_lignes(self):
        try:
            with open(self.chemin, encoding="utf-8") as f:
                return f.read().splitlines()
        except FileNotFoundError:
            raise ErreurRegistre(503, "registre introuvable : " + self.chemin)

    def _debut_section(self, lignes):
        for i, l in enumerate(lignes):
            if l.startswith("annonces:"):
                return i
        raise ErreurRegistre(503, "section `annonces:` absente de "
                                  + self.chemin)

    def _blocs(self, lignes):
        """`{logement_id: (début, fin)}` — un bloc = `  <id>:` en 2 espaces."""
        debut = self._debut_section(lignes) + 1
        blocs = {}
        i = debut
        while i < len(lignes):
            l = lignes[i]
            if l.strip() and not l.startswith(" ") and not l.startswith("#"):
                break                                  # nouvelle section racine
            m = re.match(r"^  ([A-Za-z0-9][\w.\-]*):", l)
            if m:
                fin = i + 1
                while fin < len(lignes):
                    n = lignes[fin]
                    if n.strip() and not n.startswith("    ") \
                            and not n.startswith("#"):
                        break
                    fin += 1
                blocs[m.group(1)] = (i, fin)
                i = fin
            else:
                i += 1
        return blocs

    def _parser_bloc(self, bloc):
        """Lignes d'un bloc → dict. Bloc replié `>-` et `|` gérés."""
        out = {}
        i = 1                                        # on saute la ligne `  id:`
        while i < len(bloc):
            l = _sans_commentaire(bloc[i])
            m = re.match(r"^    (\w[\w.\-]*):(.*)$", l)
            if not m:
                i += 1
                continue
            cle, val = m.group(1), m.group(2).strip()
            if val in (">-", ">", "|", "|-", "|+"):
                texte, i = self._lire_replie(bloc, i + 1, 6)
                out[cle] = texte
                continue
            if val.startswith("["):
                # liste flow, éventuellement sur plusieurs lignes (fichier
                # écrit large) : on accumule jusqu'au `]` fermant.
                brut = val
                while "]" not in brut and i + 1 < len(bloc):
                    i += 1
                    brut += " " + _sans_commentaire(bloc[i]).strip()
                items = [x.strip().strip("\"'")
                         for x in brut.strip("[]").split(",") if x.strip()]
                out[cle] = items
                i += 1
                continue
            if val == "":
                # sous-dictionnaire : clés plus indentées, bloc replié possible
                sub, i = self._lire_sous(bloc, i + 1)
                out[cle] = sub
                continue
            out[cle] = val.strip("\"'")
            i += 1
        return out

    @staticmethod
    def _lire_replie(bloc, i, indent):
        """Lit un bloc replié (`>-`/`|`) à partir de `i` ; rend (texte, i)."""
        pad = " " * indent
        texte = []
        while i < len(bloc):
            l = bloc[i]
            if not l.strip():
                texte.append("")
                i += 1
                continue
            if not l.startswith(pad):
                break
            texte.append(l[indent:].rstrip())
            i += 1
        while texte and not texte[-1]:
            texte.pop()
        return "\n".join(texte), i

    def _lire_sous(self, bloc, i):
        """Sous-dictionnaire (`6 espaces`) → (dict, i). Bloc replié géré."""
        pad = " " * 6
        sub = {}
        while i < len(bloc):
            l = _sans_commentaire(bloc[i])
            if l.strip() and not l.startswith(pad):
                break
            m = re.match(r"^      (\w[\w.\-]*):(.*)$", l)
            if not m:
                i += 1
                continue
            cle, val = m.group(1), m.group(2).strip()
            if val in (">-", ">", "|", "|-", "|+"):
                sub[cle], i = self._lire_replie(bloc, i + 1, 8)
                continue
            if val.startswith("["):
                # liste flow multi-lignes : on accumule jusqu'au `]`
                brut = val
                while "]" not in brut and i + 1 < len(bloc):
                    i += 1
                    brut += " " + _sans_commentaire(bloc[i]).strip()
                sub[cle] = [x.strip().strip("\"'")
                            for x in brut.strip("[]").split(",") if x.strip()]
                i += 1
                continue
            sub[cle] = val.strip("\"'")
            i += 1
        return sub, i

    def _parser(self, lignes):
        """Tous les blocs → dict, plus les clés hors modèle pour les réécrire."""
        blocs = self._blocs(lignes)
        annonces = {}
        for lid, (d, f) in blocs.items():
            champs = self._parser_bloc(lignes[d:f])
            champs.setdefault("logement_id", lid)
            annonces[lid] = champs
        return annonces

    def lire(self, logement_id):
        """Une fiche complète (dict) ; 404 si absente."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if logement_id not in blocs:
            raise ErreurRegistre(404, "annonce inconnue : " + str(logement_id))
        d, f = blocs[logement_id]
        champs = self._parser_bloc(lignes[d:f])
        champs.setdefault("logement_id", logement_id)
        return champs

    def lister(self):
        """Toutes les fiches, triées par id (lecture seule)."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        out = []
        for lid in sorted(blocs):
            d, f = blocs[lid]
            champs = self._parser_bloc(lignes[d:f])
            champs.setdefault("logement_id", lid)
            out.append(champs)
        return out

    # -- écriture --------------------------------------------------------- #
    def _cles_connues(self):
        return set(self.SCALAIRES) | set(self.STRUCTURES)

    def _autres_cles(self, champs):
        """Clés d'un bloc qu'on ne modélise pas → reportées telles quelles.

        `note_interne:` écrit par un humain dans le fichier doit survivre à un
        `definir()` par l'API : on ne perd jamais une ligne qu'on ne décide pas
        d'écrire."""
        out = []
        for cle, val in (champs or {}).items():
            if cle in self._cles_connues():
                continue
            if isinstance(val, (list, tuple)):
                out.append("    " + cle + ": [" + ", ".join(
                    _citer(x) for x in val) + "]")
            elif isinstance(val, dict):
                out.append("    " + cle + ":")
                out += ["      " + k + ": " + _citer(v)
                        for k, v in val.items()]
            else:
                out.append("    " + cle + ": " + _citer(val))
        return out

    def _rendre_bloc(self, lid, champs, autres=None):
        """Bloc → lignes YAML. `autres` = clés non modélisées, reportées."""
        c = dict(champs or {})
        if not autres:
            autres = self._autres_cles(c)
        out = [f"  {lid}:"]
        # scalaires gérés
        for cle in self.SCALAIRES:
            if cle == "logement_id":
                if str(c.get("logement_id", lid)) != lid:
                    out.append(_ligne_scalaire("logement_id",
                                               c["logement_id"]))
                else:
                    out.append(_ligne_scalaire("logement_id", lid))
            elif cle in c and c[cle] not in (None, ""):
                if cle == "canaux" and isinstance(c[cle], (list, tuple)):
                    out.append("    canaux: [" + ", ".join(
                        str(x) for x in c[cle]) + "]")
                else:
                    out.append(_ligne_scalaire(cle, c[cle]))
        # structures
        for cle in self.STRUCTURES:
            if cle not in c or not c[cle]:
                continue
            v = c[cle]
            if isinstance(v, dict):
                out.append(f"    {cle}:")
                for k, val in v.items():
                    if val in (None, ""):
                        continue
                    if isinstance(val, str) and "\n" in val:
                        out += self._replie(k, val, 6)
                    else:
                        out.append("      " + k + ": " + _citer(val))
                continue
            if isinstance(v, (list, tuple)):
                # liste de scalaires → flow ; texte long → une ligne par item
                if any(isinstance(x, str) and (len(x) > 60 or "," in x)
                       for x in v):
                    out.append(f"    {cle}:")
                    out += ["      - " + _citer(x) for x in v]
                else:
                    out.append(f"    {cle}: [" + ", ".join(
                        _citer(x) for x in v) + "]")
                continue
            out.append(f"    {cle}: {_citer(v)}")
        out += autres or []
        return out

    @staticmethod
    def _replie(cle, texte, indent):
        """`cle: >-` + lignes indentées (texte multi-ligne lisible)."""
        pad = " " * indent
        out = [pad + cle + ": >-"]
        for ligne in str(texte).split("\n"):
            out.append(pad + "  " + ligne if ligne.strip() else pad + "  ")
        return out

    def _snapshot(self):
        os.makedirs(self.snapshots_dir, exist_ok=True)
        base = "annonces.yaml"
        nom = time.strftime("%Y%m%d-%H%M%S") + "-" + base
        cible = os.path.join(self.snapshots_dir, nom)
        n = 0
        while os.path.exists(cible):                   # 2 snapshots la même s
            n += 1
            cible = os.path.join(
                self.snapshots_dir,
                time.strftime("%Y%m%d-%H%M%S") + f"-{n}-{os.getpid()}-" + base)
        shutil.copy2(self.chemin, cible)
        return os.path.basename(cible)

    def _ecrire(self, lignes):
        """Atomique (`tmp + os.replace`) + repli sur place si la cible est un
        bind-mount fichier (EBUSY/EINVAL/ENOTSUP/EPERM/EIO, vu en lab Docker)."""
        tmp = self.chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write("\n".join(lignes) + "\n")
            f.flush()
            os.fsync(f.fileno())
        try:
            os.replace(tmp, self.chemin)
            return
        except OSError as e:
            if e.errno not in (16, 18, 22, 26, 1):
                try:
                    os.remove(tmp)
                except OSError:
                    pass
                raise ErreurRegistre(500, "écriture impossible : "
                                          + str(e))
        with open(self.chemin, "w", encoding="utf-8") as f:
            f.write("\n".join(lignes) + "\n")
            f.flush()
            os.fsync(f.fileno())
        try:
            os.remove(tmp)
        except OSError:
            pass

    def definir(self, logement_id, champs):
        """Crée ou met à jour une fiche (upsert). Jamais `statut` : le cycle de
        vie a ses propres routes (publier / marquer-publie)."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if logement_id in blocs:
            avant = self._parser_bloc(lignes[blocs[logement_id][0]:
                                            blocs[logement_id][1]])
        else:
            avant = {}
        nouveaux = dict(champs or {})
        nouveaux.pop("statut", None)                   # cycle de vie séparé
        nouveaux.pop("logement_id", None)             # identité immuable
        apres = dict(avant)
        apres.update(nouveaux)
        apres["logement_id"] = logement_id
        apres["maj_le"] = utcnow_iso()
        if not apres.get("statut"):
            apres["statut"] = "brouillon"
        bloc = self._rendre_bloc(logement_id, apres, {})
        if logement_id in blocs:
            d, f = blocs[logement_id]
            lignes[d:f] = bloc
        else:
            lignes = lignes[:len(lignes)] + bloc + [""]
        snap = self._snapshot()
        self._ecrire(lignes)
        return {"logement_id": logement_id, "snapshot": snap,
                "avant": avant, "apres": apres,
                "cree": not avant,
                "modifies": sorted(k for k in nouveaux
                                   if str(avant.get(k)) != str(apres.get(k)))}

    def changer_statut(self, logement_id, statut, par, canaux=None,
                       preuve=""):
        """Change le statut en respectant le cycle (§6bis) — jamais d'OTA auto.

        Transitions permises :
          brouillon → pret → publie_manuel → synchronise
          (tout état) → archive
        """
        if statut not in STATUTS:
            raise ErreurRegistre(400, "statut inconnu : " + str(statut))
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if logement_id not in blocs:
            raise ErreurRegistre(404, "annonce inconnue : " + str(logement_id))
        champs = self._parser_bloc(lignes[blocs[logement_id][0]:
                                       blocs[logement_id][1]])
        actuel = champs.get("statut", "brouillon")
        if statut == actuel and statut != "publie_manuel":
            # idempotence : rejouer le même statut n'écrit rien
            return {"logement_id": logement_id, "statut": actuel,
                    "change": False, "snapshot": None}
        if statut != actuel:
            ordre = {s: i for i, s in enumerate(STATUTS)}
            if statut != "archive" and ordre[statut] != ordre[actuel] + 1:
                raise ErreurRegistre(
                    409, f"transition interdite : {actuel} → {statut} "
                         f"(cycle brouillon → pret → publie_manuel → "
                         f"synchronise)")
        champs["statut"] = statut
        if statut == "publie_manuel":
            # `publie_manuel` rejoué = l'humain ajoute un canal (publication sur
            # un 2e portail) : on FUSIONNE au lieu d'écraser, sinon le record
            # perdrait les canaux déjà publiés — c'est une trace, pas un booléen.
            deja = [str(c) for c in (champs.get("canaux") or [])]
            nouveaux = [str(c) for c in (canaux or [])]
            if actuel == "publie_manuel" and not nouveaux and not preuve:
                return {"logement_id": logement_id, "statut": actuel,
                        "change": False, "snapshot": None}
            fusion = deja + [c for c in nouveaux if c not in deja]
            if actuel == "publie_manuel" and fusion == deja and not preuve:
                # rien de neuf (mêmes canaux, pas de nouvelle preuve) : on ne
                # récrit PAS le fichier, on le dit. Le rejeu est sans effet.
                return {"logement_id": logement_id, "statut": actuel,
                        "change": False, "snapshot": None, "canaux": deja}
            champs["canaux"] = fusion
            if nouveaux:
                champs["publie_le"] = utcnow_iso()
                champs["publie_par"] = par
            if preuve:
                champs["preuve"] = preuve
        elif statut == "synchronise":
            # seul un humain (ou un connecteur agréé authentifié) peut le faire
            champs["publie_par"] = par
        elif statut == "archive":
            champs["archive_par"] = par
            champs["archive_le"] = utcnow_iso()
        bloc = self._rendre_bloc(logement_id, champs, {})
        d, f = blocs[logement_id]
        lignes[d:f] = bloc
        snap = self._snapshot()
        self._ecrire(lignes)
        rep = {"logement_id": logement_id, "statut": statut,
               "change": True, "avant": actuel, "par": par,
               "snapshot": snap}
        if statut == "publie_manuel":
            # l'appelant doit VOIR les canaux réellement enregistrés, pas
            # seulement savoir que ça a marché.
            rep["canaux"] = list(champs.get("canaux") or [])
        return rep

    def supprimer(self, logement_id, par):
        """Archivage DOUX : jamais de purge (§6bis, §16.3 pièces 10 ans)."""
        return self.changer_statut(logement_id, "archive", par)

    def rollback(self, nom):
        """Restaure un snapshot horodaté (jamais de purge dure)."""
        src = os.path.join(self.snapshots_dir, os.path.basename(nom))
        if not os.path.isfile(src):
            raise ErreurRegistre(404, "snapshot inconnu : " + str(nom))
        tmp = self.chemin + ".tmp"
        shutil.copy2(src, tmp)
        os.replace(tmp, self.chemin)
        return {"restaure": os.path.basename(src),
                "annonces": len(self._blocs(self._lire_lignes()))}

    def snapshots(self):
        try:
            return sorted(os.listdir(self.snapshots_dir), reverse=True)
        except OSError:
            return []


def checklist(annonce, mentions=None, bornes=None):
    """Dossier de publication : CE QUI MANQUE, par canal (§6bis).

    Rassemble ce que les moteurs ont déjà dit (mentions légales de decision,
    bornes de pricing) — ne décide rien à leur place. Un canal est « publiable »
    quand rien de bloquant ne manque. Les points « à vérifier sur le portail »
    restent des rappels MANUELS : rien n'est publié automatiquement.
    """
    a = annonce or {}
    mentions = mentions or {}
    titre = str(a.get("titre", "") or "")
    desc = a.get("descriptions") or {}
    photos = a.get("photos") or []
    equip = a.get("equipements") or []
    regles = a.get("regles") or {}
    geo = a.get("geoloc") or {}
    manquantes = mentions.get("manquantes") or []
    bloquants, rappels = [], []

    if len(titre) < 25:
        bloquants.append("titre : 25 caractères minimum (titre trop court)")
    if not str(desc.get("fr", "") or "").strip():
        bloquants.append("description FR absente")
    if len(str(desc.get("fr", "") or "")) < 150:
        bloquants.append("description FR : 150 caractères minimum")
    if not str(desc.get("en", "") or "").strip():
        bloquants.append("description EN absente (canaux OTA)")
    if len(photos) < 6:
        bloquants.append(f"photos : {len(photos)}/6 minimum")
    if not equip:
        bloquants.append("équipements vides")
    if not regles.get("arrivee"):
        bloquants.append("heure d'arrivée manquante")
    if not regles.get("depart"):
        bloquants.append("heure de départ manquante")
    if not regles.get("nuitee_min"):
        bloquants.append("nuitée minimum manquante")
    if not geo.get("lat") or not geo.get("lon"):
        bloquants.append("géolocalisation manquante")
    if manquantes:
        bloquants.append("mentions légales manquantes : "
                         + ", ".join(str(m) for m in manquantes))
    if bornes and not (bornes.get("prix_min") and bornes.get("prix_max")):
        bloquants.append("bornes prix absentes (pricing-engine muet ?)")

    for canal in CANAUX:
        if canal == "airbnb":
            if len(photos) < 10:
                rappels.append("airbnb : 10 photos recommandées pour le "
                               "classement")
            if "dpe" not in str(desc):
                rappels.append("airbnb : renseigner la classe DPE sur le "
                               "portail")
        if canal == "booking":
            if len(str(desc.get("fr", "") or "")) < 300:
                rappels.append("booking : description FR de 300 caractères "
                               "conseillée")
            rappels.append("booking : politiques d'annulation à choisir sur "
                           "le portail")
        rappels.append(f"{canal} : publication à faire par un humain sur le "
                       f"portail (aucune écriture OTA automatique)")
    return {"bloquants": bloquants, "rappels": rappels,
            "publiable": not bloquants, "canaux": list(CANAUX)}
