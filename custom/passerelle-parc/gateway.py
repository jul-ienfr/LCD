#!/usr/bin/env python3
# custom/passerelle-parc/gateway.py — passerelle parc LECTURE SEULE :8443 (G0/G1).
# Plan « Passerelle Générale Parc » §1 (archi), §3 (registre), §5 (cache/heartbeat),
# §13.3 (chemins runtime). AU-DESSUS du central hôte et des box : la passerelle ne
# détient AUCUNE vérité — elle fan-out en LECTURE sur les moteurs déjà en place
# (pricing 8091, decision 8092, dispatch 8096, router-ui 8050, HA-santé) :
# zéro modif moteur, zéro écriture, zéro secret/clé dans ce dépôt.
#
# Reprend le patron de custom/dashboard-hote/dashboard.py (stdlib seule, HTML sans
# JS, agrégation serveur = pas de CORS) en l'étendant : multi-box (boxes.yaml),
# cache 2 niveaux (mémoire TTL + disque `state/parc/<box_id>.json`, écriture
# atomique `tmp+os.replace`), fan-out parallèle (ThreadPool stdlib), et dégradé
# carte par carte — `stale` > `stale_apres_s` affiche « données du HH:MM, box
# injoignable », jamais page blanche (source de vérité = box, VPS ne fait que
# relayer/cacher/auditer).
#
# Lecture + écritures 1-tap humaines (G2) :
#   - G0/G1 : fan-out LECTURE (`/reco-ota`, `/journal`, `/etat`, `/todos`,
#     `/routes`) + cache 2 niveaux + dégradé stale ;
#   - G2 : `POST /v1/action` = SEULE écriture, allowlist fermée
#     [resa, confirmer, prix, mission], `qui` humain transmis (jamais usurpé),
#     préconditions (copro vérifiée, périmètre, role/sous_role), idempotence par
#     `ref` (24 h), double log (`journal-parc.jsonl` + journal moteur box).
#     La gateway ne décide RIEN : bornes 75/290, motifs, preuves, copro restent
#     l'autorité du moteur — elle relaie et trace.
#   - INTERDIT : serrure/vanne/portail, génération PIN, ouverture auto, écriture
#     OTA auto, débit sans justificatifs, clôture sans preuves, discrimination.
#
# Contrats :
#   GET  /health /ready / /api/apercu /api/apercu-parc /etat-parc /metrics
#   POST /v1/action {box_id, action, logement_id, qui, ref, data{...}, motif?}
#        -> 200 {moteur_code, reponse, idempotent, ...}
#        -> 400 qui interdit/inconnu/ref absent/prix non numérique
#        -> 403 action hors allowlist, hors périmètre, role sans droit, copro KO
#        -> 404 box/logement inconnu
#        -> (le moteur peut répondre 422 hors bornes sans motif, 409 sans preuves
#            — rendus tels quels dans `reponse`, jamais masqués)
# Usage : python3 gateway.py --boxes boxes.yaml --config config.yaml [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND, LCD_STATE_DIR, LCD_QUI.
import argparse
import datetime as dt
import html
import json
import math
import os
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import registre as reg
from registre import ErreurRegistre, RegistreLogements
import annonces as ann
from annonces import ErreurRegistre as ErreurAnnonces
import entites as ent
from registre_liste import ErreurRegistre as ErreurListe
import mandats as mdt
import portail as ptf
import seuils as sxl
import llm as llmm
import i18n as i18n_mod
import crm as crm_mod
import export_compta as exc
import statut_h as sth

QUI_DEFAUT = "passerelle_parc"
FANOUT_MAX_MESURES = 200


# --------------------------------------------------------------------------- #
# Petits utilitaires (patron dashboard-hote, sans dépendance)
# --------------------------------------------------------------------------- #
def utcnow_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def depoluer(v):
    """Valeur scalaire YAML : retire quotes et commentaire de fin."""
    v = str(v).strip()
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        return v[1:-1]
    if " #" in v:
        v = v.split(" #", 1)[0].strip()
    return v


def charger_boxes(path):
    """boxes.yaml — sous-ensemble : `boxes:` liste de mappings, chaque box avec
    `logements:` (liste `{id, nom}`) et `endpoints:` (mapping plat). Stdlib seule
    (même contrainte que `charger_yaml_plat` du dashboard)."""
    boxes, box, sous, log = [], None, None, None
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.read().splitlines()
    except FileNotFoundError:
        return boxes
    for brute in lignes:
        if not brute.strip() or brute.strip().startswith("#"):
            continue
        ind = len(brute) - len(brute.lstrip(" "))
        txt = brute.strip()
        if ind == 0:                      # clé racine : on ne garde que `boxes:`
            box, sous, log = None, None, None
            continue
        if box is None:
            if ind == 2 and txt.startswith("- "):
                box = {"box_id": "", "logements": [], "endpoints": {}}
                boxes.append(box)
                sous, log = None, None
                txt = txt[2:].strip()
                if ":" in txt:
                    k, v = txt.split(":", 1)
                    box[k.strip()] = depoluer(v)
            continue
        if ind == 2 and txt.startswith("- ") and box.get("box_id"):
            # G4-b : commentaire de section (« # --- box NORD --- ») entre deux
            # blocs : le parseur historique croyait la 2e box fausse (ind == 2
            # sans gerer le tiret) et FUSIONNAIT les deux boxes en une — la 1re
            # perdait son id, la 2e ses endpoints. Un `- ` à ind == 2 = box.
            box = {"box_id": "", "logements": [], "endpoints": {}}
            boxes.append(box)
            sous, log = None, None
            txt = txt[2:].strip()
            if ":" in txt:
                k, v = txt.split(":", 1)
                box[k.strip()] = depoluer(v)
            continue
        if ind == 4:
            log = None
            if txt.rstrip().endswith(":"):          # section logements/endpoints
                sous = txt[:-1].strip()
                box[sous] = [] if sous == "logements" else {}
                continue
            sous = None
            if ":" in txt:
                k, v = txt.split(":", 1)
                box[k.strip()] = depoluer(v)
            continue
        if sous == "logements":
            if ind == 6 and txt.startswith("- "):
                log = {}
                box["logements"].append(log)
                txt = txt[2:].strip()
                if ":" in txt:
                    k, v = txt.split(":", 1)
                    log[k.strip()] = depoluer(v)
            elif ind == 8 and log is not None and ":" in txt:
                k, v = txt.split(":", 1)
                log[k.strip()] = depoluer(v)
            continue
        if sous == "endpoints" and ind == 6 and ":" in txt:
            k, v = txt.split(":", 1)
            box["endpoints"][k.strip()] = depoluer(v)
            continue
    return [b for b in boxes if b.get("box_id")]


def charger_cfg(path):
    """config.yaml plat : `cle: valeur` (int si possible)."""
    cfg = {}
    try:
        with open(path, encoding="utf-8") as f:
            for brute in f:
                ligne = brute.strip()
                if not ligne or ligne.startswith("#") or ":" not in ligne:
                    continue
                if brute.startswith((" ", "\t")):
                    continue
                k, v = ligne.split(":", 1)
                v = depoluer(v)
                try:
                    cfg[k.strip()] = int(v)
                except ValueError:
                    cfg[k.strip()] = v
    except FileNotFoundError:
        return {}
    return cfg


def appeler(methode, url, params=None, payload=None, timeout=8, essais=1):
    """Appel JSON sur un moteur — ne lève jamais (erreurs = données).

    GET = `params` en query ; POST/PUT = `payload` en corps.

    `essais` = 1 par défaut. Une 2e tentative sur erreur réseau a été essayée
    puis RETIRÉE (2026-10-09) : sous charge lab, un `dispatch:0` venait d'un
    moteur en cours de démarrage (`docker compose start` rend la main avant
    que le service accepte les connexions) — la reprise arrivait donc trop tôt
    aussi, et elle DOUBLAIT le temps des cas dégradés (un moteur vraiment mort
    passait de 8 s à 10 s, ce qui faisait déborder le timeout des tests du
    calendrier). Le vrai correctif est côté appelant : attendre que le service
    soit sain (`docker inspect` healthcheck) avant de re-tester.

    Aucune reprise pour les POST/PUT dans tous les cas : rejouer une écriture
    pourrait l'exécuter deux fois chez le moteur. L'idempotence (`ref`, 24 h)
    reste le seul filet."""
    if not url:
        return 0, {"erreur": "endpoint absent"}
    if methode != "GET":
        essais = 1
    if params:
        url = url + ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    for tentative in range(max(1, essais)):
        delai = timeout if tentative == 0 else min(2, timeout)
        try:
            req = urllib.request.Request(
                url, data=data, method=methode,
                headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=delai) as r:
                return r.status, json.loads(r.read().decode("utf-8"))
        except Exception as e:
            code = getattr(e, "code", 0) or 0
            try:
                return code, json.loads(e.read().decode("utf-8"))
            except Exception:
                err = {"erreur": str(e)[:120]}
                if code or tentative == max(1, essais) - 1:
                    return code, err
                time.sleep(0.1)          # très court : on veut juste laisser
                # le backlog du moteur se vider avant la 2e tentative


def ha_vivante(url):
    """HA joignable ? 401 = vivante (API protégée, bon signe) ; 0 = injoignable."""
    if not url:
        return False
    try:
        urllib.request.urlopen(url.rstrip("/") + "/api/", timeout=5)
        return True
    except Exception as e:
        return getattr(e, "code", 0) == 401


# --- G2 : allowlist d'écritures 1-tap (humain seul, tracé) ------------------- #
# Plan §6 : la gateway ne décide RIEN — elle relaye après vérification de
# préconditions. Cibles G0-G2 (4 : exploitation) ; cibles G2+ ajoutées
# 2026-10-09 : ménage (clôture avec preuves), compta (validation/payout/clôture)
# et caution (débit, justificatifs obligatoires). Le catalogue restant
# (inventaire/extras/stocks/facturation, CRUD parc) reste hors allowlist.
CIBLES = {
    # --- exploitation courante (opérateur / admin / super_admin) ---
    "resa":            ("booking",  "/resa",            "POST"),
    "confirmer":       ("booking",  "/confirmer",       "POST"),
    "prix":            ("pricing",  "/prix",            "PUT"),
    "mission":         ("dispatch", "/mission",         "POST"),
    "cloture_menage":  ("dispatch", "/cloture",         "POST"),
    # --- compta / finances (comptable aussi) ---
    "facture_valider": ("compta",   "/facture-valider", "POST"),
    "payout":          ("compta",   "/payout",          "POST"),
    "cloture_compta":  ("compta",   "/cloture",         "POST"),
    # --- caution : 1-tap HUMAINE + justificatifs (jamais auto) ---
    "debiter":         ("caution",  "/debiter",         "POST"),
    "restituer_caution": ("caution", "/restituer",      "POST"),
    # --- documents administratifs (facturation :8093) ---
    "doc_facture":     ("facturation", "/facture",      "POST"),
    "doc_valider":     ("facturation", "/valider",      "POST"),
    # --- vente d'extras 1-tap (extras :8098) ---
    "commande_extras": ("extras",   "/commande",        "POST"),
    # --- incident déclaré par un humain (dispatch P8-4) ---
    "sinistre_declarer": ("dispatch", "/sinistre",     "POST"),
}
_HUMAINS = {("super_admin", "super_admin"), ("super_admin", "admin"),
            ("gestionnaire", "operateur")}
_COMPTA = {("super_admin", "super_admin"), ("super_admin", "admin"),
           ("gestionnaire", "comptable")}
# Écriture = gestion humain (P6-20 §1.6). Comptes machine (dashboard_hote,
# passerelle_parc), proprio et prestataires = 403, jamais d'écriture.
DROITS_ACTION = {
    "resa": _HUMAINS, "confirmer": _HUMAINS, "prix": _HUMAINS,
    "mission": _HUMAINS, "cloture_menage": _HUMAINS,
    "facture_valider": _COMPTA, "payout": _COMPTA, "cloture_compta": _COMPTA,
    "debiter": {("super_admin", "super_admin"), ("super_admin", "admin")},
    # restitution = l'autre face du débit : même niveau (argent qui BOUGE),
    # jamais un opérateur seul ni un comptable.
    "restituer_caution": {("super_admin", "super_admin"),
                          ("super_admin", "admin")},
    # documents : produits par la compta, validés par la compta.
    "doc_facture": _COMPTA, "doc_valider": _COMPTA,
    # extras et sinistre : relevant de l'exploitation courante.
    "commande_extras": _HUMAINS, "sinistre_declarer": _HUMAINS,
}
# Préconditions « métier » minimales, vérifiées AVANT relai (le moteur
# revérifie : la gateway ne remplace jamais son contrôle).
CHAMPS_REQUIS = {
    "cloture_menage":  ("dossier",),
    "facture_valider": ("facture_id",),
    "payout":          ("canal", "montant", "date"),
    "cloture_compta":  ("annee", "mois"),
    "debiter":         ("ref_resa", "montant", "justificatifs"),
    "resa":            ("debut", "fin"),
    "mission":         ("presta_id", "motif"),
    # G2+ (suite) : restitution dépôt, documents, extras, sinistre.
    "restituer_caution": ("ref_resa",),
    "doc_facture":     ("ref_resa",),
    "doc_valider":     ("ref_resa", "type_doc"),
    "commande_extras": ("ref_resa", "extras"),
    "sinistre_declarer": ("motif", "description"),
}
# --- champs normalisés AVANT relai : un formulaire HTML sans JS ne produit
# que des chaînes. La gateway ne fait AUCUNE règle métier ici : elle traduit
# la saisie en type attendu par le moteur (qui, lui, revérifie tout).
# `bool`  : "oui"/"on"/"1"/"true" -> True (sinon False)
# `liste` : "id:qte,id:qte" -> [{"id": ..., "qte": ...}] (erreur 400 si faux)
# `enum`  : valeur imposée parmi une liste (le moteur a la sienne, on double)
CHAMPS_NORMALISER = {
    "doc_facture": {"b2b": ("bool", None)},
    "commande_extras": {"extras": ("liste", ["id", "qte"])},
    "doc_valider": {"type_doc": ("enum", ["contrat", "facture_b2b",
                                          "facture_b2c"])},
}
# `qui` interdits sur écriture (plan §4 : jamais auto/llm/jev/moteur-*/vide).
QUI_INTERDITS = {"", "vide", "auto", "llm", "jev", "systeme", "inconnu"}
IDEMPOTENCE_FENETRE_S = 24 * 3600
RBAC_CACHE_S = 10

# --- Page de pilotage : formulaires sans JS (comme :8060) -------------------- #
# Chaque action = 1 formulaire POST /v1/action. Le `ref` est généré AU RENDU :
# un double-clic soumet la même valeur => rejeu idempotent, pas de doublon
# (revenir sur la page régénère un `ref` neuf). Aucun champ moteur caché :
# tout ce qui est dans le formulaire est affiché à l'utilisateur.
# `qui` est un choix explicite parmi les comptes HUMAINS de acces.yaml :
# jamais de compte machine (passerelle_parc, dashboard_hote) — la gateway
# refuserait 403 de toute façon, on ne l'affiche donc pas.
FORMULAIRES = {
    "resa": [("debut", "Début (AAAA-MM-JJ)", "2027-11-10"),
             ("fin", "Fin (AAAA-MM-JJ)", "2027-11-12"),
             ("voyageurs", "Voyageurs", "2")],
    "confirmer": [],
    "prix": [("date", "Date (AAAA-MM-JJ)", "2027-12-01"),
             ("prix", "Prix direct (€)", "150")],
    "mission": [("presta_id", "Prestataire", "lab_menage_01"),
                ("motif", "Motif", "Ménage J+1")],
    "cloture_menage": [("dossier", "Dossier", "menage/log1/M-001")],
    "facture_valider": [("facture_id", "Facture", "F-2027-001"),
                        ("rubrique", "Rubrique (option)", "menage")],
    "payout": [("canal", "Canal", "virement"),
               ("montant", "Montant (€)", "450"),
               ("date", "Date (AAAA-MM-JJ)", "2027-12-05"),
               ("ref_resa", "Réf. résa (option)", "")],
    "cloture_compta": [("annee", "Année", "2027"), ("mois", "Mois", "11")],
    "debiter": [("ref_resa", "Réf. résa", ""),
                ("montant", "Montant (€)", "150"),
                ("justificatifs", "Justificatifs (séparés par ,)",
                 "photo-canape.jpg,facture.pdf")],
    "restituer_caution": [("ref_resa", "Réf. résa", "")],
    "doc_facture": [("ref_resa", "Réf. résa", ""),
                    ("b2b", "Facture B2B ? (oui/non)", "non")],
    "doc_valider": [("ref_resa", "Réf. résa", ""),
                    ("type_doc", "Type de document",
                     "facture_b2c")],
    "commande_extras": [("ref_resa", "Réf. résa", ""),
                        ("extras", "Extras (id:qte,id:qte)",
                         "linge-lit:1,parking:1"),
                        ("arrivee", "Arrivée (AAAA-MM-JJ)", "2027-11-10")],
    "sinistre_declarer": [("motif", "Motif", "dégât des eaux"),
                          ("description", "Description",
                           "Fuite sous l'évier de la cuisine")],
}
LIBELLES = {
    "resa": "Réserver", "confirmer": "Confirmer", "prix": "Fixer le prix",
    "mission": "Créer mission ménage", "cloture_menage": "Clôturer ménage",
    "facture_valider": "Valider facture", "payout": "Verser (payout)",
    "cloture_compta": "Clôture compta", "debiter": "Débiter caution",
    "restituer_caution": "Restituer caution",
    "doc_facture": "Générer facture", "doc_valider": "Valider document",
    "commande_extras": "Commander extras",
    "sinistre_declarer": "Déclarer sinistre",
}


def charger_acces(path):
    """custom/acces.yaml — sous-ensemble `personnes:` (id, role, sous_role,
    logements[]). Sert le pré-filtre RBAC côté gateway (les moteurs
    revérifient de leur côté : on ne remplace jamais leur contrôle).

    `clients_ref[]` (§3bis, G2bis-b) : les clients pour lesquels un compte
    propriétaire parle. Lu comme `logements[]` (liste entre crochets),
    ABSENT de tous les autres comptes. Un compte sans `clients_ref` n'est
    rattaché à aucun client — c'est `portail.lien()` qui refuse, pas ici :
    on ne devine jamais un droit."""
    gens, personne, cle = [], None, ""
    try:
        with open(path, encoding="utf-8") as f:
            for brute in f:
                if not brute.strip() or brute.strip().startswith("#"):
                    continue
                ind = len(brute) - len(brute.lstrip(" "))
                txt = brute.strip()
                if ind == 0:
                    personne = None
                    continue
                if ind == 2 and txt.startswith("- "):
                    personne = {"logements": []}
                    gens.append(personne)
                    txt = txt[2:].strip()
                if personne is None:
                    continue
                if ":" not in txt:
                    continue
                k, v = txt.split(":", 1)
                k, v = k.strip(), depoluer(v)
                if k == "logements":
                    personne["logements"] = [x.strip().strip("\"'") for x in
                                             v.strip("[]").split(",") if x.strip()]
                elif k == "clients_ref":
                    personne["clients_ref"] = [x.strip().strip("\"'") for x
                                               in v.strip("[]").split(",")
                                               if x.strip()]
                elif k == "expire_le":
                    personne["expire_le"] = (None if v in ("null", "~", "")
                                             else v)
                elif k in ("id", "role", "sous_role"):
                    personne[k] = v
    except FileNotFoundError:
        return {}
    return {p["id"]: p for p in gens if p.get("id")}


