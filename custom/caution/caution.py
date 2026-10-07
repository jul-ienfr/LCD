#!/usr/bin/env python3
# custom/caution/caution.py — hold caution + taxe séjour Métropole NCA P2-11 (§12.3 + §12.5).
# 0 € : stdlib seule. Même LXC que ics-sync :8090 / pricing :8091 / decision :8092 /
# facturation :8093. Port :8094.
#
# Caution/hold ≠ prix, jamais dans le facial (§12.3) :
#   - direct : hold LIBRE 500-800 € (bornes global logements.yaml) via Swikly/Stripe
#     3D Secure ou TPE. PRÉ-AUTORISATION seule (hold) — aucun débit sans sinistre
#     réel + justificatifs (photos E/S + facture/devis).
#   - airbnb : hold HORS PLATEFORME INTERDIT (refus code 403) — AirCover seule
#     (Centre résolution 14 j ET avant voyageur suivant, photos E/S indispensables).
#   - booking : collecte SÉPARÉE déclarée Policies (TPE sur place ou lien déclaré),
#     JAMAIS la VCC (séjour seul, hold refusé insufficient funds + carte invalidée).
#   - abritel_vrbo : caution remboursable OU Damage Protection, jamais cumul.
# Info voyageur sous 48 h via messagerie plateforme avant tout débit ; restitution 7-14 j.
#
# Taxe de séjour Métropole NCA (§12.5) : log1 Saint-Laurent-du-Var ∈ Métropole Nice
# Côte d'Azur — taux + parts additionnelles À VÉRIFIER en mairie / portail taxe Métropole
# (OTA collectent, reversement hôte = 0 €, jamais double reversement) ; direct = vous collectez et déclarez sur portail Métropole.
# Calcul local informatif (jamais de reversement auto) : classe → base × (1+majoration) ;
# non classé → 5 % nuitée/pers. plafonné (+ majoration) ; exonérés : −18 ans,
# saisonniers employés commune, urgence/relogement.
#
# Le moteur ne débite JAMAIS : il prépare (hold), calcule (taxe), rappelle (délais).
# Tout débit/restitution = 1-tap HUMAINE (POST /debiter, /restituer).
# Secrets Swikly/Stripe : env SWIKLY_API_KEY/STRIPE_SECRET_KEY > secrets.yaml,
# jamais en dur, jamais commités, jamais loggués.
#
# Contrats :
#   GET  /health -> {"ok": true}
#   POST /hold {logement_id, ref_resa, canal, mode, montant} -> pré-autorisation
#   POST /debiter {logement_id, ref_resa, montant, justificatifs[], qui} -> 1-tap
#   POST /restituer {logement_id, ref_resa, qui} -> mainlevée 1-tap
#   GET  /hold?logement_id&ref_resa -> état hold
#   POST /taxe {logement_id, ref_resa, canal, classe, prix_nuitee, adultes, nuits,
#               mineurs, exoneration} -> calcul + qui reverse
#
# Usage : python3 caution.py --config config.yaml --logements ../logements.yaml [--serve]
#   env : LCD_SECRETS_YAML, LCD_HTTP_PORT, SWIKLY_API_KEY, STRIPE_SECRET_KEY.

