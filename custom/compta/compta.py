#!/usr/bin/env python3
# custom/compta/compta.py — compta auto P6-18 (§12.6).
# 0 € : stdlib seule. LXC/box dédié (même réseau que 8090-8099). Port :8100.
#
# Le système DOCUMENTE et ALERTE, il ne décide JAMAIS (bascule micro→réel,
# classement, amortissements = décision humaine + comptable, traçée JSONL).
#
# 1. Ingestion : facture (photo/scan/PDF déjà OCRisé côté PWA/hôte — Tesseract
#    0 € sur box, texte_ocr fourni ici) -> catégorisation déterministe
#    (fournisseur + TTC/HT/TVA + logement + rubrique) -> écriture brouillon +
#    confiance affichée ; si confiance < seuil (0.7) -> file de validation
#    humaine (dashboard, 1-tap). Montants TOUJOURS reçus, JAMAIS inventés.
# 2. Rapprochement payouts : exports CSV OTA (payouts) + relevé banque (lignes)
#    -> matching auto résa↔paiement ; écart >2 % OU orpheline >7 j -> file +
#    alerte (jamais d'écriture auto en compta).
# 3. Simulateur micro vs réel : base micro (abattement 30 % non classé / 50 %
#    classé) vs base réel (CA − charges − amortissements) -> recommandation
#    à valider par le comptable (jamais d'option auto).
# 4. Jauges : plafonds 15 000 € / 77 700 € + compteur 120 j résidence
#    principale + alertes 80 % / 100 %.
# 5. Clôture mensuelle : le 5 du mois suivant (jamais avant) -> récap par
#    logement + archive horodatée (dossier docs/parc/<annee>/ sur box).
#
# Règles (verrouillées en code) :
#   - `compta_auto: off` -> ingestion 503 (saisie manuelle dashboard) ;
#     finances/simulateur/clôture restent dispo (mêmes jauges, sans ingestion).
#   - écritures = geste humain (`qui` != auto/llm/jev/moteur-*) ;
#   - jamais de discrimination (nombres fournis, jamais générés) ;
#   - pièces conservées 10 ans (délai fiscal) chiffrées hors site avec backups ;
#   - logement_id/facture_id/objet = slug seul, traversée bloquée.
#
# Contrats :
#   GET  /health -> {"ok": true}
#   POST /facture {logement_id, qui, montant_ttc, fournisseur?, texte_ocr?,
#                tva?, date?, rubrique?} -> 201 {facture_id, rubrique,
#     confiance, statut: brouillon|brouillon_a_valider, ht}
#   GET  /factures?logement_id=log1[&statut=brouillon][&annee=2026]
#   POST /facture-valider {logement_id, facture_id, qui, rubrique?} -> 200
#   POST /payout {logement_id, qui, canal, montant, date, ref_resa?,
#                commission?, nuits?} -> 201 {payout_id, net}
#   POST /releve {logement_id, qui, annee?, lignes[{date, libelle, montant}]}
#     -> 200 {rapproches, file[]} (écart >2 % / orpheline >7 j)
#   GET  /rapprochement?logement_id=log1[&annee=2026]
#   GET  /finances?logement_id=log1&annee=2026[&classement=non_classe]
#   GET  /simulateur?logement_id=log1&annee=2026[&classement=non_classe]
#                [&amortissement=0]
#   POST /cloture {logement_id, qui, annee, mois} -> 201 (le 5 suivant,
#     sinon 409 trop_tot) / 200 deja_cloturee
#
# Usage : python3 compta.py --config config.yaml --logements ../logements.yaml
#   [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND.

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI_AUTO = ("auto", "llm", "jev", "moteur-direct", "moteur-dispatch",
            "moteur-caution", "")
SLUG_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")

RUBRIQUES = ("hardware", "menage", "commission", "assurance", "energie",
             "taxe", "accueil", "extras_ca", "partenariat", "divers")
