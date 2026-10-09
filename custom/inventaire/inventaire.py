#!/usr/bin/env python3
# custom/inventaire/inventaire.py — registre biens durables par logement P6-4 (§5.6-bis).
# 0 € : stdlib seule. Même LXC/box que les 7 autres moteurs. Port :8097.
#
# Chaque bien durable porte une étiquette (linge : QR thermocollant lavable ;
# équipement : sticker QR vinyle ou NFC NTAG215). Scan PWA → fiche bien.
# Stockage local `custom/inventaire/logX/biens.yaml` (YAML <200 biens/logement,
# backup avec HA). Grocy reste pour les CONSOMMABLES ; ce registre = DURABLE.
#
# Fiche bien : {qr, logement, categorie (linge|equipement), label, date_achat,
#   prix_achat, fournisseur, garantie_fin, lavages_nb, utilisations_nb (séjours
#   où présent), derniere_utilisation (AAAA-MM-JJ), etat (1-5), photo?}
#
# Cycle de vie auto :
#   - clôture ménage = +1 utilisation (+1 lavage si lot marqué à laver) ;
#   - inactivité >90 j → alerte `dormant` (retirer/stocker) ;
#   - état ≤2 → alerte `remplacement` (lien fournisseur + prix proposés) ;
#   - garantie expire <30 j → rappel `garantie`.
# Stats : coût/séjour/bien (prix ÷ utilisations), âge moyen, rotations/séjour,
#   top usure, budget prévisionnel/an → onglet Stocks dashboard ménage.
#
# Règles (verrouillées en code) :
#   - si `inventaire_biens: off` : 503 inventaire_off (Grocy consommables seuls) ;
#   - écritures = geste humain ou clôture ménage (`qui` != auto/llm/jev/moteur-*)
#     sauf /utilisation appelée par le dispatch à la clôture (qui=moteur-dispatch
#     accepté, traçé en decision.logX.jsonl) ;
#   - qr = slug seul ([A-Za-z0-9_-]+), jamais de chemin ; traversée bloquée ;
#   - état toujours 1-5, utilisations/lavages jamais décrémentés (monotones).
#
# Contrats :
#   GET  /health -> {"ok": true}
#   GET  /biens?logement_id=log1 -> {biens: [...], total}
#   GET  /bien?logement_id=log1&qr=LINGE-DRAP-001 -> fiche + inactivite_jours
#   POST /bien {logement_id, qr, categorie, label, ..., qui} -> 201 créé / 200 màj
#   POST /scan {logement_id, qr, qui} -> 200 fiche (lecture seule, tout geste OK)
#   POST /utilisation {logement_id, qr?, lot? (qr|tous_linge), laver? (bool), qui}
#     -> clôture ménage : +1 utilisation (+1 lavage si laver=true) ; 201
#   POST /etat {logement_id, qr, etat (1-5), note?, qui} -> 200 (état dégradé
#     signalé ; ≤2 = remplacement proposé)
#   GET  /alertes?logement_id=log1 -> {dormants, remplacements, garanties}
#   GET  /stats?logement_id=log1 -> {cout_sejour_bien, age_moyen_j, rotations,
#     top_usure, budget_previsionnel_an}
#
# Usage : python3 inventaire.py --config config.yaml --logements ../logements.yaml
#   [--inventaire ../inventaire] [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND, LCD_INVENTAIRE_DIR.
import argparse
import datetime as dt
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI_AUTO = ("auto", "llm", "jev", "moteur-direct", "")
# /utilisation peut être appelé par le dispatch à la clôture ménage (P6-2 → P6-4).
QUI_MOTEUR_OK = QUI_AUTO + ("moteur-dispatch",)

SEUIL_DORMANT_J = 90
SEUIL_ETAT_REMPLACEMENT = 2
SEUIL_GARANTIE_J = 30

QR_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def _scalaire(v):
    v = v.strip().strip("\"'")
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


