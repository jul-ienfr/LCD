#!/usr/bin/env python3
# custom/ics-sync/ics_sync.py — synchro ICS maison P2-4 (§4/§4-ter, §4-bis).
# 0 € : stdlib seule. Poll OTA 15 min, fusion direct+OTA, anti-double-résa,
# stop-sell same-day auto, events HA J-2/J-1/checkout, log decision.logX.jsonl.
#
# Contrats (README) :
#   GET  /dispo?logement_id=log1&debut=AAAA-MM-JJ&fin=AAAA-MM-JJ
#     -> {"disponible": bool, "conflit_ref"?: str}
#   POST /resa-direct  {ref, logement_id, debut, fin, voyageurs, langue, montant, extras[]}
#     -> direct = occupation <60 s (priorité max, §4), idempotence par ref.
#   GET  /health -> {"ok": true, "derniers_polls": {...}}
#
# Règles inviolables :
#   - OTA = lecture seule ICS pull ; JAMAIS d'écriture auto OTA (reco 1-tap seule, §3).
#   - Conflit : direct > airbnb > booking > abritel (§4) ; humain <15 min (alerte event).
#   - Secrets ICS + token HA : env LCD_* ou secrets.yaml, JAMAIS en dur / commités.
#   - logement_id partout, jamais d'entity_id en dur autre que calendar.logX_planning
#     construit dynamiquement depuis logement_id.
#
# Usage LXC : python3 ics_sync.py --config config.yaml
#   env : LCD_SECRETS_YAML=/opt/lcd/secrets.yaml (défaut ./secrets.yaml),
#         LCD_ICS_AIRBNB_LOG1=... (surcharge unitaire, prioritaire sur YAML),
#         LCD_HA_URL, LCD_HA_TOKEN, LCD_STATE_DIR, LCD_DECISION_LOG_DIR.

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import sys
import threading
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# --- Commissions §4 (taux contrats ; expedia = inconnue -> None) ---
COMMISSIONS = {
    "direct": 0.00,
    "airbnb": 0.15,
    "booking": 0.17,
    "abritel": 0.10,
    "expedia": None,  # taux contrat à vérifier -> net_hote null + motif
}
ORDRE_DEFAUT = ["direct", "airbnb", "booking", "abritel"]
CANAUX_OTA = ["airbnb", "booking", "abritel", "expedia"]

RE_UID = re.compile(r"^UID:(.+)\s*$", re.M)
RE_DT = re.compile(r"^(DTSTART|DTEND)(?:;[^:]*)?:(.+)\s*$", re.M)


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def parse_date_ics(val):
    """Parse DTSTART/DTEND ICS -> date (jour). Gère DATE et DATE-TIME (fuseau ignoré, jour local)."""
    val = val.strip()
    if "T" in val:
        v = val.rstrip("Z")
        for fmt in ("%Y%m%dT%H%M%S", "%Y%m%dT%H%M"):
            try:
                return dt.datetime.strptime(v, fmt).date()
            except ValueError:
                continue
        return dt.datetime.strptime(v[:8], "%Y%m%d").date()
    return dt.datetime.strptime(val[:8], "%Y%m%d").date()


