#!/usr/bin/env python3
# lab/tests_runtime.py — batterie de l'adaptateur runtime box v0 (stdlib).
# ADR-007 / REQ-S-006 : le SaaS doit gérer HA ET Moli avec LE MÊME contrat.
# Ici on prouve que le contrat adaptateur (custom/runtime-box/runtime.py)
# répond de la même forme sur les 2 runtimes du lab :
#     health / etat / commande tracée / journal / refus hors mapping.
# Mappage objet_logique -> points natifs : lab seule (fixtures demo Moli +
# entités HA de test), v0 ; l'assemblage aux moteurs reste P2+ (plan-only).
# Usage :  cd lab && docker compose up -d            (socle + HA virtuelle)
#          docker compose --profile moli up -d moli-box
#          python3 tests_runtime.py
# Teardown : docker compose --profile moli down -v
import base64
import hashlib
import hmac
import json
import sys
import time
import urllib.request
from urllib.error import HTTPError

import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..",
                                "custom", "runtime-box"))
import runtime as rt  # noqa: E402  (module contrat adaptateur)

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HA_URL = "http://127.0.0.1:8123"
MOLI_URL = "http://127.0.0.1:8790"
# Faux secrets de lab : HA = JWT forgé (bootstrap, valeurs jetables),
# Moli = PIN FAUX (docker-compose.yml MOLI_UI_PIN). Jamais de vraie clé
# ici — en box réelle : Bearer HA + session Moli depuis le vault seul.
HA_REFRESH_ID = "6c6162326f782d7669727475616c2d02"
HA_JWT_KEY = "6c61622d7669727475616c2d6a77742d6c61622d30312d6c61622d3032"
PIN_MOLI = "246810"
ECHECS = []

# Le MÊME objet_logique peut pointer 2 runtimes : points natifs DISTINCTS.
CONFIG = {"runtimes": {
    "ha": {"base": HA_URL,
           "mapping": {"objet_logique_ecrit": "input_text.lcd_runtime_test",
                       "sensor_prix": "sensor.log1_prix_nuit"}},
    "moli": {"base": MOLI_URL,
             "mapping": {"objet_logique_ecrit": "hue:lampadaire-salon/on",
                         "capteur_salon": "z2m:presence-salon/occupancy"}},
}}
PROTEGE = "hue:lampe-lea/on"       # Chambre de Léa = pièce protégée (villa)

OBJET = "objet_logique_ecrit"
ACTEUR = "lab-lcd-runtime-batt"


def check(nom, ok, detail=""):
    print(f"- {'OK ' if ok else 'ÉCHEC'} {nom} {'' if ok else '| '
          + str(detail)[:300]}")
    if not ok:
        ECHECS.append(nom)


def _b64url(o):
    return base64.urlsafe_b64encode(json.dumps(o).encode()).rstrip(
        b"=").decode()


def _jeton_lab(duree_s=900):
    now = int(time.time())
    head = _b64url({"alg": "HS256", "typ": "JWT"})
    pay = _b64url({"iss": HA_REFRESH_ID, "iat": now, "exp": now + duree_s})
    sig = base64.urlsafe_b64encode(
        hmac.new(HA_JWT_KEY.encode(), f"{head}.{pay}".encode(),
                 hashlib.sha256).digest()).rstrip(b"=").decode()
    return f"{head}.{pay}.{sig}"


def _get_json(url):
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            brut = r.read().decode("utf-8", "replace")
            try:
                return r.status, json.loads(brut)
            except ValueError:
                return r.status, brut
    except HTTPError as e:
        brut = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(brut)
        except ValueError:
            return e.code, brut
    except Exception as e:
        return 0, str(e)