def lire_flag_inventaire(logements_path, logement_id):
    """Flag features.inventaire_biens d'un logement (défaut False = sûr)."""
    try:
        with open(logements_path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return False
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
            if k.strip() == "inventaire_biens":
                return _scalaire(v) is True
    return False


def lire_biens(path):
    """Lit biens.yaml : liste d'objets `- qr: ...` + clés indentées."""
    biens = []
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return biens
    courant = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        if re.match(r"^biens:\s*(\[\])?\s*$", ligne):
            continue
        m = re.match(r"^\s*-\s+(\w[\w-]*):\s*(.*)$", ligne)
        if m:
            courant = {m.group(1): _scalaire(m.group(2))}
            biens.append(courant)
            continue
        m2 = re.match(r"^\s{2,}(\w[\w-]*):\s*(.*)$", ligne)
        if m2 and courant is not None:
            courant[m2.group(1)] = _scalaire(m2.group(2))
    return biens


def ecrire_biens(path, biens):
    """Écrit biens.yaml (schéma fixe, clés triées stables)."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    lignes = ["# inventaire biens — registre durable QR/NFC (§5.6-bis).",
              "# Généré/maintenu par custom/inventaire/inventaire.py (P6-4)."]
    if not biens:
        lignes.append("biens: []")
    else:
        lignes.append("biens:")
        for b in biens:
            lignes.append(f"  - qr: {b.get('qr', '')}")
            for k in ("logement", "categorie", "label", "date_achat",
                      "prix_achat", "fournisseur", "garantie_fin",
                      "lavages_nb", "utilisations_nb", "derniere_utilisation",
                      "etat", "photo"):
                if k in b and b[k] not in ("", None):
                    v = b[k]
                    if isinstance(v, str) and (":" in v or "#" in v):
                        v = f'"{v}"'
                    lignes.append(f"    {k}: {v}")
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("\n".join(lignes) + "\n")
    os.replace(tmp, path)


def inactivite_jours(bien):
    ref = str(bien.get("derniere_utilisation") or bien.get("date_achat") or "")
    if not ref:
        return None
    try:
        return (dt.date.today() - dt.date.fromisoformat(ref[:10])).days
    except ValueError:
        return None


def garantie_jours(bien):
    fin = str(bien.get("garantie_fin") or "")
    if not fin:
        return None
    try:
        return (dt.date.fromisoformat(fin[:10]) - dt.date.today()).days
    except ValueError:
        return None


class Inventaire:
    def __init__(self, cfg, logements_yaml, inventaire_dir):
        self.cfg = cfg
        self.logements_yaml = logements_yaml
        self.inv_dir = (os.environ.get("LCD_INVENTAIRE_DIR")
                        or inventaire_dir or "./inventaire")
        self.state_dir = (os.environ.get("LCD_STATE_DIR")
                          or cfg.get("state_dir", "./state"))
        self.decision_dir = (os.environ.get("LCD_DECISION_LOG_DIR")
                             or cfg.get("decision_log_dir", "./state"))

    # --- helpers ---
    def _fichier(self, logement_id):
        if not QR_RE.fullmatch(logement_id or ""):
            return None
        return os.path.join(self.inv_dir, logement_id, "biens.yaml")

    def log_decision(self, logement_id, ref, qui, quoi, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": None,
                 "commission": None, "net_hote": None, "motif": motif}
        os.makedirs(self.decision_dir, exist_ok=True)
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")

    def _verif_flag(self, logement_id):
        if not lire_flag_inventaire(self.logements_yaml, logement_id):
            return ({"ok": False, "code": "inventaire_off",
                     "erreur": "inventaire_biens: off (Grocy consommables seuls)"},
                    503)
        return None

    def _verif_qui(self, qui, accepter_moteur=False):
        if (qui or "") in QUI_AUTO:
            return ({"ok": False, "code": "validation_humaine_requise",
                     "erreur": "geste humain exigé (qui != auto/llm/jev)"}, 400)
        if (qui or "") == "moteur-dispatch" and not accepter_moteur:
            return ({"ok": False, "code": "validation_humaine_requise",
                     "erreur": "moteur-dispatch admis sur /utilisation seule"}, 400)
        return None

    # --- GET /biens /bien ---
    def biens(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        chemin = self._fichier(logement_id)
        if chemin is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        liste = lire_biens(chemin)
        for b in liste:
            b["inactivite_jours"] = inactivite_jours(b)
        return {"ok": True, "logement_id": logement_id,
                "biens": liste, "total": len(liste)}, 200

    def bien(self, logement_id, qr):
        err = self._verif_flag(logement_id)
        if err:
            return err
        if not qr or not QR_RE.fullmatch(qr):
            return {"ok": False, "erreur": "qr invalide"}, 400
        for b in lire_biens(self._fichier(logement_id)):
            if b.get("qr") == qr:
                b["inactivite_jours"] = inactivite_jours(b)
                b["garantie_jours_restants"] = garantie_jours(b)
                return {"ok": True, "bien": b}, 200
        return {"ok": False, "code": "introuvable",
                "erreur": f"bien {qr} introuvable"}, 404

    # --- POST /bien (création / mise à jour fiche) ---
    def upsert_bien(self, p):
        logement_id = p.get("logement_id", "")
        qr = p.get("qr", "")
        qui = p.get("qui", "")
        err = self._verif_flag(logement_id) or self._verif_qui(qui)
        if err:
            return err
        if not qr or not QR_RE.fullmatch(qr):
            return {"ok": False, "erreur": "qr invalide (slug seul)"}, 400
        categorie = p.get("categorie", "equipement")
        if categorie not in ("linge", "equipement"):
            return {"ok": False,
                    "erreur": "categorie ∈ {linge, equipement}"}, 400
        etat = p.get("etat", 5)
        try:
            etat = int(etat)
        except (TypeError, ValueError):
            return {"ok": False, "erreur": "etat entier 1-5"}, 400
        if not 1 <= etat <= 5:
            return {"ok": False, "erreur": "etat entier 1-5"}, 400
        chemin = self._fichier(logement_id)
        liste = lire_biens(chemin)
        fiche = None
        for b in liste:
            if b.get("qr") == qr:
                fiche = b
                break
        cree = fiche is None
        if cree:
            fiche = {"qr": qr, "logement": logement_id,
                     "lavages_nb": 0, "utilisations_nb": 0}
            liste.append(fiche)
        for k in ("categorie", "label", "date_achat", "prix_achat",
                  "fournisseur", "garantie_fin", "derniere_utilisation",
                  "photo"):
            if p.get(k) not in (None, ""):
                fiche[k] = p[k]
        fiche["categorie"] = categorie
        fiche["etat"] = etat
        # Compteurs monotones : jamais décrémentés via /bien.
        for k in ("lavages_nb", "utilisations_nb"):
            if fiche.get(k) is None:
                fiche[k] = 0
        ecrire_biens(chemin, liste)
        self.log_decision(logement_id, qr, qui,
                          "inventaire_cree" if cree else "inventaire_maj",
                          f"fiche {qr} ({categorie}, état {etat})")
        return {"ok": True, "cree": cree, "bien": fiche}, (201 if cree else 200)

    # --- POST /scan (lecture seule) ---
    def scan(self, p):
        return self.bien(p.get("logement_id", ""), p.get("qr", ""))

    # --- POST /utilisation (clôture ménage : +1 utilisation [+1 lavage]) ---
    def utilisation(self, p):
        logement_id = p.get("logement_id", "")
        qui = p.get("qui", "")
        err = (self._verif_flag(logement_id)
               or self._verif_qui(qui, accepter_moteur=True))
        if err:
            return err
        qr = p.get("qr", "")
        lot = p.get("lot", "")
        laver = p.get("laver", False) is True
        if not qr and lot not in ("tous_linge",):
            return {"ok": False,
                    "erreur": "qr ou lot=tous_linge requis"}, 400
        if qr and not QR_RE.fullmatch(qr):
            return {"ok": False, "erreur": "qr invalide"}, 400
        chemin = self._fichier(logement_id)
        liste = lire_biens(chemin)
        auj = dt.date.today().isoformat()
        touches = []
        for b in liste:
            cible = (b.get("qr") == qr) if qr else (b.get("categorie") == "linge")
            if not cible:
                continue
            b["utilisations_nb"] = int(b.get("utilisations_nb") or 0) + 1
            if laver and (b.get("categorie") == "linge" or qr):
                b["lavages_nb"] = int(b.get("lavages_nb") or 0) + 1
            b["derniere_utilisation"] = auj
            touches.append(b.get("qr"))
        if not touches:
            return {"ok": False, "code": "introuvable",
                    "erreur": "aucun bien ciblé"}, 404
        ecrire_biens(chemin, liste)
        self.log_decision(logement_id, qr or lot, qui, "inventaire_utilisation",
                          f"+1 utilisation x{len(touches)}"
                          + (" +lavage" if laver else ""))
        return {"ok": True, "biens": touches,
                "utilisations_ajoutees": len(touches),
                "lavage": laver}, 201

    # --- POST /etat (signalement dégradation 1-5) ---
    def declarer_etat(self, p):
        logement_id = p.get("logement_id", "")
        qr = p.get("qr", "")
        qui = p.get("qui", "")
        err = self._verif_flag(logement_id) or self._verif_qui(qui)
        if err:
            return err
        if not qr or not QR_RE.fullmatch(qr):
            return {"ok": False, "erreur": "qr invalide"}, 400
        try:
            etat = int(p.get("etat", 0))
        except (TypeError, ValueError):
            return {"ok": False, "erreur": "etat entier 1-5"}, 400
        if not 1 <= etat <= 5:
            return {"ok": False, "erreur": "etat entier 1-5"}, 400
        chemin = self._fichier(logement_id)
        liste = lire_biens(chemin)
        for b in liste:
            if b.get("qr") == qr:
                b["etat"] = etat
                ecrire_biens(chemin, liste)
                remplacement = etat <= SEUIL_ETAT_REMPLACEMENT
                self.log_decision(logement_id, qr, qui, "inventaire_etat",
                                  f"état {etat}"
                                  + (" → remplacement proposé" if remplacement else ""))
                rep = {"ok": True, "qr": qr, "etat": etat}
                if remplacement:
                    rep["remplacement_propose"] = {
                        "fournisseur": b.get("fournisseur"),
                        "prix_achat": b.get("prix_achat")}
                if p.get("note"):
                    rep["note"] = p["note"]
                return rep, 200
        return {"ok": False, "code": "introuvable",
                "erreur": f"bien {qr} introuvable"}, 404

    # --- GET /alertes ---
    def alertes(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        liste = lire_biens(self._fichier(logement_id))
        dormants, remplacements, garanties = [], [], []
        for b in liste:
            inact = inactivite_jours(b)
            if inact is not None and inact > SEUIL_DORMANT_J:
                dormants.append({"qr": b.get("qr"),
                                 "inactivite_jours": inact})
            try:
                etat = int(b.get("etat", 5))
            except (TypeError, ValueError):
                etat = 5
            if etat <= SEUIL_ETAT_REMPLACEMENT:
                remplacements.append({"qr": b.get("qr"), "etat": etat,
                                      "fournisseur": b.get("fournisseur"),
                                      "prix_achat": b.get("prix_achat")})
            gj = garantie_jours(b)
            if gj is not None and 0 <= gj < SEUIL_GARANTIE_J:
                garanties.append({"qr": b.get("qr"),
                                  "garantie_jours_restants": gj})
        return {"ok": True, "logement_id": logement_id,
                "dormants": dormants, "remplacements": remplacements,
                "garanties": garanties}, 200

    # --- GET /stats ---
    def stats(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        liste = lire_biens(self._fichier(logement_id))
        couts = []
        ages = []
        usure = []
        for b in liste:
            try:
                prix = float(b.get("prix_achat") or 0)
            except (TypeError, ValueError):
                prix = 0.0
            nb = int(b.get("utilisations_nb") or 0)
            if prix > 0:
                couts.append({"qr": b.get("qr"),
                              "cout_sejour": round(prix / nb, 2) if nb > 0 else prix})
            try:
                achat = dt.date.fromisoformat(str(b.get("date_achat") or "")[:10])
                ages.append((dt.date.today() - achat).days)
            except ValueError:
                pass
            try:
                usure.append((b.get("qr"), int(b.get("etat", 5)),
                              nb, int(b.get("lavages_nb") or 0)))
            except (TypeError, ValueError):
                pass
        usure.sort(key=lambda t: (t[1], -t[2] - t[3]))
        budget = round(sum(float(b.get("prix_achat") or 0)
                           for b in liste
                           if str(b.get("etat") or "5") in ("1", "2")), 2)
        total_util = sum(int(b.get("utilisations_nb") or 0) for b in liste)
        return {"ok": True, "logement_id": logement_id,
                "nb_biens": len(liste),
                "cout_sejour_bien": couts,
                "age_moyen_j": round(sum(ages) / len(ages), 1) if ages else None,
                "rotations_sejour": total_util,
                "top_usure": [{"qr": q, "etat": e, "utilisations": n,
                               "lavages": lv} for q, e, n, lv in usure[:10]],
                "budget_previsionnel_an": budget}, 200


def _reponse(handler, code, obj):
    corps = json.dumps(obj, ensure_ascii=False).encode("utf-8")
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(corps)))
    handler.end_headers()
    handler.wfile.write(corps)


class Handler(BaseHTTPRequestHandler):
    moteur = None  # injecté par main()

    def log_message(self, *a):
        pass

    def _qs(self):
        import urllib.parse as up
        return dict(up.parse_qsl(up.urlsplit(self.path).query))

    def _corps(self):
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = 0
        if n <= 0 or n > 1_000_000:
            return {}
        try:
            return json.loads(self.rfile.read(n).decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            return {}

    def do_GET(self):
        import urllib.parse as up
        chemin = up.urlsplit(self.path).path
        m = self.moteur
        if chemin == "/health":
            return _reponse(self, 200, {"ok": True})
        if chemin == "/biens":
            obj, code = m.biens(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/bien":
            q = self._qs()
            obj, code = m.bien(q.get("logement_id", ""), q.get("qr", ""))
            return _reponse(self, code, obj)
        if chemin == "/alertes":
            obj, code = m.alertes(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/stats":
            obj, code = m.stats(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        return _reponse(self, 404, {"ok": False, "erreur": "route inconnue"})

    def do_POST(self):
        import urllib.parse as up
        chemin = up.urlsplit(self.path).path
        m = self.moteur
        p = self._corps()
        if chemin == "/bien":
            obj, code = m.upsert_bien(p)
            return _reponse(self, code, obj)
        if chemin == "/scan":
            obj, code = m.scan(p)
            return _reponse(self, code, obj)
        if chemin == "/utilisation":
            obj, code = m.utilisation(p)
            return _reponse(self, code, obj)
        if chemin == "/etat":
            obj, code = m.declarer_etat(p)
            return _reponse(self, code, obj)
        return _reponse(self, 404, {"ok": False, "erreur": "route inconnue"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--inventaire", default="../inventaire")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()
    cfg = charger_yaml_plat(args.config)
    port = int(os.environ.get("LCD_HTTP_PORT") or cfg.get("http_port", 8097))
    bind = os.environ.get("LCD_BIND") or cfg.get("bind", "127.0.0.1")
    Handler.moteur = Inventaire(cfg, args.logements, args.inventaire)
    if not args.serve:
        print(json.dumps({"ok": True, "port": port}, ensure_ascii=False))
        return
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"inventaire :8097 sur {bind}:{port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
