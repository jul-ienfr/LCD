#!/usr/bin/env python3
# custom/llm-router-ui/router_ui.py — UI routage proxy LLM :8050 (P7-3, §6.5).
# 0 € : stdlib seule. LAN + WireGuard seule, jamais WAN (panel_iframe /systeme).
# Même LXC/box que le proxy :4000 (ici LXC lab dédié, mêmes volumes).
#
# Primaire + fallbacks illimités `lcd-chat-*` + `lcd-jev` (Jev via proxy
# :4000, PIVOT 2026-10-09 : muse-spark 1.3 + jev-1.13 servis par la gateway
# :4000 apportée par l'hôte ; wrapper jev-gateway non retenu, P7-20) ;
# bouton Tester par ligne ; reload chaud
# (lecture directe des fichiers, toujours chaude) ; santé OK/KO/cooldown
# par alias ; garde-fous NON supprimables (temperature 0.2, max_tokens 250,
# timeouts 8 s voix / 6 s Jev, retry 1, cooldown 30 s — vivent dans
# config.yaml/endpoints.yaml, JAMAIS éditables ici : clés inconnues -> 400).
# Secrets JAMAIS exposés : api_key/master_key (refs os.environ/... dans les
# fichiers) ne sortent jamais (seuls alias/fournisseur/modèle/timeout lus).
#
# Règles (verrouillées en code) :
#   - écritures = geste humain (`qui` != auto/llm/jev/moteur-*) ;
#   - primaire + fallbacks ∈ aliases du proxy, primaire hors fallbacks
#     (jamais redondant), retry 0-3, cooldown 0-300 s ;
#   - toute modification = backup horodaté routing.backup-<ts>.json (5 max)
#     + ligne audit routes-audit.jsonl (qui/quand/avant→après) ;
#   - Tester = connexion TCP courte (api_base local) ou statut cloud
#     (clé box requise) — lab sans backends = KO documenté, jamais d'exception.
#
# Contrats :
#   GET  /health -> {"ok": true}
#   GET  /routes -> {primaire, fallbacks, retry, cooldown_seconds,
#     alerte_cout_mois_eur, aliases: [{alias, fournisseur, modele, timeout}],
#     sante: {alias: {ok, ts}}, validation: {ok, alertes[]}}
#   POST /route {qui, primaire?, fallbacks?, retry?, cooldown_seconds?}
#     -> 200 {avant, apres} (backup + audit)
#   POST /tester {qui, alias} -> 200 {alias, ok, latence_ms?, detail?}
#     (+ santé mémorisée)
#   POST /reload -> 200 {reloaded: true, validation} (relecture fichiers)
#   POST /resoudre {alias?, eu_only?} -> P7-4 : 200 {alias_effectif,
#     fournisseur, modele, timeout, via} (lecture seule : eu_only ->
#     override UE ; alias direct si connu ; sinon primaire.
#     `select.logX_llm_backend` + `input_text.logX_llm_model_override` +
#     `sensor.llm_cout_mois` (alerte >5 €) + vérif dépréciation mensuelle =
#     box HA, jamais ici)
#   GET  /prompts -> P7-10/11/12/13/14 : catalogue M1-M8 + J1-J9 +
#     pricing/compta (pllm/pjev) + ops (ollm M-LLM1-10)
#     (usage + moteur + alias/construits + variables + interdits,
#     lecture seule)
#   POST /composer {usage, variables} -> 200 {prompt, alias|backend, ...}
#     (trous seuls 422 variable_manquante, placeholders injectés APRÈS,
#     jamais d'appel : proxy :4000 apporté par l'hôte, sortie = proposition)
#
# Usage : python3 router_ui.py --config config.yaml [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND.
#   Fichiers proxy localisés seuls : ../llm-proxy/ (repo/box) ou
#   /opt/lcd/custom/llm-proxy/ (Docker) ou LCD_PROXY_DIR.

import argparse
import datetime as dt
import glob
import json
import os
import re
import socket
import sys
import time
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI_AUTO = ("auto", "llm", "jev", "moteur-direct", "moteur-dispatch",
            "moteur-caution", "")
SLUG_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")
GARDEFOUS_ATTENDUS = {"temperature": 0.2, "max_tokens": 250,
                      "timeout_voix": 8, "timeout_jev": 6}
