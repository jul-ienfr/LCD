#!/usr/bin/env python3
# custom/dispatch-presta/dispatch.py — dispatch prestataires + dossier sinistre P6-8 (§12.4-bis) + todos ménage P6-1 (§1.6.2).
# 0 € : stdlib seule. Même LXC/box que les 6 autres moteurs. Port :8096.
#
# Annuaire par logement `custom/prestataires/logX.yaml` (jamais de texte libre :
# zones = clés de `custom/zones.yaml` seul) ; `zone_defaut` par logement dans
# `custom/logements.yaml`. Si `annuaire_presta: off` : contacts libres, pas de
# dispatch/comparatif (réponse mode contacts_libres).
#
# Règles (verrouillées en code) :
#   - dispatch = filtre zone + actif + RC pro valide. Score prix x note si
#     renseignés, sinon ordre du fichier. Proposition seule, jamais d'envoi auto.
#   - hors zone = 2e choix avec surcoût déplacement affiché, JAMAIS auto :
#     la mission hors zone reste une validation humaine (1-tap `qui`).
#   - RC expirée (`rc_pro_fin` passée) ou `rc_pro: false` = exclu, statut
#     `suspendu_assurance`. J-30/J-7 : alerte `rc_expire_bientot` (jours restants).
#   - mission = 1-tap HUMAINE (`qui` != auto/llm/jev/moteur-*) + justificatifs
#     photos avant/après obligatoires à la clôture (dossier intervention).
#   - alerte si <2 actifs par métier critique et par zone du logement.
#   - migration auto ancien champ `zone:` texte -> `zones:` + avertissement.
#
# Dossier sinistre : POST /sinistre -> `sinistres/logX/<AAAA-MM-JJ>_<motif>/`
# (fiche.json) + rappel délai plateforme (Airbnb 14 j / Booking 48 h / Vrbo ~14 j).
# Suivi caution : jamais de retenue sans justificatifs (renvoyé vers /mission).
#
# Contrats :
#   GET  /health -> {"ok": true}
#   GET  /annuaire?logement_id=log1 -> annuaire + alertes couverture + RC
#   POST /dispatch {logement_id, metier, zone?, motif?, qui?} -> proposition
#   POST /mission {logement_id, presta_id, motif, qui, debut?, fin?} -> 1-tap
#   GET  /intervention?logement_id=log1&dossier=<date>_<presta>_<motif>
#   POST /pointage {logement_id, dossier, evenement: arrivee|depart, qui}
#   POST /photo {logement_id, dossier, phase: avant|apres, piece, nom,
#                donnees_base64, qui}
#   POST /cloture {logement_id, dossier, temps_declare_min?, justificatif?, qui}
#     -> 409 preuves_manquantes (pointage/photos par piece) ; 409
#     justificatif_requis (ecart >20 %) ; 201 cloturee (temps facture = pointe)
#   POST /todos {logement_id, ref_resa?, checkout?, checkin_suivant?,
#                arrivee?, presta_dispo?, sejours_rapproches?,
#                extras_payes[]?, qui?} -> 201 dossier date menage/logX
#     (7 items socle + deadline check-in -2h + assigne interne/presta +
#     extras fusionnes si extras_upsell on + notifs multi-destinataires)
#   GET  /todos?logement_id=log1[&dossier=...] -> liste ou detail + statut
#   POST /menage-pointage {logement_id, dossier, evenement, qui}
#   POST /menage-photo {logement_id, dossier, phase: entree|sortie, piece,
#                nom, donnees_base64, qui}
#   POST /menage-cloture {logement_id, dossier, checklist?, photos_voyageur_ok?,
#                dossier_intervention?, qui} -> 409 preuves_manquantes /
#     cases_manquantes ; 201 remise_en_dispo
#   POST /sinistre {logement_id, motif, declarant, description, canal?, resa?}
#
# Usage : python3 dispatch.py --config config.yaml --logements ../logements.yaml
#   [--prestataires ../prestataires] [--zones ../zones.yaml] [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND, LCD_PRESTATAIRES_DIR, LCD_ZONES_YAML.

import argparse
import base64
import datetime as dt
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI_AUTO = ("auto", "llm", "jev", "moteur-dispatch", "moteur-direct", "")


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def _scalaire(v):
    v = v.strip().strip("\"'")
    if v.startswith("[") and v.endswith("]"):
        return [_scalaire(x) for x in v[1:-1].split(",") if x.strip()]
    if v in ("true", "false"):
        return v == "true"
    if re.fullmatch(r"-?\d+", v):
        return int(v)
    if re.fullmatch(r"-?\d+\.\d+", v):
        return float(v)
    return v


