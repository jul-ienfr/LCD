"""registre_liste.py — registre YAML « liste de blocs » chirurgical (G2bis).

Base commune de `entites.py` et `mandats.py`, même philosophie que
`registre.py` / `annonces.py` : le fichier est versionné et relu par des
humains (commentaires d'aide compris), donc on n'utilise JAMAIS un
parseur→réécriture qui reformaterait tout et perdrait les explications.

Format géré (le nôtre de bout en bout, comme `annonces.yaml`) :

    <en-tete recopié octet pour octet>
    entites:
      ent-santa-severa:
        libelle: "..."
        nature: nom_propre
        statut: active

  - section repérée par son préfixe (`entites:`) ;
  - un bloc = `  <cle>:` à 2 espaces, champs scalaires à 4 espaces ;
  - listes flow `[a, b]` (éventuellement sur plusieurs lignes) et blocs
    repliés `>-` / `|` lus et réécrits tels quels ;
  - une clé inconnue d'un bloc est REPORTÉE EN FIN DE BLOC : on ne perd
    jamais une ligne qu'on ne modélise pas ;
  - tout ce qui est au-dessus de la section (en-tête, `global:`) est recopié
    octet pour octet.

Pourquoi une base commune plutôt qu'un 4e copier-coller : `annonces.py` et
`registre.py` gardent leur propre implémentation (prouvées à 825 OK / 0 KO,
et on ne touche pas du code stable avant une phase), mais la G2bis ajoute
deux registres de même forme — les dupliquer une fois de plus aurait été le
meilleur moyen de diverger au prochain bug.

Aucune règle métier ici : les enums, les obligations et les cycles de vie
sont dans les sous-classes.
"""
import os
import re
import shutil
import time

# `os.replace` refuse la cible quand c'est un fichier bind-monté par docker
# (EBUSY 16, EINVAL 22, ENOTSUP/EPERM 1/26, EIO 5) : sans ce repli, UNE
# ÉCRITURE SUR DEUX plantait en 500 dans le lab.
ERRNO_REPLI = (16, 18, 22, 26, 1, 5)


def utcnow_iso():
    t = time.gmtime()
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", t)


