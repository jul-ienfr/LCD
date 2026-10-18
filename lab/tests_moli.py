#!/usr/bin/env python3
# lab/tests_moli.py — batterie de la box Moli virtuelle du lab (stdlib seule).
# ADR-007 / REQ-S-006 : runtime box pluggable (HA par défaut, Moli option,
# SaaS agnostique). Ici on prouve le contrat ADAPTATEUR tel qu'il devra être
# servi par n'importe quel runtime (§20.4) :
#   etat() / events() / commande() tracée / scénario() / santé,
#   + garde humaine (202 pending → PIN → approbation/refus) + surface MCP
#   agent (lecture + commandes bornées + 0 outil d'approbation).
# Box lab : profile compose `moli` (lab/box-moli/, villa upstream Apache-2.0,
# pilotes demo = 0 réseau, 0 hardware, état reseed à chaque recréation).
# Usage :  cd lab && docker compose --profile moli up -d --build moli-box
#          python3 tests_moli.py
# Teardown : docker compose --profile moli down -v
# Écrit 2026-10-17 (box Moli G4-c). Plan-only : cette batterie touche la box
# Moli de LAB seule — jamais un moteur, la passerelle, HA ou la box nord.
import socket
import sys
import threading
import time
from http.cookiejar import CookieJar

import json
import urllib.error
import urllib.request

MOLI = "http://127.0.0.1:8790"
# Windows : la console peut être cp1252 — la batterie s'affiche toujours.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
PIN = "246810"  # valeur FAUSSE de lab (docker-compose.yml MOLI_UI_PIN)
PROTEGEES = {"chambre de léa", "chambre de hugo", "sécurité"}
ECHECS = []

# Cookie jar global : la session humaine (PIN) doit traverser les _req().
JAR = CookieJar()
urllib.request.install_opener(
    urllib.request.build_opener(urllib.request.HTTPCookieProcessor(JAR)))


def check(nom, ok, detail=""):
    tag = "OK " if ok else "ÉCHEC"
    print(f"- {tag} {nom} {'' if ok else '| ' + str(detail)[:300]}")
    if not ok:
        ECHECS.append(nom)


def _req(method, chemin, corps=None, entetes=None):
    data = None
    entetes = dict(entetes or {})
    if corps is not None:
        data = json.dumps(corps, ensure_ascii=False).encode("utf-8")
        entetes.setdefault("content-type", "application/json")
    req = urllib.request.Request(MOLI + chemin, data=data, headers=entetes,
                                 method=method)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            br = r.read().decode("utf-8")
            try:
                return r.status, json.loads(br), dict(r.headers)
            except ValueError:
                return r.status, br, dict(r.headers)
    except urllib.error.HTTPError as e:
        br = e.read().decode("utf-8")
        try:
            return e.code, json.loads(br), dict(e.headers)
        except ValueError:
            return e.code, br, dict(e.headers)
    except Exception as e:  # serveur down
        return 0, str(e), {}


def commande(point, valeur, acteur, entetes=None):
    return _req("POST", "/api/command",
                {"point": point, "value": valeur, "actor": acteur}, entetes)


def mcp(outil, arguments=None):
    corps = {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
             "params": {"name": outil, "arguments": arguments or {}}}
    c, texte, _ = _req("POST", "/mcp", corps, {
        "accept": "application/json, text/event-stream"})
    if c == 200 and isinstance(texte, dict):
        res = texte.get("result", {})
        blocs = [b.get("text", "") for b in res.get("content", [])
                 if b.get("type") == "text"]
        if res.get("isError"):
            return "erreur", " ".join(blocs)
        for b in blocs:
            try:
                return "ok", json.loads(b)
            except ValueError:
                continue
        return "ok", " ".join(blocs)
    return f"http{c}", texte


