"""secrets_registre.py — inventaire des SLOTS de secrets (§S3.5-V5 / F5).

METADONNEES SEULEMENT. La passerelle ne voit jamais une valeur de secret : ni
en clair, ni dérivée, ni hachée. Elle ne connaît que le NOM du slot, sa
SOURCE (`env:` ou `vault:`) et la date de dernière rotation déclarée. Toute
tentative de mettre une valeur dans le registre est refusee a l'ecriture
(`_refuse_valeur`).

La rotation EST un geste humain hors passerelle (`deploy-vps.sh rotate` ou
gestion du vault) : on ne fait que CONSTATER la date. super_admin seul la
declare (`POST /v1/secrets/rotate`) — admin reçoit 403 (batterie V6).

Séparé de gateway.py (motif statut_h.py) : la route n'ajoute qu'un import +
un branchement, le corps reste ici et relit le yaml à chaque appel (fichier
petit, écriture rare).
"""
import datetime as _dt
import os
import re

# Champs autorisés d'un slot. TOUT autre champ = refus (fail-closed) : c'est
# ainsi qu'on garantit "jamais de valeur" — il n'existe tout simplement pas de
# champ pour en recevoir une.
CHAMPS_SLOT = {"id", "source", "cadence_j", "derniere_rotation", "note"}
_SOURCE_RE = re.compile(r"^(env|vault):[A-Za-z0-9_./-]+$")
_ID_RE = re.compile(r"^[a-z0-9_]+$")


def _depoluer(v):
    """Retire les quotes et commentaires triviaux d'une valeur YAML simple."""
    v = v.split(" #", 1)[0].strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        return v[1:-1]
    return v


class RegistreSecretsErreur(ValueError):
    """Registre invalide (champ interdit, valeur tentée, format faux)."""


def _refuse_valeur(slot_id, cle):
    """Un champ qui ressemble a une valeur de secret est refuse, point."""
    raise RegistreSecretsErreur(
        f"slot {slot_id!r} : champ {cle!r} refuse — le registre ne porte "
        "que des metadonnees (id/source/cadence_j/derniere_rotation), "
        "jamais de valeur de secret")


def charger(chemin):
    """Lit l'inventaire des slots. Retourne {id: slot} propre, sans valeur.

    Sous-ensemble YAML PLAT parsé à la main (stdib seule — la gateway n'a pas
    pyyaml, comme `charger_boxes`). Structure : `slots:` puis `- id:` suivi de
    champs indentés. Fail-closed : fichier absent = {} (0 slot, jamais "rien à
    protéger"). Champ inconnu, source non `env:`/`vault:`, id/cadence/date
    invalides = RegistreSecretsErreur (on refuse un registre sale).
    """
    if not chemin or not os.path.isfile(chemin):
        # Repli sur l'EXAMPLE versionné (motif users.yml.EXAMPLE, doctrine 71
        # S2) : le fichier reel est GITIGNORE (jamais suivi), un clone frais
        # ne l'a donc pas — l'inventaire DOCUMENTE reste lisible et ne porte
        # aucune valeur (dates null = « jamais declaree », pas un faux au-vert).
        if chemin and os.path.isfile(chemin + ".EXAMPLE"):
            chemin = chemin + ".EXAMPLE"
        else:
            return {}
    with open(chemin, encoding="utf-8") as f:
        lignes = f.read().splitlines()
    items = []
    courant = None
    for brute in lignes:
        if not brute.strip() or brute.strip().startswith("#"):
            continue
        ind = len(brute) - len(brute.lstrip(" "))
        txt = brute.strip()
        if ind == 0:
            courant = None
            continue  # `slots:` (racine) — on ne garde que les items dessous
        if txt.startswith("- "):
            courant = {}
            items.append(courant)
            txt = txt[2:].strip()
            if ":" not in txt:
                raise RegistreSecretsErreur("item de slot sans clé:valeur")
        if courant is None:
            raise RegistreSecretsErreur(f"ligne hors item refusee : {txt!r}")
        if ":" not in txt:
            raise RegistreSecretsErreur(f"ligne illisible : {txt!r}")
        k, v = txt.split(":", 1)
        courant[k.strip()] = _depoluer(v)
    propres = {}
    for brut in items:
        sid = str(brut.get("id", "")).strip()
        if not _ID_RE.match(sid):
            raise RegistreSecretsErreur(f"slot id invalide : {sid!r}")
        for cle in brut:
            if cle not in CHAMPS_SLOT:
                _refuse_valeur(sid, cle)
        source = str(brut.get("source", "")).strip()
        if not _SOURCE_RE.match(source):
            raise RegistreSecretsErreur(
                f"slot {sid!r} : source doit etre 'env:NOM' ou "
                f"'vault:chemin' (sans valeur) — recu {source!r}")
        try:
            cadence = int(brut.get("cadence_j", 0))
        except (TypeError, ValueError):
            raise RegistreSecretsErreur(
                f"slot {sid!r} : cadence_j entier attendu")
        derniere = str(brut.get("derniere_rotation", "") or "").strip()
        if derniere.lower() in ("null", "none", "~", ""):
            derniere = ""
        if derniere:
            try:
                _dt.date.fromisoformat(derniere)
            except ValueError:
                raise RegistreSecretsErreur(
                    f"slot {sid!r} : derniere_rotation ISO AAAA-MM-JJ")
        propres[sid] = {"id": sid, "source": source, "cadence_j": cadence,
                        "derniere_rotation": derniere or None,
                        "note": str(brut.get("note", "") or "")}
    return propres


def statut(slots, aujourdhui=None):
    """Ajoute l'etat de rotation a chaque slot (J-30 / J-7 / passe).

    Ne renvoie QUE des metadonnees + des compteurs de jours. Jamais une
    valeur, jamais un derive. `derniere_rotation: null` = rotation jamais
    declaree -> `jamais_declaree` (alerte maximale, pas un faux "au vert").
    """
    j = aujourdhui or _dt.date.today()
    out = []
    for slot in slots.values():
        d = dict(slot)
        cad = slot.get("cadence_j") or 0
        dr = slot.get("derniere_rotation")
        if not dr:
            d.update({"statut_rotation": "jamais_declaree",
                      "jours_depuis": None, "alerte": True})
        else:
            jours = (j - _dt.date.fromisoformat(dr)).days
            reste = cad - jours if cad else None
            if cad and jours >= cad:
                etat, alerte = "perimee", True
            elif cad and reste is not None and reste <= 7:
                etat, alerte = "due_j7", True
            elif cad and reste is not None and reste <= 30:
                etat, alerte = "due_j30", True
            else:
                etat, alerte = "a_jour", False
            d.update({"statut_rotation": etat, "jours_depuis": jours,
                      "alerte": alerte})
        out.append(d)
    out.sort(key=lambda x: x["id"])
    return out


def appliquer_rotation(slots, slot_id, date_iso):
    """Enregistre la declaration d'une rotation (geste super_admin).

    Ne modifie QUE la date. Renvoie le slot mis a jour, ou None si inconnu.
    La valeur du secret reste ou elle etait (vault/env) — on ne la touche pas,
    on ne la voit pas.
    """
    slot = slots.get(slot_id)
    if not slot:
        return None
    _dt.date.fromisoformat(date_iso)  # leve si format faux
    slot["derniere_rotation"] = date_iso
    return dict(slot)