CLES_ROUTE = ("primaire", "fallbacks", "retry", "cooldown_seconds")


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


def dossier_proxy():
    """Localise custom/llm-proxy/ (repo, container /opt/lcd, ou env)."""
    cands = [os.environ.get("LCD_PROXY_DIR", ""),
             os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "..", "llm-proxy"),
             "/opt/lcd/custom/llm-proxy",
             os.path.join(os.getcwd(), "custom", "llm-proxy")]
    for c in cands:
        if c and os.path.isdir(os.path.normpath(c)):
            return os.path.normpath(c)
    return ""


def lire_aliases(path):
    """model_list du proxy : {alias: {fournisseur, modele, temperature,
    max_tokens, timeout, api_base, cle_ref}} — parseur indenté minimal
    (clés API JAMAIS lues en valeur : seule la présence du ref est notée)."""
    aliases = {}
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return aliases
    cur = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        m = re.match(r"^\s+-\s+model_name:\s*(\S+)\s*$", ligne)
        if m:
            cur = m.group(1).strip("\"'")
            aliases[cur] = {"temperature": None, "max_tokens": None,
                            "timeout": None, "api_base": "",
                            "fournisseur": "", "modele": ""}
            continue
        if cur is None:
            continue
        m2 = re.match(r"^\s+(\w+):\s*(.*?)\s*$", ligne)
        if not m2:
            continue
        k, v = m2.group(1), m2.group(2).strip().strip("\"'")
        if k == "model" and "/" in v:
            aliases[cur]["fournisseur"] = v.split("/")[0]
            aliases[cur]["modele"] = v
        elif k in ("temperature", "max_tokens", "timeout"):
            try:
                aliases[cur][k] = float(v) if "." in v else int(v)
            except ValueError:
                pass
        elif k == "api_base":
            aliases[cur]["api_base"] = v
    return aliases


def lire_routing(path):
    """routing.json tolérant (lignes `#` commentaires ignorées)."""
    try:
        with open(path, encoding="utf-8") as f:
            brut = "\n".join(l for l in f
                             if not l.strip().startswith("#"))
        data = json.loads(brut)
        return data if isinstance(data, dict) else {}, None
    except FileNotFoundError:
        return None, "routing.json introuvable"
    except ValueError:
        return None, "routing.json illisible"


def lire_endpoints(path):
    """timeouts voix/jev + retry/cooldown/offline/alerte (regex ciblées)."""
    try:
        with open(path, encoding="utf-8") as f:
            brut = f.read()
    except FileNotFoundError:
        return {}
    vals = {}
    for cle in ("voix_seconds", "jev_seconds", "retry", "cooldown_seconds",
                "alerte_cout_mois_eur"):
        m = re.search(rf"^\s*{cle}:\s*([0-9.]+)", brut, re.M)
        if m:
            vals[cle] = float(m.group(1))
    m = re.search(r"^\s*offline_fallback:\s*(\S+)", brut, re.M)
    if m:
        vals["offline_fallback"] = m.group(1).strip("\"'")
    return vals


TROU = re.compile(r"\{\{\s*(\w+)\s*\}\}")


def lire_prompts(path):
    """Registre prompts M1-M8 + J1-J9 + pricing/compta + ops M-LLM1-10
    (prompts.yaml, UNE ligne par champ) :
    {usage: {moteur (llm|jev), alias, construits[], seuils, variables[],
    interdits[], systeme}}."""
    prompts = {}
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return prompts
    cur = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        m = re.match(r"^  - usage:\s*(\S+)\s*$", ligne)
        if m:
            cur = m.group(1).strip("\"'")
            prompts[cur] = {"moteur": "llm", "alias": "",
                            "construits": [], "seuils": "",
                            "variables": [], "interdits": [],
                            "systeme": ""}
            continue
        if cur is None:
            continue
        m2 = re.match(r"^    (\w+):\s*(.*?)\s*$", ligne)
        if not m2:
            continue
        k, v = m2.group(1), m2.group(2).strip().strip("\"'")
        if k in ("variables", "interdits", "construits"):
            v = v.strip("[]")
            prompts[cur][k] = [x.strip().strip("\"'") for x in v.split(",")
                               if x.strip()]
        elif k in ("alias", "systeme", "moteur", "seuils"):
            prompts[cur][k] = v
    return {u: p for u, p in prompts.items() if p.get("systeme")}


