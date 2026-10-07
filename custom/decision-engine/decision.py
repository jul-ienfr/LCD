#!/usr/bin/env python3
# custom/decision-engine/decision.py — orchestrateur maison P2-8 (§5.11, §1.6).
# 0 € : stdlib seule. État unifié occupation/prix, règles prioritaires :
#   sécurité > occupation > énergie > confort > prix.
# Log JSONL : decision.logX.jsonl (schéma P1-10/P2-8/P7-7, runtime /config/logs/, 90 j accès).
#
# Règles inviolables :
#   - Ne génère JAMAIS de PIN (KeyMaster + Nuki Hub seuls, §1.6) : aucun code de
#     génération ici — le champ pin transite (poussé par KeyMaster) ou reste vide
#     (log2 smart_lock off -> boîte à clés). Ne fait JAMAIS de tool-calling
#     serrure/vanne/portail direct — émet uniquement des events HA vers blueprints.
#   - `copro.verifiee: false` -> mise en ligne BLOQUÉE + sensor.logX_config_ok rouge.
#   - RBAC double filtre : acces.yaml (qui + périmètre logement + expiry) + visibility:
#     dashboards ; journal tagué rôle+marque. Hors scope -> blocage + log, jamais d'auto.
#   - Bornes prix 75/290 inviolables en code ; hors bornes = motif humain + blocage auto.
#   - LLM/Jev consultatifs seuls (traçabilité llm/jev dans le JSONL), jamais d'action directe.
#   - Secrets (tokens) : env LCD_* ou secrets.yaml, JAMAIS en dur.
#
# Contrats :
#   GET  /etat?logement_id=log1
#     -> {logement_id, config_ok, copro_verifiee, occupation{...}, prix{...}, alertes[]}
#   POST /autoriser {qui_id, action, logement_id} -> {autorise, motif, role}
#   POST /event {type, logement_id, qui, ref?, data?} -> vérifie RBAC + copro, log, forward HA
#     types : lcd_j2_envoi_acces | lcd_j1_rappel | lcd_checkout | lcd_avis_j1
#   POST /decision {logement_id, ref, qui, quoi, canal?, montant?, motif?, llm?, jev?}
#     -> vérifie RBAC + bornes + hors_bornes Jev, log JSONL (bloqué si refusé, loggé aussi)
#   GET  /health -> {"ok": true}
#
# Usage : python3 decision.py --config config.yaml --logements ../logements.yaml --acces ../acces.yaml
#   --check : vérifie copro + pousse sensor.logX_config_ok (rouge si false) + affiche état.
#   --serve : démarre l'API HTTP.
#   env : LCD_SECRETS_YAML, LCD_HA_URL/TOKEN, LCD_ICS_SYNC_URL, LCD_PRICING_URL, LCD_HTTP_PORT.

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Actions атомiques + matrice RBAC (rôle, sous-rôle) -> actions autorisées.
# Principe : moindre privilège ; voyageur = sa résa seule (via ref, pas de compte nominatif).
PERMISSIONS = {
    ("super_admin", "super_admin"): {"*"},  # tout, y compris secrets/exports (rotation seule)
    ("super_admin", "admin"): {"etat_lecture", "event_envoi", "prix_reco", "prix_derogation",
                               "forcage_stop_sell", "menage_cloture", "config_modif"},
    ("gestionnaire", "operateur"): {"etat_lecture", "event_envoi", "prix_reco",
                                    "menage_cloture", "forcage_stop_sell"},
    ("gestionnaire", "comptable"): {"etat_lecture", "exports_compta"},
    ("gestionnaire", "support"): {"etat_lecture", "event_envoi"},
    ("proprietaire", "proprio_logement"): {"etat_lecture", "prix_reco"},
    ("proprietaire", "proprio_parc"): {"etat_lecture", "prix_reco"},
    ("voyageur", "sejour"): {"etat_lecture"},  # sa résa seule (ref) : questionnaire, late/early
    ("prestataires", "menage_interne"): {"etat_lecture", "menage_cloture"},
    ("prestataires", "presta_externe"): {"etat_lecture", "menage_cloture"},
}

# quoi (JSONL) -> action RBAC requise
QUOI_VERS_ACTION = {
    "prix": "prix_reco",
    "prix_derogation": "prix_derogation",
    "acces": "event_envoi",
    "ics": "event_envoi",
    "energie": "event_envoi",
    "securite": "event_envoi",
    "menage": "menage_cloture",
    "compta": "exports_compta",
    "llm": "etat_lecture",
    "jev": "etat_lecture",
}

