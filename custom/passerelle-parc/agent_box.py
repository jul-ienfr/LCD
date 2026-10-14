#!/usr/bin/env python3
"""`custom/passerelle-parc/agent_box.py` — agent LOCAL de box, G4-b (§16.2).

Tourne SUR la box (jamais sur le VPS) : boucle 60 s qui lit les moteurs LOCAUX
(pricing `/reco-ota`, decision `/etat`) et pousse le résultat vers la passerelle
(`POST /ingest` + heartbeat). Python stdlib seule, 0 €.

Si la passerelle est injoignable, la box NE JETTE RIEN : chaque boucle écrit un
fichier `outbox/<box_id>/<ts>-<ref>.json` (atomique `tmp + os.replace`, jamais
de JSON tronqué), et le REJOUE au retour, idempotent par `ref` — la passerelle
rend la réponse stockée sous 24 h sans rappeler le moteur (§16.3).

Plafond : 500 fichiers/box (§16.2). Au-delà, on évince le REPORTING d'abord
(états, reco, digest — recalculables), le FINANCIER JAMAIS (prix, payout,
factures — de l'argent qui a bougé doit rester traçable).

Ordre de la boucle (un seul ordre possible, documenté pour être audité) :
  1. lire les moteurs locaux (prix appliqués + état) ;
  2. écrire la file outbox (toujours, même si la passerelle répond — la file
     est l'historique de ce que la centrale n'a PAS encore vu) ;
  3. tenter `POST /ingest` avec tout ce qui est en file ;
  4. marquer `rejoue` ce que la passerelle a accepté, `en_erreur` le reste.

La box NE TRANCHE JAMAIS un conflit : s'elle change un prix pendant que la
centrale en change un autre, les DEUX versions remontent, `last-writer-wins`
s'applique à la revue humaine (§16.2), jamais en silence.

Usage :
  python3 agent_box.py --config agent-box-lab.yaml        # une boucle (dry)
  python3 agent_box.py --config agent-box-lab.yaml --serve  # boucle 60 s
"""
import argparse
import json
import os
import sys
import time
import urllib.parse
import urllib.request

OUTBOX_PLAFOND = 500
INTERVALLE_S = 60


