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
#   POST /menage-intermediaire {logement_id, qui, ref_resa?, arrivee,
#                depart, frequence_j?, heure_pref?, pendant_absence?,
#                presta_dispo?} -> 201 dates certaines (arrivee+N x freq <
#     depart, defaut J+7 si sejour >=10j sans pref, sinon fin_sejour_seul) +
#     dossiers menage/logX via todos() (creation HUMAINE, 400 si auto) +
#     facturation info SURE (offert >=14j si remplissage_max, sinon 60 EUR) +
#     messages voyageur J-1 SURS (jamais de PIN)
#   POST /menage-pointage {logement_id, dossier, evenement, qui}
#   POST /menage-photo {logement_id, dossier, phase: entree|sortie, piece,
#                nom, donnees_base64, qui}
#   POST /menage-cloture {logement_id, dossier, checklist?, photos_voyageur_ok?,
#                dossier_intervention?, qui} -> 409 preuves_manquantes /
#     cases_manquantes ; 201 remise_en_dispo
#   POST /sinistre {logement_id, motif, declarant, description, canal?, resa?}
#   GET  /edl?logement_id=log1&ref_resa=<slug> -> P6-16 : statut EDL voyageur
#     (non_commence / partiel / complet + comparatif entree/sortie par piece)
#   POST /edl-consentement {logement_id, ref_resa, qui, consentement: true,
#                nom_voyageur?} -> 201 consenti (prealable obligatoire, photos
#     du logement seul, jamais de personnes exigees, purge 90 j)
#   POST /edl-photo {logement_id, ref_resa, phase: entree|sortie,
#                piece: salon|cuisine|chambre|sdb|entree, nom, donnees_base64,
#                prise_le?, qui} -> 201 (jpg/png/webp <=8 Mo, horodatage +
#     EXIF conserves, galerie >24 h refusee 422, consentement exige 403)
#   POST /edl-video {logement_id, ref_resa, phase, nom, donnees_base64,
#                duree_s, qui} -> 201 optionnelle (<60 s, mp4/mov/webm <=50 Mo)
#   POST /edl-purge {logement_id, qui} -> 200 dossiers >90 j supprimes
#     (juste apres delai AirCover 14 j, geste HUMAIN seul)
#   POST /objet-trouve {logement_id, qui, description, piece?, ref_resa?,
#                photo_base64?} -> P6-17 : 201 fiche objets/logX/<id> +
#     photo (message voyageur J+0 si ref_resa, geste INTERVENANT seul)
#   GET  /objets?logement_id=log1[&statut=trouve] -> P6-17 : liste fiches
#     (trouve/reclame/envoye/don/stock)
#   POST /objet-reclamer {logement_id, objet_id, qui, ref_resa} -> P6-17 :
#     200 reclame (voyageur/humain, jamais auto)
#   POST /objet-envoyer {logement_id, objet_id, qui, preuve_paiement} ->
#     P6-17 : forfait 15 EUR inviolable, sans preuve -> 402 paiement_requis ;
#     200 envoye (Colissimo, traçé)
#   POST /objet-cloturer {logement_id, objet_id, qui, sort: don|stock} ->
#     P6-17 : non réclamé 30 j (sinon 409 trop_tot) -> 200 don/stock
#   GET  /menage-tarif?logement_id=log1 -> P6-19 : supplément + 10 postes
#     (prorata socle, total == montant) + surcharge saison + alerte inclus
#   POST /menage-cout {logement_id, qui, montant, ref_resa?, dossier?,
#                facture?} -> P6-19 : 201 coût réel rotation (OPEX §12.6)
#   GET  /menage-couts?logement_id=log1 -> P6-19 : moyenne + dérive vs
#     affiché (alerte >10 %) + payload sensor.menage_cout_rotation
#   POST /menage-note {logement_id, qui, note 1-5, ref_resa?, dossier?,
#                commentaire?} -> P6-19 : 201 score qualité (+ alerte temps
#     si pointage dossier écart >20 % vs ~3h)
#   GET  /menage-score?logement_id=log1 -> P6-19 : moyenne + alerte <3,5 +
#     durées pointées vs ~3h
#   GET  /formation?logement_id=log1[&session=<id>] -> P6-22 : programme
#     30 min (5 modules) ou statut session (modules + test départ complet)
#   POST /formation-session {logement_id, qui, presta} -> P6-22 : 201
#     session rotation blanche (drill 1x/trimestre §14)
#   POST /formation-module {logement_id, qui, session, module} -> P6-22 :
#     200 module coché 1-tap (idempotent)
#   POST /formation-valider {logement_id, qui, session, dossier_menage} ->
#     P6-22 : 200 formation_validee (5 modules + dossier remise_en_dispo,
#     sinon 409 manquants) — attestée par l'hôte, drill trimestriel
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
            "extras_upsell": False, "mode_gestion": "equilibre",
            "menage_montant": 110, "menage_facturation": "supplement"}
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
            elif k == "mode_gestion_defaut":
                # Sous pricing: (indent 6) — P6-13 facturation menage offert/60.
                info["mode_gestion"] = (str(_scalaire(v) or "equilibre")
                                        .strip().lower() or "equilibre")
            elif k == "montant":
                # Sous menage: (indent 6) — P6-19 supplément voyageur.
                try:
                    info["menage_montant"] = int(float(
                        str(_scalaire(v) or 110)))
                except ValueError:
                    pass
            elif k == "facturation":
                # Sous menage: supplement | inclus_nuit (P6-19 §12.2-ter).
                val = str(_scalaire(v) or "supplement").strip().lower()
                if val in ("supplement", "inclus_nuit"):
                    info["menage_facturation"] = val
    return info