# --------------------------------------------------------------------------- #
# Moteur passerelle
# --------------------------------------------------------------------------- #
class Passerelle:
    def __init__(self, cfg, boxes, qui=None, state_dir=None, acces_path=None,
                 base=None):
        self.cfg = cfg or {}
        self.boxes = boxes or []
        self.qui = qui or QUI_DEFAUT
        # Base = dossier du fichier de config : les chemins relatifs du yaml se
        # résolvent par rapport à LUI (et pas au répertoire courant). Défaut :
        # à côté de gateway.py, ce qui tombe dans `custom/*/state/` (gitignoré).
        self.base = base or os.path.dirname(os.path.abspath(__file__))
        # En lab, LCD_STATE_DIR écrase tout (volume dédié /opt/lcd/state).
        self.state_dir = self._resoudre(state_dir or os.environ.get(
            "LCD_STATE_DIR", self.cfg.get("state_dir", "./state")))
        self.ttl = float(self.cfg.get("cache_ttl_s", 90))
        self.stale_apres = float(self.cfg.get("stale_apres_s", 180))
        self.workers = max(1, int(self.cfg.get("fanout_workers", 4)))
        # G4-a : budget fan-out (SLO) et seuils d'alerte, lisibles dans la
        # config. Un budget en dur dans le code serait un SLA qu'on ne peut pas
        # discuter sans redéployer — et un SLO qu'on ne confronte à rien ne
        # sert à rien (d'où `fanout_slo()`).
        self.fanout_budget_ms = float(self.cfg.get("fanout_budget_ms", 2000))
        self.seuils_parc = dict(self.cfg.get("seuils") or {})
        # G2 : RBAC statique (acces.yaml) + révocations runtime + idempotence.
        self.acces_path = self._resoudre(
            acces_path or self.cfg.get("acces", "acces.yaml"))
        self.acces = charger_acces(self.acces_path)
        self.revocations_path = self._resoudre(self.cfg.get("revocations", ""))
        self.f_idem = os.path.join(self.state_dir, "parc", "idempotence.json")
        self.f_journal = os.path.join(self.state_dir, "parc",
                                      "journal-parc.jsonl")
        self.memoire = {}                # (box_id, log_id) -> apercu
        self.disque = {}                # box_id -> {log_id: apercu}
        # Cache calendrier (mémoire seule, TTL commun) : dérivé d'ics-sync,
        # court, pas besoin de disque (recalculable en N appels bornés).
        self.cal_cache = {}             # (box_id, logement_id, jour) -> rep
        # G4-a : file d'attente hors-ligne par box (§16.2). Remplie par l'agent
        # box (`agent_box.py`) quand la passerelle est injoignable ; ici on se
        # contente de COMPTER — rejouer la file reste un geste de l'agent.
        self.dir_outbox = os.path.join(self.state_dir, "parc", "outbox")
        # §17/G2bis-b : racine des documents de mandat, LECTURE SEULE.
        # Le portail sert, il ne dépose jamais : un versement reste un geste
        # humain (vault / archive chiffrée), hors périmètre passerelle.
        # Vide = aucun service documentaire, et un 404 le DIT.
        self.docs_dir = str(self.cfg.get("docs_dir", "") or "").strip()
        self._m = {"fanout_ms": [], "cache_hits": 0, "fanout_total": 0,
                   "ecritures": 0, "ecritures_refusees": 0}
        self._t0 = time.time()  # uptime pour /v1/statut (bascule P1/P2/P3)
        self._charger_disque()

    def _resoudre(self, chemin):
        """Chemin relatif -> relatif au dossier de config ; absolu -> inchangé.
        Toujours normalisé (séparateurs canoniques) pour être comparable."""
        if not chemin:
            return ""
        if os.path.isabs(chemin):
            return os.path.normpath(chemin)
        return os.path.normpath(os.path.join(self.base, chemin))

    # -- persistance cache (atomique, gitignoré) ---------------------------- #
    def _dir_parc(self):
        d = os.path.join(self.state_dir, "parc")
        try:
            os.makedirs(d, exist_ok=True)
        except OSError:
            return None
        return d

    def _charger_disque(self):
        d = self._dir_parc()
        if not d:
            return
        for nom in os.listdir(d):
            if not nom.endswith(".json"):
                continue
            try:
                with open(os.path.join(d, nom), encoding="utf-8") as f:
                    data = json.load(f)
            except (FileNotFoundError, ValueError, OSError):
                continue
            bid = data.get("box_id")
            if not bid:
                continue
            self.disque[bid] = data.get("logements", {})

    def _ecrire_disque(self, box_id, logement_id, ap):
        d = self._dir_parc()
        if not d:
            return
        for cache in (self.memoire, self.disque):
            cle = (box_id, logement_id) if cache is self.memoire else box_id
            val = dict(ap)
            val["box_id"] = box_id
            if cache is self.memoire:
                cache[cle] = val
            else:
                cache.setdefault(box_id, {})[logement_id] = val
        chemin = os.path.join(d, f"{box_id}.json")
        tmp = chemin + ".tmp"
        try:
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump({"box_id": box_id, "ecrit_le": utcnow_iso(),
                           "logements": self.disque.get(box_id, {})},
                          f, ensure_ascii=False)
            os.replace(tmp, chemin)          # atomique (pas de JSON tronqué)
        except OSError:
            pass

    def last_seen(self, box_id):
        logs = self.disque.get(box_id, {})
        ts = [l.get("fetched_at") for l in logs.values()
              if l.get("fetched_at")]
        # G4-b : le heartbeat avance last_seen SANS toucher aux aperçus.
        # On relit le disque (l ingest écrit, le heartbeat aussi) : la
        # mémoire seule oublierait un battement après redémarrage.
        try:
            with open(os.path.join(self._dir_parc() or "",
                                   f"{box_id}.json"),
                      encoding="utf-8") as f:
                data = json.load(f)
            if data.get("heartbeat_at"):
                ts.append(data["heartbeat_at"])
        except (FileNotFoundError, ValueError, OSError, TypeError):
            pass
        return max(ts) if ts else None
        ts = [l.get("fetched_at") for l in logs.values() if l.get("fetched_at")]
        return max(ts) if ts else None

    # -- lecture d'un logement ---------------------------------------------- #
    @staticmethod
    def _depuis_valide(depuis):
        """depuis (grille decalee) : ISO, |ecart|<=90 j, sinon None."""
        if not isinstance(depuis, str) or not re.fullmatch(
                r"\d{4}-\d{2}-\d{2}", depuis.strip() or ""):
            return None
        try:
            d = dt.date.fromisoformat(depuis.strip())
        except (TypeError, ValueError):
            return None
        if abs((d - dt.date.today()).days) > 90 or depuis == \
                dt.date.today().isoformat():
            return None
        return depuis

    def apercu_logement(self, box, logement_id, force=False, qui=None,
                        depuis=None):
        box_id = box.get("box_id")
        qui = qui or box.get("qui_relay") or self.qui
        cle = (box_id, logement_id)
        depuis = self._depuis_valide(depuis)
        cache = self.memoire.get(cle) if not depuis else None
        if cache is None and not depuis:
            cache = self.disque.get(box_id, {}).get(logement_id)
        if cache and not force and not depuis and \
                (time.time() - cache.get("fetched_ts", 0)) < self.ttl:
            out = dict(cache)
            out["cache_hit"] = True
            # stale = (fan-out incomplet à la récup) OU (données trop vieilles).
            # On NE RECALCULE PAS : sans ça, un cache hit « oublierait » qu'un
            # moteur était injoignable, et la page reproposerait des écritures
            # vers une box muette (le 2e rendu déverrouillait ce que le 1er
            # avait verrouillé).
            out["stale"] = bool(cache.get("stale")) or \
                (time.time() - cache.get("fetched_ts", 0)) > self.stale_apres
            out["age_s"] = round(time.time() - cache.get("fetched_ts", 0), 1)
            self._m["cache_hits"] += 1
            return out

        u = box.get("endpoints", {}) or {}
        erreurs = []
        nom = next((l.get("nom") for l in box.get("logements", [])
                    if l.get("id") == logement_id), logement_id)

        code, reco = appeler(
            "GET", u.get("pricing", "") + "/reco-ota",
            {"logement_id": logement_id,
             **({"depuis": depuis} if depuis else {})})
        grille = reco.get("grille_7j", []) if isinstance(reco, dict) else []
        if code != 200:
            erreurs.append(f"pricing:{code}")
        prix_7j = [[j[0], j[1]] for j in grille[:7] if isinstance(j, (list, tuple))]

        code, jl = appeler("GET", u.get("decision", "") + "/journal",
                           {"logement_id": logement_id, "qui": qui})
        entrees = jl.get("entrees", []) if isinstance(jl, dict) else []
        if code == 403:
            erreurs.append(f"decision:403 qui={qui} hors perimetre")  # RBAC moteur
        elif code != 200:
            erreurs.append(f"journal:{code}")

        code, etat = appeler("GET", u.get("decision", "") + "/etat",
                             {"logement_id": logement_id})
        etat = etat if isinstance(etat, dict) else {}
        if code != 200:
            erreurs.append(f"etat:{code}")

        code, td = appeler("GET", u.get("dispatch", "") + "/todos",
                           {"logement_id": logement_id})
        dossiers = td.get("dossiers", []) if isinstance(td, dict) else []
        if code != 200:
            erreurs.append(f"dispatch:{code}")

        code, routes = appeler("GET", u.get("router", "") + "/routes")
        primaire = routes.get("primaire", "") if isinstance(routes, dict) else ""
        if code != 200:
            erreurs.append(f"router:{code}")

        haok = ha_vivante(u.get("homeassistant"))

        ap = {
            "box_id": box_id, "logement_id": logement_id, "nom": nom,
            "fetched_at": utcnow_iso(), "fetched_ts": time.time(),
            "age_s": 0, "cache_hit": False,
            # stale = fan-out incomplet (moteur injoignable/403) : la carte est
            # affichée quand même, liste d'erreurs en clair (jamais page blanche).
            "stale": bool(erreurs),
            "prix_7j": prix_7j,
            "journal_total": (jl.get("total", 0) if isinstance(jl, dict) else 0),
            "dernieres": [
                {"ts": e.get("ts"), "ref": e.get("ref"),
                 "qui": e.get("qui"), "quoi": e.get("quoi")}
                for e in entrees[:5] if isinstance(e, dict)],
            "todos": [
                {"dossier": d.get("dossier"), "statut": d.get("statut"),
                 "deadline": d.get("deadline")}
                for d in dossiers if isinstance(d, dict)],
            "config_ok": etat.get("config_ok"),
            "copro_verifiee": etat.get("copro_verifiee"),
            "alertes": etat.get("alertes", []) if isinstance(etat.get("alertes"),
                                                             list) else [],
            "bornes_prix": etat.get("bornes_prix"),
            "occupation": etat.get("occupation"),
            "routage_primaire": primaire,
            "ha_vivante": haok,
            "erreurs": erreurs,
        }
        if depuis:
            ap["depuis"] = depuis
            return ap          # grille decallee : JAMAIS ecrite au cache
        self._ecrire_disque(box_id, logement_id, ap)
        return ap

    # -- fan-out parc -------------------------------------------------------- #
    def apercu_parc(self, force=False, qui=None, entite=None, mode=None,
                    depuis=None):
        t0 = time.time()
        cibles = [(b, l.get("id")) for b in self.boxes
                  for l in b.get("logements", []) if l.get("id")]
        res = []
        if cibles:
            with ThreadPoolExecutor(max_workers=self.workers) as ex:
                futs = [ex.submit(self.apercu_logement, b, lid, force, qui,
                                  depuis) for b, lid in cibles]
                for fut in as_completed(futs):
                    try:
                        res.append(fut.result())
                    except Exception as e:              # jamais de carte perdue
                        res.append({"erreurs": [f"exception:{e}"[:120]],
                                    "stale": True, "logement_id": "?"})
        duree_ms = int((time.time() - t0) * 1000)
        self._m["fanout_ms"].append(duree_ms)
        if len(self._m["fanout_ms"]) > FANOUT_MAX_MESURES:
            self._m["fanout_ms"] = self._m["fanout_ms"][-FANOUT_MAX_MESURES:]
        self._m["fanout_total"] += 1
        # §3bis : filtre entité/mode, avec comptage des écartés (une liste vide
        # ne doit jamais ressembler à « aucun logement dans le parc »).
        if entite or mode:
            try:
                res, filtre = self.filtrer_logements(res, entite, mode)
            except (ErreurListe, ErreurRegistre):
                filtre = {"entite_id": entite, "mode": mode,
                          "erreur": "registre mandats indisponible"}
        else:
            filtre = None
        out = {"qui": qui or self.qui, "generated_at": utcnow_iso(),
               "boxes": self.resume_boxes(), "logements": res,
               "fanout_ms": duree_ms,
               "lecture_seule": True,
               "note": "0 ecriture : jamais de PIN/secret/action (MVP G0/G1)"}
        if filtre:
            out["filtres"] = filtre
        return out

    def resume_boxes(self):
        return [{"box_id": b.get("box_id"), "site": b.get("site", ""),
                 "logements": [l.get("id") for l in b.get("logements", [])],
                 "last_seen": self.last_seen(b.get("box_id"))} for b in self.boxes]

    def etat_parc(self, force=False, qui=None):
        """Alertes consolidées (decision `/etat`) + fraîcheur par box."""
        cibles = [(b, l.get("id")) for b in self.boxes
                  for l in b.get("logements", []) if l.get("id")]

        def un(b, lid):
            box_id = b.get("box_id")
            q = qui or b.get("qui_relay") or self.qui
            cache = self.memoire.get((box_id, lid)) or self.disque.get(
                box_id, {}).get(lid)
            if cache and not force and (time.time() - cache.get("fetched_ts", 0)) < self.ttl:
                age = time.time() - cache.get("fetched_ts", 0)
                return {"box_id": box_id, "logement_id": lid,
                        "fetched_at": cache.get("fetched_at"),
                        "age_s": round(age, 1),
                        # même règle que `apercu_logement` : un fan-out
                        # incomplet reste marqué tant qu'il n'est pas refait.
                        "stale": bool(cache.get("stale")) or age > self.stale_apres,
                        "copro_verifiee": cache.get("copro_verifiee"),
                        "alertes": cache.get("alertes", []),
                        "bornes_prix": cache.get("bornes_prix")}
            u = b.get("endpoints", {}) or {}
            code, etat = appeler("GET", u.get("decision", "") + "/etat",
                                 {"logement_id": lid, "qui": q})
            if code != 200:
                return {"box_id": box_id, "logement_id": lid, "stale": True,
                        "erreurs": [f"etat:{code}"],
                        "fetched_at": cache.get("fetched_at") if cache else None}
            return {"box_id": box_id, "logement_id": lid,
                    "fetched_at": etat.get("fetched_at") or utcnow_iso(),
                    "fetched_ts": time.time(), "age_s": 0, "stale": False,
                    "copro_verifiee": etat.get("copro_verifiee"),
                    "alertes": etat.get("alertes", []),
                    "bornes_prix": etat.get("bornes_prix"),
                    "occupation": etat.get("occupation")}

        res = []
        if cibles:
            with ThreadPoolExecutor(max_workers=self.workers) as ex:
                futs = [ex.submit(un, b, lid) for b, lid in cibles]
                for fut in as_completed(futs):
                    try:
                        r = fut.result()
                        if r.get("fetched_ts") and not r.get("stale"):
                            cache = dict(r)
                            cache.pop("erreurs", None)
                            cache["nom"] = r.get("logement_id")
                            self.disque.setdefault(r["box_id"], {})[
                                r["logement_id"]] = cache
                        res.append(r)
                    except Exception as e:
                        res.append({"erreurs": [str(e)[:120]], "stale": True})
        alertes = [{"box_id": r.get("box_id"), "logement_id": r.get("logement_id"),
                    "alertes": r.get("alertes", [])}
                   for r in res if r.get("alertes")]
        # §3bis : un logement SANS mandat (donc sans entité) est une fiche
        # incomplète. On le signale ici, on NE bloque jamais le planning.
        rattachements = self.rattachements()
        sans_entite = sorted(
            str(r.get("logement_id")) for r in res
            if r.get("logement_id") and r.get("logement_id")
            not in rattachements)
        out = {"generated_at": utcnow_iso(), "boxes": self.resume_boxes(),
               "logements": res, "alertes": alertes,
               "nb_logements_alertes": len(alertes),
               # G4-a : les alertes de SEUILS (joignabilite box, outbox,
               # SLO fan-out, echeance mandat) vivent a cote, jamais DANS
               # `alertes` : deux provenances distinctes, sinon on ne
               # saurait plus qui a dit quoi. Canal separe = auditable, et
               # aucun blocage — une box muette n empeche pas de lire les
               # autres (le parc reste lisible pendant qu on alerte).
               "alertes_parc": self.alertes_parc(),
               "lecture_seule": True}
        if sans_entite:
            out["sans_entite"] = sans_entite
            out["note_entite"] = ("logements sans rattachement mandats.yaml : "
                                  "fiche incomplète à compléter "
                                  "(POST /parc/mandats), jamais bloquant")
        return out

    # -- G4-b : ingest + heartbeat (l'agent box pousse, jamais l'inverse) - #
    # L'agent tourne SUR la box et pousse vers la centrale. La passerelle ne va
    # JAMAIS le chercher : si elle le pouvait, elle le ferait aussi quand il
    # est mort, et « box muette » deviendrait « box absente ». Le heartbeat est
    # donc la SEULE preuve de vie, et la file outbox la seule preuve d'absence.
    def ingest(self, p):
        """`POST /ingest` — réception d'une boucle d'agent box (G4-b, §16.2).

        Accepte (`accepte: True`) = la boucle est entrée au cache disque et
        `last_seen` avance. Le contenu est celui des moteurs locaux de la box
        (prix + état), jamais une décision : la passerelle stocke, elle ne
        tranche pas. Un conflit de prix (la box dit X pendant que la centrale
        dit Y) se prouve AILLEURS (`/parc/conflits`), pas ici — `ingest`
        enregistre les deux versions, il n'en écrase aucune.

        Retourne (code, rep)."""
        if not isinstance(p, dict):
            return 400, {"erreur": "JSON objet attendu", "accepte": False}
        box_id = str(p.get("box_id", "") or "").strip()
        boucle = p.get("boucle")
        if not box_id or not isinstance(boucle, dict):
            return 400, {"erreur": "box_id + boucle requis", "accepte": False}
        if not any(b.get("box_id") == box_id for b in self.boxes):
            return 404, {"erreur": "box inconnue : " + box_id,
                         "accepte": False}
        recus = 0
        for lid, lot in (boucle.get("logements") or {}).items():
            if not isinstance(lot, dict):
                continue
            ap = {"box_id": box_id, "logement_id": str(lid),
                  "nom": str(lid),
                  "fetched_at": utcnow_iso(), "fetched_ts": time.time(),
                  "age_s": 0, "cache_hit": False,
                  "stale": False, "via_ingest": True,
                  "prix_7j": (lot.get("prix") or {}).get("grille_7j", []),
                  # G4-b : les prix APPLIQUES remontés (entité du conflit
                  # split-brain). Sans eux, `conflits()` ne verrait que la
                  # centrale — un conflit à une seule version n'en est pas un.
                  "appliques": (lot.get("prix") or {}).get("appliques", []),
                  "copro_verifiee": (lot.get("etat") or {}
                                      ).get("copro_verifiee"),
                  "alertes": (lot.get("etat") or {}).get("alertes", []),
                  "bornes_prix": (lot.get("etat") or {}).get("bornes_prix"),
                  "erreurs": [str((lot.get("prix") or {}).get("erreur") or ""),
                               str((lot.get("etat") or {}).get("erreur") or "")]
                  }
            ap["erreurs"] = [e for e in ap["erreurs"] if e]
            ap["stale"] = bool(ap["erreurs"])
            self._ecrire_disque(box_id, str(lid), ap)
            recus += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "ingest",
                            "box_id": box_id, "logements_recus": recus,
                            "qui": "agent-" + box_id})
        return 200, {"accepte": True, "box_id": box_id,
                     "logements_recus": recus}

    def heartbeat(self, p):
        """`POST /heartbeat` — preuve de vie d'une box (G4-b, §16.2).

        Un heartbeat ne transporte AUCUNE donnée : il dit « je vis », pas
        « voilà mon état ». Confondre les deux ferait qu'une box qui bat mais
        dont les moteurs sont morts passerait pour saine. Il avance `last_seen`
        via un cache disque minimal, SANS toucher aux aperçus (sinon un simple
        battement effacerait un `stale` que le fan-out a posé)."""
        if not isinstance(p, dict):
            return 400, {"erreur": "JSON objet attendu"}
        box_id = str(p.get("box_id", "") or "").strip()
        if not box_id:
            return 400, {"erreur": "box_id requis"}
        if not any(b.get("box_id") == box_id for b in self.boxes):
            return 404, {"erreur": "box inconnue : " + box_id}
        d = self._dir_parc()
        if d:
            chemin = os.path.join(d, f"{box_id}.json")
            try:
                with open(chemin, encoding="utf-8") as f:
                    data = json.load(f)
            except (FileNotFoundError, ValueError, OSError):
                data = {"box_id": box_id, "logements": {}}
            data["heartbeat_ts"] = time.time()
            data["heartbeat_at"] = utcnow_iso()
            tmp = chemin + ".tmp"
            try:
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False)
                os.replace(tmp, chemin)
            except OSError:
                pass
            self.disque.setdefault(box_id, {})
        return 200, {"box_id": box_id, "vu": True}

    def outbox_len(self, box_id):
        """Longueur de la file d'attente hors-ligne d'une box (§16.2).

        On compte les fichiers `*.json` — rien de plus. Un dossier absent ou
        illisible rend `None` (file inconnue), JAMAIS 0 : la différence entre
        « la file est vide » et « on ne peut pas la lire » est exactement la
        différence entre un parc sain et un parc aveugle."""
        d = os.path.join(self.dir_outbox, str(box_id or ""))
        try:
            return len([n for n in os.listdir(d)
                        if n.endswith(".json")])
        except OSError:
            return None

    def alertes_parc(self, maintenant_ts=None):
        """G4-a : les alertes de SEUILS du parc, évaluées par `seuils.py`.

        Volontairement SÉPARÉ des `alertes` des moteurs (remontées par
        decision) : deux canaux, deux natures. Mélanger les deux ferait qu'une
        alerte de seuil G4 se ferait passer pour un état moteur, et
        réciproquement. `maintenant_ts=None` = l'heure réelle (prod) ; le lab
        l'injecte pour ne pas attendre 10 minutes qu'une box tombe.

        N'appelle AUCUN moteur : les états viennent du cache disque déjà peuplé
        par `/etat-parc`. Sans ça, un simple `GET /metrics` déclencherait N
        appels, et « mesurer le parc » finirait par le charger."""
        maintenant = float(maintenant_ts if maintenant_ts is not None
                           else time.time())
        boxes = [{"box_id": b.get("box_id"),
                  "last_seen_ts": self.last_seen(b.get("box_id")),
                  "outbox_len": self.outbox_len(b.get("box_id"))}
                 for b in self.boxes]
        lus = {}
        for box_id, logs in self.disque.items():
            for lid, c in logs.items():
                lus[lid] = c
        # Seules les mesures que le gateway a VRAIMENT. Les autres (confiance,
        # rapprochement, RC) restent chez leur moteur : `evaluer` les compte
        # dans `mesures_absentes` au lieu d'alerter à tort.
        logements = [{"logement_id": lid,
                      "copro_verifiee": c.get("copro_verifiee")}
                     for lid, c in sorted(lus.items())]
        # p95 recalculé ici (pas `self.metriques()` : ce dernier publie les
        # alertes, il y aurait une boucle infinie). Même formule, même résultat.
        durees = sorted(self._m["fanout_ms"])
        idx = (min(len(durees) - 1,
                   max(0, math.ceil(0.95 * len(durees)) - 1))
               if durees else 0)
        pseudo_metrics = {
            "fanout_p95_ms": (durees[idx] if durees else None),
            "fanout_budget_ms": self.fanout_budget_ms,
        }
        return sxl.evaluer(boxes, logements, pseudo_metrics, maintenant,
                           seuils=self.seuils_parc)

    # -- G4-b : conflits split-brain + revue humaine + digest (§16.2) ---- #
    # Un conflit naît quand la box et la centrale ont CHACUNE écrit un prix
    # pendant une coupure : à la reconnexion, `/ingest` rapporte les prix
    # appliqués de la box, et la centrale connaît déjà SES écritures (son
    # propre journal `portail_doc`... non : son journal `journal-parc.jsonl`,
    # via la table d'idempotence). On compare les DEUX, on affiche les deux,
    # et un HUMAIN tranche. Jamais d'écrasement silencieux.
    #
    # Règle de présentation : `last-writer-wins` est une PROPOSITION (le plus
    # récent en premier), pas une décision. La décision = le geste `trancher`,
    # tracé avec son `qui`. Sans geste, les deux versions restent affichées.
    def conflits(self):
        """Conflits split-brain non tranchés, par (box, logement, date).

        Source box = prix `appliques` remontés par `/ingest` (moteur local de
        la box, lu par l'agent). Source centrale = actions `prix` relayées par
        `/v1/action` (table d'idempotence 24 h). Deux prix différents pour la
        même (box, logement, date) = conflit. Même prix = pas de conflit
        (les deux côtés ont convergé, tant mieux)."""
        try:
            with open(self.f_idem, encoding="utf-8") as f:
                table = json.load(f)
        except (FileNotFoundError, ValueError, OSError):
            table = {}
        # centrale : (logement, date) -> {prix, ts, qui, ref}
        central = {}
        for cle, v in (table or {}).items():
            env = (v or {}).get("enveloppe") or {}
            if env.get("action") != "prix":
                continue
            rep = env.get("reponse") or {}
            lid = str(env.get("logement_id") or "")
            date = str((env.get("data") or {}).get("date")
                       or rep.get("date") or "")
            prix = rep.get("prix", (env.get("data") or {}).get("prix"))
            try:
                prix = int(prix)
            except (TypeError, ValueError):
                continue
            if lid and date:
                central[(lid, date)] = {"prix": prix,
                                        "ts": str(env.get("ts") or ""),
                                        "qui": str(env.get("qui") or ""),
                                        "ref": str(env.get("ref") or "")}
        # box : prix appliqués remontés par ingest (cache disque, clé
        # `appliques` posée par `ingest()` — voir ci-dessus).
        conflits = []
        for box_id, logs in (self.disque or {}).items():
            for lid, c in (logs or {}).items():
                if not isinstance(c, dict):
                    continue
                appliques = c.get("appliques") or []
                for ligne in appliques:
                    if not isinstance(ligne, dict):
                        continue
                    date = str(ligne.get("date") or "")
                    try:
                        pb = int(ligne.get("prix"))
                    except (TypeError, ValueError):
                        continue
                    cle = (str(lid), date)
                    ctr = central.get(cle)
                    if ctr and ctr["prix"] != pb:
                        # proposition last-writer-wins : le plus récent gagne
                        # PAR DÉFAUT, mais rien n'est appliqué sans geste.
                        gagnant = ("box" if str(ligne.get("ts") or "")
                                   >= str(ctr["ts"]) else "centrale")
                        conflits.append(
                            {"box_id": box_id, "logement_id": str(lid),
                             "date": date,
                             "prix_box": pb, "box_ts": str(ligne.get("ts")),
                             "box_qui": str(ligne.get("qui") or ""),
                             "prix_centrale": ctr["prix"],
                             "centrale_ts": ctr["ts"],
                             "centrale_qui": ctr["qui"],
                             "centrale_ref": ctr["ref"],
                             "proposition": "last-writer-wins:" + gagnant,
                             "tranche": None})
        return {"conflits": sorted(conflits,
                                   key=lambda x: (x["box_id"],
                                                  x["logement_id"],
                                                  x["date"])),
                "nb_conflits": len(conflits),
                "lecture_seule": True,
                "note": "deux versions affichées, humain tranche "
                        "(`POST /parc/conflits/trancher`) — jamais "
                        "d'écrasement silencieux"}

    def trancher(self, p):
        """Revue humaine d'un conflit split-brain (§16.2).

        Le geste dit QUELLE version devient la vérité (box ou centrale), par
        QUI, avec un MOTIF. Il est tracé au journal comme une écriture (c'en
        est une : il ordonne un prix). Sans geste, RIEN ne bouge : la
        proposition `last-writer-wins` reste une proposition."""
        if not isinstance(p, dict):
            return 400, {"erreur": "JSON objet attendu"}
        qui = str(p.get("qui", "") or "").strip()
        box_id = str(p.get("box_id", "") or "").strip()
        lid = str(p.get("logement_id", "") or "").strip()
        date = str(p.get("date", "") or "").strip()
        choix = str(p.get("choix", "") or "").strip()
        motif = str(p.get("motif", "") or "").strip()
        if choix not in ("box", "centrale"):
            return 400, {"erreur": "choix : box ou centrale (la version qui "
                                   "devient la vérité)"}
        if not motif:
            return 400, {"erreur": "motif obligatoire (un humain tranche, il "
                                   "dit pourquoi)"}
        code, err = self._verifier_qui(qui, lid, "prix")
        if code:
            return code, err
        actuels = [c for c in self.conflits().get("conflits", [])
                   if c["box_id"] == box_id and c["logement_id"] == lid
                   and c["date"] == date]
        if not actuels:
            return 404, {"erreur": "aucun conflit pour "
                                   f"{box_id}/{lid}/{date} (déjà tranché ou "
                                   "jamais divergé)", "qui": qui}
        c = actuels[0]
        gagnant = c["prix_box"] if choix == "box" else c["prix_centrale"]
        # Trancher, c'est ORDONNER, pas appliquer en silence : la decision est
        # tracee (qui + motif + ref TRANCHE-*) et rendue ; l'application suit
        # le circuit normal (`/v1/action` prix sur la box concernee, geste
        # humain explicite). Sans ce 2e geste, les deux versions restent
        # affichees — §16.2 « jamais d'ecrasement silencieux ».
        self._journal_parc({"ts": utcnow_iso(), "quoi": "conflit_tranche",
                            "qui": qui, "box_id": box_id,
                            "logement_id": lid, "date": date,
                            "choix": choix, "prix_retenu": gagnant,
                            "motif": motif,
                            "ref": "TRANCHE-%s-%s-%s" % (lid, date,
                                                          int(time.time()))})
        return 200, {"tranche": True, "box_id": box_id, "logement_id": lid,
                     "date": date, "choix": choix, "prix_retenu": gagnant,
                     "qui": qui, "motif": motif,
                     "note": "decision tracee : a appliquer via /v1/action "
                             "prix (geste humain explicite)"}

    def digest(self):
        """Digest parc au retour d'une box (§16.2, P4) : ce qui a changé
        pendant la coupure, en UNE lecture.

        `last_seen` par box + longueur d'outbox par box + conflits non tranchés
        + alertes de seuils. C'est la page qu'on lit en premier quand une box
        revient : « qu'est-ce que j'ai raté ? » — pas 14 requêtes."""
        return {"generated_at": utcnow_iso(),
                "last_seen": {b.get("box_id"): self.last_seen(b.get("box_id"))
                              for b in self.boxes},
                "outbox_par_box": {
                    b.get("box_id"): self.outbox_len(b.get("box_id"))
                    for b in self.boxes},
                "conflits": self.conflits(),
                "alertes_resume": sxl.resumer(self.alertes_parc()),
                "lecture_seule": True}

    def metriques(self):
        durees = sorted(self._m["fanout_ms"])
        n = len(durees)
        # nearest-rank : p95 = la plus petite valeur couvrant 95 % des mesures.
        idx = min(n - 1, max(0, math.ceil(0.95 * n) - 1)) if n else 0
        return {"fanout_total": self._m["fanout_total"],
                "fanout_p95_ms": (durees[idx] if n else 0),
                "fanout_dernier_ms": (self._m["fanout_ms"][-1] if n else 0),
                "fanout_min_ms": (durees[0] if n else 0),
                "cache_hits": self._m["cache_hits"],
                "ecritures": self._m["ecritures"],
                "ecritures_refusees": self._m["ecritures_refusees"],
                "actions_autorisees": sorted(CIBLES),
                "comptes_humains": len(self.acces),
                "cache_ttl_s": self.ttl, "stale_apres_s": self.stale_apres,
                "fanout_workers": self.workers,
                 "fanout_workers": self.workers,
                 # Le budget A COTE de la mesure : un p95 sans cible ne se
                 # compare a rien, donc personne ne sait si on est dans le
                 # SLO. Il vient de la config, pas du code.
                 "fanout_budget_ms": self.fanout_budget_ms,
                "nb_boxes": len(self.boxes),
                "nb_logements": sum(len(b.get("logements", [])) for b in self.boxes),
                 "last_seen": {b.get("box_id"): self.last_seen(
                     b.get("box_id")) for b in self.boxes},
                 # G4-a : la file d'attente hors-ligne de chaque box,
                 # comptée sur disque. `null` = dossier illisible/absent,
                 # surtout pas 0 (une file vide et une file aveugle ne se
                 # valent pas).
                 "outbox_par_box": {b.get("box_id"): self.outbox_len(
                     b.get("box_id")) for b in self.boxes},
                 "outbox_seuil_alerte": sxl.SEUIL_OUTBOX_ALERTE,
                 "outbox_plafond": sxl.SEUIL_OUTBOX_PLAFOND,
                 # G4-a : les seuils évalués. `resumer` compte par niveau,
                 # et `mesures_absentes` dit ce qu'on ne peut pas juger —
                 # sinon « 0 alerte » se lirait « tout va bien ».
                 "alertes": self.alertes_parc(),
                 "alertes_resume": sxl.resumer(self.alertes_parc()),
                 "lecture_seule": True}

    # -- G2 : écriture 1-tap relayée (jamais décideur) ------------------------ #
    def _copro_verifiee(self, box, logement_id):
        """Précondition d'écriture : `copro.verifiee=false` = BLOQUÉE (§12.1)."""
        u = box.get("endpoints", {}) or {}
        code, etat = appeler("GET", u.get("decision", "") + "/etat",
                             {"logement_id": logement_id})
        if code != 200 or not isinstance(etat, dict):
            return None
        return bool(etat.get("copro_verifiee"))

    def _idempotence_lire(self, cle):
        try:
            with open(self.f_idem, encoding="utf-8") as f:
                return json.load(f).get(cle)
        except (FileNotFoundError, ValueError, OSError):
            return None

    def _idempotence_ecrire(self, cle, enveloppe):
        d = os.path.join(self.state_dir, "parc")
        try:
            os.makedirs(d, exist_ok=True)
            try:
                with open(self.f_idem, encoding="utf-8") as f:
                    table = json.load(f)
            except (FileNotFoundError, ValueError, OSError):
                table = {}
            now = time.time()
            table = {k: v for k, v in table.items()
                     if (v.get("ts") or 0) + IDEMPOTENCE_FENETRE_S > now}
            table[cle] = {"ts": now, "enveloppe": enveloppe}
            tmp = self.f_idem + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(table, f, ensure_ascii=False)
            os.replace(tmp, self.f_idem)
        except OSError:
            pass

    def _journal_parc(self, entree):
        """Double log (§6) : le journal BOX `decision.logX.jsonl` est écrit par
        les moteurs ; ici on trace le relai gateway (qui/action/ref/code).

        Toute ligne porte un `ref` : sans référence, on ne peut pas relier une
        trace gateway à la trace moteur, donc on ne peut rien prouver. Les
        entrées CRUD (§6bis) n'ont pas de ref d'action : on en fabrique une
        (`CRUD-<quoi>-<logement>-<ts>`) pour que la trace reste consultable."""
        try:
            if not entree.get("ref"):
                entree["ref"] = "CRUD-%s-%s-%s" % (
                    entree.get("quoi", "parc"),
                    entree.get("logement_id", "-"),
                    int(time.time()))
            os.makedirs(os.path.join(self.state_dir, "parc"), exist_ok=True)
            with open(self.f_journal, "a", encoding="utf-8") as f:
                f.write(json.dumps(entree, ensure_ascii=False) + "\n")
        except OSError:
            pass

    # -- G2 : vérification RBAC (statique + révocations runtime) ------------- #
    def _revocations(self):
        """Révoquations runtime du moteur decision (`acces-revocations.json`,
        gitignoré) — montées en lecture seule par la box. Cache court : une
        révocation met au plus `rbac_cache_s` à prendre effet côté gateway.
        Fichier absent (hors lab) = aucune révocation, on retombe sur
        `acces.yaml` seul."""
        now = time.time()
        ttl = float(self.cfg.get("rbac_cache_s", RBAC_CACHE_S))
        if now - getattr(self, "_revoc_ts", 0) < ttl:
            return getattr(self, "_revoc_cache", {})
        chemin = self.revocations_path or self.cfg.get("revocations")
        revoc = {}
        if chemin:
            try:
                with open(chemin, encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, dict):
                    revoc = data
            except (FileNotFoundError, ValueError, OSError):
                revoc = {}
        self._revoc_cache, self._revoc_ts = revoc, now
        return revoc

    def _expire_le(self, personne):
        d = personne.get("expire_le")
        if not d:
            return None
        try:
            return dt.date.fromisoformat(str(d))
        except ValueError:
            return None

    def _verifier_qui(self, qui, logement_id, action):
        """Retourne (None, personne) si OK, sinon (code, erreur). Contrôle dans
        l'ordre : humain → connu → non révoqué → non expiré → périmètre → rôle."""
        def refus(code, msg):
            return code, {"erreur": msg, "qui": qui, "action": action}

        if not qui or qui in QUI_INTERDITS or qui.startswith("moteur-"):
            return refus(400, "qui humain obligatoire "
                              "(refuse: auto/llm/jev/moteur-*/vide)")
        personne = self.acces.get(qui)
        if not personne:
            return refus(400, f"qui inconnu: {qui} (cf. custom/acces.yaml)")
        rev = self._revocations().get(qui)
        if rev:
            return refus(403, f"compte revoque le {rev.get('revoque_le')} "
                              f"({rev.get('motif', 'motif non precise')})")
        exp = self._expire_le(personne)
        if exp and exp < dt.date.today():
            return refus(403, f"compte expire le {personne.get('expire_le')}")
        perimetre = personne.get("logements", [])
        if logement_id not in perimetre:
            return refus(403, f"hors perimetre : {qui} n'a pas {logement_id} "
                              f"(perimetre {perimetre})")
        role = (personne.get("role"), personne.get("sous_role"))
        if role not in DROITS_ACTION.get(action, set()):
            return refus(403, f"{qui} ({role[0]}/{role[1]}) non autorise en "
                              f"ecriture sur {action}")
        return None, personne

    # -- Audit voir-comme (S3.3 / F3 IdP) --------------------------------- #
    # En mode IdP le front envoie `qui_reel` (Remote-User PRUVE par Caddy +
    # Authelia) a cote de `qui` (identite effective = cible du voir-comme)
    # sur TOUTE ecriture, et appelle /v1/audit au moment du geste. En mode
    # lab P1 le champ est absent : rien ne change (batteries inchangees).
    # Fail-closed : un refus EMPPECHE l'ecriture ; le geste est journalise
    # (journal parc, consultable 90 j) - voir sans trace est impossible.
    def _autorise_voir_comme(self, qui_reel, qui):
        """Sans objet -> (None, None) ; refuse -> (code, err) ; valide ->
        (None, None). meme ordre de controle que _verifier_qui, sur
        qui_reel : actif -> connu -> non revoque -> non expire -> admin."""
        def refus(code, msg):
            return code, {"erreur": msg, "qui_reel": qui_reel, "qui": qui}

        if not qui_reel or qui_reel == qui:
            return None, None
        personne = self.acces.get(qui_reel) \
            if isinstance(self.acces, dict) else next(
                (p for p in self.acces if p.get("id") == qui_reel), None)
        if not personne:
            return refus(403, "voir-comme refuse : qui_reel inconnu "
                              f"({qui_reel})")
        if self._revocations().get(qui_reel):
            return refus(403, "voir-comme refuse : qui_reel revoque "
                              f"({qui_reel})")
        exp = self._expire_le(personne)
        if exp and exp < dt.date.today():
            return refus(403, "voir-comme refuse : qui_reel expire le "
                              f"{personne.get('expire_le')}")
        role = (personne.get("role"), personne.get("sous_role"))
        if role not in self._ADMINS:
            return refus(403, "voir-comme refuse : "
                              f"{qui_reel} ({role[0]}/{role[1]}) : "
                              "admin requis")
        return None, None

    def piste_voir_comme(self, corps, action):
        """Piste d'audit d'une ecriture (S3.3) : si `qui_reel` differe de
        `qui`, admin actif exigé + entree journal. Sans champ (lab P1) :
        (None, None), comportement strictement inchange."""
        qui_reel = str((corps or {}).get("qui_reel") or "").strip()
        qui = str((corps or {}).get("qui") or "").strip()
        code, err = self._autorise_voir_comme(qui_reel, qui)
        if code:
            return code, err
        if qui_reel and qui_reel != qui:
            self._journal_parc({"ts": utcnow_iso(), "quoi": "voir_comme",
                                "qui": qui_reel, "qui_reel": qui_reel,
                                "vu_comme": qui,
                                "action": str(action or "")})
        return None, None

    def audit_voir_comme(self, corps):
        """POST /v1/audit : trace LE GESTE au moment de la bascule (le front
        l'appelle AVANT de poser lcd_vu ; si le journal tombe, pas de
        geste - le bandeau S3.3 montre alors l'identite seule)."""
        qui_reel = str((corps or {}).get("qui_reel") or "").strip()
        qui = str((corps or {}).get("qui") or "").strip()
        geste = str((corps or {}).get("geste") or "").strip()
        if not geste:
            return 400, {"erreur": "geste requis"}
        if not qui_reel or qui_reel == qui:
            return 400, {"erreur": "qui_reel et qui requis et differents "
                                   "pour tracer un geste voir-comme"}
        code, err = self._autorise_voir_comme(qui_reel, qui)
        if code:
            return code, err
        self._journal_parc({"ts": utcnow_iso(), "quoi": "voir_comme",
                            "qui": qui_reel, "qui_reel": qui_reel,
                            "vu_comme": qui, "action": f"geste:{geste}"})
        return 200, {"ok": True, "trace": "voir_comme"}

    # -- CRUD logements / config générale (§6bis) --------------------------- #
    # `qui` = humain connu, non révoqué, dans le périmètre du logement touché.
    # super_admin/admin pour créer/modifier, super_admin SEUL pour archiver.
    _ADMINS = {("super_admin", "super_admin"), ("super_admin", "admin")}
    _SUPER_SEUL = {("super_admin", "super_admin")}

    def _verifier_parc(self, qui, logement_id, niveau="admin",
                       creation=False):
        """(None, personne) si OK, sinon (code, erreur). Même ordre que
        `_verifier_qui` : interdit -> inconnu -> révoqué -> expiré -> périmètre
        -> rôle. On ne devine jamais un droit.

        `creation=True` (POST /parc/logements) : le logement n'existe pas
        encore, le périmètre n'a rien à vérifier — c'est le RÔLE qui garde la
        porte. Pour modifier/archiver un logement existant, le périmètre
        s'applique strictement."""
        def refus(code, message):
            return code, {"erreur": message, "qui": qui}

        q = (qui or "").strip()
        if not q or re.fullmatch(r"(auto|llm|jev|systeme|inconnu|moteur-.*)",
                                 q) or q in QUI_INTERDITS \
                or q.startswith("moteur-"):
            return refus(400, f"qui interdit en ecriture : {q!r}")
        personne = self.acces.get(q) if isinstance(self.acces, dict) else next(
            (p for p in self.acces if p.get("id") == q), None)
        if not personne:
            return refus(400, f"qui inconnu : {q}")
        revoc = self._revocations()
        if revoc.get(q):
            return refus(403, "revoque " + str(revoc[q]))
        exp = self._expire_le(personne)
        if exp and exp < dt.date.today():
            return refus(403, f"compte expire le {personne.get('expire_le')}")
        if not creation:
            perimetre = personne.get("logements", [])
            if logement_id and logement_id not in perimetre:
                return refus(403, f"hors perimetre : {q} n'a pas {logement_id}")
        roles = self._ADMINS if niveau == "admin" else self._SUPER_SEUL
        role = (personne.get("role"), personne.get("sous_role"))
        if role not in roles:
            return refus(403, f"{q} ({role[0]}/{role[1]}) : niveau "
                              f"{niveau} requis")
        return None, personne

    def _registre(self):
        chemin = self._resoudre(self.cfg.get("logements", ""))
        if not chemin or not os.path.isfile(chemin):
            raise ErreurRegistre(503, "registre logements non configure : "
                                + str(chemin))
        return RegistreLogements(chemin, os.path.join(self.state_dir, "parc",
                                                      "snapshots"))

    def _registre_annonces(self):
        """Registre des fiches annonce (§6bis-b). Mêmes garanties que les
        logements : snapshot avant écriture, écriture atomique."""
        chemin = self._resoudre(self.cfg.get("annonces", "annonces.yaml"))
        if not chemin or not os.path.isfile(chemin):
            raise ErreurRegistre(503, "registre annonces non configure : "
                                 + str(chemin))
        return ann.RegistreAnnonces(
            chemin, os.path.join(self.state_dir, "parc", "snapshots-annonces"))

    def _registre_entites(self):
        """Registre des entités juridiques (§3bis, G2bis)."""
        chemin = self._resoudre(self.cfg.get("entites", "entites.yaml"))
        if not chemin or not os.path.isfile(chemin):
            raise ErreurRegistre(503, "registre entites non configure : "
                                 + str(chemin))
        return ent.RegistreEntites(
            chemin, os.path.join(self.state_dir, "parc", "snapshots-entites"))

    def _registre_mandats(self):
        """Registre des mandats logement ↔ entité (§3bis, G2bis)."""
        chemin = self._resoudre(self.cfg.get("mandats", "mandats.yaml"))
        if not chemin or not os.path.isfile(chemin):
            raise ErreurRegistre(503, "registre mandats non configure : "
                                 + str(chemin))
        return mdt.RegistreMandats(
            chemin, os.path.join(self.state_dir, "parc", "snapshots-mandats"))

    # ------------------------------------------------------------------ #
    # G2bis-a : entités juridiques + mandats (plan §3bis)                 #
    # ------------------------------------------------------------------ #
    def rattachements(self):
        """`{logement_id: mandat}` pour tous les logements du parc.

        Source unique = `mandats.yaml`. Un logement ABSENT de ce registre est
        rendu tel quel (mandat vide) : c'est une fiche incomplète qui se
        signale dans `/etat-parc`, jamais une cause de blocage du planning
        (§3bis)."""
        out = {}
        try:
            mandats = self._registre_mandats().lister()
        except ErreurListe:
            return out
        for m in mandats:
            lid = str(m.get("logement_id", "") or "").strip()
            if lid:
                out[lid] = m
        return out

    def entites_lister(self):
        """Lecture seule des entités + le nombre de logements rattachés."""
        r = self._registre_entites()
        mandats = self.rattachements()
        comptes = {}
        for lid, m in mandats.items():
            eid = str(m.get("entite_id", "") or "").strip()
            comptes[eid] = comptes.get(eid, 0) + 1
        return {"generated_at": utcnow_iso(), "lecture_seule": True,
                "entites": [dict(e, nb_logements=comptes.get(
                    str(e.get("entite_id", "") or ""), 0))
                    for e in r.lister()],
                "natures": list(ent.NATURES),
                "regimes": list(ent.REGIMES),
                "tva": list(ent.TVA)}

    def entite_lire(self, entite_id):
        r = self._registre_entites()
        try:
            e = r.lire(entite_id)
        except ErreurListe as ex:
            return ex.code, {"erreur": ex.message}
        b, rap = ent.verifier(e)
        mandats = [m for m in self.rattachements().values()
                   if str(m.get("entite_id", "") or "") == str(entite_id)]
        return 200, {"entite": e, "bloquants": b, "rappels": rap,
                     "seuils": ent.seuils(e.get("regime")),
                     "mandats": sorted(str(m.get("logement_id") or "")
                                       for m in mandats),
                     "lecture_seule": True}

    def entite_definir(self, entite_id, p):
        """PUT /parc/entites/{id} — crée ou met à jour (admin seul).

        Refuse tout ce qui ressemble à un IBAN ou un numéro de compte en clair :
        le fichier est versionné, il finirait dans chaque clone et chaque image
        docker (§16.3). La référence `env:`/`vault:` suffit."""
        qui = str((p or {}).get("qui", "")).strip()
        champs = dict((p or {}).get("data") or {})
        code, err = self._verifier_parc(qui, entite_id, "admin", creation=True)
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err
        r = self._registre_entites()
        try:
            existe = r.lire(entite_id)
        except ErreurListe:
            existe = None
        fusion = dict(existe or {})
        fusion.update(champs)
        # Même règle que les mandats : `statut` se pose à la CRÉATION
        # (`STATUT_INITIAL` du registre) et ne se modifie plus ensuite — une
        # suspension ou une résolution passe par `changer_statut`.
        fusion["statut"] = str((existe or {}).get("statut")
                               or (ent.RegistreEntites.STATUT_INITIAL
                                   or ent.STATUTS[0]))
        try:
            ent.interdire_secret(champs)
        except ErreurListe as ex:
            self._m["ecritures_refusees"] += 1
            return ex.code, {"erreur": ex.message, "qui": qui}
        b, rap = ent.verifier(fusion)
        if b:
            self._m["ecritures_refusees"] += 1
            return 400, {"erreur": "; ".join(b), "bloquants": b,
                         "rappels": rap, "qui": qui}
        try:
            out = r.definir(entite_id, champs, par=qui)
        except ErreurListe as ex:
            self._m["ecritures_refusees"] += 1
            return ex.code, {"erreur": ex.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "entite_definie",
                            "qui": qui, "entite_id": entite_id,
                            "modifies": out.get("modifies"),
                            "snapshot": out.get("snapshot")})
        return 200, {"entite_id": entite_id, "qui": qui,
                     "modifies": out.get("modifies"),
                     "bloquants": [], "rappels": rap,
                     "snapshot": out.get("snapshot")}

    def mandats_lister(self, entite_id=None, mode=None):
        """Lecture seule des mandats, filtrables (§3bis)."""
        mandats = self.rattachements()
        out = []
        for lid in sorted(mandats):
            m = mandats[lid]
            if entite_id and str(m.get("entite_id", "") or "") \
                    != str(entite_id):
                continue
            if mode and str(m.get("mode", "") or "") != str(mode):
                continue
            out.append(dict(m, logement_id=lid))
        return {"generated_at": utcnow_iso(), "lecture_seule": True,
                "mandats": out, "modes": list(mdt.MODES)}

    def mandat_creer(self, p):
        """POST /parc/mandats — onboarding d'un logement (§3bis).

        Crée ou complète le mandat d'UN logement : rattachement obligatoire à
        une entité existante, mode `propre` ou `mandat_tiers` (avec client,
        commission et dossier). Le cycle de vie (`brouillon → pret → actif`)
        passe par `changer_statut`, jamais ici."""
        qui = str((p or {}).get("qui", "")).strip()
        lid = str((p or {}).get("logement_id", "") or "").strip()
        champs = dict((p or {}).get("data") or {})
        if not lid:
            return 400, {"erreur": "logement_id obligatoire", "qui": qui}
        code, err = self._verifier_parc(qui, lid, "admin", creation=True)
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err
        try:
            self._logement_canonique(lid)
        except ErreurRegistre as ex:
            self._m["ecritures_refusees"] += 1
            return ex.code, {"erreur": "logement inconnu : " + lid
                             + " — le créer d'abord (§6bis-a)", "qui": qui}
        entite_id = str(champs.get("entite_id", "") or "").strip()
        if not entite_id:
            self._m["ecritures_refusees"] += 1
            return 400, {"erreur": "entite_id obligatoire : un logement est "
                                   "toujours rattaché à une entité (§3bis)",
                         "qui": qui}
        try:
            self._registre_entites().lire(entite_id)
        except ErreurListe as ex:
            self._m["ecritures_refusees"] += 1
            return 409, {"erreur": "entité inconnue : " + entite_id
                         + " — la créer d'abord (PUT /parc/entites)",
                         "qui": qui}
        r = self._registre_mandats()
        try:
            lu = r.lire(lid)
        except ErreurListe:
            lu = None
        fusion = dict(lu or {})
        fusion.update(champs)
        fusion["logement_id"] = lid
        fusion["entite_id"] = entite_id
        # Le statut se met à `brouillon` à la CRÉATION et n'est plus jamais
        # touchable ici (il passe par `POST /parc/mandats/{id}/statut`). Calculé
        # APRÈS la fusion : un `statut` passé dans le payload ne doit pas pouvoir
        # faire naître un mandat déjà actif.
        fusion["statut"] = str((lu or {}).get("statut")
                                or mdt.STATUTS[0])
        b, rap = mdt.verifier(fusion)
        if b:
            self._m["ecritures_refusees"] += 1
            return 400, {"erreur": "; ".join(b), "bloquants": b,
                         "rappels": rap, "qui": qui}
        try:
            out = r.definir(lid, fusion, par=qui)
        except ErreurListe as ex:
            self._m["ecritures_refusees"] += 1
            return ex.code, {"erreur": ex.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "mandat_defini",
                            "qui": qui, "logement_id": lid,
                            "entite_id": entite_id,
                            "modifies": out.get("modifies"),
                            "snapshot": out.get("snapshot")})
        # On relit le statut APRÈS écriture plutôt que d'annoncer celui qu'on
        # croit avoir posé : si le fichier dit autre chose, c'est le fichier qui
        # a raison. Un statut inventé ferait croire à un mandat actif.
        statut_reel = str((r.lire(lid) or {}).get("statut", ""))
        return 200, {"logement_id": lid, "entite_id": entite_id, "qui": qui,
                     "statut": statut_reel,
                     "bloquants": [], "rappels": rap,
                     "modifies": out.get("modifies"),
                     "snapshot": out.get("snapshot")}

    def mandat_statut(self, lid, statut, p):
        """POST /parc/mandats/{id}/statut — cycle de vie (§3bis).

        `resilie` exige un motif ET la déclaration humaine que le reversement
        est soldé : la passerelle ne peut pas vérifier un virement, elle exige
        que l'humain l'affirme et le trace."""
        qui = str((p or {}).get("qui", "")).strip()
        motif = str((p or {}).get("motif", "") or "").strip()
        reversement_solde = bool((p or {}).get("reversement_solde"))
        finale = str(statut or "").strip()
        # RBAC AVANT toute lecture du registre : un refus ne doit pas dépendre
        # de l'existence de la cible, sinon un sondage d'identifiants révèle
        # l'état du parc.
        code, err = self._verifier_parc(qui, lid, "admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err
        if finale not in mdt.STATUTS:
            return 400, {"erreur": "statut hors enum : " + str(finale),
                         "attendus": list(mdt.STATUTS), "qui": qui}
        # Branche sur la constante, PAS sur une chaîne écrite ici : une faute de
        # frappe (`resilie` au lieu de `resolie`) rend ce garde-fou muet sans
        # rien casser d'autre — et un mandat résolu sans reversement soldé
        # passait alors en 200.
        if finale == mdt.STATUT_RESOLU:
            if not reversement_solde:
                return 400, {"erreur": "reversement_solde: true exigé : la "
                                       "passerelle ne peut pas vérifier un "
                                       "virement, l'humain le déclare et le "
                                       "trace", "qui": qui}
            if not motif:
                return 400, {"erreur": "motif obligatoire pour "
                              + mdt.STATUT_RESOLU, "qui": qui}
        r = self._registre_mandats()
        try:
            out = r.changer_statut(lid, finale, qui, mdt.TRANSITIONS,
                                   motif=motif,
                                   exiger_motif=(finale
                                                 == mdt.STATUT_RESOLU))
        except ErreurListe as ex:
            return ex.code, {"erreur": ex.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "mandat_statut",
                            "qui": qui, "logement_id": lid,
                            "avant": out.get("avant"), "apres": finale,
                            "motif": motif,
                            "reversement_solde": reversement_solde
                            if finale == mdt.STATUT_RESOLU else None,
                            "snapshot": out.get("snapshot")})
        return 200, {"logement_id": lid, "qui": qui, "avant": out.get("avant"),
                     "apres": finale, "motif": motif,
                     "transitions_possibles": list(
                         mdt.TRANSITIONS.get(finale, ()))}

    def mandat_rollback(self, lid, p):
        """POST /parc/mandats/{id}/rollback — restaure un snapshot (super_admin).

        Même filet que les autres registres (§6bis) : on n'écrit jamais sans
        avoir photographié l'état d'avant, et on sait revenir en arrière."""
        qui = str((p or {}).get("qui", "")).strip()
        nom = str((p or {}).get("snapshot", "") or "").strip()
        code, err = self._verifier_parc(qui, lid, "super_admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err
        if not nom:
            return 400, {"erreur": "snapshot (nom du fichier) obligatoire",
                         "disponibles": self._registre_mandats().snapshots(),
                         "qui": qui}
        try:
            out = self._registre_mandats().rollback(nom)
        except ErreurListe as ex:
            return ex.code, {"erreur": ex.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "mandat_rollback",
                            "qui": qui, "logement_id": lid,
                            "snapshot": out.get("restaure")})
        return 200, dict(out, qui=qui, logement_id=lid)

    def _logement_canonique(self, lid):
        """Vérifie qu'un logement existe et rend sa fiche (registre moteurs)."""
        r = self._registre()
        return r.lire(lid)

    # -- §15/§16.3 : routage IA/LLM (lecture + dry-run + tester) ------------ #
    # `llm.yaml` versionné, SANS CLÉ. Édition = même pattern que
    # `/config-generale` (dry-run → diff → confirmer → rollback, snapshot).
    _LLM_ADMINS = {("super_admin", "super_admin"), ("super_admin", "admin")}

    def _verifier_llm(self, qui):
        q = (qui or "").strip()
        if not q or q in QUI_INTERDITS or q.startswith("moteur-"):
            return 400, {"erreur": "qui humain obligatoire", "qui": qui}
        personne = self.acces.get(q)
        if not personne:
            return 400, {"erreur": f"qui inconnu : {q}"}
        if (personne.get("role"), personne.get("sous_role")) \
                not in self._LLM_ADMINS:
            return 403, {"erreur": f"{q} : super_admin/admin requis "
                                    "(jamais proprio/presta/voyageur/"
                                    "commercial)"}
        return None, personne

    def _lire_llm(self):
        chemin = self._resoudre(self.cfg.get("llm", "llm.yaml"))
        cfg = {"global": {}, "usages": {}, "entites": {}, "logements": {},
               "optins": {}}
        try:
            with open(chemin, encoding="utf-8") as f:
                section, usage = "", ""
                for brute in f:
                    if not brute.strip() or brute.strip().startswith("#"):
                        continue
                    ind = len(brute) - len(brute.lstrip(" "))
                    txt = brute.strip()
                    if ind == 0 and txt.endswith(":"):
                        section = txt[:-1]
                        usage = ""
                        continue
                    if section == "global" and ind == 2 and ":" in txt:
                        k, v = txt.split(":", 1)
                        cfg["global"][k.strip()] = depoluer(v)
                    elif section == "usages" and ind == 2 and txt.endswith(":"):
                        usage = txt[:-1]
                        cfg["usages"][usage] = {}
                    elif section == "usages" and usage and ind == 4 \
                            and ":" in txt:
                        k, v = txt.split(":", 1)
                        cfg["usages"][usage][k.strip()] = depoluer(v)
        except FileNotFoundError:
            pass
        return cfg

    def config_llm_lire(self, qui):
        code, err = self._verifier_llm(qui)
        if code:
            return code, err
        cfg = self._lire_llm()
        return 200, {"usages": sorted(cfg["usages"]),
                     "interdits": list(llmm.INTERDITS),
                     "lecture_seule": True, "qui": qui}

    def config_llm_tester(self, p):
        """POST /v1/llm-tester : dry-run sans écriture, sans envoi, sans WAN.

        Prompt figé anonymisé → redaction PII → hash loggé → réponse
        `degrade_sans_IA` + confidence + coût estimé. Injection détectée =
        refus + log `injection_tentative` (§16.3). Usage interdit = 403."""
        qui = str((p or {}).get("qui", "") or "").strip()
        usage = str((p or {}).get("usage", "") or "").strip()
        prompt = str((p or {}).get("prompt", "") or "")
        code, err = self._verifier_llm(qui)
        if code:
            return code, err
        if usage in llmm.INTERDITS:
            self._journal_parc({"ts": utcnow_iso(),
                                "quoi": "llm_interdit_tente",
                                "qui": qui, "usage": usage})
            return 403, {"erreur": "usage interdit (non configurable) : "
                                   + usage}
        if usage not in llmm.USAGES:
            return 400, {"erreur": "usage inconnu : " + usage,
                         "usages": list(llmm.USAGES)}
        if llmm.injection_detectee(prompt):
            self._journal_parc({"ts": utcnow_iso(),
                                "quoi": "injection_tentative",
                                "qui": qui, "usage": usage,
                                "prompt_hash": llmm.prompt_hash(prompt)})
            return 403, {"erreur": "instruction embarquee refusee "
                                   "(injection_tentative loggee)"}
        cfg = self._lire_llm()
        tue, par = llmm.kill_actif(usage, cfg)
        redige, nred = llmm.rediger(prompt)
        if tue:
            self._journal_parc({"ts": utcnow_iso(), "quoi": "llm_tester",
                                "qui": qui, "usage": usage,
                                "modele_effectif": "degrade_sans_IA",
                                "prompt_hash": llmm.prompt_hash(redige),
                                "redactions": nred, "kill": par})
            return 200, {"usage": usage, "modele_effectif": "degrade_sans_IA",
                         "confidence": None,
                         "reponse": "IA indisponible — file humain.",
                         "ia_generee": False, "kill": par,
                         "redactions": nred, "lecture_seule": True}
        ok, motif, eff = llmm.quota_autorise({}, usage, cfg)
        self._journal_parc({"ts": utcnow_iso(), "quoi": "llm_tester",
                            "qui": qui, "usage": usage,
                            "modele_effectif": "dry-run",
                            "prompt_hash": llmm.prompt_hash(redige),
                            "redactions": nred})
        return 200, {"usage": usage, "modele_effectif": "dry-run",
                     "confidence": 0.0,
                     "reponse": "dry-run : sans ecriture, sans envoi, "
                                "sans appel WAN (redaction verifiee).",
                     "ia_generee": True, "redactions": nred,
                     "lecture_seule": True}

    # -- §14.5/G6 : CRM prospection (commercial + admins) -------------------- #
    _CRM_ROLES = {("super_admin", "super_admin"), ("super_admin", "admin"),
                  ("gestionnaire", "commercial")}

    def _verifier_crm(self, qui):
        q = (qui or "").strip()
        if not q or q in QUI_INTERDITS or q.startswith("moteur-"):
            return 400, {"erreur": "qui humain obligatoire", "qui": qui}
        personne = self.acces.get(q)
        if not personne:
            return 400, {"erreur": f"qui inconnu : {q}"}
        if (personne.get("role"), personne.get("sous_role")) \
                not in self._CRM_ROLES:
            return 403, {"erreur": f"{q} : commercial/admin requis "
                                    "(jamais prix/couts/autres clients)"}
        return None, personne

    def _registre_prospects(self):
        from registre_liste import RegistreListe as _RL

        class _RP(_RL):
            SECTION = "prospects:"
            CLE_ID = "prospect_id"
            STATUT_INITIAL = "suspect"
            SCALAIRES = ("prospect_id", "nom", "bien", "source", "contact_ref",
                         "statut", "cree_le", "cree_par", "maj_le")
            STRUCTURES = ()

        chemin = self._resoudre(self.cfg.get("prospects", "prospects.yaml"))
        if not chemin or not os.path.isfile(chemin):
            raise ErreurRegistre(503, "registre prospects non configure")
        return _RP(chemin, os.path.join(self.state_dir, "parc",
                                        "snapshots-prospects"))

    def prospects_lister(self, qui):
        code, err = self._verifier_crm(qui)
        if code:
            return code, err
        try:
            lst = self._registre_prospects().lister()
        except ErreurRegistre as e:
            return e.code, {"erreur": e.message}
        return 200, {"prospects": lst, "pipeline": list(crm_mod.PIPELINE),
                     "lecture_seule": True}

    def prospect_creer(self, p):
        qui = str((p or {}).get("qui", "") or "").strip()
        champs = dict((p or {}).get("data") or {})
        code, err = self._verifier_crm(qui)
        if code:
            return code, err
        pid = str(champs.get("prospect_id", "") or "").strip()
        if not pid:
            return 400, {"erreur": "prospect_id requis", "qui": qui}
        if champs.get("source") \
                and str(champs["source"]) not in crm_mod.SOURCES:
            return 400, {"erreur": "source inconnue : "
                                   + str(champs["source"]),
                         "sources": list(crm_mod.SOURCES)}
        try:
            out = self._registre_prospects().definir(pid, champs, par=qui)
        except ErreurRegistre as e:
            return e.code, {"erreur": e.message, "qui": qui}
        self._journal_parc({"ts": utcnow_iso(), "quoi": "prospect_cree",
                            "qui": qui, "prospect_id": pid})
        return 201, dict(out, qui=qui, relances=crm_mod.relances())

    def pipeline_lire(self, qui):
        code, err = self._verifier_crm(qui)
        if code:
            return code, err
        try:
            lst = self._registre_prospects().lister()
        except ErreurRegistre as e:
            return e.code, {"erreur": e.message}
        par_statut = {}
        for pr in lst:
            par_statut.setdefault(str(pr.get("statut", "suspect")), []).append(
                pr.get("prospect_id"))
        return 200, {"par_statut": par_statut, "pipeline": list(
            crm_mod.PIPELINE), "lecture_seule": True}

    def simulateur_calculer(self, p):
        """POST /v1/simulateur : ADR x occupation − commissions (indicatif)."""
        qui = str((p or {}).get("qui", "") or "").strip()
        code, err = self._verifier_crm(qui)
        if code:
            return code, err
        entite_id = str((p or {}).get("entite_id", "") or "").strip()
        if not entite_id:
            return 422, {"erreur": "entite_id requise (jamais de simulation "
                                   "sur une fiche fiscale inconnue)"}
        try:
            self._registre_entites().lire(entite_id)
            connue = True
        except ErreurListe:
            connue = False
        sim, serr = crm_mod.simulateur(
            (p or {}).get("adr"), (p or {}).get("occupation_pct"),
            float((p or {}).get("nuits_an", 365) or 365),
            float((p or {}).get("commission_pct", 25) or 25),
            float((p or {}).get("plateforme_pct", 17) or 17),
            entite_connue=connue,
            forfait=str((p or {}).get("forfait", "full_service") or
                        "full_service").strip())
        if serr:
            return 422, dict(serr, qui=qui)
        self._journal_parc({"ts": utcnow_iso(), "quoi": "simulateur",
                            "qui": qui, "entite_id": entite_id})
        return 200, dict(sim, entite_id=entite_id, lecture_seule=True)

    def offre_generer(self, p):
        qui = str((p or {}).get("qui", "") or "").strip()
        code, err = self._verifier_crm(qui)
        if code:
            return code, err
        prospect_id = str((p or {}).get("prospect_id", "") or "").strip()
        try:
            prospects = {x.get("prospect_id"): x
                         for x in self._registre_prospects().lister()}
        except ErreurRegistre as e:
            return e.code, {"erreur": e.message}
        pr = prospects.get(prospect_id)
        if not pr:
            return 404, {"erreur": "prospect inconnu : " + prospect_id}
        sim = dict((p or {}).get("simulation") or {})
        offre = crm_mod.offre_contenu(pr, sim)
        self._journal_parc({"ts": utcnow_iso(), "quoi": "offre_generee",
                            "qui": qui, "prospect_id": prospect_id,
                            "ref": offre["ref"]})
        return 200, dict(offre, prospect_id=prospect_id,
                         lecture_seule=True)

    # -- §6quater/§13.8 : export compta Chorus Pro / PDP (lecture seule) ----- #
    def export_compta(self, entite_id=None):
        """GET /export-compta : 1 plan par SIREN, jamais de mélange."""
        try:
            ents = self._registre_entites().lister()
        except ErreurListe as e:
            return e.code, {"erreur": e.message}
        if entite_id:
            ents = [x for x in ents
                    if str(x.get("entite_id")) == str(entite_id)]
            if not ents:
                return 404, {"erreur": "entite inconnue : " + str(entite_id)}
        factures = []
        for b in self.boxes:
            for l in b.get("logements", []) or []:
                lid = str(l.get("id", "") or "")
                m = (self.rattachements().get(lid) or {})
                code, fin = self._finances(lid)
                if code != 200 or not isinstance(fin, dict):
                    continue
                factures.append({"entite_id": m.get("entite_id"),
                                 "logement_id": lid,
                                 "ref": "FIN-%s" % lid,
                                 "montant_ttc": fin.get("ca"),
                                 "tva": "non"})
        return 200, exc.export_parc(factures, ents)

    # -- §16.3 : effacement RGPD (voyageur 90 j, prospect tracé) ------------- #
    def effacement(self, p):
        qui = str((p or {}).get("qui", "") or "").strip()
        cible = str((p or {}).get("cible", "") or "").strip()
        code, err = self._verifier_parc(qui, "", "super_admin",
                                        creation=True)
        if code:
            return code, err
        if not cible:
            return 400, {"erreur": "cible requise (ref voyageur/prospect)"}
        self._journal_parc({"ts": utcnow_iso(), "quoi": "effacement_rgpd",
                            "qui": qui, "cible_hash": llmm.prompt_hash(cible)})
        return 200, {"efface": True, "cible_hash": llmm.prompt_hash(cible),
                     "purge_tracee": True, "qui": qui}

    # -- §17 : i18n (lecture seule, 5 langues) -------------------------------- #
    def _catalogues_i18n(self):
        base = os.path.join(self.base, "i18n")
        return i18n_mod.charger(base)

    def texte(self, cle, lang="fr", variables=None):
        return i18n_mod.t(self._catalogues_i18n(), cle, lang, variables)

    def filtrer_logements(self, logements, entite_id=None, mode=None):
        """Filtre `?entite=` / `?mode=` sur une liste de logements (§3bis).

        Le filtre ne retire JAMAIS une ligne en silence : chaque logement
        écarté est compté dans `filtres.ecartes`, sinon une liste vide ne
        distinguerait pas « aucun logement » de « filtre trop restrictif »."""
        if not entite_id and not mode:
            return logements, None
        mandats = self.rattachements()
        if entite_id and mode:
            cles = [lid for lid, m in mandats.items()
                    if str(m.get("entite_id", "") or "") == str(entite_id)
                    and str(m.get("mode", "") or "") == str(mode)]
        elif entite_id:
            cles = [lid for lid, m in mandats.items()
                    if str(m.get("entite_id", "") or "") == str(entite_id)]
        else:
            cles = [lid for lid, m in mandats.items()
                    if str(m.get("mode", "") or "") == str(mode)]
        gardes = [l for l in logements
                  if str(l.get("logement_id") or l.get("id") or "")
                  in cles]
        return gardes, {"entite_id": entite_id, "mode": mode,
                        "gardes": len(gardes),
                        "ecartes": len(logements) - len(gardes),
                        "autorises": sorted(cles)}

    # -- G2bis-b : portail propriétaire tiers (§3bis) ------------------------ #
    # Le propriétaire voit l'argent de SON logement, rien d'autre. Le portail
    # ne détient rien : la compta reste la source de vérité (lecture seule), et
    # le mandat la règle écrite. Décision de lecture centralisée ici pour
    # qu'une seule méthode serve l'API et la page.
    def portail_releve(self, lid, qui, annee="", mois=""):
        """Relevé propriétaire d'un logement sur une période.

        Retourne (code, reponse). Aucun montant n'est inventé : tout vient de
        `GET /finances` de la compta. Les `None` et la liste `inconnu` disent
        ce que la compta n'expose pas — c'est la même règle que §58
        (`endpoints_manquants` explicite)."""
        q = str(qui or "").strip()
        if not q:
            return 400, {"erreur": "qui obligatoire (compte humain du "
                                   "portail proprietaire)"}
        personne = self.acces.get(q) if isinstance(self.acces, dict) else \
            next((p for p in self.acces if p.get("id") == q), None)
        if not personne:
            return 400, {"erreur": f"qui inconnu : {q} (cf. custom/acces.yaml)"}
        err = self._verif_compte(personne)
        if err:
            return err
        mandats = self.rattachements()
        m = dict(mandats.get(str(lid).strip()) or {})
        if not m:
            return 404, {"erreur": "aucun mandat pour " + str(lid)
                         + " (un proprietaire sans mandat n'a rien a voir)",
                         "connus": sorted(mandats)}
        vu, pourquoi = ptf.lien(personne, dict(m, logement_id=str(lid)))
        if not vu:
            # On ne dit PAS quel client détient le logement : ce serait déjà
            # divulguer l'existence d'un client.
            return 403, {"erreur": pourquoi or "hors perimetre", "qui": q}
        code, fin = self._finances(lid, annee=annee, mois=mois)
        if code != 200:
            return code, {"erreur": "compta indisponible pour "
                                    + str(lid) + " : " + str(fin),
                         "lecture_seule": True}
        rep = ptf.releve(dict(m, logement_id=str(lid)), fin)
        rep.update({"lien": vu, "periode": {"annee": str(annee or ""),
                                            "mois": str(mois or "")},
                    "lecture_seule": True})
        # Trace : qui a consulté l'argent de quel client (§6 double log). Aucun
        # montant n'entre au journal — il est déjà chez la compta.
        self._journal_parc({"ts": utcnow_iso(), "quoi": "portail_releve",
                            "qui": q, "logement_id": str(lid), "lien": vu})
        return 200, rep

    def _verif_compte(self, personne):
        """Compte non révoqué, non expiré. Le rôle et le périmètre sont
        vérifiés par `ptf.lien()` sur le MANDAT, jamais devinés ici."""
        q = str(personne.get("id", "") or "").strip()
        revoc = self._revocations()
        if revoc.get(q):
            return 403, {"erreur": "compte revoque : " + str(revoc[q])}
        exp = self._expire_le(personne)
        if exp and exp < dt.date.today():
            return 403, {"erreur": f"compte expire le "
                                   f"{personne.get('expire_le')}"}
        return None

    def _finances(self, lid, annee="", mois=""):
        """Lecture SEULE de `GET /finances` compta pour un logement.

        Le moteur est contacté via son endpoint du registre box ; s'il est
        muet ou si l'endpoint est absent du registre, on renvoie l'erreur
        telle quelle (jamais un 0 qui ressemblerait à « aucun revenu »)."""
        for b in self.boxes:
            for l in b.get("logements", []) or []:
                if str(l.get("id", "") or "") != str(lid):
                    continue
                u = b.get("endpoints", {}) or {}
                url = str(u.get("compta", "") or "")
                if not url:
                    return 503, ("compta: endpoint absent du registre "
                                 "boxes.yaml")
                params = {"logement_id": str(lid)}
                if annee:
                    params["annee"] = str(annee)
                if mois:
                    # `mois` additif côté compta (rétrocompatible : absent =
                    # bilan annuel, comme avant).
                    params["mois"] = str(mois)
                code, rep = appeler("GET", url + "/finances", params,
                                    timeout=self.cfg.get("fanout_timeout_s", 8))
                if code != 200:
                    return code, rep
                return 200, rep if isinstance(rep, dict) else {}
        return 404, "logement inconnu du registre : " + str(lid)

    def doc_servir(self, lid, quoi, qui):
        """Sert un document de mandat PDF (§17 / G2bis-b).

        TROIS portes, dans un ordre non négociable — c'est le seul endpoint
        qui rend du binaire depuis le disque.

        1. **Le mandat d'abord** : `ptf.lien()` décide, la gateway ne devine
           pas. Un compte sans mandat sur CE logement reçoit 403 même en
           connaissant le nom exact du fichier.
        2. **Le nom ensuite** : `ptf.chemin_doc()` whiteliste l'extension,
           les caractères, rejette `..`, puis confine le RÉSULTAT de
           `realpath` sous `docs_dir`. Une seule fonction touche au disque,
           donc une seule à auditer.
        3. **Le contenu enfin** : `application/pdf` + `Content-Disposition:
           attachment`. Jamais `text/html`, jamais de rendu inline — un PDF
           servi inline dans l'origine du portail est un vecteur.

        Le journal porte qui / quoi / logement et le nombre d'octets. Jamais
        un montant, et jamais le chemin disque dans la réponse : il
        renseignerait un attaquant, pas le propriétaire."""
        q = str(qui or "").strip()
        if not q:
            return 400, {"erreur": "qui obligatoire (compte humain du "
                                   "portail proprietaire)"}
        personne = self.acces.get(q) if isinstance(self.acces, dict) else \
            next((p for p in self.acces if p.get("id") == q), None)
        if not personne:
            return 400, {"erreur": f"qui inconnu : {q} (cf. custom/acces.yaml)"}
        err = self._verif_compte(personne)
        if err:
            return err
        m = dict(self.rattachements().get(str(lid).strip()) or {})
        if not m:
            return 404, {"erreur": "aucun mandat pour " + str(lid)}
        vu, pourquoi = ptf.lien(personne, dict(m, logement_id=str(lid)))
        if not vu:
            return 403, {"erreur": pourquoi or "hors perimetre", "qui": q}
        if not self.docs_dir:
            return 404, {"erreur": "service documents non configuré sur ce "
                                   "site (docs_dir absent) : ce n'est pas "
                                   "0 document, c'est un service éteint"}
        chemin, motif = ptf.chemin_doc(self.docs_dir, lid, quoi)
        if not chemin:
            # 403 et pas 404 : on a REFUSÉ, on n'a pas cherché sans trouver.
            return 403, {"erreur": "document refusé : " + motif, "qui": q}
        noms, note = ptf.documents_disponibles(self.docs_dir, lid)
        if not noms or str(quoi) not in noms:
            return 404, {"erreur": "document absent du dépôt : " + str(quoi)
                         + ("" if not note else " (" + note + ")"),
                         "disponibles": noms or []}
        try:
            with open(chemin, "rb") as fh:
                contenu = fh.read()
        except OSError as ex:
            return 503, {"erreur": "document illisible ("
                                   + str(getattr(ex, "strerror", ex)) + ")",
                         "qui": q}
        self._journal_parc({"ts": utcnow_iso(), "quoi": "portail_doc",
                            "qui": q, "logement_id": str(lid),
                            "document": str(quoi), "lien": vu,
                            "octets": len(contenu)})
        return 200, contenu

    def portail_pilotage(self, lid, qui, annee="", mois=""):
        """Pilotage d'UN logement : ADR / RevPAR / occupation (§14.3).

        Même discipline que `portail_releve` : le portail ne calcule rien à
        partir de rien, il **rapproche** deux lectures déjà autorisées (la
        compta pour l'argent, le calendrier pour les nuits ouvertes) et dit ce
        qu'il n'a pas pu rapprocher. Aucun moteur n'est appelé en écriture."""
        q = str(qui or "").strip()
        if not q:
            return 400, {"erreur": "qui obligatoire (compte humain du "
                                   "portail proprietaire)"}
        personne = self.acces.get(q) if isinstance(self.acces, dict) else \
            next((p for p in self.acces if p.get("id") == q), None)
        if not personne:
            return 400, {"erreur": f"qui inconnu : {q} (cf. custom/acces.yaml)"}
        err = self._verif_compte(personne)
        if err:
            return err
        mandats = self.rattachements()
        m = dict(mandats.get(str(lid).strip()) or {})
        if not m:
            return 404, {"erreur": "aucun mandat pour " + str(lid)
                         + " (un proprietaire sans mandat n'a rien a voir)",
                         "connus": sorted(mandats)}
        vu, pourquoi = ptf.lien(personne, dict(m, logement_id=str(lid)))
        if not vu:
            return 403, {"erreur": pourquoi or "hors perimetre", "qui": q}
        code, fin = self._finances(lid, annee=annee, mois=mois)
        if code != 200:
            return code, {"erreur": "compta indisponible pour "
                                    + str(lid) + " : " + str(fin),
                          "lecture_seule": True}
        # Les nuits ouvertes : mêmes cases calendrier que `/calendrier-parc`,
        # mais SANS calcul de prix ici (aucun montant d'inventé).
        cal = self.calendrier_parc()
        lot = next((l for l in (cal.get("logements") or [])
                    if str(l.get("logement_id")) == str(lid).strip()), None)
        rep = ptf.pilotage(fin, lot)
        rep.update({"logement_id": str(lid), "lien": vu,
                    "periode": {"annee": str(annee or ""), "mois": str(mois)},
                    "lecture_seule": True})
        self._journal_parc({"ts": utcnow_iso(), "quoi": "portail_pilotage",
                            "qui": q, "logement_id": str(lid), "lien": vu})
        return 200, rep

    def portail_lister(self, qui, annee="", mois="", client=""):
        """Les logements que CE compte peut voir, avec leur relevé.

        Sans accès = liste VIDE marquée telle quelle (jamais « 0 logement »
        qui ressemblerait à « le parc est vide »)."""
        q = str(qui or "").strip()
        out = {"generated_at": utcnow_iso(), "qui": q, "annee": str(annee or ""),
               "mois": str(mois or ""), "lecture_seule": True,
               "logements": []}
        if not q:
            return 400, dict(out, erreur="qui obligatoire (compte humain du "
                                         "portail proprietaire)")
        personne = self.acces.get(q) if isinstance(self.acces, dict) else \
            next((p for p in self.acces if p.get("id") == q), None)
        if not personne:
            return 400, dict(out, erreur=f"qui inconnu : {q}")
        err = self._verif_compte(personne)
        if err:
            code, rep = err
            return code, dict(out, erreur=rep.get("erreur"))
        visibles = ptf.logements_visibles(personne, self.ids_logements(),
                                         self.rattachements())
        out["visibles"] = len(visibles)
        # §3bis (G2bis-b-2) : `?client=` = `client_tiers_ref` OPAQUE.
        # Un proprietaire ne peut filtrer que sur un client qu il a
        # DECLARE (meme namespace que l autorisation), sinon le filtre
        # servirait a enumerer la clientele du cabinet. Le filtre ne retire
        # jamais une ligne en silence : `gardes` + `ecartes` (meme regle que
        # `filtrer_logements`), sinon une liste vide ne se distinguerait pas
        # de « vous n avez aucun logement ».
        cl = str(client or "").strip()
        if cl:
            ok, pourquoi = ptf.filtre_client_permis(personne, cl)
            if not ok:
                return 403, dict(out, erreur=pourquoi)
            out["filtres"] = {"client": cl, "gardes": 0, "ecartes": 0}
        for lid, info in sorted(visibles.items()):
            if not info.get("lien"):
                continue
            if cl:
                mcl = str((self.rattachements().get(lid) or {}).get(
                    "client_tiers_ref", "") or "").strip()
                if mcl != cl:
                    out["filtres"]["ecartes"] += 1
                    continue
                out["filtres"]["gardes"] += 1
            code, rep = self.portail_releve(lid, q, annee=annee, mois=mois)
            out["logements"].append(
                {"logement_id": lid, "lien": info.get("lien")}
                if code != 200 else
                dict(rep, logement_id=lid, lien=info.get("lien")))
        return 200, out

    def portail_page(self, qui="", client=""):
        """Page portail propriétaire (HTML servi par la gateway, 0 JS, 0 secret).

        Même discipline que la page de pilotage : rien n'est caché, rien n'est
        inventé, et un montant inconnu s'affiche `—` et non `0 €`."""
        h = html.escape
        q = str(qui or "").strip()
        corps = ["<h1>Portail propriétaire</h1>"]
        if not q:
            return ("<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'>"
                    "<title>LCD — portail propriétaire</title>"
                    "<style>body{font-family:system-ui,sans-serif;margin:1rem}"
                    ".box{border:1px solid #999;padding:.5rem;margin:.5rem 0}"
                    ".err{color:#a00}.note{font-size:.85em;color:#555}</style>"
                    "</head><body>" + "".join(corps) +
                    "<p class='err'>Aucun compte choisi : indiquez-le en "
                    "<code>?qui=</code> (ex. <code>?qui=personne_05</code>). "
                    "Le portail ne devine jamais pour qui on parle.</p>"
                    "<p class='note'>Comptes propriétaires de "
                    "<code>custom/acces.yaml</code> : "
                    + ", ".join(f"<code>{h(c)}</code>" for c in
                                sorted(self._proprietaires())) + "</p>"
                    "</body></html>")
        cl = str(client or "").strip()
        code, rep = self.portail_lister(q, client=cl)
        if code != 200:
            corps.append("<p class='err'>Accès refusé — "
                         + h(str(rep.get("erreur", ""))) + "</p>")
        else:
            n = len(rep.get("logements") or [])
            corps.append(
                f"<p class='band'>{n} logement(s) visible(s) pour "
                f"<b>{h(q)}</b>"
                + (f" — filtré sur le client <code>{h(cl)}</code> "
                   f"({rep['filtres']['gardes']} gardé(s), "
                   f"{rep['filtres']['ecartes']} écarté(s), "
                   "comptés plutôt que masqués)" if cl else "")
                + " — lecture seule, aucun montant inventé.</p>")
            for r in rep.get("logements") or []:
                corps.append(self._portail_bloc(r))
            if not n:
                corps.append("<p class='note'>Aucun logement rattaché à ce "
                             "compte : c'est une information, pas un parc "
                             "vide.</p>")
        return ("<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'>"
                "<meta http-equiv='refresh' content='300'>"
                "<title>LCD — portail propriétaire</title>"
                "<style>body{font-family:system-ui,sans-serif;margin:1rem}"
                "table{border-collapse:collapse}td,th{border:1px solid #ccc;"
                "padding:2px 8px}.box{border:1px solid #999;padding:.5rem;"
                "margin:.5rem 0}.err{color:#a00}"
                ".band{background:#eef;padding:.4rem;margin:.3rem 0}"
                ".note{font-size:.85em;color:#555}</style></head><body>"
                + "".join(corps) +
                "<p class='note'>Relevé <b>indicatif</b> : le rapprochement "
                "compta et la validation restent chez l'expert-comptable. "
                "Voir aussi <a href='/portail-proprio?qui=" + h(q) + "'>cette "
                "page</a> · <a href='/'>pilotage parc</a></p>"
                "</body></html>")

    def _proprietaires(self):
        out = []
        for cid, p in sorted((self.acces or {}).items()):
            if str(p.get("role", "") or "") == "proprietaire":
                out.append(cid)
        return out

    def _portail_bloc(self, r):
        """Un relevé rendu en tableau — `None` s'affiche `—`, jamais `0`."""
        h = html.escape
        def e(v):
            return h(str(v))
        def euro(v):
            return "—" if v is None else e(f"{float(v):.2f} €")
        lignes = [
            ("Lignes du relevé", ""),
            ("Brut encaissé", euro(r.get("brut_recolte"))),
            ("dont commission plateforme",
             ("— (non isolée par la compta)"
              if not r.get("plateforme_connue") else euro(r.get("plateforme")))),
            ("Nuits", e(r.get("nuits")) if r.get("nuits") is not None else "—"),
            ("Ménage (rubrique menage)", euro(r.get("menage"))),
            ("Autres charges (factures validées)", euro(r.get("autres_charges"))),
            ("Commission conciergerie",
             euro(r.get("commission_conciergerie"))
             + ("" if r.get("commission_pct_applique") is None
                else " (" + e(r.get("commission_pct_applique")) + " %)")),
            ("Net reversé", euro(r.get("net_reverse"))),
            ("Mode", e(r.get("mode"))),
            ("Entité", e(r.get("entite_id"))),
            ("Ménage à charge de", e(r.get("menage_a_charge"))),
            ("Reversement", e(r.get("reversement"))),
        ]
        tab = "".join(f"<tr><td>{e(a)}</td><td>{b}</td></tr>" for a, b in lignes)
        canal = r.get("par_canal") or {}
        tab += "<tr><td>Par canal (encore net)</td><td>" + (
            ", ".join(f"{e(k)} : {e(v)}" for k, v in sorted(canal.items()))
            or "—") + "</td></tr>"
        notes = []
        for x in (r.get("inconnu") or []):
            notes.append("inconnu : " + x)
        for x in (r.get("attention") or []):
            notes.append("attention : " + x)
        if notes:
            note = "<ul class='err'>" + "".join(f"<li>{e(n)}</li>"
                                              for n in notes) + "</ul>"
        else:
            note = ("<p class='note'>Relevé complet selon ce que la compta "
                    "expose.</p>")
        return (f"<section class='box'><h2>Relevé — {e(r.get('logement_id'))}"
                f" <small>({e(r.get('lien'))})</small></h2>"
                f"<table><tr><th>poste</th><th>valeur</th></tr>{tab}</table>"
                f"{note}</section>")



    def parc_lister(self):
        """Lecture seule : le registre tel qu'il est (aucune écriture)."""
        return {"generated_at": utcnow_iso(),
                "logements": self._registre().lister(),
                "lecture_seule": True}

    def parc_creer(self, p):
        """POST /parc/logements — super_admin/admin seuls (§6bis)."""
        lid = str((p or {}).get("logement_id", "")).strip()
        qui = str((p or {}).get("qui", "")).strip()
        champs = dict((p or {}).get("data") or {})
        code, err = self._verifier_parc(qui, lid, "admin", creation=True)
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err
        try:
            out = self._registre().creer(lid, champs)
        except ErreurRegistre as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "parc_creer",
                            "qui": qui, "logement_id": lid,
                            "reponse": out})
        return 201, dict(out, qui=qui)

    def parc_modifier(self, lid, p):
        """PUT /parc/logements/{id} — super_admin/admin seuls."""
        qui = str((p or {}).get("qui", "")).strip()
        champs = dict((p or {}).get("data") or {})
        code, err = self._verifier_parc(qui, lid, "admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err
        try:
            out = self._registre().modifier(lid, champs)
        except ErreurRegistre as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "parc_modifier",
                            "qui": qui, "logement_id": lid,
                            "reponse": out})
        return 200, dict(out, qui=qui)

    def parc_archiver(self, lid, p):
        """POST /parc/logements/{id}/archiver — super_admin SEUL, motif exigé.
        Jamais de purge dure (§6bis) : on marque `statut: archive`."""
        qui = str((p or {}).get("qui", "")).strip()
        motif = str((p or {}).get("motif", "")).strip()
        if not motif:
            self._m["ecritures_refusees"] += 1
            return 400, {"erreur": "motif d'archivage obligatoire",
                         "qui": qui}
        code, err = self._verifier_parc(qui, lid, "super_admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err
        try:
            out = self._registre().archiver(lid, motif, qui)
        except ErreurRegistre as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "parc_archiver",
                            "qui": qui, "logement_id": lid, "motif": motif})
        return 200, dict(out, qui=qui)

    def parc_config_generale(self, p):
        """POST /parc/config-generale — 1 POST, N logements, dry-run d'abord.

        `dry_run: true` = on REND le diff sans écrire (le client ré-affiche et
        confirme). `dry_run: false` = on applique + snapshot horodaté. Jamais
        d'écriture sans confirmation : la config touchant N logements, une
        faute de frappe ne doit pas se propager silencieusement."""
        qui = str((p or {}).get("qui", "")).strip()
        cible = p or {}
        logements = [str(x).strip() for x in (cible.get("logements") or [])
                     if str(x).strip()]
        champs = dict(cible.get("data") or {})
        dry = cible.get("dry_run", True)
        dry = True if dry is None else bool(dry)
        out = {"qui": qui, "logements": logements, "dry_run": dry,
               "modifies": [], "ignores": [], "lecture_seule": dry}
        if not champs:
            return 400, dict(out, erreur="data vide : aucune cle a appliquer")
        if not logements:
            return 400, dict(out, erreur="aucun logement cible")
        # RBAC PAR LOGEMENT : un opérateur limité à log1 ne peut pas balayer
        # « tout le parc ». On vérifie AVANT d'écrire, pour chaque cible, et on
        # refuse tout le lot si une seule est hors de son périmètre (pas de
        # demi-application silencieuse).
        for lid in logements:
            code, err = self._verifier_parc(qui, lid, "admin")
            if code:
                self._m["ecritures_refusees"] += 1
                self._journal_parc({"ts": utcnow_iso(),
                                    "quoi": "parc_config_generale_refuse",
                                    "qui": qui, "logement_id": lid,
                                    "erreur": err.get("erreur")})
                return code, dict(out, erreur=err.get("erreur"),
                                  logement_refuse=lid)
        r = self._registre()
        for lid in logements:
            try:
                res = r.modifier(lid, champs)
            except ErreurRegistre as e:
                out["ignores"].append({"logement_id": lid,
                                       "erreur": e.message})
                continue
            out["modifies"].append({"logement_id": lid,
                                    "modifies": res["modifies"],
                                    "snapshot": res["snapshot"]})
        self._journal_parc({"ts": utcnow_iso(), "quoi": "parc_config_generale",
                            "qui": qui, "dry_run": dry, "nb": len(
                                out["modifies"]),
                            "reponse": out})
        return (200 if dry else 201), dict(out)

    def parc_rollback(self, p):
        """POST /parc/rollback — restaure un snapshot horodaté (super_admin)."""
        qui = str((p or {}).get("qui", "")).strip()
        nom = str((p or {}).get("snapshot", "")).strip()
        code, err = self._verifier_parc(qui, "", "super_admin")
        if code:
            return code, err
        if not nom:
            return 400, {"erreur": "snapshot requis", "qui": qui}
        try:
            out = self._registre().rollback(nom)
        except ErreurRegistre as e:
            return e.code, {"erreur": e.message, "qui": qui}
        self._journal_parc({"ts": utcnow_iso(), "quoi": "parc_rollback",
                            "qui": qui, "snapshot": nom})
        return 200, dict(out, qui=qui)

    def parc_snapshots(self):
        try:
            noms = self._registre().snapshots()
        except ErreurRegistre as e:
            return 503, {"erreur": e.message}
        return 200, {"snapshots": noms}

    # ------------------------------------------------------------------ #
    # §6bis-b — fiches annonce OTA (centralisées, publication MANUELLE)     #
    # ------------------------------------------------------------------ #
    # §6bis-c — vue biens fusionnée (inventaire + stocks, LECTURE SEULE)     #
    # ------------------------------------------------------------------ #
    def biens_parc(self, entite=None, mode=None):
        """Agrégat inventaire `/stats` + `/alertes` et stocks `/alertes`.

        Même discipline que G1 : un moteur muet ne fait jamais disparaître la
        ligne, il est marqué `stale` avec ses `erreurs[]`. Un logement sans
        inventaire (flag `inventaire_biens: off`) est une information, pas une
        panne : on le dit explicitement plutôt que de renvoyer une liste vide
        qui ressemblerait à « 0 problème »."""
        cibles = [(b, l.get("id")) for b in self.boxes
                  for l in b.get("logements", []) if l.get("id")]

        def un(b, lid):
            box_id = b.get("box_id")
            u = b.get("endpoints", {}) or {}
            inv, sto = u.get("inventaire", ""), u.get("stocks", "")
            out = {"box_id": box_id, "logement_id": lid, "erreurs": []}
            # Endpoint absent du registre = CAUSE de l'echec, jamais `stats:0`
            # (qui ressemble a une panne moteur alors que c'est un trou de
            # configuration). Constaté le 2026-10-10 : `inventaire`/`stocks`
            # manquaient dans boxes.yaml, le fan-out avalait l'exception et la
            # vue biens affichait des lignes VIDUES sans rien dire.
            if not inv:
                out["erreurs"].append("inventaire: endpoint absent du registre")
                out["endpoints_manquants"] = True
                return out
            if not sto:
                out["erreurs"].append("stocks: endpoint absent du registre")
                out["endpoints_manquants"] = True
            code, stats = appeler("GET", inv + "/stats",
                                      {"logement_id": lid},
                                      timeout=self.cfg.get("fanout_timeout_s", 8))
            if code != 200 or not isinstance(stats, dict):
                # 503 + code metier = inventaire DESACTIVE pour ce logement :
                # une information, pas une panne.
                if code == 503 and isinstance(stats, dict) \
                        and stats.get("code") == "inventaire_off":
                    out["inventaire_off"] = True
                    out["erreurs"].append("inventaire_off")
                else:
                    out["erreurs"].append(f"stats:{code}")
            elif stats.get("ok") is False:
                # moteur joignable mais inventaire désactivé pour ce logement
                out["inventaire_off"] = True
                out["erreurs"].append("inventaire_off")
            else:
                out["stats"] = {k: stats.get(k) for k in
                                ("nb_biens", "age_moyen_j", "rotations_sejour",
                                 "budget_previsionnel_an")}
            code, al = appeler("GET", inv + "/alertes",
                                   {"logement_id": lid},
                                   timeout=self.cfg.get("fanout_timeout_s", 8))
            if code != 200 or not isinstance(al, dict):
                if code == 503 and isinstance(al, dict) \
                        and al.get("code") == "inventaire_off":
                    out["inventaire_off"] = True
                else:
                    out["erreurs"].append(f"alertes:{code}")
            elif al.get("ok") is False:
                out["inventaire_off"] = True
            else:
                out["alertes"] = {k: al.get(k) for k in
                                  ("dormants", "remplacements", "garanties")}
            code, co = appeler("GET", sto + "/alertes",
                                   {"logement_id": lid},
                                   timeout=self.cfg.get("fanout_timeout_s", 8))
            if code == 200 and isinstance(co, dict) and co.get("ok"):
                out["courses"] = {k: co.get(k) for k in
                                  ("ruptures", "bas", "total_articles",
                                   "notif_hebdo")}
            elif code != 200:
                out["erreurs"].append(f"courses:{code}")
            out["nb_problemes"] = (len((out.get("alertes") or {}).get(
                "dormants") or []) + len((out.get("alertes") or {}).get(
                "remplacements") or []) + len((out.get("alertes") or {}).get(
                "garanties") or []) + len((out.get("courses") or {}).get(
                "ruptures") or []))
            return out

        lignes = []
        if cibles:
            with ThreadPoolExecutor(max_workers=self.workers) as ex:
                futs = [ex.submit(un, b, lid) for b, lid in cibles]
                for fut in as_completed(futs):
                    try:
                        lignes.append(fut.result())
                    except Exception as e:                    # pragma: no cover
                        lignes.append({"erreurs": ["exception:" + str(e)[:60]]})
        lignes.sort(key=lambda l: (l.get("box_id", ""), l.get("logement_id", "")))
        out = {"generated_at": utcnow_iso(), "lecture_seule": True,
               "logements": lignes,
               "total_problemes": sum(l.get("nb_problemes", 0) for l in lignes),
               "seuils": {"dormants_j": 90, "garanties_j": 30}}
        # §3bis : filtre entité/mode (les écartés sont comptés, jamais tus).
        if entite or mode:
            try:
                out["logements"], out["filtres"] = \
                    self.filtrer_logements(lignes, entite, mode)
            except (ErreurListe, ErreurRegistre):
                out["filtres"] = {"entite_id": entite, "mode": mode,
                                  "erreur": "registre mandats indisponible"}
        return out

    def transfert_dossier(self, qr, de, vers):
        """Dossier de transfert d'un bien d'un logement à un autre (§6bis-c).

        Lit la fiche sur `de` et vérifie qu'elle n'existe pas déjà sur `vers`.
        AUCUNE écriture ici : on prépare, on n'exécute pas."""
        cibles = {(b.get("box_id"), l.get("id")): b
                  for b in self.boxes
                  for l in b.get("logements", []) if l.get("id")}
        if not qr:
            return 400, {"erreur": "qr requis"}
        if de == vers:
            return 400, {"erreur": "source et destination identiques"}
        depart = next(((bx, lid) for (bx, lid) in cibles if lid == de), None)
        arrivee = next(((bx, lid) for (bx, lid) in cibles if lid == vers), None)
        if depart is None:
            return 404, {"erreur": "logement source inconnu : " + str(de)}
        if arrivee is None:
            return 404, {"erreur": "logement destination inconnu : " + str(vers)}

        def lire(box, lid):
            u = box.get("endpoints", {}) or {}
            return appeler("GET", u.get("inventaire", "") + "/bien",
                               {"logement_id": lid, "qr": qr},
                               timeout=self.cfg.get("fanout_timeout_s", 8))

        code, src = lire(cibles[depart], depart[1])
        if code != 200 or not isinstance(src, dict) or src.get("ok") is False:
            return (404 if code == 404 else code), {
                "erreur": ("bien introuvable sur la source (inventaire off ?)"
                           if code == 503 else
                           f"bien {qr} illisible sur {de} : HTTP {code}"),
                "qr": qr, "de": de}
        bien = src.get("bien") or {}
        code, dest = lire(cibles[arrivee], arrivee[1])
        if code == 200 and isinstance(dest, dict) and dest.get("ok"):
            return 409, {"erreur": f"bien {qr} déjà présent sur {vers} "
                                   "(aucun écrasement)", "qr": qr}
        # Ce que le moteur NE laisse PAS recopier : les compteurs sont
        # protégés contre la décrémentation via /bien, donc une fiche créée sur
        # la destination repart de 0. On le dit au lieu de le cacher.
        return 200, {
            "qr": qr, "de": de, "vers": vers, "bien": bien,
            "recopie": {k: bien.get(k) for k in
                        ("categorie", "label", "date_achat", "prix_achat",
                         "fournisseur", "garantie_fin",
                         "derniere_utilisation", "photo", "etat")},
            "perdus": {k: bien.get(k) for k in
                       ("lavages_nb", "utilisations_nb")},
            "avertissements": [
                "les compteurs lavages_nb / utilisations_nb repartent à 0 sur "
                "la destination : le moteur les protège contre toute "
                "décrémentation via /bien",
                "la fiche SOURCE n'est pas supprimée (aucun endpoint moteur de "
                "sortie) : le retrait physique et la clôture du transfert "
                "restent un geste humain côté source",
            ],
            "suite": "POST /parc/biens/transfert avec confirmer: true pour "
                     "créer la fiche sur la destination, puis retrait manuel "
                     "sur la source (inventaire.POST /etat ou sortie physique)",
            "lecture_seule": True}

    def transfert(self, qr, de, vers, p):
        """POST /parc/biens/transfert — création de la fiche sur `vers`.

        Humain seul (`qui` injecté par la gateway), tracé au journal, `ref`
        obligatoire. `dry_run: true` (défaut) = dossier sans rien écrire."""
        qui = str((p or {}).get("qui", "")).strip()
        ref = str((p or {}).get("ref", "")).strip()
        confirme = bool((p or {}).get("confirmer"))
        # `confirmer: true` DEMANDE l'écriture : il implique dry_run false. Un
        # `dry_run: true` explicite gagne toujours (on regarde sans écrire). Le
        # défaut historique (`dry_run` à True même avec `confirmer`) faisait
        # passer un POST confirmé pour un dry-run silencieux — le geste humain
        # croyait avoir transféré, rien n'avait bougé.
        dry = bool((p or {}).get("dry_run", not confirme))
        code, dossier = self.transfert_dossier(qr, de, vers)
        if code != 200:
            return code, dossier
        if dry or not confirme:
            return 200, dict(dossier, dry_run=True, qui=qui)
        if not ref:
            return 400, {"erreur": "ref obligatoire (geste humain, tracé)",
                         "dossier": dossier, "qui": qui}
        dcode, erreur = self._verifier_parc(qui, de, "admin")
        if dcode:
            self._m["ecritures_refusees"] += 1
            return dcode, dict(erreur, dossier=dossier)
        vcode, erreur = self._verifier_parc(qui, vers, "admin")
        if vcode:
            self._m["ecritures_refusees"] += 1
            return vcode, dict(erreur, dossier=dossier)
        box = next((b for b in self.boxes
                    for l in b.get("logements", [])
                    if l.get("id") == vers), None)
        u = (box or {}).get("endpoints", {}) or {}
        # `qr` DOIT être renvoyé : `recopie` n'en porte pas (c'est la clé
        # d'identité du bien, pas un champ de fiche). Sans lui le moteur répond
        # 400 « qr invalide (slug seul) » et rien n'est créé côté destination.
        payload = dict(dossier.get("recopie") or {}, qr=qr,
                       logement_id=vers, qui=self.qui, ref=ref)
        code, rep = appeler("POST", u.get("inventaire", "") + "/bien",
                                None, payload=payload)
        if code not in (200, 201):
            self._m["ecritures_refusees"] += 1
            return code, {"erreur": f"moteur inventaire HTTP {code}",
                          "reponse": rep, "dossier": dossier, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "bien_transfert",
                            "qui": qui, "ref": ref, "qr": qr,
                            "de": de, "vers": vers,
                            "compteurs_perdus": dossier.get("perdus"),
                            "reponse": rep})
        return (201 if code == 201 else 200), dict(
            dossier, dry_run=False, ref=ref, cree=code == 201, qui=qui,
            statut="fiche creee sur " + str(vers)
                   + " ; retrait manuel sur " + str(de) + " restant")

    # ------------------------------------------------------------------ #
    def annonces_lister(self):
        """Lecture seule des fiches annonce (titre, descriptions, photos…)."""
        r = self._registre_annonces()
        return {"generated_at": utcnow_iso(), "annonces": r.lister(),
                "lecture_seule": True,
                "statuts": ann.STATUTS}

    def annonce_lire(self, lid):
        r = self._registre_annonces()
        return {"logement_id": lid, "annonce": r.lire(lid),
                "lecture_seule": True}

    def annonce_definir(self, lid, p):
        """PUT /parc/annonces/{id} — crée ou met à jour la fiche (upsert).

        `statut` n'est PAS modifiable ici : le cycle de vie passe par
        `/publier` et `/marquer-publie` (jamais d'écriture OTA auto)."""
        qui = str((p or {}).get("qui", "")).strip()
        champs = dict((p or {}).get("data") or {})
        code, err = self._verifier_parc(qui, lid, "admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, dict(err)
        try:
            out = self._registre_annonces().definir(lid, champs)
        except (ErreurAnnonces, ErreurRegistre) as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "annonce_definir",
                            "qui": qui, "logement_id": lid,
                            "reponse": out})
        return (201 if out.get("cree") else 200), dict(out, qui=qui)

    def _mentions_moteur(self, lid, box_id):
        """Mentions légales obligatoires lues sur decision (lecture seule).

        Rend `(obj, erreur)` : `obj` = la réponse moteur (ou `None` si muet),
        `erreur` = pourquoi elle est muette. Moteur muet ne bloque PAS la
        publication (la liste des manquantes reste vide), mais la cause est
        **visible** dans le dossier — l'avaler en silence ferait croire que la
        checklist est complète alors qu'aucun moteur n'a été interrogé."""
        box = next((b for b in self.boxes if b.get("box_id") == box_id), None)
        url = ((box or {}).get("endpoints", {}) or {}).get("decision", "")
        if not url:
            return None, "decision: pas d'endpoint pour " + str(box_id)
        try:
            code, obj = appeler("GET", url + "/mentions-annonce",
                                {"logement_id": lid},
                                timeout=self.cfg.get("fanout_timeout_s", 8))
        except Exception as e:
            return None, "decision: " + str(e)[:80]
        if code == 200 and isinstance(obj, dict):
            return obj, None
        return None, f"decision: HTTP {code}"

    def annonce_publier(self, lid, p):
        """POST /parc/annonces/{id}/publier — prépare le dossier de publication.

        Deux temps, jamais d'OTA auto :
          `dry_run: true` (défaut)  → on REND le dossier + la checklist, on
                                      n'écrit rien ;
          `dry_run: false` + `confirmer: true` → la fiche passe `brouillon →
              pret` (prête à publier) — la publication réelle sur le portail
              reste un geste HUMAIN, consacré par `/marquer-publie`.
        """
        qui = str((p or {}).get("qui", "")).strip()
        confirme = bool((p or {}).get("confirmer"))
        dry = (p or {}).get("dry_run", True)
        dry = True if dry is None else bool(dry)
        r = self._registre_annonces()
        try:
            annonce = r.lire(lid)
        except (ErreurAnnonces, ErreurRegistre) as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        box_id = ""
        for b in self.boxes:
            if any(l.get("id") == lid for l in b.get("logements", [])):
                box_id = b.get("box_id", "")
                break
        mentions, err_mentions = self._mentions_moteur(lid, box_id)
        chk = ann.checklist(annonce, mentions)
        dossier = {"logement_id": lid, "qui": qui,
                   "titre": annonce.get("titre"),
                   "langues": sorted((annonce.get("descriptions") or {}).keys()),
                   "photos": len(annonce.get("photos") or []),
                   "canaux": chk["canaux"],
                   "bloquants": chk["bloquants"], "rappels": chk["rappels"],
                   "publiable": chk["publiable"],
                   "mentions": (mentions or {}).get("manquantes", []),
                   "mentions_lues": mentions is not None,
                   "mentions_erreur": err_mentions,
                   "note": "dossier de préparation — la publication reste un "
                           "geste humain sur le portail"}
        if dry or not confirme:
            return 200, dict(dossier, dry_run=True, lecture_seule=True,
                             statut=annonce.get("statut"))
        # --- application : brouillon → pret (jamais au-delà sans humain) --- #
        code, err = self._verifier_parc(qui, lid, "admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, dict(err, dossier=dossier)
        if not chk["publiable"]:
            self._m["ecritures_refusees"] += 1
            return 409, {"erreur": "publication impossible : "
                                   + "; ".join(chk["bloquants"]),
                         "dossier": dossier, "qui": qui}
        try:
            out = r.changer_statut(lid, "pret", qui)
        except (ErreurAnnonces, ErreurRegistre) as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "annonce_prete",
                            "qui": qui, "logement_id": lid,
                            "bloquants": chk["bloquants"]})
        return 201, dict(dossier, dry_run=False, statut=out.get("statut"),
                         snapshot=out.get("snapshot"), qui=qui)

    def annonce_marquer_publie(self, lid, p):
        """POST /parc/annonces/{id}/marquer-publie — le HUMAIN déclare avoir
        publié (canaux + preuve). `pret → publie_manuel` uniquement."""
        qui = str((p or {}).get("qui", "")).strip()
        canaux = [str(c).strip().lower()
                  for c in ((p or {}).get("canaux") or []) if str(c).strip()]
        preuve = str((p or {}).get("preuve", "")).strip()
        if not canaux:
            return 400, {"erreur": "canaux[] requis (publication manuelle, "
                                   "traçable)", "qui": qui}
        inconnus = [c for c in canaux if c not in ann.CANAUX]
        if inconnus:
            return 400, {"erreur": "canaux inconnus : " + ", ".join(inconnus),
                         "canaux_connus": list(ann.CANAUX), "qui": qui}
        code, err = self._verifier_parc(qui, lid, "admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, dict(err)
        try:
            out = self._registre_annonces().changer_statut(
                lid, "publie_manuel", qui, canaux=canaux, preuve=preuve)
        except (ErreurAnnonces, ErreurRegistre) as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "annonce_publiee",
                            "qui": qui, "logement_id": lid, "canaux": canaux,
                            "preuve": preuve[:80]})
        return 200, dict(out, qui=qui)

    def annonce_synchroniser(self, lid, p):
        """POST /parc/annonces/{id}/synchroniser — `publie_manuel → synchronise`.

        En v1 il n'y a PAS de channel manager 2-voies (§6bis, réalisme octobre
        2026) : ce endpoint enregistre qu'un connecteur agréé (ou un humain) a
        synchronisé la fiche. Il n'appelle AUCUNE API OTA."""
        qui = str((p or {}).get("qui", "")).strip()
        code, err = self._verifier_parc(qui, lid, "admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, dict(err)
        try:
            out = self._registre_annonces().changer_statut(lid, "synchronise",
                                                           qui)
        except (ErreurAnnonces, ErreurRegistre) as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "annonce_synchronisee",
                            "qui": qui, "logement_id": lid})
        return 200, dict(out, qui=qui)

    def annonce_archiver(self, lid, p):
        """Archivage DOUX d'une fiche (super_admin seul + motif, §6bis-b)."""
        qui = str((p or {}).get("qui", "")).strip()
        motif = str((p or {}).get("motif", "")).strip()
        if not motif:
            return 400, {"erreur": "motif obligatoire (archivage tracé)",
                         "qui": qui}
        code, err = self._verifier_parc(qui, lid, "super_admin")
        if code:
            self._m["ecritures_refusees"] += 1
            return code, dict(err)
        try:
            out = self._registre_annonces().supprimer(lid, qui)
        except (ErreurAnnonces, ErreurRegistre) as e:
            self._m["ecritures_refusees"] += 1
            return e.code, {"erreur": e.message, "qui": qui}
        self._m["ecritures"] += 1
        self._journal_parc({"ts": utcnow_iso(), "quoi": "annonce_archivee",
                            "qui": qui, "logement_id": lid, "motif": motif})
        return 200, dict(out, motif=motif, qui=qui)

    def export_ota(self, jours=30, debut=None, entite=None, mode=None):
        """GET /export-ota — export STANDARDISÉ, LECTURE SEULE (§6bis-b).

        Calendrier + tarifs + descriptions, prêt pour un channel manager agréé
        le jour où le parc dépasse ~10 unités. Aucune écriture OTA ici : on
        EXPORTE, on ne pousse pas. Quand `pricing-engine` ou `ics-sync` est
        muet, la section concernée est absente (pas de valeur inventée)."""
        cal = self.calendrier_parc(debut=debut or None,
                                   jours=jours or None) or {}
        tarifs = self.etat_parc() or {}
        r = self._registre_annonces()
        annonces = {a.get("logement_id"): a for a in r.lister()}
        prix_par_logt = {}
        for lg in (tarifs.get("logements") or []):
            if isinstance(lg, dict) and lg.get("logement_id"):
                bornes = lg.get("bornes_prix") or []
                prix_par_logt[lg["logement_id"]] = {
                    "bornes_prix": bornes,
                    "prix_min": bornes[0] if bornes else None,
                    "prix_max": bornes[1] if len(bornes) > 1 else None,
                    "copro_verifiee": lg.get("copro_verifiee"),
                    "stale": lg.get("stale")}
        sortie = []
        for ligne in (cal.get("logements") or []):
            lid = ligne.get("logement_id")
            if not lid:
                continue
            a = annonces.get(lid)
            sortie.append({
                "logement_id": lid,
                "titre": (a or {}).get("titre"),
                "descriptions": (a or {}).get("descriptions") or {},
                "langues": sorted(((a or {}).get("descriptions") or {}).keys()),
                "equipements": (a or {}).get("equipements") or [],
                "regles": (a or {}).get("regles") or {},
                "geoloc": (a or {}).get("geoloc") or {},
                "statut_annonce": (a or {}).get("statut", "sans_fiche"),
                "tarifs": prix_par_logt.get(lid),
                "calendrier": [{"jour": c.get("jour"),
                                "disponible": c.get("disponible")}
                               for c in (ligne.get("jours") or [])],
                "erreurs": ligne.get("erreurs") or []})
        out = {"generated_at": utcnow_iso(), "lecture_seule": True,
               "jours": cal.get("jours", 30),
               "note": "export lecture seule — aucune écriture OTA "
                       "(channel manager agréé attendu au-delà de ~10 unités)",
               "logements": sortie}
        # §3bis : un export par entité/mode se limite aux logements concernés,
        # avec l'entité PORtée sur chaque ligne pour que le connecteur agréé
        # sache de quel SIREN il parle.
        if entite or mode:
            sortie, filtre = self.filtrer_logements(sortie, entite, mode)
            mandats = self.rattachements()
            for ligne in sortie:
                m = mandats.get(str(ligne.get("logement_id") or "")) or {}
                ligne["entite_id"] = m.get("entite_id")
                ligne["mode"] = m.get("mode")
            out["logements"] = sortie
            out["filtres"] = filtre
        else:
            mandats = self.rattachements()
            for ligne in sortie:
                m = mandats.get(str(ligne.get("logement_id") or "")) or {}
                ligne["entite_id"] = m.get("entite_id")
                ligne["mode"] = m.get("mode")
        return out

    def _normaliser(self, action, data):
        """Formulaire HTML (sans JS) -> types attendus par le moteur.

        `data` est modifié sur place. Retourne (None, None) si tout va, ou
        (400, {"erreur": ...}) si la saisie n'a pas la forme attendue. Aucune
        règle métier ici : pas de prix, pas de borne, pas de décision."""
        for champ, (genre, arg) in (CHAMPS_NORMALISER.get(action) or {}).items():
            if champ not in data:
                continue
            brut = data.get(champ)
            if genre == "bool":
                data[champ] = str(brut).strip().lower() in (
                    "1", "true", "oui", "o", "on", "yes")
            elif genre == "enum":
                if brute_enum := str(brut).strip():
                    if brute_enum not in arg:
                        return 400, {"erreur": f"{champ} doit etre l'un de : "
                                               + ", ".join(arg),
                                     "action": action}
                    data[champ] = brute_enum
            elif genre == "liste":
                items = []
                for morceau in str(brut).split(","):
                    morceau = morceau.strip()
                    if not morceau:
                        continue
                    parties = [x.strip() for x in morceau.split(":")]
                    try:
                        items.append(dict(zip(arg, [parties[0],
                                                    int(parties[1])])))
                    except (IndexError, ValueError):
                        return 400, {
                            "erreur": f"{champ} : format attendu "
                                      "'id:qte,id:qte' (ex. "
                                      "'linge-lit:1,parking:2')",
                            "action": action}
                data[champ] = items
        return None, None

    def action(self, p):
        """POST /v1/action — écriture 1-tap humaine, allowlist + préconditions.
        Retourne (code, enveloppe). Jamais de décision : on relaie, on trace."""
        box_id = str((p or {}).get("box_id", "")).strip()
        action = str((p or {}).get("action", "")).strip()
        logement_id = str((p or {}).get("logement_id", "")).strip()
        qui = str((p or {}).get("qui", "")).strip()
        ref = str((p or {}).get("ref", "")).strip()

        # 1. action dans l'allowlist fermée (§6)
        if action not in CIBLES:
            self._m["ecritures_refusees"] += 1
            return 403, {"erreur": f"action non autorisee: {action}",
                         "autorisees": sorted(CIBLES), "qui": qui, "ref": ref}

        # 2. périmètre box + logement (avant toute lecture d'acces)
        box = next((b for b in self.boxes if b.get("box_id") == box_id), None)
        if not box:
            self._m["ecritures_refusees"] += 1
            return 404, {"erreur": f"box inconnue: {box_id}", "qui": qui,
                         "ref": ref}
        ids = [l.get("id") for l in box.get("logements", [])]
        if logement_id not in ids:
            self._m["ecritures_refusees"] += 1
            return 404, {"erreur": f"logement inconnu: {logement_id} "
                                   f"(box {box_id})", "qui": qui, "ref": ref}

        # 3. RBAC : humain, connu, non révoqué, périmètre, rôle (§4 + P6-20)
        code, err = self._verifier_qui(qui, logement_id, action)
        if code:
            self._m["ecritures_refusees"] += 1
            return code, err

        # 4. préconditions (§6) — l'autorité reste le moteur, on vérifie avant
        copro = self._copro_verifiee(box, logement_id)
        if action in ("resa", "confirmer", "prix") and copro is False:
            self._m["ecritures_refusees"] += 1
            return 403, {"erreur": "BLOQUE copro.verifiee=false : mise en "
                                   "ligne interdite (regenerer docs §12.1)",
                         "qui": qui, "ref": ref, "logement_id": logement_id}
        data = dict((p or {}).get("data") or {})
        data.pop("qui", None)               # jamais d'usurpation d'identité
        data["logement_id"] = logement_id
        data["qui"] = qui
        if ref:
            data.setdefault("ref", ref)
        manquants = [c for c in CHAMPS_REQUIS.get(action, ())
                     if data.get(c) in (None, "", [])]
        if action in ("resa", "confirmer") and not ref:
            manquants.append("ref (idempotence)")
        if manquants:
            self._m["ecritures_refusees"] += 1
            return 400, {"erreur": "champs obligatoires manquants : "
                                   + ", ".join(manquants),
                         "qui": qui, "action": action, "ref": ref}
        if action in ("prix",):
            try:
                float(data.get("prix"))
            except (TypeError, ValueError):
                self._m["ecritures_refusees"] += 1
                return 400, {"erreur": "prix numerique obligatoire",
                             "qui": qui, "ref": ref}
        if action == "debiter":
            if not isinstance(data.get("justificatifs"), list) \
                    or not data.get("justificatifs"):
                self._m["ecritures_refusees"] += 1
                return 400, {"erreur": "justificatifs[] obligatoires (debit "
                                       "caution = 1-tap humaine, jamais auto)",
                             "qui": qui, "ref": ref}
        if action in ("payout", "cloture_compta", "debiter"):
            try:
                float(data.get("montant"))
            except (TypeError, ValueError):
                self._m["ecritures_refusees"] += 1
                return 400, {"erreur": "montant numerique obligatoire",
                             "qui": qui, "ref": ref}

        # 4bis. normalisation des champs de formulaire (aucune règle métier ;
        #       le moteur reste seul juge de la validité de ce qu'on lui envoie)
        code, erreur = self._normaliser(action, data)
        if code:
            self._m["ecritures_refusees"] += 1
            return code, dict(erreur, qui=qui, ref=ref)

        # 5. idempotence (ref = fenêtre 24 h, rejeu = réponse identique §16.3)
        cle = f"{box_id}|{action}|{ref}"
        if ref:
            avant = self._idempotence_lire(cle)
            if avant:
                avant["enveloppe"]["idempotent"] = True
                self._m["ecritures"] += 1
                return 200, avant["enveloppe"]

        # 6. relai réel (aucune décision gateway : bornes, motifs, preuves,
        #    copro sont revérifiés par le moteur — on ne masque jamais son code)
        moteur, chemin, methode = CIBLES[action]
        url = (box.get("endpoints", {}) or {}).get(moteur, "") + chemin
        code, reponse = appeler(methode, url, None,
                                data, timeout=self.cfg.get(
                                    "fanout_timeout_s", 8))
        enveloppe = {"box_id": box_id, "logement_id": logement_id,
                     "action": action, "qui": qui, "ref": ref,
                     "moteur": moteur, "moteur_code": code,
                     "reponse": reponse, "idempotent": False,
                     "ts": utcnow_iso()}
        self._journal_parc({"ts": enveloppe["ts"], "box_id": box_id,
                            "logement_id": logement_id, "action": action,
                            "qui": qui, "ref": ref, "moteur": moteur,
                            "moteur_code": code, "relaye_par": self.qui})
        if 200 <= code < 300 and ref:
            self._idempotence_ecrire(cle, enveloppe)
        self._m["ecritures"] += 1
        return 200, enveloppe

    def ids_logements(self):
        return [l.get("id") for b in self.boxes for l in b.get("logements", [])]

    # -- calendrier centralisé du parc (G2+++ / plan §6) --------------------- #
    # ics-sync (`:8090`) n'expose qu'un contrôle de conflit PAR PLAGE
    # (`/dispo?logement_id=&debut=&fin=`). Un calendrier se lit jour par jour :
    # on appelle donc `/dispo` par (logement, jour), en fan-out parallèle, dans
    # un cache mémoire TTL. Borné : `JOURS_MAX` sinon un parc à 20 logements ×
    # 1 an = 7 300 appels, ce qui ne serait plus un calendrier mais un DoS sur
    # les boxes. Le nombre d'appels et la durée sont exposés : mesurable, pas
    # magique.
    JOURS_MAX = 62

    def _cal_jour(self, box, logement_id, jour, timeout=None):
        """1 jour : `{jour, disponible, conflit_ref?, erreur?}` (cache TTL).

        Timeout court par défaut (`cal_timeout_s`, 2 s) : la page doit rester
        rapide même si ics-sync d'une box est muet — sinon 14 jours × 8 s."""
        cle = (box.get("box_id"), logement_id, jour)
        entree = self.cal_cache.get(cle)
        if entree and time.time() - entree["ts"] < self.ttl:
            return entree["rep"]
        u = box.get("endpoints", {}) or {}
        url = u.get("ics", "")
        if not url:
            rep = {"jour": jour, "erreur": "endpoint ics absent"}
        else:
            lendemain = (dt.date.fromisoformat(jour) + dt.timedelta(days=1))
            code, rep = appeler("GET", url + "/dispo",
                                {"logement_id": logement_id, "debut": jour,
                                 "fin": lendemain.isoformat()},
                                timeout=timeout or self.cfg.get(
                                    "cal_timeout_s", 2))
            if code != 200 or not isinstance(rep, dict):
                rep = {"jour": jour, "erreur": f"ics:{code}"}
            else:
                rep = {"jour": jour, "disponible": bool(rep.get("disponible")),
                       "conflit_ref": rep.get("conflit_ref")}
        self.cal_cache[cle] = {"ts": time.time(), "rep": rep}
        return rep

    # Marqueurs du calendrier (constants : un seul point de définition).
    CAL_OCCUPE = "\u25cf"          # ●
    CAL_LIBRE = "\u25cb"           # ○
    CAL_INCONNU = "?"

    def _cal_compacte(self):
        """Ligne de jours pour la page (7 prochains jours, 1 batch parallèle).

        ● = occupé, ○ = libre, ? = injoignable. Aucun prix, aucune écriture :
        un calendrier ne vend rien (plan §6)."""
        try:
            cal = self.calendrier_parc(jours=self.cfg.get("cal_jours_page", 7))
        except Exception:
            return ""
        lignes = ["<table class='cal'><tr><th></th>"]
        j0 = dt.date.fromisoformat(cal["debut"])
        for i in range(cal["jours"]):
            d = j0 + dt.timedelta(days=i)
            lignes.append(f"<th>{d.day:02d}</th>")
        lignes.append("</tr>")
        for l in cal.get("logements", []):
            lignes.append(f"<tr><td>{html.escape(str(l.get('nom')))}</td>")
            for c in l.get("jours", []):
                if c.get("erreur"):
                    lignes.append("<td class='non' data-etat='inconnu'>"
                                  + self.CAL_INCONNU + "</td>")
                elif c.get("disponible"):
                    lignes.append("<td class='oui' data-etat='libre'>"
                                  + self.CAL_LIBRE + "</td>")
                else:
                    lignes.append("<td class='non' data-etat='occupe'>"
                                  + self.CAL_OCCUPE + "</td>")
            lignes.append("</tr>")
        lignes.append("</table>")
        return "".join(lignes)

    def calendrier_parc(self, debut=None, jours=None, force=False,
                        entite=None, mode=None):
        """Grille jour × logement (lecture seule, jamais d'écriture).

        `force` vide le cache calendrier avant recalcul (TTL 90 s sinon)."""
        if force:
            self.cal_cache = {}
        # `jours` absent, vide, `0` ou négatif = même chose : le défaut 30. Un
        # `jours=0` doit donner 30 cases (et pas 1 = « une seule case », qui
        # ferait croire à un calendrier vide plutôt qu'à un paramètre absent).
        try:
            n = int(jours or 0)
        except (TypeError, ValueError):
            n = 30
        if n <= 0:
            n = 30
        jours = max(1, min(n, self.JOURS_MAX))
        try:
            d0 = dt.date.fromisoformat(debut) if debut else dt.date.today()
        except ValueError:
            d0 = dt.date.today()
        jours_liste = [(d0 + dt.timedelta(days=i)).isoformat()
                       for i in range(jours)]
        t0 = time.time()
        taches = [(b, l.get("id"), j)
                  for b in self.boxes
                  for l in b.get("logements", []) if l.get("id")
                  for j in jours_liste]
        resultats = {}

        def un(b, lid, j):
            return (b.get("box_id"), lid, j), self._cal_jour(b, lid, j)

        with ThreadPoolExecutor(max_workers=self.workers) as ex:
            for cle, rep in ex.map(lambda t: un(*t), taches):
                resultats[cle] = rep

        # Agrégation par logement
        logements = []
        for b in self.boxes:
            for l in b.get("logements", []):
                lid = l.get("id")
                if not lid:
                    continue
                cases, erreurs, occupes = [], 0, 0
                for j in jours_liste:
                    rep = resultats.get((b.get("box_id"), lid, j), {})
                    if rep.get("erreur"):
                        erreurs += 1
                    elif not rep.get("disponible", True):
                        occupes += 1
                    cases.append(rep)
                logements.append({
                    "box_id": b.get("box_id"), "logement_id": lid,
                    "nom": l.get("nom", lid), "jours": cases,
                    "occupes": occupes, "libres": jours - occupes - erreurs,
                    "erreurs": erreurs})
        # §3bis : filtre entité/mode, appliqué APRÈS appel moteur — on ne
        # devine pas le résultat, on le restreint, et on compte les écartés.
        filtre = None
        if entite or mode:
            try:
                logements, filtre = self.filtrer_logements(logements, entite,
                                                           mode)
            except (ErreurListe, ErreurRegistre):
                filtre = {"entite_id": entite, "mode": mode,
                          "erreur": "registre mandats indisponible"}
        out = {"generated_at": utcnow_iso(), "debut": jours_liste[0],
               "fin": jours_liste[-1], "jours": jours,
               "nb_logements": len(logements), "logements": logements,
               "appels_ics": len(taches), "duree_ms": int(
                   (time.time() - t0) * 1000),
               "lecture_seule": True,
               "note": "journalier, jamais de prix ni d'ecriture ; bornes "
                       "prix inchangees"}
        if filtre:
            out["filtres"] = filtre
        return out

    # -- page HTML de pilotage (sans JS, comme :8060) ------------------------ #
    def _humains(self):
        """Comptes HUMAINS de acces.yaml (jamais les comptes machine ni les
        profils de lecture seule) : la page ne propose que des `qui` qui
        peuvent écrire — sinon l'utilisateur choisit et le moteur refuse 403."""
        humains = []
        for cid, p in sorted(self.acces.items()):
            role, sous = p.get("role"), p.get("sous_role")
            if sous in ("dashboard",) or cid in ("passerelle_parc",
                                                 "dashboard_hote"):
                continue                      # compte machine : 403 garanti
            if role in ("proprietaire", "prestataires"):
                continue                      # lecture seule côté gateway
            humains.append((cid, f"{cid} ({sous})"))
        return humains

    def _formulaires(self, box_id, logement_id, ref_base):
        h = html.escape
        humains = self._humains()
        bloc = ["<details class='actes'><summary>Écritures 1-tap (humain "
                "uniquement — tracé au journal)</summary>",
                "<form method='post' action='/v1/action'>"]
        bloc.append("<label>Qui (obligatoire, journalisé) : "
                    "<select name='qui' required>"
                    "<option value=''>— choisir —</option>"
                    + "".join(f"<option value='{h(str(cid))}'>{h(str(lib))}"
                              "</option>" for cid, lib in humains)
                    + "</select></label>")
        for action, champs in FORMULAIRES.items():
            bloc.append(f"<fieldset><legend>{h(LIBELLES[action])}</legend>"
                        f"<input type='hidden' name='box_id' value='{h(str(box_id))}'>"
                        f"<input type='hidden' name='logement_id' value='{h(str(logement_id))}'>"
                        f"<input type='hidden' name='action' value='{h(action)}'>"
                        f"<input type='hidden' name='ref' value='{h(ref_base + '-' + action)}'>")
            for nom, label, ph in champs:
                bloc.append(f"<label>{h(label)} : <input name='{h(nom)}' "
                            f"value='{h(ph)}' size='18'></label>")
            bloc.append("<button type='submit'>Envoyer</button></fieldset>")
        bloc.append("</form><p class='note'>Bornes prix 75/290 € — un prix hors "
                    "bornes est refusé par le moteur (422), jamais masqué. Le "
                    "<code>ref</code> est figé au rendu : double-clic = rejeu "
                    "idempotent (pas de doublon).</p></details>")
        return "".join(bloc)

    def page(self, force=False):
        """Page de pilotage (HTML servi par la gateway, 0 JS, 0 secret).

        `force` (GET /?force=1) vide le cache du fan-out AVANT le rendu : sans
        lui, la page affichait les formulaires d'écriture d'après un cache
        encore « frais » alors que le moteur venait d'être coupé — constaté au
        labo (§53 : `box injoignable => ecritures desactivees` en échec). La
        page doit montrer exactement ce que le dernier fan-out a vu."""
        ap = self.apercu_parc(force=force)
        h = html.escape
        logements = ap.get("logements", [])
        ref_base = str(ap.get("generated_at", "")).replace(":", "").replace(
            "-", "").replace(".", "").replace("+", "Z").replace("T", "-")
        n_stale = sum(1 for r in logements if r.get("stale"))
        n_up = len(logements) - n_stale
        bandeau = (f"<p class='band'>{len(logements)} logement(s) · "
                   f"{n_up} joignable(s) · {n_stale} injoignable(s) — fan-out "
                   f"{ap.get('fanout_ms', 0)} ms · "
                   f"{self._m.get('ecritures', 0)} écriture(s) relayée(s) / "
                   f"{self._m.get('ecritures_refusees', 0)} refus(s)</p>")
        alertes = [(r.get("nom") or r.get("logement_id"), a)
                   for r in logements for a in (r.get("alertes") or [])]
        if alertes:
            bandeau += "<ul class='err'>" + "".join(
                f"<li><b>{h(str(nom))}</b> — {h(str(a))}</li>"
                for nom, a in alertes[:10]) + "</ul>"
        cal = self._cal_compacte()
        cartes = [bandeau]
        if cal:
            cartes.append("<section class='box'><h2>Occupation a 7 jours</h2>"
                          + cal +
                          "<p class='note'>" + self.CAL_OCCUPE + " occupe, "
                          + self.CAL_LIBRE + " libre, " + self.CAL_INCONNU
                          + " injoignable - lecture ICS, aucun prix, aucune "
                          "ecriture.</p></section>")
        for box in ap.get("boxes", []):
            lignes = []
            for r in ap.get("logements", []):
                if r.get("box_id") != box["box_id"]:
                    continue
                entete = (f"{h(str(r.get('nom', r.get('logement_id', '?'))))}"
                          f" <small>{h(str(r.get('logement_id', '')))}</small>")
                if r.get("stale"):
                    entete += " <strong>— box injoignable, données du " \
                              f"{h(str(r.get('fetched_at') or 'jamais'))}</strong>"
                prix = "".join(
                    f"<tr><td>{h(str(j[0]))}</td><td>{h(str(j[1]))} €</td></tr>"
                    for j in r.get("prix_7j", []) if isinstance(j, (list, tuple)))
                jl = "".join(
                    f"<li>{h(str(e.get('ts', '')))} — {h(str(e.get('ref', '')))}"
                    f" ({h(str(e.get('qui', '')))} : "
                    f"{h(str(e.get('quoi', '')))})</li>"
                    for e in r.get("dernieres", [])) or "<li>—</li>"
                td = "".join(
                    f"<li>{h(str(d.get('dossier', '')))} : "
                    f"{h(str(d.get('statut', '')))} (deadline "
                    f"{h(str(d.get('deadline', '')))})</li>"
                    for d in r.get("todos", [])) or "<li>—</li>"
                err = ""
                if r.get("erreurs"):
                    err = ("<p class='err'>Erreurs fan-out : "
                           + h(", ".join(str(e) for e in r["erreurs"]))
                           + "</p>")
                # Écritures offertes seulement si la box répond : écrire vers
                # une box injoignable ne peut mener qu'à une erreur moteur.
                if r.get("stale"):
                    actes = ("<p class='err'>Écritures désactivées : box "
                             "injoignable.</p>")
                else:
                    actes = self._formulaires(box["box_id"],
                                              r.get("logement_id"),
                                              f"{ref_base}-{r.get('logement_id')}")
                lignes.append(
                    f"<section class='log'><h3>{entete}</h3>"
                    f"<p>Prix direct 7 j (1er jour : "
                    f"{(h(str(r['prix_7j'][0][1])) + ' €') if r.get('prix_7j') else '—'}"
                    f" — journal : {h(str(r.get('journal_total', 0)))} entrées"
                    f" — occupation J+30 : "
                    f"{h(str((r.get('occupation') or {}).get('occ_j30', '—')))}"
                    f"</p><table><tr><th>jour</th><th>pivot</th></tr>"
                    f"{prix}</table>"
                    f"<h4>Dernières entrées journal</h4><ul>{jl}</ul>"
                    f"<h4>Ménage (todos)</h4><ul>{td}</ul>"
                    f"<p>Routage LLM : {h(str(r.get('routage_primaire', '')))}"
                    f" — HA : "
                    f"{'vivante' if r.get('ha_vivante') else 'injoignable'}"
                    f" — copro vérifiée : "
                    f"{'oui' if r.get('copro_verifiee') else 'non (BLOQUÉE)'}</p>"
                    f"{actes}{err}</section>")
            cartes.append(
                f"<section class='box'><h2>{h(str(box.get('site', '')))} — "
                f"{h(str(box['box_id']))}</h2>"
                f"<p>Dernière donnée : "
                f"{h(str(box.get('last_seen') or 'jamais'))}</p>"
                + "".join(lignes) + "</section>")
        return ("<!DOCTYPE html><html lang='fr'><head><meta charset='utf-8'>"
                "<meta http-equiv='refresh' content='120'>"
                "<title>LCD — Passerelle parc — pilotage</title>"
                "<style>body{font-family:system-ui,sans-serif;margin:1rem}"
                "table{border-collapse:collapse}td,th{border:1px solid #ccc;"
                "padding:2px 8px}.box{border:1px solid #999;padding:.5rem;"
                "margin:.5rem 0}.log{margin:.5rem 0}.err{color:#a00}"
                ".band{background:#eef;padding:.4rem;margin:.3rem 0}"
                ".cal td,.cal th{border:1px solid #999;padding:.15rem .3rem;"
                "text-align:center;font-size:.95rem}"
                ".cal td.oui{color:#070}"
                ".cal td.non{color:#a33;background:#f6e5e5}"
                ".note{font-size:.85rem;color:#555}"
                ".actes fieldset{display:inline-block;vertical-align:top;"
                "margin:.2rem;border:1px solid #bbb}"
                ".note{font-size:.85em;color:#555}</style></head><body>"
                "<h1>LCD — Passerelle parc — pilotage</h1>"
                + "".join(cartes) +
                "<p class='note'>Vues complémentaires (lecture seule) : "
                "<a href='/portail-proprio'>portail proprietaire</a> · "
                "<a href='/parc/biens'>biens &amp; stocks du parc</a> · "
                 "<a href='/parc/entites'>entites juridiques</a> · "
                 "<a href='/parc/mandats'>mandats logement / entite</a> · "
                "<a href='/parc/annonces'>fiches annonce OTA</a> · "
                "<a href='/calendrier-parc'>calendrier 62 j</a> · "
                "<a href='/export-ota?jours=62'>export OTA</a></p>"
                "<footer>Passerelle parc :8443 — affichage en "
                "<b>lecture seule</b> des moteurs (prix, journal, ménage, "
                "routage, calendrier ICS) ; les écritures partent d'ici en 1 "
                "clic humain (POST <code>/v1/action</code>, allowlist 14 "
                "actions, <code>qui</code> humain, préconditions, idempotence "
                "par <code>ref</code>, double log). Jamais serrure/vanne/"
                "portail/PIN auto, jamais d'écriture OTA auto, aucun secret "
                "affiché.</footer></body></html>")


