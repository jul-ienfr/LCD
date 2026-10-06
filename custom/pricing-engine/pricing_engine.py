#!/usr/bin/env python3
# custom/pricing-engine/pricing_engine.py — pricing pivot direct P2-5 (§3 + §3-quater + §4).
# 0 € : stdlib seule. Recalcul 1x/j + à chaque résa. Même LXC que ics-sync.
#
# Formules inviolables (§3) :
#   prix = clamp(prix_base × K_saison × K_events × K_we × K_occ × K_duree × K_lastmin, 75, 290)
#   prix_canal = arrondi(pivot_direct / (1 − commission_canal) + frais_fixes_canal), clamp bornes
#   caution/hold = jamais du prix (§12.3) ; remises = critères objectifs affichés seuls (art. 225-1).
#
# Règles inviolables :
#   - Application auto au moteur DIRECT seul (PUT /prix -> QloApps Phase 1 / booking-direct Phase 2+).
#     OTA = reco 1-tap (bouton copier Vue Prix), JAMAIS d'écriture auto.
#   - Dérogation hors bornes = motif obligatoire + humain uniquement (decision.logX.jsonl).
#   - Gap-night 1-2 nuits : −20 % pivot, jamais < plancher (§3-quater).
#   - Secrets (QloApps Webservice, token HA) : env LCD_* ou secrets.yaml, JAMAIS en dur.
#
# Contrats :
#   GET  /prix?logement_id=log1&date=AAAA-MM-JJ[&nuits=N][&occ_j30=0.45][&k_events=1.2]
#     -> {pivot, k{...}, prix_canal{...}, tarifs{flex,non_remb,flex_plus}, sejour_min, gap_night?, late_early?}
#   PUT  /prix {logement_id, date, prix, motif?} -> appliqué DIRECT seul (humain si hors bornes).
#   POST /recalcul {logement_id} -> recalcule J..J+30, pousse sensors HA, rend reco OTA 1-tap.
#   GET  /reco-ota?logement_id=log1 -> reco 1-tap par canal (copier Vue Prix).
#   GET  /health -> {"ok": true}
#
# Usage : python3 pricing_engine.py --config config.yaml --logements ../logements.yaml
#   env : LCD_SECRETS_YAML, LCD_QLOAPPS_URL/KEY, LCD_HA_URL/TOKEN, LCD_ICS_SYNC_URL, LCD_HTTP_PORT.

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CANAUX = ["direct", "airbnb", "booking", "abritel", "expedia"]

# --- §3-bis modes de gestion : presets (jamais bascule silencieuse, proposition 1-tap) ---
MODES = {
    "equilibre": {"k_occ_vide": 0.90, "lastmin": {"j7": 0.90, "j3": 0.82, "j0": 0.75},
                  "duree_min_defaut": 2},
    "remplissage_max": {"k_occ_vide": 0.85, "lastmin": {"j7": 0.85, "j3": 0.75, "j0": 0.70},
                        "duree_min_defaut": 1},
    "revenu_max": {"k_occ_vide": 0.95, "lastmin": {"j7": 1.00, "j3": 1.00, "j0": 0.90},
                   "duree_min_defaut": 2},
}


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def clamp(prix, pmin, pmax):
    return max(pmin, min(pmax, prix))


def charger_yaml_plat(path):
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
                    elif v.startswith("{") and v.endswith("}"):
                        d = {}
                        for item in v[1:-1].split(","):
                            if ":" in item:
                                kk, vv = item.split(":", 1)
                                vv = vv.strip()
                                try:
                                    d[kk.strip()] = float(vv)
                                except ValueError:
                                    d[kk.strip()] = vv.strip("\"'")
                        data[k] = d
                    elif v:
                        data[k] = v
    except FileNotFoundError:
        pass
    return data