def charger_yaml_plat(path):
    """Parseur YAML plat (niveau 0) — même convention que caution/facturation."""
    data = {}
    try:
        with open(path, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne.strip() or ligne[0] in (" ", "\t"):
                    continue
                if ":" in ligne:
                    k, v = ligne.split(":", 1)
                    data[k.strip()] = _scalaire(v)
    except FileNotFoundError:
        pass
    return data


def lire_logement(path, logement_id):
    """Zone(s), zone_defaut et flag annuaire_presta d'un logement (scan de bloc).

    Gère 2 niveaux : clés directes du bloc (zones, zone_defaut, indent 4) ET
    clés imbriquées (features.annuaire_presta, indent 6) — cf. logements.yaml.
    """
    info = {"zones": [], "zone_defaut": None, "annuaire_presta": True,
            "traca_intervenants": False, "etat_lieux_auto": False,
            "extras_upsell": False}
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return info
    dans_bloc = False
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if re.match(r"^  \w[\w-]*:\s*$", ligne):
            dans_bloc = ligne.strip().rstrip(":") == logement_id
            continue
        if dans_bloc and (ligne.startswith("    ") or ligne.startswith("\t")):
            if ":" not in ligne:
                continue
            k, v = ligne.strip().split(":", 1)
            k, v = k.strip(), v.strip()
            if k == "zone_defaut":
                info["zone_defaut"] = v.strip("\"'") or None
                if info["zone_defaut"] in ("null", "None", ""):
                    info["zone_defaut"] = None
            elif k == "zones":
                val = _scalaire(v)
                info["zones"] = val if isinstance(val, list) else []
            elif k == "annuaire_presta":
                # niveau 1 (ancien) ou niveau 2 sous features: (même ligne
                # stripée, le scan de bloc couvre les deux indents).
                info["annuaire_presta"] = _scalaire(v) is True
            elif k in ("traca_intervenants", "etat_lieux_auto",
                       "extras_upsell"):
                # Sous features: (indent 6) — P6-1 todos/photos/notifs.
                info[k] = _scalaire(v) is True
    return info


def lire_annuaire(path):
    """Annuaire presta : metiers_critiques + prestataires (liste d'objets)."""
    res = {"metiers_critiques": [], "prestataires": [], "migrations": []}
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return res
    courant = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        if ligne.startswith("metiers_critiques:"):
            val = _scalaire(ligne.split(":", 1)[1])
            res["metiers_critiques"] = val if isinstance(val, list) else []
            continue
        if re.match(r"^prestataires:\s*(\[\])?\s*$", ligne):
            continue
        m = re.match(r"^\s+-\s+(\w[\w-]*):\s*(.*)$", ligne)
        if m:
            courant = {m.group(1): _scalaire(m.group(2))}
            res["prestataires"].append(courant)
            continue
        m2 = re.match(r"^\s{4,}(\w[\w-]*):\s*(.*)$", ligne)
        if m2 and courant is not None:
            courant[m2.group(1)] = _scalaire(m2.group(2))
    for p in res["prestataires"]:
        if "zones" not in p and "zone" in p:
            p["zones"] = [p.pop("zone")]
            res["migrations"].append(
                f"{p.get('id', '?')} : champ 'zone:' texte migre vers 'zones:'")
        if isinstance(p.get("zones"), str):
            p["zones"] = [p["zones"]]
    return res


def parse_carte(texte):
    """'k1:v1 k2:v2' -> dict (config niveau 0, cf. lab-config/dispatch.yaml)."""
    carte = {}
    for morceau in str(texte or "").split():
        if ":" in morceau:
            k, v = morceau.split(":", 1)
            carte[k.strip()] = v.strip()
    return carte


def statut_rc(presta):
    """(valide, statut, jours_restants) — RC pro : jamais dispatché sans RC valide."""
    if not presta.get("actif", False):
        return False, "inactif", None
    if not presta.get("rc_pro", False):
        return False, "suspendu_assurance", None
    fin = str(presta.get("rc_pro_fin", "") or "")
    if not fin:
        return True, "actif", None
    try:
        j = (dt.date.fromisoformat(fin) - dt.date.today()).days
    except ValueError:
        return False, "suspendu_assurance", None
    if j < 0:
        return False, "suspendu_assurance", j
    return True, "actif", j


class Dispatch:
    def __init__(self, cfg, logements_yaml, prestataires_dir, zones_yaml):
        self.cfg = cfg
        self.logements_yaml = logements_yaml
        self.presta_dir = prestataires_dir
        self.state_dir = (os.environ.get("LCD_STATE_DIR")
                          or cfg.get("state_dir", "./state"))
        self.decision_dir = (os.environ.get("LCD_DECISION_LOG_DIR")
                             or cfg.get("decision_log_dir", "./state"))
        self.templates_dir = (os.environ.get("LCD_TEMPLATES_DIR")
                              or cfg.get("templates_dir", ""))
        self.carte_motifs = parse_carte(cfg.get("carte_motifs", ""))
        self.sla = {k: int(v) for k, v in
                    parse_carte(cfg.get("sla_h", "")).items()}
        self.delais = {k: int(v) for k, v in
                       parse_carte(cfg.get("delais_plateforme_j", "")).items()}
        z = charger_yaml_plat(zones_yaml)
        self.zone_defaut_globale = z.get("zone_defaut")

    # --- helpers ---
    def _annuaire(self, logement_id):
        return lire_annuaire(os.path.join(self.presta_dir, f"{logement_id}.yaml"))

    def _log(self, logement_id):
        return lire_logement(self.logements_yaml, logement_id)

    def log_decision(self, logement_id, ref, qui, quoi, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": None,
                 "commission": None, "net_hote": None, "motif": motif}
        os.makedirs(self.decision_dir, exist_ok=True)
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")

    def _alertes_couverture(self, logement_id, log, ann):
        zones_log = log["zones"] or ([log["zone_defaut"]] if log["zone_defaut"] else [])
        alertes = []
        for metier in ann["metiers_critiques"]:
            for zone in zones_log:
                n = sum(1 for p in ann["prestataires"]
                        if p.get("metier") == metier and zone in (p.get("zones") or [])
                        and statut_rc(p)[0])
                if n < 2:
                    alertes.append(f"couverture faible : {metier}/{zone} = {n} actif(s) (<2)")
        rappels = []
        for p in ann["prestataires"]:
            ok, statut, jours = statut_rc(p)
            if statut == "suspendu_assurance":
                rappels.append(f"{p.get('id', '?')} : dispatch BLOQUE (RC invalide/expiree)")
            elif jours is not None and jours <= 30:
                palier = "J-7" if jours <= 7 else "J-30"
                rappels.append(f"{p.get('id', '?')} : RC expire dans {jours} j ({palier})")
        return alertes + rappels

    # --- GET /annuaire ---
    def annuaire(self, logement_id):
        log = self._log(logement_id)
        ann = self._annuaire(logement_id)
        if not log["annuaire_presta"]:
            return 200, {"logement_id": logement_id, "mode": "contacts_libres",
                         "detail": "annuaire_presta: off — contacts libres, pas de dispatch"}
        fiches = []
        for p in ann["prestataires"]:
            ok, statut, jours = statut_rc(p)
            fiches.append({"id": p.get("id"), "metier": p.get("metier"),
                           "zones": p.get("zones") or [], "statut": statut,
                           "rc_jours_restants": jours,
                           "tarif_h": p.get("tarif_h"), "deplacement": p.get("deplacement"),
                           "note": p.get("note")})
        alertes = self._alertes_couverture(logement_id, log, ann)
        return 200, {"logement_id": logement_id, "zone_defaut": log["zone_defaut"],
                     "zones": log["zones"], "prestataires": fiches,
                     "alertes": alertes, "migrations": ann["migrations"]}

    # --- POST /dispatch ---
    def dispatch(self, logement_id, metier, zone=None, motif="", qui=""):
        log = self._log(logement_id)
        if not log["annuaire_presta"]:
            return 200, {"logement_id": logement_id, "mode": "contacts_libres",
                         "detail": "annuaire_presta: off — contacts libres dashboard"}
        if not metier and motif:
            metier = self.carte_motifs.get(motif, "")
        if not metier:
            return 400, {"erreur": "metier requis (ou motif connu : "
                                    + ", ".join(sorted(self.carte_motifs)) + ")"}
        zone_cible = zone or log["zone_defaut"] or self.zone_defaut_globale
        ann = self._annuaire(logement_id)
        candidats = [p for p in ann["prestataires"]
                     if p.get("metier") == metier and statut_rc(p)[0]]

        def score(p):
            if p.get("tarif_h") is not None:
                return (float(p.get("tarif_h") or 0), -(float(p.get("note") or 0)))
            return (0, 0)
        en_zone = sorted([p for p in candidats if zone_cible in (p.get("zones") or [])],
                         key=score)
        hors_zone = sorted([p for p in candidats if zone_cible not in (p.get("zones") or [])],
                           key=score)

        def fiche(p, second_choix=False):
            f = {"id": p.get("id"), "metier": p.get("metier"),
                 "zones": p.get("zones") or [], "tarif_h": p.get("tarif_h"),
                 "note": p.get("note"), "sla_h": self.sla.get(metier)}
            if second_choix:
                dep = p.get("deplacement")
                f["second_choix"] = True
                f["surcout_deplacement"] = (f"{dep} EUR" if dep is not None
                                            else "surcout a confirmer (jamais auto)")
            return f

        prop = fiche(en_zone[0]) if en_zone else None
        escalade = not en_zone
        self.log_decision(logement_id, motif or metier, qui or "moteur-dispatch",
                          "dispatch_propose",
                          f"{metier}/{zone_cible} : {prop['id'] if prop else 'AUCUN en zone'}"
                          + (f" + {len(hors_zone)} 2e choix" if hors_zone else ""))
        return 200, {"logement_id": logement_id, "metier": metier,
                     "zone": zone_cible, "proposition": prop,
                     "en_zone": [fiche(p) for p in en_zone],
                     "deuxieme_choix": [fiche(p, True) for p in hors_zone],
                     "escalade_hote": escalade,
                     "detail": ("mission PWA a valider 1-tap (POST /mission)"
                                if prop else
                                "aucun dispo en zone : escalade hote + 2e choix (jamais auto)"),
                     "alertes": self._alertes_couverture(logement_id, log, ann)}

    # --- POST /mission (1-tap humaine) ---
    def mission(self, logement_id, presta_id, motif, qui, debut="", fin=""):
        if not qui or str(qui).strip().lower() in QUI_AUTO:
            return 400, {"erreur": "mission = 1-tap HUMAINE exigee (qui != auto/llm/jev)"}
        if not (presta_id and motif):
            return 400, {"erreur": "presta_id + motif requis"}
        ann = self._annuaire(logement_id)
        presta = next((p for p in ann["prestataires"] if p.get("id") == presta_id), None)
        if not presta:
            return 404, {"erreur": f"presta {presta_id} inconnu annuaire {logement_id}"}
        ok, statut, _ = statut_rc(presta)
        if not ok:
            self.log_decision(logement_id, motif, qui, "mission_bloquee",
                              f"{presta_id} : {statut}")
            return 403, {"erreur": f"dispatch BLOQUE : {presta_id} = {statut} "
                                    "(RC invalide/expiree ou inactif)"}
        log = self._log(logement_id)
        zone_cible = log["zone_defaut"] or self.zone_defaut_globale
        hors_zone = zone_cible not in (presta.get("zones") or [])
        jour = dt.date.today().isoformat()
        slug = re.sub(r"[^a-z0-9]+", "_", motif.lower()).strip("_") or "mission"
        dossier = os.path.join(self.state_dir, "interventions", logement_id,
                               f"{jour}_{presta_id}_{slug}")
        os.makedirs(os.path.join(dossier, "avant"), exist_ok=True)
        os.makedirs(os.path.join(dossier, "apres"), exist_ok=True)
        intervention = {"presta_id": presta_id, "metier": presta.get("metier"),
                        "motif": motif, "debut": debut, "fin": fin,
                        "temps_pointe_min": None, "temps_declare_min": None,
                        "photos_avant": [], "photos_apres": [],
                        "statut": "mission_creee",
                        "regle": "ecart >20% presence vs declare -> alerte (P6-2)"}
        with open(os.path.join(dossier, "intervention.json"), "w", encoding="utf-8") as f:
            json.dump(intervention, f, ensure_ascii=False, indent=2)
        fiche = self._fiche_mission(logement_id, presta, motif, debut, fin, dossier)
        with open(os.path.join(dossier, "mission.md"), "w", encoding="utf-8") as f:
            f.write(fiche)
        self.log_decision(logement_id, motif, qui, "mission_creee",
                          f"{presta_id} ({'HORS ZONE validee humain' if hors_zone else 'en zone'})"
                          + f" -> {dossier}")
        res = {"logement_id": logement_id, "presta_id": presta_id,
               "motif": motif, "dossier": dossier,
               "statut": "mission_creee", "valide_par": qui,
               "photos": "avant/apres OBLIGATOIRES (cloture bloquante si manquantes)"}
        if hors_zone:
            dep = presta.get("deplacement")
            res["hors_zone_validee"] = True
            res["surcout_deplacement"] = (f"{dep} EUR" if dep is not None
                                          else "a confirmer avec le presta")
        return 201, res

    # --- P6-2 : parcours intervenant (pointage / photos / cloture) ---
    # PWA/QR : l'intervenant pointe arrivee/depart depuis son telephone,
    # depose photos AVANT/APRES par piece. Cloture BLOQUEE si preuves
    # manquantes. Temps facture = temps pointe. Ecart >20 % presence vs
    # declare -> justificatif + alerte (JAMAIS sanction auto).
    EXT_PHOTOS = (".jpg", ".jpeg", ".png", ".webp")

    def _dossier(self, logement_id, dossier):
        # Accepte nom seul OU chemin complet renvoye par /mission (on ne garde
        # que le basename et on reconstruit sous state/interventions/logX :
        # aucun chemin arbitraire ne sort du dossier mission).
        brut = str(dossier or "")
        if ".." in brut or "\x00" in brut:
            return None, "dossier invalide"
        nom = os.path.basename(brut.strip())
        if not nom or nom in (".", ".."):
            return None, "dossier invalide (nom mission requis)"
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", nom):
            return None, "dossier invalide (caracteres mission seuls)"
        chemin = os.path.join(self.state_dir, "interventions", logement_id, nom)
        if not os.path.isdir(chemin):
            return None, (f"dossier inconnu : interventions/{logement_id}/{nom} "
                           "(POST /mission d'abord)")
        return chemin, None

    def _lire_intervention(self, chemin):
        try:
            with open(os.path.join(chemin, "intervention.json"),
                      encoding="utf-8") as f:
                return json.load(f), None
        except (FileNotFoundError, ValueError):
            return None, "intervention.json illisible (POST /mission d'abord)"

    def _sauver_intervention(self, chemin, obj):
        with open(os.path.join(chemin, "intervention.json"), "w",
                  encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

    @staticmethod
    def _qui_humain(qui):
        return bool(qui) and str(qui).strip().lower() not in QUI_AUTO

    # --- GET /intervention ---
    def intervention(self, logement_id, dossier):
        chemin, err = self._dossier(logement_id, dossier)
        if err:
            return 404, {"erreur": err}
        inter, err = self._lire_intervention(chemin)
        if err:
            return 404, {"erreur": err}
        return 200, {"logement_id": logement_id,
                     "dossier": os.path.basename(chemin),
                     "intervention": inter}

    # --- POST /pointage ---
    def pointage(self, logement_id, dossier, evenement, qui):
        if not self._qui_humain(qui):
            return 400, {"erreur": "pointage = geste INTERVENANT "
                                    "(qui != auto/llm/jev)"}
        if evenement not in ("arrivee", "depart"):
            return 400, {"erreur": "evenement = arrivee|depart"}
        chemin, err = self._dossier(logement_id, dossier)
        if err:
            return 404, {"erreur": err}
        inter, err = self._lire_intervention(chemin)
        if err:
            return 404, {"erreur": err}
        if inter.get("statut") == "cloturee":
            return 409, {"erreur": "mission deja cloturee (reouverture = hote seul)"}
        ts = utcnow_iso()
        if evenement == "arrivee":
            if inter.get("arrivee"):
                return 409, {"erreur": "arrivee deja pointee",
                             "arrivee": inter["arrivee"]}
            inter["arrivee"] = ts
            inter["arrivee_par"] = qui
            inter["statut"] = "en_cours"
        else:
            if not inter.get("arrivee"):
                return 409, {"erreur": "depart sans arrivee "
                                        "(pointer arrivee d'abord)",
                             "code": "preuves_manquantes"}
            if inter.get("depart"):
                return 409, {"erreur": "depart deja pointe",
                             "depart": inter["depart"]}
            inter["depart"] = ts
            inter["depart_par"] = qui
            try:
                a = dt.datetime.fromisoformat(inter["arrivee"])
                b = dt.datetime.fromisoformat(ts)
                duree = max(0, int((b - a).total_seconds() // 60))
            except ValueError:
                duree = 0
            inter["duree_presence_min"] = duree
            inter["statut"] = "pointee"
        self._sauver_intervention(chemin, inter)
        self.log_decision(logement_id, os.path.basename(chemin), qui,
                          f"pointage_{evenement}", ts)
        return 200, {"logement_id": logement_id,
                     "dossier": os.path.basename(chemin),
                     "evenement": evenement, "ts": ts,
                     "duree_presence_min": inter.get("duree_presence_min")}

    # --- POST /photo ---
    def photo(self, logement_id, dossier, phase, piece, nom,
              donnees_base64, qui):
        if not self._qui_humain(qui):
            return 400, {"erreur": "photo = geste INTERVENANT "
                                    "(qui != auto/llm/jev)"}
        if phase not in ("avant", "apres"):
            return 400, {"erreur": "phase = avant|apres"}
        piece = re.sub(r"[^a-z0-9_-]+", "_",
                       str(piece or "").lower()).strip("_")
        if not piece:
            return 400, {"erreur": "piece requise (ex : salon, sdb, cuisine)"}
        nom_f = os.path.basename(str(nom or ""))
        ext = os.path.splitext(nom_f)[1].lower()
        if ext not in self.EXT_PHOTOS:
            return 400, {"erreur": "photo jpg/png/webp seule "
                                    "(video <60 s si anomalie : depot hote)"}
        chemin, err = self._dossier(logement_id, dossier)
        if err:
            return 404, {"erreur": err}
        inter, err = self._lire_intervention(chemin)
        if err:
            return 404, {"erreur": err}
        if inter.get("statut") == "cloturee":
            return 409, {"erreur": "mission deja cloturee (reouverture = hote seul)"}
        try:
            brut = base64.b64decode(donnees_base64 or "", validate=True)
        except Exception:
            return 400, {"erreur": "donnees_base64 invalide"}
        if not brut:
            return 400, {"erreur": "photo vide"}
        if len(brut) > 8_000_000:
            return 413, {"erreur": "photo trop lourde (>8 Mo)"}
        horodat = utcnow_iso().replace(":", "").replace("+", "")
        cible = re.sub(r"[^a-z0-9_.-]+", "_",
                       f"{piece}_{horodat}_{nom_f}").strip("._") or f"{piece}{ext}"
        if not cible.lower().endswith(ext):
            cible += ext
        with open(os.path.join(chemin, phase, cible), "wb") as f:
            f.write(brut)
        cle = "photos_avant" if phase == "avant" else "photos_apres"
        inter.setdefault(cle, []).append({"fichier": cible, "piece": piece,
                                          "ts": utcnow_iso(), "par": qui})
        self._sauver_intervention(chemin, inter)
        self.log_decision(logement_id, os.path.basename(chemin), qui,
                          f"photo_{phase}",
                          f"{piece}/{cible} ({len(brut)} o)")
        return 201, {"logement_id": logement_id,
                     "dossier": os.path.basename(chemin),
                     "phase": phase, "piece": piece, "fichier": cible,
                     "octets": len(brut)}

    # --- POST /cloture ---
    def cloture(self, logement_id, dossier, temps_declare_min=None,
                justificatif="", qui=""):
        if not self._qui_humain(qui):
            return 400, {"erreur": "cloture = validation HUMAINE "
                                    "(qui != auto/llm/jev)"}
        chemin, err = self._dossier(logement_id, dossier)
        if err:
            return 404, {"erreur": err}
        inter, err = self._lire_intervention(chemin)
        if err:
            return 404, {"erreur": err}
        nom = os.path.basename(chemin)
        if inter.get("statut") == "cloturee":
            return 409, {"erreur": "mission deja cloturee",
                         "temps_facture_min": inter.get("temps_facture_min")}
        manquants = []
        if not inter.get("arrivee"):
            manquants.append("pointage arrivee")
        if not inter.get("depart"):
            manquants.append("pointage depart")
        av = inter.get("photos_avant") or []
        ap = inter.get("photos_apres") or []
        if not av:
            manquants.append("photos avant (>=1 par piece)")
        if not ap:
            manquants.append("photos apres (>=1 par piece)")
        sans_apres = sorted({p.get("piece") for p in av}
                            - {p.get("piece") for p in ap})
        if sans_apres:
            manquants.append("photos apres manquantes pieces : "
                             + ", ".join(sans_apres))
        if manquants:
            self.log_decision(logement_id, nom, qui, "cloture_bloquee",
                              "; ".join(manquants))
            return 409, {"erreur": "cloture BLOQUEE : preuves manquantes",
                         "code": "preuves_manquantes", "manquants": manquants}
        pointe = int(inter.get("duree_presence_min") or 0)
        if temps_declare_min is None:
            declare = pointe
        else:
            try:
                declare = int(temps_declare_min)
            except (TypeError, ValueError):
                return 400, {"erreur": "temps_declare_min = entier >=0 (minutes)"}
            if declare < 0:
                return 400, {"erreur": "temps_declare_min = entier >=0 (minutes)"}
        if pointe > 0:
            ecart = round(abs(declare - pointe) / pointe * 100, 1)
        else:
            ecart = 0.0 if declare == 0 else 100.0
        if ecart > 20 and not str(justificatif or "").strip():
            return 409, {"erreur": "ecart >20 % presence vs declare : "
                                    "justificatif ecrit requis "
                                    "(jamais sanction auto)",
                         "code": "justificatif_requis",
                         "duree_presence_min": pointe,
                         "temps_declare_min": declare, "ecart_pct": ecart}
        inter["temps_declare_min"] = declare
        inter["temps_facture_min"] = pointe  # temps facture = temps pointe
        inter["ecart_pct"] = ecart
        if str(justificatif or "").strip():
            inter["justificatif_ecart"] = str(justificatif).strip()
        inter["statut"] = "cloturee"
        inter["cloturee_par"] = qui
        inter["cloture_le"] = utcnow_iso()
        self._sauver_intervention(chemin, inter)
        self.log_decision(logement_id, nom, qui, "cloturee",
                          f"pointe {pointe} min / declare {declare} min / "
                          f"facture {pointe} min / ecart {ecart} %"
                          + (" + ALERTE ecart>20 %" if ecart > 20 else ""))
        return 201, {"logement_id": logement_id, "dossier": nom,
                     "statut": "cloturee",
                     "duree_presence_min": pointe,
                     "temps_declare_min": declare,
                     "temps_facture_min": pointe,
                     "ecart_pct": ecart, "alerte_ecart": ecart > 20,
                     "regle": "temps facture = temps pointe ; ecart >20 % = "
                              "alerte + justificatif, jamais sanction auto"}

    # --- P6-1 : todos ménage + photos E/S + notifs + clôture bloquante ---
    # Checkout -> todo auto + dispatch (interne défaut, presta si presta_dispo
    # ou séjours rapprochés <6h) + deadline check-in suivant -2h. Checklist 7
    # cases obligatoires. Comparatif état des lieux voyageur si
    # etat_lieux_auto on (clôture bloquée si photos voyageur manquantes).
    # Si traca_intervenants on : dossier intervention clôturé exigé.
    # Remise en dispo BLOQUÉE si preuves manquantes (jamais auto).
    CHECKLIST_MENAGE = ("draps_housse_propre", "consommables_kit",
                        "poubelles_sorties_tri", "lv_ll_vides_propres",
                        "photos_entree", "photos_sortie",
                        "controle_final_poussieres")

    def _dossier_menage(self, logement_id, dossier):
        # Nom seul, reconstruit sous state/menage/logX (même garde que P6-2).
        brut = str(dossier or "")
        if ".." in brut or "\x00" in brut:
            return None, "dossier invalide"
        nom = os.path.basename(brut.strip())
        if not nom or nom in (".", ".."):
            return None, "dossier invalide (nom menage requis)"
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_.-]*", nom):
            return None, "dossier invalide (caracteres mission seuls)"
        chemin = os.path.join(self.state_dir, "menage", logement_id, nom)
        if not os.path.isdir(chemin):
            return None, (f"dossier inconnu : menage/{logement_id}/{nom} "
                           "(POST /todos d'abord)")
        return chemin, None

    def _lire_todos(self, chemin):
        try:
            with open(os.path.join(chemin, "todos.json"),
                      encoding="utf-8") as f:
                return json.load(f), None
        except (FileNotFoundError, ValueError):
            return None, "todos.json illisible (POST /todos d'abord)"

    def _sauver_todos(self, chemin, obj):
        with open(os.path.join(chemin, "todos.json"), "w",
                  encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

    @staticmethod
    def _deadline_moins_2h(checkin_suivant):
        if not checkin_suivant:
            return ""
        txt = str(checkin_suivant).strip()
        try:
            # Accepte date seule (jour même 15h-2h=13h) ou datetime ISO.
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}", txt):
                base = dt.datetime.fromisoformat(txt + "T15:00:00")
            else:
                base = dt.datetime.fromisoformat(txt.replace("Z", "+00:00"))
                if base.tzinfo is not None:
                    base = base.astimezone().replace(tzinfo=None)
            return (base - dt.timedelta(hours=2)).isoformat(timespec="minutes")
        except ValueError:
            return ""

    # --- POST /todos ---
    def todos(self, logement_id, qui="", ref_resa="", checkout="",
              checkin_suivant="", arrivee="", presta_dispo=False,
              sejours_rapproches=False, extras_payes=None):
        if not self._qui_humain(qui):
            return 400, {"erreur": "todos menage = creation HUMAINE "
                                   "(qui != auto/llm/jev)"}
        if not logement_id:
            return 400, {"erreur": "logement_id requis"}
        log = self._log(logement_id)
        jour = dt.date.today().isoformat()
        ref = (ref_resa or checkout or "sans-ref").strip() or "sans-ref"
        slug = re.sub(r"[^a-z0-9]+", "_", ref.lower()).strip("_") or "menage"
        nom = f"{jour}_{slug}_menage"
        dossier = os.path.join(self.state_dir, "menage", logement_id, nom)
        os.makedirs(os.path.join(dossier, "entree"), exist_ok=True)
        os.makedirs(os.path.join(dossier, "sortie"), exist_ok=True)
        # Dispatch : interne défaut, presta si dispo ou séjours rapprochés <6h.
        assigne = ("presta_menage_externe"
                   if (presta_dispo or sejours_rapproches) else "interne")
        deadline = self._deadline_moins_2h(checkin_suivant)
        items = [{"id": c, "coche": False} for c in self.CHECKLIST_MENAGE]
        extras = [str(e) for e in (extras_payes or []) if str(e).strip()]
        if extras and log["extras_upsell"]:
            for e in extras:
                items.append({"id": f"extra_{e}", "coche": False,
                              "source": "extras_upsell"})
        todo = {"logement_id": logement_id, "dossier": nom,
                "ref_resa": ref_resa, "checkout": checkout,
                "checkin_suivant": checkin_suivant, "arrivee": arrivee,
                "assigne": assigne, "deadline": deadline,
                "checklist": items, "photos_entree": [], "photos_sortie": [],
                "pointage_arrivee": None, "pointage_depart": None,
                "duree_presence_min": None, "photos_voyageur_ok": False,
                "statut": "a_faire",
                "regle": "remise en dispo BLOQUEE si preuves manquantes",
                "extras_fusionnes": extras if log["extras_upsell"] else []}
        self._sauver_todos(dossier, todo)
        # Notifs multi-destinataires (todo + log, jamais d'envoi auto) :
        # hôte + intervenant (+ voyageur si état des lieux auto).
        notifs = [{"destinataire": "hote", "canal": "dashboard",
                   "message": f"menage {nom} a faire (deadline {deadline or 'NC'})"},
                  {"destinataire": assigne, "canal": "pwa",
                   "message": f"mission menage {nom} : checklist 7 cases + photos E/S"}]
        if log["etat_lieux_auto"]:
            notifs.append({"destinataire": "voyageur_suivant", "canal": "pwa",
                           "message": "photos entree PWA a deposer (comparatif)"})
        self.log_decision(logement_id, ref, qui, "todo_menage_cree",
                          f"{nom} assigne={assigne} deadline={deadline or 'NC'}"
                          + (f" + {len(extras)} extras" if todo["extras_fusionnes"] else ""))
        return 201, {"logement_id": logement_id, "dossier": nom,
                     "statut": "a_faire", "assigne": assigne,
                     "deadline": deadline, "checklist": [c["id"] for c in items],
                     "notifs": notifs,
                     "comparatif_etat_lieux": log["etat_lieux_auto"],
                     "traca_intervenant_requise": log["traca_intervenants"]}

    # --- GET /todos ---
    def todos_lecture(self, logement_id, dossier=""):
        if dossier:
            chemin, err = self._dossier_menage(logement_id, dossier)
            if err:
                return 404, {"erreur": err}
            todo, err = self._lire_todos(chemin)
            if err:
                return 404, {"erreur": err}
            return 200, {"logement_id": logement_id,
                         "dossier": os.path.basename(chemin),
                         "todos": todo}
        racine = os.path.join(self.state_dir, "menage", logement_id)
        try:
            noms = sorted(os.listdir(racine))
        except FileNotFoundError:
            noms = []
        liste = []
        for nom in noms:
            chemin = os.path.join(racine, nom)
            if os.path.isdir(chemin):
                todo, _ = self._lire_todos(chemin)
                if todo is not None:
                    liste.append({"dossier": nom,
                                  "statut": todo.get("statut"),
                                  "assigne": todo.get("assigne"),
                                  "deadline": todo.get("deadline")})
        return 200, {"logement_id": logement_id, "total": len(liste),
                     "dossiers": liste}

    # --- POST /menage-pointage ---
    def menage_pointage(self, logement_id, dossier, evenement, qui):
        if not self._qui_humain(qui):
            return 400, {"erreur": "pointage menage = geste INTERVENANT "
                                   "(qui != auto/llm/jev)"}
        if evenement not in ("arrivee", "depart"):
            return 400, {"erreur": "evenement = arrivee|depart"}
        chemin, err = self._dossier_menage(logement_id, dossier)
        if err:
            return 404, {"erreur": err}
        todo, err = self._lire_todos(chemin)
        if err:
            return 404, {"erreur": err}
        if todo.get("statut") == "remise_en_dispo":
            return 409, {"erreur": "menage deja cloture (reouverture = hote seul)"}
        ts = utcnow_iso()
        if evenement == "arrivee":
            if todo.get("pointage_arrivee"):
                return 409, {"erreur": "arrivee deja pointee",
                             "arrivee": todo["pointage_arrivee"]}
            todo["pointage_arrivee"] = ts
            todo["pointe_par"] = qui
            todo["statut"] = "en_cours"
        else:
            if not todo.get("pointage_arrivee"):
                return 409, {"erreur": "depart sans arrivee "
                                        "(pointer arrivee d'abord)",
                             "code": "preuves_manquantes"}
            if todo.get("pointage_depart"):
                return 409, {"erreur": "depart deja pointe",
                             "depart": todo["pointage_depart"]}
            todo["pointage_depart"] = ts
            try:
                a = dt.datetime.fromisoformat(todo["pointage_arrivee"])
                b = dt.datetime.fromisoformat(ts)
                todo["duree_presence_min"] = max(
                    0, int((b - a).total_seconds() // 60))
            except ValueError:
                todo["duree_presence_min"] = 0
            todo["statut"] = "pointee"
        self._sauver_todos(chemin, todo)
        self.log_decision(logement_id, os.path.basename(chemin), qui,
                          f"menage_pointage_{evenement}", ts)
        return 200, {"logement_id": logement_id,
                     "dossier": os.path.basename(chemin),
                     "evenement": evenement, "ts": ts,
                     "duree_presence_min": todo.get("duree_presence_min")}

    # --- POST /menage-photo ---
    def menage_photo(self, logement_id, dossier, phase, piece, nom,
                     donnees_base64, qui):
        if not self._qui_humain(qui):
            return 400, {"erreur": "photo menage = geste INTERVENANT "
                                   "(qui != auto/llm/jev)"}
        if phase not in ("entree", "sortie"):
            return 400, {"erreur": "phase = entree|sortie"}
        piece = re.sub(r"[^a-z0-9_-]+", "_",
                       str(piece or "").lower()).strip("_")
        if not piece:
            return 400, {"erreur": "piece requise (ex : salon, sdb, cuisine)"}
        nom_f = os.path.basename(str(nom or ""))
        ext = os.path.splitext(nom_f)[1].lower()
        if ext not in self.EXT_PHOTOS:
            return 400, {"erreur": "photo jpg/png/webp seule"}
        chemin, err = self._dossier_menage(logement_id, dossier)
        if err:
            return 404, {"erreur": err}
        todo, err = self._lire_todos(chemin)
        if err:
            return 404, {"erreur": err}
        if todo.get("statut") == "remise_en_dispo":
            return 409, {"erreur": "menage deja cloture (reouverture = hote seul)"}
        try:
            brut = base64.b64decode(donnees_base64 or "", validate=True)
        except Exception:
            return 400, {"erreur": "donnees_base64 invalide"}
        if not brut:
            return 400, {"erreur": "photo vide"}
        if len(brut) > 8_000_000:
            return 413, {"erreur": "photo trop lourde (>8 Mo)"}
        horodat = utcnow_iso().replace(":", "").replace("+", "")
        cible = re.sub(r"[^a-z0-9_.-]+", "_",
                       f"{piece}_{horodat}_{nom_f}").strip("._") or f"{piece}{ext}"
        if not cible.lower().endswith(ext):
            cible += ext
        with open(os.path.join(chemin, phase, cible), "wb") as f:
            f.write(brut)
        cle = "photos_entree" if phase == "entree" else "photos_sortie"
        todo.setdefault(cle, []).append({"fichier": cible, "piece": piece,
                                         "ts": utcnow_iso(), "par": qui})
        self._sauver_todos(chemin, todo)
        self.log_decision(logement_id, os.path.basename(chemin), qui,
                          f"menage_photo_{phase}",
                          f"{piece}/{cible} ({len(brut)} o)")
        return 201, {"logement_id": logement_id,
                     "dossier": os.path.basename(chemin),
                     "phase": phase, "piece": piece, "fichier": cible,
                     "octets": len(brut)}

    # --- POST /menage-cloture ---
    def menage_cloture(self, logement_id, dossier, checklist=None,
                       photos_voyageur_ok=False, dossier_intervention="",
                       qui=""):
        if not self._qui_humain(qui):
            return 400, {"erreur": "cloture menage = validation HUMAINE "
                                   "(qui != auto/llm/jev)"}
        chemin, err = self._dossier_menage(logement_id, dossier)
        if err:
            return 404, {"erreur": err}
        todo, err = self._lire_todos(chemin)
        if err:
            return 404, {"erreur": err}
        nom = os.path.basename(chemin)
        if todo.get("statut") == "remise_en_dispo":
            return 409, {"erreur": "menage deja cloture",
                         "duree_presence_min": todo.get("duree_presence_min")}
        manquants = []
        if not todo.get("pointage_arrivee"):
            manquants.append("pointage arrivee")
        if not todo.get("pointage_depart"):
            manquants.append("pointage depart")
        ent = todo.get("photos_entree") or []
        sor = todo.get("photos_sortie") or []
        if not ent:
            manquants.append("photos entree (>=1 par piece)")
        if not sor:
            manquants.append("photos sortie (>=1 par piece)")
        sans_sortie = sorted({p.get("piece") for p in ent}
                             - {p.get("piece") for p in sor})
        if sans_sortie:
            manquants.append("photos sortie manquantes pieces : "
                             + ", ".join(sans_sortie))
        # Checklist 7 cases obligatoires (fusion extras incluse si présente).
        cochees = checklist or {}
        cases_manquantes = [c["id"] for c in todo.get("checklist", [])
                            if not cochees.get(c["id"], False)]
        # Comparatif état des lieux voyageur si etat_lieux_auto on.
        log = self._log(logement_id)
        if log["etat_lieux_auto"] and not photos_voyageur_ok:
            manquants.append("photos voyageur E/S (comparatif etat des lieux)")
        # Traça intervenant si on : dossier intervention clôturé exigé.
        if log["traca_intervenants"]:
            if not dossier_intervention:
                manquants.append("dossier intervention cloture (traca on)")
            else:
                ch, err_i = self._dossier(logement_id, dossier_intervention)
                if err_i:
                    manquants.append("dossier intervention inconnu (traca on)")
                else:
                    inter, err_i = self._lire_intervention(ch)
                    if err_i or (inter or {}).get("statut") != "cloturee":
                        manquants.append("intervention non cloturee (traca on)")
        if manquants or cases_manquantes:
            self.log_decision(logement_id, nom, qui, "menage_cloture_bloquee",
                              "; ".join(manquants + cases_manquantes))
            code = ("cases_manquantes" if cases_manquantes and not manquants
                    else "preuves_manquantes")
            return 409, {"erreur": "remise en dispo BLOQUEE : preuves manquantes",
                         "code": code, "manquants": manquants,
                         "cases_manquantes": cases_manquantes}
        todo["checklist_cochee"] = {c["id"]: True
                                    for c in todo.get("checklist", [])}
        todo["photos_voyageur_ok"] = bool(photos_voyageur_ok)
        if dossier_intervention:
            todo["dossier_intervention"] = os.path.basename(
                str(dossier_intervention))
        todo["statut"] = "remise_en_dispo"
        todo["cloturee_par"] = qui
        todo["cloture_le"] = utcnow_iso()
        self._sauver_todos(chemin, todo)
        self.log_decision(logement_id, nom, qui, "menage_remise_en_dispo",
                          f"pointe {todo.get('duree_presence_min')} min")
        return 201, {"logement_id": logement_id, "dossier": nom,
                     "statut": "remise_en_dispo",
                     "duree_presence_min": todo.get("duree_presence_min")}


    def _fiche_mission(self, logement_id, presta, motif, debut, fin, dossier):
        candidats = []
        if self.templates_dir:
            candidats.append(os.path.join(self.templates_dir, "fiche_mission_presta.md"))
        # Convention facturation/copro-wizard : RACINE = custom/<moteur>/ -> ../../docs/templates
        try:
            racine = os.path.normpath(os.path.join(
                os.path.dirname(os.path.abspath(__file__)), "..", ".."))
            candidats.append(os.path.join(racine, "docs", "templates",
                                          "fiche_mission_presta.md"))
        except Exception:
            pass
        # Layout Docker : /opt/lcd/docs/templates (COPY docs/templates/).
        candidats.append("/opt/lcd/docs/templates/fiche_mission_presta.md")
        gabarit = None
        for tpl in candidats:
            try:
                with open(os.path.normpath(tpl), encoding="utf-8") as f:
                    gabarit = f.read()
                break
            except (FileNotFoundError, NotADirectoryError):
                continue
        if gabarit is None:
            gabarit = ("# Mission {{ presta }} — {{ logement }}\n- Motif : {{ motif }}\n"
                       "- Fenetre : {{ debut }} -> {{ fin }}\n- Dossier : {{ dossier }}\n")
        return (gabarit.replace("{{ logement }}", logement_id)
                       .replace("{{ marque }}", "LCD")
                       .replace("{{ presta }}", str(presta.get("id", "")))
                       .replace("{{ motif }}", motif)
                       .replace("{{ debut }}", debut or dt.date.today().isoformat())
                       .replace("{{ fin }}", fin or "")
                       .replace("{{ date }}", dt.date.today().isoformat())
                       .replace("{{ dossier }}", dossier)
                       .replace("{{ tel_urgence }}", "hote (dashboard)"))

    # --- POST /sinistre ---
    def sinistre(self, logement_id, motif, declarant, description, canal="direct", resa=""):
        if not (motif and declarant and description):
            return 400, {"erreur": "motif + declarant + description requis"}
        jour = dt.date.today().isoformat()
        slug = re.sub(r"[^a-z0-9]+", "_", motif.lower()).strip("_") or "sinistre"
        dossier = os.path.join(self.state_dir, "sinistres", logement_id,
                               f"{jour}_{slug}")
        os.makedirs(dossier, exist_ok=True)
        delai_j = self.delais.get(canal, self.delais.get("airbnb", 14))
        echeance = (dt.date.today() + dt.timedelta(days=delai_j)).isoformat()
        fiche = {"date": jour, "logement_id": logement_id, "motif": motif,
                 "declarant": declarant, "description": description,
                 "canal": canal, "resa": resa,
                 "delai_plateforme": ("Airbnb AirCover 14 j ET avant voyageur suivant"
                                      if canal == "airbnb" else
                                      "Booking : info voyageur 48 h via messagerie" if canal == "booking" else
                                      "Vrbo Resolution Center ~14 j" if canal == "vrbo" else
                                      "direct : hold Swikly/Stripe sur justificatifs"),
                 "echeance": echeance,
                 "suivi_caution": "en_cours — JAMAIS de retenue sans justificatifs "
                                  "(photos E/S + facture/devis)",
                 "statut": "ouvert"}
        with open(os.path.join(dossier, "fiche.json"), "w", encoding="utf-8") as f:
            json.dump(fiche, f, ensure_ascii=False, indent=2)
        self.log_decision(logement_id, motif, declarant, "sinistre_ouvert",
                          f"{canal} : echeance {echeance} -> {dossier}")
        return 201, {"dossier": dossier, "fiche": fiche}


class Handler(BaseHTTPRequestHandler):
    engine = None

    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        corps = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def _lire_json(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
        except ValueError:
            n = 0
        if not n:
            return {}, None
        try:
            return json.loads(self.rfile.read(n) or b"{}"), None
        except (ValueError, json.JSONDecodeError):
            return None, "JSON invalide"

    def do_GET(self):
        import urllib.parse
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        eng = self.engine
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/annuaire":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.annuaire(logement_id)
            return self._json(code, obj)
        if url.path == "/intervention":
            logement_id = qs.get("logement_id", [""])[0]
            dossier = qs.get("dossier", [""])[0]
            if not logement_id or not dossier:
                return self._json(400, {"erreur": "logement_id + dossier requis"})
            code, obj = eng.intervention(logement_id, dossier)
            return self._json(code, obj)
        if url.path == "/todos":
            logement_id = qs.get("logement_id", [""])[0]
            dossier = qs.get("dossier", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.todos_lecture(logement_id, dossier)
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        import urllib.parse
        url = urllib.parse.urlparse(self.path)
        p, err = self._lire_json()
        if err:
            return self._json(400, {"erreur": err})
        eng = self.engine
        if url.path == "/dispatch":
            code, obj = eng.dispatch(p.get("logement_id", ""), p.get("metier", ""),
                                     p.get("zone", ""), p.get("motif", ""), p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/mission":
            code, obj = eng.mission(p.get("logement_id", ""), p.get("presta_id", ""),
                                    p.get("motif", ""), p.get("qui", ""),
                                    p.get("debut", ""), p.get("fin", ""))
            return self._json(code, obj)
        if url.path == "/pointage":
            code, obj = eng.pointage(p.get("logement_id", ""), p.get("dossier", ""),
                                     p.get("evenement", ""), p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/photo":
            code, obj = eng.photo(p.get("logement_id", ""), p.get("dossier", ""),
                                  p.get("phase", ""), p.get("piece", ""),
                                  p.get("nom", ""), p.get("donnees_base64", ""),
                                  p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/cloture":
            code, obj = eng.cloture(p.get("logement_id", ""), p.get("dossier", ""),
                                    p.get("temps_declare_min"),
                                    p.get("justificatif", ""), p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/todos":
            code, obj = eng.todos(
                p.get("logement_id", ""), p.get("qui", ""),
                p.get("ref_resa", ""), p.get("checkout", ""),
                p.get("checkin_suivant", ""), p.get("arrivee", ""),
                bool(p.get("presta_dispo", False)),
                bool(p.get("sejours_rapproches", False)),
                p.get("extras_payes", []))
            return self._json(code, obj)
        if url.path == "/menage-pointage":
            code, obj = eng.menage_pointage(p.get("logement_id", ""),
                                            p.get("dossier", ""),
                                            p.get("evenement", ""),
                                            p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/menage-photo":
            code, obj = eng.menage_photo(p.get("logement_id", ""),
                                         p.get("dossier", ""),
                                         p.get("phase", ""),
                                         p.get("piece", ""),
                                         p.get("nom", ""),
                                         p.get("donnees_base64", ""),
                                         p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/menage-cloture":
            code, obj = eng.menage_cloture(
                p.get("logement_id", ""), p.get("dossier", ""),
                p.get("checklist", {}),
                bool(p.get("photos_voyageur_ok", False)),
                p.get("dossier_intervention", ""), p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/sinistre":
            code, obj = eng.sinistre(p.get("logement_id", ""), p.get("motif", ""),
                                     p.get("declarant", ""), p.get("description", ""),
                                     p.get("canal", "direct"), p.get("resa", ""))
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD dispatch prestataires P6-8")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--prestataires", default="")
    ap.add_argument("--zones", default="")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(args.config):
        print(f"config introuvable: {args.config}", file=sys.stderr)
        return 2
    cfg = charger_yaml_plat(args.config)
    cfg["_config_path"] = args.config
    base = os.path.dirname(os.path.abspath(args.config))
    for cle in ("state_dir", "decision_log_dir"):
        val = cfg.get(cle, "")
        if val and not os.path.isabs(val):
            cfg[cle] = os.path.normpath(os.path.join(base, val))
    presta_dir = (args.prestataires or os.environ.get("LCD_PRESTATAIRES_DIR", "")
                  or os.path.normpath(os.path.join(base, "..", "prestataires")))
    zones_yaml = (args.zones or os.environ.get("LCD_ZONES_YAML", "")
                  or os.path.normpath(os.path.join(base, "..", "zones.yaml")))
    eng = Dispatch(cfg, args.logements, presta_dir, zones_yaml)
    if not args.serve:
        print(json.dumps({"motifs": sorted(eng.carte_motifs),
                          "sla_h": eng.sla,
                          "zone_defaut_globale": eng.zone_defaut_globale},
                         ensure_ascii=False))
        return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8096)))
    Handler.engine = eng
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # box/prod : 127.0.0.1 ; lab : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"dispatch :8096 (annuaires {presta_dir})", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