def charger_cfg(chemin):
    """Mini-parseur YAML plat (même discipline que le reste du socle)."""
    cfg = {}
    try:
        with open(chemin, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne or ":" not in ligne:
                    continue
                cle, val = ligne.split(":", 1)
                val = val.strip().strip('"').strip("'")
                try:
                    cfg[cle.strip()] = int(val)
                except ValueError:
                    cfg[cle.strip()] = val
    except OSError:
        pass
    return cfg


def appeler(methode, url, params=None, payload=None, timeout=8):
    """Appel JSON qui ne lève jamais. Retourne (code, dict)."""
    if not url:
        return 0, {"erreur": "endpoint absent"}
    if params:
        url = url + ("&" if "?" in url else "?") + \
            urllib.parse.urlencode(params)
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    try:
        req = urllib.request.Request(
            url, data=data, method=methode,
            headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except Exception as e:
        code = getattr(e, "code", 0) or 0
        try:
            return code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return code, {"erreur": str(e)[:120]}


def bouchee_atomic(chemin, obj):
    """Écriture atomique : `tmp + os.replace`, jamais de JSON tronqué."""
    tmp = chemin + ".tmp"
    try:
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(obj, f, ensure_ascii=False)
        os.replace(tmp, chemin)
        return True
    except OSError:
        return False


def lire_locaux(box_id, logements, endpoints):
    """Ce que la box SAIT (prix appliqués + état), lu sur les moteurs locaux."""
    boucle = {"box_id": box_id, "ts": int(time.time()), "logements": {}}
    for lid in logements:
        prix, etat = {}, {}
        c, r = appeler("GET",
                       str(endpoints.get("pricing", "") or "") + "/reco-ota",
                       {"logement_id": lid})
        if c == 200 and isinstance(r, dict):
            prix = {"grille_7j": r.get("grille_7j", [])}
        else:
            prix = {"erreur": "pricing:%s" % c}
        # G4-b : les prix APPLIQUES (vraies écritures PUT /prix) — c'est EUX
        # l'entité du conflit split-brain, pas la reco. La reco se recalcule ;
        # un prix appliqué, lui, a bougé de l'argent.
        c2, r2 = appeler(
            "GET", str(endpoints.get("pricing", "") or "") + "/appliques",
            {"logement_id": lid, "jours": "7"})
        if c2 == 200 and isinstance(r2, dict):
            prix["appliques"] = r2.get("appliques", [])
        else:
            prix["appliques_erreur"] = "appliques:%s" % c2
        c, r = appeler("GET",
                       str(endpoints.get("decision", "") or "") + "/etat",
                       {"logement_id": lid})
        if c == 200 and isinstance(r, dict):
            etat = {"copro_verifiee": r.get("copro_verifiee"),
                    "config_ok": r.get("config_ok"),
                    "alertes": r.get("alertes", []),
                    "bornes_prix": r.get("bornes_prix")}
        else:
            etat = {"erreur": "decision:%s" % c}
        boucle["logements"][lid] = {"prix": prix, "etat": etat}
    return boucle


def enfiler(dossier, boucle):
    """Ajoute la boucle à la file, atomique. Retourne (nom_fichier, evince)."""
    try:
        os.makedirs(dossier, exist_ok=True)
        existants = sorted(n for n in os.listdir(dossier)
                           if n.endswith(".json"))
    except OSError:
        return None, None
    # Plafond 500 : éviction du REPORTING d'abord (§16.2). Les boucles sont
    # du reporting pur (états, reco — recalculables) ; les actions de la file
    # (prix, payout) ne sont JAMAIS évincées ici.
    evince = None
    while len(existants) >= OUTBOX_PLAFOND:
        evince = existants.pop(0)
        try:
            os.remove(os.path.join(dossier, evince))
        except OSError:
            evince = None
            break
    nom = "%s-%s.json" % (boucle["ts"], boucle["box_id"])
    if bouchee_atomic(os.path.join(dossier, nom), boucle):
        return nom, evince
    return None, evince


def pousser(passerelle_url, box_id, dossier, timeout=8):
    """Envoie toute la file à `/ingest`. Retourne (acceptes, erreurs)."""
    try:
        noms = sorted(n for n in os.listdir(dossier)
                      if n.endswith(".json"))
    except OSError:
        return 0, [{"fichier": "-", "erreur": "outbox illisible"}]
    acceptes, erreurs = 0, []
    for nom in noms:
        chemin = os.path.join(dossier, nom)
        try:
            with open(chemin, encoding="utf-8") as f:
                boucle = json.load(f)
        except (ValueError, OSError):
            erreurs.append({"fichier": nom, "erreur": "json illisible"})
            continue
        code, rep = appeler("POST", passerelle_url.rstrip("/") + "/ingest",
                            None,
                            {"box_id": box_id, "boucle": boucle},
                            timeout=timeout)
        if code == 200 and isinstance(rep, dict) and rep.get("accepte"):
            try:
                os.remove(chemin)
            except OSError:
                pass
            acceptes += 1
        else:
            erreurs.append({"fichier": nom, "code": code,
                            "erreur": str(rep)[:120]})
            break                     # on s'arrête au premier refus : la
            # centrale est peut-être revenue entre-temps, mais on ne mitraille
            # pas — la boucle suivante re-tentera dans 60 s.
    return acceptes, erreurs


def boucle(cfg):
    """Une boucle : lire, enfiler, pousser, heartbeat. Retourne le résumé."""
    box_id = str(cfg.get("box_id", "")).strip()
    logements = [str(x).strip() for x in
                 str(cfg.get("logements", "")).split(",") if str(x).strip()]
    endpoints = {"pricing": cfg.get("pricing_url", ""),
                 "decision": cfg.get("decision_url", "")}
    dossier = str(cfg.get("outbox_dir", "")).strip() or \
        os.path.join(".", "outbox", box_id)
    boucle_locale = lire_locaux(box_id, logements, endpoints)
    nom, evince = enfiler(dossier, boucle_locale)
    acceptes, erreurs = pousser(str(cfg.get("passerelle_url", "") or ""),
                                box_id, dossier)
    # Heartbeat : la centrale sait que la box est VIVANTE même si sa file est
    # vide (sinon « file vide » = « box muette », et `box_down` sonnerait).
    code, _ = appeler("POST",
                      str(cfg.get("passerelle_url", "") or "").rstrip("/")
                      + "/heartbeat", None, {"box_id": box_id})
    return {"box_id": box_id, "fichier": nom, "evince": evince,
            "rejoue": acceptes,
            "erreurs": erreurs, "heartbeat": code,
            "ts": boucle_locale["ts"]}


def main():
    ap = argparse.ArgumentParser(description="agent local de box G4-b")
    ap.add_argument("--config", default="agent-box.yaml")
    ap.add_argument("--serve", action="store_true",
                    help="boucle 60 s (sinon : une seule boucle)")
    args = ap.parse_args()
    cfg = charger_cfg(args.config)
    if not str(cfg.get("box_id", "")).strip():
        print("box_id requis (config agent-box)", file=sys.stderr)
        return 2
    if not args.serve:
        print(json.dumps(boucle(cfg), ensure_ascii=False))
        return 0
    print("agent_box %s : boucle %ss" % (cfg.get("box_id"), INTERVALLE_S),
          flush=True)
    while True:
        try:
            resume = boucle(cfg)
            print(json.dumps(resume, ensure_ascii=False), flush=True)
        except Exception as e:                     # la boucle ne meurt jamais
            print(json.dumps({"erreur": str(e)[:120]}), flush=True)
        time.sleep(INTERVALLE_S)


if __name__ == "__main__":
    raise SystemExit(main())
