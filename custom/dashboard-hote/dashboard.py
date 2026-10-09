#!/usr/bin/env python3
# custom/dashboard-hote/dashboard.py — dashboard pilote lecture seule :8060
# (P1-13/P2-9, part lab-testable). L'interface de gestion est AU-DESSUS de HA :
# HA = hub local par box (appareils/automatisations) ; ce dashboard parle aux
# MOTEURS (prix, journal, todos, routage) et restera multi-logements/multi-box
# (systems: en config). PWA voyageur/presta = autre étage (jamais HA direct).
# Agrégation CÔTÉ SERVEUR (HTML sans JS, pas de CORS) + AUCUNE écriture :
# jamais de PIN, jamais de secret, jamais d'action (v1 lecture seule).
# Stdlib seule. 0 € logiciel.
import argparse
import html
import json
import os
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI_DEFAUT = "dashboard_hote"


def charger_yaml_plat(path):
    """Sous-ensemble YAML suffisant (clés plates + systems: + urls:)."""
    cfg, systems, urls, section = {}, [], {}, ""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.read().splitlines()
    except FileNotFoundError:
        return cfg, systems, urls
    for ligne in lignes:
        if not ligne.strip() or ligne.strip().startswith("#"):
            continue
        if not ligne.startswith((" ", "\t")) and ligne.rstrip().endswith(":"):
            section = ligne.strip()[:-1]
            continue
        if section == "systems" and "- id:" in ligne:
            val = ligne.split("- id:", 1)[1].strip().strip("\"'")
            systems.append({"id": val, "nom": val})
            continue
        if section == "systems" and "nom:" in ligne and systems:
            systems[-1]["nom"] = ligne.split("nom:", 1)[1].strip().strip("\"'")
            continue
        if section == "urls" and ":" in ligne:
            k, v = [x.strip().strip("\"'") for x in ligne.split(":", 1)]
            urls[k] = v
            continue
        if ":" in ligne and not ligne.startswith((" ", "\t")):
            k, v = [x.strip().strip("\"'") for x in ligne.split(":", 1)]
            try:
                cfg[k] = int(v)
            except ValueError:
                cfg[k] = v
    return cfg, systems, urls


def appeler(methode, url, payload=None, timeout=10):
    try:
        data = (json.dumps(payload).encode("utf-8")
                if payload is not None else None)
        req = urllib.request.Request(
            url, data=data, headers={"Content-Type": "application/json"},
            method=methode)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except Exception as e:
        code = getattr(e, "code", 0) or 0
        try:
            return code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return code, {"erreur": str(e)[:120]}


def ha_vivante(url):
    try:
        urllib.request.urlopen(url.rstrip("/") + "/api/", timeout=5)
        return True
    except Exception as e:
        return getattr(e, "code", 0) == 401