# --------------------------------------------------------------------------- #
# HTTP
# --------------------------------------------------------------------------- #
class Handler(BaseHTTPRequestHandler):
    engine = None

    def _binaire(self, code, contenu, nom):
        """Réponse binaire (document PDF) — SANS restitution inline.

        `Content-Disposition: attachment` n'est pas une politesse : servi
        inline, un PDF s'ouvre dans l'origine du portail, et un PDF malveillant
        se retrouve alors dans le même contexte que la page qui liste l'argent.
        Le nom passe par une whitelist (guillemets et séparateurs neutralisés)
        pour ne pas pouvoir casser l'en-tête."""
        import re as _re
        sur = _re.sub(r"[^A-Za-z0-9._-]+", "_", str(nom or "document"))
        corps = bytes(contenu or b"")
        self.send_response(code)
        self.send_header("Content-Type", "application/pdf")
        self.send_header("Content-Length", str(len(corps)))
        self.send_header("Content-Disposition",
                         'attachment; filename="' + sur + '"')
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corps)

    def _json(self, code, obj):
        corps = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
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

    @staticmethod
    def _force(qs):
        return qs.get("force", ["0"])[0] in ("1", "true", "oui")

    @staticmethod
    def _filtres(qs):
        """`?entite=` / `?mode=` (§3bis) — rendus sur toutes les vues parc."""
        return (qs.get("entite", [""])[0].strip(),
                qs.get("mode", [""])[0].strip())

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        eng = self.engine
        force = self._force(qs)
        ent_f, mode_f = self._filtres(qs)
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/ready":
            ok = bool(eng.boxes) and all(
                b.get("endpoints") for b in eng.boxes)
            return self._json(200 if ok else 503,
                              {"ok": ok, "boxes": eng.resume_boxes(),
                               "erreurs": ([] if ok else
                                           "boxes.yaml sans endpoints")})
        if url.path == "/":
            return self._html(200, eng.page(force=force))
        if url.path == "/api/apercu-parc":
            return self._json(200, eng.apercu_parc(
                force=force, entite=ent_f or None, mode=mode_f or None,
                depuis=qs.get("depuis", [""])[0]))
        if url.path == "/api/apercu":
            box_id = qs.get("box_id", [""])[0]
            logement_id = qs.get("logement_id", [""])[0]
            if not (box_id and logement_id):
                return self._json(400, {"erreur": "box_id + logement_id requis"})
            box = next((b for b in eng.boxes if b.get("box_id") == box_id), None)
            if not box:
                return self._json(404, {"erreur": f"box inconnue: {box_id}"})
            ids = [l.get("id") for l in box.get("logements", [])]
            if logement_id not in ids:
                return self._json(404, {"erreur": f"logement inconnu: "
                                                   f"{logement_id}"})
            return self._json(200, eng.apercu_logement(box, logement_id,
                                                       force=force))
        if url.path == "/etat-parc":
            return self._json(200, eng.etat_parc(force=force))
        # --- G2bis-b : portail propriétaire tiers (§3bis), lecture seule ---
        if url.path == "/portail-proprio":
            return self._html(200, eng.portail_page(
                qs.get("qui", [""])[0],
                client=qs.get("client", [""])[0].strip()))
        if url.path.startswith("/parc/portail/") and \
                url.path.endswith("/pilotage"):
            lid = url.path[len("/parc/portail/"):-len("/pilotage")].strip("/")
            code, rep = eng.portail_pilotage(
                lid, qs.get("qui", [""])[0], qs.get("annee", [""])[0],
                qs.get("mois", [""])[0])
            return self._json(code, rep)
        if url.path.startswith("/parc/portail/") and "/doc/" in url.path:
            _p = url.path[len("/parc/portail/"):].split("/")
            if len(_p) == 3 and _p[1] == "doc":
                code, rep = eng.doc_servir(_p[0], _p[2],
                                            qs.get("qui", [""])[0])
                if code == 200:
                    return self._binaire(code, rep, _p[2])
                return self._json(code, rep)
        if url.path == "/parc/portail":
            code, rep = eng.portail_lister(
                qs.get("qui", [""])[0],
                qs.get("annee", [""])[0],
                qs.get("mois", [""])[0],
                client=qs.get("client", [""])[0].strip())
            return self._json(code, rep)
            return self._json(code, rep)
        if url.path.startswith("/parc/portail/"):
            lid = url.path[len("/parc/portail/"):].strip("/")
            if not lid or "/" in lid:
                return self._json(404, {"erreur": "logement_id attendu"})
            code, rep = eng.portail_releve(lid, qs.get("qui", [""])[0],
                                           annee=qs.get("annee", [""])[0],
                                           mois=qs.get("mois", [""])[0])
            return self._json(code, rep)
        if url.path == "/calendrier-parc":
            debut = qs.get("debut", [""])[0]
            jours = qs.get("jours", [""])[0]
            return self._json(200, eng.calendrier_parc(
                debut=debut or None, jours=jours or None, force=force,
                entite=ent_f or None, mode=mode_f or None))
        # --- CRUD logements : LECTURE seule en GET (§6bis) ---
        if url.path == "/parc/logements":
            try:
                return self._json(200, eng.parc_lister())
            except ErreurRegistre as e:
                return self._json(e.code, {"erreur": e.message})
        if url.path == "/parc/snapshots":
            code, rep = eng.parc_snapshots()
            return self._json(code, rep)
        if url.path == "/metrics":
            return self._json(200, eng.metriques())
        # SaaS P1/P2/P3 (Passerelle v2 §0-bis) : compteurs de bascule
        # d'hébergement + seuils, lecture seule, SANS secret ni PII.
        if url.path == "/v1/statut":
            return self._json(200, sth.statut_hebergement(eng))
        # §15/§17/§14.5/§6quater : lectures seules (GET), jamais de proxy
        # moteur. `?lang=` > Accept-Language > fr ; Content-Language rendu.
        if url.path in ("/v1/config-llm", "/config-llm"):
            code, rep = eng.config_llm_lire(qs.get("qui", [""])[0])
            return self._json(code, rep)
        if url.path in ("/v1/pipeline", "/export-compta"):
            if url.path == "/v1/pipeline":
                code, rep = eng.pipeline_lire(qs.get("qui", [""])[0])
            else:
                code, rep = eng.export_compta(
                    qs.get("entite", [""])[0].strip() or None)
            return self._json(code, rep)
        if url.path == "/v1/prospects":
            code, rep = eng.prospects_lister(qs.get("qui", [""])[0])
            return self._json(code, rep)
        if url.path == "/v1/i18n":
            cle = qs.get("cle", ["titre_page"])[0]
            lang = qs.get("lang", [""])[0].strip().lower()
            if lang not in i18n_mod.LANGUES:
                lang = i18n_mod.choisir_langue(
                    "", "", self.headers.get("Accept-Language", ""))[0]
            self.send_response(200)
            self.send_header("Content-Type",
                             "application/json; charset=utf-8")
            self.send_header("Content-Language", lang)
            self.send_header("Vary", "Accept-Language")
            corps = json.dumps(
                {"cle": cle, "texte": eng.texte(cle, lang),
                 "langue": lang, "langues": list(i18n_mod.LANGUES)},
                ensure_ascii=False).encode("utf-8")
            self.send_header("Content-Length", str(len(corps)))
            self.end_headers()
            self.wfile.write(corps)
            return
        # G4-b : conflits split-brain + digest (§16.2). Lecture seule partout
        # sauf `trancher` (geste humain trace). En GET ici (comme /metrics) :
        # ce sont des LECTURES, pas des ecritures — les mettre en POST
        # forcerait un corps pour une simple consultation.
        if url.path == "/parc/conflits":
            return self._json(200, eng.conflits())
        if url.path == "/parc/digest":
            return self._json(200, eng.digest())
        # --- annonces OTA : LECTURE seule (§6bis-b) ---
        if url.path == "/parc/annonces":
            try:
                return self._json(200, eng.annonces_lister())
            except (ErreurAnnonces, ErreurRegistre) as e:
                return self._json(e.code, {"erreur": e.message})
        if url.path.startswith("/parc/annonces/"):
            lid = url.path[len("/parc/annonces/"):].strip("/")
            if not lid or "/" in lid:
                return self._json(404, {"erreur": "logement_id attendu"})
            try:
                return self._json(200, eng.annonce_lire(lid))
            except (ErreurAnnonces, ErreurRegistre) as e:
                return self._json(e.code, {"erreur": e.message})
        if url.path == "/export-ota":
            debut = qs.get("debut", [""])[0]
            jours = qs.get("jours", [""])[0]
            ent_f = qs.get("entite", [""])[0]
            mode_f = qs.get("mode", [""])[0]
            # §3bis : le filtre restreint l'export, il ne l'invente pas. Les
            # logements écartés sont comptés dans l'enveloppe `filtres`.
            return self._json(200, eng.export_ota(
                jours=jours or None, debut=debut or None,
                entite=ent_f or None, mode=mode_f or None))
        # --- G2bis-a : entités juridiques + mandats (§3bis) ---
        if url.path == "/parc/entites":
            try:
                return self._json(200, eng.entites_lister())
            except (ErreurListe, ErreurRegistre) as e:
                return self._json(e.code, {"erreur": e.message})
        if url.path.startswith("/parc/entites/"):
            eid = url.path[len("/parc/entites/"):].strip("/")
            if not eid or "/" in eid:
                return self._json(404, {"erreur": "entite_id attendu"})
            try:
                code, rep = eng.entite_lire(eid)
                return self._json(code, rep)
            except (ErreurListe, ErreurRegistre) as e:
                return self._json(e.code, {"erreur": e.message})
        if url.path == "/parc/mandats":
            ent_f = qs.get("entite", [""])[0]
            mode_f = qs.get("mode", [""])[0]
            try:
                return self._json(200, eng.mandats_lister(
                    entite_id=ent_f or None, mode=mode_f or None))
            except (ErreurListe, ErreurRegistre) as e:
                return self._json(e.code, {"erreur": e.message})
        if url.path.startswith("/parc/mandats/"):
            lid = url.path[len("/parc/mandats/"):].strip("/")
            if not lid or "/" in lid:
                return self._json(404, {"erreur": "logement_id attendu"})
            try:
                r = eng.rattachements()
                if lid not in r:
                    return self._json(404, {"erreur": "mandat inconnu : "
                                                      + lid,
                                           "connus": sorted(r)})
                return self._json(200, {"mandat": dict(r[lid],
                                                       logement_id=lid),
                                        "lecture_seule": True})
            except (ErreurListe, ErreurRegistre) as e:
                return self._json(e.code, {"erreur": e.message})
        if url.path == "/parc/biens":
            return self._json(200, eng.biens_parc(entite=ent_f or None,
                                                  mode=mode_f or None))
        if url.path.startswith("/parc/biens/transfert/"):
            # dossier de transfert en LECTURE (même route que le POST, sans
            # écrire) : utile depuis un lien, jamais depuis un formulaire JS.
            parties = [x for x in
                       url.path[len("/parc/biens/transfert/"):].split("/")
                       if x]
            if len(parties) != 3:
                return self._json(400, {
                    "erreur": "attendu "
                              "/parc/biens/transfert/{qr}/{de}/{vers}"})
            code, rep = eng.transfert_dossier(parties[0], parties[1], parties[2])
            return self._json(code, rep)
        return self._json(404, {"erreur": "inconnu"})

    def _corps(self):
        """Corps JSON d'une requête d'écriture (dict, jamais None)."""
        try:
            n = int(self.headers.get("Content-Length", 0))
            p = json.loads(self.rfile.read(n) or b"{}")
            return p if isinstance(p, dict) else {}
        except (ValueError, json.JSONDecodeError):
            return {}

    def do_POST(self):
        """Écritures : `/v1/action` (allowlist 14 actions) + CRUD `/parc/*`
        (§6bis). Tout autre POST = 404 (aucune route moteur proxifiée)."""
        url = urllib.parse.urlparse(self.path)
        # G4-b : l agent box POUSSE (jamais l inverse). `/ingest` reçoit
        # une boucle (prix + état locaux), `/heartbeat` une preuve de vie
        # sans donnée. Les deux sont ouverts aux AGENTS (compte machine
        # `agent-<box_id>` tracé tel quel), pas aux humains.
        if url.path == "/ingest":
            p = self._corps()
            code, rep = self.engine.ingest(p)
            return self._json(code, rep)
        if url.path == "/heartbeat":
            p = self._corps()
            code, rep = self.engine.heartbeat(p)
            return self._json(code, rep)
        # G4-b : revue humaine SEULE en POST (`trancher`, geste trace §16.2).
        # `/parc/conflits` et `/parc/digest` sont des lectures (do_GET).
        if url.path == "/parc/conflits/trancher":
            p = self._corps()
            code, refus = self.engine.piste_voir_comme(p, "conflit/trancher")
            if refus:
                return self._json(code, refus)
            code, rep = self.engine.trancher(p)
            return self._json(code, rep)
        if url.path == "/v1/action":
            try:
                n = int(self.headers.get("Content-Length", 0))
                p = json.loads(self.rfile.read(n) or b"{}")
                if not isinstance(p, dict):
                    raise ValueError("objet JSON attendu")
            except (ValueError, json.JSONDecodeError):
                return self._json(400, {"erreur": "JSON objet attendu"})
            code, refus = self.engine.piste_voir_comme(p, "v1/action")
            if refus:
                return self._json(code, refus)
            code, enveloppe = self.engine.action(p)
            return self._json(code, enveloppe)
        p = self._corps()
        # Audit voir-comme (S3.3) : toute ecriture portant `qui_reel` passe
        # la piste AVANT le dispatch (fail-closed, un seul point pour la
        # chaine /v1/* + /parc/*). /v1/audit trace lui-meme son geste (pas
        # de double entree) ; /ingest + /heartbeat restent hors sujet : les
        # agents (qui=agent-*) ne portent jamais de piste humaine.
        if url.path != "/v1/audit":
            code, refus = self.engine.piste_voir_comme(p, url.path)
            if refus:
                return self._json(code, refus)
        if url.path == "/v1/audit":
            code, rep = self.engine.audit_voir_comme(p)
            return self._json(code, rep)
        if url.path in ("/v1/llm-tester", "/v1/config-llm"):
            if url.path == "/v1/llm-tester":
                code, rep = self.engine.config_llm_tester(p)
            else:
                # POST /v1/config-llm : dry-run → diff (G2), édition G4.
                # V1 : lecture du diff SANS écrire (même pattern §6bis).
                dry = p.get("dry_run", True)
                if dry is None or bool(dry):
                    code, rep = 200, {"dry_run": True, "lecture_seule": True,
                                      "diff": "aucune ecriture en dry-run",
                                      "qui": p.get("qui", "")}
                else:
                    code, rep = self.engine._verifier_llm(
                        p.get("qui", ""))
                    rep = {"erreur": "edition G4 (dry-run seul en v1)",
                           "qui": p.get("qui", "")} if code else \
                        {"dry_run": False, "applique": False,
                         "note": "edition G4 (dry-run seul en v1)"}
                    code = 200 if not code else code
            return self._json(code, rep)
        if url.path == "/v1/prospects":
            code, rep = self.engine.prospect_creer(p)
            return self._json(code, rep)
        if url.path == "/v1/simulateur":
            code, rep = self.engine.simulateur_calculer(p)
            return self._json(code, rep)
        if url.path == "/v1/offres":
            code, rep = self.engine.offre_generer(p)
            return self._json(code, rep)
        if url.path == "/v1/effacement":
            code, rep = self.engine.effacement(p)
            return self._json(code, rep)
        if url.path == "/parc/logements":
            code, rep = self.engine.parc_creer(p)
        elif url.path.startswith("/parc/logements/") \
                and url.path.endswith("/archiver"):
            lid = url.path[len("/parc/logements/"):-len("/archiver")].strip("/")
            code, rep = self.engine.parc_archiver(lid, p)
        elif url.path == "/parc/config-generale":
            code, rep = self.engine.parc_config_generale(p)
        elif url.path == "/parc/rollback":
            code, rep = self.engine.parc_rollback(p)
        # --- annonces OTA : les écritures sont des GESTES HUMAINS tracés ---
        elif url.path.startswith("/parc/annonces/") \
                and url.path.endswith("/publier"):
            lid = url.path[len("/parc/annonces/"):-len("/publier")].strip("/")
            code, rep = self.engine.annonce_publier(lid, p)
        elif url.path.startswith("/parc/annonces/") \
                and url.path.endswith("/marquer-publie"):
            lid = url.path[len("/parc/annonces/"):-len("/marquer-publie")] \
                .strip("/")
            code, rep = self.engine.annonce_marquer_publie(lid, p)
        elif url.path.startswith("/parc/annonces/") \
                and url.path.endswith("/synchroniser"):
            lid = url.path[len("/parc/annonces/"):-len("/synchroniser")] \
                .strip("/")
            code, rep = self.engine.annonce_synchroniser(lid, p)
        elif url.path.startswith("/parc/annonces/") \
                and url.path.endswith("/archiver"):
            lid = url.path[len("/parc/annonces/"):-len("/archiver")].strip("/")
            code, rep = self.engine.annonce_archiver(lid, p)
        elif url.path == "/parc/biens/transfert":
            qr = str(p.get("qr", "")).strip()
            de = str(p.get("de", "")).strip()
            vers = str(p.get("vers", "")).strip()
            if not qr or not de or not vers:
                return self._json(400, {
                    "erreur": "qr, de et vers sont tous les trois requis",
                    "recu": {"qr": qr, "de": de, "vers": vers}})
            code, rep = self.engine.transfert(qr, de, vers, p)
        elif url.path == "/parc/mandats":
            lid = str(p.get("logement_id", "")).strip()
            if not lid:
                return self._json(400, {
                    "erreur": "logement_id obligatoire (le mandat est porte "
                              "par le logement, §3bis)"})
            code, rep = self.engine.mandat_creer(p)
        elif url.path.startswith("/parc/mandats/") \
                and url.path.endswith("/statut"):
            lid = url.path[len("/parc/mandats/"):-len("/statut")].strip("/")
            if not lid:
                return self._json(404, {"erreur": "logement_id attendu"})
            code, rep = self.engine.mandat_statut(
                lid, p.get("statut"), p)
        elif url.path.startswith("/parc/mandats/") \
                and url.path.endswith("/rollback"):
            lid = url.path[len("/parc/mandats/"):-len("/rollback")].strip("/")
            if not lid:
                return self._json(404, {"erreur": "logement_id attendu"})
            code, rep = self.engine.mandat_rollback(lid, p)
        else:
            return self._json(404, {"erreur": "inconnu",
                                    "note": "POST ouverts : /v1/action, "
                                            "/parc/*"})
        return self._json(code, rep)

    def do_PUT(self):
        """Modification : logements (§6bis-a), fiches annonce (§6bis-b) et
        entités juridiques (§3bis, G2bis-a)."""
        url = urllib.parse.urlparse(self.path)
        if url.path.startswith("/parc/entites/"):
            eid = url.path[len("/parc/entites/"):].strip("/")
            if not eid or "/" in eid:
                return self._json(404, {"erreur": "entite_id attendu"})
            code, rep = self.engine.entite_definir(eid, self._corps())
            return self._json(code, rep)
        if url.path.startswith("/parc/annonces/"):
            lid = url.path[len("/parc/annonces/"):].strip("/")
            if not lid or "/" in lid:
                return self._json(404, {"erreur": "logement_id attendu"})
            code, rep = self.engine.annonce_definir(lid, self._corps())
            return self._json(code, rep)
        if not url.path.startswith("/parc/logements/"):
            return self._json(404, {"erreur": "inconnu",
                                    "note": "PUT ouvert : "
                                            "/parc/logements/{id}"})
        lid = url.path[len("/parc/logements/"):].strip("/")
        if not lid or "/" in lid:
            return self._json(404, {"erreur": "logement_id attendu"})
        code, rep = self.engine.parc_modifier(lid, self._corps())
        return self._json(code, rep)


