#!/usr/bin/env python3
# custom/extras-upsell/extras.py — catalogue upsells + pré-commandes P6-5 (§5.6-ter)
# + mini-bar honnêteté P6-6 (fiche prix + conso déclarée + réassort).
# 0 € : stdlib seule. Même LXC/box que les 8 autres moteurs. Port :8098.
#
# Catalogue par logement (`extras_upsell: on`) : mini-bar honnêteté, late/early,
# kits, transfert, courses, petit-déj, conciergerie 100 % partenariat… prix TTC
# affichés avant résa (§12.2). Tout extra pré-commandé avant J-1 18h, payé
# d'avance, todo ménage auto (kit à installer, courses, déco, réassort mini-bar).
#
# P6-6 — deux régimes physiques :
#   (1) kit bienvenue OFFERT (~3-5 € : eau 1,5L + 2 coca + café/thé + biscuits
#       + chips + chocolat + carte) : fixe et identique chaque séjour, réassort
#       systématique au checkout (todo + Grocy seuils P6-3 `kit_bienvenue`),
#       charge compta « accueil », jamais du CA (déjà verrouillé en P6-5) ;
#   (2) mini-bar honnêteté PAYANT : clayette frigo existant + QR paiement +
#       fiche prix `GET /minibar` ; refs unitaires `minibar_*` (prix TTC > 0)
#       déclarées sur place `POST /minibar-conso` (pas de cut-off : conso
#       post-arrivée, statut `a_payer`, todo `reassort_minibar`, compta
#       `extras_ca`) ; stock valorisé `state/<logX>/minibar_stock.json`
#       + `POST /minibar-reassort` au checkout (geste humain) ; soft-only tant
#       que `licence_alcool: false` (refs bière/vin/rosé exclues de la fiche
#       + commande 403 `alcool_sans_licence`).
#
# Règles verrouillées en code :
#   - si `extras_upsell: off` : 503 extras_off (nuitée + ménage seuls) ;
#   - catalogue localisé : socle config + sur-couche `extras/<logX>.yaml`,
#     filtré par zones du logement (slugs custom/zones.yaml ; sans zones =
#     universel) — le filtrage ne change jamais un prix, prix socle inviolable
#     en collision (art. 225-1) ;
#   - office tourisme lecture seule : lieux `tourisme/<zone>.yaml` des zones
#     du logement (zone_defaut incluse), ajout = geste humain via git ;
#   - cut-off J-1 18h : toute commande après = 409 cutoff_depasse (jamais vendu
#     impossible — proposer sur place 1-tap humaine au lieu d'auto) ;
#   - paiement d'avance exigé (sauf kit_bienvenue OFFERT et affiliation à 0 €) :
#     commande créée `a_payer`, `/payer` (humain, preuve Stripe/Swikly) avant todo ;
#   - kit_bienvenue_offert : charge compta « accueil », JAMAIS du CA ;
#   - écritures = geste humain (`qui` != auto/llm/jev/moteur-*) ;
#   - jamais de discrimination tarifaire (prix identiques pour tous, art. 225-1) ;
#   - soft-only si `licence_alcool: false` (mini-bar sans alcool fort) ;
#   - ligne `compta_auto` par extra (rubrique + HT/TVA calculés, brouillon).
#
# Contrats :
#   GET  /health -> {"ok": true}
#   GET  /catalogue?logement_id=log1 -> {extras: [{id, nom, prix_ttc, mode}]}
#     (socle config + sur-couche extras/logX.yaml, filtré par zones du logement)
#   GET  /tourisme?logement_id=log1[&categorie=visite] -> office de tourisme :
#     {zones, zone_defaut, lieux: [{id, nom, categorie, zone, commune, acces,
#     prix_indicatif, lien, mode, extra_id, extra_disponible, prix_ttc}]}
#     (lecture seule ; categorie hors set = 400 categorie_inconnue)
#   GET  /livret?logement_id=log1 -> P6-17 : livret vidéo 30 s/équipement
#     (socle LV/LL/clim/portail/tri + qr PWA + video_url locale, lecture
#     seule voyageur, guide de base : dispo même si extras_upsell off)
#   POST /commande {logement_id, ref_resa, extras[{id, qte?, pers?}], qui}
#     -> 201 {commande_id, total_ttc, statut: a_payer, todo} (cut-off vérifié)
#   POST /payer {logement_id, commande_id, preuve, qui}
#     -> 200 {statut: payee} (todo ménage auto créable)
#   GET  /commandes?logement_id=log1 -> {commandes: [...]}
#   POST /livrer {logement_id, commande_id, qui} -> 200 {statut: livree}
#   GET  /minibar?logement_id=log1 -> fiche prix (soft-only si licence false)
#   POST /minibar-conso {logement_id, ref_resa?, extras[{id, qte}], qui}
#     -> 201 {conso_id, total_ttc, statut: a_payer, todo: [reassort_minibar]}
#     (sans cut-off : conso post-arrivée, 403 alcool_sans_licence)
#   GET  /minibar-stock?logement_id=log1 -> {stock, valorisation_ttc}
#   POST /minibar-reassort {logement_id, qui, quantites?} -> 200 {stock}
#
# Usage : python3 extras.py --config config.yaml --logements ../logements.yaml
#   [--extras ../extras] [--tourisme ../tourisme] [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND, LCD_EXTRAS_DIR, LCD_TOURISME_DIR,
#   LCD_CATALOGUE_CFG.
import argparse
import datetime as dt
import json
import os
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

