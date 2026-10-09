#!/usr/bin/env python3
# custom/booking-direct/booking_direct.py — tunnel direct maison P2-15 (§4-bis).
# 0 € : stdlib seule. Même LXC que ics-sync :8090 / pricing :8091. Port :8095.
#
# Cible Phase 2+ (`moteur_direct: maison`) : remplace QloApps transitoire Phase 1.
# Même interface générique stable (§4-bis) — HA/decision-engine/PWA/pricing/ics-sync
# ne parlent JAMAIS au moteur en dur : bascule = 1 flag, 0 automation à réécrire.
# QloApps gardé en fallback 1 mois après bascule (recette 1 séjour témoin avant).
#
# MVP (§4-bis + P2-15) :
#   - catalogue : logements + extras (mini-bar/upsells §5.6-ter, prix TTC affichés
#     avant résa §12.2) servis depuis logements.yaml (+ catalogue extras local).
#   - dispo : proxy GET /dispo ics-sync (jamais de calendrier propre parallèle).
#   - devis : proxy pricing-engine (pivot direct + prix_canal direct + bornes).
#   - Checkout Stripe : PRÉPARÉ seul (lien Checkout à valider 1-tap humaine,
#     jamais d'encaissement auto — clés test sur box, prod après recette).
#   - hold caution : via caution :8094 (Swikly/Stripe/TPE, jamais ici en dur).
#   - contrat/facture : via facturation :8093 (brouillon -> valide 1-tap).
#   - ICS export : chaque résa directe confirmée -> fichier .ics (vitrines qui
#     importent, sinon stop-sell manuel — jamais de double saisie, §4-ter).
#   - POST natif : résa confirmée -> POST /resa-direct ics-sync (même LXC,
#     idempotence par ref) + `src` vitrine conservé (?src=<vitrine>, P2-12).
#
# Règles inviolables :
#   - bornes 75/290 : devis hors bornes = 422, jamais forcé (dérogation = humain
#     via pricing, jamais ici).
#   - copro.verifiee=false : devis/confirmation BLOQUÉS (mise en ligne interdite).
#   - jamais d'écriture OTA (reco 1-tap seule) ; jamais de PIN généré ici
#     (KeyMaster/decision-engine seuls) ; secrets env > secrets.yaml, jamais en dur.
#
# Contrats :
#   GET  /health -> {"ok": true, "moteur": "maison"}
#   GET  /catalogue?logement_id=log1 -> {logement, extras[], prix_base, bornes}
#   GET  /dispo?logement_id&debut&fin -> proxy ics-sync
#   POST /devis {logement_id, debut, fin, voyageurs, extras[], src?} -> {pivot, total, bornes_ok}
#   POST /resa {logement_id, debut, fin, voyageurs, langue, heure_arrivee, montant,
#               extras[], src?, qui} -> crée BROUILLON (1-tap humaine pour confirmer)
#   POST /confirmer {logement_id, ref, qui} -> 1-tap HUMAINE -> POST ics-sync + ICS + contrat
#   GET  /ics?logement_id&ref -> fichier .ics de la résa (export vitrines)
#
# Usage : python3 booking_direct.py --config config.yaml --logements ../logements.yaml [--serve]
#   env : LCD_SECRETS_YAML, LCD_HTTP_PORT, LCD_ICS_URL, LCD_PRICING_URL,
#         LCD_CAUTION_URL, LCD_FACTURATION_URL, STRIPE_SECRET_KEY.

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def charger_yaml_plat(path):
    """Parseur YAML plat (niveau 0) — même convention que les 5 autres moteurs."""
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


