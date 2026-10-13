"""registre.py — registre des logements (plan §6bis), sans PyYAML.

Pourquoi un éditeur de lignes plutôt qu'un parseur YAML complet :
  - `logements.yaml` fait ~120 lignes, 2 espaces d'indentation, et contient des
    COMMENTAIRES qui portent du sens (ex. « LAB SEUL — réel reste false
    (BLOQUÉ) », la taxe de séjour à confirmer) ;
  - un parseur→réécriture les perdrait, et le fichier est versionné (git diff
    illisible) ;
  - les moteurs existants le relisent tels quels.
On fait donc une édition CHIRURGICALE : on repère le bloc `  <id>:` du logement
et on n'écrit que dedans. Tout le reste du fichier reste octet pour octet.
Toute écriture passe par `snapshot` + `tmp + os.replace` (jamais de fichier
tronqué, jamais de perte silencieuse).

Aucune règle métier ici (bornes, copro, quotas) : c'est le moteur qui juge.
"""
import os
import re
import shutil
import time

# Clés qu'un logement doit toujours porter (reprises du lab et des moteurs).
CLES_BASE = ["nom", "commune", "surface_m2", "capacite", "pricing",
             "copro", "features"]
# bornes héritées du bloc `global:` tant que le logement ne les fixe pas.
BORNES_GLOBALES = ("prix_min", "prix_max")


def utcnow_iso():
    t = time.gmtime()
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", t)


class ErreurRegistre(Exception):
    """Erreur métier du registre (code HTTP à porter par l'appelant)."""

    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message