class Routeur:
    def __init__(self, cfg, proxy_dir=""):
        self.cfg = cfg
        self.proxy_dir = proxy_dir or dossier_proxy()
        self.state_dir = (os.environ.get("LCD_STATE_DIR")
                          or cfg.get("state_dir", "./state"))
        os.makedirs(self.state_dir, exist_ok=True)

    # --- fichiers (lecture directe = toujours chaud) ---
    def _ch(self, nom):
        return os.path.join(self.proxy_dir, nom) if self.proxy_dir else nom

    def _etat(self):
        aliases = lire_aliases(self._ch("config.yaml"))
        routing, err = lire_routing(self._ch("routing.json"))
        endpoints = lire_endpoints(self._ch("endpoints.yaml"))
        sante = {}
        try:
            with open(os.path.join(self.state_dir, "router-health.json"),
                      encoding="utf-8") as f:
                sante = json.load(f)
            sante = sante if isinstance(sante, dict) else {}
        except (FileNotFoundError, ValueError):
            pass
        return aliases, routing, err, endpoints, sante

    def _sauver_sante(self, sante):
        cible = os.path.join(self.state_dir, "router-health.json")
        tmp = cible + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(sante, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, cible)

    def _audit(self, qui, avant, apres):
        with open(os.path.join(self.state_dir, "routes-audit.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps({"ts": utcnow_iso(), "qui": qui,
                                "avant": avant, "apres": apres},
                               ensure_ascii=False) + "\n")

    # --- validation : aliases + garde-fous non supprimables ---
    def _valider(self, aliases, routing, endpoints):
        alertes = []
        if routing is None:
            return False, ["routing.json illisible"]
        names = set(aliases)
        if routing.get("primaire") not in names:
            alertes.append(f"primaire inconnu : {routing.get('primaire')}")
        for fb in routing.get("fallbacks", []) or []:
            if fb not in names:
                alertes.append(f"fallback inconnu : {fb}")
        if routing.get("primaire") in (routing.get("fallbacks", []) or []):
            alertes.append("primaire redondant avec les fallbacks")
        for alias, p in aliases.items():
            if p.get("temperature") != GARDEFOUS_ATTENDUS["temperature"]:
                alertes.append(f"{alias} : temperature != 0.2 (garde-fou)")
            if p.get("max_tokens") != GARDEFOUS_ATTENDUS["max_tokens"]:
                alertes.append(f"{alias} : max_tokens != 250 (garde-fou)")
        if endpoints.get("voix_seconds") != GARDEFOUS_ATTENDUS[
                "timeout_voix"]:
            alertes.append("endpoints : timeout voix != 8 s (garde-fou)")
        if endpoints.get("jev_seconds") != GARDEFOUS_ATTENDUS["timeout_jev"]:
            alertes.append("endpoints : timeout Jev != 6 s (garde-fou)")
        return (not alertes), alertes

    # --- GET /routes ---
    def routes(self):
        aliases, routing, err, endpoints, sante = self._etat()
        if err:
            return 500, {"erreur": err}
        ok, alertes = self._valider(aliases, routing, endpoints)
        fiches = [{"alias": a,
                   "fournisseur": p.get("fournisseur", ""),
                   "modele": p.get("modele", ""),
                   "timeout": p.get("timeout")}
                  for a, p in sorted(aliases.items())]
        return 200, {"primaire": routing.get("primaire"),
                     "fallbacks": routing.get("fallbacks", []),
                     "retry": routing.get("retry"),
                     "cooldown_seconds": routing.get("cooldown_seconds"),
                     "alerte_cout_mois_eur": routing.get(
                         "alerte_cout_mois_eur"),
                     "eu_only_override": routing.get("eu_only_override"),
                     "aliases": fiches,
                     "sante": sante,
                     "validation": {"ok": ok, "alertes": alertes}}

    # --- POST /route : primaire/fallbacks/retry/cooldown (humain seul) ---
    def changer_route(self, qui, patch):
        if not qui or str(qui).strip().lower() in QUI_AUTO:
            return 400, {"erreur": "routage = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        if not isinstance(patch, dict):
            return 400, {"erreur": "patch objet {primaire?, fallbacks?, "
                                   "retry?, cooldown_seconds?}"}
        inconnues = [k for k in patch if k not in CLES_ROUTE]
        if inconnues:
            return 400, {"erreur": "clés garde-fou non éditables "
                                   f"(rejetées : {', '.join(inconnues)})",
                         "code": "cle_inconnue",
                         "editables": list(CLES_ROUTE)}
        aliases, routing, err, _, _ = self._etat()
        if err:
            return 500, {"erreur": err}
        avant = {k: routing.get(k) for k in CLES_ROUTE}
        apres = dict(avant)
        if "primaire" in patch:
            prim = str(patch["primaire"] or "").strip()
            if prim not in aliases:
                return 400, {"erreur": f"primaire inconnu : {prim}"}
            apres["primaire"] = prim
        if "fallbacks" in patch:
            fbs = patch["fallbacks"]
            if not isinstance(fbs, list) or not fbs:
                return 400, {"erreur": "fallbacks[] non vide requis"}
            fbs = [str(x or "").strip() for x in fbs]
            inconnus = [x for x in fbs if x not in aliases]
            if inconnus:
                return 400, {"erreur": "fallbacks inconnus : "
                                       + ", ".join(inconnus)}
            apres["fallbacks"] = fbs
        if apres["primaire"] in (apres["fallbacks"] or []):
            return 400, {"erreur": "primaire redondant avec les fallbacks"}
        if "retry" in patch:
            try:
                retry = int(patch["retry"])
            except (TypeError, ValueError):
                return 400, {"erreur": "retry entier 0-3"}
            if retry < 0 or retry > 3:
                return 400, {"erreur": "retry entier 0-3"}
            apres["retry"] = retry
        if "cooldown_seconds" in patch:
            try:
                cd = int(patch["cooldown_seconds"])
            except (TypeError, ValueError):
                return 400, {"erreur": "cooldown_seconds entier 0-300"}
            if cd < 0 or cd > 300:
                return 400, {"erreur": "cooldown_seconds entier 0-300"}
            apres["cooldown_seconds"] = cd
        if apres == avant:
            return 200, {"statut": "inchange", "routes": avant}
        # Backup horodaté (5 max) + écriture + audit.
        chemin = self._ch("routing.json")
        try:
            with open(chemin, encoding="utf-8") as f:
                brut = f.read()
        except FileNotFoundError:
            return 500, {"erreur": "routing.json introuvable"}
        stamp = utcnow_iso().replace(":", "").replace("+", "")
        with open(f"{chemin}.backup-{stamp}", "w", encoding="utf-8") as f:
            f.write(brut)
        for vieux in sorted(glob.glob(f"{chemin}.backup-*"))[:-5]:
            try:
                os.remove(vieux)
            except OSError:
                pass
        try:
            data = json.loads("\n".join(
                l for l in brut.splitlines()
                if not l.strip().startswith("#")))
        except ValueError:
            return 500, {"erreur": "routing.json illisible"}
        data.update(apres)
        entete = [l for l in brut.splitlines()
                  if l.strip().startswith("#")]
        lignes = [l + "\n" for l in entete]
        lignes.append(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            f.writelines(lignes)
        os.replace(tmp, chemin)
        self._audit(qui, avant, apres)
        return 200, {"statut": "route_changee", "avant": avant,
                     "apres": apres}

    # --- POST /tester : santé par ligne (TCP court ou statut cloud) ---
    def tester(self, qui, alias):
        if not qui or str(qui).strip().lower() in QUI_AUTO:
            return 400, {"erreur": "test = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        alias = str(alias or "").strip()
        aliases, _, err, _, sante = self._etat()
        if err:
            return 500, {"erreur": err}
        if alias not in aliases:
            return 400, {"erreur": f"alias inconnu : {alias}"}
        base = str(aliases[alias].get("api_base", "") or "").strip()
        t0 = time.monotonic()
        if not base:
            res = {"alias": alias, "ok": False,
                   "detail": "cloud (clé box + WAN requis, voir secrets)"}
        else:
            m = re.match(r"^https?://([^/:]+)(?::(\d+))?", base)
            if not m:
                res = {"alias": alias, "ok": False,
                       "detail": f"api_base illisible : {base}"}
            else:
                hote, port = m.group(1), int(m.group(2) or 80)
                try:
                    socket.create_connection((hote, port), timeout=3).close()
                    res = {"alias": alias, "ok": True,
                           "latence_ms": int(
                               (time.monotonic() - t0) * 1000)}
                except OSError as e:
                    res = {"alias": alias, "ok": False,
                           "detail": f"{hote}:{port} injoignable "
                                     f"({type(e).__name__})"}
        sante[alias] = {"ok": res["ok"], "ts": utcnow_iso(),
                        "latence_ms": res.get("latence_ms")}
        self._sauver_sante(sante)
        return 200, res

    # --- POST /reload : relecture fichiers (toujours chaude) ---
    def reload(self):
        aliases, routing, err, endpoints, _ = self._etat()
        if err:
            return 500, {"erreur": err}
        ok, alertes = self._valider(aliases, routing, endpoints)
        return 200, {"reloaded": True,
                     "aliases": sorted(aliases),
                     "validation": {"ok": ok, "alertes": alertes}}

    def _prompts(self):
        base = self.proxy_dir or dossier_proxy()
        return lire_prompts(os.path.join(base, "prompts.yaml")) if base \
            else {}

    # --- GET /prompts : catalogue M1-M8 + J1-J9 + pricing/compta + ops
    # (lecture seule) ---
    def prompts(self):
        reg = self._prompts()
        if not reg:
            return 500, {"erreur": "prompts.yaml introuvable ou vide"}
        return 200, {"usages": [{"usage": u,
                                 "moteur": p.get("moteur", "llm"),
                                 "alias": p["alias"],
                                 "construits": p.get("construits", []),
                                 "variables": p["variables"],
                                 "interdits": p["interdits"]}
                                for u, p in sorted(reg.items())],
                     "total": len(reg)}

    # --- POST /composer : prompt composé (trous seuls, jamais d'appel) ---
    def composer(self, usage, variables):
        """Compose le prompt système + variables (M1-M8 / J1-J9 / pricing /
        ops M-LLM1-10 LLM, Jev).
        Déterministe : usage connu (400 sinon) ; LLM : alias du registre ∈
        proxy (400 sinon) ; Jev : backend zen via proxy :4000 apporté
        (modèle jev-1.13, seuils = POST /gardien decision) ; variables requises
        présentes (422 variable_manquante, jamais de trou vide — même contrat
        que M-LLM-7 facturation), placeholders {{ }} injectés APRÈS (jamais
        traduits). Ne fait JAMAIS l'appel : retourne le prompt prêt
        à envoyer (sortie = proposition seule, validation 1-tap)."""
        reg = self._prompts()
        if not reg:
            return 500, {"erreur": "prompts.yaml introuvable ou vide"}
        usage = str(usage or "").strip()
        if usage not in reg:
            return 400, {"erreur": "usage parmi : "
                                   + ", ".join(sorted(reg))}
        spec = reg[usage]
        moteur = spec.get("moteur", "llm")
        if moteur == "llm":
            aliases, _, err, _, _ = self._etat()
            if err:
                return 500, {"erreur": err}
            if spec["alias"] not in aliases:
                return 400, {"erreur": f"alias {spec['alias']} hors proxy"}
            moteur_out = {"moteur": "llm", "alias": spec["alias"]}
        elif moteur == "jev":
            moteur_out = {"moteur": "jev", "backend": "zen",
                          "endpoint": ":4000", "modele": "jev-1.13",
                          "seuils": spec.get("seuils", ""),
                          "construits": spec.get("construits", [])}
        else:
            return 400, {"erreur": f"moteur inconnu : {moteur}"}
        if not isinstance(variables, dict):
            return 400, {"erreur": "variables{} requises"}
        fusion = {k: str(v or "") for k, v in variables.items()}
        manquants = [v for v in spec["variables"]
                     if not fusion.get(v, "").strip()]
        if manquants:
            return 422, {"erreur": "variables requises manquantes "
                                   "(refus de trou vide)",
                         "code": "variable_manquante",
                         "manquants": manquants}
        prompt = TROU.sub(lambda m: fusion.get(m.group(1),
                                               m.group(0)),
                          spec["systeme"])
        residus = sorted(set(TROU.findall(prompt)))
        if residus:
            return 422, {"erreur": "placeholders non fournis",
                         "code": "variable_manquante",
                         "manquants": residus}
        return 200, {"usage": usage, **moteur_out,
                     "prompt": prompt,
                     "variables_injectees": sorted(fusion),
                     "placeholders_restants": 0,
                     "interdits": spec["interdits"],
                     "rappel": "sortie = proposition seule "
                               "(validation 1-tap, jamais d'écriture)"}

    # --- POST /resoudre : backend effectif (P7-4, lecture seule) ---
    def resoudre(self, alias="", eu_only=False):
        """Alias effectif : `eu_only` (input_boolean.llm_eu_only box) ->
        override UE ; alias direct si connu (lcd-chat-fast/strong/eu/local,
        custom-N box) ; sinon primaire. Lecture seule, jamais d'écriture,
        jamais de clé exposée (fournisseur/modèle/timeout seuls)."""
        aliases, routing, err, _, _ = self._etat()
        if err:
            return 500, {"erreur": err}
        if eu_only in (True, "true", "1", "oui", "yes"):
            cible = routing.get("eu_only_override") or "lcd-chat-eu"
            via = "eu_only_override"
        else:
            cible = (str(alias or "").strip() or routing.get("primaire"))
            via = ("demande" if str(alias or "").strip() else "primaire")
        if cible not in aliases:
            return 400, {"erreur": f"alias inconnu : {cible}"}
        p = aliases[cible]
        return 200, {"alias_effectif": cible,
                     "fournisseur": p.get("fournisseur", ""),
                     "modele": p.get("modele", ""),
                     "timeout": p.get("timeout"), "via": via}


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
        _ = qs
        eng = self.engine
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/routes":
            code, obj = eng.routes()
            return self._json(code, obj)
        if url.path == "/prompts":
            code, obj = eng.prompts()
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        p, err = self._lire_json()
        if err:
            return self._json(400, {"erreur": err})
        eng = self.engine
        if url.path == "/route":
            if not p.get("qui"):
                return self._json(400, {"erreur": "qui requis"})
            patch = {k: p[k] for k in CLES_ROUTE if k in p}
            if not patch and any(k not in CLES_ROUTE for k in p
                                 if k != "qui"):
                return self._json(400, {"erreur": "clés garde-fou non "
                                                  "éditables",
                                        "code": "cle_inconnue",
                                        "editables": list(CLES_ROUTE)})
            if not patch:
                return self._json(400, {"erreur": "patch vide "
                                                  "(primaire/fallbacks/"
                                                  "retry/cooldown_seconds)"})
            code, obj = eng.changer_route(p["qui"], patch)
            return self._json(code, obj)
        if url.path == "/tester":
            if not (p.get("qui") and p.get("alias")):
                return self._json(400, {"erreur": "qui, alias requis"})
            code, obj = eng.tester(p["qui"], p["alias"])
            return self._json(code, obj)
        if url.path == "/reload":
            code, obj = eng.reload()
            return self._json(code, obj)
        if url.path == "/resoudre":
            code, obj = eng.resoudre(p.get("alias", ""),
                                     p.get("eu_only", False))
            return self._json(code, obj)
        if url.path == "/composer":
            if not p.get("usage"):
                return self._json(400, {"erreur": "usage requis (m1-...)"})
            code, obj = eng.composer(p["usage"], p.get("variables"))
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD UI routage LLM P7-3")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()

    cfg = {}
    try:
        with open(args.config, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne.strip() or ligne[0] in (" ", "\t"):
                    continue
                if ":" in ligne:
                    k, v = ligne.split(":", 1)
                    cfg[k.strip()] = v.strip().strip("\"'")
    except FileNotFoundError:
        pass
    eng = Routeur(cfg)
    Handler.engine = eng
    if not args.serve:
        code, obj = eng.routes()
        print(json.dumps({"http": code,
                          "validation": obj.get("validation")},
                         ensure_ascii=False))
        return 0 if code == 200 else 2
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8050)))
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # LAN seule ; lab : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"llm-router-ui : HTTP 127.0.0.1:{port} (LAN seule, jamais WAN)",
          flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