QUI_AUTO = ("auto", "llm", "jev", "moteur-direct", "moteur-dispatch", "")

CUTOFF_J_MOINS = 1        # J-1
CUTOFF_HEURE = 18         # 18h
KIT_OFFERT = "kit_bienvenue_offert"
MINIBAR_PREFIXE = "minibar_"
REFS_ALCOOL = ("biere", "vin", "rose", "alcool", "champagne", "whisky",
               "vodka", "rhum", "pastis", "ricard", "cidre")
MODES_SANS_PAIEMENT = ("offert", "affiliation", "partenariat", "commission")
STOCK_MINIBAR_DEFAUT = 4

ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def _scalaire(v):
    v = v.strip().strip("\"'")
    if v.startswith("[") and v.endswith("]"):
        return [_scalaire(x) for x in v[1:-1].split(",") if x.strip()]
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


def lire_features(logements_path):
    """Extrait par logement : extras_upsell + extras (bloc indenté).

    Le flag vit sous `features:` (6 espaces) dans logements.yaml — on le
    détecte à toute indentation >= 4 dans le bloc logX (défaut sûr False),
    même convention que lire_flag_inventaire (P6-4). Idem pour un bloc
    `extras:` sur-mesure par logement (items plus indentés que `extras:`).
    """
    try:
        with open(logements_path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    logts = {}
    cur = None
    indent_extras = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        m = re.match(r"^  (\w[\w-]*):\s*$", ligne)
        if m:
            cur = m.group(1)
            logts.setdefault(cur, {"upsell": False, "extras": {}})
            indent_extras = None
            continue
        if cur is None:
            continue
        ind = len(ligne) - len(ligne.lstrip(" "))
        if ligne.strip() and ind < 4:
            continue
        ms = re.match(r"^\s+(\w[\w-]*):\s*(.*)$", ligne)
        if not ms:
            continue
        cle, val = ms.group(1), ms.group(2).strip()
        if cle == "extras_upsell":
            logts[cur]["upsell"] = _scalaire(val) is True
            indent_extras = None
        elif cle == "extras" and not val:
            indent_extras = ind
        elif indent_extras is not None and ind > indent_extras:
            logts[cur]["extras"][cle] = _scalaire(val)
        elif indent_extras is not None and ind <= indent_extras:
            indent_extras = None
    return logts


def parse_ligne_extra(val):
    """Ligne catalogue `Nom | prix | mode? | zones?` -> dict.

    4e champ optionnel : zones CSV (slugs custom/zones.yaml). Sans zones =
    socle universel (visible partout) ; avec zones = visible seulement si le
    logement partage >= 1 zone. Le filtrage ne change jamais un prix (prix
    identiques pour tous, art. 225-1). Sans mode et prix 0 => affiliation.
    """
    if not isinstance(val, str):
        return {"nom": str(val), "prix_ttc": 0.0, "mode": "affiliation",
                "zones": []}
    morceaux = [x.strip() for x in val.split("|")]
    nom = morceaux[0].strip().strip("\"'") or val.strip()
    prix = 0.0
    if len(morceaux) >= 2 and re.fullmatch(r"[\d.]+", morceaux[1].strip()):
        prix = float(morceaux[1].strip())
    mode = morceaux[2].strip().strip("\"'") if len(morceaux) >= 3 else ""
    if not mode and prix <= 0:
        mode = "affiliation"
    zones = []
    if len(morceaux) >= 4 and morceaux[3].strip():
        zones = [z.strip().strip("\"'") for z in morceaux[3].split(",")
                 if z.strip()]
    return {"nom": nom, "prix_ttc": prix, "mode": mode, "zones": zones}


def lire_catalogue_cfg(path):
    """Catalogue `extras:` de la config (`id: Nom | prix | mode? | zones?`).

    Mode optionnel après 2e `|` : offert / affiliation / partenariat /
    commission (+ détail taux, ex. `partenariat_commission_15_20`).
    Zones optionnelles après 3e `|` : slugs CSV (cf. parse_ligne_extra).
    """
    try:
        with open(path, encoding="utf-8") as f:
            brut = f.read()
    except FileNotFoundError:
        return {}
    m = re.search(r"^extras:\s*\n((?:  \w+:.*\n?)+)", brut, re.M)
    extras = {}
    if m:
        for ligne in m.group(1).splitlines():
            if ":" not in ligne:
                continue
            k, v = ligne.strip().split(":", 1)
            extras[k.strip()] = parse_ligne_extra(v.strip())
    return extras


CATEGORIES_TOURISME = ("visite", "resto", "plage", "activite", "pratique")

# P6-17 §5.7-bis : livret vidéo 30 s/équipement (1 QR par équipement ->
# vidéo tournée smartphone, hébergée locale/PWA -> -50 % questions
# répétées). Socle fixe (guide de base, dispo même si extras_upsell off) :
# videos runtime box `/local/livret/<id>.mp4` (jamais commitées).
LIVRET_SOCLE = (
    {"id": "lv", "titre": "Lave-vaisselle", "duree_s": 30},
    {"id": "ll", "titre": "Lave-linge", "duree_s": 30},
    {"id": "clim", "titre": "Climatisation (bornes)", "duree_s": 30},
    {"id": "portail", "titre": "Portail / accès", "duree_s": 30},
    {"id": "tri", "titre": "Tri des déchets", "duree_s": 30},
)


def lire_zones_logement(path, logement_id):
    """Zones + zone_defaut d'un logement (clés indent 4 du bloc logX)."""
    info = {"zones": [], "zone_defaut": None}
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return info
    dans_bloc = False
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if re.match(r"^  \w[\w-]*:\s*$", ligne):
            dans_bloc = ligne.strip().rstrip(":") == logement_id
            continue
        if not dans_bloc:
            continue
        if not (ligne.startswith("    ") or ligne.startswith("\t")):
            continue
        if ":" not in ligne:
            continue
        k, v = ligne.strip().split(":", 1)
        k, v = k.strip(), v.strip()
        if k == "zone_defaut":
            z = v.strip("\"'")
            info["zone_defaut"] = z if z not in ("", "null", "None") else None
        elif k == "zones":
            val = _scalaire(v)
            info["zones"] = val if isinstance(val, list) else []
    return info


def lire_extras_logement(path):
    """Sur-couche extras d'un logement (`extras/logX.yaml`, mapping `extras:`).

    Même format `id: Nom | prix | mode? | zones?` que le socle. Fichier
    absent = {} (socle seul). À la fusion, le prix socle fait foi (art. 225-1).
    """
    try:
        with open(path, encoding="utf-8") as f:
            brut = f.read()
    except FileNotFoundError:
        return {}
    m = re.search(r"^extras:\s*\n((?:  \w+:.*\n?)+)", brut, re.M)
    extras = {}
    if m:
        for ligne in m.group(1).splitlines():
            if ":" not in ligne:
                continue
            k, v = ligne.strip().split(":", 1)
            extras[k.strip()] = parse_ligne_extra(v.strip())
    return extras


def lire_lieux(path, zone):
    """Lieux office de tourisme d'une zone (`tourisme/<zone>.yaml`, slugs seuls).

    Liste d'objets (`- id:` + champs indent 4+, cf. dispatch lire_annuaire).
    `categorie` hors set => lieu ignoré (jamais de texte libre côté voyageur).
    """
    lieux = []
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return lieux
    courant = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        m = re.match(r"^\s+-\s+(\w[\w-]*):\s*(.*)$", ligne)
        if m:
            courant = {m.group(1): _scalaire(m.group(2))}
            lieux.append(courant)
            continue
        m2 = re.match(r"^\s{4,}(\w[\w-]*):\s*(.*)$", ligne)
        if m2 and courant is not None:
            courant[m2.group(1)] = _scalaire(m2.group(2))
    res = []
    for l in lieux:
        if not l.get("id") or not l.get("nom"):
            continue
        if str(l.get("categorie") or "") not in CATEGORIES_TOURISME:
            continue
        res.append({"id": str(l["id"]), "nom": str(l["nom"]),
                    "categorie": str(l["categorie"]), "zone": zone,
                    "commune": str(l.get("commune") or ""),
                    "acces": str(l.get("acces") or ""),
                    "prix_indicatif": str(l.get("prix_indicatif") or ""),
                    "lien": str(l.get("lien") or ""),
                    "mode": str(l.get("mode") or ""),
                    "extra_id": str(l.get("extra_id") or "")})
    return res


class Extras:
    def __init__(self, cfg, logements_yaml, extras_dir, tourisme_dir=None):
        self.cfg = cfg
        self.logements_yaml = logements_yaml
        self.extras_dir = (os.environ.get("LCD_EXTRAS_DIR")
                           or extras_dir or "./extras")
        self.tourisme_dir = (os.environ.get("LCD_TOURISME_DIR")
                             or tourisme_dir or "./tourisme")
        self.state_dir = (os.environ.get("LCD_STATE_DIR")
                          or cfg.get("state_dir", "./state"))
        self.decision_dir = (os.environ.get("LCD_DECISION_LOG_DIR")
                             or cfg.get("decision_log_dir", "./state"))
        self.catalogue_cfg = lire_catalogue_cfg(
            os.environ.get("LCD_CATALOGUE_CFG") or cfg.get("catalogue_cfg", ""))
        os.makedirs(self.state_dir, exist_ok=True)
        os.makedirs(self.decision_dir, exist_ok=True)

    # --- helpers ---
    def _feat(self, logement_id):
        return lire_features(self.logements_yaml).get(logement_id, {})

    def _zones(self, logement_id):
        """Zones du logement (+ zone_defaut si hors liste, jamais de doublon)."""
        z = lire_zones_logement(self.logements_yaml, logement_id)
        zones = list(z["zones"])
        if z["zone_defaut"] and z["zone_defaut"] not in zones:
            zones.append(z["zone_defaut"])
        return zones, z["zone_defaut"]

    @staticmethod
    def _visible(extra_zones, zones_logement):
        """Filtre zone : sans zones = universel ; sinon >= 1 zone commune."""
        if not extra_zones:
            return True
        return any(z in zones_logement for z in extra_zones)

    def catalogue(self, logement_id):
        """Fusion localisée : socle config + sur-couche extras/<logX>.yaml.

        Sur-couche sans zones = visible partout ; avec zones = visible si le
        logement partage >= 1 zone (zone_defaut incluse). Collision d'id :
        le PRIX SOCLE fait foi (art. 225-1), jamais modifié par la sur-couche.
        """
        feat = self._feat(logement_id)
        zones, _ = self._zones(logement_id)
        fusion = {}
        for eid, e in self.catalogue_cfg.items():
            fusion[eid] = {"nom": e["nom"], "prix_ttc": e["prix_ttc"],
                           "mode": e.get("mode", ""),
                           "zones": list(e.get("zones", []))}
        surcouche = {}
        if ID_RE.fullmatch(logement_id or ""):
            surcouche = lire_extras_logement(
                os.path.join(self.extras_dir, f"{logement_id}.yaml"))
        for eid, e in surcouche.items():
            if eid in fusion:
                # Prix socle inviolable ; la sur-couche ne peut qu'ajouter
                # nom/mode/zones (visibilité) — jamais un prix différent.
                fusion[eid]["zones"] = list(e.get("zones", []))
                if e.get("nom"):
                    fusion[eid]["nom"] = e["nom"]
                if e.get("mode"):
                    fusion[eid]["mode"] = e["mode"]
            else:
                fusion[eid] = {"nom": e["nom"], "prix_ttc": e["prix_ttc"],
                               "mode": e.get("mode", ""),
                               "zones": list(e.get("zones", []))}
        items = []
        for eid, e in fusion.items():
            if not self._visible(e.get("zones", []), zones):
                continue
            items.append({"id": eid, "nom": e["nom"],
                          "prix_ttc": e["prix_ttc"], "mode": e.get("mode", "")})
        # Extras du bloc logements.yaml sans prix config = prix 0 (affiliation).
        vus = {e["id"] for e in items}
        for eid in feat.get("extras", {}):
            if eid not in fusion and eid not in vus:
                items.append({"id": eid, "nom": eid.replace("_", " "),
                              "prix_ttc": 0.0, "mode": "affiliation"})
        items.sort(key=lambda x: x["id"])
        return items

    def _chemin(self, logement_id):
        if not ID_RE.fullmatch(logement_id or ""):
            return None
        d = os.path.join(self.state_dir, logement_id)
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, "extras_commandes.json")

    def _lire_toutes(self, logement_id):
        chemin = self._chemin(logement_id)
        if chemin is None:
            return None
        try:
            with open(chemin, encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (FileNotFoundError, ValueError):
            return []

    def _stocker_toutes(self, logement_id, commandes):
        with open(self._chemin(logement_id), "w", encoding="utf-8") as f:
            json.dump(commandes, f, ensure_ascii=False, indent=2)

    def log_decision(self, logement_id, ref, qui, quoi, montant, motif,
                       commission=None, net_hote=None):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": "direct",
                 "commission": commission, "net_hote": montant
                 if net_hote is None else net_hote, "motif": motif}
        os.makedirs(self.decision_dir, exist_ok=True)
        with open(os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl"),
                  "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")

    def _verif_flag(self, logement_id):
        if not self._feat(logement_id).get("upsell", False):
            return ({"ok": False, "code": "extras_off",
                     "erreur": "extras_upsell: off (nuitée + ménage seuls)"},
                    503)
        return None

    def _verif_qui(self, qui):
        if (qui or "") in QUI_AUTO:
            return ({"ok": False, "code": "validation_humaine_requise",
                     "erreur": "geste humain exigé (qui != auto/llm/jev)"}, 400)
        return None

    def _cutoff_passe(self, arrivee_jjmmaaaa=None):
        """Cut-off J-1 18h : passé si maintenant > (arrivée - 1j à 18h)."""
        if not arrivee_jjmmaaaa:
            return False  # sans date d'arrivée : pas de cut-off vérifiable
        try:
            j = dt.date.fromisoformat(arrivee_jjmmaaaa[:10])
        except ValueError:
            return True  # date illisible = refus sûr
        limite = dt.datetime.combine(
            j - dt.timedelta(days=CUTOFF_J_MOINS),
            dt.time(CUTOFF_HEURE))
        return dt.datetime.now() > limite

    def _exige_paiement(self, eid, catalogue=None):
        # Catalogue fusionné injecté par commander() (sur-couche incluse) ;
        # défaut = socle config (prix socle inviolable, art. 225-1).
        e = (catalogue or {}).get(eid) or self.catalogue_cfg.get(eid, {})
        if eid == KIT_OFFERT:
            return False
        mode = str(e.get("mode") or "").lower()
        if any(mode == m or mode.startswith(m)
               for m in MODES_SANS_PAIEMENT):
            return False
        if float(e.get("prix_ttc") or 0) <= 0:
            return False
        return True

    # --- mini-bar P6-6 (fiche prix + conso sur place + stock + réassort) ---
    def _licence_alcool(self):
        return bool(self.cfg.get("licence_alcool", False))

    @staticmethod
    def _est_alcool(eid):
        morceaux = set((eid or "").lower().split("_"))
        return any(r in morceaux for r in REFS_ALCOOL)

    def _refs_minibar(self, logement_id):
        """Refs unitaires minibar_* (prix > 0) ; soft-only sans licence."""
        refs = []
        for e in self.catalogue(logement_id):
            eid = e["id"]
            if not eid.startswith(MINIBAR_PREFIXE):
                continue
            if float(e.get("prix_ttc") or 0) <= 0:
                continue
            if not self._licence_alcool() and self._est_alcool(eid):
                continue
            refs.append(e)
        return refs

    def _chemin_stock(self, logement_id):
        if not ID_RE.fullmatch(logement_id or ""):
            return None
        d = os.path.join(self.state_dir, logement_id)
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, "minibar_stock.json")

    def _chemin_consos(self, logement_id):
        if not ID_RE.fullmatch(logement_id or ""):
            return None
        d = os.path.join(self.state_dir, logement_id)
        os.makedirs(d, exist_ok=True)
        return os.path.join(d, "minibar_consos.json")

    def _lire_stock(self, logement_id):
        chemin = self._chemin_stock(logement_id)
        if chemin is None:
            return None
        try:
            with open(chemin, encoding="utf-8") as f:
                data = json.load(f)
                stock = dict(data) if isinstance(data, dict) else {}
        except (FileNotFoundError, ValueError):
            stock = {}
        # Défaut : cible par ref fiche (jamais d'alcool sans licence).
        for e in self._refs_minibar(logement_id):
            stock.setdefault(e["id"], STOCK_MINIBAR_DEFAUT)
        return stock

    def _stocker_stock(self, logement_id, stock):
        with open(self._chemin_stock(logement_id), "w", encoding="utf-8") as f:
            json.dump(stock, f, ensure_ascii=False, indent=2)

    def _lire_consos(self, logement_id):
        chemin = self._chemin_consos(logement_id)
        if chemin is None:
            return None
        try:
            with open(chemin, encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, list) else []
        except (FileNotFoundError, ValueError):
            return []

    def _stocker_consos(self, logement_id, consos):
        with open(self._chemin_consos(logement_id), "w", encoding="utf-8") as f:
            json.dump(consos, f, ensure_ascii=False, indent=2)

    # --- GET /minibar ---
    def get_minibar(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        if not ID_RE.fullmatch(logement_id or ""):
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        return {"ok": True, "logement_id": logement_id,
                "soft_only": not self._licence_alcool(),
                "fiche": self._refs_minibar(logement_id)}, 200

    # --- POST /minibar-conso ---
    def minibar_conso(self, p):
        logement_id = p.get("logement_id", "")
        qui = p.get("qui", "")
        err = self._verif_flag(logement_id) or self._verif_qui(qui)
        if err:
            return err
        lignes = p.get("extras") or []
        if not isinstance(lignes, list) or not lignes:
            return {"ok": False, "erreur": "extras[] non vide requis"}, 400
        catalogue = {e["id"]: e for e in self.catalogue(logement_id)}
        items, total = [], 0.0
        for lig in lignes:
            if not isinstance(lig, dict):
                return {"ok": False, "erreur": "ligne extra = objet {id}"}, 400
            eid = str(lig.get("id") or "")
            if not ID_RE.fullmatch(eid) or eid not in catalogue:
                return {"ok": False, "code": "extra_inconnu",
                        "erreur": f"extra inconnu ou prix non affiché: {eid}"}, 400
            if not eid.startswith(MINIBAR_PREFIXE):
                return {"ok": False, "code": "extra_inconnu",
                        "erreur": f"pas une ref mini-bar: {eid}"}, 400
            if not self._licence_alcool() and self._est_alcool(eid):
                self.log_decision(logement_id, str(p.get("ref_resa") or eid),
                                  qui, "minibar_alcool_ko", None,
                                  f"{eid} refusé (licence_alcool: false)")
                return {"ok": False, "code": "alcool_sans_licence",
                        "erreur": "alcool interdit sans petite licence "
                                  "(mairie+douanes)"}, 403
            try:
                qte = int(lig.get("qte", 1))
            except (TypeError, ValueError):
                return {"ok": False, "erreur": f"qte entière: {eid}"}, 400
            if qte < 1 or qte > 99:
                return {"ok": False, "erreur": f"qte 1-99: {eid}"}, 400
            e = catalogue[eid]
            montant = round(float(e["prix_ttc"]) * qte, 2)
            total += montant
            items.append({"id": eid, "nom": e["nom"], "qte": qte,
                          "prix_ttc_unitaire": e["prix_ttc"],
                          "montant_ttc": montant})
        total = round(total, 2)
        stock = self._lire_stock(logement_id)
        consos = self._lire_consos(logement_id)
        if stock is None or consos is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        # Réalité physique : le voyageur a déjà consommé — on décrémente
        # même sous zéro (écart visible = alerte réassort, jamais de refus).
        for i in items:
            stock[i["id"]] = stock.get(i["id"], 0) - i["qte"]
        self._stocker_stock(logement_id, stock)
        mid = f"MB-{dt.date.today():%Y%m%d}-{os.urandom(2).hex().upper()}"
        compta = []
        for i in items:
            ht = round(i["montant_ttc"] / 1.2, 2)
            compta.append({"extra": i["id"], "rubrique": "extras_ca",
                           "ttc": i["montant_ttc"], "ht": ht,
                           "tva": round(i["montant_ttc"] - ht, 2),
                           "brouillon": True})
        conso = {"conso_id": mid, "logement_id": logement_id,
                 "ref_resa": str(p.get("ref_resa") or ""),
                 "items": items, "total_ttc": total, "statut": "a_payer",
                 "todo_menage": ["reassort_minibar"], "compta": compta,
                 "declare_par": qui, "ts": utcnow_iso()}
        consos.append(conso)
        self._stocker_consos(logement_id, consos)
        self.log_decision(logement_id, conso["ref_resa"] or mid, qui,
                          "minibar_conso", total,
                          f"{mid}: {len(items)} ref(s), à payer au checkout")
        return {"ok": True, "conso_id": mid, "total_ttc": total,
                "statut": "a_payer", "todo_menage": ["reassort_minibar"],
                "compta": compta, "stock": stock}, 201

    # --- GET /minibar-stock ---
    def minibar_stock(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        stock = self._lire_stock(logement_id)
        if stock is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        prix = {e["id"]: float(e["prix_ttc"])
                for e in self.catalogue(logement_id)}
        valo = round(sum(stock.get(r, 0) * prix.get(r, 0) for r in stock), 2)
        return {"ok": True, "logement_id": logement_id, "stock": stock,
                "valorisation_ttc": valo}, 200

    # --- POST /minibar-reassort ---
    def minibar_reassort(self, p):
        logement_id = p.get("logement_id", "")
        qui = p.get("qui", "")
        err = self._verif_flag(logement_id) or self._verif_qui(qui)
        if err:
            return err
        stock = self._lire_stock(logement_id)
        if stock is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        fiche_ids = {e["id"] for e in self._refs_minibar(logement_id)}
        quantites = p.get("quantites") or {}
        if not isinstance(quantites, dict):
            return {"ok": False, "erreur": "quantites = objet {ref: qte}"}, 400
        if quantites:
            # Geste humain explicite : quantités posées telles quelles.
            for eid, qte in quantites.items():
                if not ID_RE.fullmatch(eid or "") or eid not in fiche_ids:
                    return {"ok": False, "code": "extra_inconnu",
                            "erreur": f"ref mini-bar inconnue: {eid}"}, 400
                try:
                    qte = int(qte)
                except (TypeError, ValueError):
                    return {"ok": False, "erreur": f"qte entière: {eid}"}, 400
                if qte < 0 or qte > 99:
                    return {"ok": False, "erreur": f"qte 0-99: {eid}"}, 400
                stock[eid] = qte
        else:
            # Réassort checkout : toute ref sous la cible revient à la cible.
            for eid in fiche_ids:
                if stock.get(eid, 0) < STOCK_MINIBAR_DEFAUT:
                    stock[eid] = STOCK_MINIBAR_DEFAUT
        self._stocker_stock(logement_id, stock)
        self.log_decision(logement_id, "", qui, "minibar_reassort", None,
                          f"stock réassorti ({len(fiche_ids)} refs)")
        return {"ok": True, "logement_id": logement_id, "stock": stock}, 200

    # --- GET /catalogue ---
    def get_catalogue(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        return {"ok": True, "logement_id": logement_id,
                "catalogue": self.catalogue(logement_id)}, 200

    # --- GET /tourisme : office de tourisme du logement (lecture seule) ---
    def get_tourisme(self, logement_id, categorie=None):
        """Lieux des zones du logement (zone_defaut incluse), slugs seuls.

        Lecture seule voyageur : aucun qui, aucun state, aucune écriture —
        les ajouts sont un geste humain via git (versionné, jamais auto).
        categorie hors set => 400 categorie_inconnue. extra_id croisé avec
        le catalogue fusionné (extra_disponible + prix_ttc affichés).
        """
        err = self._verif_flag(logement_id)
        if err:
            return err
        if categorie and categorie not in CATEGORIES_TOURISME:
            return {"ok": False, "code": "categorie_inconnue",
                    "erreur": "categorie parmi: "
                              + ", ".join(CATEGORIES_TOURISME)}, 400
        if not ID_RE.fullmatch(logement_id or ""):
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        zones, zone_defaut = self._zones(logement_id)
        catalogue = {e["id"]: e for e in self.catalogue(logement_id)}
        lieux = []
        for z in zones:
            if not ID_RE.fullmatch(z or ""):
                continue
            for l in lire_lieux(os.path.join(self.tourisme_dir, f"{z}.yaml"),
                                z):
                if categorie and l["categorie"] != categorie:
                    continue
                extra = catalogue.get(l["extra_id"]) if l["extra_id"] else None
                lieux.append({**l,
                              "extra_disponible": extra is not None,
                              "prix_ttc": (extra["prix_ttc"]
                                           if extra is not None else None)})
        lieux.sort(key=lambda l: (l["zone"], l["categorie"], l["id"]))
        return {"ok": True, "logement_id": logement_id, "zones": zones,
                "zone_defaut": zone_defaut, "lieux": lieux,
                "total": len(lieux)}, 200

    # --- GET /livret : livret vidéo 30 s/équipement (lecture seule) ---
    def get_livret(self, logement_id):
        """Fiches QR par équipement (socle fixe, guide de base).

        Lecture seule voyageur : aucun qui, aucun state, aucune écriture.
        Dispo même si `extras_upsell: off` (guide, pas upsell) — seul
        l'existence du logement est vérifiée (404 sinon, 400 si invalide).
        Vidéos runtime box `/local/livret/<id>.mp4` (tournées smartphone,
        jamais commitées).
        """
        if not ID_RE.fullmatch(logement_id or ""):
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        if logement_id not in lire_features(self.logements_yaml):
            return {"ok": False,
                    "erreur": f"logement inconnu: {logement_id}"}, 404
        fiches = [{**e, "qr": f"/livret/{e['id']}",
                   "video_url": f"/local/livret/{e['id']}.mp4"}
                  for e in LIVRET_SOCLE]
        return {"ok": True, "logement_id": logement_id, "fiches": fiches,
                "total": len(fiches)}, 200

    # --- POST /commande ---
    def commander(self, p):
        logement_id = p.get("logement_id", "")
        qui = p.get("qui", "")
        err = self._verif_flag(logement_id) or self._verif_qui(qui)
        if err:
            return err
        lignes = p.get("extras") or []
        if not isinstance(lignes, list) or not lignes:
            return {"ok": False, "erreur": "extras[] non vide requis"}, 400
        ref_resa = str(p.get("ref_resa") or "")
        arrivee = str(p.get("arrivee") or "")
        if self._cutoff_passe(arrivee):
            self.log_decision(logement_id, ref_resa, qui, "extra_cutoff_ko",
                              None, f"cut-off J-1 18h dépassé (arrivée {arrivee})")
            return {"ok": False, "code": "cutoff_depasse",
                    "erreur": "cut-off J-1 18h dépassé : proposer sur place "
                              "(1-tap humaine, jamais auto)"}, 409
        catalogue = {e["id"]: e for e in self.catalogue(logement_id)}
        items, total = [], 0.0
        for lig in lignes:
            if not isinstance(lig, dict):
                return {"ok": False, "erreur": "ligne extra = objet {id}"}, 400
            eid = str(lig.get("id") or "")
            if not ID_RE.fullmatch(eid) or eid not in catalogue:
                return {"ok": False, "code": "extra_inconnu",
                        "erreur": f"extra inconnu ou prix non affiché: {eid}"}, 400
            try:
                qte = int(lig.get("qte", 1))
            except (TypeError, ValueError):
                return {"ok": False, "erreur": f"qte entière: {eid}"}, 400
            if qte < 1 or qte > 99:
                return {"ok": False, "erreur": f"qte 1-99: {eid}"}, 400
            try:
                pers = int(lig.get("pers") or 1)
            except (TypeError, ValueError):
                pers = 1
            if pers < 1:
                pers = 1
            e = catalogue[eid]
            # Prix par personne (petit-déj, chef…) : qte = nb personnes.
            par_pers = "pers" in eid or eid in ("petit_dej",
                                               "chef_domicile_panier_apero")
            montant = round(float(e["prix_ttc"]) * (pers if par_pers else qte), 2)
            total += montant
            items.append({"id": eid, "nom": e["nom"], "qte": qte,
                          "pers": pers if par_pers else None,
                          "prix_ttc_unitaire": e["prix_ttc"],
                          "montant_ttc": montant,
                          "mode": e.get("mode", ""),
                          "paiement_requis": self._exige_paiement(eid,
                                                                 catalogue)})
        total = round(total, 2)
        a_payer = any(i["paiement_requis"] for i in items)
        commandes = self._lire_toutes(logement_id)
        if commandes is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        cid = f"EXT-{dt.date.today():%Y%m%d}-{os.urandom(2).hex().upper()}"
        # Todo ménage auto : kits à installer + courses + déco + réassort.
        todo = sorted({i["id"] for i in items})
        # Ligne compta par extra :
        #   - kit offert = charge « accueil », jamais du CA ;
        #   - partenariat/affiliation/commission à 0 € = « partenariat »
        #     (aucun encaissement voyageur, commission reversée côté presta).
        compta = []
        for i in items:
            mode = str(i.get("mode") or "").lower()
            if i["id"] == KIT_OFFERT:
                rubrique = "accueil"
            elif (mode and any(mode == m or mode.startswith(m)
                               for m in MODES_SANS_PAIEMENT)):
                rubrique = "partenariat"
            else:
                rubrique = "extras_ca"
            ht = round(i["montant_ttc"] / 1.2, 2)
            compta.append({"extra": i["id"], "rubrique": rubrique,
                           "ttc": i["montant_ttc"], "ht": ht,
                           "tva": round(i["montant_ttc"] - ht, 2),
                           "mode": i.get("mode", ""),
                           "brouillon": True})
        cmd = {"commande_id": cid, "logement_id": logement_id,
               "ref_resa": ref_resa, "arrivee": arrivee,
               "items": items, "total_ttc": total,
               "statut": "validee" if not a_payer else "a_payer",
               "todo_menage": todo, "compta": compta,
               "cree_par": qui, "ts": utcnow_iso()}
        commandes.append(cmd)
        self._stocker_toutes(logement_id, commandes)
        commission = None
        for i in items:
            mode_i = str(i.get("mode") or "")
            if mode_i:
                commission = (mode_i if commission is None
                             else f"{commission}+{mode_i}")
        self.log_decision(logement_id, ref_resa or cid, qui,
                          "extra_commande", total,
                          f"{cid}: {len(items)} extra(s), "
                          f"{'paiement avance requis' if a_payer else 'sans paiement'}",
                          commission=commission, net_hote=total)
        code = 201
        rep = {"ok": True, "commande_id": cid, "total_ttc": total,
               "statut": cmd["statut"], "todo_menage": todo,
               "compta": compta}
        if a_payer:
            rep["action"] = "POST /payer (preuve Stripe/Swikly) avant todo"
        return rep, code

    # --- POST /payer ---
    def payer(self, p):
        logement_id = p.get("logement_id", "")
        qui = p.get("qui", "")
        err = self._verif_flag(logement_id) or self._verif_qui(qui)
        if err:
            return err
        cid = str(p.get("commande_id") or "")
        preuve = str(p.get("preuve") or "").strip()
        if not cid or not ID_RE.fullmatch(cid):
            return {"ok": False, "erreur": "commande_id requis"}, 400
        commandes = self._lire_toutes(logement_id)
        if commandes is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        for cmd in commandes:
            if cmd.get("commande_id") == cid:
                if cmd["statut"] == "payee":
                    return {"ok": True, "commande_id": cid,
                            "statut": "deja_payee"}, 200
                if cmd["statut"] == "validee":
                    # Offert/partenariat : aucun encaissement voyageur —
                    # /payer sans preuve = no-op 200, jamais 402 (P6-7).
                    return {"ok": True, "commande_id": cid,
                            "statut": "validee",
                            "note": "sans paiement (offert/affiliation)"}, 200
                if not preuve:
                    return {"ok": False, "code": "paiement_requis",
                            "erreur": "preuve de paiement d'avance requise "
                                      "(Stripe/Swikly)"}, 402
                cmd["statut"] = "payee"
                cmd["preuve"] = preuve
                cmd["paye_par"] = qui
                self._stocker_toutes(logement_id, commandes)
                self.log_decision(logement_id, cmd.get("ref_resa") or cid,
                                  qui, "extra_paye", cmd["total_ttc"],
                                  f"{cid} payé ({preuve[:24]})")
                return {"ok": True, "commande_id": cid, "statut": "payee",
                        "todo_menage": cmd["todo_menage"]}, 200
        return {"ok": False, "code": "introuvable",
                "erreur": f"commande {cid} introuvable"}, 404

    # --- GET /commandes ---
    def commandes(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        liste = self._lire_toutes(logement_id)
        if liste is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        return {"ok": True, "logement_id": logement_id,
                "commandes": liste, "total": len(liste)}, 200

    # --- POST /livrer ---
    def livrer(self, p):
        logement_id = p.get("logement_id", "")
        qui = p.get("qui", "")
        err = self._verif_flag(logement_id) or self._verif_qui(qui)
        if err:
            return err
        cid = str(p.get("commande_id") or "")
        if not cid or not ID_RE.fullmatch(cid):
            return {"ok": False, "erreur": "commande_id requis"}, 400
        commandes = self._lire_toutes(logement_id)
        if commandes is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        for cmd in commandes:
            if cmd.get("commande_id") == cid:
                if cmd["statut"] == "a_payer":
                    return {"ok": False, "code": "paiement_requis",
                            "erreur": "paiement d'avance exigé avant livraison"}, 402
                cmd["statut"] = "livree"
                cmd["livre_par"] = qui
                self._stocker_toutes(logement_id, commandes)
                self.log_decision(logement_id, cmd.get("ref_resa") or cid,
                                  qui, "extra_livre", cmd["total_ttc"],
                                  f"{cid} livré")
                return {"ok": True, "commande_id": cid,
                        "statut": "livree"}, 200
        return {"ok": False, "code": "introuvable",
                "erreur": f"commande {cid} introuvable"}, 404


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
        if chemin == "/catalogue":
            obj, code = m.get_catalogue(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/tourisme":
            qs = self._qs()
            obj, code = m.get_tourisme(qs.get("logement_id", ""),
                                       qs.get("categorie") or None)
            return _reponse(self, code, obj)
        if chemin == "/livret":
            obj, code = m.get_livret(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/commandes":
            obj, code = m.commandes(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/minibar":
            obj, code = m.get_minibar(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        if chemin == "/minibar-stock":
            obj, code = m.minibar_stock(self._qs().get("logement_id", ""))
            return _reponse(self, code, obj)
        return _reponse(self, 404, {"ok": False, "erreur": "route inconnue"})

    def do_POST(self):
        import urllib.parse as up
        chemin = up.urlsplit(self.path).path
        m = self.moteur
        p = self._corps()
        if chemin == "/commande":
            obj, code = m.commander(p)
            return _reponse(self, code, obj)
        if chemin == "/payer":
            obj, code = m.payer(p)
            return _reponse(self, code, obj)
        if chemin == "/livrer":
            obj, code = m.livrer(p)
            return _reponse(self, code, obj)
        if chemin == "/minibar-conso":
            obj, code = m.minibar_conso(p)
            return _reponse(self, code, obj)
        if chemin == "/minibar-reassort":
            obj, code = m.minibar_reassort(p)
            return _reponse(self, code, obj)
        return _reponse(self, 404, {"ok": False, "erreur": "route inconnue"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--extras", default="../extras")
    ap.add_argument("--tourisme", default="../tourisme")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()
    cfg = charger_yaml_plat(args.config)
    if not cfg.get("catalogue_cfg"):
        # Catalogue = bloc `extras:` du fichier --config lui-même (lecteur plat
        # ci-dessus ignore les lignes indentées — même bug que P6-4 évité).
        cfg["catalogue_cfg"] = args.config
    port = int(os.environ.get("LCD_HTTP_PORT") or cfg.get("http_port", 8098))
    bind = os.environ.get("LCD_BIND") or cfg.get("bind", "127.0.0.1")
    Handler.moteur = Extras(cfg, args.logements, args.extras, args.tourisme)
    if not args.serve:
        print(json.dumps({"ok": True, "port": port}, ensure_ascii=False))
        return
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"extras-upsell :8098 sur {bind}:{port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