TYPES_EVENT = {"lcd_j2_envoi_acces", "lcd_j1_rappel", "lcd_checkout", "lcd_avis_j1"}

# P6-9-bis §5.7-ter : gabarits voyageur socle 5 (FR source validée humain + EN/ES/IT/DE
# validées humain). Autre maternelle = fallback EN + badge auto (LLM proxy :4000 hors
# moteur, stdlib seule ici). Placeholders {{ }} INTOUCHABLES : injectés APRÈS choix
# du gabarit, jamais traduits (montants, dates, heures, adresses, PIN/codes, noms).
LANGUES_SOCLE = ["fr", "en", "es", "it", "de"]
GABARIT_PAR_EVENT = {"lcd_j2_envoi_acces": "message_checkin_j2",
                     "lcd_j1_rappel": "message_checkin_j1",
                     "lcd_avis_j1": "message_avis_j1"}
CONSIGNE_BOITE_CLES = {"fr": "boîte à clés (code envoyé séparément)",
                       "en": "lockbox (code sent separately)",
                       "es": "caja de llaves (código enviado por separado)",
                       "it": "cassetta delle chiavi (codice inviato separatamente)",
                       "de": "Schlüsselbox (Code separat gesendet)"}


def _dossier_gabarits():
    """Localise docs/templates/ (repo, container /opt/lcd, ou cwd)."""
    ici = os.path.dirname(os.path.abspath(__file__))
    for cand in (os.path.join(ici, "..", "..", "docs", "templates"),
                 "/opt/lcd/docs/templates",
                 os.path.join(os.getcwd(), "docs", "templates"),
                 os.path.join(os.getcwd(), "custom", "decision-engine",
                              "..", "..", "docs", "templates")):
        if os.path.isdir(os.path.normpath(cand)):
            return os.path.normpath(cand)
    return ""


def charger_gabarit(base, langue):
    """Retourne (texte, langue_utilisee, traduction_auto). FR -> base.md, sinon
    base.{langue}.md, fallback base.en.md + badge auto si hors socle."""
    dossier = _dossier_gabarits()
    code = (langue or "fr").lower()[:2]
    candidats = []
    if code in LANGUES_SOCLE and code != "fr":
        candidats.append(f"{base}.{code}.md")
    elif code == "fr":
        candidats.append(f"{base}.md")
    else:
        candidats.append(f"{base}.en.md")
    if f"{base}.md" not in candidats:
        candidats.append(f"{base}.md")
    if f"{base}.en.md" not in candidats:
        candidats.append(f"{base}.en.md")
    for nom in candidats:
        if not dossier:
            break
        path = os.path.join(dossier, nom)
        try:
            with open(path, encoding="utf-8") as f:
                lignes = [l for l in f if not l.startswith("#")]
            texte = "".join(lignes).strip()
            if texte:
                utilisee = "fr" if nom == f"{base}.md" else nom.rsplit(".", 2)[-2]
                return texte, utilisee, (code not in LANGUES_SOCLE)
        except FileNotFoundError:
            continue
    return "", "fr", (code not in LANGUES_SOCLE)


def composer_message(type_event, langue, variables):
    """Compose le message voyageur : gabarit langue + injection placeholders APRÈS.
    variables : dict (marque, logement, pin_affichage, slot_nom, arrivee, depart,
    wifi_qr, heure_arrivee, adresse, tel_urgence, lien_questionnaire, lien_guide,
    lien_avis, lien_pwa...). Clés manquantes -> '' (jamais de {{ }} résiduel envoyé)."""
    base = GABARIT_PAR_EVENT.get(type_event)
    if not base:
        return "", langue or "fr", False
    texte, utilisee, auto = charger_gabarit(base, langue)
    if not texte:
        return "", utilisee, auto
    for k, v in (variables or {}).items():
        texte = texte.replace("{{ " + str(k) + " }}", "" if v is None else str(v))
    texte = re.sub(r"\{\{\s*\w+\s*\}\}", "", texte)
    if auto:
        texte = "[traduction automatique] " + texte
    return texte.strip(), utilisee, auto


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


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
                    elif v:
                        data[k] = v
    except FileNotFoundError:
        pass
    return data