MOTS_RUBRIQUE = {
    "hardware": ("nodon", "slzb", "nuki", "shelly", "aqara", "frient",
                 "sonoff", "nous", "broadlink", "beelink", "raspberry",
                 "eaton", "onduleur", "esp32", "capteur", "materiel",
                 "hardware", "box", "tablette", "serrure", "vanne"),
    "menage": ("menage", "ménage", "linge", "blanchisserie", "pressing",
               "draps", "nettoyage"),
    "commission": ("commission", "airbnb", "booking", "abritel", "expedia",
                   "stripe", "swikly", "payout"),
    "assurance": ("assurance", "rc pro", "rc_pro", "pno", "mrh", "gmn",
                  "allianz", "axa"),
    "energie": ("enedis", "edf", "engie", "electricite", "électricité",
                "kwh", "eau", "veolia", "suez", "gaz", "grdf"),
    "taxe": ("taxe", "sejour", "séjour", "cfe", "impot", "impôt", "tva ",
             "urssaf"),
    "accueil": ("intermarche", "intermarché", "carrefour", "courses",
                "cafe", "café", "biscuits", "accueil", "bienvenue"),
    "extras_ca": ("extra", "minibar", "petit-dej", "petit dej", "transfert",
                 "vtc", "kit bebe", "kit bébé", "plage"),
    "partenariat": ("partenariat", "affiliation", "apporteur", "traiteur",
                    "massage", "cowork"),
}
CANAUX = ("direct", "airbnb", "booking", "abritel", "expedia")
CLASSEMENTS = ("non_classe", "classe_1_5")


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
    """Parseur YAML plat (niveau 0) — même convention que les autres moteurs."""
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
    """Bloc logement : existe + flag compta_auto (scan indenté, cf. dispatch)."""
    info = {"existe": False, "compta_auto": False}
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
            if dans_bloc:
                info["existe"] = True
            continue
        if dans_bloc and (ligne.startswith("    ") or ligne.startswith("\t")):
            if ":" not in ligne:
                continue
            k, v = ligne.strip().split(":", 1)
            if k.strip() == "compta_auto":
                info["compta_auto"] = _scalaire(v) is True
    return info


def categoriser(fournisseur, texte_ocr):
    """Rubrique déterministe par mots-clés (fournisseur + texte OCR Tesseract
    box). Aucun match -> divers. Score partiel pour la confiance."""
    bas = f"{fournisseur or ''} {texte_ocr or ''}".lower()
    for rubrique in RUBRIQUES:
        if any(m in bas for m in MOTS_RUBRIQUE.get(rubrique, ())):
            return rubrique, True
    return "divers", False


