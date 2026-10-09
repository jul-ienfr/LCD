#!/usr/bin/env python3
# custom/grocy-stocks/stocks.py — seuils consommables + liste courses auto P6-3 (§5.6).
# 0 € : stdlib seule. Même LXC/box que les 9 autres moteurs. Port :8099.
#
# Grocy (add-on HA) reste l'option box pour l'inventaire fin ; ce moteur est le
# socle déterministe transférable : seuils par consommable et par logement,
# décrément à chaque rotation (clôture ménage), liste courses auto groupée
# (ruptures d'abord, puis stocks bas), réassort 1-tap, notif hebdo groupée.
# Inventaire biens durables QR/NFC = moteur :8097 (P6-4), jamais ici.
#
# Fiche conso : {id (slug), label, stock, unite, seuil, cible, conso_rotation}
#   - stock <= 0 → `rupture` (course urgente) ; stock <= seuil → `bas` ;
#   - sinon `ok`. Quantités jamais négatives (clamp 0).
#   - /conso {tous: true} = fin de rotation : chaque item perd conso_rotation
#     (appel futur : dispatch à la clôture ménage, qui=moteur-dispatch accepté
#     et tracé ; en attendant : geste intervenant PWA, même contrat).
#   - /reassort {tous: true} ou {id} = stock remis à cible (achat livré).
#   - /courses = quantités à acheter (cible − stock) pour ruptures + bas.
#
# Socle rotation type (~8 €, §12.2) : papier WC 2-3 rouleaux, essuie-tout,
# sacs tri, liquide vaisselle, éponge neuve, pastille LV, kit accueil
# (café/thé/sucre), savon/gel/shampoing rechargés. Kit bienvenue OFFERT
# (~3-5 € : eau + coca + café/thé + biscuits + carte) = item suivi ici aussi,
# charge compta « accueil », jamais du CA (§5.6-ter).
#
# Règles (verrouillées en code) :
#   - socle toujours actif (pas de flag off : si inventaire_biens off, Grocy
#     consommables seuls — ce moteur EST ces consommables) ;
#   - écritures = geste humain ou clôture ménage (`qui` != auto/llm/jev) sauf
#     /conso appelée par le dispatch (qui=moteur-dispatch accepté, tracé) ;
#   - id/logement_id = slug seul ([A-Za-z0-9][A-Za-z0-9_.-]*), traversée bloquée ;
#   - stocks/seuils/cibles entiers >= 0, monotones sauf réassort (hausse seule
#     vers cible) et conso (baisse seule, clamp 0).
#
# Contrats :
#   GET  /health -> {"ok": true}
#   GET  /stocks?logement_id=log1 -> {consommables: [{..., statut}], total}
#   GET  /courses?logement_id=log1 -> {ruptures: [...], bas: [...],
#     total_articles, notif_hebdo: "..."}
#   GET  /alertes?logement_id=log1 -> {ruptures, bas} (idem courses, compact)
#   POST /stock {logement_id, id, label?, stock?, unite?, seuil?, cible?,
#     conso_rotation?, qui} -> 201 créé / 200 màj
#   POST /conso {logement_id, id?, tous?, qui} -> 200 {consommables, courses_auto}
#   POST /reassort {logement_id, id?, tous?, qui} -> 200 {remis_a_cible: [...]}
#
# Usage : python3 stocks.py --config config.yaml --logements ../logements.yaml
#   [--stocks ../grocy-stocks] [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND, LCD_STOCKS_DIR.
import argparse
import datetime as dt
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI_AUTO = ("auto", "llm", "jev", "moteur-direct", "")
# /conso peut être appelé par le dispatch à la clôture ménage (P6-1 → P6-3).
QUI_MOTEUR_OK = QUI_AUTO + ("moteur-dispatch",)

SLUG_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


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


