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
    "dispatch": "http://127.0.0.1:8096",
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


def _aff(txt):
    try:
        print(txt)
    except UnicodeEncodeError:
        print(txt.encode("ascii", "replace").decode("ascii"))


def check(nom, cond, detail=""):
    _aff(f"[{'OK' if cond else 'KO'}] {nom}" + (f" — {detail}" if detail else ""))
    if not cond:
        ECHECS.append(nom)


print("== 1. health des 7 moteurs ==")
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

print("== 7. taxe séjour Métropole NCA (P2-11 §12.5, POST /taxe) ==")
code, tx = post("caution", "/taxe", {"logement_id": "log1", "ref_resa": ref,
                                     "canal": "direct", "classe": 3,
                                     "prix_nuitee": 110, "adultes": 2, "nuits": 2})
check("taxe 200", code == 200, f"HTTP {code} {tx}")

print("== 8. dispatch prestataires + sinistre (P6-8 §12.4-bis) ==")
code, an = get("dispatch", "/annuaire?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
prestataires = an.get("prestataires", []) if isinstance(an, dict) else []
statuts = {p.get("id"): p.get("statut") for p in prestataires}
check("annuaire log1 200 + RC expiree suspendue",
      code == 200 and statuts.get("lab_serr_expire") == "suspendu_assurance",
      f"HTTP {code} {statuts}")
alertes = " ".join(an.get("alertes", [])) if isinstance(an, dict) else ""
check("alerte couverture <2 actifs/metier/zone", "couverture faible" in alertes,
      f"alertes={an.get('alertes') if isinstance(an, dict) else an}")

code, dp = post("dispatch", "/dispatch", {"logement_id": "log1",
                                          "motif": "fuite_eau",
                                          "qui": "test-lab-humain"})
prop = dp.get("proposition", {}) if isinstance(dp, dict) else {}
check("dispatch fuite_eau en zone = lab_plomb_01 (tri prix)",
      code == 200 and prop.get("id") == "lab_plomb_01",
      f"HTTP {code} {dp}")

code, dp2 = post("dispatch", "/dispatch", {"logement_id": "log1",
                                           "motif": "panne_elec",
                                           "qui": "test-lab-humain"})
prop2 = dp2.get("proposition") if isinstance(dp2, dict) else "?"
deux = dp2.get("deuxieme_choix", []) if isinstance(dp2, dict) else []
check("dispatch elec hors zone = escalade + 2e choix (jamais auto)",
      code == 200 and prop2 is None and dp2.get("escalade_hote") is True
      and any(p.get("id") == "lab_elec_hz" and p.get("second_choix")
              for p in deux),
      f"HTTP {code} {dp2}")

code, an2 = get("dispatch", "/annuaire?" + urllib.parse.urlencode(
    {"logement_id": "log2"}))
check("migration auto zone: texte -> zones: (log2)",
      code == 200 and isinstance(an2, dict)
      and any("migre" in m for m in an2.get("migrations", [])),
      f"HTTP {code} {an2.get('migrations') if isinstance(an2, dict) else an2}")

code, mi_auto = post("dispatch", "/mission", {"logement_id": "log1",
                                              "presta_id": "lab_plomb_01",
                                              "motif": "fuite_eau",
                                              "qui": "auto"})
check("mission qui=auto refusee 400 (1-tap humaine)",
      code == 400, f"HTTP {code} {mi_auto}")

code, mi = post("dispatch", "/mission", {"logement_id": "log1",
                                         "presta_id": "lab_plomb_01",
                                         "motif": "fuite_eau",
                                         "qui": "test-lab-humain"})
check("mission humaine 201 + dossier interventions",
      code == 201 and isinstance(mi, dict)
      and "/interventions/log1/" in str(mi.get("dossier", "")),
      f"HTTP {code} {mi}")

code, mi_rc = post("dispatch", "/mission", {"logement_id": "log1",
                                            "presta_id": "lab_serr_expire",
                                            "motif": "serrure_bloquee",
                                            "qui": "test-lab-humain"})
check("mission RC expiree bloquee 403", code == 403, f"HTTP {code} {mi_rc}")

code, si = post("dispatch", "/sinistre", {"logement_id": "log1",
                                          "motif": "degat_eau_sdb",
                                          "declarant": "test-lab-humain",
                                          "description": "Fuite siphon SDB (lab)",
                                          "canal": "airbnb"})
fiche = si.get("fiche", {}) if isinstance(si, dict) else {}
check("sinistre airbnb 201 + echeance 14 j",
      code == 201 and fiche.get("echeance") is not None,
      f"HTTP {code} {si}")

print("== 9. parcours intervenant : pointage + photos + cloture (P6-2) ==")
code, mi2 = post("dispatch", "/mission", {"logement_id": "log1",
                                          "presta_id": "lab_plomb_02",
                                          "motif": "fuite_eau_p62",
                                          "qui": "test-lab-humain"})
dossier2 = (mi2.get("dossier", "") if isinstance(mi2, dict) else "")
nom2 = dossier2.rsplit("/", 1)[-1]
check("mission P6-2 201", code == 201 and bool(nom2),
      f"HTTP {code} {mi2}")

code, dep_sans = post("dispatch", "/pointage", {"logement_id": "log1",
                                               "dossier": nom2,
                                               "evenement": "depart",
                                               "qui": "lab_plomb_02"})
check("depart sans arrivee bloque 409", code == 409,
      f"HTTP {code} {dep_sans}")

code, pt_auto = post("dispatch", "/pointage", {"logement_id": "log1",
                                              "dossier": nom2,
                                              "evenement": "arrivee",
                                              "qui": "auto"})
check("pointage qui=auto refuse 400", code == 400, f"HTTP {code} {pt_auto}")

code, arr = post("dispatch", "/pointage", {"logement_id": "log1",
                                           "dossier": nom2,
                                           "evenement": "arrivee",
                                           "qui": "lab_plomb_02"})
check("pointage arrivee 200", code == 200 and arr.get("evenement") == "arrivee",
      f"HTTP {code} {arr}")

PETITE_PHOTO = ("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk"
                 "+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")  # PNG 1x1
photos_ok = True
for phase, piece in (("avant", "sdb"), ("apres", "sdb")):
    code, ph = post("dispatch", "/photo", {"logement_id": "log1",
                                           "dossier": nom2, "phase": phase,
                                           "piece": piece, "nom": "test.png",
                                           "donnees_base64": PETITE_PHOTO,
                                           "qui": "lab_plomb_02"})
    ok = code == 201 and ph.get("piece") == piece
    photos_ok = photos_ok and ok
    print(f"[{'OK' if ok else 'KO'}] photo {phase}/{piece} — HTTP {code} {ph}")
    if not ok:
        ECHECS.append(f"photo {phase}/{piece}")
check("photos avant/apres par piece deposees", photos_ok, "")

code, cl_vide = post("dispatch", "/cloture", {"logement_id": "log1",
                                              "dossier": nom2,
                                              "qui": "test-lab-humain"})
check("cloture sans depart = 409 preuves_manquantes",
      code == 409 and cl_vide.get("code") == "preuves_manquantes",
      f"HTTP {code} {cl_vide}")

code, dep = post("dispatch", "/pointage", {"logement_id": "log1",
                                           "dossier": nom2,
                                           "evenement": "depart",
                                           "qui": "lab_plomb_02"})
check("pointage depart 200", code == 200
      and dep.get("duree_presence_min") is not None,
      f"HTTP {code} {dep}")

code, cl_sans = post("dispatch", "/cloture", {"logement_id": "log1",
                                              "dossier": nom2,
                                              "temps_declare_min": 1000,
                                              "qui": "test-lab-humain"})
check("ecart >20 % sans justificatif = 409 justificatif_requis",
      code == 409 and cl_sans.get("code") == "justificatif_requis",
      f"HTTP {code} {cl_sans}")

code, cl = post("dispatch", "/cloture", {"logement_id": "log1",
                                         "dossier": nom2,
                                         "temps_declare_min": 1000,
                                         "justificatif": "douche + carrelage refaits (lab)",
                                         "qui": "test-lab-humain"})
check("cloture 201 : temps facture = temps pointe + alerte ecart",
      code == 201 and cl.get("statut") == "cloturee"
      and cl.get("temps_facture_min") == cl.get("duree_presence_min")
      and cl.get("alerte_ecart") is True,
      f"HTTP {code} {cl}")

code, it = get("dispatch", "/intervention?" + urllib.parse.urlencode(
    {"logement_id": "log1", "dossier": nom2}))
inter = it.get("intervention", {}) if isinstance(it, dict) else {}
check("GET /intervention = cloturee", code == 200
      and inter.get("statut") == "cloturee", f"HTTP {code} {it}")

code, trav = post("dispatch", "/pointage", {"logement_id": "log1",
                                            "dossier": "../decision.log1",
                                            "evenement": "arrivee",
                                            "qui": "lab_plomb_02"})
check("traversee dossier bloquee (nom mission seul)",
      code in (400, 404), f"HTTP {code} {trav}")

print()
if ECHECS:
    print(f"RÉSULTAT : {len(ECHECS)} ÉCHEC(S) : {ECHECS}")
    sys.exit(1)
print("RÉSULTAT : lab OK — tunnel <60 s + conflit + bornes + garde-fous + dispatch P6-8 + parcours intervenant P6-2.")