class Compta:
    def __init__(self, cfg, logements_yaml):
        self.cfg = cfg
        self.logements_yaml = logements_yaml
        self.state_dir = (os.environ.get("LCD_STATE_DIR")
                          or cfg.get("state_dir", "./state"))
        self.decision_dir = (os.environ.get("LCD_DECISION_LOG_DIR")
                             or cfg.get("decision_log_dir", "./state"))
        self.seuil_confiance = float(cfg.get("seuil_confiance", 0.7))
        self.seuil_ecart = float(cfg.get("seuil_ecart", 0.02))
        self.delai_orpheline = int(cfg.get("delai_orpheline_j", 7))
        self.plafonds = {
            "non_classe": float(cfg.get("plafond_micro_non_classe", 15000)),
            "classe_1_5": float(cfg.get("plafond_micro_classe", 77700)),
        }
        self.alerte_jauge = float(cfg.get("alerte_jauge", 0.8))
        self.plafond_nuits = int(cfg.get("plafond_nuits_principale", 120))
        self.jour_cloture = int(cfg.get("jour_cloture", 5))

    # --- helpers ---
    @staticmethod
    def _qui_humain(qui):
        return bool(qui) and str(qui).strip().lower() not in QUI_AUTO

    def _log(self, logement_id):
        return lire_logement(self.logements_yaml, logement_id)

    def log_decision(self, logement_id, ref, qui, quoi, montant, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": "direct",
                 "commission": None, "net_hote": montant, "motif": motif}
        os.makedirs(self.decision_dir, exist_ok=True)
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")

    def _dir_annee(self, logement_id, annee):
        chemin = os.path.join(self.state_dir, "compta", logement_id,
                              str(annee))
        os.makedirs(chemin, exist_ok=True)
        return chemin

    def _lire_json(self, chemin, defaut):
        try:
            with open(chemin, encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, defaut.__class__) else defaut
        except (FileNotFoundError, ValueError):
            return defaut

    def _ecrire_json(self, chemin, obj):
        tmp = str(chemin) + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False, indent=2)
        os.replace(tmp, chemin)

    @staticmethod
    def _date_valide(val):
        try:
            return dt.date.fromisoformat(str(val or "")[:10])
        except ValueError:
            return None

    # --- POST /facture : ingestion + catégorisation + confiance ---
    def facture(self, logement_id, qui, montant_ttc, fournisseur="",
                texte_ocr="", tva=0, date="", rubrique=""):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not log["compta_auto"]:
            return 503, {"code": "compta_off",
                         "erreur": "compta_auto: off (saisie manuelle "
                                   "dashboard)"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "ingestion = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        try:
            ttc = float(str(montant_ttc))
        except (TypeError, ValueError):
            return 422, {"erreur": "montant_ttc requis (jamais inventé)",
                         "code": "montant_requis"}
        if not (ttc > 0):
            return 422, {"erreur": "montant_ttc > 0 requis (jamais inventé)",
                         "code": "montant_requis"}
        try:
            tva_m = float(str(tva or 0))
        except (TypeError, ValueError):
            return 400, {"erreur": "tva = montant >= 0"}
        if tva_m < 0 or tva_m > ttc:
            return 400, {"erreur": "tva entre 0 et montant_ttc"}
        rub = str(rubrique or "").strip().lower()
        rub_explicite = bool(rub)
        if rub and rub not in RUBRIQUES:
            return 400, {"erreur": "rubrique parmi : "
                                   + ", ".join(RUBRIQUES)}
        auto, match_kw = (categoriser(fournisseur, texte_ocr)
                          if not rub else (rub, False))
        rubrique_f = rub or auto
        jour = self._date_valide(date) or dt.date.today()
        confiance = 0.5
        if len(str(fournisseur or "").strip()) >= 3:
            confiance += 0.15
        if self._date_valide(date):
            confiance += 0.1
        if rub_explicite:
            confiance += 0.1
        elif match_kw:
            confiance += 0.05
        if len(str(texte_ocr or "")) >= 20:
            confiance += 0.1
        confiance = round(min(confiance, 0.95), 2)
        statut = ("brouillon" if confiance >= self.seuil_confiance
                  else "brouillon_a_valider")
        annee = jour.year
        dossier = self._dir_annee(logement_id, annee)
        factures = self._lire_json(os.path.join(dossier, "factures.json"),
                                   {})
        fid = f"FAC-{jour.strftime('%Y%m%d')}-{len(factures) + 1:03d}"
        fiche = {"facture_id": fid, "logement_id": logement_id,
                 "fournisseur": str(fournisseur or "")[:120],
                 "montant_ttc": round(ttc, 2),
                 "tva": round(tva_m, 2), "ht": round(ttc - tva_m, 2),
                 "date": jour.isoformat(), "rubrique": rubrique_f,
                 "rubrique_auto": (not rub_explicite),
                 "confiance": confiance, "statut": statut,
                 "piece_ocr": bool(str(texte_ocr or "").strip()),
                 "ingere_par": qui, "ingere_le": utcnow_iso()}
        factures[fid] = fiche
        self._ecrire_json(os.path.join(dossier, "factures.json"), factures)
        self.log_decision(logement_id, fid, qui, "compta",
                          round(ttc, 2),
                          f"facture {statut} ({rubrique_f}, "
                          f"confiance {confiance})")
        return 201, {"facture_id": fid, "logement_id": logement_id,
                     "rubrique": rubrique_f, "confiance": confiance,
                     "statut": statut, "ht": fiche["ht"],
                     "file_validation": statut == "brouillon_a_valider"}

    # --- GET /factures ---
    def factures(self, logement_id, statut="", annee=""):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        try:
            an = int(str(annee)) if str(annee or "").strip() else \
                dt.date.today().year
        except ValueError:
            return 400, {"erreur": "annee AAAA"}
        if statut and statut not in ("brouillon", "brouillon_a_valider",
                                     "validee"):
            return 400, {"erreur": "statut parmi : brouillon/"
                                   "brouillon_a_valider/validee"}
        dossier = os.path.join(self.state_dir, "compta", logement_id,
                               str(an))
        toutes = self._lire_json(os.path.join(dossier, "factures.json"), {})
        fiches = [f for f in toutes.values()
                  if not statut or f.get("statut") == statut]
        fiches.sort(key=lambda f: f.get("facture_id", ""))
        leger = [{k: f.get(k) for k in
                  ("facture_id", "fournisseur", "montant_ttc", "rubrique",
                   "confiance", "statut", "date")} for f in fiches]
        return 200, {"logement_id": logement_id, "annee": an,
                     "factures": leger, "total": len(leger),
                     "file_validation": sum(
                         1 for f in fiches
                         if f.get("statut") == "brouillon_a_valider")}

    # --- POST /facture-valider : 1-tap humaine (+ correction rubrique) ---
    def facture_valider(self, logement_id, facture_id, qui, rubrique=""):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "validation 1-tap HUMAINE exigée "
                                   "(qui != auto/llm/jev)"}
        fid = str(facture_id or "").strip()
        if not fid or not SLUG_RE.fullmatch(fid) or ".." in fid:
            return 400, {"erreur": "facture_id slug seul (traversée bloquée)"}
        rub = str(rubrique or "").strip().lower()
        if rub and rub not in RUBRIQUES:
            return 400, {"erreur": "rubrique parmi : "
                                   + ", ".join(RUBRIQUES)}
        annee = None
        try:
            annee = int(fid.split("-")[1][:4])
        except (IndexError, ValueError):
            pass
        annees = [str(annee)] if annee else []
        if not annees:
            base = os.path.join(self.state_dir, "compta", logement_id)
            try:
                annees = sorted(os.listdir(base))
            except FileNotFoundError:
                annees = []
        for an in annees:
            dossier = os.path.join(self.state_dir, "compta", logement_id,
                                   str(an))
            factures = self._lire_json(os.path.join(dossier, "factures.json"),
                                       {})
            if fid in factures:
                if rub:
                    factures[fid]["rubrique"] = rub
                    factures[fid]["rubrique_auto"] = False
                factures[fid]["statut"] = "validee"
                factures[fid]["validee_par"] = qui
                factures[fid]["validee_le"] = utcnow_iso()
                self._ecrire_json(os.path.join(dossier, "factures.json"),
                                  factures)
                self.log_decision(logement_id, fid, qui, "compta",
                                  factures[fid].get("montant_ttc"),
                                  f"facture validee 1-tap "
                                  f"({factures[fid]['rubrique']})")
                return 200, {"facture_id": fid, "statut": "validee",
                             "rubrique": factures[fid]["rubrique"]}
        return 404, {"erreur": f"facture introuvable : {fid}"}

    # --- POST /payout : export plateforme (brut + commission -> net) ---
    def payout(self, logement_id, qui, canal, montant, date, ref_resa="",
               commission=0, nuits=0):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "payout = import HUMAIN "
                                   "(qui != auto/llm/jev)"}
        canal = str(canal or "").strip().lower()
        if canal not in CANAUX:
            return 400, {"erreur": "canal parmi : " + ", ".join(CANAUX)}
        try:
            brut = float(str(montant))
        except (TypeError, ValueError):
            return 400, {"erreur": "montant > 0 requis"}
        if not (brut > 0):
            return 400, {"erreur": "montant > 0 requis"}
        jour = self._date_valide(date)
        if not jour:
            return 400, {"erreur": "date AAAA-MM-JJ requise"}
        try:
            comm = float(str(commission or 0))
        except (TypeError, ValueError):
            return 400, {"erreur": "commission >= 0"}
        if comm < 0 or comm > brut:
            return 400, {"erreur": "commission entre 0 et montant"}
        try:
            nuits_i = int(float(str(nuits or 0)))
        except (TypeError, ValueError):
            return 400, {"erreur": "nuits entier >= 0"}
        if nuits_i < 0:
            return 400, {"erreur": "nuits entier >= 0"}
        ref = str(ref_resa or "").strip()
        if ref and (not SLUG_RE.fullmatch(ref) or ".." in ref):
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        dossier = self._dir_annee(logement_id, jour.year)
        payouts = self._lire_json(os.path.join(dossier, "payouts.json"), {})
        pid = f"PAY-{jour.strftime('%Y%m%d')}-{len(payouts) + 1:03d}"
        fiche = {"payout_id": pid, "logement_id": logement_id,
                 "canal": canal, "montant_brut": round(brut, 2),
                 "commission": round(comm, 2),
                 "net": round(brut - comm, 2), "date": jour.isoformat(),
                 "ref_resa": ref, "nuits": nuits_i, "statut": "a_rapprocher",
                 "importe_par": qui, "importe_le": utcnow_iso()}
        payouts[pid] = fiche
        self._ecrire_json(os.path.join(dossier, "payouts.json"), payouts)
        self.log_decision(logement_id, pid, qui, "compta", fiche["net"],
                          f"payout {canal} brut {brut} -> net {fiche['net']}")
        return 201, {"payout_id": pid, "logement_id": logement_id,
                     "canal": canal, "net": fiche["net"],
                     "statut": "a_rapprocher"}

    # --- POST /releve : matching payouts <-> lignes banque ---
    def releve(self, logement_id, qui, lignes, annee=""):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "relevé = import HUMAIN "
                                   "(qui != auto/llm/jev)"}
        if not isinstance(lignes, list) or not lignes:
            return 400, {"erreur": "lignes[] non vide requises "
                                   "({date, libelle, montant})"}
        try:
            an = int(str(annee)) if str(annee or "").strip() else \
                dt.date.today().year
        except ValueError:
            return 400, {"erreur": "annee AAAA"}
        banque = []
        for i, lig in enumerate(lignes):
            if not isinstance(lig, dict):
                return 400, {"erreur": f"ligne {i} = objet {{date, montant}}"}
            jour = self._date_valide(lig.get("date", ""))
            if not jour:
                return 400, {"erreur": f"ligne {i} : date AAAA-MM-JJ"}
            try:
                montant = float(str(lig.get("montant")))
            except (TypeError, ValueError):
                return 400, {"erreur": f"ligne {i} : montant requis"}
            banque.append({"date": jour, "libelle": str(
                lig.get("libelle", "") or "")[:120], "montant": round(
                    montant, 2), "utilisee": False})
        dossier = self._dir_annee(logement_id, an)
        payouts = self._lire_json(os.path.join(dossier, "payouts.json"), {})
        rapproches, file = [], []
        auj = dt.date.today()
        for pid in sorted(payouts):
            p = payouts[pid]
            if p.get("statut") == "rapproche":
                continue
            jour_p = self._date_valide(p.get("date", ""))
            if not jour_p:
                continue
            net = float(p.get("net", 0) or 0)
            meilleur, meilleur_ecart = None, None
            for lig in banque:
                if lig["utilisee"]:
                    continue
                if abs((lig["date"] - jour_p).days) > self.delai_orpheline:
                    continue
                ecart = (abs(lig["montant"] - net) / net) if net else 1.0
                if meilleur_ecart is None or ecart < meilleur_ecart:
                    meilleur, meilleur_ecart = lig, ecart
            if meilleur is not None and meilleur_ecart <= self.seuil_ecart:
                meilleur["utilisee"] = True
                p["statut"] = "rapproche"
                p["rapproche_le"] = utcnow_iso()
                p["ligne_banque"] = {k: meilleur[k] for k in
                                     ("date", "libelle", "montant")}
                p["ligne_banque"]["date"] = meilleur["date"].isoformat()
                rapproches.append(pid)
            elif meilleur is not None:
                file.append({"type": "ecart_montant", "payout_id": pid,
                             "attendu": net, "recu": meilleur["montant"],
                             "ecart_pct": round(meilleur_ecart * 100, 2)})
            elif (auj - jour_p).days > self.delai_orpheline:
                file.append({"type": "payout_orphelin", "payout_id": pid,
                             "net": net, "age_j": (auj - jour_p).days})
        for lig in banque:
            if not lig["utilisee"] and \
                    (auj - lig["date"]).days > self.delai_orpheline:
                file.append({"type": "ligne_orpheline",
                             "libelle": lig["libelle"],
                             "montant": lig["montant"],
                             "age_j": (auj - lig["date"]).days})
        self._ecrire_json(os.path.join(dossier, "payouts.json"), payouts)
        anc = self._lire_json(os.path.join(dossier, "rapprochement.json"),
                              {"file": []})
        vus = {(e.get("type"), e.get("payout_id", e.get("libelle")))
               for e in anc.get("file", [])}
        for e in file:
            if (e.get("type"), e.get("payout_id", e.get("libelle"))) \
                    not in vus:
                anc.setdefault("file", []).append({**e, "signale_le":
                                                   utcnow_iso()})
        anc["maj_le"] = utcnow_iso()
        self._ecrire_json(os.path.join(dossier, "rapprochement.json"), anc)
        self.log_decision(logement_id, f"releve-{an}", qui, "compta", None,
                          f"rapprochement : {len(rapproches)} rapproches, "
                          f"{len(file)} en file (jamais d'écriture auto)")
        return 200, {"logement_id": logement_id, "annee": an,
                     "rapproches": rapproches, "file": file,
                     "jamais_ecriture_auto": True}

    # --- GET /rapprochement ---
    def rapprochement(self, logement_id, annee=""):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        try:
            an = int(str(annee)) if str(annee or "").strip() else \
                dt.date.today().year
        except ValueError:
            return 400, {"erreur": "annee AAAA"}
        dossier = os.path.join(self.state_dir, "compta", logement_id,
                               str(an))
        payouts = self._lire_json(os.path.join(dossier, "payouts.json"), {})
        rap = self._lire_json(os.path.join(dossier, "rapprochement.json"),
                              {"file": []})
        return 200, {"logement_id": logement_id, "annee": an,
                     "payouts_total": len(payouts),
                     "rapproches": sum(
                         1 for p in payouts.values()
                         if p.get("statut") == "rapproche"),
                     "file": rap.get("file", [])}

    def _totaux(self, logement_id, annee, mois=0):
        """CA (payouts nets) + charges (factures validées) + nuits."""
        dossier = os.path.join(self.state_dir, "compta", logement_id,
                               str(annee))
        payouts = self._lire_json(os.path.join(dossier, "payouts.json"), {})
        factures = self._lire_json(os.path.join(dossier, "factures.json"),
                                   {})
        par_canal, ca, nuits = {}, 0.0, 0
        for p in payouts.values():
            if mois and not str(p.get("date", "")).startswith(
                    f"{annee}-{mois:02d}"):
                continue
            ca += float(p.get("net", 0) or 0)
            par_canal[p.get("canal", "direct")] = round(
                par_canal.get(p.get("canal", "direct"), 0.0)
                + float(p.get("net", 0) or 0), 2)
            nuits += int(p.get("nuits", 0) or 0)
        charges, par_rubrique, nb_validees, file_n = 0.0, {}, 0, 0
        for f in factures.values():
            if f.get("statut") == "brouillon_a_valider":
                file_n += 1
            if f.get("statut") != "validee":
                continue
            if mois and not str(f.get("date", "")).startswith(
                    f"{annee}-{mois:02d}"):
                continue
            charges += float(f.get("montant_ttc", 0) or 0)
            par_rubrique[f.get("rubrique", "divers")] = round(
                par_rubrique.get(f.get("rubrique", "divers"), 0.0)
                + float(f.get("montant_ttc", 0) or 0), 2)
            nb_validees += 1
        return {"ca": round(ca, 2), "charges": round(charges, 2),
                "net": round(ca - charges, 2), "par_canal": par_canal,
                "par_rubrique": par_rubrique, "nuits": nuits,
                "nb_payouts": len(payouts), "nb_factures_validees": nb_validees,
                "file_validation": file_n}

    def _jauge(self, valeur, plafond):
        pct = round(valeur / plafond, 4) if plafond else 0.0
        alerte = ("depassement_100" if pct >= 1.0
                  else ("seuil_80" if pct >= self.alerte_jauge else "ok"))
        return {"valeur": valeur, "plafond": plafond, "pct": pct,
                "alerte": alerte}

    # --- GET /finances : CA/charges/net + jauges + 120 j ---
    def finances(self, logement_id, annee="", classement="non_classe"):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        try:
            an = int(str(annee)) if str(annee or "").strip() else \
                dt.date.today().year
        except ValueError:
            return 400, {"erreur": "annee AAAA"}
        classement = str(classement or "non_classe").strip().lower()
        if classement not in CLASSEMENTS:
            return 400, {"erreur": "classement parmi : "
                                   + ", ".join(CLASSEMENTS)}
        tot = self._totaux(logement_id, an)
        rap = self._lire_json(os.path.join(
            self.state_dir, "compta", logement_id, str(an),
            "rapprochement.json"), {"file": []})
        return 200, {"logement_id": logement_id, "annee": an,
                     "classement": classement, **tot,
                     "jauge_ca": self._jauge(tot["ca"],
                                             self.plafonds[classement]),
                     "jauge_nuits": self._jauge(tot["nuits"],
                                                self.plafond_nuits),
                     "file_rapprochement": len(rap.get("file", []))}

    # --- GET /simulateur : micro vs réel (jamais d'option auto) ---
    def simulateur(self, logement_id, annee="", classement="non_classe",
                   amortissement=0):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        try:
            an = int(str(annee)) if str(annee or "").strip() else \
                dt.date.today().year
        except ValueError:
            return 400, {"erreur": "annee AAAA"}
        classement = str(classement or "non_classe").strip().lower()
        if classement not in CLASSEMENTS:
            return 400, {"erreur": "classement parmi : "
                                   + ", ".join(CLASSEMENTS)}
        try:
            amort = float(str(amortissement or 0))
        except (TypeError, ValueError):
            return 400, {"erreur": "amortissement >= 0"}
        if amort < 0:
            return 400, {"erreur": "amortissement >= 0"}
        tot = self._totaux(logement_id, an)
        abattement = 0.30 if classement == "non_classe" else 0.50
        base_micro = round(tot["ca"] * (1.0 - abattement), 2)
        base_reel = round(tot["ca"] - tot["charges"] - amort, 2)
        if base_reel < base_micro:
            reco = ("réel avantagé sur ces chiffres "
                    "(charges + amortissements > abattement) — "
                    "à valider avec le comptable")
        elif base_reel > base_micro:
            reco = ("micro avantagé sur ces chiffres — "
                    "à valider avec le comptable")
        else:
            reco = "égalité — à valider avec le comptable"
        levier = {}
        if classement == "non_classe":
            base_classe = round(tot["ca"] * 0.50, 2)
            levier = {"base_micro_classe_50": base_classe,
                      "gain_vs_non_classe": round(base_micro - base_classe,
                                                 2),
                      "note": "classement Atout France 1-5* : 30 %/15 k€ -> "
                              "50 %/77,7 k€ (coût visite à intégrer)"}
        return 200, {"logement_id": logement_id, "annee": an,
                     "classement": classement, "ca": tot["ca"],
                     "charges": tot["charges"],
                     "micro": {"abattement": abattement,
                               "base_imposable": base_micro},
                     "reel": {"amortissement": round(amort, 2),
                              "base_imposable": base_reel},
                     "recommandation": reco,
                     "levier_classement": levier,
                     "jamais_option_auto": True}

    # --- POST /cloture : le 5 du mois suivant (jamais avant) ---
    def cloture(self, logement_id, qui, annee, mois):
        log = self._log(logement_id)
        if not log["existe"]:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self._qui_humain(qui):
            return 400, {"erreur": "clôture = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        try:
            an, mo = int(str(annee)), int(str(mois))
            limite = (dt.date(an + (1 if mo == 12 else 0),
                              1 if mo == 12 else mo + 1, 1)
                      + dt.timedelta(days=self.jour_cloture - 1))
        except (TypeError, ValueError):
            return 400, {"erreur": "annee AAAA + mois 1-12"}
        if not (1 <= mo <= 12):
            return 400, {"erreur": "annee AAAA + mois 1-12"}
        if dt.date.today() < limite:
            return 409, {"erreur": "clôture le 5 du mois suivant "
                                   f"(possible dès {limite.isoformat()})",
                         "code": "trop_tot"}
        dossier = self._dir_annee(logement_id, an)
        nom = f"cloture-{an}-{mo:02d}.json"
        if os.path.exists(os.path.join(dossier, nom)):
            arch = self._lire_json(os.path.join(dossier, nom), {})
            return 200, {"statut": "deja_cloturee", "logement_id": logement_id,
                         "annee": an, "mois": mo, "recap": arch.get("recap",
                                                                   {})}
        tot = self._totaux(logement_id, an, mo)
        rap = self._lire_json(os.path.join(dossier, "rapprochement.json"),
                              {"file": []})
        recap = {**tot, "file_rapprochement": len(rap.get("file", []))}
        arch = {"logement_id": logement_id, "annee": an, "mois": mo,
                "cloturee_par": qui, "cloturee_le": utcnow_iso(),
                "recap": recap,
                "note": "dossier comptable : verser docs/parc/<annee>/ "
                        "(export 1-clic box)"}
        self._ecrire_json(os.path.join(dossier, nom), arch)
        self.log_decision(logement_id, f"cloture-{an}-{mo:02d}", qui,
                          "compta", tot["net"],
                          f"clôture {mo:02d}/{an} : CA {tot['ca']} - "
                          f"charges {tot['charges']} = net {tot['net']}")
        return 201, {"statut": "cloturee", "logement_id": logement_id,
                     "annee": an, "mois": mo, "recap": recap}


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
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        eng = self.engine
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/factures":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.factures(logement_id,
                                     qs.get("statut", [""])[0],
                                     qs.get("annee", [""])[0])
            return self._json(code, obj)
        if url.path == "/rapprochement":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.rapprochement(logement_id,
                                          qs.get("annee", [""])[0])
            return self._json(code, obj)
        if url.path == "/finances":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.finances(logement_id,
                                     qs.get("annee", [""])[0],
                                     qs.get("classement",
                                            ["non_classe"])[0])
            return self._json(code, obj)
        if url.path == "/simulateur":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = eng.simulateur(logement_id,
                                       qs.get("annee", [""])[0],
                                       qs.get("classement",
                                              ["non_classe"])[0],
                                       qs.get("amortissement", ["0"])[0])
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        p, err = self._lire_json()
        if err:
            return self._json(400, {"erreur": err})
        eng = self.engine
        if url.path == "/facture":
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(400, {"erreur": "logement_id, qui requis"})
            if p.get("montant_ttc") is None:
                return self._json(422, {"erreur": "montant_ttc requis "
                                                  "(jamais inventé)",
                                        "code": "montant_requis"})
            code, obj = eng.facture(
                p["logement_id"], p["qui"], p["montant_ttc"],
                p.get("fournisseur", ""), p.get("texte_ocr", ""),
                p.get("tva", 0), p.get("date", ""), p.get("rubrique", ""))
            return self._json(code, obj)
        if url.path == "/facture-valider":
            if not (p.get("logement_id") and p.get("facture_id")
                    and p.get("qui")):
                return self._json(400, {"erreur": "logement_id, facture_id, "
                                                  "qui requis"})
            code, obj = eng.facture_valider(
                p["logement_id"], p["facture_id"], p["qui"],
                p.get("rubrique", ""))
            return self._json(code, obj)
        if url.path == "/payout":
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(400, {"erreur": "logement_id, qui requis"})
            if p.get("canal") is None or p.get("montant") is None \
                    or not p.get("date"):
                return self._json(400, {"erreur": "canal, montant, date "
                                                  "requis"})
            code, obj = eng.payout(
                p["logement_id"], p["qui"], p["canal"], p["montant"],
                p["date"], p.get("ref_resa", ""),
                p.get("commission", 0), p.get("nuits", 0))
            return self._json(code, obj)
        if url.path == "/releve":
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(400, {"erreur": "logement_id, qui requis"})
            if not p.get("lignes"):
                return self._json(400, {"erreur": "lignes[] non vides"})
            code, obj = eng.releve(p["logement_id"], p["qui"],
                                   p["lignes"], p.get("annee", ""))
            return self._json(code, obj)
        if url.path == "/cloture":
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(400, {"erreur": "logement_id, qui requis"})
            if p.get("annee") is None or p.get("mois") is None:
                return self._json(400, {"erreur": "annee + mois requis"})
            code, obj = eng.cloture(p["logement_id"], p["qui"],
                                    p["annee"], p["mois"])
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD compta auto P6-18")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()

    if not os.path.exists(args.config):
        print(f"config introuvable: {args.config}", file=sys.stderr)
        return 2
    cfg = charger_yaml_plat(args.config)
    base = os.path.dirname(os.path.abspath(args.config))
    for cle in ("state_dir", "decision_log_dir"):
        val = cfg.get(cle, "")
        if val and not os.path.isabs(val):
            cfg[cle] = os.path.normpath(os.path.join(base, val))
    eng = Compta(cfg, args.logements)
    if not args.serve:
        print(json.dumps({"seuils": {"confiance": eng.seuil_confiance,
                                     "ecart": eng.seuil_ecart},
                          "plafonds": eng.plafonds}, ensure_ascii=False))
        return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8100)))
    Handler.engine = eng
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # box/prod : 127.0.0.1 ; lab : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"compta :8100 (seuil {eng.seuil_confiance})", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