import argparse
import datetime as dt
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def charger_yaml_plat(path):
    """Parseur YAML plat (niveau 0) — même convention que facturation."""
    data = {}
    try:
        with open(path, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne.strip() or ligne[0] in (" ", "\t"):
                    continue
                if ":" in ligne:
                    k, v = ligne.split(":", 1)
                    k, v = k.strip(), v.strip().strip("\"'")
                    if v.startswith("[") and v.endswith("]"):
                        data[k] = [x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
                    elif v in ("true", "false"):
                        data[k] = (v == "true")
                    elif re.fullmatch(r"-?\d+", v):
                        data[k] = int(v)
                    elif re.fullmatch(r"-?\d+\.\d+", v):
                        data[k] = float(v)
                    else:
                        data[k] = v
    except FileNotFoundError:
        pass
    return data


def lire_bornes(path):
    """Bornes hold global + majoration taxe séjour par logement depuis logements.yaml."""
    bornes = {"min": 500, "max": 800}
    major = {}
    try:
        with open(path, encoding="utf-8") as f:
            for brute in f:
                ligne = brute.split("#", 1)[0].rstrip("\n")
                if "hold_caution_min" in ligne and ":" in ligne:
                    bornes["min"] = int(ligne.split(":", 1)[1].strip())
                elif "hold_caution_max" in ligne and ":" in ligne:
                    bornes["max"] = int(ligne.split(":", 1)[1].strip())
                elif "taxe_sejour_majoration" in ligne and ":" in ligne:
                    try:
                        major["_last"] = float(ligne.split(":", 1)[1].strip())
                    except ValueError:
                        pass
                m = re.match(r"^  (log\d+):", ligne)
                if m and "_last" in major:
                    major[m.group(1)] = major.pop("_last")
    except FileNotFoundError:
        pass
    return bornes, major


class Caution:
    def __init__(self, cfg, bornes, majoration):
        self.cfg = cfg
        self.bornes = bornes
        self.majoration = majoration
        self.state_dir = cfg.get("state_dir", "./state")
        self.decision_dir = cfg.get("decision_log_dir", "./state")
        self.delai_min = cfg.get("delai_restitution_min_j", 7)
        self.delai_max = cfg.get("delai_restitution_max_j", 14)
        self.delai_info = cfg.get("delai_info_voyageur_h", 48)
        self.taxe_base = cfg.get("taxe_base_par_classe", {})
        self.taxe_maj = cfg.get("taxe_majoration", 0.44)
        self.taxe_pct = cfg.get("taxe_non_classe_pct", 0.05)
        self.taxe_plaf = cfg.get("taxe_non_classe_plafond", 4.60)
        self.modes = cfg.get("modes_par_canal", {})

    # --- holds ---
    def _chemin(self, logement_id, ref):
        d = os.path.join(self.state_dir, logement_id)
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, f"{ref}_hold.json")

    def _lire(self, logement_id, ref):
        try:
            with open(self._chemin(logement_id, ref), encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, ValueError):
            return None

    def _stocker(self, logement_id, ref, meta):
        with open(self._chemin(logement_id, ref), "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)

    def hold(self, logement_id, ref, canal, mode, montant):
        if canal == "airbnb":
            self.log_decision(logement_id, ref, "moteur-caution", "hold_refuse",
                              canal, montant, "Airbnb : hold hors plateforme INTERDIT (AirCover seule)")
            return 403, {"erreur": "Airbnb : hold hors plateforme INTERDIT — passer par "
                                    "Centre résolution + AirCover (14 j ET avant suivant)"}
        modes_ok = self.modes.get(canal, self.modes.get("direct", []))
        if mode not in modes_ok:
            return 400, {"erreur": f"mode {mode} non autorisé canal {canal} "
                                    f"(autorisés : {', '.join(modes_ok)})"}
        try:
            montant = float(montant)
        except (TypeError, ValueError):
            return 400, {"erreur": "montant numérique requis (EUR)"}
        if not (self.bornes["min"] <= montant <= self.bornes["max"]):
            return 422, {"erreur": f"montant {montant} hors bornes "
                                    f"[{self.bornes['min']}-{self.bornes['max']}] EUR "
                                    f"(proportionné, jamais inventé)"}
        meta = {"logement_id": logement_id, "ref_resa": ref, "canal": canal,
                "mode": mode, "montant": montant, "statut": "hold_prepare",
                "ts": utcnow_iso(),
                "rappel": f"pré-autorisation SEULE — restitution {self.delai_min}-{self.delai_max} j, "
                           f"info voyageur {self.delai_info} h avant tout débit"}
        self._stocker(logement_id, ref, meta)
        self.log_decision(logement_id, ref, "moteur-caution", "hold_prepare",
                          canal, montant, f"mode {mode}, restitution {self.delai_min}-{self.delai_max} j")
        return 200, meta

    def debiter(self, logement_id, ref, montant, justificatifs, qui):
        if not qui or qui.strip().lower() in ("auto", "llm", "jev", "moteur-caution",
                                              "moteur-direct", ""):
            return 400, {"erreur": "débit = 1-tap HUMAINE exigée (qui ≠ auto/llm/jev)"}
        meta = self._lire(logement_id, ref)
        if not meta:
            return 404, {"erreur": "aucun hold préparé pour cette résa"}
        if not justificatifs or len(justificatifs) < 1:
            return 422, {"erreur": "JAMAIS de débit sans justificatifs "
                                    "(photos E/S + facture/devis requis)"}
        meta.update({"statut": "debite", "montant_debite": montant,
                     "justificatifs": justificatifs,
                     "valide_par": qui, "ts_debit": utcnow_iso()})
        self._stocker(logement_id, ref, meta)
        self.log_decision(logement_id, ref, qui, "hold_debite",
                          meta["canal"], montant, f"{len(justificatifs)} justificatifs")
        return 200, meta

    def restituer(self, logement_id, ref, qui):
        if not qui or qui.strip().lower() in ("auto", "llm", "jev", "moteur-caution",
                                              "moteur-direct", ""):
            return 400, {"erreur": "restitution = 1-tap HUMAINE exigée"}
        meta = self._lire(logement_id, ref)
        if not meta:
            return 404, {"erreur": "aucun hold préparé pour cette résa"}
        meta.update({"statut": "restitue", "valide_par": qui,
                     "ts_restitution": utcnow_iso()})
        self._stocker(logement_id, ref, meta)
        self.log_decision(logement_id, ref, qui, "hold_restitue",
                          meta["canal"], meta["montant"], "mainlevée hold")
        return 200, meta

    # --- taxe séjour ---
    def taxe(self, logement_id, ref, canal, classe, prix_nuitee, adultes, nuits,
             mineurs=0, exoneration=""):
        maj = self.majoration.get(logement_id, self.taxe_maj)
        try:
            adultes, nuits = int(adultes), int(nuits)
            prix = float(prix_nuitee)
            classe = int(classe) if classe else 0
        except (TypeError, ValueError):
            return 400, {"erreur": "classe/prix_nuitee/adultes/nuits numériques requis"}
        if classe in (self.taxe_base if isinstance(self.taxe_base, dict) else {}):
            base = float(self.taxe_base[classe])
        elif isinstance(self.taxe_base, dict) and str(classe) in self.taxe_base:
            base = float(self.taxe_base[str(classe)])
        else:
            base = min(prix * self.taxe_pct, self.taxe_plaf)
        par_nuit_adulte = round(base * (1 + maj), 2)
        payants = max(adultes - int(mineurs or 0), 0)
        total = round(par_nuit_adulte * payants * max(nuits, 0), 2)
        ota_collecte = canal in ("airbnb", "booking", "abritel_vrbo", "expedia")
        res = {"logement_id": logement_id, "ref_resa": ref, "canal": canal,
               "par_nuit_adulte": par_nuit_adulte, "nuits": nuits,
               "adultes_payants": payants, "total": total,
               "collecte_par": "plateforme (reversement hôte 0 €, jamais double)"
                               if ota_collecte else "hôte — déclarer portail taxe Métropole NCA",
               "reversement_hote": 0.0 if ota_collecte else total}
        if exoneration:
            res["exoneration"] = exoneration
        self.log_decision(logement_id, ref, "moteur-caution", "taxe_calculee",
                          canal, total, res["collecte_par"])
        return 200, res

    def log_decision(self, logement_id, ref, qui, quoi, canal, montant, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": canal,
                 "commission": None, "net_hote": montant, "motif": motif}
        os.makedirs(self.decision_dir, exist_ok=True)
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")


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
        if url.path == "/hold":
            logement_id = qs.get("logement_id", [""])[0]
            ref = qs.get("ref_resa", [""])[0]
            if not (logement_id and ref):
                return self._json(400, {"erreur": "logement_id + ref_resa requis"})
            meta = eng._lire(logement_id, ref)
            if not meta:
                return self._json(404, {"erreur": "aucun hold pour cette résa"})
            return self._json(200, meta)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        import urllib.parse
        url = urllib.parse.urlparse(self.path)
        p, err = self._lire_json()
        if err:
            return self._json(400, {"erreur": err})
        eng = self.engine
        if url.path == "/hold":
            if not (p.get("logement_id") and p.get("ref_resa")):
                return self._json(400, {"erreur": "logement_id + ref_resa + canal + mode + montant requis"})
            code, obj = eng.hold(p["logement_id"], p["ref_resa"], p.get("canal", "direct"),
                                 p.get("mode", "swikly"), p.get("montant", 600))
            return self._json(code, obj)
        if url.path == "/debiter":
            code, obj = eng.debiter(p.get("logement_id", ""), p.get("ref_resa", ""),
                                    p.get("montant", 0), p.get("justificatifs", []),
                                    p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/restituer":
            code, obj = eng.restituer(p.get("logement_id", ""), p.get("ref_resa", ""),
                                      p.get("qui", ""))
            return self._json(code, obj)
        if url.path == "/taxe":
            code, obj = eng.taxe(p.get("logement_id", ""), p.get("ref_resa", ""),
                                 p.get("canal", "direct"), p.get("classe", 0),
                                 p.get("prix_nuitee", 0), p.get("adultes", 0),
                                 p.get("nuits", 0), p.get("mineurs", 0),
                                 p.get("exoneration", ""))
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD caution + taxe séjour Métropole NCA P2-11")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()

    cfg = charger_yaml_plat(args.config)
    try:
        with open(args.config, encoding="utf-8") as f:
            brut = f.read()
        m = re.search(r"^taxe_base_par_classe:\s*\{(.*?)\}", brut, re.M | re.S)
        if m:
            cfg["taxe_base_par_classe"] = {
                int(k.strip()): float(v.strip())
                for k, v in (e.split(":") for e in m.group(1).split(",") if ":" in e)}
        m2 = re.search(r"^modes_par_canal:\s*\n((?:  \w+:.*\n?)+)", brut, re.M)
        if m2:
            modes = {}
            for ligne in m2.group(1).splitlines():
                k, v = ligne.strip().split(":", 1)
                v = v.strip().strip("[]")
                modes[k.strip()] = [x.strip() for x in v.split(",") if x.strip()]
            cfg["modes_par_canal"] = modes
    except FileNotFoundError:
        print(f"config introuvable: {args.config}", file=sys.stderr)
        return 2
    base = os.path.dirname(os.path.abspath(args.config))
    for cle in ("state_dir", "decision_log_dir"):
        val = cfg.get(cle, "")
        if val and not os.path.isabs(val):
            cfg[cle] = os.path.normpath(os.path.join(base, val))
    bornes, majoration = lire_bornes(args.logements)
    eng = Caution(cfg, bornes, majoration)
    if not args.serve:
        print(json.dumps({"bornes_hold_EUR": bornes,
                           "delai_restitution_j": [eng.delai_min, eng.delai_max],
                           "taxe_majoration": eng.taxe_maj}, ensure_ascii=False))
        return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8094)))
    Handler.engine = eng
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # lab Docker : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"caution :8094 (hold {bornes['min']}-{bornes['max']} EUR, taxe NCA +{eng.taxe_maj:.0%})",
          flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