def _post_json(url, corps, headers=None):
    entetes = {"Content-Type": "application/json"}
    entetes.update(headers or {})
    req = urllib.request.Request(url, data=json.dumps(corps).encode(),
                                 headers=entetes, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            brut = r.read().decode("utf-8", "replace")
            try:
                return r.status, json.loads(brut)
            except ValueError:
                return r.status, brut
    except HTTPError as e:
        brut = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(brut)
        except ValueError:
            return e.code, brut
    except Exception as e:
        return 0, str(e)


def _ha_json(chemin):
    """Lecture HA avec le JWT lab forgé (mêmes VALEURS JETABLES que le
    socle — fausse clé ha-bootstrap, jamais une vraie)."""
    c, j = _get_json_auth(HA_URL + chemin,
                          {"Authorization": "Bearer " + _jeton_lab()})
    return c, j


def _get_json_auth(url, headers):
    req = urllib.request.Request(url, headers=dict(headers or {}))
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            brut = r.read().decode("utf-8", "replace")
            try:
                return r.status, json.loads(brut)
            except ValueError:
                return r.status, brut
    except HTTPError as e:
        brut = e.read().decode("utf-8", "replace")
        try:
            return e.code, json.loads(brut)
        except ValueError:
            return e.code, brut
    except Exception as e:
        return 0, str(e)


def _moli_etat(point):
    c, d = _get_json(MOLI_URL + "/api/devices/" + point.split("/")[0])
    if c != 200 or not isinstance(d, dict):
        return None
    ech = (d.get("state") or {}).get(point.split("/", 1)[1]) or {}
    return ech.get("value")


def _moli_journal(limit=30):
    """Journal plat : point remonté au niveau entrée (action.point)."""
    c, j = _get_json(MOLI_URL + f"/api/journal?limit={limit}")
    if isinstance(j, list):
        for e in j:
            if isinstance(e, dict) and not e.get("point"):
                a = e.get("action") or {}
                e["point"] = a.get("point")
                e.setdefault("kind", a.get("kind"))
    return j if isinstance(j, list) else []


def main():
    print("== 90. adaptateur : health uniforme sur les 2 runtimes ==")
    map_ha = CONFIG["runtimes"]["ha"]["mapping"]
    map_moli = CONFIG["runtimes"]["moli"]["mapping"]
    ha = rt.RuntimeAdapter(rt.HaBackend(HA_URL, token_provider=_jeton_lab),
                           map_ha, "ha")
    moli = rt.RuntimeAdapter(rt.MoliBackend(MOLI_URL, pin=PIN_MOLI),
                             map_moli, "moli")
    h_ha, h_moli = ha.health(), moli.health()
    check("90 : HA health via adaptateur = ok + version",
          h_ha.get("ok") is True and bool(h_ha.get("version")), str(h_ha))
    check("90 : Moli health via adaptateur = ok + version",
          h_moli.get("ok") is True and bool(h_moli.get("version")),
          str(h_moli))
    check("90 : forme health identique (clés backend/ok/version)",
          set(h_ha) == set(h_moli) == {"backend", "ok", "version"},
          f"{set(h_ha)} vs {set(h_moli)}")

    print("== 91. contrat etat() : même forme sur les 2 backends ==")
    # HA : l'entité de test peut ne pas exister avant la 1re écriture —
    # on la crée via le contrat au besoin (déterministe entre les runs).
    e_ha = ha.etat(OBJET)
    if e_ha.get("value") is None:
        ha.commande(OBJET, f"probe-{int(time.time())}", ACTEUR)
        time.sleep(0.4)
        e_ha = ha.etat(OBJET)
    e_moli = moli.etat(OBJET)
    check("91 : HA etat = {backend, point, value non nul, ts}",
          e_ha.get("backend") == "ha" and e_ha.get("value") is not None,
          str(e_ha))
    check("91 : Moli etat = {backend, point, value non nul, ts}",
          e_moli.get("backend") == "moli" and e_moli.get("value") is not None,
          str(e_moli))
    check("91 : forme etat identique (clés backend/point/value/ts)",
          set(e_ha) == set(e_moli) == {"backend", "point", "value", "ts"},
          f"{set(e_ha)} vs {set(e_moli)}")

    print("== 92. contrat commande() : écriture tracée des 2 côtés ==")
    val = f"lab-{int(time.time())}"
    c_ha = ha.commande(OBJET, val, ACTEUR)
    check("92 : HA commande = status ok", c_ha.get("status") == "ok",
          str(c_ha))
    time.sleep(0.5)
    check("92 : HA relit la valeur écrite (état appliqué)",
          str(ha.etat(OBJET).get("value")) == val,
          f"{ha.etat(OBJET)} != {val}")
    c_moli = moli.commande(OBJET, True, ACTEUR)
    check("92 : Moli commande = status ok (point salon non protégé)",
          c_moli.get("status") == "ok", str(c_moli))
    time.sleep(0.5)
    check("92 : Moli relit la valeur écrite (état appliqué)",
          moli.etat(OBJET).get("value") is True,
          str(moli.etat(OBJET)))
    check("92 : forme commande identique (backend/point/value/status/actor)",
          set(c_ha) == set(c_moli) == {"backend", "point", "value",
                                       "status", "actor"},
          f"{set(c_ha)} vs {set(c_moli)}")

    print("== 93. contrat journal() : chaque écriture laisse une trace ==")
    j_ha = []
    pt_ha, pt_moli = map_ha[OBJET], map_moli[OBJET]
    for _ in range(8):
        j_ha = ha.journal(OBJET, 25)
        if isinstance(j_ha, list) and any(e.get("point") == pt_ha
                                          for e in j_ha):
            break
        # recorder HA : la ligne logbook peut COMMITter qq secondes
        # après l'écriture (HA fraîche) — sonde bornée, jamais infinie.
        time.sleep(3)
    check("93 : HA journal contient l'état écrit (logbook point+value)",
          isinstance(j_ha, list) and any(e.get("point") == pt_ha
                                         for e in j_ha),
          f"n={len(j_ha)}")
    j_moli = moli.journal(limit=30)
    check("93 : HA journal contient l'état écrit (logbook point+value)",
          isinstance(j_ha, list) and any(
              e.get("point") == pt_ha for e in j_ha),
          f"n={len(j_ha)}")
    check("93 : Moli journal contient l'écriture (origin api actor "
          + ACTEUR + ")", isinstance(j_moli, list) and any(
              e.get("point") == pt_moli and e.get("origin") == "api"
              and e.get("actor") == ACTEUR for e in j_moli),
          f"n={len(j_moli)}")
    check("93 : forme journal identique (ts/point/kind/value/decision "
          "présents des 2 côtés)",
          isinstance(j_moli, list) and isinstance(j_ha, list)
          and j_moli and j_ha
          and {"ts", "point", "kind", "value", "decision"} <= set(j_moli[0])
          and {"ts", "point", "kind", "value", "decision"} <= set(j_ha[0]),
          f"moli={list(j_moli[:1])} ha={list(j_ha[:1])}")

    print("== 94. refus uniforme hors mapping : aucun réseau ne part ==")
    r_ha = ha.commande("objet_inconnu", 1, ACTEUR)
    r_moli = moli.commande("objet_inconnu", 1, ACTEUR)
    check("94 : HA refuse hors mapping localement",
          r_ha.get("status") == "refuse"
          and "hors mapping" in str(r_ha.get("erreur", "")), str(r_ha))
    check("94 : Moli refuse hors mapping localement",
          r_moli.get("status") == "refuse"
          and "hors mapping" in str(r_moli.get("erreur", "")), str(r_moli))

    print("== 95. garde humaine via le contrat : pièce protégée = retenu ==")
    map_moli2 = dict(map_moli)
    map_moli2["objet_logique_protect"] = PROTEGE
    moli2 = rt.RuntimeAdapter(rt.MoliBackend(MOLI_URL, pin=PIN_MOLI),
                              map_moli2, "moli")
    c2 = moli2.commande("objet_logique_protect", True, "lab-lcd-agent")
    check("95 : Moli pièce protégée via adaptateur = status retenu (202)",
          c2.get("status") == "retenu" and c2.get("pending"), str(c2))

    print("== 96. moteur branché : decision-moli :8280 = même contrat E2E "
          "(moteur -> adaptateur -> box Moli) ==")
    c, h = _get_json("http://127.0.0.1:8280/health")
    check("96 : decision-moli health = 200 ok (même API que decision HA)",
          c == 200 and isinstance(h, dict) and h.get("ok") is True,
          f"HTTP {c} {h}")
    val_ok = _moli_etat("maison:config_ok/on")
    check("96 : config_ok poussé par le MOTEUR au boot (--check) = true "
          "sur la box Moli (état appliqué)", val_ok is True, str(val_ok))
    j_moli = _moli_journal(40)
    check("96 : journal Moli : origin api + actor decision-engine + "
          "point maison:config_ok/on",
          isinstance(j_moli, list) and any(
              e.get("origin") == "api" and e.get("actor") == "decision-engine"
              and (e.get("point") or (e.get("action") or {}).get("point")) ==
              "maison:config_ok/on" for e in j_moli),
          f"n={len(j_moli) if isinstance(j_moli, list) else j_moli}")
    # le refus hors mapping (logtmp, pas de point dédié) est vu côté box
    # par l'ABSENCE d'écriture (0 réseau) et, côté moteur, sobrement
    # loggé par l'adaptateur (jamais silencieux, jamais de crash).

    print("== 97. runtime PAR LOGEMENT : un moteur, les 2 box (ADR-007 "
          "priorité config > env) ==")
    # decision-moli :8280 + lab-config/logements.moli.yaml :
    # log1 (yaml `runtime: moli`) -> box Moli ; log2 (sans clé) -> HA.
    val_ok2 = _moli_etat("maison:config_ok/on")
    check("97 : log1 (yaml runtime: moli) reçu par la BOX MOLI (config_ok "
          "= true)", val_ok2 is True, str(val_ok2))
    c, b2 = _ha_json("/api/states/input_boolean.log2_copro_verifiee")
    for _ in range(9):
        if isinstance(b2, dict) and b2.get("state") == "on":
            break
        # l'entité canonique peut être RE-ENREGISTRÉE par un restart HA
        # fait IN-TEST (offline P8-4, stop/start) : sonde bornée.
        time.sleep(4)
        c, b2 = _ha_json("/api/states/input_boolean.log2_copro_verifiee")
    check("97 : log2 (SANS clé yaml -> défaut ha) reçu par la BOX HA via "
          "l'entité canonique (on, packages §2.8-bis)",
          c == 200 and isinstance(b2, dict) and b2.get("state") == "on",
          f"HTTP {c} {b2}")
    c, s2 = _ha_json("/api/states/sensor.log2_config_ok")
    for _ in range(9):
        if isinstance(s2, dict) and s2.get("state") == "on":
            break
        # le template dérive de l'entité canonique — même sonde.
        time.sleep(4)
        c, s2 = _ha_json("/api/states/sensor.log2_config_ok")
    check("97 : le template dérive sensor.log2_config_ok = on",
          c == 200 and isinstance(s2, dict) and s2.get("state") == "on",
          f"HTTP {c} {s2}")
    # Priorité CONFIG > env : log2 n'a PAS de point moli dans la map
    # (moli= log1 seul) et le refus éventuel n'apparaît PAS sur la box.
    j_moli97 = _moli_journal(50)
    check("97 : 0 écriture decision-engine sur la box Moli pour log2 "
          "(le yaml décide, jamais l'env — refus local si mapping absent)",
          isinstance(j_moli97, list) and all(
              not ((e.get("actor") == "decision-engine")
                   and (e.get("point") in ("log2_config_ok", "log2")))
              for e in j_moli97), f"n={len(j_moli97)}")
    eq97 = {"type": "lcd_j2_envoi_acces", "logement_id": "log1",
            "qui": "personne_01", "ref": "LAB-RT97", "data": {"langue": "fr"}}
    c, r97 = _post_json("http://127.0.0.1:8280/event", eq97)
    check("97 : event moli log1 = 202 loge_sans_ha + runtime moli (bus "
          "events = canal HA, v0 exemple jamais push silencieux)",
          c == 202 and isinstance(r97, dict)
          and r97.get("runtime") == "moli"
          and r97.get("statut") == "loge_sans_ha", f"HTTP {c} {r97}")

    print("== 98. multi-box P3 : box Moli NORD 8791 + decision-nord :8192 "
          "(log3 runtime moli = 1 logement = 1 box) ==")
    MOLI_NORD_URL = "http://127.0.0.1:8791"
    c, h = _get_json(MOLI_NORD_URL + "/api/health")
    check("98 : box Moli NORD health = 200 moli-os (image identique, "
          "état SÉPARÉ)",
          c == 200 and isinstance(h, dict) and h.get("name") == "moli-os"
          and bool(h.get("version")), f"HTTP {c} {h}")
    c, n3 = _get_json(MOLI_NORD_URL + "/api/devices/"
                      "maison:config_ok")
    val3 = ((n3 or {}).get("state") or {}).get("on", {}).get("value")
    for _ in range(9):
        if val3 is True:
            break
        # le decision-nord boote en PARALLÈLE : son push --check réitère
        # (borné côté moteur) — la box finit par refléter.
        time.sleep(4)
        c, n3 = _get_json(MOLI_NORD_URL + "/api/devices/"
                          "maison:config_ok")
        val3 = ((n3 or {}).get("state") or {}).get("on", {}).get("value")
    check("98 : decision-nord (log3, yaml runtime: moli) a pousse "
          "config_ok = true sur SA box (pas celle du lab)",
          c == 200 and val3 is True, f"HTTP {c} val={val3}")
    jn = []
    for _ in range(9):
        c, jn = _get_json(MOLI_NORD_URL + "/api/journal?limit=25")
        if isinstance(jn, list) and any(
                e.get("actor") == "decision-engine" for e in jn):
            break
        time.sleep(4)
    pts_nord = [((e.get("action") or {}).get("point"))
                for e in (jn if isinstance(jn, list) else [])
                if (e.get("actor") == "decision-engine")]
    check("98 : journal box NORD : origin api + actor decision-engine",
          isinstance(jn, list)
          and any(e.get("origin") == "api"
                  and e.get("actor") == "decision-engine"
                  for e in jn), f"n={len(jn)}")
    c, jlab = _get_json(MOLI_URL + "/api/journal?limit=60")
    p_lab_moli = {((e.get("action") or {}).get("point"))
                  for e in (jlab if isinstance(jlab, list) else [])
                  if e.get("actor") == "decision-engine"}
    check("98 : isolation : la box du lab n'a AUCUN point de decision-nord "
          "(p Dans lab = {maison:config_ok/on} SEUL)",
          isinstance(jlab, list)
          and p_lab_moli <= {"maison:config_ok/on"},
          f"lab points={sorted(p_lab_moli)}")
    c, dn = _get_json("http://127.0.0.1:8192/health")
    check("98 : decision-nord health = 200 (même API, runtime mixte "
          "multi-box au socle)",
          c == 200 and isinstance(dn, dict) and dn.get("ok") is True,
          f"HTTP {c} {dn}")
    c, gway = _get_json("http://127.0.0.1:8443/v1/statut")
    _etat70 = (gway or {}).get("etat") if isinstance(gway, dict) else {}
    check("98 : passerelle parc voit toujours 3 logements (log3 sur SA box "
          "Moli sans compter une 4e unité)",
          c == 200 and isinstance(gway, dict)
          and _etat70.get("nb_logements") == 3
          and _etat70.get("nb_boxes") == 2,
          f"HTTP {c} etat={_etat70}")

    if ECHECS:
        _aff(f"RÉSULTAT : {len(ECHECS)} ÉCHEC(S) : {ECHECS}")
        sys.exit(1)
    _aff("RÉSULTAT : adaptateur runtime-box v0 OK — health + etat + "
         "commande tracée + journal de forme identique sur HA et Moli ; "
         "refus uniforme hors mapping (0 réseau) ; garde humaine "
         "(retenu pièce protégée). REQ-S-006 : le même contrat sert "
         "les 2 runtimes.")


def _aff(m):
    print(m)


if __name__ == "__main__":
    main()