def logement_existe(path, logement_id):
    """Bloc `  <id>:` présent dans logements.yaml (P6-13 : 404 logX)."""
    if not logement_id:
        return False
    try:
        with open(path, encoding="utf-8") as f:
            for brute in f:
                ligne = brute.split("#", 1)[0].rstrip("\n")
                if re.match(r"^  \w[\w-]*:\s*$", ligne):
                    if ligne.strip().rstrip(":") == logement_id:
                        return True
    except FileNotFoundError:
        return False
    return False


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

    # --- P6-16 §5.6 : état des lieux auto voyageur (parcours PWA entrée+sortie) ---
    # Lien J-1/J-arrivée + QR accueil -> consentement explicite à l'arrivée
    # (photos du logement seul, jamais de personnes exigées, mention annonce +
    # règlement + QR) -> photos horodatées obligatoires par pièce (grand angle
    # + points sensibles : plans de travail, sols, sanitaires, écrans/TV) +
    # vidéo <60 s optionnelle -> `/config/etat_lieux/logX/<resa>/{entree,sortie}/`
    # (box ; ici state/etat_lieux/, runtime gitignoré) + EXIF/horodatage
    # conservés (anti-fraude : refus galerie >24 h, rappel si manquantes) +
    # comparatif avant/après dashboard + clôture ménage BLOQUÉE si EDL
    # commencé mais incomplet + purge auto 90 j (juste après AirCover 14 j).
    EDL_PIECES = ("salon", "cuisine", "chambre", "sdb", "entree")
    EXT_VIDEOS = (".mp4", ".mov", ".webm")
    EDL_PHOTO_MAX_O = 8_000_000
    EDL_VIDEO_MAX_O = 50_000_000
    EDL_VIDEO_MAX_S = 60
    EDL_GALERIE_H = 24
    EDL_PURGE_J = 90
    REF_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")

    # --- P6-17 §5.7-bis : objets trouvés (photo + fiche + 15 € forfait) ---
    # Ménage/presta trouve -> photo + fiche `objets/logX/<id>.json` (box :
    # state/objets/, runtime gitignoré) -> message voyageur J+0 (si ref_resa
    # connue) + envoi Colissimo forfait 15 € (preuve Stripe exigée, jamais
    # d'envoi sans paiement) ; non réclamé 30 j -> don/stock (traçé).
    OBJET_FORFAIT_EUR = 15
    OBJET_DELAI_J = 30
    OBJET_SORTS = ("don", "stock")

    # --- P6-19 §12.2-ter : supplément ménage + suivi coût + score qualité ---
    # Supplément = ligne séparée fixe/rotation (coût FIXE : mêmes draps/SDB/
    # sols quelle que soit la durée — jamais lissé sauf inclus_nuit + alerte
    # durée min <4). Socle log1 65 m² : 110 € en 10 postes (prix Côte d'Azur
    # 2025-2026) ; autres montants = prorata socle arrondi, MO en solde
    # (défaut sûr : total == montant, à calibrer au wizard §1.6.4).
    # Suivi : sensor.menage_cout_rotation (coût réel saisi -> OPEX §12.6,
    # dérive >10 % -> file), sensor.menage_duree (pointage vs ~3h, écart
    # >20 % -> justificatif), score 1-5 (<3,5 -> alerte). Surcharge saison
    # +20 € juin-sept : info contrat presta, absorbée OU répercutée (humain,
    # jamais auto).
    MENAGE_POSTES_SOCLE = (
        ("deplacement", "Déplacement + logistique", 5),
        ("sortie_sale", "Sortie sale — vidage et aération", 1),
        ("sdb_wc", "SDB + WC — désinfection complète", 2),
        ("cuisine", "Cuisine — remise à neuf", 2),
        ("chambres_sejour", "Chambres + séjour — dépoussiérage et lits", 1),
        ("sols", "Sols — aspiration + serpillière", 1),
        ("linge", "Linge + blanchisserie (pressing)", 25),
        ("consommables", "Consommables voyageur — recharge", 8),
        ("controle", "Contrôle qualité + photos + signalement", 0),
    )
    MENAGE_MO_LABEL = "Main-d'œuvre ~3h (solde)"
    MENAGE_SOCLE_TOTAL = 110
    MENAGE_DUREE_ATTENDUE_MIN = 180  # ~3h rotation (§12.2-ter postes 2-6,9)
    MENAGE_ECART_TEMPS = 0.20
    MENAGE_ALERTE_DERIVE = 0.10
    MENAGE_SCORE_SEUIL = 3.5
    SURCHARGE_SAISON_MOIS = (6, 7, 8, 9)
    SURCHARGE_SAISON_EUR = 20

    # --- P6-22 §14 : formation ménage 30 min + test départ complet ---
    # N'importe quel remplaçant tient une rotation sans appeler l'hôte :
    # programme 30 min en 5 modules 1-tap (pointage, photos E/S, checklist,
    # comparatif EDL, clôture) + rotation blanche = test départ complet
    # (todo + photos + comparatif + clôture OK) attesté par l'hôte.
    # Drill 1x/trimestre + version papier datée. Stockage runtime
    # state/formation/logX.json (gitignoré, comme menage-couts/notes).
    FORMATION_MODULES = (
        ("pointage", "Pointage arrivée/départ PWA (QR + bouton)", 5),
        ("photos", "Photos entrée/sortie par pièce (même cadrage)", 10),
        ("checklist", "Checklist 7 cases + consommables/kit", 5),
        ("edl_comparatif", "Comparatif état des lieux voyageur", 5),
        ("cloture", "Clôture + remise en dispo (preuves exigées)", 5),
    )
    FORMATION_DUREE_MIN = 30

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

    # --- POST /menage-intermediaire (P6-13 §5.6 + §5.7-quater) ---
    # Menage a date certaine : pref memoire (menage_frequence_j /
    # menage_heure_pref / menage_pendant_absence) OU defaut J+7 si sejour >=10j
    # sans pref. Dossiers menage/logX/<date>_menage_intermediaire via todos()
    # existant (creation HUMAINE, deadline arrivee+N heure pref, pendant
    # absence si oui). Facturation info SURE : offert des 14j si
    # mode_gestion remplissage_max, sinon 60 EUR (extras
    # menage_intermediaire_7j). Message voyageur J-1 SURE (jamais de PIN).
    def menage_intermediaire(self, logement_id, qui="", ref_resa="",
                             arrivee="", depart="", frequence_j=0,
                             heure_pref="11:00", pendant_absence="non",
                             presta_dispo=False):
        if not self._qui_humain(qui):
            return 400, {"erreur": "menage intermediaire = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        if not logement_id:
            return 400, {"erreur": "logement_id requis"}
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not arrivee or not depart:
            return 400, {"erreur": "arrivee + depart (AAAA-MM-JJ) requis"}
        try:
            j_arr = dt.date.fromisoformat(str(arrivee).strip()[:10])
            j_dep = dt.date.fromisoformat(str(depart).strip()[:10])
        except ValueError:
            return 400, {"erreur": "arrivee/depart AAAA-MM-JJ invalides"}
        duree = (j_dep - j_arr).days
        if duree < 0:
            return 400, {"erreur": "depart avant arrivee"}
        try:
            freq = int(str(frequence_j or "0"))
        except ValueError:
            freq = 0
        freq = max(0, min(30, freq))
        if freq <= 0:
            # Defaut J+7 : sejour >=10j sans pref (§5.6) ; sinon fin de
            # sejour seul (aucune date certaine).
            if duree < 10:
                return 200, {"logement_id": logement_id,
                             "statut": "fin_sejour_seul",
                             "dates": [],
                             "detail": "sejour <10j sans pref : menage fin "
                                       "de sejour seul"}
            freq = 7
            mode = "defaut_j7"
        else:
            mode = "preference"
        heure = str(heure_pref or "11:00").strip()
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", heure):
            heure = "11:00"
        absence = (str(pendant_absence or "non").strip().lower()
                   in ("oui", "yes", "true", "1"))
        log = self._log(logement_id)
        mode_gestion = str(log.get("mode_gestion", "equilibre") or
                           "equilibre").strip().lower()
        # Dates certaines : arrivee+N x frequence, strictement avant depart.
        dates = []
        n = freq
        while n < duree:
            dates.append((j_arr + dt.timedelta(days=n)).isoformat())
            n += freq
        # Facturation info SURE : offert des 14j si remplissage_max, sinon 60.
        if duree >= 14 and mode_gestion == "remplissage_max":
            facturation = {"mode": "offert",
                           "detail": "sejour >=14j + remplissage_max"}
        else:
            facturation = {"mode": "a_facturer", "montant_eur": 60,
                           "ligne": "menage_intermediaire_7j",
                           "detail": "60 EUR par passage (cout presta 45)"}
        # Dossiers via todos() existant : deadline = date certaine heure pref
        # (checkout/checkin fictifs du passage, ref suffixee _miNj).
        dossiers = []
        ref = (ref_resa or "sans-ref").strip() or "sans-ref"
        for i, d in enumerate(dates, 1):
            code, todo = self.todos(
                logement_id, qui, f"{ref}_mi{i}",
                checkout=f"{d}T{heure}:00",
                checkin_suivant=f"{d}T{heure}:00",
                arrivee=str(arrivee), presta_dispo=bool(presta_dispo),
                sejours_rapproches=False,
                extras_payes=["menage_intermediaire_7j"])
            if code != 201:
                return code, todo
            dossiers.append({"date": d, "heure": heure,
                             "dossier": todo["dossier"],
                             "assigne": todo["assigne"]})
        # Message voyageur J-1 SURE (jamais de PIN ni secret).
        msgs = [{"destinataire": "voyageur", "canal": "pwa",
                 "quand": f"{d} J-1",
                 "message": (f"menage intermediaire {d} {heure}"
                             + (" pendant votre absence"
                                if absence else "")
                             + f" ({facturation['mode']})")}
                for d in dates]
        self.log_decision(logement_id, ref, qui, "menage_intermediaire",
                          f"{len(dates)} date(s) {mode} freq={freq}j "
                          f"{heure}{' absence' if absence else ''} "
                          f"{facturation['mode']}")
        return 201, {"logement_id": logement_id,
                     "statut": "planifie",
                     "mode": mode, "frequence_j": freq,
                     "heure": heure,
                     "pendant_absence": "oui" if absence else "non",
                     "dates": dates, "dossiers": dossiers,
                     "facturation": facturation,
                     "messages_voyageur_j1": msgs,
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
        # P6-16 : si le voyageur a COMMENCÉ son EDL PWA (dossier etat_lieux
        # pour la ref du todo), la clôture exige l'EDL complet — l'attestation
        # humaine seule ne suffit plus (comparatif dashboard). Sans dossier
        # EDL : comportement legacy (attestation humaine, comparatif ménage).
        if log["etat_lieux_auto"] and photos_voyageur_ok:
            ref_todo = str(todo.get("ref_resa", "") or "").strip()
            if ref_todo and self.REF_RE.fullmatch(ref_todo):
                ch_edl = os.path.join(self.state_dir, "etat_lieux",
                                      logement_id, ref_todo)
                if os.path.isdir(ch_edl):
                    edl_v, _ = self._lire_edl(ch_edl)
                    comp_v = self._edl_completude(edl_v)
                    if not comp_v["complet"]:
                        manque = sorted(set(
                            comp_v["pieces_manquantes_entree"])
                            | set(comp_v["pieces_manquantes_sortie"]))
                        manquants.append("etat des lieux voyageur incomplet "
                                         "(EDL : "
                                         + (", ".join(manque) or "sortie")
                                         + ")")
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

    # --- P6-16 §5.6 : état des lieux auto voyageur (PWA entrée+sortie) ---
    def _dossier_edl(self, logement_id, ref_resa, mkdir=False):
        """Chemin `state/etat_lieux/logX/<ref>/` (box : /config/etat_lieux/,
        runtime gitignoré). Ref slug seule (traversée bloquée)."""
        ref = str(ref_resa or "").strip()
        if not ref or not self.REF_RE.fullmatch(ref) or ".." in ref:
            return None, "ref_resa slug seule (traversée bloquée)"
        chemin = os.path.join(self.state_dir, "etat_lieux", logement_id, ref)
        if mkdir:
            os.makedirs(os.path.join(chemin, "entree"), exist_ok=True)
            os.makedirs(os.path.join(chemin, "sortie"), exist_ok=True)
            return chemin, None
        if not os.path.isdir(chemin):
            return None, (f"etat des lieux inconnu : etat_lieux/{logement_id}/{ref} "
                           "(POST /edl-consentement d'abord)")
        return chemin, None

    def _lire_edl(self, chemin):
        try:
            with open(os.path.join(chemin, "edl.json"), encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}, None
        except (FileNotFoundError, ValueError):
            return {"consentement": False, "consenti_par": "",
                    "consenti_le": "", "nom_voyageur": "",
                    "photos_entree": [], "photos_sortie": [],
                    "videos": []}, None

    def _sauver_edl(self, chemin, obj):
        obj["maj_le"] = utcnow_iso()
        with open(os.path.join(chemin, "edl.json"), "w",
                  encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)

    @staticmethod
    def _pieces_couvertes(photos):
        return sorted({p.get("piece") for p in (photos or [])
                       if p.get("piece")})

    def _edl_completude(self, edl):
        ent = set(self._pieces_couvertes(edl.get("photos_entree")))
        sor = set(self._pieces_couvertes(edl.get("photos_sortie")))
        # Ordre socle EDL_PIECES (checklist PWA), jamais alphabétique.
        manq_ent = [p for p in self.EDL_PIECES if p not in ent]
        manq_sor = [p for p in self.EDL_PIECES if p not in sor]
        comparatif = [{p: ("presente" if (p in ent and p in sor)
                           else ("sortie_manquante" if p in ent
                                 else ("entree_manquante" if p in sor
                                       else "manquante")))}
                      for p in self.EDL_PIECES]
        complet = not manq_ent and not manq_sor
        return {"entree_complete": not manq_ent, "sortie_complete": not manq_sor,
                "complet": complet, "pieces_manquantes_entree": manq_ent,
                "pieces_manquantes_sortie": manq_sor,
                "comparatif": comparatif}

    # --- POST /edl-consentement ---
    def edl_consentement(self, logement_id, ref_resa, qui, consentement,
                         nom_voyageur=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "consentement EDL = geste VOYAGEUR/HUMAIN "
                                   "(qui != auto/llm/jev)"}
        chemin, err = self._dossier_edl(logement_id, ref_resa, mkdir=True)
        if err:
            return 400, {"erreur": err}
        acc = (str(consentement).strip().lower() in ("true", "1", "oui", "yes")
               if not isinstance(consentement, bool) else bool(consentement))
        edl, _ = self._lire_edl(chemin)
        edl["consentement"] = acc
        edl["consenti_par"] = qui
        edl["consenti_le"] = utcnow_iso()
        if str(nom_voyageur or "").strip():
            edl["nom_voyageur"] = str(nom_voyageur).strip()[:100]
        self._sauver_edl(chemin, edl)
        self.log_decision(logement_id, str(ref_resa).strip(), qui,
                          "edl_consentement",
                          "consenti (photos logement seul, purge 90 j)" if acc
                          else "refuse (EDL manuel menage seul)")
        if not acc:
            return 200, {"logement_id": logement_id,
                         "ref_resa": str(ref_resa).strip(),
                         "statut": "refuse",
                         "detail": "EDL manuel menage seul (Companion App)"}
        return 201, {"logement_id": logement_id,
                     "ref_resa": str(ref_resa).strip(), "statut": "consenti",
                     "purge_j": self.EDL_PURGE_J,
                     "pieces_attendues": list(self.EDL_PIECES)}

    def _edl_verifier_depot(self, logement_id, ref_resa, qui, phase, piece,
                            nom, donnees_base64, prise_le, exts, max_o):
        """Garde-fous communs photo/vidéo EDL (consentement, slug, phase,
        pièce socle, format, taille, galerie 24 h). Retourne
        (chemin, edl, brut, prise_iso, nom_fichier) ou (None, (code, obj))."""
        if not logement_existe(self.logements_yaml, logement_id):
            return None, (404, {"erreur": f"logement inconnu: {logement_id}"})
        if not self._qui_humain(qui):
            return None, (400, {"erreur": "depot EDL = geste VOYAGEUR "
                                           "(qui != auto/llm/jev)"})
        log = self._log(logement_id)
        if not log["etat_lieux_auto"]:
            return None, (503, {"erreur": "etat_lieux_auto: off "
                                          "(EDL manuel menage seul)",
                                "code": "edl_off"})
        chemin, err = self._dossier_edl(logement_id, ref_resa)
        if err:
            # Jamais consenti (pas de dossier) -> 403 préalable, pas 404 :
            # le voyageur doit passer par /edl-consentement d'abord.
            if "inconnu" in err:
                return None, (403, {"erreur": "consentement EDL requis "
                                               "(POST /edl-consentement)",
                                    "code": "consentement_requis"})
            return None, (400, {"erreur": err})
        edl, _ = self._lire_edl(chemin)
        if not edl.get("consentement"):
            return None, (403, {"erreur": "consentement EDL requis "
                                           "(POST /edl-consentement)",
                                "code": "consentement_requis"})
        if phase not in ("entree", "sortie"):
            return None, (400, {"erreur": "phase = entree|sortie"})
        if piece is not None:
            piece = re.sub(r"[^a-z0-9_-]+", "_",
                           str(piece or "").lower()).strip("_")
            if piece not in self.EDL_PIECES:
                return None, (400, {"erreur": "piece parmi : "
                                              + ", ".join(self.EDL_PIECES),
                                    "code": "piece_inconnue"})
        nom_f = os.path.basename(str(nom or ""))
        ext = os.path.splitext(nom_f)[1].lower()
        if ext not in exts:
            return None, (400, {"erreur": "format refuse "
                                           f"({','.join(exts)} seuls)"})
        try:
            brut = base64.b64decode(donnees_base64 or "", validate=True)
        except Exception:
            return None, (400, {"erreur": "donnees_base64 invalide"})
        if not brut:
            return None, (400, {"erreur": "fichier vide"})
        if len(brut) > max_o:
            return None, (413, {"erreur": f"fichier trop lourd (>{max_o} o)"})
        # Anti-fraude galerie : prise_le >24 h -> refusé (EXIF box sur box,
        # ici champ PWA horodaté ; absent = photo directe à l'instant).
        prise_iso = ""
        if str(prise_le or "").strip():
            try:
                prise = dt.datetime.fromisoformat(
                    str(prise_le).strip().replace("Z", "+00:00"))
                if prise.tzinfo is None:
                    prise = prise.replace(tzinfo=dt.timezone.utc)
                ecart_h = ((dt.datetime.now(dt.timezone.utc) - prise)
                           .total_seconds() / 3600.0)
                if ecart_h < -1:
                    return None, (400, {"erreur": "prise_le future "
                                                  "(horloge PWA ?)"})
                if ecart_h > self.EDL_GALERIE_H:
                    return None, (422, {"erreur": "galerie >24 h refusee "
                                                  "(reprendre la photo)",
                                        "code": "galerie_refusee"})
                prise_iso = prise.isoformat(timespec="seconds")
            except ValueError:
                return None, (400, {"erreur": "prise_le ISO AAAA-MM-JJTHH:MM"})
        else:
            prise_iso = utcnow_iso()
        return (chemin, edl, brut, prise_iso, piece, nom_f, ext), None

    # --- POST /edl-photo ---
    def edl_photo(self, logement_id, ref_resa, phase, piece, nom,
                  donnees_base64, qui, prise_le=""):
        res, err = self._edl_verifier_depot(
            logement_id, ref_resa, qui, phase, piece, nom, donnees_base64,
            prise_le, self.EXT_PHOTOS, self.EDL_PHOTO_MAX_O)
        if err:
            return err
        chemin, edl, brut, prise_iso, piece, nom_f, ext = res
        horodat = utcnow_iso().replace(":", "").replace("+", "")
        cible = re.sub(r"[^a-z0-9_.-]+", "_",
                       f"{piece}_{horodat}_{nom_f}").strip("._") or f"{piece}{ext}"
        if not cible.lower().endswith(ext):
            cible += ext
        with open(os.path.join(chemin, phase, cible), "wb") as f:
            f.write(brut)
        cle = "photos_entree" if phase == "entree" else "photos_sortie"
        edl.setdefault(cle, []).append({"fichier": cible, "piece": piece,
                                        "prise_le": prise_iso,
                                        "recu_le": utcnow_iso(),
                                        "octets": len(brut), "par": qui})
        self._sauver_edl(chemin, edl)
        comp = self._edl_completude(edl)
        self.log_decision(logement_id, str(ref_resa).strip(), qui,
                          f"edl_photo_{phase}",
                          f"{piece}/{cible} ({len(brut)} o, prise {prise_iso})")
        return 201, {"logement_id": logement_id,
                     "ref_resa": str(ref_resa).strip(),
                     "phase": phase, "piece": piece, "fichier": cible,
                     "octets": len(brut), "prise_le": prise_iso,
                     "completude": comp}

    # --- POST /edl-video ---
    def edl_video(self, logement_id, ref_resa, phase, nom, donnees_base64,
                  duree_s, qui, prise_le=""):
        try:
            duree = int(float(str(duree_s or "")))
        except ValueError:
            return 400, {"erreur": "duree_s (secondes, <= 60) requise"}
        if duree < 1 or duree > self.EDL_VIDEO_MAX_S:
            return 422, {"erreur": "video <60 s seule (tour complet)",
                         "code": "video_trop_longue"}
        res, err = self._edl_verifier_depot(
            logement_id, ref_resa, qui, phase, None, nom, donnees_base64,
            prise_le, self.EXT_VIDEOS, self.EDL_VIDEO_MAX_O)
        if err:
            return err
        chemin, edl, brut, prise_iso, _, nom_f, ext = res
        horodat = utcnow_iso().replace(":", "").replace("+", "")
        cible = re.sub(r"[^a-z0-9_.-]+", "_",
                       f"video_{phase}_{horodat}_{nom_f}").strip("._")
        if not cible.lower().endswith(ext):
            cible += ext
        with open(os.path.join(chemin, phase, cible), "wb") as f:
            f.write(brut)
        edl.setdefault("videos", []).append({"fichier": cible, "phase": phase,
                                              "duree_s": duree,
                                              "prise_le": prise_iso,
                                              "recu_le": utcnow_iso(),
                                              "octets": len(brut),
                                              "par": qui})
        self._sauver_edl(chemin, edl)
        self.log_decision(logement_id, str(ref_resa).strip(), qui,
                          f"edl_video_{phase}",
                          f"{cible} ({duree} s, {len(brut)} o)")
        return 201, {"logement_id": logement_id,
                     "ref_resa": str(ref_resa).strip(),
                     "phase": phase, "fichier": cible, "duree_s": duree,
                     "octets": len(brut)}

    # --- GET /edl ---
    def edl_statut(self, logement_id, ref_resa):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ref = str(ref_resa or "").strip()
        if not ref:
            return 400, {"erreur": "ref_resa requise (slug)"}
        chemin, err = self._dossier_edl(logement_id, ref)
        if err:
            if "inconnu" in err:
                return 200, {"statut": "non_commence",
                             "logement_id": logement_id, "ref_resa": ref,
                             "pieces_attendues": list(self.EDL_PIECES),
                             "consentement": False,
                             "jamais_bloquant": True}
            return 400, {"erreur": err}
        edl, _ = self._lire_edl(chemin)
        comp = self._edl_completude(edl)
        statut = ("complet" if comp["complet"]
                  else ("partiel" if (edl.get("photos_entree")
                                      or edl.get("photos_sortie"))
                        else "consenti"))
        return 200, {"statut": statut, "logement_id": logement_id,
                     "ref_resa": ref, "consentement": bool(
                         edl.get("consentement")),
                     "nom_voyageur": edl.get("nom_voyageur", ""),
                     "photos_entree": len(edl.get("photos_entree") or []),
                     "photos_sortie": len(edl.get("photos_sortie") or []),
                     "videos": len(edl.get("videos") or []),
                     "pieces_entree": self._pieces_couvertes(
                         edl.get("photos_entree")),
                     "pieces_sortie": self._pieces_couvertes(
                         edl.get("photos_sortie")),
                     "pieces_manquantes_entree": comp[
                         "pieces_manquantes_entree"],
                     "pieces_manquantes_sortie": comp[
                         "pieces_manquantes_sortie"],
                     "comparatif": comp["comparatif"],
                     "purge_j": self.EDL_PURGE_J,
                     "jamais_bloquant": True}

    # --- POST /edl-purge ---
    def edl_purge(self, logement_id, qui):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "purge EDL = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        base = os.path.join(self.state_dir, "etat_lieux", logement_id)
        purgees, restantes = 0, 0
        try:
            refs = os.listdir(base)
        except FileNotFoundError:
            refs = []
        limite = (dt.datetime.now(dt.timezone.utc)
                  - dt.timedelta(days=self.EDL_PURGE_J))
        for ref in refs:
            chemin = os.path.join(base, ref)
            if not os.path.isdir(chemin):
                continue
            edl, _ = self._lire_edl(chemin)
            dates = [p.get("recu_le", "") for p in
                     ((edl.get("photos_entree") or [])
                      + (edl.get("photos_sortie") or []))]
            try:
                recent = max(dt.datetime.fromisoformat(
                    d.replace("Z", "+00:00")) for d in dates if d)
            except ValueError:
                try:
                    recent = dt.datetime.fromtimestamp(
                        os.path.getmtime(
                            os.path.join(chemin, "edl.json")),
                        tz=dt.timezone.utc)
                except OSError:
                    continue
            if recent < limite:
                import shutil
                shutil.rmtree(chemin, ignore_errors=True)
                purgees += 1
            else:
                restantes += 1
        self.log_decision(logement_id, "edl-purge", qui, "edl_purge",
                          f"purge 90 j : {purgees} purgees, {restantes} restantes")
        return 200, {"statut": "purge", "purgees": purgees,
                     "restantes": restantes}

    # --- P6-17 §5.7-bis : objets trouvés ---
    def _dossier_objets(self, logement_id):
        return os.path.join(self.state_dir, "objets", logement_id)

    def _objet_id_valide(self, objet_id):
        brut = str(objet_id or "").strip()
        if not brut or not self.REF_RE.fullmatch(brut) or ".." in brut:
            return ""
        return brut

    def _lire_objet(self, logement_id, objet_id):
        oid = self._objet_id_valide(objet_id)
        if not oid:
            return None, "objet_id slug seul (traversée bloquée)"
        try:
            with open(os.path.join(self._dossier_objets(logement_id),
                                   f"{oid}.json"), encoding="utf-8") as f:
                data = json.load(f)
            return (data if isinstance(data, dict) else {}), None
        except (FileNotFoundError, ValueError):
            return None, (f"objet inconnu : objets/{logement_id}/{oid} "
                           "(POST /objet-trouve d'abord)")

    def _sauver_objet(self, logement_id, objet_id, fiche):
        os.makedirs(self._dossier_objets(logement_id), exist_ok=True)
        with open(os.path.join(self._dossier_objets(logement_id),
                               f"{objet_id}.json"), "w",
                  encoding="utf-8") as f:
            json.dump(fiche, f, ensure_ascii=False, indent=2)

    # --- POST /objet-trouve ---
    def objet_trouve(self, logement_id, qui, description, piece="",
                     ref_resa="", photo_base64=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "objet trouve = geste INTERVENANT "
                                   "(qui != auto/llm/jev)"}
        desc = str(description or "").strip()[:500]
        if len(desc) < 3:
            return 400, {"erreur": "description requise (>= 3 caractères)"}
        ref = str(ref_resa or "").strip()
        if ref and (not self.REF_RE.fullmatch(ref) or ".." in ref):
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        oid = ("OBJ-" + dt.date.today().isoformat() + "-"
               + utcnow_iso().replace(":", "").replace("+", "")[-6:])
        os.makedirs(os.path.join(self._dossier_objets(logement_id), oid),
                    exist_ok=True)
        photo_f = ""
        if str(photo_base64 or "").strip():
            try:
                brut = base64.b64decode(photo_base64, validate=True)
            except Exception:
                return 400, {"erreur": "photo_base64 invalide"}
            if not brut:
                return 400, {"erreur": "photo vide"}
            if len(brut) > self.EDL_PHOTO_MAX_O:
                return 413, {"erreur": "photo trop lourde (>8 Mo)"}
            photo_f = "objet.jpg"
            with open(os.path.join(self._dossier_objets(logement_id), oid,
                                   photo_f), "wb") as f:
                f.write(brut)
        fiche = {"objet_id": oid, "logement_id": logement_id,
                 "description": desc,
                 "piece": re.sub(r"[^a-z0-9_-]+", "_",
                                 str(piece or "").lower()).strip("_")[:30],
                 "ref_resa": ref, "trouve_par": qui,
                 "trouve_le": utcnow_iso(), "photo": photo_f,
                 "statut": "trouve",
                 "forfait_eur": self.OBJET_FORFAIT_EUR,
                 "message_j0": ("voyageur prevenu J+0 (ref connue)" if ref
                                else "sans ref : attente reclamation")}
        self._sauver_objet(logement_id, oid, fiche)
        self.log_decision(logement_id, oid, qui, "objet_trouve",
                          f"{desc[:60]} (forfait {self.OBJET_FORFAIT_EUR} EUR)")
        return 201, {"objet_id": oid, "logement_id": logement_id,
                     "statut": "trouve",
                     "forfait_eur": self.OBJET_FORFAIT_EUR,
                     "message_j0": fiche["message_j0"]}

    # --- GET /objets ---
    def objets(self, logement_id, statut=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        base = self._dossier_objets(logement_id)
        try:
            noms = os.listdir(base)
        except FileNotFoundError:
            noms = []
        fiches = []
        for nom in sorted(noms):
            if not nom.endswith(".json"):
                continue
            fiche, err = self._lire_objet(
                logement_id, nom[:-len(".json")])
            if err or not isinstance(fiche, dict):
                continue
            if statut and fiche.get("statut") != statut:
                continue
            fiches.append({"objet_id": fiche.get("objet_id"),
                           "description": fiche.get("description"),
                           "statut": fiche.get("statut"),
                           "trouve_le": fiche.get("trouve_le"),
                           "forfait_eur": fiche.get("forfait_eur")})
        if statut and statut not in ("trouve", "reclame", "envoye", "don",
                                     "stock"):
            return 400, {"erreur": "statut parmi : trouve/reclame/envoye/"
                                   "don/stock"}
        return 200, {"logement_id": logement_id, "objets": fiches,
                     "total": len(fiches)}

    # --- POST /objet-reclamer ---
    def objet_reclamer(self, logement_id, objet_id, qui, ref_resa):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "reclamation = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        fiche, err = self._lire_objet(logement_id, objet_id)
        if err:
            return 404, {"erreur": err}
        if fiche.get("statut") != "trouve":
            return 409, {"erreur": "objet déjà traité "
                                   f"({fiche.get('statut')})",
                         "code": "objet_indisponible"}
        ref = str(ref_resa or "").strip()
        if not ref or not self.REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        fiche["statut"] = "reclame"
        fiche["reclame_par"] = qui
        fiche["reclame_ref"] = ref
        fiche["reclame_le"] = utcnow_iso()
        self._sauver_objet(logement_id, fiche["objet_id"], fiche)
        self.log_decision(logement_id, fiche["objet_id"], qui,
                          "objet_reclame", f"ref {ref} (envoi 15 EUR à régler)")
        return 200, {"objet_id": fiche["objet_id"], "statut": "reclame",
                     "forfait_eur": self.OBJET_FORFAIT_EUR,
                     "action": "POST /objet-envoyer (preuve 15 EUR) pour expédier"}

    # --- POST /objet-envoyer ---
    def objet_envoyer(self, logement_id, objet_id, qui, preuve_paiement=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "envoi = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        fiche, err = self._lire_objet(logement_id, objet_id)
        if err:
            return 404, {"erreur": err}
        if fiche.get("statut") != "reclame":
            return 409, {"erreur": "envoi exige statut reclame "
                                   f"(actuel : {fiche.get('statut')})",
                         "code": "reclamation_requise"}
        if not str(preuve_paiement or "").strip():
            return 402, {"erreur": "preuve 15 EUR requise (Stripe)",
                         "code": "paiement_requis",
                         "forfait_eur": self.OBJET_FORFAIT_EUR}
        fiche["statut"] = "envoye"
        fiche["envoye_par"] = qui
        fiche["envoye_le"] = utcnow_iso()
        fiche["forfait_eur"] = self.OBJET_FORFAIT_EUR
        self._sauver_objet(logement_id, fiche["objet_id"], fiche)
        self.log_decision(logement_id, fiche["objet_id"], qui,
                          "objet_envoye",
                          f"Colissimo forfait {self.OBJET_FORFAIT_EUR} EUR")
        return 200, {"objet_id": fiche["objet_id"], "statut": "envoye",
                     "forfait_eur": self.OBJET_FORFAIT_EUR}

    # --- POST /objet-cloturer ---
    def objet_cloturer(self, logement_id, objet_id, qui, sort=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "cloture = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        fiche, err = self._lire_objet(logement_id, objet_id)
        if err:
            return 404, {"erreur": err}
        if fiche.get("statut") != "trouve":
            return 409, {"erreur": "cloture don/stock exige statut trouve "
                                   f"(actuel : {fiche.get('statut')})",
                         "code": "objet_indisponible"}
        sort = str(sort or "").strip().lower()
        if sort not in self.OBJET_SORTS:
            return 400, {"erreur": "sort = don|stock"}
        try:
            trouve = dt.datetime.fromisoformat(
                str(fiche.get("trouve_le", "")).replace("Z", "+00:00"))
        except ValueError:
            return 409, {"erreur": "date trouve illisible (jamais de "
                                   "cloture aveugle)",
                         "code": "trop_tot"}
        if trouve.tzinfo is None:
            trouve = trouve.replace(tzinfo=dt.timezone.utc)
        age_j = (dt.datetime.now(dt.timezone.utc) - trouve).days
        if age_j < self.OBJET_DELAI_J:
            return 409, {"erreur": "non réclamé 30 j requis "
                                   f"({age_j} j écoulés)",
                         "code": "trop_tot", "age_j": age_j}
        fiche["statut"] = sort
        fiche["cloture_par"] = qui
        fiche["cloture_le"] = utcnow_iso()
        self._sauver_objet(logement_id, fiche["objet_id"], fiche)
        self.log_decision(logement_id, fiche["objet_id"], qui,
                          f"objet_{sort}", f"non réclamé 30 j ({age_j} j)")
        return 200, {"objet_id": fiche["objet_id"], "statut": sort,
                     "age_j": age_j}

    # --- P6-19 §12.2-ter : supplément ménage + suivi + score ---
    def _postes_menage(self, montant):
        """10 postes prorata socle (MO en solde, total == montant)."""
        facteur = float(montant) / float(self.MENAGE_SOCLE_TOTAL)
        postes = [{"id": pid, "label": label,
                   "eur": round(eur * facteur, 2)}
                  for pid, label, eur in self.MENAGE_POSTES_SOCLE]
        solde = round(float(montant) - sum(p["eur"] for p in postes), 2)
        postes.append({"id": "main_oeuvre", "label": self.MENAGE_MO_LABEL,
                       "eur": solde})
        return postes

    # --- GET /menage-tarif ---
    def menage_tarif(self, logement_id):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        log = self._log(logement_id)
        montant = int(log.get("menage_montant", 110) or 110)
        facturation = log.get("menage_facturation", "supplement")
        postes = self._postes_menage(montant)
        return 200, {"logement_id": logement_id, "montant": montant,
                     "facturation": facturation,
                     "affichage": ("ligne separee /rotation (recommande)"
                                   if facturation == "supplement"
                                   else f"lisse +{round(montant / 4)} EUR/nuit"
                                        " (duree min >=4 requise)"),
                     "postes": postes,
                     "total_verifie": round(sum(p["eur"] for p in postes),
                                            2),
                     "surcharge_saison": {
                         "mois": list(self.SURCHARGE_SAISON_MOIS),
                         "montant_eur": self.SURCHARGE_SAISON_EUR,
                         "regle": "absorbee OU repercutee (humain, "
                                  "jamais auto)"},
                     "alerte_inclus": (facturation == "inclus_nuit")}

    def _lire_couts(self, logement_id):
        return self._lire_json_obj(
            os.path.join(self.state_dir, "menage-couts", logement_id,
                         "couts.json"), [])

    def _sauver_couts(self, logement_id, lignes):
        base = os.path.join(self.state_dir, "menage-couts", logement_id)
        os.makedirs(base, exist_ok=True)
        with open(os.path.join(base, "couts.json"), "w",
                  encoding="utf-8") as f:
            json.dump(lignes, f, ensure_ascii=False, indent=2)

    def _lire_json_obj(self, chemin, defaut):
        try:
            with open(chemin, encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, defaut.__class__) else defaut
        except (FileNotFoundError, ValueError):
            return defaut

    # --- POST /menage-cout : coût réel rotation (montant saisi -> OPEX) ---
    def menage_cout(self, logement_id, qui, montant, ref_resa="",
                    dossier="", facture=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "cout rotation = saisie HUMAINE "
                                   "(qui != auto/llm/jev)"}
        try:
            cout = float(str(montant))
        except (TypeError, ValueError):
            return 400, {"erreur": "montant > 0 requis"}
        if not (cout > 0):
            return 400, {"erreur": "montant > 0 requis"}
        ref = str(ref_resa or dossier or "").strip()[:80]
        lignes = self._lire_couts(logement_id)
        lignes.append({"ref": ref, "montant": round(cout, 2),
                       "facture": str(facture or "")[:120],
                       "date": dt.date.today().isoformat(),
                       "saisi_par": qui, "saisi_le": utcnow_iso()})
        self._sauver_couts(logement_id, lignes)
        affiche = int(self._log(logement_id).get("menage_montant", 110)
                      or 110)
        derive = round((cout - affiche) / affiche, 4) if affiche else 0.0
        self.log_decision(logement_id, ref or "cout-rotation", qui,
                          "menage_cout_saisi",
                          f"{cout} EUR (affiche {affiche}, derive {derive})")
        return 201, {"logement_id": logement_id, "montant": round(cout, 2),
                     "rotations_suivies": len(lignes),
                     "derive_rotation": derive}

    # --- GET /menage-couts : moyenne + dérive + payload sensor ---
    def menage_couts(self, logement_id):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        affiche = int(self._log(logement_id).get("menage_montant", 110)
                      or 110)
        lignes = self._lire_couts(logement_id)
        montants = [float(l.get("montant", 0) or 0) for l in lignes]
        moyen = round(sum(montants) / len(montants), 2) if montants else 0.0
        derive = (round((moyen - affiche) / affiche, 4)
                  if (montants and affiche) else 0.0)
        alerte = (len(montants) >= 2
                  and derive > self.MENAGE_ALERTE_DERIVE)
        return 200, {"logement_id": logement_id, "rotations": len(lignes),
                     "cout_moyen_rotation": moyen,
                     "montant_affiche": affiche, "derive_pct": derive,
                     "alerte_derive": alerte,
                     "sensor": {"montant_affiche": affiche,
                                "cout_moyen_rotation": moyen,
                                "derive_pct": derive,
                                "alerte_derive": alerte}}

    def _lire_notes(self, logement_id):
        return self._lire_json_obj(
            os.path.join(self.state_dir, "menage-notes", logement_id,
                         "notes.json"), [])

    def _sauver_notes(self, logement_id, lignes):
        base = os.path.join(self.state_dir, "menage-notes", logement_id)
        os.makedirs(base, exist_ok=True)
        with open(os.path.join(base, "notes.json"), "w",
                  encoding="utf-8") as f:
            json.dump(lignes, f, ensure_ascii=False, indent=2)

    # --- POST /menage-note : score qualité 1-5 (+ alerte temps vs ~3h) ---
    def menage_note(self, logement_id, qui, note, ref_resa="",
                    dossier="", commentaire=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "note qualite = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        try:
            note_i = int(float(str(note)))
        except (TypeError, ValueError):
            return 400, {"erreur": "note entière 1-5 requise"}
        if note_i < 1 or note_i > 5:
            return 400, {"erreur": "note entière 1-5 requise"}
        alerte_temps, duree = False, None
        nom = str(dossier or "").strip()
        if nom:
            chemin, err = self._dossier_menage(logement_id, nom)
            if err:
                return 404, {"erreur": err}
            todo, err = self._lire_todos(chemin)
            if err:
                return 404, {"erreur": err}
            duree = todo.get("duree_presence_min")
            if isinstance(duree, (int, float)):
                ecart = abs(duree - self.MENAGE_DUREE_ATTENDUE_MIN) \
                    / self.MENAGE_DUREE_ATTENDUE_MIN
                alerte_temps = ecart > self.MENAGE_ECART_TEMPS
        lignes = self._lire_notes(logement_id)
        lignes.append({"ref": str(ref_resa or nom or "").strip()[:80],
                       "note": note_i,
                       "commentaire": str(commentaire or "")[:500],
                       "dossier": os.path.basename(nom) if nom else "",
                       "duree_presence_min": duree,
                       "alerte_temps": alerte_temps,
                       "date": dt.date.today().isoformat(),
                       "note_par": qui, "note_le": utcnow_iso()})
        self._sauver_notes(logement_id, lignes)
        self.log_decision(logement_id, os.path.basename(nom) if nom
                          else str(ref_resa or "note").strip()[:80], qui,
                          "menage_note",
                          f"score {note_i}/5"
                          + (" (ecart temps >20 %)" if alerte_temps else ""))
        return 201, {"logement_id": logement_id, "note": note_i,
                     "notes_total": len(lignes),
                     "duree_presence_min": duree,
                     "alerte_temps": alerte_temps}

    # --- GET /menage-score : moyenne + alertes qualité/temps ---
    def menage_score(self, logement_id):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        lignes = self._lire_notes(logement_id)
        notes = [int(n.get("note", 0) or 0) for n in lignes
                 if 1 <= int(n.get("note", 0) or 0) <= 5]
        moyenne = round(sum(notes) / len(notes), 2) if notes else None
        base = os.path.join(self.state_dir, "menage", logement_id)
        try:
            dossiers = os.listdir(base)
        except FileNotFoundError:
            dossiers = []
        durees, ecarts = [], 0
        for nom in dossiers:
            todo, err = self._lire_todos(os.path.join(base, nom))
            if err:
                continue
            duree = todo.get("duree_presence_min")
            if isinstance(duree, (int, float)):
                durees.append(duree)
                if abs(duree - self.MENAGE_DUREE_ATTENDUE_MIN) \
                        / self.MENAGE_DUREE_ATTENDUE_MIN \
                        > self.MENAGE_ECART_TEMPS:
                    ecarts += 1
        duree_moy = round(sum(durees) / len(durees), 1) if durees else None
        return 200, {"logement_id": logement_id, "notes_total": len(notes),
                     "score_moyen": moyenne,
                     "alerte_qualite": (moyenne is not None
                                        and len(notes) >= 3
                                        and moyenne < self.MENAGE_SCORE_SEUIL),
                     "rotations_pointees": len(durees),
                     "duree_moyenne_min": duree_moy,
                     "duree_attendue_min": self.MENAGE_DUREE_ATTENDUE_MIN,
                     "ecarts_temps": ecarts}

    # --- P6-22 §14 : formation 30 min + test départ complet ---
    def _lire_formation(self, logement_id):
        return self._lire_json_obj(
            os.path.join(self.state_dir, "formation", logement_id,
                         "sessions.json"), {})

    def _sauver_formation(self, logement_id, sessions):
        base = os.path.join(self.state_dir, "formation", logement_id)
        os.makedirs(base, exist_ok=True)
        with open(os.path.join(base, "sessions.json"), "w",
                  encoding="utf-8") as f:
            json.dump(sessions, f, ensure_ascii=False, indent=2)

    # --- GET /formation : programme ou statut session ---
    def formation(self, logement_id, session=""):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        modules = [{"id": mid, "label": label, "duree_min": duree}
                   for mid, label, duree in self.FORMATION_MODULES]
        if not str(session or "").strip():
            return 200, {"logement_id": logement_id,
                         "programme_30min": modules,
                         "duree_totale_min": self.FORMATION_DUREE_MIN,
                         "drill": "1x/trimestre (rotation blanche) + papier "
                                  "daté (§14)"}
        sid = str(session).strip()
        if not self.REF_RE.fullmatch(sid) or ".." in sid:
            return 400, {"erreur": "session slug seule (traversée bloquée)"}
        sessions = self._lire_formation(logement_id)
        dossier = sessions.get(sid)
        if not dossier:
            return 404, {"erreur": f"session inconnue : {sid} "
                                   "(POST /formation-session d'abord)"}
        coches = [m for m in [x[0] for x in self.FORMATION_MODULES]
                  if dossier.get("modules", {}).get(m)]
        return 200, {"logement_id": logement_id, "session": sid,
                     "presta": dossier.get("presta"),
                     "statut": dossier.get("statut"),
                     "modules_coches": coches,
                     "modules_manquants": [
                         m for m in [x[0] for x in self.FORMATION_MODULES]
                         if m not in coches],
                     "dossier_menage": dossier.get("dossier_menage", ""),
                     "validee_le": dossier.get("validee_le", "")}

    # --- POST /formation-session : rotation blanche (drill trimestriel) ---
    def formation_session(self, logement_id, qui, presta):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "session formation = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        presta = re.sub(r"[^a-z0-9_-]+", "_",
                        str(presta or "").lower()).strip("_")
        if not presta:
            return 400, {"erreur": "presta requis (slug nominatif)"}
        sessions = self._lire_formation(logement_id)
        sid = (f"SES-{dt.date.today().isoformat()}-"
               f"{len(sessions) + 1:02d}")
        sessions[sid] = {"presta": presta, "statut": "en_cours",
                         "modules": {}, "dossier_menage": "",
                         "ouverte_par": qui,
                         "ouverte_le": utcnow_iso(), "validee_le": ""}
        self._sauver_formation(logement_id, sessions)
        self.log_decision(logement_id, sid, qui, "formation_session",
                          f"rotation blanche ouverte ({presta})")
        return 201, {"logement_id": logement_id, "session": sid,
                     "presta": presta, "statut": "en_cours",
                     "modules": [m[0] for m in self.FORMATION_MODULES]}

    # --- POST /formation-module : coche 1-tap (idempotent) ---
    def formation_module(self, logement_id, qui, session, module):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "module formation = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        sid = str(session or "").strip()
        if not sid or not self.REF_RE.fullmatch(sid) or ".." in sid:
            return 400, {"erreur": "session slug seule (traversée bloquée)"}
        mod = str(module or "").strip().lower()
        attendus = [m[0] for m in self.FORMATION_MODULES]
        if mod not in attendus:
            return 400, {"erreur": "module parmi : "
                                   + ", ".join(attendus)}
        sessions = self._lire_formation(logement_id)
        dossier = sessions.get(sid)
        if not dossier:
            return 404, {"erreur": f"session inconnue : {sid}"}
        if dossier.get("statut") == "formation_validee":
            return 409, {"erreur": "session déjà validée "
                                   "(nouvelle session pour drill suivant)",
                         "code": "session_cloturee"}
        deja = bool(dossier.get("modules", {}).get(mod))
        dossier.setdefault("modules", {})[mod] = {"par": qui,
                                                  "le": utcnow_iso()}
        sessions[sid] = dossier
        self._sauver_formation(logement_id, sessions)
        self.log_decision(logement_id, sid, qui, "formation_module",
                          f"module {mod} coché")
        return 200, {"logement_id": logement_id, "session": sid,
                     "module": mod,
                     "statut": "deja_coche" if deja else "coche"}

    # --- POST /formation-valider : 5 modules + dossier remise_en_dispo ---
    def formation_valider(self, logement_id, qui, session, dossier_menage):
        if not logement_existe(self.logements_yaml, logement_id):
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "validation formation = attestation HOTE "
                                   "(qui != auto/llm/jev)"}
        sid = str(session or "").strip()
        if not sid or not self.REF_RE.fullmatch(sid) or ".." in sid:
            return 400, {"erreur": "session slug seule (traversée bloquée)"}
        sessions = self._lire_formation(logement_id)
        dossier = sessions.get(sid)
        if not dossier:
            return 404, {"erreur": f"session inconnue : {sid}"}
        if dossier.get("statut") == "formation_validee":
            return 200, {"statut": "deja_validee", "session": sid,
                         "logement_id": logement_id}
        manquants = [m for m in [x[0] for x in self.FORMATION_MODULES]
                     if not dossier.get("modules", {}).get(m)]
        chemin, err = self._dossier_menage(logement_id, dossier_menage)
        todo = None
        if not err:
            todo, err = self._lire_todos(chemin)
        manq_dossier = ""
        if err or not todo or todo.get("statut") != "remise_en_dispo":
            manq_dossier = ("dossier menage non cloture "
                            "(test depart complet exige)")
        if manquants or manq_dossier:
            self.log_decision(logement_id, sid, qui,
                              "formation_validation_bloquee",
                              "; ".join(manquants
                                        + ([manq_dossier] if manq_dossier
                                           else [])))
            return 409, {"erreur": "formation incomplète : test départ "
                                   "complet exigé",
                         "code": "formation_incomplete",
                         "modules_manquants": manquants,
                         "dossier_menage_ok": not manq_dossier}
        dossier["statut"] = "formation_validee"
        dossier["dossier_menage"] = os.path.basename(chemin)
        dossier["validee_par"] = qui
        dossier["validee_le"] = utcnow_iso()
        sessions[sid] = dossier
        self._sauver_formation(logement_id, sessions)
        self.log_decision(logement_id, sid, qui, "formation_validee",
                          f"{dossier.get('presta')} : 5 modules + "
                          f"{os.path.basename(chemin)} OK")
        return 200, {"statut": "formation_validee", "session": sid,
                     "logement_id": logement_id,
                     "presta": dossier.get("presta"),
                     "dossier_menage": os.path.basename(chemin)}


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
        if url.path == "/edl":
            # P6-16 §5.6 : statut EDL voyageur (non_commence/partiel/complet).
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.edl_statut(logement_id,
                                       qs.get("ref_resa", [""])[0])
            return self._json(code, obj)
        if url.path == "/objets":
            # P6-17 §5.7-bis : liste objets trouvés (filtre statut opt).
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.objets(logement_id,
                                   qs.get("statut", [""])[0])
            return self._json(code, obj)
        if url.path == "/menage-tarif":
            # P6-19 §12.2-ter : supplément + 10 postes + surcharge saison.
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.menage_tarif(logement_id)
            return self._json(code, obj)
        if url.path == "/menage-couts":
            # P6-19 : moyenne + dérive + payload sensor.
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.menage_couts(logement_id)
            return self._json(code, obj)
        if url.path == "/menage-score":
            # P6-19 : moyenne qualité + durées vs ~3h.
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.menage_score(logement_id)
            return self._json(code, obj)
        if url.path == "/formation":
            # P6-22 §14 : programme 30 min ou statut session.
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.formation(logement_id,
                                      qs.get("session", [""])[0])
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
        if url.path == "/menage-intermediaire":
            code, obj = eng.menage_intermediaire(
                p.get("logement_id", ""), p.get("qui", ""),
                p.get("ref_resa", ""), p.get("arrivee", ""),
                p.get("depart", ""), p.get("frequence_j", 0),
                p.get("heure_pref", "11:00"),
                p.get("pendant_absence", "non"),
                bool(p.get("presta_dispo", False)))
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
        if url.path == "/edl-consentement":
            # P6-16 §5.6 : consentement explicite arrivée (préalable photos).
            if not (p.get("logement_id") and p.get("ref_resa")
                    and p.get("qui") is not None):
                return self._json(
                    400, {"erreur": "logement_id, ref_resa, qui requis"})
            code, obj = eng.edl_consentement(
                p["logement_id"], p["ref_resa"], p["qui"],
                p.get("consentement", False), p.get("nom_voyageur", ""))
            return self._json(code, obj)
        if url.path == "/edl-photo":
            # P6-16 §5.6 : photo horodatée par pièce (consentement + 24 h).
            if not (p.get("logement_id") and p.get("ref_resa")
                    and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, ref_resa, qui requis"})
            code, obj = eng.edl_photo(
                p["logement_id"], p["ref_resa"], p.get("phase", ""),
                p.get("piece", ""), p.get("nom", ""),
                p.get("donnees_base64", ""), p["qui"],
                p.get("prise_le", ""))
            return self._json(code, obj)
        if url.path == "/edl-video":
            # P6-16 §5.6 : vidéo optionnelle <60 s (tour complet).
            if not (p.get("logement_id") and p.get("ref_resa")
                    and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, ref_resa, qui requis"})
            code, obj = eng.edl_video(
                p["logement_id"], p["ref_resa"], p.get("phase", ""),
                p.get("nom", ""), p.get("donnees_base64", ""),
                p.get("duree_s", ""), p["qui"], p.get("prise_le", ""))
            return self._json(code, obj)
        if url.path == "/edl-purge":
            # P6-16 §5.6 : purge 90 j (geste HUMAIN seul).
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            code, obj = eng.edl_purge(p["logement_id"], p["qui"])
            return self._json(code, obj)
        if url.path == "/objet-trouve":
            # P6-17 §5.7-bis : fiche objet trouvé (geste INTERVENANT seul).
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            if not p.get("description"):
                return self._json(
                    400, {"erreur": "description requise"})
            code, obj = eng.objet_trouve(
                p["logement_id"], p["qui"], p["description"],
                p.get("piece", ""), p.get("ref_resa", ""),
                p.get("photo_base64", ""))
            return self._json(code, obj)
        if url.path == "/objet-reclamer":
            # P6-17 §5.7-bis : réclamation voyageur/humain.
            if not (p.get("logement_id") and p.get("objet_id")
                    and p.get("qui") and p.get("ref_resa")):
                return self._json(
                    400, {"erreur": "logement_id, objet_id, qui, ref_resa "
                                    "requis"})
            code, obj = eng.objet_reclamer(
                p["logement_id"], p["objet_id"], p["qui"],
                p["ref_resa"])
            return self._json(code, obj)
        if url.path == "/objet-envoyer":
            # P6-17 §5.7-bis : envoi Colissimo forfait 15 € (preuve exigée).
            if not (p.get("logement_id") and p.get("objet_id")
                    and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, objet_id, qui requis"})
            code, obj = eng.objet_envoyer(
                p["logement_id"], p["objet_id"], p["qui"],
                p.get("preuve_paiement", ""))
            return self._json(code, obj)
        if url.path == "/objet-cloturer":
            # P6-17 §5.7-bis : don/stock après 30 j non réclamé.
            if not (p.get("logement_id") and p.get("objet_id")
                    and p.get("qui") and p.get("sort")):
                return self._json(
                    400, {"erreur": "logement_id, objet_id, qui, sort requis"})
            code, obj = eng.objet_cloturer(
                p["logement_id"], p["objet_id"], p["qui"], p["sort"])
            return self._json(code, obj)
        if url.path == "/menage-cout":
            # P6-19 §12.2-ter : coût réel rotation (saisie HUMAINE).
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            if p.get("montant") is None:
                return self._json(400, {"erreur": "montant > 0 requis"})
            code, obj = eng.menage_cout(
                p["logement_id"], p["qui"], p["montant"],
                p.get("ref_resa", ""), p.get("dossier", ""),
                p.get("facture", ""))
            return self._json(code, obj)
        if url.path == "/menage-note":
            # P6-19 : score qualité 1-5 (geste HUMAIN seul).
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            if p.get("note") is None:
                return self._json(400, {"erreur": "note 1-5 requise"})
            code, obj = eng.menage_note(
                p["logement_id"], p["qui"], p["note"],
                p.get("ref_resa", ""), p.get("dossier", ""),
                p.get("commentaire", ""))
            return self._json(code, obj)
        if url.path == "/formation-session":
            # P6-22 §14 : rotation blanche (geste HUMAIN seul).
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            if not p.get("presta"):
                return self._json(400, {"erreur": "presta requis"})
            code, obj = eng.formation_session(
                p["logement_id"], p["qui"], p["presta"])
            return self._json(code, obj)
        if url.path == "/formation-module":
            # P6-22 §14 : module coché 1-tap (idempotent).
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("session") and p.get("module")):
                return self._json(
                    400, {"erreur": "logement_id, qui, session, module "
                                    "requis"})
            code, obj = eng.formation_module(
                p["logement_id"], p["qui"], p["session"], p["module"])
            return self._json(code, obj)
        if url.path == "/formation-valider":
            # P6-22 : attestation HOTE (modules + dossier clôturé).
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("session")):
                return self._json(
                    400, {"erreur": "logement_id, qui, session requis"})
            if not p.get("dossier_menage"):
                return self._json(
                    400, {"erreur": "dossier_menage requis (test depart)"})
            code, obj = eng.formation_valider(
                p["logement_id"], p["qui"], p["session"],
                p["dossier_menage"])
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
