#!/usr/bin/env python3
# lab/tests_lab.py — batterie de tests du lab Docker LCD (stdlib seule).
# P2-14 : tunnel direct <60 s + conflit ICS + bornes 75/290 inviolables.
# Usage : cd lab && docker compose up -d --build && python3 tests_lab.py
# Teardown : docker compose down -v
import json
import sys
import time
import urllib.parse
import urllib.request

BASE = {
    "ics": "http://127.0.0.1:8090",
    "pricing": "http://127.0.0.1:8091",
    "decision": "http://127.0.0.1:8092",
    "facturation": "http://127.0.0.1:8093",
    "caution": "http://127.0.0.1:8094",
    "booking": "http://127.0.0.1:8095",
}
ECHECS = []


def get(moteur, chemin):
    req = urllib.request.Request(BASE[moteur] + chemin, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            ct = r.headers.get("Content-Type", "")
            corps = r.read().decode("utf-8")
            if "json" in ct:
                return r.status, json.loads(corps)
            return r.status, corps
    except Exception as e:
        code = getattr(e, "code", None) or 0
        try:
            return code, e.read().decode("utf-8")
        except Exception:
            return code, str(e)


def post(moteur, chemin, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BASE[moteur] + chemin, data=data,
                                 headers={"Content-Type": "application/json"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except Exception as e:
        code = getattr(e, "code", None) or 0
        try:
            return code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return code, {"erreur": str(e)}


def check(nom, cond, detail=""):
    print(f"[{'OK' if cond else 'KO'}] {nom}" + (f" — {detail}" if detail else ""))
    if not cond:
        ECHECS.append(nom)


print("== 1. health des 6 moteurs ==")
for m in BASE:
    code, obj = get(m, "/health")
    check(f"health {m}", code == 200, f"HTTP {code} {obj}")

print("== 2. bornes prix 75/290 (P2-5 §3) ==")
code, px = get("pricing", "/prix?" + urllib.parse.urlencode(
    {"logement_id": "log1", "date": "2026-08-15"}))
pivot = (px.get("pivot") if isinstance(px, dict) else None)
check("pivot août dans [75,290]", code == 200 and pivot is not None
      and 75 <= float(pivot) <= 290, f"HTTP {code} pivot={pivot}")

print("== 3. garde-fou copro verifiee (P2-16 §12.1-bis) ==")
code, cat = get("booking", "/catalogue?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
check("catalogue lab copro_verifiee=true", code == 200
      and isinstance(cat, dict) and cat.get("copro_verifiee") is True,
      f"HTTP {code} {cat}")

print("== 4. tunnel direct <60 s : devis -> brouillon -> confirmer (P2-14) ==")
t0 = time.time()
code, dv = post("booking", "/devis", {"logement_id": "log1",
                                      "debut": "2026-11-10", "fin": "2026-11-12",
                                      "voyageurs": 2, "extras": ["petit_dej"]})
check("devis 200 + total_ttc", code == 200 and isinstance(dv, dict)
      and dv.get("total_ttc", 0) > 0, f"HTTP {code} {dv}")
ref = f"LAB-{int(time.time())}"
code, br = post("booking", "/resa", {"logement_id": "log1",
                                     "debut": "2026-11-10", "fin": "2026-11-12",
                                     "voyageurs": 2, "extras": ["petit_dej"],
                                     "ref": ref})
check("brouillon 201", code == 201 and br.get("ref") == ref,
      f"HTTP {code} {br}")
code, cf = post("booking", "/confirmer", {"logement_id": "log1", "ref": ref,
                                          "qui": "test-lab-humain"})
duree = time.time() - t0
check("confirmation 201 + <60 s", code == 201 and duree < 60,
      f"HTTP {code} {cf} en {duree:.1f} s")

print("== 5. conflit ICS : 2e résa mêmes dates = refus (P2-14) ==")
code, br2 = post("booking", "/resa", {"logement_id": "log1",
                                      "debut": "2026-11-10", "fin": "2026-11-12",
                                      "voyageurs": 2, "ref": ref + "-BIS"})
deja = (code == 200 and br2.get("statut") == "deja_enregistree")
if code in (200, 201) and not deja:
    ref2 = br2.get("ref", ref + "-BIS")
    code2, cf2 = post("booking", "/confirmer", {"logement_id": "log1",
                                                "ref": ref2,
                                                "qui": "test-lab-humain"})
    check("2e confirmation mêmes dates refusée", code2 not in (200, 201),
          f"HTTP {code2} {cf2}")
else:
    check("2e résa mêmes dates refusée ou déjà enregistrée",
          code not in (200, 201) or deja, f"HTTP {code} {br2}")

print("== 6. garde-fous : confirmer auto + débit auto refusés ==")
code, cf3 = post("booking", "/confirmer", {"logement_id": "log1", "ref": ref,
                                           "qui": "auto"})
check("confirmer qui=auto refusé (1-tap humaine)",
      code == 400, f"HTTP {code} {cf3}")
code, db = post("caution", "/debiter", {"logement_id": "log1", "ref": "X",
                                        "montant": 100, "qui": "auto"})
check("débit caution qui=auto refusé", code == 400, f"HTTP {code} {db}")

print("== 7. taxe CASA +44 % (P2-11 §12.5, POST /taxe) ==")
code, tx = post("caution", "/taxe", {"logement_id": "log1", "ref_resa": ref,
                                     "canal": "direct", "classe": 3,
                                     "prix_nuitee": 110, "adultes": 2, "nuits": 2})
check("taxe 200", code == 200, f"HTTP {code} {tx}")

print()
if ECHECS:
    print(f"RÉSULTAT : {len(ECHECS)} ÉCHEC(S) : {ECHECS}")
    sys.exit(1)
print("RÉSULTAT : lab OK — tunnel <60 s + conflit + bornes + garde-fous.")