class Sse:
    """Abonnement /api/events : collecte les (event, data) jusqu'au stop."""

    def __init__(self, secondes=12.0):
        self.secondes = secondes
        self.donnees = []
        self.lu = threading.Event()
        self.fin = threading.Event()

    def _run(self):
        try:
            req = urllib.request.Request(MOLI + "/api/events")
            with urllib.request.urlopen(req, timeout=self.secondes + 10) as r:
                even = None
                data = None
                fin = time.time() + self.secondes
                sock = r.fp.raw._sock if hasattr(r, "fp") else None
                if sock is not None:
                    sock.settimeout(self.secondes + 5)
                while time.time() < fin and not self.fin.is_set():
                    ligne = r.readline()
                    if not ligne:
                        break
                    ligne = ligne.decode("utf-8").strip()
                    if ligne.startswith("event:"):
                        even = ligne[6:].strip()
                    elif ligne.startswith("data:"):
                        data = ligne[5:].strip()
                    elif ligne == "" and data is not None:
                        try:
                            self.donnees.append(json.loads(data))
                        except ValueError:
                            self.donnees.append(data)
                        even, data = None, None
        except Exception:
            pass
        finally:
            self.lu.set()

    def start(self):
        threading.Thread(target=self._run, daemon=True).start()


def _salon_et_protege(devices):
    """(point binaire inscriptible salon, idem en pièce protégée)."""
    point_salon = point_protege = None
    for d in devices:
        label = d.get("label") or {}
        piece = (label.get("room") or d.get("native_room") or "").strip().lower()
        protege = piece in PROTEGEES
        for p in d.get("points", []):
            acces = p.get("access") or {}
            if not acces.get("write"):
                continue
            kind = (p.get("kind") or {}).get("type")
            if kind != "binary":
                continue
            pt = f"{d['id']}/{p['key']}"
            if protege and point_protege is None:
                point_protege = pt
            elif not protege and point_salon is None:
                point_salon = pt
    return point_salon, point_protege


def _etat_point(devices, point):
    """Valeur d'un point depuis GET /api/devices (state {clé: {value, ts}})."""
    devid, cle = point.split("/", 1)
    for d in devices:
        if d.get("id") == devid:
            s = (d.get("state") or {}).get(cle) or {}
            return s.get("value")
    return None


def _journal_fait(journal, **attendu):
    """1 entrée (origin, kind, point, actor, decision) parmi les dernières."""
    if not isinstance(journal, list):
        return False
    for e in journal:
        action = e.get("action") or {}
        outcome = e.get("outcome") or {}
        if attendu.get("origin") and e.get("origin") != attendu["origin"]:
            continue
        if attendu.get("kind") and action.get("kind") != attendu["kind"]:
            continue
        if attendu.get("point") and action.get("point") != attendu["point"]:
            continue
        if attendu.get("actor") and (e.get("actor") or "") != attendu["actor"]:
            continue
        if attendu.get("decision") and (action.get("decision")
                                        or outcome.get("decision")
                                        ) != attendu["decision"]:
            continue
        return True
    return False


def _journal():
    c, j, _ = _req("GET", "/api/journal?limit=25")
    return j