def lire_logements(path):
    """Extrait par logement : identité + pricing + copro + ménage + features."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    logts = {}
    cur = None
    section = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        cle = ligne.strip()
        if indent == 2 and re.fullmatch(r"log\d+:", cle):
            cur = cle[:-1]
            logts[cur] = {}
            section = None
            continue
        if indent == 2 and cle.endswith(":"):
            if cur and cle[:-1] not in ("pricing", "copro", "menage", "features",
                                        "moteur_direct", "zones"):
                cur = None
            section = None
            continue
        if cur is None:
            continue
        if indent == 4 and cle.endswith(":") and ":" not in cle[:-1]:
            section = cle[:-1] if cle[:-1] in ("pricing", "copro", "menage", "features") else None
            continue
        if ":" not in ligne:
            continue
        k, v = ligne.strip().split(":", 1)
        k, v = k.strip(), v.strip().strip("\"'")
        if v in ("true", "false"):
            v = (v == "true")
        elif re.fullmatch(r"-?\d+", v):
            v = int(v)
        elif re.fullmatch(r"-?\d+\.\d+", v):
            v = float(v)
        if k in ("nom", "commune", "logement_id", "capacite", "surface_m2",
                   "moteur_direct", "zones", "zone_defaut"):
            logts[cur][k] = v
        elif section:
            logts[cur].setdefault(section, {})[k] = v
    return logts


def _proxy_erreur(e):
    """HTTPError -> vrai code + corps JSON ; réseau -> code 0."""
    code = getattr(e, "code", 0) or 0
    try:
        return code, json.loads(e.read() or b"{}")
    except Exception:
        return code, {"erreur": f"proxy_ko:{type(e).__name__}"}


def proxy_get(url, timeout=10):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as r:
            return r.status, json.loads(r.read() or b"{}")
    except Exception as e:
        return _proxy_erreur(e)


def proxy_post(url, payload, timeout=15):
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"),
                                     headers={"Content-Type": "application/json"},
                                     method="POST")
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read() or b"{}")
    except Exception as e:
        return _proxy_erreur(e)


class BookingDirect:
    def __init__(self, cfg, logts, extras):
        self.cfg = cfg
        self.logts = logts
        self.extras = extras
        self.state_dir = cfg.get("state_dir", "./state")
        self.decision_dir = cfg.get("decision_log_dir", "./state")
        os.makedirs(self.state_dir, exist_ok=True)
        os.makedirs(self.decision_dir, exist_ok=True)
        base = "http://127.0.0.1"
        self.url_ics = os.environ.get("LCD_ICS_URL", cfg.get("ics_url", f"{base}:8090"))
        self.url_pricing = os.environ.get("LCD_PRICING_URL", cfg.get("pricing_url", f"{base}:8091"))
        self.url_facturation = os.environ.get("LCD_FACTURATION_URL",
                                              cfg.get("facturation_url", f"{base}:8093"))
        self.url_caution = os.environ.get("LCD_CAUTION_URL",
                                          cfg.get("caution_url", f"{base}:8094"))
        self.stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")

    # --- état brouillons ---
    def _chemin(self, logement_id, ref):
        d = os.path.join(self.state_dir, logement_id)
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, f"{ref}.json")

    def _lire(self, logement_id, ref):
        try:
            with open(self._chemin(logement_id, ref), encoding="utf-8") as f:
                return json.load(f)
        except (FileNotFoundError, ValueError):
            return None

    def _stocker(self, logement_id, ref, meta):
        cible = self._chemin(logement_id, ref)
        tmp = cible + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(meta, f, ensure_ascii=False, indent=2)
        os.replace(tmp, cible)

    def log_decision(self, logement_id, ref, qui, quoi, montant, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": "direct",
                 "commission": 0.0, "net_hote": montant, "motif": motif}
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")

    # --- catalogue ---
    def catalogue(self, logement_id):
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        pr = l.get("pricing", {})
        return 200, {"logement_id": logement_id, "nom": l.get("nom"),
                     "commune": l.get("commune"), "capacite": l.get("capacite"),
                     "prix_base": pr.get("prix_base"), "prix_min": pr.get("prix_min"),
                     "prix_max": pr.get("prix_max"),
                     "menage": l.get("menage", {}), "extras": self.extras,
                     "copro_verifiee": l.get("copro", {}).get("verifiee", False)}

    # --- dispo (proxy ics-sync, jamais de calendrier parallèle) ---
    def dispo(self, logement_id, debut, fin):
        import urllib.parse
        q = urllib.parse.urlencode({"logement_id": logement_id, "debut": debut, "fin": fin})
        return proxy_get(f"{self.url_ics}/dispo?{q}")

    # --- devis (proxy pricing pivot direct + extras + ménage) ---
    def devis(self, logement_id, debut, fin, voyageurs, extras_ids, src=""):
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not l.get("copro", {}).get("verifiee", False):
            self.log_decision(logement_id, f"devis-{debut}", "moteur-direct",
                              "devis_bloque", None, "BLOQUÉ copro.verifiee=false")
            return 403, {"erreur": "copro.verifiee=false : mise en ligne BLOQUÉE"}
        try:
            nuits = (dt.date.fromisoformat(fin) - dt.date.fromisoformat(debut)).days
        except ValueError:
            return 400, {"erreur": "debut/fin AAAA-MM-JJ requis"}
        if nuits < 1:
            return 400, {"erreur": "fin > debut requis (≥1 nuit)"}
        import urllib.parse
        jour0 = dt.date.fromisoformat(debut)
        pivots = []
        for i in range(nuits):
            jour = (jour0 + dt.timedelta(days=i)).isoformat()
            q = urllib.parse.urlencode({"logement_id": logement_id, "date": jour})
            code, px = proxy_get(f"{self.url_pricing}/prix?{q}")
            if code != 200:
                return 502, {"erreur": "pricing indisponible", "detail": px}
            pivot_j = px.get("pivot")
            if pivot_j is None:
                return 502, {"erreur": "pricing sans pivot", "detail": px}
            pivots.append(float(pivot_j))
        pr = l.get("pricing", {})
        pmin, pmax = pr.get("prix_min", 75), pr.get("prix_max", 290)
        for pivot_j in pivots:
            if not (pmin <= pivot_j <= pmax):
                return 422, {"erreur": f"pivot {pivot_j} hors bornes logement "
                                        f"[{pmin}-{pmax}]"}
        pivot = round(sum(pivots) / len(pivots), 2)
        nuitees = round(sum(pivots), 2)
        extras_lignes = []
        total_extras = 0.0
        for eid in (extras_ids or []):
            e = self.extras.get(eid)
            if not e:
                return 400, {"erreur": f"extra inconnu: {eid}"}
            extras_lignes.append({"id": eid, "nom": e["nom"], "prix_ttc": e["prix_ttc"]})
            total_extras += float(e["prix_ttc"])
        menage = l.get("menage", {})
        supplement_menage = float(menage.get("montant", 0) or 0) \
            if menage.get("facturation") == "supplement" else 0.0
        total = round(nuitees + total_extras + supplement_menage, 2)
        res = {"logement_id": logement_id, "debut": debut, "fin": fin, "nuits": nuits,
               "voyageurs": voyageurs, "pivot_nuit": pivot, "pivots": pivots,
               "nuitees": nuitees, "extras": extras_lignes,
               "menage_supplement": supplement_menage, "total_ttc": total,
               "taxe_sejour": "hors CA, calculée à la résa (moteur caution, Métropole NCA)",
               "src": src or ""}
        self.log_decision(logement_id, f"devis-{debut}", "moteur-direct",
                          "devis_calcule", total,
                          f"{nuits}n pivots {pivots} + extras {total_extras} + menage "
                          f"{supplement_menage}" + (f" src={src}" if src else ""))
        return 200, res

    # --- résa : crée BROUILLON, confirmation 1-tap humaine ---
    def resa(self, p):
        for champ in ("logement_id", "debut", "fin"):
            if not p.get(champ):
                return 400, {"erreur": f"champ manquant: {champ}"}
        logement_id = p["logement_id"]
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not self.logts[logement_id].get("copro", {}).get("verifiee", False):
            return 403, {"erreur": "copro.verifiee=false : mise en ligne BLOQUÉE"}
        ref = p.get("ref") or f"DIR-{dt.date.today():%Y%m%d}-{os.urandom(2).hex().upper()}"
        if self._lire(logement_id, ref):
            return 200, {"statut": "deja_enregistree", "ref": ref}
        code, dv = self.devis(logement_id, p["debut"], p["fin"],
                              p.get("voyageurs", 2), p.get("extras", []),
                              (p.get("src") or "").strip().lower())
        if code != 200:
            return code, dv
        meta = {"ref": ref, "logement_id": logement_id, "canal": "direct",
                "debut": p["debut"], "fin": p["fin"],
                "voyageurs": p.get("voyageurs", 2), "langue": p.get("langue", "fr"),
                "heure_arrivee": p.get("heure_arrivee", "17:00"),
                "extras": dv["extras"], "montant": dv["total_ttc"],
                "src": dv["src"], "statut": "brouillon",
                "checkout_stripe": "a_preparer_1tap",
                "ts": utcnow_iso()}
        self._stocker(logement_id, ref, meta)
        self.log_decision(logement_id, ref, p.get("qui", "moteur-direct"),
                          "resa_brouillon", dv["total_ttc"],
                          f"brouillon {dv['nuits']}n, confirmation 1-tap requise"
                          + (f" src={dv['src']}" if dv["src"] else ""))
        return 201, {"statut": "brouillon", "ref": ref, "total_ttc": dv["total_ttc"],
                     "action": "POST /confirmer (1-tap humaine) pour occuper + ICS + contrat"}

    # --- confirmer : 1-tap HUMAINE -> ics-sync + ICS + contrat ---
    def confirmer(self, logement_id, ref, qui):
        if not qui or qui.strip().lower() in ("auto", "llm", "jev", "moteur-direct", ""):
            return 400, {"erreur": "confirmation = 1-tap HUMAINE exigée"}
        meta = self._lire(logement_id, ref)
        if not meta:
            return 404, {"erreur": "brouillon inconnu"}
        if meta.get("statut") == "confirmee":
            return 200, {"statut": "deja_confirmee", "ref": ref}
        payload = {"ref": ref, "logement_id": logement_id,
                   "debut": meta["debut"], "fin": meta["fin"],
                   "voyageurs": meta.get("voyageurs", 2),
                   "langue": meta.get("langue", "fr"),
                   "heure_arrivee": meta.get("heure_arrivee", "17:00"),
                   "taxe_sejour": 0.0, "montant": meta["montant"],
                   "extras": [e["id"] for e in meta.get("extras", [])],
                   "src": meta.get("src", ""), "qui": qui}
        code, rep = proxy_post(f"{self.url_ics}/resa-direct", payload)
        if code not in (200, 201):
            self.log_decision(logement_id, ref, qui, "confirmation_ko",
                              meta["montant"], f"ics-sync -> {code} {rep}")
            if 400 <= code < 500:  # refus métier (409 conflit…) : propager tel quel
                return code, rep
            return 502, {"erreur": "ics-sync indisponible", "detail": rep}
        ics_txt = self.generer_ics(meta)
        d = os.path.join(self.state_dir, logement_id)
        with open(os.path.join(d, f"{ref}.ics"), "w", encoding="utf-8") as f:
            f.write(ics_txt)
        meta.update({"statut": "confirmee", "valide_par": qui,
                     "ts_confirmation": utcnow_iso(), "ics": f"{ref}.ics"})
        self._stocker(logement_id, ref, meta)
        self.log_decision(logement_id, ref, qui, "resa_directe_confirmee",
                          meta["montant"],
                          f"occupation <60 s via ics-sync + ICS export"
                          + (f" src={meta['src']}" if meta.get("src") else ""))
        return 201, {"statut": "confirmee", "ref": ref,
                     "net_hote": rep.get("net_hote"),
                     "suivant": "contrat via facturation :8093 + hold via caution :8094"}

    def generer_ics(self, meta):
        stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
        debut = meta["debut"].replace("-", "")
        fin = meta["fin"].replace("-", "")
        return ("\r\n".join([
            "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LCD//booking-direct//FR",
            "BEGIN:VEVENT", f"UID:{meta['ref']}@lcd-direct",
            f"DTSTAMP:{stamp}", f"DTSTART;VALUE=DATE:{debut}",
            f"DTEND;VALUE=DATE:{fin}",
            f"SUMMARY:Direct {meta['logement_id']} {meta['ref']}",
            "END:VEVENT", "END:VCALENDAR", ""]))

    def lire_ics(self, logement_id, ref):
        meta = self._lire(logement_id, ref)
        if not meta:
            return None
        try:
            with open(os.path.join(self.state_dir, logement_id, f"{ref}.ics"),
                      encoding="utf-8") as f:
                return f.read()
        except FileNotFoundError:
            return None


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
            return self._json(200, {"ok": True, "moteur": "maison"})
        if url.path == "/catalogue":
            code, obj = eng.catalogue(qs.get("logement_id", [""])[0])
            return self._json(code, obj)
        if url.path == "/dispo":
            code, obj = eng.dispo(qs.get("logement_id", [""])[0],
                                  qs.get("debut", [""])[0], qs.get("fin", [""])[0])
            return self._json(code, obj)
        if url.path == "/ics":
            txt = eng.lire_ics(qs.get("logement_id", [""])[0],
                               qs.get("ref", [""])[0])
            if txt is None:
                return self._json(404, {"erreur": "ics inconnu (résa non confirmée ?)"})
            corps = txt.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "text/calendar")
            self.send_header("Content-Length", str(len(corps)))
            self.end_headers()
            return self.wfile.write(corps)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        import urllib.parse
        url = urllib.parse.urlparse(self.path)
        p, err = self._lire_json()
        if err:
            return self._json(400, {"erreur": err})
        eng = self.engine
        if url.path == "/devis":
            code, obj = eng.devis(p.get("logement_id", ""), p.get("debut", ""),
                                  p.get("fin", ""), p.get("voyageurs", 2),
                                  p.get("extras", []), p.get("src", ""))
            return self._json(code, obj)
        if url.path == "/resa":
            code, obj = eng.resa(p)
            return self._json(code, obj)
        if url.path == "/confirmer":
            code, obj = eng.confirmer(p.get("logement_id", ""),
                                      p.get("ref", ""), p.get("qui", ""))
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD booking-direct P2-15 (moteur maison)")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()

    cfg = charger_yaml_plat(args.config)
    try:
        with open(args.config, encoding="utf-8") as f:
            brut = f.read()
        m = re.search(r"^extras:\s*\n((?:  \w+:.*\n?)+)", brut, re.M)
        extras = {}
        if m:
            for ligne in m.group(1).splitlines():
                k, v = ligne.strip().split(":", 1)
                v = v.strip()
                mm = re.match(r"(.+?)\s*\|\s*([\d.]+)", v)
                if mm:
                    extras[k.strip()] = {"nom": mm.group(1).strip(),
                                         "prix_ttc": float(mm.group(2))}
        m2 = re.search(r"^urls:\s*\n((?:  \w+:.*\n?)+)", brut, re.M)
        if m2:
            for ligne in m2.group(1).splitlines():
                k, v = ligne.strip().split(":", 1)
                cfg[k.strip() + "_url"] = v.strip().strip("\"'")
    except FileNotFoundError:
        print(f"config introuvable: {args.config}", file=sys.stderr)
        return 2
    base = os.path.dirname(os.path.abspath(args.config))
    for cle in ("state_dir", "decision_log_dir"):
        val = cfg.get(cle, "")
        if val and not os.path.isabs(val):
            cfg[cle] = os.path.normpath(os.path.join(base, val))
    logts = lire_logements(args.logements)
    eng = BookingDirect(cfg, logts, extras)
    if not args.serve:
        print(json.dumps({"moteur": "maison", "logements": sorted(logts),
                          "extras": len(extras)}, ensure_ascii=False))
        return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8095)))
    Handler.engine = eng
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # lab Docker : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"booking-direct :8095 (moteur maison, {len(logts)} logements, "
          f"{len(extras)} extras)", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
