#!/usr/bin/env python3
# custom/extras-upsell/extras.py — catalogue upsells + pré-commandes P6-5 (§5.6-ter).
# 0 € : stdlib seule. Même LXC/box que les 8 autres moteurs. Port :8098.
#
# Catalogue par logement (`extras_upsell: on`) : mini-bar honnêteté, late/early,
# kits, transfert, courses, petit-déj, conciergerie 100 % partenariat… prix TTC
# affichés avant résa (§12.2). Tout extra pré-commandé avant J-1 18h, payé
# d'avance, todo ménage auto (kit à installer, courses, déco, réassort mini-bar).
#
# Règles verrouillées en code :
#   - si `extras_upsell: off` : 503 extras_off (nuitée + ménage seuls) ;
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
#   POST /commande {logement_id, ref_resa, extras[{id, qte?, pers?}], qui}
#     -> 201 {commande_id, total_ttc, statut: a_payer, todo} (cut-off vérifié)
#   POST /payer {logement_id, commande_id, preuve, qui}
#     -> 200 {statut: payee} (todo ménage auto créable)
#   GET  /commandes?logement_id=log1 -> {commandes: [...]}
#   POST /livrer {logement_id, commande_id, qui} -> 200 {statut: livree}
#
# Usage : python3 extras.py --config config.yaml --logements ../logements.yaml
#   [--extras ../extras] [--serve]
#   env : LCD_HTTP_PORT, LCD_BIND, LCD_EXTRAS_DIR.
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
MODES_SANS_PAIEMENT = ("offert", "affiliation", "partenariat", "commission")

ID_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")


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


def lire_catalogue_cfg(path):
    """Catalogue `extras:` de la config (format `id: Nom | prix`)."""
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
            v = v.strip()
            mm = re.match(r"(.+?)\s*\|\s*([\d.]+)", v)
            if mm:
                extras[k.strip()] = {"nom": mm.group(1).strip(),
                                     "prix_ttc": float(mm.group(2))}
            else:
                extras[k.strip()] = {"nom": v.strip("\"'"),
                                     "prix_ttc": 0.0}
    return extras


class Extras:
    def __init__(self, cfg, logements_yaml, extras_dir):
        self.cfg = cfg
        self.logements_yaml = logements_yaml
        self.extras_dir = (os.environ.get("LCD_EXTRAS_DIR")
                           or extras_dir or "./extras")
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

    def catalogue(self, logement_id):
        """Fusion : catalogue config (prix) + flags logements.yaml (actif)."""
        feat = self._feat(logement_id)
        items = []
        for eid, e in self.catalogue_cfg.items():
            items.append({"id": eid, "nom": e["nom"],
                          "prix_ttc": e["prix_ttc"]})
        # Extras du bloc logements.yaml sans prix config = prix 0 (affiliation).
        for eid in feat.get("extras", {}):
            if eid not in self.catalogue_cfg:
                items.append({"id": eid, "nom": eid.replace("_", " "),
                              "prix_ttc": 0.0})
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

    def log_decision(self, logement_id, ref, qui, quoi, montant, motif):
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": "direct",
                 "commission": None, "net_hote": montant, "motif": motif}
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

    def _exige_paiement(self, eid):
        e = self.catalogue_cfg.get(eid, {})
        if eid == KIT_OFFERT:
            return False
        if float(e.get("prix_ttc") or 0) <= 0:
            return False
        return True

    # --- GET /catalogue ---
    def get_catalogue(self, logement_id):
        err = self._verif_flag(logement_id)
        if err:
            return err
        return {"ok": True, "logement_id": logement_id,
                "catalogue": self.catalogue(logement_id)}, 200

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
                          "paiement_requis": self._exige_paiement(eid)})
        total = round(total, 2)
        a_payer = any(i["paiement_requis"] for i in items)
        commandes = self._lire_toutes(logement_id)
        if commandes is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        cid = f"EXT-{dt.date.today():%Y%m%d}-{os.urandom(2).hex().upper()}"
        # Todo ménage auto : kits à installer + courses + déco + réassort.
        todo = sorted({i["id"] for i in items})
        # Ligne compta par extra : kit offert = charge « accueil », jamais du CA.
        compta = []
        for i in items:
            rubrique = "accueil" if i["id"] == KIT_OFFERT else "extras_ca"
            ht = round(i["montant_ttc"] / 1.2, 2)
            compta.append({"extra": i["id"], "rubrique": rubrique,
                           "ttc": i["montant_ttc"], "ht": ht,
                           "tva": round(i["montant_ttc"] - ht, 2),
                           "brouillon": True})
        cmd = {"commande_id": cid, "logement_id": logement_id,
               "ref_resa": ref_resa, "arrivee": arrivee,
               "items": items, "total_ttc": total,
               "statut": "validee" if not a_payer else "a_payer",
               "todo_menage": todo, "compta": compta,
               "cree_par": qui, "ts": utcnow_iso()}
        commandes.append(cmd)
        self._stocker_toutes(logement_id, commandes)
        self.log_decision(logement_id, ref_resa or cid, qui,
                          "extra_commande", total,
                          f"{cid}: {len(items)} extra(s), "
                          f"{'paiement avance requis' if a_payer else 'sans paiement'}")
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
        if not preuve:
            return {"ok": False, "code": "paiement_requis",
                    "erreur": "preuve de paiement d'avance requise "
                              "(Stripe/Swikly)"}, 402
        commandes = self._lire_toutes(logement_id)
        if commandes is None:
            return {"ok": False, "erreur": "logement_id invalide"}, 400
        for cmd in commandes:
            if cmd.get("commande_id") == cid:
                if cmd["statut"] == "payee":
                    return {"ok": True, "commande_id": cid,
                            "statut": "deja_payee"}, 200
                if cmd["statut"] == "validee":
                    return {"ok": True, "commande_id": cid,
                            "statut": "validee",
                            "note": "sans paiement (offert/affiliation)"}, 200
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
        if chemin == "/commandes":
            obj, code = m.commandes(self._qs().get("logement_id", ""))
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
        return _reponse(self, 404, {"ok": False, "erreur": "route inconnue"})


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--extras", default="../extras")
    ap.add_argument("--serve", action="store_true")
    args = ap.parse_args()
    cfg = charger_yaml_plat(args.config)
    if not cfg.get("catalogue_cfg"):
        # Catalogue = bloc `extras:` du fichier --config lui-même (lecteur plat
        # ci-dessus ignore les lignes indentées — même bug que P6-4 évité).
        cfg["catalogue_cfg"] = args.config
    port = int(os.environ.get("LCD_HTTP_PORT") or cfg.get("http_port", 8098))
    bind = os.environ.get("LCD_BIND") or cfg.get("bind", "127.0.0.1")
    Handler.moteur = Extras(cfg, args.logements, args.extras)
    if not args.serve:
        print(json.dumps({"ok": True, "port": port}, ensure_ascii=False))
        return
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"extras-upsell :8098 sur {bind}:{port}", flush=True)
    srv.serve_forever()


if __name__ == "__main__":
    main()