def main():
    print("== 80. box Moli : santé + pilotes demo (contrat health) ==")
    c, r, _ = _req("GET", "/api/health")
    check("80 : GET /api/health = 200 + name moli-os",
          c == 200 and isinstance(r, dict) and r.get("name") == "moli-os",
          f"HTTP {c}")
    if c != 200:
        _fin()
        return
    drivers = [d.get("kind") for d in (r.get("drivers") or [])]
    check("80 : pilotes demo chargés (hue+tuya+z2m présents)",
          {"hue", "tuya", "z2m"} <= set(drivers), str(drivers))
    c, sys_, _ = _req("GET", "/api/system")
    briques = {b.get("id"): b.get("active")
               for b in (sys_ or {}).get("bricks", [])} \
        if isinstance(sys_, dict) else {}
    check("80 : briques socle actives guard/history/automations/energy",
          bool(briques.get("guard")) and bool(briques.get("history"))
          and bool(briques.get("automations")) and bool(briques.get("energy")),
          str(briques))

    print("== 81. contrat etat() : snapshot devices + points inscriptibles ==")
    c, snap, _ = _req("GET", "/api/devices")
    devices = snap.get("devices", []) if isinstance(snap, dict) else []
    check("81 : GET /api/devices = 200 + >=50 appareils villa demo",
          c == 200 and len(devices) >= 50, f"HTTP {c} n={len(devices)}")
    salon, protege = _salon_et_protege(devices)
    check("81 : 1 point binaire inscriptible salon (pas protégé) trouvé",
          bool(salon), str(salon))
    check("81 : 1 point binaire inscriptible pièce protégée trouvé",
          bool(protege), str(protege))
    if not (salon and protege):
        _fin()
        return
    c, d, _ = _req("GET", f"/api/devices/{salon.split('/')[0]}")
    check("81 : GET /api/devices/{id} = 200 + state du point",
          c == 200 and salon.split("/", 1)[1] in (d.get("state") or {}),
          f"HTTP {c}")

    print("== 82. contrat commande() : ordre api 200 + journal tracé ==")
    avant = _etat_point(devices, salon)
    apres = (not avant) if isinstance(avant, bool) else True
    c, r, _ = commande(salon, apres, "lab-lcd-api")
    check("82 : POST /api/command origine api = 200 ok:true",
          c == 200 and isinstance(r, dict) and r.get("ok") is True,
          f"HTTP {c} {r}")
    time.sleep(0.6)
    c, snap, _ = _req("GET", "/api/devices")
    devices = snap.get("devices", [])
    check("82 : état appliqué (state = nouvelle valeur)",
          _etat_point(devices, salon) == apres,
          f"{_etat_point(devices, salon)} != {apres}")
    journal = _journal()
    check("82 : journal kind=command origin=api actor=lab-lcd-api outcome ok",
          _journal_fait(journal, origin="api", kind="command", point=salon,
                        actor="lab-lcd-api"), str(journal)[:200])
    check("82 : 0 fuite du PIN lab dans le journal",
            PIN not in json.dumps(journal, ensure_ascii=False), "fuite")

    print("== 83. contrat events() : SSE /api/events temps réel ==")
    sse = Sse(10.0)
    sse.start()
    time.sleep(1.5)  # le snapshot initial d'abord (0 perte : bus avant photo)
    c, r, _ = commande(salon, avant, "lab-lcd-sse")
    check("83 : commande pendant l'abonnement = 200", c == 200, f"HTTP {c}")
    sse.lu.wait(12.0)
    sse.fin.set()
    etats = [d for d in sse.donnees if isinstance(d, dict)
             and d.get("type") == "state" and d.get("point") == salon]
    journaux = [d for d in sse.donnees if isinstance(d, dict)
                and d.get("type") == "journal"]
    check("83 : SSE livré un event state du point (diifusion temps réel)",
          bool(etats) and etats[-1].get("value") == avant, f"{etats[:1]}")
    check("83 : SSE livré des events journal (journal en flux)",
          len(journaux) >= 1, f"n={len(journaux)}")

    print("== 84. garde pièce protégée : 202 pending → humain seule voie ==")
    avantp = _etat_point(devices, protege)
    c, r, _ = commande(protege, not avantp, "lab-lcd-agent")
    check("84 : ordre api en pièce protégée = 202 retenu (jamais exécuté)",
          c == 202 and isinstance(r, dict) and r.get("ok") is False
          and r.get("pending"), f"HTTP {c} {r}")
    pending = (r or {}).get("pending")
    time.sleep(0.4)
    check("84 : état inchangé tant que pas de décision humaine",
          _etat_point(snap.get("devices", []), protege) == avantp, "bougé")
    c, appos, _ = _req("GET", "/api/approvals")
    check("84 : GET /api/approvals liste la demande (id + point)",
          c == 200 and isinstance(appos, list)
          and any(e.get("id") == pending for e in appos), str(appos)[:120])
    # Un agent ne peut JAMAIS libérer son propre ordre :
    c, r, _ = _req("POST", f"/api/approvals/{pending}",
                   {"approve": True, "point": protege})
    check("84 : décision sans origine ui = 403 (humain dashboard seul)",
          c == 403, f"HTTP {c} {r}")
    # L'humain : session PIN (valeur lab) puis origine ui.
    c, r, _ = _req("POST", "/api/session", {"pin": PIN})
    check("84 : POST /api/session (pin lab) = 200 + human:true + cookie",
          c == 200 and isinstance(r, dict) and r.get("human") is True,
          f"HTTP {c} {r}")
    c, r, _ = _req("POST", f"/api/approvals/{pending}",
                   {"approve": True, "point": protege},
                   {"x-moli-origin": "ui"})
    check("84 : approbation humaine ui = 200 → l'ordre part",
          c == 200 and isinstance(r, dict) and r.get("ok") is True,
          f"HTTP {c} {r}")
    time.sleep(0.4)
    c, snap, _ = _req("GET", "/api/devices")
    check("84 : après approbation, état appliqué",
          _etat_point(snap.get("devices", []), protege) == (not avantp),
          "pas appliqué")
    journal = _journal()
    check("84 : journal trace l'approbation origin=ui decision=approved",
          _journal_fait(journal, origin="ui", kind="approval",
                        decision="approved"), "absente")
    # le refus est aussi possible (jamais silencieux) :
    c, r, _ = commande(protege, avantp, "lab-lcd-agent")
    if c == 202 and isinstance(r, dict) and r.get("pending"):
        c2, r2, _ = _req("POST", f"/api/approvals/{r['pending']}",
                         {"approve": False, "point": protege},
                         {"x-moli-origin": "ui"})
        journal = _journal()
        check("84 : refus humain = 200 + journal decision=denied",
              c2 == 200 and _journal_fait(journal, origin="ui",
                                          decision="denied"), f"HTTP {c2}")

    print("== 85. MCP : la surface agent (ce qu'un agent SaaS utiliserait) ==")
    niveau, res = mcp("system_status")
    check("85 : mcp system_status = ok + drivers + guard",
          niveau == "ok" and bool(res.get("drivers"))
          and isinstance(res.get("guard"), dict), f"{niveau} {res}")
    c, r, _ = _req("POST", "/mcp",
                   {"jsonrpc": "2.0", "id": 1, "method": "tools/list",
                    "params": {}},
                   {"accept": "application/json, text/event-stream"})
    noms = [t.get("name") for t in r.get("result", {}).get("tools") or []] \
        if isinstance(r, dict) else []
    attendus = {"list_devices", "send_command", "get_journal", "history",
                "list_automations", "save_automation_draft",
                "test_automation"}
    check("85 : tools/list contient les outils lecture/écriture clés",
          attendus <= set(noms), str(sorted(noms)))
    check("85 : 0 outil MCP d'approbation (humain seul au dashboard)",
          not [n for n in noms if "approv" in n.lower()], str(noms))
    niveau, lst = mcp("list_devices", {"room": "Salon"})
    check("85 : mcp list_devices room=Salon = appareils + points writable",
          niveau == "ok" and isinstance(lst, dict) and lst.get("count", 0) >= 1,
          f"{niveau} {lst}")
    devid = lst["devices"][0]["id"]
    cible = next((p["key"] for p in lst["devices"][0].get("points", [])
                  if p.get("writable")), None)
    etat_avant = next((p.get("value") for p in lst["devices"][0].get(
        "points", []) if p.get("key") == cible), None)
    niveau, res = mcp("send_command", {
        "point": f"{devid}/{cible}",
        "value": (not etat_avant) if isinstance(etat_avant, bool)
        else etat_avant,
        "actor": "lab-lcd-agent-mcp"})
    check("85 : mcp send_command acteur lab-lcd-agent-mcp = ok",
          niveau == "ok" and isinstance(res, dict) and res.get("ok") is True,
          f"{niveau} {res}")
    journal = _journal()
    check("85 : journal contient origin=mcp acteur=lab-lcd-agent-mcp",
          _journal_fait(journal, origin="mcp", point=f"{devid}/{cible}",
                        actor="lab-lcd-agent-mcp"), "absente")

    print("== 86. automatisations : draft jamais live, exécution à blanc, "
          "validation humaine à version exacte ==")
    nom_auto = f"lab-lcd-auto-{int(time.time())}"
    auto = {"name": nom_auto, "graph": {
        "nodes": [
            {"id": "m", "type": "when_state", "point": salon, "to": True},
            {"id": "s", "type": "set", "point": salon, "value": False},
        ],
        "edges": [{"from": "m", "port": "out", "to": "s"}],
    }}
    c, r, _ = _req("POST", "/api/automations", auto, {"x-moli-origin": "ui"})
    # Vue = {approved, live, fingerprint, automation{id,…}} (niveau racine).
    vu = r if isinstance(r, dict) else {}
    auto_obj = vu.get("automation") or {}
    aid, fp = auto_obj.get("id", ""), vu.get("fingerprint", "")
    check("86 : POST /api/automations = brouillon (approved:false, "
          "live:false)", c == 200 and vu.get("approved") is False
          and vu.get("live") is False and aid and fp, f"HTTP {c} {r}")
    c, r, _ = _req("POST", f"/api/automations/{aid}/test", None,
                   {"x-moli-origin": "ui"})
    check("86 : test à blanc = Run dry (étapes, rien n'agit)",
          c == 200 and isinstance(r, dict) and r.get("dry") is True
          and r.get("steps"), f"HTTP {c} {str(r)[:160]}")
    # validation = humain seul, version exacte (fingerprint) :
    c, r, _ = _req("POST", f"/api/automations/{aid}/approve",
                   {"fingerprint": fp}, {"x-moli-origin": "ui"})
    check("86 : approbation humaine version exacte = live:true",
          c == 200 and isinstance(r, dict) and r.get("live") is True,
          f"HTTP {c} {r}")
    # toute modification redevient un brouillon non validé :
    auto2 = dict(auto)
    auto2["graph"]["nodes"][1]["value"] = True
    c2, r2, _ = _req("PUT", f"/api/automations/{aid}", auto2,
                     {"x-moli-origin": "ui"})
    vu2 = r2 if isinstance(r2, dict) else {}
    check("86 : modif après validation → validation perdue (approved:false)",
          c2 == 200 and vu2.get("approved") is False
          and vu2.get("live") is False, f"HTTP {c2}")

    print("== 87. erreurs bornées : 404 inconnu, 403 lecture seule, "
          "422 hors bornes, 403 garde Host ==")
    c, r, _ = commande("demo:inconnu/on", True, "lab-lcd-err")
    check("87 : point inconnu = 404", c == 404, f"HTTP {c}")
    c, r, _ = commande(f"{salon.split('/')[0]}/color.x", 0.5, "lab-lcd-err")
    check("87 : point read-only = 403", c == 403, f"HTTP {c}")
    c, r, _ = commande(f"{salon.split('/')[0]}/brightness", 500.0,
                       "lab-lcd-err")
    check("87 : valeur hors spec (brightness > 100) = 422", c == 422,
          f"HTTP {c} {r}")
    csock = garde_host_cru("127.0.0.1", "maison.lexterne.fr")
    check("87 : garde Host anti-DNS-rebinding : Host inconnu = 403",
          csock == 403, f"retour {csock}")

    _fin()


def garde_host_cru(ip, host_forge):
    """HTTP/1.0 cru : Host forcé ≠ IP locale → la garde doit répondre 403."""
    try:
        s = socket.create_connection((ip, 8790), timeout=5)
        s.sendall(f"GET /api/health HTTP/1.0\r\nHost: {host_forge}\r\n\r\n"
                  .encode())
        data = s.recv(300)
        s.close()
        return int(data.split(b" ")[1]) if b" " in data else 0
    except Exception:
        return 0


def _fin():
    if ECHECS:
        print(f"RÉSULTAT : {len(ECHECS)} ÉCHEC(S) : {ECHECS}")
        sys.exit(1)
    print("RÉSULTAT : box Moli OK — santé + état + commande tracée + SSE + "
          "garde pièce protégée (202 pending → PIN → ui) + refus tracé + "
          "MCP (system_status, list_devices, send_command, 0 outil "
          "d'approbation) + automatisation draft/dry/fingerprint + bornes "
          "404/403/422 + garde Host. Contrat adaptateur REQ-S-006 servi.")


if __name__ == "__main__":
    main()