def lire_conso(path):
    """Lit conso.yaml : liste d'objets `- id: ...` + clés indentées."""
    items = []
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return items
    courant = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        if re.match(r"^consommables:\s*(\[\])?\s*$", ligne):
            continue
        m = re.match(r"^\s*-\s+(\w[\w-]*):\s*(.*)$", ligne)
        if m:
            courant = {m.group(1): _scalaire(m.group(2))}
            items.append(courant)
            continue
        m2 = re.match(r"^\s{2,}(\w[\w-]*):\s*(.*)$", ligne)
        if m2 and courant is not None:
            courant[m2.group(1)] = _scalaire(m2.group(2))
    return items


def ecrire_conso(path, items):
    """Écrit conso.yaml (schéma fixe, ordre stable)."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    lignes = ["# stocks consommables — seuils + liste courses (§5.6).",
              "# Généré/maintenu par custom/grocy-stocks/stocks.py (P6-3)."]
    if not items:
        lignes.append("consommables: []")
    else:
        lignes.append("consommables:")
        for c in items:
            lignes.append(f"  - id: {c.get('id', '')}")
            for k in ("label", "stock", "unite", "seuil", "cible",
                      "conso_rotation"):
                if k in c and c[k] not in ("", None):
                    v = c[k]
                    if isinstance(v, str) and (":" in v or "#" in v):
                        v = f'"{v}"'
                    lignes.append(f"    {k}: {v}")
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("\n".join(lignes) + "\n")
    os.replace(tmp, path)


def statut_conso(c):
    try:
        stock = int(c.get("stock", 0))
    except (TypeError, ValueError):
        stock = 0
    try:
        seuil = int(c.get("seuil", 0))
    except (TypeError, ValueError):
        seuil = 0
    if stock <= 0:
        return "rupture"
    if stock <= seuil:
        return "bas"
    return "ok"


def manque(c):
    try:
        return max(0, int(c.get("cible", 0)) - int(c.get("stock", 0)))
    except (TypeError, ValueError):
        return 0


class Stocks:
    def __init__(self, cfg, logements_yaml, stocks_dir):
        self.cfg = cfg
        self.logements_yaml = logements_yaml
        self.stocks_dir = (os.environ.get("LCD_STOCKS_DIR")
                           or stocks_dir or "./grocy-stocks")
        self.state_dir = (os.environ.get("LCD_STATE_DIR")
                          or cfg.get("state_dir", "./state"))
        self.decision_dir = (os.environ.get("LCD_DECISION_LOG_DIR")
                             or cfg.get("decision_log_dir", "./state"))

    # --- helpers ---
    def _fichier(self, logement_id):
        if not SLUG_RE.fullmatch(logement_id or ""):
            return None
        return os.path.join(self.stocks_dir, logement_id, "conso.yaml")

    def log_decision(self, logement_id, ref, qui, quoi, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": None,
                 "commission": None, "net_hote": None, "motif": motif}
        os.makedirs(self.decision_dir, exist_ok=True)
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")

    def _verif_qui(self, qui, accepter_moteur=False):
        if (qui or "") in QUI_AUTO:
            return ({"ok": False, "code": "validation_humaine_requise",
                     "erreur": "geste humain exigé (qui != auto/llm/jev)"}, 400)
        if (qui or "") == "moteur-dispatch" and not accepter_moteur:
            return ({"ok": False, "code": "validation_humaine_requise",
                     "erreur": "moteur-dispatch admis sur /conso seule"}, 400)
        return None

    # --- GET /stocks ---
    def stocks(self, logement_id):
        chemin = self._fichier(logement_id)
        if chemin is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        liste = lire_conso(chemin)
        for c in liste:
            c["statut"] = statut_conso(c)
            c["manque"] = manque(c)
        return {"ok": True, "logement_id": logement_id,
                "consommables": liste, "total": len(liste)}, 200

    # --- GET /courses /alertes ---
    def courses(self, logement_id):
        chemin = self._fichier(logement_id)
        if chemin is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        ruptures, bas = [], []
        for c in lire_conso(chemin):
            st = statut_conso(c)
            if st == "ok":
                continue
            ligne = {"id": c.get("id"), "label": c.get("label"),
                     "unite": c.get("unite", ""), "stock": c.get("stock", 0),
                     "cible": c.get("cible", 0), "a_acheter": manque(c),
                     "statut": st}
            (ruptures if st == "rupture" else bas).append(ligne)
        lignes = [f"{l['a_acheter']} {l['unite']} {l['label']}".strip()
                  for l in ruptures + bas]
        notif = ("courses : RAS (stocks OK)" if not lignes
                 else "courses : " + " ; ".join(lignes))
        return {"ok": True, "logement_id": logement_id,
                "ruptures": ruptures, "bas": bas,
                "total_articles": sum(l["a_acheter"] for l in ruptures + bas),
                "notif_hebdo": notif}, 200

    # --- POST /stock (création / màj, geste humain) ---
    def upsert_stock(self, p):
        err = self._verif_qui(p.get("qui", ""))
        if err:
            return err
        logement_id = p.get("logement_id", "")
        cid = p.get("id", "")
        chemin = self._fichier(logement_id)
        if chemin is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        if not cid or not SLUG_RE.fullmatch(cid):
            return {"ok": False, "erreur": "id invalide (slug seul)"}, 400
        items = lire_conso(chemin)
        for champ in ("stock", "seuil", "cible", "conso_rotation"):
            if champ in p and p[champ] not in ("", None):
                try:
                    v = int(p[champ])
                except (TypeError, ValueError):
                    return {"ok": False,
                            "erreur": f"{champ} entier >= 0"}, 400
                if v < 0:
                    return {"ok": False,
                            "erreur": f"{champ} entier >= 0"}, 400
                p[champ] = v
        cible = None
        for c in items:
            if c.get("id") == cid:
                for k in ("label", "stock", "unite", "seuil", "cible",
                          "conso_rotation"):
                    if k in p and p[k] not in ("", None):
                        c[k] = p[k]
                cible = c
                break
        if cible is None:
            cible = {"id": cid,
                     "label": p.get("label", cid),
                     "stock": p.get("stock", 0),
                     "unite": p.get("unite", ""),
                     "seuil": p.get("seuil", 0),
                     "cible": p.get("cible", 0),
                     "conso_rotation": p.get("conso_rotation", 0)}
            items.append(cible)
            code = 201
        else:
            code = 200
        cible["statut"] = statut_conso(cible)
        ecrire_conso(chemin, items)
        self.log_decision(logement_id, cid, p.get("qui", ""),
                          "stock_upsert",
                          f"stock={cible.get('stock')} seuil={cible.get('seuil')}")
        return {"ok": True, "cree": code == 201, "consommable": cible}, code

    # --- POST /conso (fin de rotation : décrémente, clamp 0) ---
    def conso(self, p):
        err = self._verif_qui(p.get("qui", ""), accepter_moteur=True)
        if err:
            return err
        logement_id = p.get("logement_id", "")
        chemin = self._fichier(logement_id)
        if chemin is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        items = lire_conso(chemin)
        cid = p.get("id", "")
        tous = bool(p.get("tous", False))
        if not tous:
            if not cid or not SLUG_RE.fullmatch(cid):
                return {"ok": False, "erreur": "id ou tous=true requis"}, 400
            items = [c for c in items if c.get("id") == cid]
            if not items:
                return {"ok": False, "erreur": "consommable inconnu"}, 404
        else:
            if not items:
                return {"ok": False, "erreur": "registre vide"}, 404
        touches = []
        for c in items:
            try:
                conso = int(c.get("conso_rotation", 0))
            except (TypeError, ValueError):
                conso = 0
            avant = int(c.get("stock", 0) or 0)
            c["stock"] = max(0, avant - max(0, conso))
            c["statut"] = statut_conso(c)
            touches.append({"id": c.get("id"), "avant": avant,
                            "stock": c["stock"], "statut": c["statut"]})
        # Lecture-modification-écriture atomique par fichier : on recharge le
        # registre complet et on applique les nouveaux stocks calculés.
        registre = lire_conso(chemin)
        par_id = {t["id"]: t["stock"] for t in touches}
        for c in registre:
            if c.get("id") in par_id:
                c["stock"] = par_id[c["id"]]
        ecrire_conso(chemin, registre)
        self.log_decision(logement_id, cid or "tous", p.get("qui", ""),
                          "stocks_conso",
                          f"rotation : {len(touches)} articles décrémentés")
        obj, _ = self.courses(logement_id)
        return {"ok": True, "logement_id": logement_id,
                "consommables": touches,
                "courses_auto": {"ruptures": obj["ruptures"],
                                 "bas": obj["bas"],
                                 "notif_hebdo": obj["notif_hebdo"]}}, 200

    # --- POST /reassort (achat livré : stock remis à cible) ---
    def reassort(self, p):
        err = self._verif_qui(p.get("qui", ""))
        if err:
            return err
        logement_id = p.get("logement_id", "")
        chemin = self._fichier(logement_id)
        if chemin is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        registre = lire_conso(chemin)
        cid = p.get("id", "")
        if p.get("tous", False):
            cibles = registre
        else:
            if not cid or not SLUG_RE.fullmatch(cid):
                return {"ok": False, "erreur": "id ou tous=true requis"}, 400
            cibles = [c for c in registre if c.get("id") == cid]
            if not cibles:
                return {"ok": False, "erreur": "consommable inconnu"}, 404
        remis = []
        for c in cibles:
            try:
                cible = max(0, int(c.get("cible", 0)))
            except (TypeError, ValueError):
                cible = 0
            c["stock"] = cible
            remis.append({"id": c.get("id"), "stock": cible})
        ecrire_conso(chemin, registre)
        self.log_decision(logement_id, cid or "tous", p.get("qui", ""),
                          "stocks_reassort",
                          f"{len(remis)} articles remis à cible")
        return {"ok": True, "logement_id": logement_id,
                "remis_a_cible": remis}, 200


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
        if chemin == "/stocks":
            obj, code = m.stocks(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/courses":
            obj, code = m.courses(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/alertes":
            obj, code = m.courses(self._qs().get("logement_id", ""))
            obj = {"ok": obj["ok"], "logement_id": obj.get("logement_id"),
                   "ruptures": obj.get("ruptures"),
                   "bas": obj.get("bas")} if obj.get("ok") else obj
            return _reponse(self, code, obj)
        return _reponse(self, 404, {"ok": False, "erreur": "route inconnue"})

    def do_POST(self):
        import urllib.parse as up
        chemin = up.urlsplit(self.path).path
        m = self.moteur
        p = self._corps()
        if chemin == "/stock":
            obj, code = m.upsert_stock(p)
            return _reponse(self, code, obj)
        if chemin == "/conso":
            obj, code = m.conso(p)
            return _reponse(self, code, obj)
        if chemin == "/reassort":
            obj, code = m.reassort(p)
            return _reponse(self, code, obj)
        return _reponse(self, 404, {"ok": False, "erreur": "route inconnue"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--stocks", default="../grocy-stocks")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()
    cfg = charger_yaml_plat(args.config)
    port = int(os.environ.get("LCD_HTTP_PORT") or cfg.get("http_port", 8099))
    bind = os.environ.get("LCD_BIND") or cfg.get("bind", "127.0.0.1")
    Handler.moteur = Stocks(cfg, args.logements, args.stocks)
    if not args.serve:
        print(json.dumps({"ok": True, "port": port}, ensure_ascii=False))
        return
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"stocks :8099 sur {bind}:{port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