class Moteur:
    def __init__(self, cfg, systems, urls, qui):
        self.cfg = cfg
        self.systems = systems or [{"id": "log1", "nom": "log1"}]
        self.urls = urls
        self.qui = qui or QUI_DEFAUT

    def _ids(self):
        return [s.get("id") for s in self.systems]

    def apercu(self, logement_id):
        if logement_id not in self._ids():
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        u = self.urls
        _, reco = appeler(
            "GET", u.get("pricing", "") + "/reco-ota?"
            + urllib.parse.urlencode({"logement_id": logement_id}))
        grille = reco.get("grille_7j", []) if isinstance(reco, dict) else []
        _, jl = appeler(
            "GET", u.get("decision", "") + "/journal?"
            + urllib.parse.urlencode({"logement_id": logement_id,
                                      "qui": self.qui}))
        entrees = jl.get("entrees", []) if isinstance(jl, dict) else []
        _, td = appeler(
            "GET", u.get("dispatch", "") + "/todos?"
            + urllib.parse.urlencode({"logement_id": logement_id}))
        dossiers = td.get("dossiers", []) if isinstance(td, dict) else []
        _, routes = appeler("GET", u.get("router", "") + "/routes")
        return 200, {"logement_id": logement_id,
                     "prix_7j": grille[:7],
                     "journal_total": jl.get("total", 0)
                     if isinstance(jl, dict) else 0,
                     "dernieres": [
                         {"ts": e.get("ts"), "ref": e.get("ref"),
                          "qui": e.get("qui"), "quoi": e.get("quoi")}
                         for e in entrees[:5]],
                     "todos": [
                         {"dossier": d.get("dossier"),
                          "statut": d.get("statut"),
                          "deadline": d.get("deadline")}
                         for d in dossiers],
                     "routage_primaire": routes.get("primaire", "")
                     if isinstance(routes, dict) else "",
                     "ha_vivante": ha_vivante(u.get("homeassistant", ""))}

    def page(self):
        h = html.escape
        cartes = []
        for sys in self.systems:
            code, ap = self.apercu(sys.get("id"))
            if code != 200:
                cartes.append(f"<section><h2>{h(sys.get('nom', '?'))}</h2>"
                              "<p>indisponible</p></section>")
                continue
            lignes_prix = "".join(
                f"<tr><td>{h(str(j[0]))}</td><td>{h(str(j[1]))} €</td></tr>"
                for j in ap["prix_7j"])
            lignes_jl = "".join(
                f"<li>{h(str(e.get('ts', '')))} — "
                f"{h(str(e.get('ref', '')))} "
                f"({h(str(e.get('qui', '')))} : "
                f"{h(str(e.get('quoi', '')))})</li>"
                for e in ap["dernieres"]) or "<li>—</li>"
            lignes_td = "".join(
                f"<li>{h(str(d.get('dossier', '')))} : "
                f"{h(str(d.get('statut', '')))} "
                f"(deadline {h(str(d.get('deadline', '')) )})</li>"
                for d in ap["todos"]) or "<li>—</li>"
            cartes.append(
                f"<section><h2>{h(sys.get('nom', '?'))}</h2>"
                f"<p>Prix direct 7 j (1er jour : "
                f"{h(str(ap['prix_7j'][0][1])) + ' €' if ap['prix_7j'] else '—'})"
                f" — journal : {ap['journal_total']} entrées</p>"
                f"<table><tr><th>jour</th><th>pivot</th></tr>"
                f"{lignes_prix}</table>"
                f"<h3>Dernières entrées journal</h3><ul>{lignes_jl}</ul>"
                f"<h3>Ménage (todos)</h3><ul>{lignes_td}</ul>"
                f"<p>Routage LLM : {h(str(ap['routage_primaire']))} — "
                f"HA : {'vivante' if ap['ha_vivante'] else 'injoignable'}</p>"
                f"<p><a href='/api/apercu?logement_id="
                f"{h(sys.get('id', ''))}'>JSON</a></p></section>")
        return ("<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'>"
                "<meta http-equiv='refresh' content='120'>"
                "<title>LCD — Pilotage</title></head><body>"
                "<h1>LCD — Vue d'ensemble (lecture seule)</h1>"
                + "".join(cartes) +
                "<footer>Dashboard pilote :8060 — lecture seule, jamais "
                "d'écriture/PIN/secret. HA = hub local par box ; PWA = "
                "autre étage.</footer></body></html>")


class Handler(BaseHTTPRequestHandler):
    engine = None

    def _json(self, code, obj):
        corps = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def _html(self, code, txt):
        corps = txt.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def log_message(self, *a):
        pass

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/":
            return self._html(200, self.engine.page())
        if url.path == "/api/apercu":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = self.engine.apercu(logement_id)
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD dashboard pilote :8060")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()
    cfg, systems, urls = charger_yaml_plat(args.config)
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8060)))
    bind = os.environ.get("LCD_BIND", "127.0.0.1")
    eng = Moteur(cfg, systems, urls,
                 os.environ.get("LCD_QUI", cfg.get("qui", QUI_DEFAUT)))
    if not args.serve:
        print(json.dumps({"systems": eng._ids(), "port": port},
                         ensure_ascii=False))
        return 0
    Handler.engine = eng
    print(f"dashboard-hote :{port} (lecture seule, "
          f"{len(eng._ids())} systeme(s))", flush=True)
    srv = ThreadingHTTPServer((bind, port), Handler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