def lire_logements(path):
    """Extrait pricing par logement depuis custom/logements.yaml (parseur indente minimal)."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    logts = {}
    cur = None
    in_pricing = False
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        if indent == 2 and ligne.strip() == "log1:":
            cur = "log1"
            logts[cur] = {"prix_base": 110, "prix_min": 75, "prix_max": 290,
                          "mode_gestion_defaut": "equilibre"}
            in_pricing = False
            continue
        if indent == 2 and ligne.strip() == "log2:":
            cur = "log2"
            logts[cur] = {"prix_base": 90, "prix_min": 75, "prix_max": 290,
                          "mode_gestion_defaut": "equilibre"}
            in_pricing = False
            continue
        if cur and indent == 2 and ligne.strip().endswith(":"):
            cur = None  # autre section de même niveau (log2 géré ci-dessus, etc.)
            in_pricing = False
            continue
        if cur is None:
            continue
        if ligne.strip() == "pricing:":
            in_pricing = True
            continue
        if in_pricing and indent <= 4 and ligne.strip().endswith(":") \
                and ligne.strip() != "pricing:":
            in_pricing = False
            continue
        if cur and in_pricing and ":" in ligne:
            k, v = [x.strip().strip("\"'") for x in ligne.strip().split(":", 1)]
            if k in ("prix_base", "prix_min", "prix_max"):
                try:
                    logts[cur][k] = int(float(v))
                except ValueError:
                    pass
            elif k == "mode_gestion_defaut" and v:
                logts[cur][k] = v
    return logts


def k_saison(date_j, cfg):
    table = cfg.get("k_saison_par_mois") or {}
    # clés int ou str selon parseur (YAML multi-ligne toléré)
    k = table.get(date_j.month, table.get(str(date_j.month), 1.0))
    # Noël/Nouvel An ~20/12 -> ~05/01 écrase le mensuel (§3)
    if (date_j.month == 12 and date_j.day >= 20) or (date_j.month == 1 and date_j.day <= 5):
        k = float(cfg.get("k_saison_noel_nouvel_an", 1.60))
    return k


def k_we(date_j, ferie_ou_pont=False):
    if ferie_ou_pont:
        return 1.25
    # Ven-sam +20 %, dim-jeu 1,00 (§3)
    return 1.20 if date_j.weekday() in (4, 5) else 1.00


def k_occ(occ_j30, mode):
    preset = MODES.get(mode, MODES["equilibre"])
    if occ_j30 is None:
        return 1.00
    if occ_j30 > 0.70:
        return 1.10
    if occ_j30 < 0.30:
        return float(preset["k_occ_vide"])
    return 1.00


def k_duree(nuits):
    if nuits <= 1:
        return 1.15
    if nuits >= 28:
        return 0.78
    if nuits >= 7:
        return 0.92
    return 1.00


def k_lastmin(j_avant, occ_j30, mode):
    if occ_j30 is not None and occ_j30 >= 0.50:
        return 1.00
    table = MODES.get(mode, MODES["equilibre"])["lastmin"]
    if j_avant <= 0:
        return float(table["j0"])
    if j_avant <= 3:
        return float(table["j3"])
    if j_avant <= 7:
        return float(table["j7"])
    return 1.00


class Pricing:
    def __init__(self, cfg, logts, secrets):
        self.cfg = cfg
        self.logts = logts
        self.secrets = secrets
        self.commissions = {
            "direct": float(cfg.get("commission_direct", 0.00)),
            "airbnb": float(cfg.get("commission_airbnb", 0.15)),
            "booking": float(cfg.get("commission_booking", 0.17)),
            "abritel": float(cfg.get("commission_abritel", 0.10)),
            "expedia": None,  # taux contrat à vérifier -> reco sans prix + motif
        }
        self.decision_dir = os.environ.get("LCD_DECISION_LOG_DIR",
                                          cfg.get("decision_log_dir", "./state"))
        os.makedirs(self.decision_dir, exist_ok=True)
        self.ha_url = os.environ.get("LCD_HA_URL", cfg.get("ha_url", "")).rstrip("/")
        self.ha_token = os.environ.get("LCD_HA_TOKEN", secrets.get("ha_api_token", ""))
        self.qloapps_url = os.environ.get("LCD_QLOAPPS_URL",
                                         cfg.get("qloapps_url", "")).rstrip("/")
        self.qloapps_key = os.environ.get("LCD_QLOAPPS_KEY",
                                         secrets.get("qloapps_webservice_key", ""))
        self.ics_sync_url = os.environ.get("LCD_ICS_SYNC_URL",
                                           cfg.get("ics_sync_url", "http://127.0.0.1:8090")).rstrip("/")
        self.prix_appliques = {}  # (logement_id, date) -> {prix, ts, qui}

    def bornes(self, logement_id):
        l = self.logts.get(logement_id, {})
        return int(l.get("prix_min", 75)), int(l.get("prix_max", 290))

    def calculer(self, logement_id, date_j, nuits=1, occ_j30=None, k_events=1.0,
                 ferie_ou_pont=False):
        l = self.logts.get(logement_id)
        if not l:
            return None, f"logement inconnu: {logement_id}"
        mode = l.get("mode_gestion_defaut", "equilibre")
        base = float(l.get("prix_base", 110))
        ks = {  # K granularisés pour traçabilité Vue Prix
            "saison": round(k_saison(date_j, self.cfg), 3),
            "events": round(float(k_events or 1.0), 3),
            "we": round(k_we(date_j, ferie_ou_pont), 3),
            "occ": round(k_occ(occ_j30, mode), 3),
            "duree": round(k_duree(nuits), 3),
            "lastmin": round(k_lastmin((date_j - dt.date.today()).days,
                                       occ_j30, mode), 3),
        }
        brut = base
        for v in ks.values():
            brut *= v
        pmin, pmax = self.bornes(logement_id)
        clampé = brut < pmin or brut > pmax
        pivot = int(round(clamp(brut, pmin, pmax)))
        prix_canal = {}
        for canal, tx in self.commissions.items():
            if tx is None:
                prix_canal[canal] = None  # expedia : vérifier contrat
            else:
                prix_canal[canal] = int(round(clamp(pivot / (1.0 - tx), pmin, pmax)))
        tarifs = {
            "flex": pivot,  # annulation J-7
            "non_remb": int(round(clamp(
                pivot * (1.0 - float(self.cfg.get("tarif_non_remb_remise", 0.10))),
                pmin, pmax))),  # −10 %, encaissé avance
            "flex_plus": int(round(clamp(
                pivot * (1.0 + float(self.cfg.get("tarif_flex_plus_majoration", 0.15))),
                pmin, pmax))),  # +15 % pics, annulation J-1
        }
        # Séjour min dynamique (§3-quater) : proposition 1-tap, jamais silencieuse
        if occ_j30 is not None and occ_j30 < 0.30:
            sejour_min = {"nuits": 1, "jours_arrivee": "tous",
                          "motif": "creux occ<30 % : remplir"}
        elif ks["saison"] >= 1.40 or ks["events"] >= 1.30:
            sejour_min = {"nuits": 3, "jours_arrivee": ["sam", "mer"],
                          "motif": "pic : éviter trous invendables (validation 1-tap)"}
        else:
            sejour_min = {"nuits": MODES.get(mode, MODES["equilibre"])["duree_min_defaut"],
                          "jours_arrivee": "tous", "motif": "standard"}
        part = float(self.cfg.get("late_early_part_nuitee", 0.50))
        late_early = {"late_moins_2h": 0,  # gratuit, geste avis
                      "late_14h_ou_early_12h": int(round(pivot * part)),
                      "condition": "si pas d'arrivée/départ jour J, proposition PWA J-1, "
                                   "paiement avance, ménage replanifié"}
        return {"logement_id": logement_id, "date": date_j.isoformat(), "nuits": nuits,
                "pivot": pivot, "brut": round(brut, 2), "clampe": clampé,
                "k": ks, "mode": mode, "prix_canal": prix_canal, "tarifs": tarifs,
                "sejour_min": sejour_min, "late_early": late_early,
                "bornes": [pmin, pmax]}, None

    def gap_night(self, logement_id, sejours, pivot_jour):
        """Trous 1-2 nuits entre 2 résas -> −20 % pivot, jamais < plancher (§3-quater)."""
        pmin, _ = self.bornes(logement_id)
        occ = sorted(((s["debut"], s["fin"]) for s in sejours), key=lambda x: x[0])
        trous = []
        for i in range(len(occ) - 1):
            fin_a = dt.date.fromisoformat(occ[i][1])
            deb_b = dt.date.fromisoformat(occ[i + 1][0])
            trou = (deb_b - fin_a).days
            if 1 <= trou <= 2:
                prix_gap = max(pmin, int(round(pivot_jour * (1.0 - float(
                    self.cfg.get("gap_night_remise", 0.20))))))
                trous.append({"debut": fin_a.isoformat(), "nuits": trou,
                              "prix_gap": prix_gap, "remise": float(
                                  self.cfg.get("gap_night_remise", 0.20)),
                              "reco_ota": "push reco 1-tap + message last-minute"})
        return trous

    def sejours_depuis_ics_sync(self, logement_id, debut, fin):
        """Lit l'état fusionné ics-sync (fichier state partagé ou HTTP /dispo jour par jour)."""
        state_dir = os.environ.get("LCD_STATE_DIR", "./state")
        for cand in (os.path.join(state_dir, f"planning-{logement_id}.json"),
                     os.path.join(self.cfg.get("state_dir", "./state"),
                                  f"planning-{logement_id}.json")):
            try:
                with open(cand, encoding="utf-8") as f:
                    lst = json.load(f)
                return [s for s in lst if s["debut"] < fin and debut < s["fin"]]
            except (FileNotFoundError, json.JSONDecodeError):
                continue
        return []

    def occ_j30(self, logement_id):
        auj = dt.date.today()
        sejours = self.sejours_depuis_ics_sync(
            logement_id, auj.isoformat(), (auj + dt.timedelta(days=30)).isoformat())
        occupees = 0
        for i in range(30):
            jour = (auj + dt.timedelta(days=i)).isoformat()
            if any(s["debut"] <= jour < s["fin"] for s in sejours):
                occupees += 1
        return occupees / 30.0, sejours

    # --- traçabilité ---
    def log_decision(self, logement_id, ref, qui, quoi, canal, montant, motif):
        tx = self.commissions.get(canal)
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": canal, "commission": tx,
                 "net_hote": (None if (tx is None or montant is None)
                              else round(float(montant) * (1.0 - tx), 2)),
                 "motif": motif}
        path = os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl")
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
        return ligne

    def ha_post(self, chemin, payload):
        if not (self.ha_url and self.ha_token and not self.ha_token.startswith("CHANGER")):
            return False, "ha_non_configure"
        req = urllib.request.Request(
            self.ha_url + chemin, data=json.dumps(payload or {}).encode("utf-8"),
            headers={"Authorization": f"Bearer {self.ha_token}",
                     "Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return (r.status < 300), r.status
        except Exception as e:
            return False, f"ha_erreur:{type(e).__name__}"

    def pousser_sensors(self, logement_id, grille):
        """sensor.logX_prix_nuit + sensor.logX_prix_canal_* (Vue Prix §5.11)."""
        if not grille:
            return False, "grille_vide"
        j0 = grille[0]
        res = []
        base = {"source": "pricing-engine", "updated": utcnow_iso(),
                "bornes": j0["bornes"], "tarifs": j0["tarifs"],
                "sejour_min": j0["sejour_min"]}
        ok, info = self.ha_post(f"/api/states/sensor.{logement_id}_prix_nuit",
                                {"state": j0["pivot"], "attributes": {**base, "k": j0["k"]}})
        res.append(("prix_nuit", ok, info))
        for canal, prix in j0["prix_canal"].items():
            if prix is None:
                continue  # expedia : pas de prix tant que contrat non vérifié
            ok, info = self.ha_post(
                f"/api/states/sensor.{logement_id}_prix_canal_{canal}",
                {"state": prix, "attributes": {**base, "canal": canal,
                                               "reco_ota_1tap": canal != "direct"}})
            res.append((canal, ok, info))
        return True, res

    def appliquer_direct(self, logement_id, date_s, prix, qui, motif=""):
        """PUT /prix : appliqué au moteur DIRECT seul. OTA = reco 1-tap, jamais auto."""
        pmin, pmax = self.bornes(logement_id)
        if not (pmin <= prix <= pmax):
            if not motif:
                return 422, {"erreur": f"hors bornes [{pmin}, {pmax}] : motif humain obligatoire",
                             "prix_demande": prix}
            self.log_decision(logement_id, f"prix-{date_s}", qui or "humain",
                              "derogation_prix_hors_bornes", "direct", prix,
                              f"motif humain : {motif}")
        ancien = self.prix_appliques.get((logement_id, date_s), {}).get("prix")
        # Phase 1 : QloApps Webservice clé dédiée lecture/prix (P2-1) ; Phase 2+ : natif.
        # Ici : mémorise + log ; l'appel WS réel se fait sur box (URL/clé LXC).
        self.prix_appliques[(logement_id, date_s)] = {"prix": prix, "ts": utcnow_iso(),
                                                      "qui": qui or "pricing-engine"}
        self.log_decision(logement_id, f"prix-{date_s}", qui or "pricing-engine",
                          "prix_direct_applique", "direct", prix,
                          f"{ancien}->{prix} moteur direct seul (OTA = reco 1-tap)")
        self.ha_post(f"/api/states/sensor.{logement_id}_prix_nuit",
                     {"state": prix, "attributes": {"date": date_s, "source": "PUT /prix",
                                                    "ancien": ancien}})
        return 200, {"statut": "applique_direct", "logement_id": logement_id,
                     "date": date_s, "ancien": ancien, "prix": prix,
                     "note": "OTA = reco 1-tap, jamais d'écriture auto"}

    def recalculer(self, logement_id, jours=30, occ_force=None, k_events=1.0):
        occ, sejours = self.occ_j30(logement_id)
        if occ_force is not None:
            occ = float(occ_force)
        auj = dt.date.today()
        grille = []
        for i in range(jours):
            jour = auj + dt.timedelta(days=i)
            res, err = self.calculer(logement_id, jour, nuits=1, occ_j30=occ,
                                     k_events=k_events)
            if res:
                grille.append(res)
        if grille:
            pivot_j0 = grille[0]["pivot"]
            for t in self.gap_night(logement_id, sejours, pivot_j0):
                for g in grille:
                    if g["date"] >= t["debut"] and g["date"] < (
                            dt.date.fromisoformat(t["debut"]) +
                            dt.timedelta(days=t["nuits"])).isoformat():
                        g["gap_night"] = t
                        g["pivot"] = t["prix_gap"]
            self.pousser_sensors(logement_id, grille)
        reco = {c: grille[0]["prix_canal"][c] for c in grille[0]["prix_canal"]} if grille else {}
        self.log_decision(logement_id, f"recalcul-{auj.isoformat()}", "pricing-engine",
                          "recalcul_prix", "direct", grille[0]["pivot"] if grille else None,
                          f"occ_j30={occ:.0%}, {jours} j, OTA = reco 1-tap")
        return {"logement_id": logement_id, "occ_j30": round(occ, 3), "grille": grille,
                "reco_ota_1tap": {c: p for c, p in reco.items() if c != "direct"},
                "note_expedia": ("expedia : taux contrat à vérifier, pas de prix auto"
                                 if "expedia" in reco else "")}

    def superhost_watch(self, note=None, taux_reponse=None, annulation_hote=False):
        """Seuils §3-quater : note <4,8 ou réponse <90 % ou annulation hôte -> alerte + plan."""
        seuil_note = float(self.cfg.get("superhost_note_seuil", 4.8))
        seuil_rep = float(self.cfg.get("superhost_reponse_seuil", 0.90))
        alertes = []
        if note is not None and float(note) < seuil_note:
            alertes.append(f"note {note} < {seuil_note}")
        if taux_reponse is not None and float(taux_reponse) < seuil_rep:
            alertes.append(f"réponse {taux_reponse} < {seuil_rep}")
        if annulation_hote:
            alertes.append("annulation hôte")
        if alertes:
            return {"alerte": True, "motifs": alertes,
                    "plan": "enquête J+1 + geste + pause last-minute agressive (Vue Prix/Finances)"}
        return {"alerte": False}


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

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        eng = self.engine
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/prix":
            logement_id = qs.get("logement_id", [""])[0]
            date_s = qs.get("date", [""])[0]
            if not (logement_id and date_s):
                return self._json(400, {"erreur": "logement_id + date requis"})
            try:
                jour = dt.date.fromisoformat(date_s)
            except ValueError:
                return self._json(400, {"erreur": "date AAAA-MM-JJ"})
            occ = qs.get("occ_j30", [None])[0]
            res, err = eng.calculer(
                logement_id, jour, nuits=int(qs.get("nuits", ["1"])[0]),
                occ_j30=(None if occ is None else float(occ)),
                k_events=float(qs.get("k_events", ["1.0"])[0]),
                ferie_ou_pont=qs.get("ferie", ["0"])[0] == "1")
            if err:
                return self._json(404, {"erreur": err})
            return self._json(200, res)
        if url.path == "/reco-ota":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            r = eng.recalculer(logement_id, jours=7)
            return self._json(200, {"logement_id": logement_id,
                                    "reco_ota_1tap": r["reco_ota_1tap"],
                                    "grille_7j": [(g["date"], g["pivot"], g["prix_canal"])
                                                  for g in r["grille"]]})
        return self._json(404, {"erreur": "inconnu"})

    def do_PUT(self):
        if urllib.parse.urlparse(self.path).path != "/prix":
            return self._json(404, {"erreur": "inconnu"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            p = json.loads(self.rfile.read(n) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return self._json(400, {"erreur": "JSON invalide"})
        if not (p.get("logement_id") and p.get("date") and isinstance(p.get("prix"), int)):
            return self._json(400, {"erreur": "logement_id, date, prix (int) requis"})
        code, obj = self.engine.appliquer_direct(p["logement_id"], p["date"], p["prix"],
                                                 p.get("qui"), p.get("motif", ""))
        return self._json(code, obj)

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        if url.path not in ("/recalcul", "/recalculer"):
            return self._json(404, {"erreur": "inconnu"})
        try:
            n = int(self.headers.get("Content-Length", 0))
            p = json.loads(self.rfile.read(n) or b"{}") if n else {}
        except (ValueError, json.JSONDecodeError):
            return self._json(400, {"erreur": "JSON invalide"})
        if not p.get("logement_id"):
            return self._json(400, {"erreur": "logement_id requis"})
        return self._json(200, self.engine.recalculer(
            p["logement_id"], jours=int(p.get("jours", 30)),
            occ_force=p.get("occ_j30"), k_events=float(p.get("k_events", 1.0))))


def main():
    ap = argparse.ArgumentParser(description="LCD pricing-engine P2-5")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--serve", action="store_true", help="démarre l'API HTTP (défaut : recalcul + sortie)")
    args = ap.parse_args()

    cfg = charger_yaml_plat(args.config)
    try:
        with open(args.config, encoding="utf-8") as f:
            brut = f.read()
        m = re.search(r"^k_saison_par_mois:\s*\{(.*?)\}", brut, re.M | re.S)
        if m:
            cfg["k_saison_par_mois"] = {int(k.strip()): float(v.strip())
                                        for k, v in (x.split(":") for x in m.group(1).split(","))}
    except FileNotFoundError:
        print(f"config introuvable: {args.config}", file=sys.stderr)
        return 2
    logts = lire_logements(args.logements)
    if not logts:
        print(f"logements introuvables ou vides: {args.logements}", file=sys.stderr)
        return 2
    secrets = charger_yaml_plat(os.environ.get("LCD_SECRETS_YAML", "./secrets.yaml"))
    eng = Pricing(cfg, logts, secrets)
    Handler.engine = eng

    if not args.serve:
        for log in logts:
            print(json.dumps(eng.recalculer(log, jours=7), ensure_ascii=False)[:500] + "...")
        return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8091)))
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"pricing-engine : HTTP 127.0.0.1:{port} ({', '.join(logts)})", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