def lire_logements(path):
    """Extrait par logement : pricing, copro.verifiee, features, mode (parseur minimal)."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    logts = {}
    cur = None
    section = None  # pricing | copro | features | None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        prop = ligne.strip()
        if indent == 2 and prop in ("log1:", "log2:", "log3:"):
            cur = prop[:-1]
            logts[cur] = {"prix_base": 110, "prix_min": 75, "prix_max": 290,
                          "mode_gestion_defaut": "equilibre",
                          "copro_verifiee": False, "features": {}}
            section = None
            continue
        if cur is None:
            continue
        if indent == 4 and prop in ("pricing:", "copro:", "features:"):
            section = prop[:-1]
            continue
        if indent == 4 and prop.endswith(":"):
            section = None  # menage:, autres blocs
            continue
        if section and ":" in prop:
            k, v = [x.strip().strip("\"'") for x in prop.split(":", 1)]
            if section == "pricing":
                if k in ("prix_base", "prix_min", "prix_max"):
                    try:
                        logts[cur][k] = int(float(v))
                    except ValueError:
                        pass
                elif k == "mode_gestion_defaut" and v:
                    logts[cur][k] = v
            elif section == "copro":
                if k == "verifiee":
                    logts[cur]["copro_verifiee"] = (v == "true")
            elif section == "features":
                logts[cur]["features"][k] = (v == "true")
    return logts


def lire_acces(path):
    """Extrait personnes : id, role, sous_role, logements, expire_le (parseur minimal)."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    pers = {}
    cur = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        prop = ligne.strip()
        if indent == 2 and prop.startswith("- id:"):
            cur = prop.split(":", 1)[1].strip().strip("\"'")
            pers[cur] = {"role": "", "sous_role": "", "logements": [], "expire_le": None}
            continue
        if cur and indent >= 4 and ":" in prop and not prop.startswith("- "):
            k, v = [x.strip().strip("\"'") for x in prop.split(":", 1)]
            if k in ("role", "sous_role"):
                pers[cur][k] = v
            elif k == "logements":
                v = v.strip("[]")
                pers[cur][k] = [x.strip().strip("\"'") for x in v.split(",") if x.strip()]
            elif k == "expire_le":
                pers[cur][k] = None if v in ("", "null", "None") else v
    return pers