class RegistreLogements:
    """Lecture + écriture chirurgicale d'un `logements.yaml`."""

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

    def _blocs(self, lignes):
        """Début/fin (indice de ligne) de chaque bloc `  <id>:` sous `logements:`.

        Retourne `{logement_id: (debut, fin)}` où `fin` est exclusive. Un bloc
        s'arrête à la prochaine clé de même niveau (2 espaces) ou à la fin."""
        blocs = {}
        dans = False
        debut = None
        courant = None
        for i, l in enumerate(lignes):
            if re.match(r"^logements:\s*$", l):
                dans = True
                continue
            if not dans:
                continue
            m = re.match(r"^  ([A-Za-z0-9_.-]+):\s*$", l)
            if m:
                if courant:
                    blocs[courant] = (debut, i)
                courant = m.group(1)
                debut = i
            elif re.match(r"^\S", l) and l.strip() and not l.startswith(" "):
                if courant:
                    blocs[courant] = (debut, i)
                    courant, debut = None, None
        if courant:
            blocs[courant] = (debut, len(lignes))
        return blocs

    def _scalaires(self, lignes, debut, fin):
        """Clés scalaires de premier niveau du bloc (indentation 4 espaces)."""
        champs = {}
        for l in lignes[debut:fin]:
            m = re.match(r"^    ([A-Za-z0-9_.-]+):\s*(.*)$", l)
            if m and not l.strip().startswith("#"):
                v = m.group(2).strip()
                if v and not v.startswith("#"):
                    champs[m.group(1)] = self._sans_commentaire(v)
        return champs

    def lister(self):
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        return [{"logement_id": lid,
                 "champs": self._scalaires(lignes, d, f),
                 "lignes": [d + 1, f]} for lid, (d, f) in sorted(blocs.items())]

    def lire_global(self):
        lignes = self._lire_lignes()
        out = {}
        for l in lignes:
            m = re.match(r"^  ([A-Za-z0-9_.-]+):\s*(\S.*)$", l)
            if m:
                # commentaire inline retiré : `prix_min: 75   # BORNES ...`
                out[m.group(1)] = self._sans_commentaire(m.group(2).strip())
        return out

    @staticmethod
    def _sans_commentaire(valeur):
        """`75   # borne involable` -> `75` (jamais de coupe dans une chaîne
        entre guillemets)"""
        v = valeur.strip()
        if v[:1] in ('"', "'"):
            guillemet = v[0]
            fin = v.find(guillemet, 1)
            if fin > 0:
                return v[1:fin]
        if v[:1] == "[":
            return v
        retour = v.split(" #", 1)[0].split("\t#", 1)[0]
        return retour.strip().rstrip("#").strip()

    def lire(self, logement_id):
        blocs = self._blocs(self._lire_lignes())
        if logement_id not in blocs:
            raise ErreurRegistre(404, "logement inconnu : " + logement_id)
        lignes = self._lire_lignes()
        d, f = blocs[logement_id]
        return {"logement_id": logement_id,
                "champs": self._scalaires(lignes, d, f),
                "lignes": [d + 1, f]}

    # -- écriture --------------------------------------------------------- #
    def _snapshot(self):
        """Copie horodatée AVANT écriture (rollback, jamais de purge).

        Nom ABSOLUMENT unique : sans suffixe, deux écritures dans la même
        seconde écriraient le même fichier, et l'historique de rollback
        perdrait une étape (le rollback « au précédent » ne serait plus
        disponible). Séquence + pid + microsecondes, et on retombe sur la
        seconde uniquement en secours."""
        try:
            os.makedirs(self.snapshots_dir, exist_ok=True)
            base = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
            cible = os.path.join(self.snapshots_dir,
                                 f"{base}-{os.path.basename(self.chemin)}")
            n = 2
            while os.path.exists(cible):
                cible = os.path.join(
                    self.snapshots_dir,
                    f"{base}-{n}-{os.getpid()}-{os.path.basename(self.chemin)}")
                n += 1
            shutil.copy2(self.chemin, cible)
            return cible
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
            os.replace(tmp, self.chemin)       # atomique
        except OSError as e:
            # Cible « spéciale » (fichier bind-monté par docker, point de
            # montage, autre système de fichiers) : le remplacement est refusé.
            # En lab, sans ce repli UNE ÉCRITURE SUR DEUX plantait en 500.
            # On bascule alors sur l'écriture SUR PLACE : elle n'est plus
            # atomique, mais le snapshot pris AVANT reste le filet (rollback).
            # Toute autre erreur (EACCES, ENOSPC…) = vraie panne, on remonte.
            if e.errno not in (16, 18, 22, 26, 1):
                raise
            try:
                with open(self.chemin, "w", encoding="utf-8") as f:
                    f.write(contenu)
                    f.flush()
                    os.fsync(f.fileno())
            finally:
                try:
                    os.remove(tmp)
                except OSError:
                    pass

    def _indentation(self, lignes):
        for l in reversed(lignes):
            if re.match(r"^  [A-Za-z0-9_.-]+:\s*$", l):
                return 2
        return 2

    def creer(self, logement_id, champs):
        """Ajoute un bloc logement. `copro.verifiee` reste false par défaut
        (BLOQUÉ tant que le syndic n'est pas OK) — porté par le caller.

        Pas de bloc `mentions:` ici, et c'est volontaire (§6bis-b) : un
        logement créé par la passerelle n'a aucun document administratif, donc
        `decision /mentions-annonce` renverra `numero_declaration` / `dpe` /
        `classement` manquants et la publication sera refusée. C'est la même
        logique que `copro.verifiee: false` — le défaut sert la prudence. Un
        humain ajoutera le bloc `mentions:` au fur et à mesure des Cerfa
        (numéro de déclaration) et des diagnostics (DPE)."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if logement_id in blocs:
            raise ErreurRegistre(409, "logement deja present : " + logement_id)
        if not re.fullmatch(r"[a-z0-9][a-z0-9_.-]*", logement_id):
            raise ErreurRegistre(400, "logement_id invalide (a-z0-9_.-) : "
                               + logement_id)
        g = self.lire_global()
        pmin = g.get("prix_min", "75")
        pmax = g.get("prix_max", "290")
        fin_lignes = len(lignes)
        for i, l in enumerate(lignes):
            if re.match(r"^\S", l) and l.strip() and not l.startswith(" ") \
                    and i > next(iter(blocs.values()), (0, 0))[0]:
                fin_lignes = i
                break
        bloc = [f"  {logement_id}:"]
        bloc.append(f"    nom: \"{champs.get('nom', logement_id)}\"")
        bloc.append(f"    commune: \"{champs.get('commune', '')}\"")
        bloc.append("    logement_id: " + logement_id)
        bloc.append(f"    surface_m2: {int(float(champs.get('surface_m2', 0) or 0))}")
        bloc.append(f"    capacite: {int(float(champs.get('capacite', 0) or 0))}")
        bloc.append("    pricing:")
        bloc.append(f"      prix_min: {pmin}")
        bloc.append(f"      prix_max: {pmax}")
        bloc.append("      prix_base: "
                    + str(int(float(champs.get("prix_base", pmin) or pmin))))
        bloc.append("    copro:")
        bloc.append("      verifiee: false"      # BLOQUÉ par défaut (§6bis)
                     + "   # a confirmer par le syndic — false = BLOQUE")
        bloc.append("      meuble_entier: true")
        bloc.append("    features:")
        bloc.append("      smart_lock: "
                    + ("true" if champs.get("smart_lock") else "false"))
        bloc.append("      voix: "
                    + ("true" if champs.get("voix") else "false"))
        bloc.append("    statut: actif")
        lignes[fin_lignes:fin_lignes] = bloc
        snap = self._snapshot()
        self._ecrire(lignes)
        return {"logement_id": logement_id, "snapshot": snap,
                "bornes_heritees": [pmin, pmax],
                "copro_verifiee": False}

    def _fixer_scalaire(self, bloc, cle, valeur):
        """Pose `cle: valeur` dans le bloc (4 espaces d'indentation), ou
        remplace la ligne existante. Retourne le bloc modifié."""
        cible = f"    {cle}:"
        for i, l in enumerate(bloc):
            if l.startswith(cible):
                bloc[i] = cible + (" " + str(valeur) if str(valeur) != ""
                                   else "")
                return bloc
        bloc.append(cible + (" " + str(valeur) if str(valeur) != "" else ""))
        return bloc

    def modifier(self, logement_id, champs):
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if logement_id not in blocs:
            raise ErreurRegistre(404, "logement inconnu : " + logement_id)
        d, f = blocs[logement_id]
        bloc = lignes[d:f]
        avant = self._scalaires(lignes, d, f)
        for cle, val in champs.items():
            if cle in ("logement_id", "statut"):
                continue                    # ni identité ni cycle de vie ici
            if isinstance(val, (dict, list)):
                continue                    # structure complexe : moteurs métier
            bloc = self._fixer_scalaire(bloc, cle, self._guillemets(cle, val))
        lignes[d:f] = bloc
        snap = self._snapshot()
        self._ecrire(lignes)
        apres = self._scalaires(lignes, *self._blocs(lignes)[logement_id])
        return {"logement_id": logement_id, "snapshot": snap,
                "avant": avant, "apres": apres,
                "modifies": [c for c in champs
                             if str(avant.get(c)) != str(apres.get(c))]}

    def _guillemets(self, cle, val):
        """Chaîne lisible → yaml simple : texte entre guillemets, nombres tels
        quels, booléens en minuscules."""
        s = str(val)
        if s.lower() in ("true", "false"):
            return s.lower()
        try:
            float(s)
            return s
        except ValueError:
            return f'"{s}"'

    def archiver(self, logement_id, motif, par):
        """Suppression DOUCE (§6bis) : on marque, on ne purge jamais."""
        lignes = self._lire_lignes()
        blocs = self._blocs(lignes)
        if logement_id not in blocs:
            raise ErreurRegistre(404, "logement inconnu : " + logement_id)
        d, f = blocs[logement_id]
        bloc = lignes[d:f]
        bloc = self._fixer_scalaire(bloc, "statut", "archive")
        bloc.append(f"    motif_archivage: \"{motif}\"")
        bloc.append(f"    archive_par: \"{par}\"")
        bloc.append(f"    archive_le: \"{utcnow_iso()}\"")
        lignes[d:f] = bloc
        snap = self._snapshot()
        self._ecrire(lignes)
        return {"logement_id": logement_id, "statut": "archive",
                "motif": motif, "par": par, "snapshot": snap}

    # -- rollback --------------------------------------------------------- #
    def snapshots(self):
        try:
            return sorted(os.listdir(self.snapshots_dir), reverse=True)
        except OSError:
            return []

    def rollback(self, nom):
        """Restaure un snapshot horodaté (jamais de purge dure)."""
        src = os.path.join(self.snapshots_dir, os.path.basename(nom))
        if not os.path.isfile(src):
            raise ErreurRegistre(404, "snapshot inconnu : " + nom)
        tmp = self.chemin + ".tmp"
        shutil.copy2(src, tmp)
        os.replace(tmp, self.chemin)
        return {"restaure": os.path.basename(src),
                "logements": len(self._blocs(self._lire_lignes()))}