def main():
    ap = argparse.ArgumentParser(description="LCD passerelle parc lecture "
                                             "seule :8443 (G0/G1)")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--boxes", default=None)
    ap.add_argument("--serve", action="store_true")
    ap.add_argument("--acces", default=None,
                    help="custom/acces.yaml (RBAC écritures G2)")
    args = ap.parse_args()
    cfg = charger_cfg(args.config)
    # Base = dossier du fichier de config : les chemins relatifs du yaml se
    # résolvent par rapport à LUI, pas au répertoire courant (sinon un
    # `python3 .../gateway.py` lancé depuis la racine écrit son état ailleurs).
    base = os.path.dirname(os.path.abspath(args.config)) or "."
    chemin_boxes = args.boxes or cfg.get("boxes", "boxes.yaml")
    if not os.path.isabs(chemin_boxes) and not os.path.exists(chemin_boxes):
        chemin_boxes = os.path.join(base, chemin_boxes)   # relatif au config
    boxes = charger_boxes(chemin_boxes)
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8443)))
    bind = os.environ.get("LCD_BIND", "127.0.0.1")
    qui = os.environ.get("LCD_QUI", cfg.get("qui", QUI_DEFAUT))
    eng = Passerelle(cfg, boxes, qui,
                     os.environ.get("LCD_STATE_DIR",
                                    cfg.get("state_dir", "./state")),
                     args.acces or cfg.get("acces", "acces.yaml"),
                     base=base)
    if not args.serve:
        print(json.dumps({"boxes": [b.get("box_id") for b in boxes],
                          "logements": eng.ids_logements(), "port": port,
                          "qui": eng.qui, "lecture_seule": True},
                         ensure_ascii=False))
        return 0
    Handler.engine = eng
    print(f"passerelle-parc :{port} — {len(eng.boxes)} box, "
          f"{len(eng.ids_logements())} logement(s), state={eng.state_dir}",
          flush=True)
    srv = ThreadingHTTPServer((bind, port), Handler)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