class Moteur:
    def __init__(self, cfg, logts, acces, secrets):
        self.cfg = cfg
        self.logts = logts
        self.acces = acces
        self.secrets = secrets
        self.decision_dir = os.environ.get("LCD_DECISION_LOG_DIR",
                                          cfg.get("decision_log_dir", "./state"))
        os.makedirs(self.decision_dir, exist_ok=True)
        self.ha_url = os.environ.get("LCD_HA_URL", cfg.get("ha_url", "")).rstrip("/")
        self.ha_token = os.environ.get("LCD_HA_TOKEN", secrets.get("ha_api_token", ""))
        self.ics_sync_url = os.environ.get(
            "LCD_ICS_SYNC_URL", cfg.get("ics_sync_url", "http://127.0.0.1:8090")).rstrip("/")
        self.pricing_url = os.environ.get(
            "LCD_PRICING_URL", cfg.get("pricing_url", "http://127.0.0.1:8091")).rstrip("/")
        self.commissions = {
            "direct": float(cfg.get("commission_direct", 0.00)),
            "airbnb": float(cfg.get("commission_airbnb", 0.15)),
            "booking": float(cfg.get("commission_booking", 0.17)),
            "abritel": float(cfg.get("commission_abritel", 0.10)),
            "expedia": None,  # taux contrat à vérifier -> reco sans prix + motif
        }

    # --- RBAC ---
    def autoriser(self, qui_id, action, logement_id):
        p = self.acces.get(qui_id)
        if not p:
            return False, f"qui inconnu: {qui_id}", None
        if p.get("expire_le"):
            try:
                if dt.date.fromisoformat(p["expire_le"]) < dt.date.today():
                    return False, f"compte expiré le {p['expire_le']}", p
            except ValueError:
                pass
        if logement_id and logement_id not in p.get("logements", []):
            return False, (f"hors périmètre : {qui_id} n'a pas {logement_id} "
                           f"(périmètre {p.get('logements')})"), p
        droits = PERMISSIONS.get((p.get("role"), p.get("sous_role")), set())
        if "*" in droits or action in droits:
            return True, f"{p.get('role')}/{p.get('sous_role')} autorisé {action}", p
        return False, f"{p.get('role')}/{p.get('sous_role')} non autorisé {action}", p

    # --- traçabilité (schéma §README, 90 j accès) ---
    def log_decision(self, logement_id, ref, qui, quoi, canal=None, montant=None,
                     motif="", llm=None, jev=None):
        tx = self.commissions.get(canal) if canal else None
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": canal, "commission": tx,
                 "net_hote": (None if (tx is None or montant is None or
                                       not isinstance(montant, (int, float)))
                              else round(float(montant) * (1.0 - tx), 2)),
                 "llm": llm or {}, "jev": jev or {}, "motif": motif}
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

    def ha_get(self, url):
        try:
            with urllib.request.urlopen(url, timeout=8) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            return None

    # --- état unifié ---
    def etat(self, logement_id):
        l = self.logts.get(logement_id)
        if not l:
            return None, f"logement inconnu: {logement_id}"
        config_ok = bool(l["copro_verifiee"])
        alertes = []
        if not config_ok:
            alertes.append("copro.verifiee=false : mise en ligne BLOQUÉE (régénérer docs §12.1)")
        # occupation : planning fusionné ics-sync (state partagé, fallback HTTP /dispo)
        sejours = []
        state_dir = os.environ.get("LCD_STATE_DIR", "./state")
        for cand in (os.path.join(state_dir, f"planning-{logement_id}.json"),
                     os.path.join(self.cfg.get("state_dir", "./state"),
                                  f"planning-{logement_id}.json")):
            try:
                with open(cand, encoding="utf-8") as f:
                    sejours = json.load(f)
                break
            except (FileNotFoundError, json.JSONDecodeError):
                continue
        auj = dt.date.today()
        occupees = sum(1 for i in range(30)
                       if any(s["debut"] <= (auj + dt.timedelta(days=i)).isoformat() < s["fin"]
                              for s in sejours))
        occupation = {"occ_j30": round(occupees / 30.0, 3), "sejours_connus": len(sejours)}
        # prix pivot J (pricing-engine, fallback local si injoignable)
        prix = self.ha_get(f"{self.pricing_url}/prix?logement_id={logement_id}"
                           f"&date={auj.isoformat()}") if self.pricing_url else None
        if not prix:
            prix = {"pivot": None, "note": "pricing-engine injoignable (LXC box)",
                    "bornes": [l["prix_min"], l["prix_max"]]}
        return {"logement_id": logement_id, "config_ok": config_ok,
                "copro_verifiee": config_ok, "occupation": occupation, "prix": prix,
                "features_actives": sorted(k for k, v in l["features"].items() if v),
                "bornes_prix": [l["prix_min"], l["prix_max"]], "alertes": alertes}, None

    def pousser_config_ok(self):
        """sensor.logX_config_ok : rouge (off) si copro non vérifiée."""
        res = []
        for log, l in self.logts.items():
            ok, info = self.ha_post(
                f"/api/states/sensor.{log}_config_ok",
                {"state": "on" if l["copro_verifiee"] else "off",
                 "attributes": {"copro_verifiee": l["copro_verifiee"],
                                "updated": utcnow_iso(),
                                "note": ("mise en ligne BLOQUÉE : accord syndic + Cerfa requis"
                                         if not l["copro_verifiee"] else "config OK")}})
            res.append((log, ok, info))
        return res

    # --- règles prioritaires : sécurité > occupation > énergie > confort > prix ---
    @staticmethod
    def priorite(quoi):
        ordre = {"securite": 0, "acces": 1, "ics": 1, "menage": 1, "energie": 2,
                 "compta": 3, "prix": 4, "prix_derogation": 4, "llm": 5, "jev": 5}
        return ordre.get(quoi, 9)

    def decider(self, logement_id, ref, qui_id, quoi, canal=None, montant=None,
                motif="", llm=None, jev=None):
        """Porte d'entrée unique : RBAC + copro + bornes + hors_bornes Jev, puis log."""
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        action = QUOI_VERS_ACTION.get(quoi, "etat_lecture")
        ok, msg_rbac, p = self.autoriser(qui_id, action, logement_id)
        qui = f"{qui_id}:{p.get('role')}/{p.get('sous_role')}" if p else qui_id
        # Jev hors scope -> blocage (M-JEV4 : hors_bornes>0,5 jamais auto)
        if isinstance(jev, dict) and float(jev.get("hors_bornes", 0) or 0) > 0.5:
            self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                              f"BLOQUÉ Jev hors_bornes={jev.get('hors_bornes')} : {motif}",
                              llm, jev)
            return 403, {"statut": "bloque", "motif": "jev_hors_bornes>0,5 : humain requis"}
        if not ok:
            self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                              f"BLOQUÉ RBAC : {msg_rbac}", llm, jev)
            return 403, {"statut": "bloque", "motif": msg_rbac}
        # copro : mise en ligne bloquée (lecture/reco restent autorisées)
        if not l["copro_verifiee"] and action in ("event_envoi", "prix_derogation",
                                                  "forcage_stop_sell", "config_modif"):
            self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                              "BLOQUÉ copro.verifiee=false : mise en ligne interdite", llm, jev)
            return 403, {"statut": "bloque",
                         "motif": "copro.verifiee=false : mise en ligne BLOQUÉE"}
        # bornes prix inviolables : dérogation = humain + motif, sinon 422
        if quoi in ("prix", "prix_derogation") and isinstance(montant, (int, float)):
            pmin, pmax = l["prix_min"], l["prix_max"]
            if not (pmin <= montant <= pmax):
                if quoi != "prix_derogation" or not motif:
                    self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                                      f"BLOQUÉ hors bornes [{pmin}, {pmax}] sans motif humain",
                                      llm, jev)
                    return 422, {"statut": "bloque",
                                 "erreur": f"hors bornes [{pmin}, {pmax}] : motif humain obligatoire"}
        self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                          motif or f"{action} autorisé ({msg_rbac})", llm, jev)
        return 200, {"statut": "autorise", "priorite": self.priorite(quoi), "detail": msg_rbac}

    def emettre_event(self, type_event, logement_id, qui_id, ref="", data=None):
        """Émet lcd_j2_envoi_acces / lcd_j1_rappel / lcd_checkout / lcd_avis_j1 vers HA.
        Messages composés ici (langue voyageur socle + auto §5.7-ter, gabarits
        docs/templates/message_{checkin_j2,checkin_j1,avis_j1}[.{en,es,it,de}].md),
        jamais par les blueprints. J-1 : rappel seul, jamais de re-push PIN (§5.2).
        J+1 : enquête avis (§5.7-bis : >=4★ lien public, <4★ rattrapage privé) —
        jamais de PIN dans data.message ni data.pin J+1.
        PIN : jamais généré ici — transite depuis KeyMaster ou reste vide (boîte à clés).
        PIN : jamais en clair dans logs/recorder/logbook (motif loggé sans PIN)."""
        if type_event not in TYPES_EVENT:
            return 400, {"erreur": f"type inconnu (attendus {sorted(TYPES_EVENT)})"}
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ok, msg_rbac, p = self.autoriser(qui_id, "event_envoi", logement_id)
        qui = f"{qui_id}:{p.get('role')}/{p.get('sous_role')}" if p else qui_id
        if not ok:
            self.log_decision(logement_id, ref or type_event, qui, "acces", None, None,
                              f"BLOQUÉ RBAC event {type_event} : {msg_rbac}")
            return 403, {"statut": "bloque", "motif": msg_rbac}
        if not l["copro_verifiee"]:
            self.log_decision(logement_id, ref or type_event, qui, "acces", None, None,
                              f"BLOQUÉ event {type_event} : copro.verifiee=false")
            return 403, {"statut": "bloque",
                         "motif": "copro.verifiee=false : mise en ligne BLOQUÉE"}
        data = dict(data or {})
        langue = (data.get("langue") or "fr")
        # log2 LIGHT / smart_lock off -> pin vide + message boîte à clés (jamais généré ici)
        if not l["features"].get("smart_lock", True):
            data["pin"] = ""
            data.setdefault("message_boite_cles", True)
        # J-1 rappel seul + J+1 enquête : jamais de PIN transféré (ni MQTT, ni message)
        if type_event in ("lcd_j1_rappel", "lcd_avis_j1"):
            data["pin"] = ""
        # Composition localisée (gabarit langue + injection placeholders APRÈS).
        langue_utilisee, traduction_auto = langue, False
        if type_event in GABARIT_PAR_EVENT:
            variables = dict(data)
            if not (variables.get("pin") or ""):
                code_langue = (langue or "fr").lower()[:2]
                variables["pin"] = CONSIGNE_BOITE_CLES.get(
                    code_langue, CONSIGNE_BOITE_CLES["fr"])
            message, langue_utilisee, traduction_auto = composer_message(
                type_event, langue, variables)
            data["message"] = message or data.get("message", "")
            data["langue_utilisee"] = langue_utilisee
            data["traduction_auto"] = traduction_auto
        ok_ha, info = self.ha_post(f"/api/events/{type_event}",
                                   {"logement_id": logement_id, **data})
        self.log_decision(logement_id, ref or type_event, qui, "acces", None, None,
                          f"event {type_event} -> HA {'OK' if ok_ha else info}")
        code = 200 if ok_ha else 202
        # Réponse : métadonnées SÛRES uniquement — jamais le message (contient le
        # PIN J-2) ni le PIN lui-même (jamais en clair logs/recorder/logbook).
        msg = data.get("message", "")
        return code, {"statut": "emis" if ok_ha else "loge_sans_ha",
                      "type": type_event, "ha": info,
                      "langue": langue_utilisee,
                      "traduction_auto": traduction_auto,
                      "gabarit_trouve": bool(msg),
                      "message_longueur": len(msg),
                      "placeholders_restants": msg.count("{{"),
                      "pin_transmis": bool(data.get("pin")),
                      "message_boite_cles": bool(data.get("message_boite_cles"))}


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
            return json.loads(self.rfile.read(n) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return None

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/etat":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            res, err = self.engine.etat(logement_id)
            if err:
                return self._json(404, {"erreur": err})
            return self._json(200, res)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        p = self._lire_json()
        if p is None:
            return self._json(400, {"erreur": "JSON invalide"})
        if url.path == "/autoriser":
            if not (p.get("qui_id") and p.get("action") and p.get("logement_id")):
                return self._json(400, {"erreur": "qui_id, action, logement_id requis"})
            ok, msg, pers = self.engine.autoriser(p["qui_id"], p["action"], p["logement_id"])
            return self._json(200, {"autorise": ok, "motif": msg,
                                    "role": (f"{pers.get('role')}/{pers.get('sous_role')}"
                                             if pers else None)})
        if url.path == "/decision":
            if not (p.get("logement_id") and p.get("qui") and p.get("quoi")):
                return self._json(400, {"erreur": "logement_id, qui, quoi requis"})
            code, obj = self.engine.decider(
                p["logement_id"], p.get("ref", p["quoi"]), p["qui"], p["quoi"],
                p.get("canal"), p.get("montant"), p.get("motif", ""),
                p.get("llm"), p.get("jev"))
            return self._json(code, obj)
        if url.path == "/event":
            if not (p.get("type") and p.get("logement_id") and p.get("qui")):
                return self._json(400, {"erreur": "type, logement_id, qui requis"})
            code, obj = self.engine.emettre_event(
                p["type"], p["logement_id"], p["qui"], p.get("ref", ""), p.get("data"))
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD decision-engine P2-8")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--acces", default="../acces.yaml")
    ap.add_argument("--check", action="store_true",
                    help="vérifie copro + pousse sensor.logX_config_ok + affiche état")
    ap.add_argument("--serve", action="store_true", help="démarre l'API HTTP")
    args = ap.parse_args()

    cfg = charger_yaml_plat(args.config)
    logts = lire_logements(args.logements)
    if not logts:
        print(f"logements introuvables ou vides: {args.logements}", file=sys.stderr)
        return 2
    acces = lire_acces(args.acces)
    if not acces:
        print(f"acces introuvable ou vide: {args.acces}", file=sys.stderr)
        return 2
    secrets = charger_yaml_plat(os.environ.get("LCD_SECRETS_YAML", "./secrets.yaml"))
    eng = Moteur(cfg, logts, acces, secrets)
    Handler.engine = eng

    if args.check or not args.serve:
        for log in logts:
            res, err = eng.etat(log)
            print(json.dumps(res or {"erreur": err}, ensure_ascii=False)[:400] + "...")
        print("config_ok:", eng.pousser_config_ok())
        if not args.serve:
            return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8092)))
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # lab Docker : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"decision-engine : HTTP 127.0.0.1:{port} ({', '.join(logts)})", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