def parse_ics(text):
    """Parse minimal ICS -> liste {uid, debut, fin, resume}. Tolérant CRLF/fold."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"\n[ \t]", "", text)  # unfolding
    sejs = []
    for bloc in re.split(r"BEGIN:VEVENT", text)[1:]:
        bloc = bloc.split("END:VEVENT")[0]
        uid = (re.search(r"^UID:(.+)$", bloc, re.M) or [None, ""])[1].strip()
        m1 = re.search(r"^DTSTART(?:;[^:]*)?:(.+)$", bloc, re.M)
        m2 = re.search(r"^DTEND(?:;[^:]*)?:(.+)$", bloc, re.M)
        if not (uid and m1 and m2):
            continue
        try:
            debut = parse_date_ics(m1.group(1))
            fin = parse_date_ics(m2.group(1))
        except ValueError:
            continue
        resume = (re.search(r"^SUMMARY:(.+)$", bloc, re.M) or [None, ""])[1].strip()
        if fin > debut:
            sejs.append({"uid": uid, "debut": debut.isoformat(),
                         "fin": fin.isoformat(), "resume": resume})
    return sejs


def chevauche(a_deb, a_fin, b_deb, b_fin):
    return a_deb < b_fin and b_deb < a_fin


def net_hote(montant, canal, commissions):
    tx = commissions.get(canal)
    if tx is None or montant is None:
        return None
    return round(float(montant) * (1.0 - float(tx)), 2)


class Store:
    """État fusionné par logement : dict ref -> séjour. Persisté JSON (state_dir)."""

    def __init__(self, state_dir):
        self.dir = state_dir
        os.makedirs(self.dir, exist_ok=True)
        self._lock = threading.Lock()
        self.data = {}  # logement_id -> {ref: sejour}

    def _path(self, logement_id):
        safe = re.sub(r"[^a-z0-9_-]", "", logement_id)
        return os.path.join(self.dir, f"planning-{safe}.json")

    def charger(self, logement_id):
        with self._lock:
            if logement_id not in self.data:
                try:
                    with open(self._path(logement_id), encoding="utf-8") as f:
                        lst = json.load(f)
                    self.data[logement_id] = {s["ref"]: s for s in lst}
                except (FileNotFoundError, json.JSONDecodeError):
                    self.data[logement_id] = {}
            return dict(self.data[logement_id])

    def sauver(self, logement_id):
        with self._lock:
            lst = sorted(self.data.get(logement_id, {}).values(),
                         key=lambda s: (s["debut"], s["fin"], s["ref"]))
            tmp = self._path(logement_id) + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(lst, f, ensure_ascii=False, indent=1)
            os.replace(tmp, self._path(logement_id))
            return lst


class Sync:
    def __init__(self, cfg, secrets):
        self.cfg = cfg
        self.secrets = secrets
        self.logements = cfg.get("logements", ["log1"])
        self.canaux_ota = cfg.get("canaux_ota", CANAUX_OTA)
        self.ordre = cfg.get("ordre_arbitrage", ORDRE_DEFAUT)
        comm = {c: COMMISSIONS[c] for c in COMMISSIONS}
        for c in list(comm):
            if f"commission_{c}" in cfg:
                comm[c] = cfg[f"commission_{c}"]
        self.commissions = comm
        state_dir = os.environ.get("LCD_STATE_DIR", cfg.get("state_dir", "./state"))
        self.store = Store(state_dir)
        self.decision_dir = os.environ.get("LCD_DECISION_LOG_DIR",
                                          cfg.get("decision_log_dir", state_dir))
        os.makedirs(self.decision_dir, exist_ok=True)
        self.ha_url = os.environ.get("LCD_HA_URL", cfg.get("ha_url", "")).rstrip("/")
        self.ha_token = os.environ.get("LCD_HA_TOKEN", secrets.get("ha_api_token", ""))
        self.derniers_polls = {}
        self._stop_sell = {}  # (logement_id, date) -> motif

    # --- secrets ICS : env LCD_ICS_<CANAL>_<LOG> prioritaire, sinon secrets.yaml ---
    def url_ics(self, canal, logement_id):
        env = os.environ.get(f"LCD_ICS_{canal.upper()}_{logement_id.upper()}")
        if env:
            return env
        return self.secrets.get(f"ics_{canal}_{logement_id}", "")

    # --- traçabilité §4-ter : 1 ligne JSONL par arbitrage ---
    def log_decision(self, logement_id, ref, qui, quoi, canal, montant, motif,
                     llm=None, jev=None):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": canal,
                 "commission": self.commissions.get(canal),
                 "net_hote": net_hote(montant, canal, self.commissions),
                 "motif": motif}
        if llm:
            ligne["llm"] = llm
        if jev:
            ligne["jev"] = jev
        path = os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl")
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
        return ligne

    # --- HA : events + état calendar fusionné (LAN/WireGuard seul, jamais WAN) ---
    def ha_post(self, chemin, payload):
        if not (self.ha_url and self.ha_token and not self.ha_token.startswith("CHANGER")):
            return False, "ha_non_configure"
        req = urllib.request.Request(
            self.ha_url + chemin,
            data=json.dumps(payload or {}).encode("utf-8"),
            headers={"Authorization": f"Bearer {self.ha_token}",
                     "Content-Type": "application/json"},
            method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return (r.status < 300), r.status
        except Exception as e:  # réseau/box down : log local, retry au prochain poll
            return False, f"ha_erreur:{type(e).__name__}"

    def ha_event(self, event_type, data):
        return self.ha_post(f"/api/events/{event_type}", data)

    def pousser_calendar(self, logement_id):
        sejours = sorted(self.store.charger(logement_id).values(),
                         key=lambda s: (s["debut"], s["fin"]))
        entity = f"calendar.{logement_id}_planning"
        etat = "on" if any(s["debut"] <= dt.date.today().isoformat() < s["fin"]
                            for s in sejours) else "off"
        ok, info = self.ha_post(f"/api/states/{entity}",
                                {"state": etat,
                                 "attributes": {"friendly_name": f"Planning {logement_id}",
                                                "sejours": sejours,
                                                "source": "ics-sync",
                                                "updated": utcnow_iso()}})
        return ok, info

    # --- fetch ICS (lecture seule, timeout court, retry 1) ---
    def fetch_ics(self, url):
        for essai in range(2):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "LCD-ics-sync/1.0"})
                with urllib.request.urlopen(req, timeout=20) as r:
                    return r.read().decode("utf-8", errors="replace")
            except Exception:
                if essai:
                    return None
                time.sleep(5)
        return None

    def poll_logement(self, logement_id):
        connus = self.store.charger(logement_id)
        nouveaux = {r: s for r, s in connus.items() if s.get("canal") == "direct"}
        evenements = []
        for canal in self.canaux_ota:
            url = self.url_ics(canal, logement_id)
            if not url or url.startswith("CHANGER"):
                self.derniers_polls[f"{logement_id}/{canal}"] = "sans_url"
                continue
            texte = self.fetch_ics(url)
            if texte is None:
                self.derniers_polls[f"{logement_id}/{canal}"] = "fetch_ko"
                continue
            self.derniers_polls[f"{logement_id}/{canal}"] = f"ok:{utcnow_iso()}"
            for ev in parse_ics(texte):
                ref = f"{canal}:{ev['uid']}"
                sej = {"ref": ref, "logement_id": logement_id, "canal": canal,
                       "debut": ev["debut"], "fin": ev["fin"],
                       "resume": ev["resume"], "montant": None,
                       "maj": utcnow_iso()}
                conflit = self._conflit(nouveaux, sej)
                if conflit:
                    gagnant = self._arbitrer(conflit, sej)
                    if gagnant["ref"] != sej["ref"]:
                        self.log_decision(logement_id, ref, "ics-sync",
                                          "conflit_ota_rejete", canal, None,
                                          f"conflit avec {conflit['ref']} "
                                          f"(ordre {' > '.join(self.ordre)}) ; "
                                          f"humain <15 min requis")
                        evenements.append(("conflit_humain", {
                            "logement_id": logement_id, "ref_rejete": ref,
                            "ref_gardé".replace("é", "e"): conflit["ref"]}))
                        continue
                    # nouveau séjour gagne : éjecte l'ancien OTA (jamais un direct)
                    self.log_decision(logement_id, conflit["ref"], "ics-sync",
                                      "conflit_ota_ejecte", conflit.get("canal"), None,
                                      f"remplacé par {ref} (ordre marge)")
                    nouveaux.pop(conflit["ref"], None)
                    evenements.append(("lcd_checkout", {
                        "logement_id": logement_id, "ref": conflit["ref"],
                        "motif": "annulation/depart detecte OTA"}))
                    self.ha_event("lcd_checkout", {
                        "logement_id": logement_id, "ref": conflit["ref"]})
                if ref not in connus:
                    self.log_decision(logement_id, ref, "ics-sync",
                                      "resa_ota_importee", canal, None,
                                      f"import ICS {canal} {ev['debut']}->{ev['fin']}")
                    self._planifier_rappels(logement_id, sej, evenements)
                nouveaux[ref] = sej
        # départs/annulations : présents avant, absents maintenant (hors direct)
        for ref, s in connus.items():
            if s.get("canal") != "direct" and ref not in nouveaux:
                self.log_decision(logement_id, ref, "ics-sync", "resa_ota_annulee",
                                  s.get("canal"), None, "absente du flux ICS")
                evenements.append(("lcd_checkout", {"logement_id": logement_id,
                                                   "ref": ref, "motif": "annulation OTA"}))
                self.ha_event("lcd_checkout", {"logement_id": logement_id, "ref": ref})
        with self.store._lock:
            self.store.data[logement_id] = nouveaux
        self.store.sauver(logement_id)
        self.pousser_calendar(logement_id)
        self._stop_sell_check(logement_id)
        return evenements

    def _conflit(self, sejours, cand):
        for s in sejours.values():
            if chevauche(s["debut"], s["fin"], cand["debut"], cand["fin"]):
                return s
        return None

    def _arbitrer(self, a, b):
        rang = {c: i for i, c in enumerate(self.ordre)}
        # direct toujours rang 0 même si absent de l'ordre configuré
        ra = rang.get(a.get("canal"), 99) if a.get("canal") != "direct" else -1
        rb = rang.get(b.get("canal"), 99) if b.get("canal") != "direct" else -1
        if ra == rb:  # même canal : le plus ancien UID gagne (stable)
            return a if a["ref"] <= b["ref"] else b
        return a if ra < rb else b

    def _planifier_rappels(self, logement_id, sej, evenements):
        # Les blueprints arrivée consomment ces events (J-2 envoi accès, J-1 rappel).
        # ics-sync les émet à l'import ; decision-engine gère le déclenchement daté.
        # P2-3 : langue + heure_arrivee + fin voyagent avec l'event (messages J-2/J-1,
        # pré-chauffe/ECS §5.11). Clés ajoutées = rétro-compatibles (ignorées si absentes).
        for ev, delai in (("lcd_j2_envoi_acces", 2), ("lcd_j1_rappel", 1)):
            self.ha_event(ev, {"logement_id": logement_id, "ref": sej["ref"],
                               "debut": sej["debut"], "fin": sej.get("fin"),
                               "langue": sej.get("langue", "fr"),
                               "heure_arrivee": sej.get("heure_arrivee", "17:00"),
                               "j_avant": delai})
            evenements.append((ev, {"logement_id": logement_id, "ref": sej["ref"]}))

    def _stop_sell_check(self, logement_id):
        """Arrivée <18 h non confirmée -> stop-sell same-day auto (+ forçage humain)."""
        limite = self.cfg.get("stop_sell_heure_limite", "18:00")
        auj = dt.date.today().isoformat()
        occupe_auj = any(s["debut"] <= auj < s["fin"]
                         for s in self.store.charger(logement_id).values())
        maintenant = dt.datetime.now().strftime("%H:%M")
        cle = (logement_id, auj)
        if not occupe_auj and maintenant >= limite and cle not in self._stop_sell:
            motif = (f"arrivee same-day non confirmee a {limite} "
                     f"-> stop-sell auto (forcage humain + motif, §1.6.1-1)")
            self._stop_sell[cle] = motif
            self.log_decision(logement_id, f"stop-sell-{auj}", "ics-sync",
                              "stop_sell_same_day", "direct", None, motif)
            self.ha_event("lcd_stop_sell", {"logement_id": logement_id,
                                            "date": auj, "motif": motif})
            self.ha_post(f"/api/states/input_boolean.{logement_id}_stop_sell",
                         {"state": "on", "attributes": {"motif": motif}})

    # --- API locale (pricing-engine + moteur direct) ---
    def dispo(self, logement_id, debut, fin):
        for s in self.store.charger(logement_id).values():
            if chevauche(s["debut"], s["fin"], debut, fin):
                return {"disponible": False, "conflit_ref": s["ref"]}
        return {"disponible": True}

    def resa_directe(self, payload):
        """POST /resa-direct : direct -> occupation <60 s, idempotence par ref."""
        for champ in ("ref", "logement_id", "debut", "fin"):
            if not payload.get(champ):
                return 400, {"erreur": f"champ manquant: {champ}"}
        logement_id = payload["logement_id"]
        if logement_id not in self.logements:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        connus = self.store.charger(logement_id)
        ref = payload["ref"]
        if ref in connus:  # idempotence : rejouer = même réponse
            return 200, {"statut": "deja_enregistree", "ref": ref}
        sej = {"ref": ref, "logement_id": logement_id, "canal": "direct",
               "debut": payload["debut"], "fin": payload["fin"],
               "voyageurs": payload.get("voyageurs"), "langue": payload.get("langue"),
               "heure_arrivee": payload.get("heure_arrivee", "17:00"),
               "taxe_sejour": payload.get("taxe_sejour", 0.0),
               "montant": payload.get("montant"),
               "extras": payload.get("extras", []), "maj": utcnow_iso()}
        # P2-12 : vitrine d'origine (?src=<vitrine> capturé par le tunnel direct,
        # cf. custom/vitrines.yaml). Stocké tel quel + tracé dans le motif JSONL.
        src = (payload.get("src") or "").strip().lower()
        if src:
            sej["src"] = src
        conflit = self._conflit(connus, sej)
        if conflit and conflit.get("canal") == "direct":
            # Direct-direct : jamais d'éjection auto — refus 409, humain requis
            # (P2-14 : 2e résa mêmes dates = refus, pas d'écrasement silencieux).
            self.log_decision(logement_id, ref, payload.get("qui", "moteur_direct"),
                              "resa_directe_conflit", "direct", sej.get("montant"),
                              f"conflit avec {conflit['ref']} (direct existant) : "
                              f"refus, humain requis")
            return 409, {"erreur": "conflit : séjour direct existant sur ces dates",
                         "conflit_ref": conflit["ref"]}
        if conflit:
            # Direct = priorité max sur OTA : éjecte l'OTA en conflit, humain informé <15 min.
            self.log_decision(logement_id, conflit["ref"], "ics-sync",
                              "conflit_direct_gagne", conflit.get("canal"), None,
                              f"ejecte par resa directe {ref} ; humain <15 min")
            self.ha_event("lcd_conflit_humain",
                          {"logement_id": logement_id, "ref_garde": ref,
                           "ref_ejecte": conflit["ref"]})
            with self.store._lock:
                self.store.data[logement_id].pop(conflit["ref"], None)
        with self.store._lock:
            self.store.data[logement_id][ref] = sej
        self.store.sauver(logement_id)
        self.log_decision(logement_id, ref, payload.get("qui", "moteur_direct"),
                          "resa_directe_enregistree", "direct", sej.get("montant"),
                          f"{sej['debut']}->{sej['fin']} occupation <60 s"
                          + (f" src={sej['src']} (vitrine gratuite)" if sej.get("src") else ""))
        self.pousser_calendar(logement_id)
        self._planifier_rappels(logement_id, sej, [])
        return 201, {"statut": "enregistree", "ref": ref,
                     "net_hote": net_hote(sej.get("montant"), "direct", self.commissions)}


def charger_yaml(path):
    """Sous-ensemble YAML suffisant pour config.yaml + secrets.yaml plats."""
    data = {}
    try:
        with open(path, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne.strip() or ligne.startswith((" ", "\t")):
                    # listes `  - item` sous une clé : rattacher simplement
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
                    elif v:
                        data[k] = v
    except FileNotFoundError:
        pass
    # listes logements/canaux : relire en clair (une ligne `[a, b]`)
    return data


class Handler(BaseHTTPRequestHandler):
    sync = None  # injecté au démarrage

    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        corps = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        if url.path == "/health":
            return self._json(200, {"ok": True, "derniers_polls": self.sync.derniers_polls})
        if url.path == "/dispo":
            logement_id = qs.get("logement_id", [""])[0]
            debut = qs.get("debut", [""])[0]
            fin = qs.get("fin", [""])[0]
            if not (logement_id and debut and fin):
                return self._json(400, {"erreur": "logement_id, debut, fin requis (AAAA-MM-JJ)"})
            return self._json(200, self.sync.dispo(logement_id, debut, fin))
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        if urllib.parse.urlparse(self.path).path != "/resa-direct":
            return self._json(404, {"erreur": "inconnu"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            payload = json.loads(self.rfile.read(n) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._json(400, {"erreur": "JSON invalide"})
        code, obj = self.sync.resa_directe(payload)
        return self._json(code, obj)


def main():
    ap = argparse.ArgumentParser(description="LCD ics-sync P2-4")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--once", action="store_true", help="un seul poll puis sortie (tests)")
    args = ap.parse_args()

    cfg = charger_yaml(args.config)
    # listes : relecture stricte depuis le fichier (le parseur plat les ignore sinon)
    try:
        with open(args.config, encoding="utf-8") as f:
            brut = f.read()
        for cle in ("logements", "canaux_ota", "ordre_arbitrage"):
            m = re.search(rf"^{cle}:\s*\[(.*?)\]", brut, re.M)
            if m:
                cfg[cle] = [x.strip() for x in m.group(1).split(",") if x.strip()]
    except FileNotFoundError:
        print(f"config introuvable: {args.config}", file=sys.stderr)
        return 2

    secrets_path = os.environ.get("LCD_SECRETS_YAML",
                                  cfg.get("secrets_yaml", "./secrets.yaml"))
    secrets = charger_yaml(secrets_path)

    sync = Sync(cfg, secrets)
    Handler.sync = sync

    if args.once:
        for log in sync.logements:
            sync.poll_logement(log)
        print(json.dumps({"polls": sync.derniers_polls}, ensure_ascii=False))
        return 0

    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8090)))
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # lab Docker : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    print(f"ics-sync : HTTP 127.0.0.1:{port} ; poll "
          f"{cfg.get('poll_minutes', 15)} min ({', '.join(sync.logements)})", flush=True)
    try:
        while True:
            for log in sync.logements:
                try:
                    sync.poll_logement(log)
                except Exception as e:  # un logement KO ne bloque pas les autres
                    print(f"poll {log} erreur: {type(e).__name__}: {e}", file=sys.stderr)
            time.sleep(int(cfg.get("poll_minutes", 15)) * 60)
    except KeyboardInterrupt:
        pass
    finally:
        srv.shutdown()
    return 0


if __name__ == "__main__":
    sys.exit(main())
