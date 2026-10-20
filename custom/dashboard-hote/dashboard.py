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
            # ADR-007 : runtime par système, "ha" par défaut, "moli" possible.
            systems.append({"id": val, "nom": val, "runtime": "ha"})
            continue
        if section == "systems" and "nom:" in ligne and systems:
            systems[-1]["nom"] = ligne.split("nom:", 1)[1].strip().strip("\"'")
            continue
        if section == "systems" and "runtime:" in ligne and systems:
            # Clé optionnelle `runtime: "moli"` par système (défaut "ha").
            systems[-1]["runtime"] = ligne.split(
                "runtime:", 1)[1].strip().strip("\"'")
            continue
        # F6 multi-box : une entrée système peut surcharger les URLs
        # globales (`pricing/decision/dispatch/router/homeassistant/moli`)
        # pour CE système uniquement — une box lointaine a ses moteurs
        # sur d'autres hôtes/ports. Clés absentes => URLs globales (inchangé).
        if section == "systems" and systems and ligne.startswith((" ", "\t")):
            cle_syst = ligne.strip().split(":", 1)[0].strip()
            if cle_syst in ("pricing", "decision", "dispatch", "router",
                            "homeassistant", "moli"):
                val_syst = ligne.split(":", 1)[1].strip().strip("\"'")
                systems[-1].setdefault("urls", {})[cle_syst] = val_syst
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
        # logement_id -> epoch seconds du dernier contact COMPLET moteur
        # pricing réussi (horloge de fraîcheur : un moteur mort ne la rafraîchit
        # jamais — voir apercu()).
        self._vu = {}

    def _ids(self):
        return [s.get("id") for s in self.systems]

    def _runtime(self, logement_id):
        """Runtime de la box (ADR-007) : `"moli"` ou `"ha"` (défaut)."""
        for s in self.systems:
            if s.get("id") == logement_id:
                return s.get("runtime") or "ha"
        return "ha"

    def _url(self, logement_id, cle):
        """URL effective pour (logement_id, cle) : override par système si
        présent dans la config (`systems[i].<cle>`), sinon `urls:` global.

        Permet à une box lointaine (ex. box-nord) d'avoir SES moteurs sur
        d'autres hôtes/ports sans impacter les autres systèmes (F6).
        """
        for s in self.systems:
            if s.get("id") == logement_id:
                v = (s.get("urls") or {}).get(cle)
                if v:
                    return v
                break
        return self.urls.get(cle, "")

    def runtime_vivant(self, logement_id):
        """Santé du runtime de la box : {"runtime", "vivant", "version"}.

        - `moli` : `GET {moli}/api/health` (override par système sinon
          `urls.moli`), vivant si code 200 + réponse dict +
          `name == "moli-os"` ; version = `response["version"]`.
        - `ha` (défaut) : probe HA via `ha_vivante()` (url
          `homeassistant` du système, sinon globale — inchangée).
        """
        rt = self._runtime(logement_id)
        if rt == "moli":
            code, rep = appeler(
                "GET", self._url(logement_id, "moli").rstrip("/")
                + "/api/health")
            d = rep if isinstance(rep, dict) else None
            vivant = bool(code == 200 and d is not None
                          and d.get("name") == "moli-os")
            version = d.get("version") if d is not None else None
            return {"runtime": rt, "vivant": vivant,
                    "version": str(version) if version is not None else None}
        return {"runtime": rt,
                "vivant": ha_vivante(self._url(logement_id,
                                               "homeassistant")),
                "version": None}

    def apercu(self, logement_id):
        if logement_id not in self._ids():
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        _, reco = appeler(
            "GET", self._url(logement_id, "pricing") + "/reco-ota?"
            + urllib.parse.urlencode({"logement_id": logement_id}))
        brut_grille = (reco.get("grille_7j", [])
                       if isinstance(reco, dict) else [])
        grille = brut_grille if isinstance(brut_grille, (list, tuple)) else []
        _, jl = appeler(
            "GET", self._url(logement_id, "decision") + "/journal?"
            + urllib.parse.urlencode({"logement_id": logement_id,
                                      "qui": self.qui}))
        entrees = jl.get("entrees", []) if isinstance(jl, dict) else []
        if not isinstance(entrees, (list, tuple)):
            entrees = []
        _, td = appeler(
            "GET", self._url(logement_id, "dispatch") + "/todos?"
            + urllib.parse.urlencode({"logement_id": logement_id}))
        dossiers = td.get("dossiers", []) if isinstance(td, dict) else []
        if not isinstance(dossiers, (list, tuple)):
            dossiers = []
        _, routes = appeler("GET", self._url(logement_id, "router") + "/routes")
        # Pinces de lecture de secours (F6) : chaque moteur vaut « ok » si sa
        # clé de réponse attendue est présente (grille non vide pour pricing),
        # sinon « injoignable ». La page reste rendue : dégradation VISIBLE
        # par section, jamais de page blanche/échec.
        moteurs = {
            "pricing": "ok" if brut_grille else "injoignable",
            "decision": ("ok" if isinstance(jl, dict) and "total" in jl
                         else "injoignable"),
            "dispatch": ("ok" if isinstance(td, dict) and "dossiers" in td
                         else "injoignable"),
            "router": ("ok" if isinstance(routes, dict)
                       and "primaire" in routes else "injoignable"),
        }
        # journal_total est TOUJOURS un int (0 si le moteur a renvoyé
        # autre chose — coercion d'urgence, jamais de None/str en JSON).
        total = jl.get("total", 0) if isinstance(jl, dict) else 0
        if isinstance(total, bool) or not isinstance(total, int):
            total = 0
        if moteurs["pricing"] == "ok":
            # Un moteur mort ne rafraîchit PAS last_seen : seul un contact
            # pricing complet et réussi avance l'horloge.
            self._vu[logement_id] = time.time()
        vu = self._vu.get(logement_id)
        last_seen = (time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(vu))
                     if vu is not None else None)
        rv = self.runtime_vivant(logement_id)
        return 200, {"logement_id": logement_id,
                     "prix_7j": grille[:7],
                     "journal_total": total,
                     "dernieres": [
                         {"ts": e.get("ts"), "ref": e.get("ref"),
                          "qui": e.get("qui"), "quoi": e.get("quoi")}
                         for e in entrees[:5] if isinstance(e, dict)],
                     "todos": [
                         {"dossier": d.get("dossier"),
                          "statut": d.get("statut"),
                          "deadline": d.get("deadline")}
                         for d in dossiers if isinstance(d, dict)],
                     "routage_primaire": routes.get("primaire", "")
                     if isinstance(routes, dict) else "",
                     "moteurs": moteurs,
                     "last_seen": last_seen,
                     "runtime": rv["runtime"],
                     "runtime_vivant": rv["vivant"],
                     "runtime_version": rv["version"],
                     # clé conservée pour compat arrière : le booléen du
                     # runtime (ha par défaut, moli via ADR-007).
                     "ha_vivante": rv["vivant"]}

    def page(self):
        h = html.escape
        cartes = []
        degrade = False   # ANY runtime injoignable -> bandeau global F6
        for sys in self.systems:
            code, ap = self.apercu(sys.get("id"))
            if code != 200:
                cartes.append(f"<section><h2>{h(sys.get('nom', '?'))}</h2>"
                              "<p>indisponible</p></section>")
                continue
            if ap.get("runtime_vivant") is False:
                degrade = True
            mot = ap.get("moteurs") or {}
            # Bandeau de fraîcheur par section : runtime + pricing + last_seen.
            ligne_runtime = (
                f"<p>Runtime {h(str(ap.get('runtime', 'ha')))} : "
                f"{'vivant' if ap.get('runtime_vivant') else 'injoignable'}"
                f" — moteur pricing : "
                f"{h(str(mot.get('pricing', 'injoignable')))}"
                f" — last_seen : "
                f"{h(str(ap.get('last_seen') or 'jamais'))}</p>")
            # Ligne d'état moteur par moteur (pinces de lecture de secours).
            ligne_moteurs = "<p>Moteurs — " + " — ".join(
                f"{h(str(k))} : {h(str(mot.get(k, 'injoignable')))}"
                for k in ("pricing", "decision", "dispatch", "router")) + "</p>"
            lignes_prix = "".join(
                f"<tr><td>{h(str(j[0]))}</td><td>{h(str(j[1]))} €</td></tr>"
                for j in ap["prix_7j"]
                if isinstance(j, (list, tuple)) and len(j) >= 2)
            if not lignes_prix:
                # Jamais de tableau vide : la pince s'affiche DANS la section.
                lignes_prix = ("<tr><td colspan='2'>"
                               "(pricing injoignable)</td></tr>")
            p0 = ap["prix_7j"][0] if ap["prix_7j"] else None
            premier = (h(str(p0[1])) + " €"
                       if isinstance(p0, (list, tuple)) and len(p0) >= 2
                       else "—")
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
            if ap.get("runtime", "ha") == "ha":
                # Formulation d'origine conservée pour le runtime HA.
                sante = ("HA : vivante" if ap.get("ha_vivante")
                         else "HA : injoignable")
            else:
                sante = (f"{h(str(ap['runtime']))} : vivant"
                         if ap.get("ha_vivante")
                         else f"{h(str(ap['runtime']))} : injoignable")
            cartes.append(
                f"<section><h2>{h(sys.get('nom', '?'))}</h2>"
                f"{ligne_runtime}"
                f"<p>Prix direct 7 j (1er jour : {premier})"
                f" — journal : {ap['journal_total']} entrées</p>"
                f"{ligne_moteurs}"
                f"<table><tr><th>jour</th><th>pivot</th></tr>"
                f"{lignes_prix}</table>"
                f"<h3>Dernières entrées journal</h3><ul>{lignes_jl}</ul>"
                f"<h3>Ménage (todos)</h3><ul>{lignes_td}</ul>"
                f"<p>Routage LLM : {h(str(ap['routage_primaire']))} — "
                f"{sante}</p>"
                f"<p><a href='/api/apercu?logement_id="
                f"{h(sys.get('id', ''))}'>JSON</a></p></section>")
        # Bandeau global de dégradation : précède les cartes, affiché si un
        # seul runtime est injoignable ; absent si tout est vivant.
        bandeau = ""
        if degrade:
            bandeau = ("<section class='degradation'><p><strong>"
                       "Box partiellement injoignable</strong> — page "
                       "dégradé, jamais blanc (détail par carte : runtime, "
                       "moteurs, last_seen).</p></section>")
        return ("<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'>"
                "<meta http-equiv='refresh' content='120'>"
                "<title>LCD — Pilotage</title></head><body>"
                "<h1>LCD — Vue d'ensemble (lecture seule)</h1>"
                + bandeau + "".join(cartes) +
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