class ErreurRegistre(Exception):
    """Erreur métier du registre (code HTTP à porter par l'appelant)."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


def sans_commentaire(ligne):
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


def citer(valeur):
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


class RegistreListe:
    """Lecture + écriture chirurgicale d'une section de blocs-clés.

    Sous-classes : `SECTION` (préfixe de section), `SCALAIRES` (ordre
    d'écriture), `STRUCTURES` (clés structurées gérées)."""

    SECTION = None
    SCALAIRES = ()
    STRUCTURES = ()
    CLE_ID = "id"
    # État de départ du cycle de vie, appliqué à un bloc qui n'enporte pas
    # (`definir` retire `statut` à dessein, et un bloc ajouté à la main dans le
    # YAML n'en a souvent aucun). Vide = comportement strict (transition
    # impossible depuis un état inconnu).
    STATUT_INITIAL = ""

    def __init__(self, chemin, snapshots_dir=None):
        self.chemin = chemin
        self.snapshots_dir = snapshots_dir or os.path.join(
            os.path.dirname(os.path.abspath(chemin)), "snapshots")

    # -- lecture ---------------------------------------------------------- #
    def _lire_lignes(self):
        try:
            with open(self.chemin, encoding="utf-8") as f:
                return f.read().splitlines()
        except FileNotFoundError:
            raise ErreurRegistre(503, "registre introuvable : " + self.chemin)

    def _debut_section(self, lignes):
        for i, l in enumerate(lignes):
            if l.startswith(self.SECTION):
                return i
        raise ErreurRegistre(503, "section `" + self.SECTION.strip(":")
                               + ":` absente de " + self.chemin)

    def _blocs(self, lignes):
        """`{cle: (debut, fin)}` — un bloc = `  <cle>:` en 2 espaces.

        Règle de fin de bloc : tout ce qui est indenté à 4 espaces ou plus est
        un champ du bloc ; un commentaire indenté à 2-3 espaces est une note
        DU bloc et reste dedans ; tout le reste (ligne à indentation 0 ou 1,
        y compris un commentaire) est HORS section et termine le bloc.

        Pourquoi c'est strict : avec `not l.startswith("#")` (règle naive), un
        commentaire de modèle en colonne 0 ne terminait PAS le bloc, donc le
        bloc valait jusqu'à la fin du fichier — et sa réécriture EFFAÇAIT tout
        ce qui suivait, commentaires compris."""
        if self.SECTION is None:
            return {}
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
                    if self._hors_bloc(n):
                        break
                    fin += 1
                blocs[m.group(1)] = (i, fin)
                i = fin
            else:
                i += 1
        return blocs

    @staticmethod
    def _hors_bloc(ligne):
        """Une ligne met-elle fin au bloc courant ?

        - vide ou indentée à 4+ espaces → champ du bloc, on continue ;
        - `  #` (2-3 espaces) → note de bloc, on continue ;
        - TOUT LE RESTE termine le bloc, et surtout `  log1:` : une clé à 2
          espaces est le bloc SUIVANT, pas une note. Se tromper ici fait
          avaler tous les blocs suivants par le premier, et la réécriture du
          premier bloc efface alors tout le monde (constaté : un `definir` sur
          log2 recopiait les champs de log1 sous la clé log2)."""
        if not ligne.strip():
            return False
        if ligne.startswith("    "):
            return False
        if ligne.startswith("  ") and ligne.lstrip().startswith("#"):
            return False
        return True

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
            l = sans_commentaire(bloc[i])
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
                    brut += " " + sans_commentaire(bloc[i]).strip()
                sub[cle] = [x.strip().strip("\"'")
                            for x in brut.strip("[]").split(",") if x.strip()]
                i += 1
                continue
            if val == "":
                sous, i = self._lire_sous(bloc, i + 1)
                sub[cle] = sous
                continue
            sub[cle] = val.strip("\"'")
            i += 1
        return sub, i

    def _parser_bloc(self, bloc):
        """Lignes d'un bloc → dict. Bloc replié `>-`/`|` et flow list gérés."""
        out = {}
        i = 1                                        # on saute la ligne de clé
        while i < len(bloc):
            l = sans_commentaire(bloc[i])
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
                brut = val
                while "]" not in brut and i + 1 < len(bloc):
                    i += 1
                    brut += " " + sans_commentaire(bloc[i]).strip()
                out[cle] = [x.strip().strip("\"'")
                            for x in brut.strip("[]").split(",") if x.strip()]
                i += 1
                continue
            if val == "":
                sous, i = self._lire_sous(bloc, i + 1)
                out[cle] = sous
                continue
            out[cle] = val.strip("\"'")
            i += 1
        return out

    def _parser(self, lignes):
        blocs = self._blocs(lignes)
        out = {}
        for cle, (d, f) in blocs.items():
            champs = self._parser_bloc(lignes[d:f])
            champs.setdefault(self.CLE_ID, cle)
            out[cle] = champs
        return out

    def lire(self, cle):
        """Un bloc complet (dict) ; 404 si absent."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if cle not in blocs:
            raise ErreurRegistre(404, self._nom() + " inconnu : " + str(cle))
        d, f = blocs[cle]
        champs = self._parser_bloc(lignes[d:f])
        champs.setdefault(self.CLE_ID, cle)
        return champs

    def lister(self):
        """Tous les blocs, triés par clé (lecture seule)."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        out = []
        for cle in sorted(blocs):
            d, f = blocs[cle]
            champs = self._parser_bloc(lignes[d:f])
            champs.setdefault(self.CLE_ID, cle)
            out.append(champs)
        return out

    def existe(self, cle):
        try:
            return self._lire_lignes() and cle in \
                self._blocs(self._lire_lignes())
        except ErreurRegistre:
            return False

    def _nom(self):
        return (self.SECTION or "").strip(":")

    # -- écriture --------------------------------------------------------- #
    def _cles_connues(self):
        return set(self.SCALAIRES) | set(self.STRUCTURES)

    def _rendre_scalaire(self, cle, val):
        """`cle: valeur` — une valeur VIDE s'écrit `""`.

        Écrire `client_tiers_ref:` sans rien derrière est un piège : au
        re-parse, la valeur vide est interprétée comme le début d'un
        sous-dictionnaire (`_lire_sous`), donc la clé revient `{}` — et
        `_rendre_scalaire` réécrirait alors `client_tiers_ref: "{}"`. La
        chaîne vide DOIT rester une chaîne vide."""
        return "    " + cle + ": " + citer(val)

    def _rendre_structure(self, cle, val, connu=True):
        """Une clé structurée → lignes yaml (6 espaces)."""
        out = ["    " + cle + ":"]
        if isinstance(val, dict):
            for k in val:
                v = val[k]
                if isinstance(v, dict):
                    out.append("      " + str(k) + ":")
                    for k2 in v:
                        out.append("        " + str(k2) + ": "
                                   + citer(v[k2]))
                elif isinstance(v, list):
                    out.append("      " + str(k) + ": "
                               + self._flow(v))
                else:
                    out.append("      " + str(k) + ": " + citer(v))
        elif isinstance(val, list):
            out = ["    " + cle + ": " + self._flow(val)]
        elif isinstance(val, str) and "\n" in val:
            out.append("      >-")
            for ligne in val.splitlines():
                out.append("      " + ligne)
        else:
            out.append("      " + citer(val))
        return out

    @staticmethod
    def _flow(items):
        if not items:
            return "[]"
        return "[" + ", ".join(citer(x) for x in items) + "]"

    def _autres_cles(self, bloc):
        """Clés du bloc qu'on ne modélise PAS → reportées telles quelles.

        Indispensable : sans ça, une ligne ajoutée à la main entre deux versions
        (note, ref externe, clé d'un outil tiers) disparaît à la première
        écriture de la passerelle."""
        out = []
        i = 1
        while i < len(bloc):
            l = bloc[i]
            m = re.match(r"^    (\w[\w.\-]*):", l)
            if m and m.group(1) not in self._cles_connues():
                cle = m.group(1)
                j = i
                while j < len(bloc) and (
                        bloc[j].startswith("        ")
                        or bloc[j].strip() == ""):
                    j += 1
                out.extend(bloc[i:j])
                i = j
                continue
            i += 1
        return out

    def _rendre_bloc(self, cle, bloc, champs):
        """Réécrit le bloc `cle` avec `champs`, en conservant le reste.

        `conserver` = clés scalaires DÉJÀ présentes dans le bloc. Une clé
        présente et vide (`client_tiers_ref: ""`) ne doit PAS disparaître au
        prétexte qu'elle est vide : sinon `modifies` annonce une modification
        qui n'est qu'une perte, et le diff suivant ne montre plus l'intention.
        On ne l'écrit donc vide que si elle existait déjà."""
        conserver = set()
        for l in bloc[1:]:
            m = re.match(r"^    (\w[\w.\-]*):", l)
            if m:
                conserver.add(m.group(1))
        lignes = [bloc[0]]
        for c in self.SCALAIRES:
            if c not in champs:
                continue
            if str(champs[c]) == "" and c not in conserver:
                continue                   # on n'ajoute pas une clé vide
            lignes.append(self._rendre_scalaire(c, champs[c]))
        for c in self.STRUCTURES:
            if c in champs and champs[c] not in (None, "", [], {}):
                lignes.extend(self._rendre_structure(c, champs[c]))
        lignes.extend(self._autres_cles(bloc))
        return lignes

    def definir(self, cle, champs, par=None):
        """Crée ou met à jour un bloc (upsert). Rien d'autre n'est touché."""
        # on ne modifie JAMAIS le dict de l'appelant (effet de bord muet).
        champs = dict(champs or {})
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        avant = blocs.get(cle)
        # `statut` est interdit à la MODIFICATION (il passe par
        # `changer_statut`, sinon un upsert sauterait une étape du cycle) mais
        # il doit rester écrit à la CRÉATION : sinon un bloc neuf naît sans
        # `statut:`, la réponse annonce un état que le fichier ne porte pas, et
        # on ne s'en aperçoit qu'au premier `changer_statut`.
        interdit = (self.CLE_ID, "cree_le", "cree_par")
        if avant is not None:
            interdit = interdit + ("statut",)
        for k in interdit:
            champs.pop(k, None)           # identité + cycle de vie ailleurs

        if avant is None:
            base = {self.CLE_ID: cle}
            base.update(champs)
            if par:
                base["cree_par"] = par
                base["cree_le"] = utcnow_iso()
            base["maj_le"] = utcnow_iso()
            entete = [f"  {cle}:"]
            debut = self._debut_section(lignes) + 1
            lignes[debut:debut] = entete + self._rendre_bloc(
                cle, entete, base)[1:]
            ecrit = {cle: (debut, debut + len(entete))}
            apres = base
            modifies = sorted(base)
        else:
            bloc = lignes[avant[0]:avant[1]]
            lu = self._parser_bloc(bloc)
            fusion = dict(lu)
            fusion.update(champs)
            if par and not lu.get("cree_par"):
                fusion["cree_par"] = par
                fusion["cree_le"] = utcnow_iso()
            fusion["maj_le"] = utcnow_iso()
            rendu = self._rendre_bloc(cle, bloc, fusion)
            lignes[avant[0]:avant[1]] = rendu
            # les indices `avant` sont PÉRIMÉS dès que la taille du bloc change :
            # on relit le bloc réellement écrit avant de le comparer (sinon
            # `modifies` se compare à des lignes décalées et renvoie [] à tort).
            blocs2 = self._blocs(lignes)
            ecrit = {cle: blocs2.get(cle, avant)}
            apres = self._parser_bloc(
                lignes[ecrit[cle][0]:ecrit[cle][1]])
            modifies = [k for k in fusion
                        if str(lu.get(k)) != str(apres.get(k))]
        snap = self._snapshot()
        self._ecrire(lignes)
        return {"cle": cle, "snapshot": snap, "apres": apres,
                "modifies": modifies, "cree": avant is None}

    def _fixer_statut(self, bloc, statut, par, motif=None):
        """Remplace/pose `statut` + trace du changement, dans le bloc."""
        rendu = [l for l in bloc]
        trouve = False
        for i, l in enumerate(rendu):
            m = re.match(r"^    statut:(.*)$", l)
            if m:
                rendu[i] = self._rendre_scalaire("statut", statut)
                trouve = True
                break
        if not trouve:
            rendu.append(self._rendre_scalaire("statut", statut))
        if motif:
            rendu.append(self._rendre_scalaire("motif", motif))
        rendu.append(self._rendre_scalaire(f"{statut}_par", par))
        rendu.append(self._rendre_scalaire(f"{statut}_le", utcnow_iso()))
        return rendu

    def changer_statut(self, cle, statut, par, transitions, motif=None,
                       exiger_motif=False):
        """Change le statut si la transition est autorisée (409 sinon).

        `transitions` : `{statut_source: (statuts_cibles_autorises, …)}` —
        tout saut non consécutif est refusé, pour que l'historique reste
        lisible (même règle que `annonces.changer_statut`)."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if cle not in blocs:
            raise ErreurRegistre(404, self._nom() + " inconnu : " + str(cle))
        d, f = blocs[cle]
        bloc = lignes[d:f]
        # Un bloc SANS `statut:` — écrit à la main, ou créé par `definir` qui
        # retire `statut` à dessein — est traité comme l'état initial du cycle
        # (`STATUT_INITIAL`, vide = comportement strict). Sans ça ces blocs
        # restaient BLOQUÉS hors cycle à vie (`? → actif`), y compris ceux que
        # l'opérateur avait ajoutés lui-même dans le YAML en croyant bien faire.
        lu = self._parser_bloc(bloc)
        courant = (lu.get("statut") or "").strip() or self.STATUT_INITIAL
        autorises = transitions.get(courant, ())
        if statut not in autorises:
            raise ErreurRegistre(409, "transition interdite : "
                                       + (courant or "?")
                                       + " → " + str(statut))
        if exiger_motif and not str(motif or "").strip():
            raise ErreurRegistre(400, "motif obligatoire pour "
                                       + str(statut))
        # on matérialise l'état déduit dans le bloc EN MÉMOIRE (la trace doit
        # montrer l'état RÉEL, pas un état sous-entendu), puis on applique la
        # transition, et on n'écrit qu'UNE fois. Assigner `lignes[d:f]` en deux
        # temps laisse traîner les lignes de la 1re écriture au-delà de `f`, car
        # `f` ne suit pas la croissance du bloc — d'où un `statut:` en double
        # dans le fichier et un bloc qui repartait de zéro à la relecture.
        if courant and courant != (lu.get("statut") or "").strip():
            bloc = self._fixer_statut(bloc, courant, par or "systeme")
        lignes[d:f] = self._fixer_statut(bloc, statut, par, motif)
        snap = self._snapshot()
        self._ecrire(lignes)
        return {"cle": cle, "avant": courant, "apres": statut,
                "par": par, "motif": motif, "snapshot": snap}

    # -- persistance ------------------------------------------------------ #
    def _snapshot(self):
        try:
            os.makedirs(self.snapshots_dir, exist_ok=True)
            nom = time.strftime("%Y%m%dT%H%M%S", time.gmtime())
            cible = os.path.join(self.snapshots_dir,
                                 self._nom() + "-" + nom + ".yaml")
            shutil.copy2(self.chemin, cible)
            return os.path.basename(cible)
        except OSError:
            return None

    def _ecrire(self, lignes):
        contenu = "\n".join(lignes) + "\n"
        tmp = self.chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write(contenu)
            f.flush()
            os.fsync(f.fileno())
        try:
            os.replace(tmp, self.chemin)           # atomique
        except OSError as e:
            if e.errno not in ERRNO_REPLI:
                raise
            try:
                with open(self.chemin, "w", encoding="utf-8") as f:
                    f.write(contenu)
                    f.flush()
                    os.fsync(f.fileno())
            except OSError:
                raise
            finally:
                try:
                    os.remove(tmp)
                except OSError:
                    pass

    # -- rollback --------------------------------------------------------- #
    def snapshots(self, tous=False):
        """Snapshots du registre courant, du plus récent au plus ancien.

        `tous=False` (défaut) ne rend QUE les siens. Sans ce filtre, deux
        registres partageant un dossier de snapshots (entites + mandats, en
        pratique) feraient restaurer un `entites-*.yaml` DANS `mandats.yaml` :
        le registre se retrouvait vidé de ses blocs et `lire()` renvoyait 404
        sur tout. Le nom du fichier porte déjà son registre, on s'en sert."""
        try:
            noms = os.listdir(self.snapshots_dir)
        except OSError:
            return []
        prefixe = self._nom() + "-"
        retenus = [n for n in noms
                   if tous or n.startswith(prefixe)]
        return sorted(retenus, reverse=True)

    def rollback(self, nom):
        """Restaure un snapshot horodaté (jamais de purge dure)."""
        chemin = os.path.join(self.snapshots_dir, os.path.basename(nom))
        try:
            with open(chemin, encoding="utf-8") as f:
                contenu = f.read()
        except OSError:
            raise ErreurRegistre(404, "snapshot introuvable : " + str(nom))
        self._ecrire(contenu.splitlines())
        return {"restaure": os.path.basename(nom)}
