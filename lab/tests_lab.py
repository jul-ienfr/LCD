#!/usr/bin/env python3
# lab/tests_lab.py — batterie de tests du lab Docker LCD (stdlib seule).
# P2-14 : tunnel direct <60 s + conflit ICS + bornes 75/290 inviolables.
# Usage : cd lab && docker compose up -d --build && python3 tests_lab.py
# Teardown : docker compose down -v
import base64
import hashlib
import hmac
import json
import os
import re
import shutil
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from datetime import date, timedelta

BASE = {
    "ics": "http://127.0.0.1:8090",
    "pricing": "http://127.0.0.1:8091",
    "decision": "http://127.0.0.1:8092",
    "facturation": "http://127.0.0.1:8093",
    "caution": "http://127.0.0.1:8094",
    "booking": "http://127.0.0.1:8095",
    "dispatch": "http://127.0.0.1:8096",
    "inventaire": "http://127.0.0.1:8097",
    "extras": "http://127.0.0.1:8098",
    "stocks": "http://127.0.0.1:8099",
    "compta": "http://127.0.0.1:8100",
    "router": "http://127.0.0.1:8050",
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
            corps = e.read().decode("utf-8")
        except Exception:
            return code, str(e)
        try:
            return code, json.loads(corps)
        except ValueError:
            return code, corps


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


def put(moteur, chemin, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(BASE[moteur] + chemin, data=data,
                                 headers={"Content-Type": "application/json"},
                                 method="PUT")
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


HA_URL = "http://127.0.0.1:8123"
# Box HA virtuelle : refresh id + cle JWT FACTICES de lab (bootstrap.py).
HA_REFRESH_ID = "6c6162326f782d7669727475616c2d02"
HA_JWT_KEY = "6c61622d7669727475616c2d6a77742d6c61622d30312d6c61622d3032"


def _b64url(obj):
    return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(
        b"=").decode()


def ha_token(duree_s=900):
    """JWT d'acces box virtuelle (HS256, iss = refresh id lab)."""
    now = int(time.time())
    head = _b64url({"alg": "HS256", "typ": "JWT"})
    pay = _b64url({"iss": HA_REFRESH_ID, "iat": now,
                   "exp": now + duree_s})
    sig = base64.urlsafe_b64encode(hmac.new(
        HA_JWT_KEY.encode(), (head + "." + pay).encode(),
        hashlib.sha256).digest()).rstrip(b"=").decode()
    return head + "." + pay + "." + sig


def ha_get(chemin, timeout=15):
    req = urllib.request.Request(HA_URL + chemin,
                                 headers={"Authorization": "Bearer "
                                                            + ha_token()})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except Exception as e:
        code = getattr(e, "code", None) or 0
        try:
            return code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return code, str(e)


def ha_post_ha(chemin, payload, timeout=30):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(HA_URL + chemin, data=data,
                                 headers={"Authorization": "Bearer "
                                                            + ha_token(),
                                          "Content-Type": "application/json"},
                                 method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode("utf-8"))
    except Exception as e:
        code = getattr(e, "code", None) or 0
        try:
            return code, json.loads(e.read().decode("utf-8"))
        except Exception:
            return code, str(e)


def check(nom, cond, detail=""):
    _aff(f"[{'OK' if cond else 'KO'}] {nom}" + (f" — {detail}" if detail else ""))
    if not cond:
        ECHECS.append(nom)


print("== 1. health des 12 moteurs ==")
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

print("== 10. inventaire biens QR/NFC + alertes + stats (P6-4 §5.6-bis) ==")
code, bi = get("inventaire", "/biens?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
total_biens = bi.get("total") if isinstance(bi, dict) else None
check("biens log1 200 + >=5 biens seed",
      code == 200 and isinstance(bi, dict) and (total_biens or 0) >= 5,
      f"HTTP {code} total={total_biens}")

code, fb = get("inventaire", "/bien?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qr": "EQUI-TV-001"}))
fiche_tv = fb.get("bien", {}) if isinstance(fb, dict) else {}
check("fiche TV + inactivite_jours",
      code == 200 and fiche_tv.get("qr") == "EQUI-TV-001"
      and fiche_tv.get("inactivite_jours") is not None,
      f"HTTP {code} {fiche_tv}")

code, al = get("inventaire", "/alertes?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
al = al if isinstance(al, dict) else {}
check("dormant >90 j = EQUI-LV-001",
      code == 200 and "EQUI-LV-001"
      in [a.get("qr") for a in al.get("dormants", [])],
      f"HTTP {code} dormants={al.get('dormants')}")
check("remplacement etat<=2 = EQUI-TV-001",
      code == 200 and "EQUI-TV-001"
      in [a.get("qr") for a in al.get("remplacements", [])],
      f"HTTP {code} remplacements={al.get('remplacements')}")
check("garantie <30 j = EQUI-ASP-001",
      code == 200 and "EQUI-ASP-001"
      in [a.get("qr") for a in al.get("garanties", [])],
      f"HTTP {code} garanties={al.get('garanties')}")

code, st = get("inventaire", "/stats?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
couts = {c.get("qr"): c.get("cout_sejour")
         for c in st.get("cout_sejour_bien", [])} if isinstance(st, dict) else {}
check("stats >=5 biens + budget previsionnel >=400 (TV a remplacer)",
      code == 200 and isinstance(st, dict) and (st.get("nb_biens") or 0) >= 5
      and (st.get("budget_previsionnel_an") or 0) >= 400
      and couts.get("LINGE-DRAP-001") == round(25 / 12, 2),
      f"HTTP {code} {st}")

code, off = get("inventaire", "/biens?" + urllib.parse.urlencode(
    {"logement_id": "log2"}))
off_code = off.get("code") if isinstance(off, dict) else None
check("log2 inventaire_biens off = 503 inventaire_off",
      code == 503 and off_code == "inventaire_off",
      f"HTTP {code} {off}")

code, ba = post("inventaire", "/bien", {"logement_id": "log1",
                                        "qr": "TEST-AUTO",
                                        "categorie": "linge",
                                        "qui": "auto"})
check("creation bien qui=auto refusee 400",
      code == 400, f"HTTP {code} {ba}")

tqr = f"TEST-INV-{int(time.time())}"
code, bc = post("inventaire", "/bien", {"logement_id": "log1", "qr": tqr,
                                        "categorie": "linge",
                                        "label": "Drap test lab",
                                        "date_achat": "2026-10-01",
                                        "prix_achat": 20, "etat": 5,
                                        "qui": "test-lab-humain"})
check("creation bien 201", code == 201
      and isinstance(bc, dict) and bc.get("cree") is True,
      f"HTTP {code} {bc}")

code, ut = post("inventaire", "/utilisation", {"logement_id": "log1",
                                               "qr": tqr, "laver": True,
                                               "qui": "moteur-dispatch"})
check("utilisation clôture (moteur-dispatch) 201 + lavage",
      code == 201 and ut.get("lavage") is True
      and ut.get("biens") == [tqr],
      f"HTTP {code} {ut}")

code, ut2 = post("inventaire", "/utilisation", {"logement_id": "log1",
                                                "qr": tqr,
                                                "qui": "auto"})
check("utilisation qui=auto refusee 400", code == 400,
      f"HTTP {code} {ut2}")

code, et = post("inventaire", "/etat", {"logement_id": "log1", "qr": tqr,
                                        "etat": 1,
                                        "note": "trou (lab)",
                                        "qui": "test-lab-humain"})
check("etat 1 = remplacement propose",
      code == 200 and isinstance(et, dict)
      and "remplacement_propose" in et,
      f"HTTP {code} {et}")

code, et6 = post("inventaire", "/etat", {"logement_id": "log1", "qr": tqr,
                                         "etat": 6,
                                         "qui": "test-lab-humain"})
check("etat 6 refuse 400", code == 400, f"HTTP {code} {et6}")

code, trav = post("inventaire", "/bien", {"logement_id": "log1",
                                          "qr": "../biens",
                                          "categorie": "linge",
                                          "qui": "test-lab-humain"})
check("qr traverse (..) bloque 400", code == 400,
      f"HTTP {code} {trav}")

print("== 11. extras upsells : catalogue localise + cut-off J-1 18h + paiement avance (P6-5 §5.6-ter) ==")
code, cat = get("extras", "/catalogue?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
items = cat.get("catalogue", []) if isinstance(cat, dict) else []
prix = {e.get("id"): e.get("prix_ttc") for e in items}
ids = {e.get("id") for e in items}
check("catalogue log1 200 + 25 extras (21 socle + 4 zones) + petit_dej socle 15 inviolable",
      code == 200 and len(items) == 25 and prix.get("late_checkout_14h") == 50
      and prix.get("minibar_soda") == 3
      and prix.get("petit_dej") == 15
      and "lab_paddle_santa" in ids
      and "matelas_plage_partenaire" in ids
      and "lab_golf_sophia" not in ids
      and {e.get("id"): e.get("mode") for e in items}.get(
          "location_voiture_velo") == "partenariat_commission_15_20"
      and {e.get("id"): e.get("mode") for e in items}.get(
          "resa_resto_plage") == "commission_resto_10",
      f"HTTP {code} nb={len(items)}")

code, off = get("extras", "/catalogue?" + urllib.parse.urlencode(
    {"logement_id": "log2"}))
check("log2 extras_upsell off = 503 extras_off",
      code == 503 and isinstance(off, dict)
      and off.get("code") == "extras_off",
      f"HTTP {code} {off}")

code, ca = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-X",
                                        "arrivee": "2026-12-20",
                                        "extras": [{"id": "petit_dej"}],
                                        "qui": "auto"})
check("commande qui=auto refusee 400",
      code == 400, f"HTTP {code} {ca}")

code, ci = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-X",
                                        "arrivee": "2026-12-20",
                                        "extras": [{"id": "nope"}],
                                        "qui": "test-lab-humain"})
check("extra inconnu refuse 400 extra_inconnu",
      code == 400 and isinstance(ci, dict)
      and ci.get("code") == "extra_inconnu",
      f"HTTP {code} {ci}")

code, ck = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-X",
                                        "arrivee": "2020-01-05",
                                        "extras": [{"id": "petit_dej"}],
                                        "qui": "test-lab-humain"})
check("cut-off J-1 18h depasse = 409 cutoff_depasse",
      code == 409 and isinstance(ck, dict)
      and ck.get("code") == "cutoff_depasse",
      f"HTTP {code} {ck}")

code, cm = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-X",
                                        "arrivee": "2026-12-20",
                                        "extras": [{"id": "petit_dej",
                                                    "pers": 2},
                                                   {"id": "kit_bienvenue_offert"}],
                                        "qui": "test-lab-humain"})
cid = cm.get("commande_id", "") if isinstance(cm, dict) else ""
check("commande 201 a_payer + total 30 (2 pers, prix socle 15 inviolable malgre collision lab 999)",
      code == 201 and isinstance(cm, dict)
      and cm.get("statut") == "a_payer" and cm.get("total_ttc") == 30
      and "petit_dej" in cm.get("todo_menage", [])
      and any(c.get("rubrique") == "accueil"
              for c in cm.get("compta", [])),
      f"HTTP {code} {cm}")

code, co = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-OFFERT",
                                        "arrivee": "2026-12-20",
                                        "extras": [{"id": "kit_bienvenue_offert"}],
                                        "qui": "test-lab-humain"})
check("kit offert seul = validee sans paiement (charge accueil)",
      code == 201 and isinstance(co, dict)
      and co.get("statut") == "validee" and co.get("total_ttc") == 0,
      f"HTTP {code} {co}")

code, li = post("extras", "/livrer", {"logement_id": "log1",
                                      "commande_id": cid,
                                      "qui": "test-lab-humain"})
check("livrer avant paiement = 402 paiement_requis",
      code == 402, f"HTTP {code} {li}")

code, ps = post("extras", "/payer", {"logement_id": "log1",
                                     "commande_id": cid,
                                     "qui": "test-lab-humain"})
check("payer sans preuve = 402 paiement_requis",
      code == 402, f"HTTP {code} {ps}")

code, py = post("extras", "/payer", {"logement_id": "log1",
                                     "commande_id": cid,
                                     "preuve": "pi_test_lab",
                                     "qui": "test-lab-humain"})
check("payer 200 payee + todo menage",
      code == 200 and isinstance(py, dict)
      and py.get("statut") == "payee" and py.get("todo_menage"),
      f"HTTP {code} {py}")

code, lv = post("extras", "/livrer", {"logement_id": "log1",
                                      "commande_id": cid,
                                      "qui": "test-lab-humain"})
check("livrer apres paiement 200 livree",
      code == 200 and isinstance(lv, dict)
      and lv.get("statut") == "livree",
      f"HTTP {code} {lv}")

code, lc = get("extras", "/commandes?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
check("GET /commandes liste la commande",
      code == 200 and isinstance(lc, dict)
      and any(c.get("commande_id") == cid
              for c in lc.get("commandes", [])),
      f"HTTP {code} total={lc.get('total') if isinstance(lc, dict) else lc}")

code, tj = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-X",
                                        "arrivee": "2026-12-20",
                                        "extras": [{"id": "../x"}],
                                        "qui": "test-lab-humain"})
check("id traverse (..) bloque 400", code == 400,
      f"HTTP {code} {tj}")

code, hz = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-HZ",
                                        "arrivee": "2026-12-20",
                                        "extras": [{"id": "lab_golf_sophia"}],
                                        "qui": "test-lab-humain"})
check("extra hors-zone refuse 400 extra_inconnu (comme dispatch, jamais auto)",
      code == 400 and isinstance(hz, dict)
      and hz.get("code") == "extra_inconnu",
      f"HTTP {code} {hz}")

code, zone = post("extras", "/commande", {"logement_id": "log1",
                                          "ref_resa": "LAB-ZONE",
                                          "arrivee": "2026-12-20",
                                          "extras": [{"id": "matelas_plage_partenaire"}],
                                          "qui": "test-lab-humain"})
check("extra zone santa_severa 201 validee 0 (affiliation, rien a payer)",
      code == 201 and isinstance(zone, dict)
      and zone.get("statut") == "validee" and zone.get("total_ttc") == 0,
      f"HTTP {code} {zone}")

print("== 11-quater. office de tourisme par zone : lecture seule voyageur (P6-5/P6-9) ==")
code, to = get("extras", "/tourisme?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
lieux = to.get("lieux", []) if isinstance(to, dict) else []
lids = {l.get("id") for l in lieux}
zones_to = to.get("zones", []) if isinstance(to, dict) else []
par_id = {l.get("id"): l for l in lieux}
check("tourisme log1 200 + 14 lieux (8 santa + 6 nice) + zones + zone_defaut",
      code == 200 and isinstance(to, dict) and to.get("total") == 14
      and len(lieux) == 14
      and set(zones_to) == {"santa_severa", "nice_ouest"}
      and to.get("zone_defaut") == "santa_severa"
      and "promenade_littoral" in lids and "vieux_nice" in lids
      and "biot_village" not in lids,
      f"HTTP {code} nb={len(lieux)} zones={zones_to}")

check("lien tourisme->extra : plage privee liee au matelas, dispo, prix 0",
      isinstance(par_id.get("plage_privee_partenaire"), dict)
      and par_id["plage_privee_partenaire"].get("extra_id") == "matelas_plage_partenaire"
      and par_id["plage_privee_partenaire"].get("extra_disponible") is True
      and par_id["plage_privee_partenaire"].get("prix_ttc") == 0,
      f"{par_id.get('plage_privee_partenaire')}")

code, to_cat = get("extras", "/tourisme?" + urllib.parse.urlencode(
    {"logement_id": "log1", "categorie": "plage"}))
lieux_cat = to_cat.get("lieux", []) if isinstance(to_cat, dict) else []
check("filtre categorie=plage : 3 lieux (2 santa + 1 nice)",
      code == 200 and isinstance(to_cat, dict)
      and len(lieux_cat) == 3
      and all(l.get("categorie") == "plage" for l in lieux_cat),
      f"HTTP {code} nb={len(lieux_cat)}")

code, to_bad = get("extras", "/tourisme?" + urllib.parse.urlencode(
    {"logement_id": "log1", "categorie": "nope"}))
check("categorie hors set = 400 categorie_inconnue",
      code == 400 and isinstance(to_bad, dict)
      and to_bad.get("code") == "categorie_inconnue",
      f"HTTP {code} {to_bad}")

code, to_off = get("extras", "/tourisme?" + urllib.parse.urlencode(
    {"logement_id": "log2"}))
check("tourisme log2 off = 503 extras_off",
      code == 503 and isinstance(to_off, dict)
      and to_off.get("code") == "extras_off",
      f"HTTP {code} {to_off}")

print("== 11-bis. mini-bar honnetete : fiche + conso sur place + stock + reassort (P6-6) ==")
code, mb = get("extras", "/minibar?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
fiche = mb.get("fiche", []) if isinstance(mb, dict) else []
fids = {e.get("id") for e in fiche}
check("fiche log1 200 soft-only 9 refs TTC>0",
      code == 200 and isinstance(mb, dict) and mb.get("soft_only") is True
      and len(fiche) == 9 and "minibar_soda" in fids,
      f"HTTP {code} nb={len(fiche)}")

code, mb_off = get("extras", "/minibar?" + urllib.parse.urlencode(
    {"logement_id": "log2"}))
check("minibar log2 off = 503 extras_off",
      code == 503 and isinstance(mb_off, dict)
      and mb_off.get("code") == "extras_off",
      f"HTTP {code} {mb_off}")

code, mb_auto = post("extras", "/minibar-conso", {"logement_id": "log1",
                                                 "extras": [{"id": "minibar_soda"}],
                                                 "qui": "auto"})
check("minibar-conso qui=auto refuse 400",
      code == 400, f"HTTP {code} {mb_auto}")

code, mb_inc = post("extras", "/minibar-conso", {"logement_id": "log1",
                                                "extras": [{"id": "petit_dej"}],
                                                "qui": "test-lab-humain"})
check("minibar-conso ref non minibar refuse 400",
      code == 400 and isinstance(mb_inc, dict)
      and mb_inc.get("code") == "extra_inconnu",
      f"HTTP {code} {mb_inc}")

code, mc = post("extras", "/minibar-conso", {"logement_id": "log1",
                                             "ref_resa": "LAB-MB",
                                             "extras": [{"id": "minibar_soda",
                                                         "qte": 2}],
                                             "qui": "test-lab-humain"})
check("minibar-conso 201 a_payer 6.0 + todo reassort + compta extras_ca",
      code == 201 and isinstance(mc, dict)
      and mc.get("statut") == "a_payer" and mc.get("total_ttc") == 6.0
      and mc.get("todo_menage") == ["reassort_minibar"]
      and any(c.get("rubrique") == "extras_ca"
              for c in mc.get("compta", [])),
      f"HTTP {code} {mc}")

code, ms = get("extras", "/minibar-stock?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
stock = ms.get("stock", {}) if isinstance(ms, dict) else {}
check("stock decremente soda=2 + valorisation>0",
      code == 200 and isinstance(ms, dict) and stock.get("minibar_soda") == 2
      and ms.get("valorisation_ttc", 0) > 0,
      f"HTTP {code} {ms}")

code, mr_auto = post("extras", "/minibar-reassort", {"logement_id": "log1",
                                                    "qui": "auto"})
check("minibar-reassort qui=auto refuse 400",
      code == 400, f"HTTP {code} {mr_auto}")

code, mr = post("extras", "/minibar-reassort", {"logement_id": "log1",
                                               "qui": "test-lab-humain"})
check("reassort checkout remonte soda a 4",
      code == 200 and isinstance(mr, dict)
      and mr.get("stock", {}).get("minibar_soda") == 4,
      f"HTTP {code} {mr}")

code, mr_trav = post("extras", "/minibar-reassort",
                     {"logement_id": "log1",
                      "quantites": {"../x": 1},
                      "qui": "test-lab-humain"})
check("reassort traverse (..) bloque 400",
      code == 400, f"HTTP {code} {mr_trav}")

print("== 11-ter. conciergerie partenariat : sans paiement, compta partenariat (P6-7) ==")
code, cp = post("extras", "/commande", {"logement_id": "log1",
                                        "ref_resa": "LAB-P67",
                                        "arrivee": "2026-12-20",
                                        "extras": [{"id": "location_voiture_velo"},
                                                   {"id": "excursions"},
                                                   {"id": "resa_resto_plage"},
                                                   {"id": "day_pass_cowork"}],
                                        "qui": "test-lab-humain"})
cid_p67 = cp.get("commande_id", "") if isinstance(cp, dict) else ""
check("commande partenariat 201 validee total 0 + compta partenariat",
      code == 201 and isinstance(cp, dict)
      and cp.get("statut") == "validee" and cp.get("total_ttc") == 0
      and "location_voiture_velo" in cp.get("todo_menage", [])
      and all(c.get("rubrique") == "partenariat"
              for c in cp.get("compta", []))
      and len(cp.get("compta", [])) == 4,
      f"HTTP {code} {cp}")

code, cp_pay = post("extras", "/payer", {"logement_id": "log1",
                                        "commande_id": cid_p67,
                                        "qui": "test-lab-humain"})
check("payer commande partenariat = validee sans paiement",
      code == 200 and isinstance(cp_pay, dict)
      and cp_pay.get("statut") == "validee",
      f"HTTP {code} {cp_pay}")

code, cp_liv = post("extras", "/livrer", {"logement_id": "log1",
                                         "commande_id": cid_p67,
                                         "qui": "test-lab-humain"})
check("livrer commande partenariat 200 livree",
      code == 200 and isinstance(cp_liv, dict)
      and cp_liv.get("statut") == "livree",
      f"HTTP {code} {cp_liv}")

code, cp_td = post("dispatch", "/todos",
                   {"logement_id": "log1",
                    "ref_resa": "LAB-P67",
                    "checkout": "2026-12-20",
                    "checkin_suivant": "2026-12-21",
                    "extras_payes": ["location_voiture_velo",
                                     "excursions"],
                    "qui": "test-lab-humain"})
check("dispatch fusionne extras partenariat en todo",
      code == 201 and isinstance(cp_td, dict)
      and "extra_location_voiture_velo" in (cp_td.get("checklist", []) or [])
      and "extra_excursions" in (cp_td.get("checklist", []) or []),
      f"HTTP {code} {cp_td}")

print("== 12. todos menage + photos E/S + notifs + cloture bloquante (P6-1 §1.6.2) ==")
code, td_auto = post("dispatch", "/todos", {"logement_id": "log1",
                                            "ref_resa": "LAB-P61",
                                            "qui": "auto"})
check("todos qui=auto refuse 400", code == 400,
      f"HTTP {code} {td_auto}")

ref_p61 = f"LAB-P61-{int(time.time())}"
code, td = post("dispatch", "/todos", {"logement_id": "log1",
                                       "ref_resa": ref_p61,
                                       "checkout": "2026-12-20",
                                       "checkin_suivant": "2026-12-21",
                                       "extras_payes": ["petit_dej"],
                                       "qui": "test-lab-humain"})
dos_p61 = (td.get("dossier", "") if isinstance(td, dict) else "")
notifs = (td.get("notifs", []) if isinstance(td, dict) else [])
dest = {n.get("destinataire") for n in notifs}
check("todos 201 + assigne interne + deadline -2h + notifs hote/interne/voyageur",
      code == 201 and isinstance(td, dict)
      and td.get("assigne") == "interne"
      and td.get("deadline") == "2026-12-21T13:00"
      and "petit_dej" not in (td.get("checklist", []) or [])
      and "extra_petit_dej" in (td.get("checklist", []) or [])
      and dest == {"hote", "interne", "voyageur_suivant"},
      f"HTTP {code} {td}")

code, td_presta = post("dispatch", "/todos",
                       {"logement_id": "log1",
                        "ref_resa": ref_p61 + "-PRESTA",
                        "checkout": "2026-12-20",
                        "checkin_suivant": "2026-12-21",
                        "sejours_rapproches": True,
                        "qui": "test-lab-humain"})
check("sejours rapproches = assigne presta_menage_externe",
      code == 201 and isinstance(td_presta, dict)
      and td_presta.get("assigne") == "presta_menage_externe",
      f"HTTP {code} {td_presta}")

code, tl = get("dispatch", "/todos?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
check("GET /todos liste le dossier",
      code == 200 and isinstance(tl, dict)
      and any(d.get("dossier") == dos_p61
              for d in tl.get("dossiers", [])),
      f"HTTP {code} total={tl.get('total') if isinstance(tl, dict) else tl}")

code, mp_auto = post("dispatch", "/menage-pointage",
                     {"logement_id": "log1", "dossier": dos_p61,
                      "evenement": "arrivee", "qui": "auto"})
check("menage-pointage qui=auto refuse 400", code == 400,
      f"HTTP {code} {mp_auto}")

code, mp_dep = post("dispatch", "/menage-pointage",
                    {"logement_id": "log1", "dossier": dos_p61,
                     "evenement": "depart", "qui": "lab_menage_01"})
check("menage depart sans arrivee bloque 409", code == 409,
      f"HTTP {code} {mp_dep}")

code, mp_arr = post("dispatch", "/menage-pointage",
                    {"logement_id": "log1", "dossier": dos_p61,
                     "evenement": "arrivee", "qui": "lab_menage_01"})
check("menage arrivee 200", code == 200
      and mp_arr.get("evenement") == "arrivee",
      f"HTTP {code} {mp_arr}")

menage_photos_ok = True
for phase, piece in (("entree", "salon"), ("sortie", "salon")):
    code, mh = post("dispatch", "/menage-photo",
                    {"logement_id": "log1", "dossier": dos_p61,
                     "phase": phase, "piece": piece, "nom": "test.png",
                     "donnees_base64": PETITE_PHOTO,
                     "qui": "lab_menage_01"})
    ok = code == 201 and mh.get("piece") == piece
    menage_photos_ok = menage_photos_ok and ok
    print(f"[{'OK' if ok else 'KO'}] menage photo {phase}/{piece} — HTTP {code} {mh}")
    if not ok:
        ECHECS.append(f"menage photo {phase}/{piece}")
check("photos menage entree/sortie deposees", menage_photos_ok, "")

code, mc_vide = post("dispatch", "/menage-cloture",
                     {"logement_id": "log1", "dossier": dos_p61,
                      "checklist": {}, "qui": "test-lab-humain"})
check("menage-cloture sans depart/voyageur/traça = 409 preuves_manquantes",
      code == 409 and mc_vide.get("code") == "preuves_manquantes"
      and "photos voyageur E/S (comparatif etat des lieux)"
      in mc_vide.get("manquants", [])
      and "dossier intervention cloture (traca on)"
      in mc_vide.get("manquants", []),
      f"HTTP {code} {mc_vide}")

code, mp_fin = post("dispatch", "/menage-pointage",
                    {"logement_id": "log1", "dossier": dos_p61,
                     "evenement": "depart", "qui": "lab_menage_01"})
check("menage depart 200", code == 200
      and mp_fin.get("duree_presence_min") is not None,
      f"HTTP {code} {mp_fin}")

# Dossier intervention cloture (traca on) : mission -> pointage -> photos -> cloture.
code, mi3 = post("dispatch", "/mission", {"logement_id": "log1",
                                          "presta_id": "lab_plomb_01",
                                          "motif": f"menage_p61_{ref_p61}",
                                          "qui": "test-lab-humain"})
nom3 = (mi3.get("dossier", "") if isinstance(mi3, dict) else "").rsplit("/", 1)[-1]
for ev in ("arrivee", "depart"):
    post("dispatch", "/pointage", {"logement_id": "log1", "dossier": nom3,
                                   "evenement": ev, "qui": "lab_plomb_01"})
for phase in ("avant", "apres"):
    post("dispatch", "/photo", {"logement_id": "log1", "dossier": nom3,
                                "phase": phase, "piece": "cuisine",
                                "nom": "test.png",
                                "donnees_base64": PETITE_PHOTO,
                                "qui": "lab_plomb_01"})
post("dispatch", "/cloture", {"logement_id": "log1", "dossier": nom3,
                              "qui": "test-lab-humain"})

code, mc_cases = post("dispatch", "/menage-cloture",
                      {"logement_id": "log1", "dossier": dos_p61,
                       "checklist": {}, "photos_voyageur_ok": True,
                       "dossier_intervention": nom3,
                       "qui": "test-lab-humain"})
check("checklist vide = 409 cases_manquantes (7 cases)",
      code == 409 and mc_cases.get("code") == "cases_manquantes"
      and len(mc_cases.get("cases_manquantes", [])) >= 7,
      f"HTTP {code} {mc_cases}")

cochees = {c: True for c in
           (mc_cases.get("cases_manquantes", []) if isinstance(mc_cases, dict) else [])}
code, mc = post("dispatch", "/menage-cloture",
                {"logement_id": "log1", "dossier": dos_p61,
                 "checklist": cochees, "photos_voyageur_ok": True,
                 "dossier_intervention": nom3,
                 "qui": "test-lab-humain"})
check("menage-cloture 201 remise_en_dispo",
      code == 201 and mc.get("statut") == "remise_en_dispo",
      f"HTTP {code} {mc}")

code, td_det = get("dispatch", "/todos?" + urllib.parse.urlencode(
    {"logement_id": "log1", "dossier": dos_p61}))
t_det = td_det.get("todos", {}) if isinstance(td_det, dict) else {}
check("GET /todos dossier = remise_en_dispo",
      code == 200 and t_det.get("statut") == "remise_en_dispo",
      f"HTTP {code} {td_det}")

code, trav_m = post("dispatch", "/menage-pointage",
                    {"logement_id": "log1", "dossier": "../decision.log1",
                     "evenement": "arrivee", "qui": "lab_menage_01"})
check("menage traversee dossier bloquee (nom seul)",
      code in (400, 404), f"HTTP {code} {trav_m}")

print("== 13. stocks consommables : seuils + courses + conso + reassort (P6-3 §5.6) ==")
code, st_auto = post("stocks", "/stock", {"logement_id": "log1",
                                          "id": "TEST-STOCK",
                                          "qui": "auto"})
check("stock qui=auto refuse 400", code == 400,
      f"HTTP {code} {st_auto}")

code, st = post("stocks", "/stock", {"logement_id": "log1",
                                     "id": "TEST-STOCK",
                                     "label": "Test stocks lab",
                                     "stock": 3, "unite": "piece",
                                     "seuil": 4, "cible": 10,
                                     "conso_rotation": 2,
                                     "qui": "test-lab-humain"})
cons = (st.get("consommable", {}) if isinstance(st, dict) else {})
check("stock TEST-STOCK pose 200/201 statut bas",
      code in (200, 201) and cons.get("statut") == "bas",
      f"HTTP {code} {st}")

code, st_neg = post("stocks", "/stock", {"logement_id": "log1",
                                         "id": "TEST-STOCK",
                                         "stock": -1,
                                         "qui": "test-lab-humain"})
check("stock negatif refuse 400", code == 400,
      f"HTTP {code} {st_neg}")

code, lis = get("stocks", "/stocks?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
items = (lis.get("consommables", []) if isinstance(lis, dict) else [])
test_item = next((c for c in items if c.get("id") == "TEST-STOCK"), {})
check("GET /stocks liste TEST-STOCK bas",
      code == 200 and test_item.get("statut") == "bas",
      f"HTTP {code} total={lis.get('total') if isinstance(lis, dict) else lis}")

code, co = get("stocks", "/courses?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
check("GET /courses = 0 rupture socle (sain) + bas (TEST-STOCK dedans)",
      code == 200 and isinstance(co, dict)
      and co.get("ruptures", []) == []
      and any(b.get("id") == "TEST-STOCK" for b in co.get("bas", []))
      and "courses : " in co.get("notif_hebdo", ""),
      f"HTTP {code} {co}")

code, co_auto = post("stocks", "/conso", {"logement_id": "log1",
                                          "id": "TEST-STOCK",
                                          "qui": "auto"})
check("conso qui=auto refuse 400", code == 400,
      f"HTTP {code} {co_auto}")

code, co_md = post("stocks", "/conso", {"logement_id": "log1",
                                        "id": "TEST-STOCK",
                                        "qui": "moteur-dispatch"})
t_md = ((co_md.get("consommables", []) or [{}])[0]
        if isinstance(co_md, dict) else {})
check("conso moteur-dispatch 200 (3 -> 1, reste bas)",
      code == 200 and t_md.get("avant") == 3 and t_md.get("stock") == 1
      and t_md.get("statut") == "bas",
      f"HTTP {code} {co_md}")

code, co_fin = post("stocks", "/conso", {"logement_id": "log1",
                                         "id": "TEST-STOCK",
                                         "qui": "test-lab-humain"})
t_fin = ((co_fin.get("consommables", []) or [{}])[0]
         if isinstance(co_fin, dict) else {})
check("conso clamp 0 jamais negatif (1 -> 0 rupture)",
      code == 200 and t_fin.get("stock") == 0
      and t_fin.get("statut") == "rupture",
      f"HTTP {code} {co_fin}")

code, rea = post("stocks", "/reassort", {"logement_id": "log1",
                                         "id": "TEST-STOCK",
                                         "qui": "test-lab-humain"})
remis = ((rea.get("remis_a_cible", []) or [{}])[0]
         if isinstance(rea, dict) else {})
check("reassort remet a cible (0 -> 10)",
      code == 200 and remis.get("stock") == 10,
      f"HTTP {code} {rea}")

code, rea_tous = post("stocks", "/reassort", {"logement_id": "log1",
                                              "tous": True,
                                              "qui": "test-lab-humain"})
check("reassort tous 200",
      code == 200 and isinstance(rea_tous, dict)
      and len(rea_tous.get("remis_a_cible", [])) >= 9,
      f"HTTP {code} {rea_tous}")

code, co_ras = get("stocks", "/courses?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
check("courses apres reassort : TEST-STOCK ok, notif a jour",
      code == 200 and isinstance(co_ras, dict)
      and not any(b.get("id") == "TEST-STOCK"
                  for b in co_ras.get("bas", [])),
      f"HTTP {code} {co_ras}")

code, trav_s = post("stocks", "/stock", {"logement_id": "../x",
                                         "id": "TEST-STOCK",
                                         "qui": "test-lab-humain"})
check("stocks traversee logement bloquee 400",
      code == 400, f"HTTP {code} {trav_s}")

code, al = get("stocks", "/alertes?" + urllib.parse.urlencode(
    {"logement_id": "log2"}))
check("GET /alertes log2 OK",
      code == 200 and isinstance(al, dict) and "ruptures" in al,
      f"HTTP {code} {al}")

print("== 11-quinquies. guide vivant : events localises J-2/J-1/J+1 (P6-9-bis §5.7-ter) ==")
# Decision-engine :8092 — push HA reel (200 emis) si box joignable,
# repli 202 loge_sans_ha sinon (jamais bloquant).
# Reponse = metadonnees SURES uniquement (jamais message ni PIN en clair).
BASE_DATA = {"marque": "Test Marque", "logement": "log1",
             "slot_nom": "Voyageur Test", "arrivee": "2026-11-10",
             "depart": "2026-11-12", "wifi_qr": "WIFI:T:WPA;S:Test;P:faux;;",
             "heure_arrivee": "16:00", "adresse": "Voie test, Commune",
             "tel_urgence": "+33600000000", "lien_questionnaire": "http://q.test",
             "lien_guide": "http://g.test", "lien_avis": "http://a.test"}


def event(type_evt, logement, qui, data):
    return post("decision", "/event", {"type": type_evt, "logement_id": logement,
                                       "qui": qui, "ref": "LAB-GUIDE",
                                       "data": data})


code, j2_fr = event("lcd_j2_envoi_acces", "log1", "personne_01",
                    {**BASE_DATA, "langue": "fr", "pin": "482913"})
check("J-2 FR log1 202 + gabarit + PIN transite (KeyMaster)",
      code in (200, 202) and isinstance(j2_fr, dict)
      and j2_fr.get("statut") in ("emis", "loge_sans_ha")
      and j2_fr.get("gabarit_trouve") is True
      and j2_fr.get("placeholders_restants") == 0
      and j2_fr.get("pin_transmis") is True
      and j2_fr.get("langue") == "fr"
      and j2_fr.get("traduction_auto") is False
      and j2_fr.get("message_longueur", 0) > 0,
      f"HTTP {code} {j2_fr}")
check("J-2 reponse sans message ni PIN en clair",
      isinstance(j2_fr, dict) and "message" not in j2_fr
      and "pin" not in j2_fr, f"{j2_fr}")

code, j2_en = event("lcd_j2_envoi_acces", "log1", "personne_01",
                    {**BASE_DATA, "langue": "en", "pin": "482913"})
check("J-2 EN log1 socle sans badge auto",
      code in (200, 202) and isinstance(j2_en, dict)
      and j2_en.get("langue") == "en"
      and j2_en.get("traduction_auto") is False
      and j2_en.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_en}")

code, j1_fr = event("lcd_j1_rappel", "log1", "personne_01",
                    {**BASE_DATA, "langue": "fr", "pin": "482913"})
check("J-1 FR rappel seul : PIN force vide (jamais re-push §5.2)",
      code in (200, 202) and isinstance(j1_fr, dict)
      and j1_fr.get("pin_transmis") is False
      and j1_fr.get("gabarit_trouve") is True
      and j1_fr.get("placeholders_restants") == 0,
      f"HTTP {code} {j1_fr}")

code, avis_en = event("lcd_avis_j1", "log1", "personne_01",
                      {**BASE_DATA, "langue": "en", "pin": "482913"})
check("J+1 EN enquete : jamais de PIN",
      code in (200, 202) and isinstance(avis_en, dict)
      and avis_en.get("pin_transmis") is False
      and avis_en.get("langue") == "en"
      and avis_en.get("placeholders_restants") == 0,
      f"HTTP {code} {avis_en}")

code, j2_l2 = event("lcd_j2_envoi_acces", "log2", "personne_01",
                    {**BASE_DATA, "logement": "log2", "langue": "fr",
                     "pin": "999999"})
check("log2 LIGHT J-2 : pin vide + consigne boite a cles (jamais genere)",
      code in (200, 202) and isinstance(j2_l2, dict)
      and j2_l2.get("pin_transmis") is False
      and j2_l2.get("message_boite_cles") is True
      and j2_l2.get("gabarit_trouve") is True
      and j2_l2.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_l2}")

code, j2_pt = event("lcd_j2_envoi_acces", "log1", "personne_01",
                    {**BASE_DATA, "langue": "pt", "pin": "482913"})
check("fallback hors socle pt -> EN + badge auto",
      code in (200, 202) and isinstance(j2_pt, dict)
      and j2_pt.get("langue") == "en"
      and j2_pt.get("traduction_auto") is True
      and j2_pt.get("gabarit_trouve") is True,
      f"HTTP {code} {j2_pt}")

# Defaults statiques P6-9-bis : data minimale (langue+pin seuls, comme
# ics-sync/QloApps sans marque/adresse/liens) -> gabarit quand meme trouve,
# placeholders_restants == 0 grace a branding + nom/commune logements.
code, j2_def = event("lcd_j2_envoi_acces", "log1", "personne_01",
                     {"langue": "fr", "pin": "482913"})
check("defaults J-2 data minimale : gabarit trouve sans placeholders",
      code in (200, 202) and isinstance(j2_def, dict)
      and j2_def.get("gabarit_trouve") is True
      and j2_def.get("placeholders_restants") == 0
      and j2_def.get("pin_transmis") is True
      and "message" not in j2_def and "pin" not in j2_def,
      f"HTTP {code} {j2_def}")

# Donnees fournies jamais ecrasees : marque/adresse/tel explicites priment
# sur branding + logements.lab (verifie via gabarit compose sans placeholders).
code, j2_exp = event("lcd_j2_envoi_acces", "log1", "personne_01",
                     {"langue": "fr", "pin": "482913",
                      "marque": "Marque Fournie", "logement": "Fourni Exprès",
                      "adresse": "Voie fournie, Commune", "tel_urgence": "+33611111111",
                      "wifi_qr": "WIFI:T:WPA;S:Fourni;P:faux;;",
                      "heure_arrivee": "16:00", "arrivee": "2026-11-10",
                      "depart": "2026-11-12", "slot_nom": "Fourni",
                      "lien_questionnaire": "http://q.fourni",
                      "lien_guide": "http://g.fourni", "lien_avis": "http://a.fourni"})
check("donnees fournies jamais ecrasees par defaults",
      code in (200, 202) and isinstance(j2_exp, dict)
      and j2_exp.get("gabarit_trouve") is True
      and j2_exp.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_exp}")

code, co = event("lcd_checkout", "log1", "personne_01",
                 {**BASE_DATA, "langue": "fr", "pin": "482913"})
check("checkout forward seul (pas de gabarit) 200/202",
      code in (200, 202) and isinstance(co, dict)
      and co.get("gabarit_trouve") is False, f"HTTP {code} {co}")

code, rbac = event("lcd_j2_envoi_acces", "log1", "personne_04",
                   {**BASE_DATA, "langue": "fr", "pin": "482913"})
check("RBAC comptable sans event_envoi -> 403",
      code == 403, f"HTTP {code} {rbac}")

code, peri = event("lcd_j2_envoi_acces", "log2", "personne_03",
                   {**BASE_DATA, "logement": "log2", "langue": "fr",
                    "pin": "482913"})
check("RBAC hors perimetre operateur log1 sur log2 -> 403",
      code == 403, f"HTTP {code} {peri}")

code, inc = event("lcd_type_inconnu", "log1", "personne_01",
                  {**BASE_DATA, "langue": "fr"})
check("type event inconnu -> 400", code == 400, f"HTTP {code} {inc}")

code, log_inc = event("lcd_j2_envoi_acces", "logX", "personne_01",
                      {**BASE_DATA, "langue": "fr", "pin": "482913"})
check("logement inconnu -> 404", code == 404, f"HTTP {code} {log_inc}")

print("== 11-sexies. wifi invite isole (P6-10 §5.10) ==")
# wifi_qr produit par decision depuis les secrets lab FAUX (wifi_logX_ssid/key),
# jamais invente : data sans wifi_qr -> gabarit trouve, placeholders 0.
# Les secrets lab FAUX ne sont verifies qu'en presence (jamais la valeur).
code, j2_wifi = event("lcd_j2_envoi_acces", "log1", "personne_01",
                      {"langue": "fr", "pin": "482913"})
check("wifi_qr produit par defaults (secrets lab) : gabarit sans placeholders",
      code in (200, 202) and isinstance(j2_wifi, dict)
      and j2_wifi.get("gabarit_trouve") is True
      and j2_wifi.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_wifi}")

# wifi_qr fourni prime (jamais ecrase) : gabarit compose sans placeholders.
code, j2_wifi_f = event("lcd_j2_envoi_acces", "log1", "personne_01",
                        {"langue": "fr", "pin": "482913",
                         "wifi_qr": "WIFI:T:WPA;S:Fourni;P:faux;;"})
check("wifi_qr fourni jamais ecrase par defaults",
      code in (200, 202) and isinstance(j2_wifi_f, dict)
      and j2_wifi_f.get("gabarit_trouve") is True
      and j2_wifi_f.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_wifi_f}")

# Returning : retour_voyageur=true (geste humain/renvoi) -> prefixe « Bon retour »
# localise (FR ici). Reponse = metadonnees SURES (prefixe dans message seul,
# jamais expose ; jamais en vocal/LLM/logs — message jamais en reponse).
code, j2_ret = event("lcd_j2_envoi_acces", "log1", "personne_01",
                     {**BASE_DATA, "langue": "fr", "pin": "482913",
                      "retour_voyageur": True})
check("returning FR : J-2 202 + gabarit + sans fuite message/PIN",
      code in (200, 202) and isinstance(j2_ret, dict)
      and j2_ret.get("gabarit_trouve") is True
      and j2_ret.get("placeholders_restants") == 0
      and "message" not in j2_ret and "pin" not in j2_ret,
      f"HTTP {code} {j2_ret}")

# Non-returning : pas de flag -> pas de prefixe, comportement inchange.
code, j2_new = event("lcd_j2_envoi_acces", "log1", "personne_01",
                     {**BASE_DATA, "langue": "en", "pin": "482913"})
check("non-returning EN : J-2 202 + gabarit + placeholders 0",
      code in (200, 202) and isinstance(j2_new, dict)
      and j2_new.get("gabarit_trouve") is True
      and j2_new.get("placeholders_restants") == 0
      and j2_new.get("langue") == "en",
      f"HTTP {code} {j2_new}")

print("== 11-septies. phrasebook 1-tap (P6-11 §5.7-ter) ==")
# Catalogue sans cle : 20 phrases critiques, 5 langues socle, jamais de texte.
code, cat = get("decision", "/phrases?logement_id=log1")
check("catalogue : 200 + 20 cles + 5 langues socle",
      code == 200 and isinstance(cat, dict)
      and cat.get("nb_phrases") == 20 and len(cat.get("cles", [])) == 20
      and cat.get("langues") == ["fr", "en", "es", "it", "de"]
      and "bienvenue" in cat.get("cles", [])
      and "heures_calmes" in cat.get("cles", [])
      and "urgence" in cat.get("cles", [])
      and "phrase" not in cat,
      f"HTTP {code} nb={cat.get('nb_phrases') if isinstance(cat, dict) else cat}")

# FR : heures_calmes log1 (22h-8h depuis logements lab) injecte APRES, 0 residu.
code, ph = get("decision", "/phrases?logement_id=log1&cle=heures_calmes&langue=fr")
check("FR heures_calmes : 22h-8h injecte, 0 placeholder",
      code == 200 and isinstance(ph, dict)
      and ph.get("langue") == "fr" and ph.get("traduction_auto") is False
      and "22h-8h" in ph.get("phrase", "")
      and "{{" not in ph.get("phrase", "")
      and ph.get("placeholders_restants") == 0,
      f"HTTP {code} {ph}")

# FR : bienvenue avec nom logement lab (defaults statiques, jamais inventes).
code, ph = get("decision", "/phrases?logement_id=log1&cle=bienvenue&langue=fr")
check("FR bienvenue : nom logement lab injecte",
      code == 200 and isinstance(ph, dict)
      and "Santa Severa" in ph.get("phrase", "")
      and ph.get("placeholders_restants") == 0,
      f"HTTP {code} {ph}")

# Socle 5 : EN/ES/IT/DE rendues sans residu (depart_11h = texte pur).
for lg in ("en", "es", "it", "de"):
    code, ph = get("decision", f"/phrases?logement_id=log1&cle=depart_11h&langue={lg}")
    check(f"{lg.upper()} depart_11h : langue {lg}, 0 placeholder",
          code == 200 and isinstance(ph, dict)
          and ph.get("langue") == lg and ph.get("traduction_auto") is False
          and "{{" not in ph.get("phrase", "")
          and ph.get("placeholders_restants") == 0,
          f"HTTP {code} {ph}")

# Donnee fournie prime sur defaults : heure_arrivee=15h.
code, ph = get("decision", "/phrases?logement_id=log1&cle=arrivee_16h&langue=fr&heure_arrivee=15h")
check("donnee fournie prime : heure_arrivee=15h rendue",
      code == 200 and isinstance(ph, dict)
      and "15h" in ph.get("phrase", "")
      and ph.get("placeholders_restants") == 0,
      f"HTTP {code} {ph}")

# Hors socle (pt) : fallback EN + badge auto, jamais de {{ }}.
code, ph = get("decision", "/phrases?logement_id=log1&cle=urgence&langue=pt")
check("fallback pt : EN + badge traduction automatique",
      code == 200 and isinstance(ph, dict)
      and ph.get("langue") == "en" and ph.get("traduction_auto") is True
      and str(ph.get("phrase", "")).startswith("[traduction automatique]")
      and "{{" not in ph.get("phrase", "")
      and ph.get("placeholders_restants") == 0,
      f"HTTP {code} {ph}")

# occupants_max log2 (=4, pas log1=5) : donnees logement, jamais inventees.
code, ph = get("decision", "/phrases?logement_id=log2&cle=occupants_max&langue=fr")
check("log2 occupants_max : 4 du logement (pas 5 de log1)",
      code == 200 and isinstance(ph, dict)
      and "4" in ph.get("phrase", "")
      and ph.get("placeholders_restants") == 0,
      f"HTTP {code} {ph}")

# Garde-fou §5.2 : pin/code/message ignores — jamais exposes en reponse.
code, ph = get("decision", "/phrases?logement_id=log1&cle=code_separe&langue=fr&pin=482913&message=xx&code=yy")
check("jamais de PIN via phrases : reponse sans pin/message",
      code == 200 and isinstance(ph, dict)
      and "pin" not in ph and "message" not in ph
      and "482913" not in ph.get("phrase", "")
      and ph.get("placeholders_restants") == 0,
      f"HTTP {code} {ph}")

# 400 cle inconnue, 404 logement inconnu, 400 sans logement_id.
code, obj = get("decision", "/phrases?logement_id=log1&cle=inexistante&langue=fr")
check("cle inconnue -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/phrases?logement_id=logX&cle=bienvenue&langue=fr")
check("logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = get("decision", "/phrases?cle=bienvenue&langue=fr")
check("sans logement_id -> 400", code == 400, f"HTTP {code} {obj}")

print("== 11-octies. memoire voyageur (P6-12 §5.7-quater) ==")
# Opt-in/out/purge = geste HUMAIN seul (personne_01). Hash sha256 hex64 FAUX de
# lab (jamais de CSI reel). Registre lab RW, reponses SURES (jamais hash/PIN).
HASH_LAB = "a" * 64
code, inconnu = get("decision", f"/memoire?logement_id=log1&hash={HASH_LAB}")
check("inconnu -> 404 pre-remplissage", code == 404, f"HTTP {code} {inconnu}")

# Garde-fous : qui auto refuse, hash invalide refuse, logement inconnu 404.
code, obj = post("decision", "/memoire",
                 {"action": "optin", "logement_id": "log1", "qui": "auto",
                  "hash": HASH_LAB, "preferences": {"langue": "es"}})
check("opt-in auto -> 400 geste humain exige", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/memoire",
                 {"action": "optin", "logement_id": "log1", "qui": "personne_01",
                  "hash": "CSI-brut-non", "preferences": {"langue": "es"}})
check("opt-in CSI brut -> 400 hash sha256 exige", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/memoire",
                 {"action": "optin", "logement_id": "logX", "qui": "personne_01",
                  "hash": HASH_LAB, "preferences": {"langue": "es"}})
check("opt-in logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")

# Opt-in humain : langue es + consignes + extras favoris 1-tap.
code, optin = post("decision", "/memoire",
                   {"action": "optin", "logement_id": "log1", "qui": "personne_01",
                    "hash": HASH_LAB,
                    "preferences": {"langue": "es", "consignes": "etage sans ascenseur",
                                    "extras_favoris": "petit_dej, velo"}})
check("opt-in humain -> 200 langue es", code == 200 and isinstance(optin, dict)
      and optin.get("statut") == "optin" and optin.get("langue") == "es"
      and "hash" not in optin, f"HTTP {code} {optin}")

# Pre-remplissage : reconnu, langue/consignes/extras, jamais le hash.
code, fiche = get("decision", f"/memoire?logement_id=log1&hash={HASH_LAB}")
check("reconnu -> 200 fiche SURE sans hash",
      code == 200 and isinstance(fiche, dict)
      and fiche.get("statut") == "reconnu" and fiche.get("langue") == "es"
      and fiche.get("consignes") == "etage sans ascenseur"
      and fiche.get("extras_favoris") == ["petit_dej", "velo"]
      and "hash" not in fiche, f"HTTP {code} {fiche}")

# Returning via hash : J-2 pre-remplit langue es + flag retour (Bon retour),
# sans ecraser la langue fournie ; hash jamais transmis (ni reponse ni HA).
code, j2_mem = event("lcd_j2_envoi_acces", "log1", "personne_01",
                     {**BASE_DATA, "pin": "482913", "hash": HASH_LAB})
check("returning hash : J-2 202 + langue memoire es + retour_voyageur",
      code in (200, 202) and isinstance(j2_mem, dict)
      and j2_mem.get("langue") == "es"
      and j2_mem.get("retour_voyageur") is True
      and j2_mem.get("gabarit_trouve") is True
      and "message" not in j2_mem and "pin" not in j2_mem
      and "hash" not in j2_mem, f"HTTP {code} {j2_mem}")
code, j2_mem_fr = event("lcd_j2_envoi_acces", "log1", "personne_01",
                        {**BASE_DATA, "langue": "fr", "pin": "482913",
                         "hash": HASH_LAB})
check("returning hash : langue fournie fr prime sur memoire",
      code in (200, 202) and isinstance(j2_mem_fr, dict)
      and j2_mem_fr.get("langue") == "fr"
      and j2_mem_fr.get("retour_voyageur") is True, f"HTTP {code} {j2_mem_fr}")

# Opt-out = oubli immediat : 404 apres ; idempotent (2e opt-out 200).
code, out = post("decision", "/memoire",
                 {"action": "optout", "logement_id": "log1",
                  "qui": "personne_01", "hash": HASH_LAB})
check("opt-out humain -> 200 fiche supprimee",
      code == 200 and isinstance(out, dict)
      and out.get("statut") == "optout"
      and out.get("fiche_supprimee") is True, f"HTTP {code} {out}")
code, oublie = get("decision", f"/memoire?logement_id=log1&hash={HASH_LAB}")
check("apres opt-out -> 404 oublie", code == 404, f"HTTP {code} {oublie}")
code, out2 = post("decision", "/memoire",
                  {"action": "optout", "logement_id": "log1",
                   "qui": "personne_01", "hash": HASH_LAB})
check("opt-out idempotent -> 200 fiche_supprimee False",
      code == 200 and isinstance(out2, dict)
      and out2.get("fiche_supprimee") is False, f"HTTP {code} {out2}")

# Apres oubli : J-2 avec hash inconnu = non-returning (pas de Bon retour).
code, j2_oublie = event("lcd_j2_envoi_acces", "log1", "personne_01",
                        {**BASE_DATA, "langue": "fr", "pin": "482913",
                         "hash": HASH_LAB})
check("hash inconnu -> non-returning",
      code in (200, 202) and isinstance(j2_oublie, dict)
      and j2_oublie.get("retour_voyageur") is False, f"HTTP {code} {j2_oublie}")

# Purge 24 mois : geste humain, 400 si auto ; ici 0 fiche expiree (opt-in du jour).
code, purge_auto = post("decision", "/memoire",
                        {"action": "purge", "logement_id": "log1", "qui": "llm"})
check("purge auto -> 400 geste humain exige", code == 400, f"HTTP {code} {purge_auto}")
code, purge = post("decision", "/memoire",
                   {"action": "purge", "logement_id": "log1",
                    "qui": "personne_01"})
check("purge humaine -> 200 compteurs SURS",
      code == 200 and isinstance(purge, dict)
      and purge.get("statut") == "purge"
      and purge.get("purgees") == 0
      and "hash" not in purge, f"HTTP {code} {purge}")

# Action inconnue / champs manquants -> 400.
code, obj = post("decision", "/memoire",
                 {"action": "oublier", "logement_id": "log1",
                  "qui": "personne_01", "hash": HASH_LAB})
check("action inconnue -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/memoire", {"action": "optin", "qui": "personne_01"})
check("sans logement_id -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/memoire?hash=" + HASH_LAB)
check("GET sans logement_id -> 400", code == 400, f"HTTP {code} {obj}")

print()
print("== 11-novies. menage date certaine (P6-13 §5.6 + §5.7-quater) ==")
# Prefs memoire P6-13 : opt-in avec frequence/heure/absence (geste HUMAIN).
code, optin_men = post("decision", "/memoire",
                       {"action": "optin", "logement_id": "log1",
                        "qui": "personne_01", "hash": HASH_LAB,
                        "preferences": {"langue": "fr",
                                        "menage_frequence_j": "7",
                                        "menage_heure_pref": "10:30",
                                        "menage_pendant_absence": "oui"}})
check("opt-in prefs menage 7j/10h30/absence -> 200",
      code == 200 and isinstance(optin_men, dict)
      and optin_men.get("statut") == "optin", f"HTTP {code} {optin_men}")
code, fiche_men = get("decision", f"/memoire?logement_id=log1&hash={HASH_LAB}")
check("pre-remplissage expose prefs menage SURES",
      code == 200 and isinstance(fiche_men, dict)
      and fiche_men.get("menage_frequence_j") == "7"
      and fiche_men.get("menage_heure_pref") == "10:30"
      and fiche_men.get("menage_pendant_absence") == "oui"
      and "hash" not in fiche_men, f"HTTP {code} {fiche_men}")

# Garde-fous : qui auto refuse, logement inconnu 404, dates requises.
code, mi_auto = post("dispatch", "/menage-intermediaire",
                     {"logement_id": "log1", "qui": "auto",
                      "arrivee": "2026-11-01", "depart": "2026-11-16"})
check("menage-intermediaire qui=auto refuse 400", code == 400,
      f"HTTP {code} {mi_auto}")
code, mi_logx = post("dispatch", "/menage-intermediaire",
                     {"logement_id": "logX", "qui": "test-lab-humain",
                      "arrivee": "2026-11-01", "depart": "2026-11-16"})
check("menage-intermediaire logement inconnu -> 404", code == 404,
      f"HTTP {code} {mi_logx}")
code, mi_nodates = post("dispatch", "/menage-intermediaire",
                        {"logement_id": "log1", "qui": "test-lab-humain"})
check("menage-intermediaire sans dates -> 400", code == 400,
      f"HTTP {code} {mi_nodates}")

# Sejour court <10j sans pref : fin de sejour seul (aucune date certaine).
code, mi_court = post("dispatch", "/menage-intermediaire",
                      {"logement_id": "log1", "qui": "test-lab-humain",
                       "ref_resa": f"LAB-P613-{int(time.time())}",
                       "arrivee": "2026-11-01", "depart": "2026-11-06"})
check("sejour 5j sans pref -> fin_sejour_seul 0 date",
      code == 200 and isinstance(mi_court, dict)
      and mi_court.get("statut") == "fin_sejour_seul"
      and mi_court.get("dates") == [], f"HTTP {code} {mi_court}")

# Defaut J+7 : sejour >=10j sans pref -> 1 date certaine (arrivee+7).
code, mi_j7 = post("dispatch", "/menage-intermediaire",
                   {"logement_id": "log1", "qui": "test-lab-humain",
                    "ref_resa": f"LAB-P613-{int(time.time())}",
                    "arrivee": "2026-11-01", "depart": "2026-11-13"})
dos_j7 = ((mi_j7.get("dossiers", []) or [{}])[0].get("dossier", "")
          if isinstance(mi_j7, dict) else "")
check("sejour 12j sans pref -> defaut J+7 (2026-11-08)",
      code == 201 and isinstance(mi_j7, dict)
      and mi_j7.get("mode") == "defaut_j7"
      and mi_j7.get("dates") == ["2026-11-08"]
      and mi_j7.get("heure") == "11:00" and dos_j7 != ""
      and mi_j7.get("facturation", {}).get("montant_eur") == 60,
      f"HTTP {code} {mi_j7}")

# Frequence pref 7j, sejour 15j log1 (equilibre) : 2 dates, 60 EUR/passage,
# heure pref, absence, message J-1 SURE (jamais de PIN).
code, mi_pref = post("dispatch", "/menage-intermediaire",
                     {"logement_id": "log1", "qui": "test-lab-humain",
                      "ref_resa": f"LAB-P613-{int(time.time())}",
                      "arrivee": "2026-11-01", "depart": "2026-11-16",
                      "frequence_j": 7, "heure_pref": "10:30",
                      "pendant_absence": "oui"})
msgs = (mi_pref.get("messages_voyageur_j1", [])
        if isinstance(mi_pref, dict) else [])
check("pref 7j 15j log1 -> 2 dates + 60EUR + absence + J-1 SURE",
      code == 201 and isinstance(mi_pref, dict)
      and mi_pref.get("mode") == "preference"
      and mi_pref.get("dates") == ["2026-11-08", "2026-11-15"]
      and mi_pref.get("heure") == "10:30"
      and mi_pref.get("pendant_absence") == "oui"
      and mi_pref.get("facturation", {}).get("mode") == "a_facturer"
      and mi_pref.get("facturation", {}).get("montant_eur") == 60
      and len(msgs) == 2 and all("absence" in m.get("message", "")
                                 for m in msgs)
      and all("pin" not in m.get("message", "").lower() for m in msgs),
      f"HTTP {code} {mi_pref}")

# Offert : sejour >=14j log2 (remplissage_max) -> 2 dates offertes.
code, mi_off = post("dispatch", "/menage-intermediaire",
                    {"logement_id": "log2", "qui": "test-lab-humain",
                     "ref_resa": f"LAB-P613-{int(time.time())}",
                     "arrivee": "2026-11-01", "depart": "2026-11-22",
                     "frequence_j": 7, "heure_pref": "11:00",
                     "pendant_absence": "non"})
check("21j log2 remplissage_max -> offert 2 dates",
      code == 201 and isinstance(mi_off, dict)
      and mi_off.get("dates") == ["2026-11-08", "2026-11-15"]
      and mi_off.get("facturation", {}).get("mode") == "offert",
      f"HTTP {code} {mi_off}")

# Dossiers visibles via GET /todos (meme socle P6-1, preuves exigibles).
code, tl_mi = get("dispatch", "/todos?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
check("GET /todos liste dossiers intermediaires",
      code == 200 and isinstance(tl_mi, dict)
      and any("mi1" in (d.get("dossier", "") or "")
              for d in tl_mi.get("dossiers", [])),
      f"HTTP {code} total={tl_mi.get('total') if isinstance(tl_mi, dict) else tl_mi}")

# Oubli memoire (opt-out) : prefs menage effacees avec la fiche.
code, out_men = post("decision", "/memoire",
                     {"action": "optout", "logement_id": "log1",
                      "qui": "personne_01", "hash": HASH_LAB})
check("opt-out apres P6-13 -> 200 oublie", code == 200
      and isinstance(out_men, dict)
      and out_men.get("fiche_supprimee") is True,
      f"HTTP {code} {out_men}")

print()
print("== 11-deicies. questionnaire J-2 (P6-14 §5.7-quinquies) ==")
# GET schema : 4 blocs, pre-rempli vide (voyageur inconnu), J1 non_repondu.
code, sch = get("decision", "/questionnaire?" + urllib.parse.urlencode(
    {"logement_id": "log1", "langue": "fr"}))
check("GET schema 4 blocs + non_repondu",
      code == 200 and isinstance(sch, dict)
      and set(sch.get("blocs", {})) == {"arrivee", "preferences", "extras",
                                        "contrat"}
      and sch.get("pre_rempli") == {}
      and sch.get("voyageur_reconnu") is False
      and sch.get("completude", {}).get("etat") == "non_repondu"
      and sch.get("completude", {}).get("risque_friction") == 1.0
      and sch.get("jamais_bloquant") is True, f"HTTP {code} {sch}")
# GET sans logement_id / logement inconnu.
code, obj = get("decision", "/questionnaire?langue=fr")
check("GET sans logement_id -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/questionnaire?logement_id=logX")
check("GET logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")

# Garde-fous depot : qui auto -> 400, ref traversee -> 400, champs requis.
code, obj = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "auto", "ref_resa": "LAB-P614"})
check("depot qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": "../evil"})
check("depot ref traversee bloquee 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "personne_01"})
check("depot sans ref_resa -> 400", code == 400, f"HTTP {code} {obj}")
# occupants_max copro log1=5 : 9 voyageurs refuses.
code, obj = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": "LAB-P614-TROP",
                  "arrivee": {"nb_voyageurs": 9}})
check("depot 9 voyageurs > occupants_max 5 -> 400", code == 400,
      f"HTTP {code} {obj}")

# Depot 201 : M2 « On a compris », chauffage clampe 21, suggestions M3 max 3.
REF_Q = f"LAB-P614-{int(time.time())}"
code, dep = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_Q,
                  "arrivee": {"heure_arrivee": "17:30", "nb_voyageurs": 2,
                              "vol": "af1234",
                              "date_arrivee": "2099-06-01"},
                  "reponses": {"temp_chauffage": 24, "langue": "fr",
                               "allergies": "arachide",
                               "menage_frequence_j": "7",
                               "menage_heure_pref": "10:30",
                               "menage_pendant_absence": "oui"},
                  "optins": {"accepte_cgv": "oui"}})
check("depot 201 + M2 compris + clamp 21 + M3 generiques",
      code == 201 and isinstance(dep, dict)
      and dep.get("statut") == "cree"
      and "On a compris" in dep.get("compris", "")
      and "Corriger" in dep.get("compris", "")
      and dep.get("a_corriger_1tap") is True
      and dep.get("temp_chauffage_clampee") is True
      and isinstance(dep.get("suggestions"), list)
      and len(dep.get("suggestions", [])) <= 3
      and dep.get("extras", {}).get("statut") == "ok"
      and dep.get("jamais_bloquant") is True
      and "hash" not in dep, f"HTTP {code} {dep}")

# Correction 1-tap : meme ref -> 200 mis_a_jour (chauffage 19, pas de clamp).
code, maj = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_Q,
                  "arrivee": {"heure_arrivee": "18:00", "nb_voyageurs": 2,
                              "date_arrivee": "2099-06-01"},
                  "reponses": {"temp_chauffage": 19, "langue": "fr"},
                  "optins": {"accepte_cgv": "oui"}})
check("correction meme ref -> 200 mis_a_jour sans clamp",
      code == 200 and isinstance(maj, dict)
      and maj.get("statut") == "mis_a_jour"
      and maj.get("temp_chauffage_clampee") is False
      and "18:00" in maj.get("compris", ""), f"HTTP {code} {maj}")

# Extras ids invalides ignores (jamais de prix ici, art. 225-1).
code, ide = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": f"LAB-P614-{int(time.time())}-X",
                  "arrivee": {"date_arrivee": "2099-06-01"},
                  "reponses": {"extra_ids": ["petit_dej", "../../evil"]}})
check("extras invalides ignores, jamais de prix",
      code == 201 and isinstance(ide, dict)
      and ide.get("extras", {}).get("ids") == ["petit_dej"]
      and ide.get("extras", {}).get("ignores") == ["../../evil"]
      and "prix" not in json.dumps(ide), f"HTTP {code} {ide}")

# Cut-off J-1 18h : arrivee hier -> extras cutoff_depasse, jamais bloquant.
hier = (date.today() - timedelta(days=1)).isoformat()
code, cut = post("decision", "/questionnaire",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": f"LAB-P614-{int(time.time())}-C",
                  "arrivee": {"date_arrivee": hier,
                              "extra_ids": ["petit_dej"]},
                  "reponses": {}})
check("cut-off depasse -> statut cutoff_depasse, jamais bloquant",
      code == 201 and isinstance(cut, dict)
      and cut.get("extras", {}).get("statut") == "cutoff_depasse"
      and cut.get("jamais_bloquant") is True
      and cut.get("statut") == "cree", f"HTTP {code} {cut}")

# J1 completude : dossier incomplet -> etat + manquants + relance ciblee.
code, j1 = get("decision", "/questionnaire?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_Q}))
check("J1 incomplet -> manquants + relance_auto ciblee",
      code == 200 and isinstance(j1, dict)
      and j1.get("completude", {}).get("etat") == "incomplet"
      and j1.get("completude", {}).get("blocs_manquants") != []
      and j1.get("completude", {}).get("relance") == "relance_auto"
      and "il manque" in j1.get("completude", {}).get("relance_ciblee", ""),
      f"HTTP {code} {j1}")

# Opt-in memoire reconnu : GET pre-remplit langue/consignes/menage.
code, opt_q = post("decision", "/memoire",
                   {"action": "optin", "logement_id": "log1",
                    "qui": "personne_01", "hash": HASH_LAB,
                    "preferences": {"langue": "es",
                                    "consignes": "etage 2",
                                    "extras_favoris": "petit_dej, velo",
                                    "menage_frequence_j": "7"}})
check("opt-in memoire pour pre-rempli -> 200", code == 200,
      f"HTTP {code} {opt_q}")
code, sch_mem = get("decision", "/questionnaire?" + urllib.parse.urlencode(
    {"logement_id": "log1", "hash": HASH_LAB}))
check("GET hash reconnu -> pre-rempli memoire + generiques",
      code == 200 and isinstance(sch_mem, dict)
      and sch_mem.get("voyageur_reconnu") is True
      and sch_mem.get("pre_rempli", {}).get("langue") == "es"
      and sch_mem.get("pre_rempli", {}).get("consignes") == "etage 2"
      and sch_mem.get("pre_rempli", {}).get("menage_frequence_j") == "7"
      and "hash" not in json.dumps(sch_mem), f"HTTP {code} {sch_mem}")

# Depot avec hash reconocido + optin_memoire : fiche maj (sejour courant),
# suggestions M3 depuis favoris (filtre allergene : velo garde, pas l'allergene).
code, dep_mem = post("decision", "/questionnaire",
                     {"logement_id": "log1", "qui": "personne_01",
                      "ref_resa": f"LAB-P614-{int(time.time())}-M",
                      "hash": HASH_LAB,
                      "arrivee": {"date_arrivee": "2099-06-01"},
                      "reponses": {"allergies": "velo"},
                      "optins": {"optin_memoire": "oui"}})
check("depot optin_memoire -> persiste + M3 filtre allergene",
      code == 201 and isinstance(dep_mem, dict)
      and dep_mem.get("optin_memoire_persiste") is True
      and "velo" not in (dep_mem.get("suggestions") or [])
      and len(dep_mem.get("suggestions", [])) <= 3,
      f"HTTP {code} {dep_mem}")
code, fiche_q = get("decision", f"/memoire?logement_id=log1&hash={HASH_LAB}")
check("fiche memoire maj par questionnaire",
      code == 200 and isinstance(fiche_q, dict)
      and fiche_q.get("statut") == "reconnu", f"HTTP {code} {fiche_q}")

# Oubli final : opt-out (registre lab restaure avant commit).
code, out_q = post("decision", "/memoire",
                   {"action": "optout", "logement_id": "log1",
                    "qui": "personne_01", "hash": HASH_LAB})
check("opt-out final P6-14 -> 200 oublie", code == 200
      and isinstance(out_q, dict)
      and out_q.get("fiche_supprimee") is True,
      f"HTTP {code} {out_q}")

print()
print("== 11-undecies. contrat PWA + signature tactile + opt-ins (P6-15 §12.5-bis) ==")
# GET statut : 400 sans ref, 404 logement inconnu, 400 ref traversée.
code, obj = get("decision", "/contrat?logement_id=log1")
check("GET sans ref_resa -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/contrat?logement_id=logX&ref_resa=LAB-P615-X")
check("GET logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = get("decision", "/contrat?logement_id=log1&ref_resa=..%2Fevil")
check("GET ref traversee bloquee 400", code == 400, f"HTTP {code} {obj}")

REF_C = f"LAB-P615-{int(time.time())}"
code, st0 = get("decision", "/contrat?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_C}))
check("GET non_signe initial + pdf_reference + jamais bloquant",
      code == 200 and isinstance(st0, dict)
      and st0.get("statut") == "non_signe"
      and st0.get("signature_manquante") is True
      and st0.get("pin_autorise") is True
      and st0.get("pdf_reference") == f"contrats/log1/{REF_C}_contrat.pdf"
      and st0.get("jamais_bloquant") is True,
      f"HTTP {code} {st0}")

# Garde-fous POST : qui auto, ref traversée, nom court, CGV, signature.
code, obj = post("decision", "/contrat",
                 {"logement_id": "log1", "qui": "auto",
                  "ref_resa": REF_C, "nom_voyageur": "Test Voyageur",
                  "signature": "tactile-base64-signe-lab",
                  "accepte_cgv": True})
check("contrat qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/contrat",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": "../evil", "nom_voyageur": "Test Voyageur",
                  "signature": "tactile-base64-signe-lab",
                  "accepte_cgv": True})
check("contrat ref traversee bloquee 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/contrat",
                 {"logement_id": "logX", "qui": "personne_01",
                  "ref_resa": REF_C, "nom_voyageur": "Test Voyageur",
                  "signature": "tactile-base64-signe-lab",
                  "accepte_cgv": True})
check("contrat logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = post("decision", "/contrat",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_C, "nom_voyageur": "T",
                  "signature": "tactile-base64-signe-lab",
                  "accepte_cgv": True})
check("contrat nom trop court -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/contrat",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_C, "nom_voyageur": "Test Voyageur",
                  "signature": "tactile-base64-signe-lab",
                  "accepte_cgv": False})
check("contrat sans CGV -> 422 cgv_requise",
      code == 422 and isinstance(obj, dict)
      and obj.get("code") == "cgv_requise",
      f"HTTP {code} {obj}")
code, obj = post("decision", "/contrat",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_C, "nom_voyageur": "Test Voyageur",
                  "signature": "court",
                  "accepte_cgv": True})
check("contrat signature courte -> 422 signature_requise",
      code == 422 and isinstance(obj, dict)
      and obj.get("code") == "signature_requise",
      f"HTTP {code} {obj}")

# Signature log1 (crm_retour on + geoloc on en lab) : 201 + code −10 % direct.
code, sg = post("decision", "/contrat",
                {"logement_id": "log1", "qui": "personne_01",
                 "ref_resa": REF_C, "nom_voyageur": "Test Voyageur",
                 "signature": "tactile-base64-signe-lab-preuve",
                 "accepte_cgv": True,
                 "optins": {"optin_memoire": False, "optin_geoloc": True,
                            "optin_crm_retour": True}})
check("signature log1 201 + geoloc sejour + code -10 % direct",
      code == 201 and isinstance(sg, dict)
      and sg.get("statut") == "signe"
      and sg.get("geoloc_statut") == "geoloc_active_sejour"
      and sg.get("code_retour") == f"DIRECT-10-{REF_C}"
      and sg.get("crm_en_attente") is False
      and sg.get("pin_autorise") is True
      and sg.get("pdf_reference") == f"contrats/log1/{REF_C}_contrat.pdf"
      and "signature" not in json.dumps(sg)
      and "hash" not in json.dumps(sg),
      f"HTTP {code} {sg}")

code, st1 = get("decision", "/contrat?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_C}))
check("GET signe log1 : horodatage + optins + sans raw",
      code == 200 and isinstance(st1, dict)
      and st1.get("statut") == "signe"
      and st1.get("horodatage") != ""
      and st1.get("optins", {}).get("optin_crm_retour") is True
      and st1.get("code_retour") == f"DIRECT-10-{REF_C}"
      and "tactile-base64" not in json.dumps(st1)
      and "hash" not in json.dumps(st1).lower()
      and st1.get("signature_sha256") == "",
      f"HTTP {code} {st1}")

# Re-signature même ref -> 200 re_signe (mise à jour horodatée).
code, sg2 = post("decision", "/contrat",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_C, "nom_voyageur": "Test Voyageur",
                  "signature": "tactile-base64-signe-lab-v2-correction",
                  "accepte_cgv": True,
                  "optins": {"optin_crm_retour": True}})
check("re-signature meme ref -> 200 re_signe",
      code == 200 and isinstance(sg2, dict)
      and sg2.get("statut") == "re_signe",
      f"HTTP {code} {sg2}")

# Log2 (crm off + geoloc off en lab) : optins stockés sans code ni suivi.
REF_C2 = f"{REF_C}-L2"
code, sg_l2 = post("decision", "/contrat",
                   {"logement_id": "log2", "qui": "personne_01",
                    "ref_resa": REF_C2, "nom_voyageur": "Test Voyageur",
                    "signature": "tactile-base64-signe-lab-log2",
                    "accepte_cgv": True,
                    "optins": {"optin_geoloc": True,
                               "optin_crm_retour": True}})
check("signature log2 off : stockee sans code (crm_en_attente)",
      code == 201 and isinstance(sg_l2, dict)
      and sg_l2.get("geoloc_statut") == "geoloc_stockee_sans_suivi"
      and sg_l2.get("code_retour") == ""
      and sg_l2.get("crm_en_attente") is True,
      f"HTTP {code} {sg_l2}")

# Opt-in mémoire via contrat : fiche persistée + GET /memoire reconnu.
REF_CM = f"{REF_C}-MEM"
code, sg_m = post("decision", "/contrat",
                  {"logement_id": "log1", "qui": "personne_01",
                   "ref_resa": REF_CM, "nom_voyageur": "Test Voyageur",
                   "signature": "tactile-base64-signe-lab-memoire",
                   "accepte_cgv": True,
                   "optins": {"optin_memoire": True},
                   "hash": HASH_LAB})
check("contrat optin_memoire -> persiste fiche",
      code == 201 and isinstance(sg_m, dict)
      and sg_m.get("optin_memoire_persiste") is True,
      f"HTTP {code} {sg_m}")
code, fiche_cm = get("decision", f"/memoire?logement_id=log1&hash={HASH_LAB}")
check("fiche memoire via contrat reconnue",
      code == 200 and isinstance(fiche_cm, dict)
      and fiche_cm.get("statut") == "reconnu",
      f"HTTP {code} {fiche_cm}")
code, out_cm = post("decision", "/memoire",
                    {"action": "optout", "logement_id": "log1",
                     "qui": "personne_01", "hash": HASH_LAB})
check("opt-out apres contrat -> 200 oublie", code == 200
      and isinstance(out_cm, dict)
      and out_cm.get("fiche_supprimee") is True,
      f"HTTP {code} {out_cm}")

# Liaison questionnaire : dépôt puis signature maj contrat.accepte_cgv.
REF_QC = f"{REF_C}-Q"
code, dep_qc = post("decision", "/questionnaire",
                    {"logement_id": "log1", "qui": "personne_01",
                     "ref_resa": REF_QC,
                     "arrivee": {"date_arrivee": "2099-06-01"},
                     "reponses": {}})
check("questionnaire pre-contrat 201", code == 201,
      f"HTTP {code} {dep_qc}")
code, sg_qc = post("decision", "/contrat",
                   {"logement_id": "log1", "qui": "personne_01",
                    "ref_resa": REF_QC, "nom_voyageur": "Test Voyageur",
                    "signature": "tactile-base64-signe-lab-liaison",
                    "accepte_cgv": True})
check("signature liee questionnaire 201", code == 201,
      f"HTTP {code} {sg_qc}")
code, j1_qc = get("decision", "/questionnaire?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_QC}))
check("questionnaire maj : contrat accepte sans ecraser",
      code == 200 and isinstance(j1_qc, dict)
      and (j1_qc.get("pre_rempli") is not None
           or j1_qc.get("completude", {}).get("etat") in (
               "incomplet", "repondu_complet")),
      f"HTTP {code} {j1_qc}")

# J-2 enrichi : direct sans contrat = pin_autorise False indicatif ;
# direct signé = True ; legacy sans canal = True (rétro-compat).
REF_J2 = f"{REF_C}-J2"


def event_ref(type_evt, logement, qui, ref, data):
    return post("decision", "/event", {"type": type_evt,
                                       "logement_id": logement,
                                       "qui": qui, "ref": ref,
                                       "data": data})


code, j2_nosign = event_ref("lcd_j2_envoi_acces", "log1", "personne_01",
                            REF_J2,
                            {**BASE_DATA, "langue": "fr", "pin": "482913",
                             "canal": "direct"})
check("J-2 direct non signe : contrat False + pin False (jamais bloquant)",
      code in (200, 202) and isinstance(j2_nosign, dict)
      and j2_nosign.get("contrat_signe") is False
      and j2_nosign.get("pin_autorise") is False
      and j2_nosign.get("gabarit_trouve") is True,
      f"HTTP {code} {j2_nosign}")
code, sg_j2 = post("decision", "/contrat",
                   {"logement_id": "log1", "qui": "personne_01",
                    "ref_resa": REF_J2, "nom_voyageur": "Test Voyageur",
                    "signature": "tactile-base64-signe-lab-j2",
                    "accepte_cgv": True})
check("signature J-2 201", code == 201, f"HTTP {code} {sg_j2}")
code, j2_sign = event_ref("lcd_j2_envoi_acces", "log1", "personne_01",
                          REF_J2,
                          {**BASE_DATA, "langue": "fr", "pin": "482913",
                           "canal": "direct"})
check("J-2 direct signe : contrat True + pin True",
      code in (200, 202) and isinstance(j2_sign, dict)
      and j2_sign.get("contrat_signe") is True
      and j2_sign.get("pin_autorise") is True,
      f"HTTP {code} {j2_sign}")

print()
print("== 14. etat des lieux auto voyageur : consentement + photos E/S + video + comparatif + cloture liee (P6-16 §5.6) ==")
# GET statut : 400 sans ref, 404 logement inconnu, 400 ref traversée.
code, obj = get("dispatch", "/edl?logement_id=log1")
check("GET /edl sans ref_resa -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("dispatch", "/edl?logement_id=logX&ref_resa=LAB-P616-X")
check("GET /edl logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = get("dispatch", "/edl?logement_id=log1&ref_resa=..%2Fevil")
check("GET /edl ref traversee bloquee 400", code == 400, f"HTTP {code} {obj}")

REF_E = f"LAB-P616-{int(time.time())}"
code, st0 = get("dispatch", "/edl?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_E}))
check("GET /edl non_commence + 5 pieces attendues + jamais bloquant",
      code == 200 and isinstance(st0, dict)
      and st0.get("statut") == "non_commence"
      and st0.get("pieces_attendues") == ["salon", "cuisine", "chambre",
                                          "sdb", "entree"]
      and st0.get("consentement") is False
      and st0.get("jamais_bloquant") is True,
      f"HTTP {code} {st0}")

# Garde-fous consentement : qui auto, ref traversée, logement inconnu.
code, obj = post("dispatch", "/edl-consentement",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "qui": "auto", "consentement": True})
check("edl-consentement qui=auto refuse 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/edl-consentement",
                 {"logement_id": "log1", "ref_resa": "../evil",
                  "qui": "lab_voyageur_01", "consentement": True})
check("edl-consentement ref traversee bloquee 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/edl-consentement",
                 {"logement_id": "logX", "ref_resa": REF_E,
                  "qui": "lab_voyageur_01", "consentement": True})
check("edl-consentement logement inconnu -> 404", code == 404,
      f"HTTP {code} {obj}")

# Photo sans consentement -> 403 (préalable obligatoire).
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "entree", "piece": "salon", "nom": "test.png",
                  "donnees_base64": PETITE_PHOTO,
                  "qui": "lab_voyageur_01"})
check("edl-photo sans consentement -> 403 consentement_requis",
      code == 403 and isinstance(obj, dict)
      and obj.get("code") == "consentement_requis",
      f"HTTP {code} {obj}")

# Refus -> 200 refuse (EDL manuel ménage seul), photo toujours 403.
REF_ER = f"{REF_E}-REFUS"
code, rf = post("dispatch", "/edl-consentement",
                {"logement_id": "log1", "ref_resa": REF_ER,
                 "qui": "lab_voyageur_01", "consentement": False})
check("edl-consentement false -> 200 refuse (manuel menage)",
      code == 200 and isinstance(rf, dict)
      and rf.get("statut") == "refuse",
      f"HTTP {code} {rf}")
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_ER,
                  "phase": "entree", "piece": "salon", "nom": "test.png",
                  "donnees_base64": PETITE_PHOTO,
                  "qui": "lab_voyageur_01"})
check("edl-photo apres refus -> 403", code == 403,
      f"HTTP {code} {obj}")

# Consentement true -> 201 consenti (purge 90 j, 5 pièces).
code, cs = post("dispatch", "/edl-consentement",
                {"logement_id": "log1", "ref_resa": REF_E,
                 "qui": "lab_voyageur_01", "consentement": True,
                 "nom_voyageur": "Voyageur Lab"})
check("edl-consentement true -> 201 consenti",
      code == 201 and isinstance(cs, dict)
      and cs.get("statut") == "consenti"
      and cs.get("purge_j") == 90
      and cs.get("pieces_attendues") == ["salon", "cuisine", "chambre",
                                         "sdb", "entree"],
      f"HTTP {code} {cs}")

# Garde-fous dépôt : pièce/phase/format/base64/galerie.
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "entree", "piece": "piscine", "nom": "test.png",
                  "donnees_base64": PETITE_PHOTO,
                  "qui": "lab_voyageur_01"})
check("edl-photo piece hors socle -> 400 piece_inconnue",
      code == 400 and isinstance(obj, dict)
      and obj.get("code") == "piece_inconnue",
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "milieu", "piece": "salon", "nom": "test.png",
                  "donnees_base64": PETITE_PHOTO,
                  "qui": "lab_voyageur_01"})
check("edl-photo phase inconnue -> 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "entree", "piece": "salon", "nom": "test.txt",
                  "donnees_base64": PETITE_PHOTO,
                  "qui": "lab_voyageur_01"})
check("edl-photo format refuse -> 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "entree", "piece": "salon", "nom": "test.png",
                  "donnees_base64": "!!!pas-base64!!!",
                  "qui": "lab_voyageur_01"})
check("edl-photo base64 invalide -> 400", code == 400,
      f"HTTP {code} {obj}")
vieux = (date.today() - timedelta(days=2)).isoformat() + "T10:00:00"
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "entree", "piece": "salon", "nom": "test.png",
                  "donnees_base64": PETITE_PHOTO, "prise_le": vieux,
                  "qui": "lab_voyageur_01"})
check("edl-photo galerie >24 h -> 422 galerie_refusee",
      code == 422 and isinstance(obj, dict)
      and obj.get("code") == "galerie_refusee",
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/edl-photo",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "entree", "piece": "salon", "nom": "test.png",
                  "donnees_base64": PETITE_PHOTO,
                  "qui": "auto"})
check("edl-photo qui=auto refuse 400", code == 400,
      f"HTTP {code} {obj}")

# 5 photos entrée (grand angle + points sensibles par pièce).
edl_entree_ok = True
for piece in ("salon", "cuisine", "chambre", "sdb", "entree"):
    code, ph = post("dispatch", "/edl-photo",
                    {"logement_id": "log1", "ref_resa": REF_E,
                     "phase": "entree", "piece": piece, "nom": "test.png",
                     "donnees_base64": PETITE_PHOTO,
                     "qui": "lab_voyageur_01"})
    ok = code == 201 and ph.get("piece") == piece
    edl_entree_ok = edl_entree_ok and ok
    print(f"[{'OK' if ok else 'KO'}] edl photo entree/{piece} — HTTP {code} {ph}")
    if not ok:
        ECHECS.append(f"edl photo entree/{piece}")
check("5 photos entree deposees (EXIF/horodatage)", edl_entree_ok, "")

code, st1 = get("dispatch", "/edl?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_E}))
check("GET /edl partiel : entree complete, sortie 5 manquantes",
      code == 200 and isinstance(st1, dict)
      and st1.get("statut") == "partiel"
      and st1.get("photos_entree") == 5
      and st1.get("pieces_manquantes_sortie") == ["salon", "cuisine",
                                                  "chambre", "sdb",
                                                  "entree"],
      f"HTTP {code} {st1}")

# Vidéo : 61 s refusée, 30 s acceptée (tour complet optionnel).
code, obj = post("dispatch", "/edl-video",
                 {"logement_id": "log1", "ref_resa": REF_E,
                  "phase": "entree", "nom": "tour.mp4",
                  "donnees_base64": PETITE_PHOTO, "duree_s": 61,
                  "qui": "lab_voyageur_01"})
check("edl-video 61 s -> 422 video_trop_longue",
      code == 422 and isinstance(obj, dict)
      and obj.get("code") == "video_trop_longue",
      f"HTTP {code} {obj}")
code, vd = post("dispatch", "/edl-video",
                {"logement_id": "log1", "ref_resa": REF_E,
                 "phase": "entree", "nom": "tour.mp4",
                 "donnees_base64": PETITE_PHOTO, "duree_s": 30,
                 "qui": "lab_voyageur_01"})
check("edl-video 30 s -> 201", code == 201
      and isinstance(vd, dict) and vd.get("duree_s") == 30,
      f"HTTP {code} {vd}")

# 5 photos sortie -> complet + comparatif présente partout.
edl_sortie_ok = True
for piece in ("salon", "cuisine", "chambre", "sdb", "entree"):
    code, ph = post("dispatch", "/edl-photo",
                    {"logement_id": "log1", "ref_resa": REF_E,
                     "phase": "sortie", "piece": piece, "nom": "test.png",
                     "donnees_base64": PETITE_PHOTO,
                     "qui": "lab_voyageur_01"})
    ok = code == 201 and ph.get("piece") == piece
    edl_sortie_ok = edl_sortie_ok and ok
    print(f"[{'OK' if ok else 'KO'}] edl photo sortie/{piece} — HTTP {code} {ph}")
    if not ok:
        ECHECS.append(f"edl photo sortie/{piece}")
check("5 photos sortie deposees", edl_sortie_ok, "")

code, st2 = get("dispatch", "/edl?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_E}))
comp = {list(c)[0]: list(c.values())[0]
        for c in (st2.get("comparatif", []) if isinstance(st2, dict) else [])}
check("GET /edl complet : 5+5 + comparatif presente + videos 1",
      code == 200 and isinstance(st2, dict)
      and st2.get("statut") == "complet"
      and st2.get("photos_entree") == 5 and st2.get("photos_sortie") == 5
      and st2.get("videos") == 1
      and all(v == "presente" for v in comp.values()),
      f"HTTP {code} {st2}")

# Liaison clôture ménage : EDL commencé mais sortie manquante -> 409,
# puis complet -> 201 remise_en_dispo (même socle P6-1 + traça P6-2).
REF_EC = f"{REF_E}-CLOT"
code, td_ec = post("dispatch", "/todos", {"logement_id": "log1",
                                          "ref_resa": REF_EC,
                                          "checkout": "2026-12-20",
                                          "checkin_suivant": "2026-12-21",
                                          "qui": "test-lab-humain"})
dos_ec = (td_ec.get("dossier", "") if isinstance(td_ec, dict) else "")
check("todos EDL-cloture 201", code == 201 and bool(dos_ec),
      f"HTTP {code} {td_ec}")
code, cs_ec = post("dispatch", "/edl-consentement",
                   {"logement_id": "log1", "ref_resa": REF_EC,
                    "qui": "lab_voyageur_01", "consentement": True})
check("consentement EDL-cloture 201", code == 201,
      f"HTTP {code} {cs_ec}")
for piece in ("salon", "cuisine", "chambre", "sdb", "entree"):
    post("dispatch", "/edl-photo",
         {"logement_id": "log1", "ref_resa": REF_EC,
          "phase": "entree", "piece": piece, "nom": "test.png",
          "donnees_base64": PETITE_PHOTO,
          "qui": "lab_voyageur_01"})
post("dispatch", "/menage-pointage",
     {"logement_id": "log1", "dossier": dos_ec,
      "evenement": "arrivee", "qui": "lab_menage_01"})
post("dispatch", "/menage-pointage",
     {"logement_id": "log1", "dossier": dos_ec,
      "evenement": "depart", "qui": "lab_menage_01"})
for phase in ("entree", "sortie"):
    post("dispatch", "/menage-photo",
         {"logement_id": "log1", "dossier": dos_ec,
          "phase": phase, "piece": "salon", "nom": "test.png",
          "donnees_base64": PETITE_PHOTO,
          "qui": "lab_menage_01"})
code, mi_ec = post("dispatch", "/mission", {"logement_id": "log1",
                                            "presta_id": "lab_plomb_01",
                                            "motif": f"edl_p616_{REF_EC}",
                                            "qui": "test-lab-humain"})
nom_ec = (mi_ec.get("dossier", "") if isinstance(mi_ec, dict)
          else "").rsplit("/", 1)[-1]
for ev in ("arrivee", "depart"):
    post("dispatch", "/pointage", {"logement_id": "log1", "dossier": nom_ec,
                                   "evenement": ev, "qui": "lab_plomb_01"})
for phase in ("avant", "apres"):
    post("dispatch", "/photo", {"logement_id": "log1", "dossier": nom_ec,
                                "phase": phase, "piece": "cuisine",
                                "nom": "test.png",
                                "donnees_base64": PETITE_PHOTO,
                                "qui": "lab_plomb_01"})
post("dispatch", "/cloture", {"logement_id": "log1", "dossier": nom_ec,
                              "qui": "test-lab-humain"})
code, cl_prem = post("dispatch", "/menage-cloture",
                     {"logement_id": "log1", "dossier": dos_ec,
                      "checklist": {}, "photos_voyageur_ok": True,
                      "dossier_intervention": nom_ec,
                      "qui": "test-lab-humain"})
cochees_ec = {c: True for c in
              (cl_prem.get("cases_manquantes", [])
               if isinstance(cl_prem, dict) else [])}
code, cl_ec = post("dispatch", "/menage-cloture",
                   {"logement_id": "log1", "dossier": dos_ec,
                    "checklist": cochees_ec, "photos_voyageur_ok": True,
                    "dossier_intervention": nom_ec,
                    "qui": "test-lab-humain"})
check("cloture avec EDL sortie manquante -> 409 edl incomplet",
      code == 409 and isinstance(cl_ec, dict)
      and any("etat des lieux voyageur incomplet" in m
              for m in cl_ec.get("manquants", [])),
      f"HTTP {code} {cl_ec}")
for piece in ("salon", "cuisine", "chambre", "sdb", "entree"):
    post("dispatch", "/edl-photo",
         {"logement_id": "log1", "ref_resa": REF_EC,
          "phase": "sortie", "piece": piece, "nom": "test.png",
          "donnees_base64": PETITE_PHOTO,
          "qui": "lab_voyageur_01"})
code, cl_ok = post("dispatch", "/menage-cloture",
                   {"logement_id": "log1", "dossier": dos_ec,
                    "checklist": cochees_ec, "photos_voyageur_ok": True,
                    "dossier_intervention": nom_ec,
                    "qui": "test-lab-humain"})
check("cloture apres EDL complet -> 201 remise_en_dispo",
      code == 201 and isinstance(cl_ok, dict)
      and cl_ok.get("statut") == "remise_en_dispo",
      f"HTTP {code} {cl_ok}")

# Purge 90 j : qui auto refusé, humaine -> compteurs SÛRS.
code, obj = post("dispatch", "/edl-purge", {"logement_id": "log1",
                                            "qui": "auto"})
check("edl-purge qui=auto refuse 400", code == 400,
      f"HTTP {code} {obj}")
code, pg = post("dispatch", "/edl-purge", {"logement_id": "log1",
                                           "qui": "test-lab-humain"})
check("edl-purge humaine -> 200 purgees 0 + restantes >= 2",
      code == 200 and isinstance(pg, dict)
      and pg.get("statut") == "purge" and pg.get("purgees") == 0
      and pg.get("restantes", 0) >= 2,
      f"HTTP {code} {pg}")

print()
print("== 15. boucle avis J+1 : enquete + rattrapage + geste + pre-reponse + scenes + objets + livret (P6-17 §5.7-bis) ==")
# GET statut : 400 sans ref, 404 logement inconnu, 400 ref traversée.
code, obj = get("decision", "/avis?logement_id=log1")
check("GET /avis sans ref_resa -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/avis?logement_id=logX&ref_resa=LAB-P617-X")
check("GET /avis logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = get("decision", "/avis?logement_id=log1&ref_resa=..%2Fevil")
check("GET /avis ref traversee bloquee 400", code == 400, f"HTTP {code} {obj}")

REF_A = f"LAB-P617-{int(time.time())}"
code, st0 = get("decision", "/avis?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_A}))
check("GET /avis non_repondue + echelle 1-5 + jamais bloquant",
      code == 200 and isinstance(st0, dict)
      and st0.get("statut") == "non_repondue"
      and st0.get("echelle") == [1, 2, 3, 4, 5]
      and st0.get("jamais_bloquant") is True,
      f"HTTP {code} {st0}")

# Garde-fous dépôt : qui auto, ref traversée, logement inconnu, note.
code, obj = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "auto",
                  "ref_resa": REF_A, "note": 5})
check("avis qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": "../evil", "note": 5})
check("avis ref traversee bloquee 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/avis",
                 {"logement_id": "logX", "qui": "personne_01",
                  "ref_resa": REF_A, "note": 5})
check("avis logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A})
check("avis sans note -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A, "note": 6})
check("avis note 6 -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A, "note": 0})
check("avis note 0 -> 400", code == 400, f"HTTP {code} {obj}")

# Note 5 -> lien public (timing optimal, note protégée).
code, av5 = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A, "note": 5,
                  "commentaire": "Parfait séjour, merci !"})
check("avis 5 -> 201 cree + lien_public",
      code == 201 and isinstance(av5, dict)
      and av5.get("statut") == "cree"
      and av5.get("routage") == "lien_public"
      and av5.get("jamais_bloquant") is True,
      f"HTTP {code} {av5}")
code, st5 = get("decision", "/avis?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_A}))
check("GET /avis repondue note 5",
      code == 200 and isinstance(st5, dict)
      and st5.get("note") == 5 and st5.get("routage") == "lien_public",
      f"HTTP {code} {st5}")

# Correction même ref -> 200 corrige.
code, av4 = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A, "note": 4})
check("avis correction meme ref -> 200 corrige",
      code == 200 and isinstance(av4, dict)
      and av4.get("statut") == "corrige" and av4.get("note") == 4,
      f"HTTP {code} {av4}")

# Note 3 -> rattrapage + late_gratuite auto (<=20 €, sans validation).
REF_A3 = f"{REF_A}-N3"
code, av3 = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A3, "note": 3,
                  "commentaire": "Correct sans plus."})
check("avis 3 -> rattrapage + late_gratuite auto validee",
      code == 201 and isinstance(av3, dict)
      and av3.get("routage") == "rattrapage_prive"
      and av3.get("geste", {}).get("type") == "late_gratuite"
      and av3.get("geste_valide") is True,
      f"HTTP {code} {av3}")

# Note 2 + commentaire ménage -> rattrapage + geste à valider + todo.
REF_A2 = f"{REF_A}-N2"
code, av2 = post("decision", "/avis",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A2, "note": 2,
                  "commentaire": "Ménage sale à l'arrivée, déçu."})
check("avis 2 -> validation requise + geste propose + todo menage",
      code == 201 and isinstance(av2, dict)
      and av2.get("routage") == "rattrapage_prive"
      and av2.get("geste", {}).get("validation_requise") is True
      and av2.get("geste_valide") is False
      and av2.get("todo_correctif") == "correctif_menage",
      f"HTTP {code} {av2}")

# Geste : qui auto, geste inconnu, sans enquête -> 400/400/404.
code, obj = post("decision", "/avis-geste",
                 {"logement_id": "log1", "qui": "auto",
                  "ref_resa": REF_A2, "geste": "moins_10_direct"})
check("avis-geste qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/avis-geste",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A2, "geste": "champagne"})
check("avis-geste inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/avis-geste",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": f"{REF_A}-VIDE", "geste": "moins_10_direct"})
check("avis-geste sans enquete -> 404", code == 404, f"HTTP {code} {obj}")

# Validation 1-tap humaine 30 € -> alerte montant (jamais de débit auto).
code, gs = post("decision", "/avis-geste",
                {"logement_id": "log1", "qui": "personne_01",
                 "ref_resa": REF_A2, "geste": "remboursement_partiel",
                 "montant_eur": 30})
check("avis-geste 30 EUR -> 200 + alerte_montant",
      code == 200 and isinstance(gs, dict)
      and gs.get("statut") == "geste_valide"
      and gs.get("alerte_montant") is True,
      f"HTTP {code} {gs}")
code, st2 = get("decision", "/avis?" + urllib.parse.urlencode(
    {"logement_id": "log1", "ref_resa": REF_A2}))
check("GET /avis geste valide + rattrapage",
      code == 200 and isinstance(st2, dict)
      and st2.get("geste_valide") is True
      and st2.get("statut") == "rattrapage",
      f"HTTP {code} {st2}")

# Pré-réponse : valider sans brouillon -> 409 ; texte à promesse -> 422.
code, obj = post("decision", "/avis-reponse",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A2, "action": "valider"})
check("avis-reponse sans brouillon -> 409 brouillon_requis",
      code == 409 and isinstance(obj, dict)
      and obj.get("code") == "brouillon_requis",
      f"HTTP {code} {obj}")
code, obj = post("decision", "/avis-reponse",
                 {"logement_id": "log1", "qui": "personne_01",
                  "ref_resa": REF_A2, "action": "brouillon",
                  "texte": "Nous vous offrons un remboursement total."})
check("avis-reponse promesse -> 422 promesse_detectee",
      code == 422 and isinstance(obj, dict)
      and obj.get("code") == "promesse_detectee",
      f"HTTP {code} {obj}")
code, br = post("decision", "/avis-reponse",
                {"logement_id": "log1", "qui": "personne_01",
                 "ref_resa": REF_A2, "action": "brouillon"})
check("avis-reponse brouillon gabarit -> 201",
      code == 201 and isinstance(br, dict)
      and br.get("statut") == "brouillon"
      and br.get("source") == "gabarit",
      f"HTTP {code} {br}")
code, vr = post("decision", "/avis-reponse",
                {"logement_id": "log1", "qui": "personne_01",
                 "ref_resa": REF_A2, "action": "valider"})
check("avis-reponse valider -> 200 validee (publication manuelle)",
      code == 200 and isinstance(vr, dict)
      and vr.get("statut") == "validee",
      f"HTTP {code} {vr}")

# Scènes 1-tap : catalogue + activation.
code, obj = get("decision", "/scenes")
check("GET /scenes sans logement -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/scenes?logement_id=logX")
check("GET /scenes logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, sc = get("decision", "/scenes?logement_id=log1")
ids_sc = sorted(s.get("id") for s in sc.get("scenes", [])) \
    if isinstance(sc, dict) else []
check("GET /scenes log1 : 3 scenes",
      code == 200 and ids_sc == ["arrivee", "depart", "nuit_calme"],
      f"HTTP {code} {sc}")
code, obj = post("decision", "/scene",
                 {"logement_id": "log1", "qui": "personne_01",
                  "scene": "sieste"})
check("scene inconnue -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/scene",
                 {"logement_id": "log1", "qui": "auto",
                  "scene": "arrivee"})
check("scene qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, sn = post("decision", "/scene",
                {"logement_id": "log1", "qui": "personne_01",
                 "ref_resa": REF_A, "scene": "nuit_calme"})
check("scene nuit_calme -> 200 + actions",
      code == 200 and isinstance(sn, dict)
      and sn.get("statut") == "scene_activee"
      and "rappel_22h_8h" in sn.get("actions", []),
      f"HTTP {code} {sn}")

print("== 15-bis. objets trouves : fiche + photo + J+0 + forfait 15 EUR + don/stock (P6-17 §5.7-bis) ==")
# Garde-fous création : qui auto, sans description, logement inconnu.
code, obj = post("dispatch", "/objet-trouve",
                 {"logement_id": "log1", "qui": "auto",
                  "description": "Chargeur USB-C noir"})
check("objet-trouve qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("dispatch", "/objet-trouve",
                 {"logement_id": "log1", "qui": "lab_menage_01"})
check("objet-trouve sans description -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("dispatch", "/objet-trouve",
                 {"logement_id": "logX", "qui": "lab_menage_01",
                  "description": "Chargeur USB-C noir"})
check("objet-trouve logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")

code, ot = post("dispatch", "/objet-trouve",
                {"logement_id": "log1", "qui": "lab_menage_01",
                 "description": "Chargeur USB-C noir", "piece": "salon",
                 "ref_resa": REF_A, "photo_base64": PETITE_PHOTO})
oid = ot.get("objet_id", "") if isinstance(ot, dict) else ""
check("objet-trouve 201 + forfait 15 + message J+0",
      code == 201 and isinstance(ot, dict) and bool(oid)
      and ot.get("forfait_eur") == 15
      and "J+0" in ot.get("message_j0", ""),
      f"HTTP {code} {ot}")

code, obj = get("dispatch", "/objets")
check("GET /objets sans logement -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("dispatch", "/objets?logement_id=log1&statut=perdu")
check("GET /objets statut inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, li = get("dispatch", "/objets?" + urllib.parse.urlencode(
    {"logement_id": "log1", "statut": "trouve"}))
trouves = [o.get("objet_id") for o in li.get("objets", [])] \
    if isinstance(li, dict) else []
check("GET /objets trouve liste l'objet",
      code == 200 and oid in trouves,
      f"HTTP {code} total={li.get('total') if isinstance(li, dict) else li}")

# Réclamation : sans ref -> 400 ; OK -> 200 ; envoi sans preuve -> 402.
code, obj = post("dispatch", "/objet-reclamer",
                 {"logement_id": "log1", "objet_id": oid,
                  "qui": "personne_01"})
check("objet-reclamer sans ref -> 400", code == 400, f"HTTP {code} {obj}")
code, rc = post("dispatch", "/objet-reclamer",
                {"logement_id": "log1", "objet_id": oid,
                 "qui": "personne_01", "ref_resa": REF_A})
check("objet-reclamer -> 200 reclame + forfait 15",
      code == 200 and isinstance(rc, dict)
      and rc.get("statut") == "reclame"
      and rc.get("forfait_eur") == 15,
      f"HTTP {code} {rc}")
code, obj = post("dispatch", "/objet-envoyer",
                 {"logement_id": "log1", "objet_id": oid,
                  "qui": "personne_01"})
check("objet-envoyer sans preuve -> 402 paiement_requis",
      code == 402 and isinstance(obj, dict)
      and obj.get("code") == "paiement_requis",
      f"HTTP {code} {obj}")
code, ev = post("dispatch", "/objet-envoyer",
                {"logement_id": "log1", "objet_id": oid,
                 "qui": "personne_01",
                 "preuve_paiement": "pi_test_lab_15"})
check("objet-envoyer preuve -> 200 envoye",
      code == 200 and isinstance(ev, dict)
      and ev.get("statut") == "envoye",
      f"HTTP {code} {ev}")
code, obj = post("dispatch", "/objet-reclamer",
                 {"logement_id": "log1", "objet_id": oid,
                  "qui": "personne_01", "ref_resa": REF_A})
check("objet-reclamer deja traite -> 409", code == 409,
      f"HTTP {code} {obj}")

# Clôture : sort inconnu -> 400 ; trouvé récent -> 409 trop_tot.
REF_O2 = f"{REF_A}-OBJ2"
code, ot2 = post("dispatch", "/objet-trouve",
                 {"logement_id": "log1", "qui": "lab_menage_01",
                  "description": "Casquette bleue"})
oid2 = ot2.get("objet_id", "") if isinstance(ot2, dict) else ""
code, obj = post("dispatch", "/objet-cloturer",
                 {"logement_id": "log1", "objet_id": oid2,
                  "qui": "personne_01", "sort": "poubelle"})
check("objet-cloturer sort inconnu -> 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/objet-cloturer",
                 {"logement_id": "log1", "objet_id": oid2,
                  "qui": "personne_01", "sort": "don"})
check("objet-cloturer recent -> 409 trop_tot (30 j)",
      code == 409 and isinstance(obj, dict)
      and obj.get("code") == "trop_tot",
      f"HTTP {code} {obj}")

print("== 15-ter. livret video 30 s/equipement : QR + video locale, lecture seule (P6-17 §5.7-bis) ==")
code, obj = get("extras", "/livret")
check("GET /livret sans logement -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("extras", "/livret?logement_id=logX")
check("GET /livret logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, lv = get("extras", "/livret?logement_id=log1")
ids_lv = sorted(f.get("id") for f in lv.get("fiches", [])) \
    if isinstance(lv, dict) else []
check("GET /livret log1 : 5 fiches + QR + video locale 30 s",
      code == 200 and isinstance(lv, dict) and lv.get("total") == 5
      and ids_lv == ["clim", "ll", "lv", "portail", "tri"]
      and all(f.get("qr") == f"/livret/{f.get('id')}"
              and f.get("video_url") == f"/local/livret/{f.get('id')}.mp4"
              and f.get("duree_s") == 30
              for f in lv.get("fiches", [])),
      f"HTTP {code} {lv}")
code, lv2 = get("extras", "/livret?logement_id=log2")
check("GET /livret log2 upsell off : guide de base dispo",
      code == 200 and isinstance(lv2, dict) and lv2.get("total") == 5,
      f"HTTP {code} {lv2}")

print()
print("== 16. compta auto : ingestion + confiance + payouts + rapprochement + jauges + simulateur + cloture (P6-18 §12.6) ==")
AN = str(date.today().year)
# Garde-fous facture : qui auto, sans montant, montant 0, logement inconnu.
code, obj = post("compta", "/facture",
                 {"logement_id": "log1", "qui": "auto",
                  "montant_ttc": 240})
check("facture qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("compta", "/facture",
                 {"logement_id": "log1", "qui": "test-lab-humain"})
check("facture sans montant -> 422 montant_requis",
      code == 422 and isinstance(obj, dict)
      and obj.get("code") == "montant_requis",
      f"HTTP {code} {obj}")
code, obj = post("compta", "/facture",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "montant_ttc": 0})
check("facture montant 0 -> 422", code == 422, f"HTTP {code} {obj}")
code, obj = post("compta", "/facture",
                 {"logement_id": "logX", "qui": "test-lab-humain",
                  "montant_ttc": 240})
check("facture logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = post("compta", "/facture",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "montant_ttc": 240, "rubrique": "yacht"})
check("facture rubrique inconnue -> 400", code == 400, f"HTTP {code} {obj}")

# Facture complète (NodOn, texte OCR, date) -> hardware, confiance haute.
code, fc = post("compta", "/facture",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "montant_ttc": 240, "tva": 40,
                 "fournisseur": "NodOn",
                 "texte_ocr": "Module fil pilote SIN-4-FP-21 Zigbee chauffage",
                 "date": date.today().isoformat()})
fid_hw = fc.get("facture_id", "") if isinstance(fc, dict) else ""
check("facture NodOn 201 + hardware + ht 200 + confiance >= 0.7",
      code == 201 and isinstance(fc, dict)
      and fc.get("rubrique") == "hardware" and fc.get("ht") == 200
      and fc.get("confiance", 0) >= 0.7
      and fc.get("statut") == "brouillon"
      and fc.get("file_validation") is False,
      f"HTTP {code} {fc}")

# Facture vague (montant seul) -> divers, basse confiance, file validation.
code, fv = post("compta", "/facture",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "montant_ttc": 50})
fid_vague = fv.get("facture_id", "") if isinstance(fv, dict) else ""
check("facture vague 201 + divers + file validation",
      code == 201 and isinstance(fv, dict)
      and fv.get("rubrique") == "divers"
      and fv.get("confiance", 1) < 0.7
      and fv.get("statut") == "brouillon_a_valider"
      and fv.get("file_validation") is True,
      f"HTTP {code} {fv}")

code, lf = get("compta", "/factures?" + urllib.parse.urlencode(
    {"logement_id": "log1", "annee": AN}))
check("GET /factures liste 2 + file >= 1",
      code == 200 and isinstance(lf, dict) and lf.get("total", 0) >= 2
      and lf.get("file_validation", 0) >= 1,
      f"HTTP {code} total={lf.get('total') if isinstance(lf, dict) else lf}")

# Validation 1-tap : qui auto, inconnue, OK (+ correction rubrique).
code, obj = post("compta", "/facture-valider",
                 {"logement_id": "log1", "facture_id": fid_vague,
                  "qui": "auto"})
check("facture-valider qui=auto refuse 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("compta", "/facture-valider",
                 {"logement_id": "log1", "facture_id": "FAC-20990101-999",
                  "qui": "test-lab-humain"})
check("facture-valider inconnue -> 404", code == 404, f"HTTP {code} {obj}")
code, vv = post("compta", "/facture-valider",
                {"logement_id": "log1", "facture_id": fid_vague,
                 "qui": "test-lab-humain", "rubrique": "menage"})
check("facture-valider 200 menage",
      code == 200 and isinstance(vv, dict)
      and vv.get("statut") == "validee"
      and vv.get("rubrique") == "menage",
      f"HTTP {code} {vv}")
code, vv2 = post("compta", "/facture-valider",
                 {"logement_id": "log1", "facture_id": fid_hw,
                  "qui": "test-lab-humain"})
check("facture-valider hardware 200", code == 200, f"HTTP {code} {vv2}")

# Payouts : garde-fous puis 3 imports (airbnb net 425, direct 300, booking).
code, obj = post("compta", "/payout",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "canal": "mars", "montant": 500,
                  "date": date.today().isoformat()})
check("payout canal inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("compta", "/payout",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "canal": "airbnb", "montant": 0,
                  "date": date.today().isoformat()})
check("payout montant 0 -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("compta", "/payout",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "canal": "airbnb", "montant": 500, "date": "pas-une-date"})
check("payout date illisible -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("compta", "/payout",
                 {"logement_id": "logX", "qui": "test-lab-humain",
                  "canal": "airbnb", "montant": 500,
                  "date": date.today().isoformat()})
check("payout logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")

J_MOINS_10 = (date.today() - timedelta(days=10)).isoformat()
J_MOINS_20 = (date.today() - timedelta(days=20)).isoformat()
J_MOINS_9 = (date.today() - timedelta(days=9)).isoformat()
code, pa = post("compta", "/payout",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "canal": "airbnb", "montant": 500, "commission": 75,
                 "date": J_MOINS_10, "ref_resa": f"LAB-P618-{int(time.time())}",
                 "nuits": 5})
pid_airbnb = pa.get("payout_id", "") if isinstance(pa, dict) else ""
check("payout airbnb 201 net 425",
      code == 201 and isinstance(pa, dict) and pa.get("net") == 425,
      f"HTTP {code} {pa}")
code, pd = post("compta", "/payout",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "canal": "direct", "montant": 300,
                 "date": date.today().isoformat(), "nuits": 2})
pid_direct = pd.get("payout_id", "") if isinstance(pd, dict) else ""
check("payout direct 201 net 300", code == 201, f"HTTP {code} {pd}")
code, pb = post("compta", "/payout",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "canal": "booking", "montant": 200, "commission": 34,
                 "date": J_MOINS_20, "nuits": 3})
check("payout booking 201 net 166", code == 201
      and isinstance(pb, dict) and pb.get("net") == 166,
      f"HTTP {code} {pb}")

# Relevé : airbnb rapproché (425 à J-9, écart 0), direct en écart (999 vs
# 300), booking orphelin (20 j sans ligne). Jamais d'écriture auto.
code, obj = post("compta", "/releve",
                 {"logement_id": "log1", "qui": "auto",
                  "lignes": [{"date": J_MOINS_9, "libelle": "x",
                              "montant": 1}]})
check("releve qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("compta", "/releve",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "lignes": []})
check("releve lignes vides -> 400", code == 400, f"HTTP {code} {obj}")
code, rl = post("compta", "/releve",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "annee": AN,
                 "lignes": [{"date": J_MOINS_9,
                             "libelle": "AIRBNB PAYOUT",
                             "montant": 425},
                            {"date": date.today().isoformat(),
                             "libelle": "VIREMENT INCONNU",
                             "montant": 999}]})
types_file = sorted(e.get("type") for e in rl.get("file", [])) \
    if isinstance(rl, dict) else []
check("releve : airbnb rapproche + ecart + orphelin (jamais auto)",
      code == 200 and isinstance(rl, dict)
      and pid_airbnb in rl.get("rapproches", [])
      and "ecart_montant" in types_file
      and "payout_orphelin" in types_file
      and rl.get("jamais_ecriture_auto") is True,
      f"HTTP {code} {rl}")

code, rp = get("compta", "/rapprochement?" + urllib.parse.urlencode(
    {"logement_id": "log1", "annee": AN}))
check("GET /rapprochement : 3 payouts, 1 rapproche, file >= 2",
      code == 200 and isinstance(rp, dict)
      and rp.get("payouts_total", 0) >= 3
      and rp.get("rapproches", 0) >= 1
      and len(rp.get("file", [])) >= 2,
      f"HTTP {code} {rp}")

# Finances : CA 425+300+166=891, charges 240+50=290, net 601, nuits 10.
code, obj = get("compta", "/finances?logement_id=log1&annee=" + AN
                + "&classement=yacht")
check("finances classement inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, fin = get("compta", "/finances?" + urllib.parse.urlencode(
    {"logement_id": "log1", "annee": AN}))
check("finances : CA 891 + charges 290 + net 601 + jauge ok",
      code == 200 and isinstance(fin, dict)
      and fin.get("ca") == 891 and fin.get("charges") == 290
      and fin.get("net") == 601
      and fin.get("jauge_ca", {}).get("plafond") == 15000
      and fin.get("jauge_ca", {}).get("alerte") == "ok"
      and fin.get("jauge_nuits", {}).get("valeur") == 10,
      f"HTTP {code} {fin}")

# Simulateur : micro 891*0.7=623.7 vs réel 891-290=601 -> réel avantagé.
code, obj = get("compta", "/simulateur?" + urllib.parse.urlencode(
    {"logement_id": "log1", "annee": AN, "amortissement": -5}))
check("simulateur amortissement negatif -> 400", code == 400,
      f"HTTP {code} {obj}")
code, sim = get("compta", "/simulateur?" + urllib.parse.urlencode(
    {"logement_id": "log1", "annee": AN}))
check("simulateur : micro 623.7 vs reel 601 + reco + levier + jamais auto",
      code == 200 and isinstance(sim, dict)
      and sim.get("micro", {}).get("base_imposable") == 623.7
      and sim.get("reel", {}).get("base_imposable") == 601
      and "comptable" in sim.get("recommandation", "")
      and sim.get("levier_classement", {}).get("gain_vs_non_classe", 0) > 0
      and sim.get("jamais_option_auto") is True,
      f"HTTP {code} {sim}")

# Clôture : mois courant trop tôt, mois précédent OK, re-clôture idempotente.
code, obj = post("compta", "/cloture",
                 {"logement_id": "log1", "qui": "auto",
                  "annee": int(AN), "mois": 1})
check("cloture qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
MOIS_PREC = date.today().month - 1 or 12
AN_PREC = int(AN) if date.today().month > 1 else int(AN) - 1
code, obj = post("compta", "/cloture",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "annee": int(AN), "mois": date.today().month})
check("cloture mois courant -> 409 trop_tot",
      code == 409 and isinstance(obj, dict)
      and obj.get("code") == "trop_tot",
      f"HTTP {code} {obj}")
code, cl = post("compta", "/cloture",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "annee": AN_PREC, "mois": MOIS_PREC})
check("cloture mois precedent -> 201 cloturee",
      code == 201 and isinstance(cl, dict)
      and cl.get("statut") == "cloturee"
      and isinstance(cl.get("recap"), dict),
      f"HTTP {code} {cl}")
code, cl2 = post("compta", "/cloture",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "annee": AN_PREC, "mois": MOIS_PREC})
check("re-cloture -> 200 deja_cloturee",
      code == 200 and isinstance(cl2, dict)
      and cl2.get("statut") == "deja_cloturee",
      f"HTTP {code} {cl2}")

print()
print("== 17. supplement menage 110 EUR : 10 postes + cout reel + derive + score qualite (P6-19 §12.2-ter) ==")
# Tarif : 400 sans logement, 404 logement inconnu.
code, obj = get("dispatch", "/menage-tarif")
check("GET /menage-tarif sans logement -> 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = get("dispatch", "/menage-tarif?logement_id=logX")
check("GET /menage-tarif logement inconnu -> 404", code == 404,
      f"HTTP {code} {obj}")
code, tf = get("dispatch", "/menage-tarif?logement_id=log1")
postes = tf.get("postes", []) if isinstance(tf, dict) else []
ids_postes = [p.get("id") for p in postes]
check("GET /menage-tarif log1 : 110 supplement + 10 postes + total 110",
      code == 200 and isinstance(tf, dict)
      and tf.get("montant") == 110
      and tf.get("facturation") == "supplement"
      and len(postes) == 10
      and ids_postes[-1] == "main_oeuvre"
      and tf.get("total_verifie") == 110
      and tf.get("surcharge_saison", {}).get("montant_eur") == 20
      and tf.get("surcharge_saison", {}).get("mois") == [6, 7, 8, 9]
      and tf.get("alerte_inclus") is False,
      f"HTTP {code} {tf}")
code, tf2 = get("dispatch", "/menage-tarif?logement_id=log2")
check("GET /menage-tarif log2 : 90 prorata + total 90",
      code == 200 and isinstance(tf2, dict)
      and tf2.get("montant") == 90
      and tf2.get("total_verifie") == 90
      and len(tf2.get("postes", [])) == 10,
      f"HTTP {code} {tf2}")

# Coûts : garde-fous puis 2 saisies (115 + 140 -> moyenne 127.5, dérive).
code, obj = post("dispatch", "/menage-cout",
                 {"logement_id": "log1", "qui": "auto", "montant": 115})
check("menage-cout qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("dispatch", "/menage-cout",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "montant": 0})
check("menage-cout montant 0 -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("dispatch", "/menage-cout",
                 {"logement_id": "logX", "qui": "test-lab-humain",
                  "montant": 115})
check("menage-cout logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, ct1 = post("dispatch", "/menage-cout",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "montant": 115, "ref_resa": f"LAB-P619-{int(time.time())}",
                  "facture": "presta + ticket pressing"})
check("menage-cout 115 -> 201 + derive rotation",
      code == 201 and isinstance(ct1, dict)
      and ct1.get("montant") == 115
      and ct1.get("rotations_suivies", 0) >= 1,
      f"HTTP {code} {ct1}")
code, ct2 = post("dispatch", "/menage-cout",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "montant": 140})
check("menage-cout 140 -> 201", code == 201, f"HTTP {code} {ct2}")
code, cs = get("dispatch", "/menage-couts?logement_id=log1")
check("GET /menage-couts : 2 rotations + moyenne 127.5 + alerte derive",
      code == 200 and isinstance(cs, dict)
      and cs.get("rotations", 0) >= 2
      and cs.get("cout_moyen_rotation") == 127.5
      and cs.get("derive_pct") == round((127.5 - 110) / 110, 4)
      and cs.get("alerte_derive") is True
      and cs.get("sensor", {}).get("montant_affiche") == 110,
      f"HTTP {code} {cs}")

# Notes : garde-fous + 3 notes (4/4/2 -> moyenne 3.33, alerte qualité).
code, obj = post("dispatch", "/menage-note",
                 {"logement_id": "log1", "qui": "auto", "note": 4})
check("menage-note qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("dispatch", "/menage-note",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "note": 6})
check("menage-note 6 -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("dispatch", "/menage-note",
                 {"logement_id": "logX", "qui": "test-lab-humain",
                  "note": 4})
check("menage-note logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
for n in (4, 4, 2):
    code, nt = post("dispatch", "/menage-note",
                    {"logement_id": "log1", "qui": "test-lab-humain",
                     "note": n, "commentaire": "rotation lab"})
    check(f"menage-note {n} -> 201",
          code == 201 and isinstance(nt, dict) and nt.get("note") == n,
          f"HTTP {code} {nt}")
code, sc = get("dispatch", "/menage-score?logement_id=log1")
check("GET /menage-score : 3 notes + moyenne 3.33 + alerte qualite",
      code == 200 and isinstance(sc, dict)
      and sc.get("notes_total", 0) >= 3
      and sc.get("score_moyen") == round((4 + 4 + 2) / 3, 2)
      and sc.get("alerte_qualite") is True
      and sc.get("duree_attendue_min") == 180,
      f"HTTP {code} {sc}")

# Lien temps : dossier pointé (durée ~0 vs 180 -> écart >20 %) + note.
code, td_t = post("dispatch", "/todos", {"logement_id": "log1",
                                          "ref_resa": f"LAB-P619-{int(time.time())}",
                                          "checkout": "2026-12-20",
                                          "checkin_suivant": "2026-12-21",
                                          "qui": "test-lab-humain"})
dos_t = (td_t.get("dossier", "") if isinstance(td_t, dict) else "")
post("dispatch", "/menage-pointage",
     {"logement_id": "log1", "dossier": dos_t,
      "evenement": "arrivee", "qui": "lab_menage_01"})
post("dispatch", "/menage-pointage",
     {"logement_id": "log1", "dossier": dos_t,
      "evenement": "depart", "qui": "lab_menage_01"})
code, nt_t = post("dispatch", "/menage-note",
                  {"logement_id": "log1", "qui": "test-lab-humain",
                   "note": 5, "dossier": dos_t})
check("menage-note dossier pointe -> alerte_temps (0 vs 180)",
      code == 201 and isinstance(nt_t, dict)
      and nt_t.get("alerte_temps") is True
      and nt_t.get("duree_presence_min") == 0,
      f"HTTP {code} {nt_t}")
code, obj = post("dispatch", "/menage-note",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "note": 5, "dossier": "dossier_inexistant_xyz"})
check("menage-note dossier inconnu -> 404", code == 404,
      f"HTTP {code} {obj}")

print()
print("== 18. RBAC 5 roles : audit MFA + revocation + journal 90 j (P6-20 §1.6) ==")
# Audit : 400 sans qui, 403 comptable (pas config_modif), 200 super_admin.
code, obj = get("decision", "/acces")
check("GET /acces sans qui -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/acces?qui=personne_04")
check("GET /acces comptable -> 403 (reserve super_admin/admin)",
      code == 403, f"HTTP {code} {obj}")
code, au = get("decision", "/acces?qui=personne_01")
pers = {p.get("id"): p for p in au.get("personnes", [])} \
    if isinstance(au, dict) else {}
check("GET /acces super_admin : 8 comptes (7 nominatifs + 1 machine) + MFA",
      code == 200 and isinstance(au, dict) and au.get("total") == 8
      and pers.get("dashboard_hote", {}).get("mfa_exigee") is False
      and pers.get("dashboard_hote", {}).get("statut") == "actif"
      and pers.get("personne_01", {}).get("mfa_exigee") is True
      and pers.get("personne_01", {}).get("mfa_active") is False
      and pers.get("personne_05", {}).get("mfa_exigee") is False
      and "personne_01" in au.get("alertes", {}).get("sans_mfa", [])
      and au.get("alertes", {}).get("doublons") == []
      and all(p.get("statut") == "actif" for p in pers.values()),
      f"HTTP {code} {au}")

# Révocation : 403 opérateur, 404 inconnu, 403 soi-même, 403 super_admin.
code, obj = post("decision", "/acces-revoquer",
                 {"qui": "personne_03", "personne_id": "personne_07"})
check("acces-revoquer operateur -> 403 (pas config_modif)",
      code == 403, f"HTTP {code} {obj}")
code, obj = post("decision", "/acces-revoquer",
                 {"qui": "personne_01", "personne_id": "fantome"})
check("acces-revoquer inconnue -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = post("decision", "/acces-revoquer",
                 {"qui": "personne_01", "personne_id": "personne_01"})
check("auto-revocation interdite -> 403", code == 403, f"HTTP {code} {obj}")
code, obj = post("decision", "/acces-revoquer",
                 {"qui": "personne_02", "personne_id": "personne_01"})
check("revocation super_admin protegee -> 403", code == 403,
      f"HTTP {code} {obj}")

# Révocation presta externe : 200, effet RBAC immédiat, idempotence.
code, rv = post("decision", "/acces-revoquer",
                {"qui": "personne_01", "personne_id": "personne_07",
                 "motif": "fin mission lab"})
check("acces-revoquer presta -> 200 revoque",
      code == 200 and isinstance(rv, dict)
      and rv.get("statut") == "revoque",
      f"HTTP {code} {rv}")
code, at = post("decision", "/autoriser",
                {"qui_id": "personne_07", "action": "event_envoi",
                 "logement_id": "log1"})
check("revoque : event_envoi bloque",
      code == 200 and isinstance(at, dict)
      and at.get("autorise") is False
      and "révoqué" in at.get("motif", ""),
      f"HTTP {code} {at}")
code, au2 = get("decision", "/acces?qui=personne_01")
pers2 = {p.get("id"): p for p in au2.get("personnes", [])} \
    if isinstance(au2, dict) else {}
check("audit : personne_07 revoque",
      code == 200 and pers2.get("personne_07", {}).get("statut")
      == "revoque"
      and "personne_07" in au2.get("alertes", {}).get("revoques", []),
      f"HTTP {code} {au2}")
code, obj = post("decision", "/acces-revoquer",
                 {"qui": "personne_01", "personne_id": "personne_07"})
check("re-revocation idempotente -> 200 deja_revoque",
      code == 200 and isinstance(obj, dict)
      and obj.get("statut") == "deja_revoque",
      f"HTTP {code} {obj}")

# Réactivation : 403 comptable, 200 super_admin, effet RBAC restauré.
code, obj = post("decision", "/acces-reactiver",
                 {"qui": "personne_04", "personne_id": "personne_07"})
check("acces-reactiver comptable -> 403", code == 403, f"HTTP {code} {obj}")
code, ra = post("decision", "/acces-reactiver",
                {"qui": "personne_01", "personne_id": "personne_07"})
check("acces-reactiver -> 200 reactive (pas expiree)",
      code == 200 and isinstance(ra, dict)
      and ra.get("statut") == "reactive"
      and ra.get("compte_expire") is False,
      f"HTTP {code} {ra}")
code, at2 = post("decision", "/autoriser",
                 {"qui_id": "personne_07", "action": "menage_cloture",
                  "logement_id": "log1"})
check("reactive : menage_cloture autorise a nouveau",
      code == 200 and isinstance(at2, dict)
      and at2.get("autorise") is True,
      f"HTTP {code} {at2}")
code, obj = post("decision", "/acces-reactiver",
                 {"qui": "personne_01", "personne_id": "personne_07"})
check("re-reactivation -> 200 deja_actif",
      code == 200 and isinstance(obj, dict)
      and obj.get("statut") == "deja_actif",
      f"HTTP {code} {obj}")

# Journal 90 j : 400 sans logement, 400 jours>90, 403 inconnu/hors périmètre.
code, obj = get("decision", "/journal?qui=personne_01")
check("GET /journal sans logement -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/journal?logement_id=log1&qui=personne_01&jours=200")
check("GET /journal jours>90 -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/journal?logement_id=logX&qui=personne_01")
check("GET /journal logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = get("decision", "/journal?logement_id=log1&qui=voyageur_x")
check("GET /journal qui inconnu -> 403", code == 403, f"HTTP {code} {obj}")
code, obj = get("decision", "/journal?logement_id=log2&qui=personne_03")
check("GET /journal hors perimetre -> 403", code == 403, f"HTTP {code} {obj}")
code, jo = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01"}))
check("GET /journal log1 : entrees non vides, PIN lab jamais en clair",
      code == 200 and isinstance(jo, dict)
      and jo.get("total", 0) > 0
      and "482913" not in json.dumps(jo.get("entrees", [])),
      f"HTTP {code} total={jo.get('total') if isinstance(jo, dict) else jo}")
code, jf = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01", "quoi": "acces"}))
check("GET /journal filtre quoi=acces",
      code == 200 and isinstance(jf, dict)
      and all(e.get("quoi") == "acces" for e in jf.get("entrees", [])),
      f"HTTP {code} {jf}")

# Voyageur = pas de compte nominatif (PWA séjour, jamais HA direct).
code, vg = post("decision", "/autoriser",
                {"qui_id": "voyageur_sejour_01", "action": "etat_lecture",
                 "logement_id": "log1"})
check("voyageur sans compte -> qui inconnu (PWA sejour seule)",
      code == 200 and isinstance(vg, dict)
      and vg.get("autorise") is False
      and "inconnu" in vg.get("motif", ""),
      f"HTTP {code} {vg}")

print()
print("== 19. carnet preuve tranquillite + lettre syndic + registre RGPD + mentions annonce (P6-21 §12.5-bis) ==")
TRIM_T2 = "2026-T2"
# Relevés dB : garde-fous (qui auto, sans db, hors bornes, heure, logement).
code, obj = post("decision", "/preuve-db",
                 {"logement_id": "log1", "qui": "auto", "db": 65})
check("preuve-db qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/preuve-db",
                 {"logement_id": "log1", "qui": "capteur-bruit-salon"})
check("preuve-db sans db -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/preuve-db",
                 {"logement_id": "log1", "qui": "capteur-bruit-salon",
                  "db": 200})
check("preuve-db 200 dB -> 400 (dB seuls 0-120)", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("decision", "/preuve-db",
                 {"logement_id": "log1", "qui": "capteur-bruit-salon",
                  "db": 65, "heure": "pas-une-heure"})
check("preuve-db heure illisible -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/preuve-db",
                 {"logement_id": "logX", "qui": "capteur-bruit-salon",
                  "db": 65})
check("preuve-db logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")

# 65 dB jour (14h, <75) + 70 dB nuit (23h30, >60) -> T2.
code, rj = post("decision", "/preuve-db",
                {"logement_id": "log1", "qui": "capteur-bruit-salon",
                 "db": 65, "heure": "2026-06-15T14:00:00",
                 "occupation": "occupe"})
check("releve jour 65 dB -> 201 sans depassement",
      code == 201 and isinstance(rj, dict)
      and rj.get("trimestre") == TRIM_T2
      and rj.get("nuit") is False
      and rj.get("depasse") is False,
      f"HTTP {code} {rj}")
code, rn = post("decision", "/preuve-db",
                {"logement_id": "log1", "qui": "capteur-bruit-salon",
                 "db": 70, "heure": "2026-06-15T23:30:00",
                 "occupation": "occupe"})
check("releve nuit 70 dB -> 201 depassement (seuil 60)",
      code == 201 and isinstance(rn, dict)
      and rn.get("nuit") is True
      and rn.get("depasse") is True
      and rn.get("seuil") == 60,
      f"HTTP {code} {rn}")

# Carnet : 400 sans qui, 403 presta (hôte seul), 400 trimestre, 404 logX.
code, obj = get("decision", "/carnet?logement_id=log1")
check("GET /carnet sans qui -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/carnet?logement_id=log1&qui=personne_07")
check("GET /carnet presta -> 403 hote seul", code == 403, f"HTTP {code} {obj}")
code, obj = get("decision", "/carnet?logement_id=logX&qui=personne_01")
check("GET /carnet logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")
code, obj = get("decision", "/carnet?logement_id=log1&qui=personne_01&trimestre=2026")
check("GET /carnet trimestre invalide -> 400", code == 400,
      f"HTTP {code} {obj}")
code, ca = get("decision", "/carnet?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01", "trimestre": TRIM_T2}))
check("GET /carnet T2 : 2 releves + 1 depassement nuit + jamais audio",
      code == 200 and isinstance(ca, dict)
      and ca.get("releves") == 2
      and ca.get("max_db") == 70
      and len(ca.get("depassements_nuit", [])) == 1
      and ca.get("depassements_jour") == []
      and ca.get("aucun_depassement") is False
      and ca.get("jamais_audio") is True,
      f"HTTP {code} {ca}")

# Attestations : type inconnu, ref traversée, puis ménage + rappel.
code, obj = post("decision", "/preuve-attestation",
                 {"logement_id": "log1", "qui": "personne_01",
                  "type": "diplome"})
check("attestation type inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/preuve-attestation",
                 {"logement_id": "log1", "qui": "personne_01",
                  "type": "menage", "ref": "../evil"})
check("attestation ref traversee bloquee 400", code == 400,
      f"HTTP {code} {obj}")
code, a1 = post("decision", "/preuve-attestation",
                {"logement_id": "log1", "qui": "personne_01",
                 "type": "menage", "ref": f"LAB-P621-{int(time.time())}",
                 "detail": "rotation OK, photos E/S versees"})
check("attestation menage -> 201", code == 201, f"HTTP {code} {a1}")
code, a2 = post("decision", "/preuve-attestation",
                {"logement_id": "log1", "qui": "personne_01",
                 "type": "message_rappel",
                 "detail": "rappel 22h-8h envoye PWA"})
check("attestation rappel -> 201", code == 201, f"HTTP {code} {a2}")
code, ca2 = get("decision", "/carnet?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_03"}))
check("GET /carnet trimestre courant operateur -> 200",
      code == 200 and isinstance(ca2, dict)
      and ca2.get("trimestre") != "",
      f"HTTP {code} {ca2}")

# Lettre : 403 presta, brouillon chiffré, envoi sans canal/brouillon, envoi.
code, obj = post("decision", "/lettre-tranquillite",
                 {"logement_id": "log1", "qui": "personne_07",
                  "trimestre": TRIM_T2})
check("lettre presta -> 403 hote seul", code == 403, f"HTTP {code} {obj}")
code, lt = post("decision", "/lettre-tranquillite",
                {"logement_id": "log1", "qui": "personne_01",
                 "trimestre": TRIM_T2, "destinataire": "syndic"})
check("lettre brouillon T2 -> 201 (1 depassement chiffre)",
      code == 201 and isinstance(lt, dict)
      and lt.get("statut") == "brouillon"
      and lt.get("trimestre") == TRIM_T2,
      f"HTTP {code} {lt}")
code, obj = post("decision", "/lettre-envoyer",
                 {"logement_id": "log1", "qui": "personne_01",
                  "trimestre": TRIM_T2})
check("lettre-envoyer sans canal -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/lettre-envoyer",
                 {"logement_id": "log1", "qui": "personne_01",
                  "trimestre": "2026-T3", "canal": "email"})
check("lettre-envoyer sans brouillon -> 409", code == 409,
      f"HTTP {code} {obj}")
code, le = post("decision", "/lettre-envoyer",
                {"logement_id": "log1", "qui": "personne_01",
                 "trimestre": TRIM_T2, "canal": "email"})
check("lettre-envoyer -> 200 envoyee (messagerie tracee)",
      code == 200 and isinstance(le, dict)
      and le.get("statut") == "envoyee"
      and le.get("canal") == "email",
      f"HTTP {code} {le}")

# Registre RGPD : 403 inconnu, 7 traitements, flags lab.
code, obj = get("decision", "/registre-rgpd?logement_id=log1&qui=fantome")
check("registre qui inconnu -> 403", code == 403, f"HTTP {code} {obj}")
code, rg = get("decision",
               "/registre-rgpd?logement_id=log1&qui=personne_01")
traitements = {t.get("donnees"): t for t in rg.get("traitements", [])} \
    if isinstance(rg, dict) else {}
check("registre log1 : 7 traitements + geoloc active (lab)",
      code == 200 and isinstance(rg, dict) and rg.get("total") == 7
      and any("hash seul" in d for d in traitements)
      and any(t.get("actif") for t in traitements.values()),
      f"HTTP {code} {rg}")
code, rg2 = get("decision",
                "/registre-rgpd?logement_id=log2&qui=personne_01")
traitements2 = {t.get("donnees"): t for t in rg2.get("traitements", [])} \
    if isinstance(rg2, dict) else {}
geoloc_l2 = next((t for d, t in traitements2.items() if "loc" in d), {})
check("registre log2 : geoloc inactive (flag off)",
      code == 200 and geoloc_l2.get("actif") is False,
      f"HTTP {code} {rg2}")

# Mentions annonce : 400/404, 9 mentions, 3 manquantes (Cerfa/DPE/classement).
code, obj = get("decision", "/mentions-annonce")
check("GET /mentions sans logement -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = get("decision", "/mentions-annonce?logement_id=logX")
check("GET /mentions logement inconnu -> 404", code == 404,
      f"HTTP {code} {obj}")
code, mn = get("decision", "/mentions-annonce?logement_id=log1")
ids_mn = [m.get("id") for m in mn.get("mentions", [])] \
    if isinstance(mn, dict) else []
check("mentions log1 : 9 + Cerfa/DPE/classement manquants + capacite OK",
      code == 200 and isinstance(mn, dict)
      and len(ids_mn) == 9
      and mn.get("manquantes") == ["numero_declaration", "dpe",
                                   "classement"]
      and mn.get("mise_en_ligne_ok") is False
      and any("5" in m.get("label", "")
              for m in mn.get("mentions", [])
              if m.get("id") == "capacite"),
      f"HTTP {code} {mn}")

print()
print("== 20. formation menage 30 min + test depart complet (P6-22 §14) ==")
# Programme : 400 sans logement, 404 logement inconnu.
code, obj = get("dispatch", "/formation")
check("GET /formation sans logement -> 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = get("dispatch", "/formation?logement_id=logX")
check("GET /formation logement inconnu -> 404", code == 404,
      f"HTTP {code} {obj}")
code, pg = get("dispatch", "/formation?logement_id=log1")
mods = [m.get("id") for m in pg.get("programme_30min", [])] \
    if isinstance(pg, dict) else []
check("GET /formation log1 : 5 modules + 30 min + drill",
      code == 200 and isinstance(pg, dict)
      and mods == ["pointage", "photos", "checklist",
                   "edl_comparatif", "cloture"]
      and pg.get("duree_totale_min") == 30,
      f"HTTP {code} {pg}")

# Session : qui auto, sans presta, logement inconnu, puis 201.
code, obj = post("dispatch", "/formation-session",
                 {"logement_id": "log1", "qui": "auto",
                  "presta": "lab_menage_01"})
check("formation-session qui=auto refuse 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/formation-session",
                 {"logement_id": "log1", "qui": "test-lab-humain"})
check("formation-session sans presta -> 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/formation-session",
                 {"logement_id": "logX", "qui": "test-lab-humain",
                  "presta": "lab_menage_01"})
check("formation-session logement inconnu -> 404", code == 404,
      f"HTTP {code} {obj}")
code, se = post("dispatch", "/formation-session",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "presta": "lab_menage_01"})
sid = se.get("session", "") if isinstance(se, dict) else ""
check("formation-session 201 rotation blanche",
      code == 201 and isinstance(se, dict) and bool(sid)
      and se.get("statut") == "en_cours",
      f"HTTP {code} {se}")
code, obj = get("dispatch", "/formation?" + urllib.parse.urlencode(
    {"logement_id": "log1", "session": "SES-2099-01-01-99"}))
check("GET session inconnue -> 404", code == 404, f"HTTP {code} {obj}")
code, st0 = get("dispatch", "/formation?" + urllib.parse.urlencode(
    {"logement_id": "log1", "session": sid}))
check("GET session : en_cours + 5 modules manquants",
      code == 200 and isinstance(st0, dict)
      and st0.get("statut") == "en_cours"
      and len(st0.get("modules_manquants", [])) == 5,
      f"HTTP {code} {st0}")

# Modules : inconnu, session inconnue, qui auto, coche + doublon.
code, obj = post("dispatch", "/formation-module",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "session": sid, "module": "sieste"})
check("formation-module inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("dispatch", "/formation-module",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "session": "SES-2099-01-01-99", "module": "pointage"})
check("formation-module session inconnue -> 404", code == 404,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/formation-module",
                 {"logement_id": "log1", "qui": "auto",
                  "session": sid, "module": "pointage"})
check("formation-module qui=auto refuse 400", code == 400,
      f"HTTP {code} {obj}")
code, m1 = post("dispatch", "/formation-module",
                {"logement_id": "log1", "qui": "lab_menage_01",
                 "session": sid, "module": "pointage"})
check("formation-module pointage -> 200 coche",
      code == 200 and isinstance(m1, dict)
      and m1.get("statut") == "coche",
      f"HTTP {code} {m1}")
code, m1b = post("dispatch", "/formation-module",
                 {"logement_id": "log1", "qui": "lab_menage_01",
                  "session": sid, "module": "pointage"})
check("formation-module doublon -> 200 deja_coche",
      code == 200 and isinstance(m1b, dict)
      and m1b.get("statut") == "deja_coche",
      f"HTTP {code} {m1b}")

# Validation prématurée : sans dossier, session inconnue, dossier KO.
code, obj = post("dispatch", "/formation-valider",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "session": sid})
check("formation-valider sans dossier -> 400", code == 400,
      f"HTTP {code} {obj}")
code, obj = post("dispatch", "/formation-valider",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "session": "SES-2099-01-01-99",
                  "dossier_menage": "x"})
check("formation-valider session inconnue -> 404", code == 404,
      f"HTTP {code} {obj}")
code, vi = post("dispatch", "/formation-valider",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "session": sid, "dossier_menage": "dossier_inexistant_xyz"})
check("formation-valider incomplete -> 409 (modules + dossier)",
      code == 409 and isinstance(vi, dict)
      and vi.get("code") == "formation_incomplete"
      and len(vi.get("modules_manquants", [])) == 4
      and vi.get("dossier_menage_ok") is False,
      f"HTTP {code} {vi}")

# Test départ complet : rotation blanche réelle (socle P6-1 + traça P6-2).
REF_F = f"LAB-P622-{int(time.time())}"
code, td_f = post("dispatch", "/todos", {"logement_id": "log1",
                                          "ref_resa": REF_F,
                                          "checkout": "2026-12-20",
                                          "checkin_suivant": "2026-12-21",
                                          "qui": "test-lab-humain"})
dos_f = (td_f.get("dossier", "") if isinstance(td_f, dict) else "")
post("dispatch", "/menage-pointage",
     {"logement_id": "log1", "dossier": dos_f,
      "evenement": "arrivee", "qui": "lab_menage_01"})
post("dispatch", "/menage-pointage",
     {"logement_id": "log1", "dossier": dos_f,
      "evenement": "depart", "qui": "lab_menage_01"})
for phase in ("entree", "sortie"):
    post("dispatch", "/menage-photo",
         {"logement_id": "log1", "dossier": dos_f,
          "phase": phase, "piece": "salon", "nom": "test.png",
          "donnees_base64": PETITE_PHOTO,
          "qui": "lab_menage_01"})
code, mi_f = post("dispatch", "/mission", {"logement_id": "log1",
                                           "presta_id": "lab_plomb_01",
                                           "motif": f"formation_{REF_F}",
                                           "qui": "test-lab-humain"})
nom_f = (mi_f.get("dossier", "") if isinstance(mi_f, dict)
         else "").rsplit("/", 1)[-1]
for ev in ("arrivee", "depart"):
    post("dispatch", "/pointage", {"logement_id": "log1", "dossier": nom_f,
                                   "evenement": ev, "qui": "lab_plomb_01"})
for phase in ("avant", "apres"):
    post("dispatch", "/photo", {"logement_id": "log1", "dossier": nom_f,
                                "phase": phase, "piece": "cuisine",
                                "nom": "test.png",
                                "donnees_base64": PETITE_PHOTO,
                                "qui": "lab_plomb_01"})
post("dispatch", "/cloture", {"logement_id": "log1", "dossier": nom_f,
                              "qui": "test-lab-humain"})
code, cl_tmp = post("dispatch", "/menage-cloture",
                    {"logement_id": "log1", "dossier": dos_f,
                     "checklist": {}, "photos_voyageur_ok": True,
                     "dossier_intervention": nom_f,
                     "qui": "test-lab-humain"})
cochees_f = {c: True for c in
             (cl_tmp.get("cases_manquantes", [])
              if isinstance(cl_tmp, dict) else [])}
code, cl_f = post("dispatch", "/menage-cloture",
                  {"logement_id": "log1", "dossier": dos_f,
                   "checklist": cochees_f, "photos_voyageur_ok": True,
                   "dossier_intervention": nom_f,
                   "qui": "test-lab-humain"})
check("rotation blanche : cloture 201 remise_en_dispo",
      code == 201 and isinstance(cl_f, dict)
      and cl_f.get("statut") == "remise_en_dispo",
      f"HTTP {code} {cl_f}")

# 4 modules restants + validation hôte -> formation_validee.
for mod in ("photos", "checklist", "edl_comparatif", "cloture"):
    code, mx = post("dispatch", "/formation-module",
                    {"logement_id": "log1", "qui": "lab_menage_01",
                     "session": sid, "module": mod})
    check(f"formation-module {mod} -> 200",
          code == 200 and isinstance(mx, dict)
          and mx.get("statut") == "coche",
          f"HTTP {code} {mx}")
code, vf = post("dispatch", "/formation-valider",
                {"logement_id": "log1", "qui": "test-lab-humain",
                 "session": sid, "dossier_menage": dos_f})
check("formation-valider -> 200 formation_validee",
      code == 200 and isinstance(vf, dict)
      and vf.get("statut") == "formation_validee"
      and vf.get("dossier_menage") == dos_f,
      f"HTTP {code} {vf}")
code, vf2 = post("dispatch", "/formation-valider",
                 {"logement_id": "log1", "qui": "test-lab-humain",
                  "session": sid, "dossier_menage": dos_f})
check("re-validation -> 200 deja_validee",
      code == 200 and isinstance(vf2, dict)
      and vf2.get("statut") == "deja_validee",
      f"HTTP {code} {vf2}")
code, obj = post("dispatch", "/formation-module",
                 {"logement_id": "log1", "qui": "lab_menage_01",
                  "session": sid, "module": "photos"})
check("module apres validation -> 409 session_cloturee",
      code == 409 and isinstance(obj, dict)
      and obj.get("code") == "session_cloturee",
      f"HTTP {code} {obj}")
code, stf = get("dispatch", "/formation?" + urllib.parse.urlencode(
    {"logement_id": "log1", "session": sid}))
check("GET session validee + dossier",
      code == 200 and isinstance(stf, dict)
      and stf.get("statut") == "formation_validee"
      and stf.get("dossier_menage") == dos_f,
      f"HTTP {code} {stf}")

print()
print("== 21. seuils transverses LLM/Jev : RBAC + outils interdits + seuils + trace (P7-6 §6.7) ==")
code, sl = get("decision", "/seuils")
check("GET /seuils : 0.8/0.75/0.7/0.5 + outils",
      code == 200 and isinstance(sl, dict)
      and sl.get("noul_auto") == 0.8
      and sl.get("confidence_auto") == 0.75
      and sl.get("confidence_min") == 0.7
      and sl.get("hors_bornes_blocage") == 0.5
      and "serrure" in sl.get("outils_interdits", [])
      and "pin" in sl.get("outils_interdits", []),
      f"HTTP {code} {sl}")

# Garde-fous requête : champs requis + logement inconnu.
code, obj = post("decision", "/gardien",
                 {"qui": "personne_01", "quoi": "menage"})
check("gardien sans logement -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/gardien",
                 {"logement_id": "log1", "quoi": "menage"})
check("gardien sans qui -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_01"})
check("gardien sans quoi -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("decision", "/gardien",
                 {"logement_id": "logX", "qui": "personne_01",
                  "quoi": "menage"})
check("gardien logement inconnu -> 404", code == 404, f"HTTP {code} {obj}")

# RBAC d'abord : inconnu + comptable hors droit prix.
code, obj = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "fantome",
                  "quoi": "menage"})
check("gardien qui inconnu -> 403", code == 403, f"HTTP {code} {obj}")
code, obj = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_04",
                  "quoi": "prix"})
check("gardien comptable hors droit -> 403", code == 403,
      f"HTTP {code} {obj}")

# Outil interdit : BLOQUÉ même avec des scores parfaits.
code, obj = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_01",
                  "quoi": "serrure",
                  "jev": {"noul": 0.95, "confidence": 0.9,
                          "hors_bornes": 0.0}})
check("gardien serrure scores parfaits -> 403 outil_interdit",
      code == 403 and isinstance(obj, dict)
      and obj.get("code") == "outil_interdit",
      f"HTTP {code} {obj}")
code, obj = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_01",
                  "quoi": "pin",
                  "jev": {"noul": 0.95, "confidence": 0.9}})
check("gardien PIN -> 403 outil_interdit", code == 403
      and isinstance(obj, dict)
      and obj.get("code") == "outil_interdit",
      f"HTTP {code} {obj}")

# hors_bornes>0,5 -> blocage (humain requis).
code, obj = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_01",
                  "quoi": "menage",
                  "jev": {"noul": 0.95, "confidence": 0.9,
                          "hors_bornes": 0.7}})
check("gardien hors_bornes 0.7 -> 403", code == 403
      and isinstance(obj, dict)
      and obj.get("statut") == "bloque",
      f"HTTP {code} {obj}")

# confidence<0,7 -> dashboard, jamais d'auto (même noul haut).
code, gd = post("decision", "/gardien",
                {"logement_id": "log1", "qui": "personne_01",
                 "quoi": "menage",
                 "jev": {"noul": 0.9, "confidence": 0.5,
                         "hors_bornes": 0.0}})
check("gardien conf 0.5 -> dashboard jamais d'auto",
      code == 200 and isinstance(gd, dict)
      and gd.get("statut") == "dashboard",
      f"HTTP {code} {gd}")

# noul>0,8 + conf>0,75 -> auto borné + trace P7-7 écho.
LLM_LAB = {"alias": "lcd-chat-fast", "fournisseur": "groq",
           "modele": "llama-3.1-8b"}
JEV_LAB = {"backend": "typesafe", "endpoint": "systemone",
           "modele": "jev-1.13.0", "noul": 0.9, "confidence": 0.8,
           "hors_bornes": 0.1}
code, ga = post("decision", "/gardien",
                {"logement_id": "log1", "qui": "personne_01",
                 "quoi": "menage", "ref": "LAB-P7G",
                 "llm": LLM_LAB, "jev": JEV_LAB})
check("gardien seuils OK -> 200 auto_borne + trace",
      code == 200 and isinstance(ga, dict)
      and ga.get("statut") == "auto_borne"
      and ga.get("trace", {}).get("llm", {}).get("alias")
      == "lcd-chat-fast"
      and ga.get("trace", {}).get("jev", {}).get("backend")
      == "typesafe"
      and ga.get("trace", {}).get("jev", {}).get("confidence") == 0.8,
      f"HTTP {code} {ga}")

# Sous seuils auto (0.5/0.72) + bornes exactes (0.8/0.8) -> dashboard.
code, gd2 = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_01",
                  "quoi": "menage",
                  "jev": {"noul": 0.5, "confidence": 0.72}})
check("gardien sous seuils -> dashboard",
      code == 200 and isinstance(gd2, dict)
      and gd2.get("statut") == "dashboard",
      f"HTTP {code} {gd2}")
code, gd3 = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_01",
                  "quoi": "menage",
                  "jev": {"noul": 0.8, "confidence": 0.8}})
check("gardien bornes exactes (>) -> dashboard (strict)",
      code == 200 and isinstance(gd3, dict)
      and gd3.get("statut") == "dashboard",
      f"HTTP {code} {gd3}")

# Sans scores -> confidence 0 -> dashboard (jamais d'auto aveugle).
code, gd4 = post("decision", "/gardien",
                 {"logement_id": "log1", "qui": "personne_01",
                  "quoi": "menage"})
check("gardien sans scores -> dashboard",
      code == 200 and isinstance(gd4, dict)
      and gd4.get("statut") == "dashboard",
      f"HTTP {code} {gd4}")

print()
print("== 22. tracabilite P7-7 : langue en log + filtres dashboard backend/alias/langue (§6.7) ==")
# Entrée tracée : gardien auto_borne (typesafe + lcd-chat-fast + es).
code, gt = post("decision", "/gardien",
                {"logement_id": "log1", "qui": "personne_01",
                 "quoi": "menage", "ref": "LAB-P77", "langue": "es",
                 "llm": {"alias": "lcd-chat-fast", "fournisseur": "groq",
                         "modele": "llama-3.1-8b"},
                 "jev": {"backend": "typesafe", "endpoint": "systemone",
                         "modele": "jev-1.13.0", "noul": 0.9,
                         "confidence": 0.8, "hors_bornes": 0.1}})
check("gardien trace LAB-P77 -> 200 auto_borne",
      code == 200 and isinstance(gt, dict)
      and gt.get("statut") == "auto_borne",
      f"HTTP {code} {gt}")

# Événement en langue : J-2 ES (langue loggée, sans trace LLM/Jev).
code, ev_es = post("decision", "/event",
                   {"type": "lcd_j2_envoi_acces", "logement_id": "log1",
                    "qui": "personne_01", "ref": "LAB-P77-EVT",
                    "data": {**BASE_DATA, "langue": "es",
                             "pin": "482913"}})
check("event J-2 ES -> 200 emis (push HA reel)",
      code == 200 and isinstance(ev_es, dict)
      and ev_es.get("statut") == "emis"
      and ev_es.get("ha") == 200
      and ev_es.get("langue") == "es",
      f"HTTP {code} {ev_es}")

code, jb = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01",
     "backend": "typesafe"}))
refs_b = {e.get("ref") for e in jb.get("entrees", [])} \
    if isinstance(jb, dict) else set()
check("journal backend=typesafe contient LAB-P77",
      code == 200 and "LAB-P77" in refs_b,
      f"HTTP {code} total={jb.get('total') if isinstance(jb, dict) else jb}")

code, ja = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01",
     "alias": "lcd-chat-fast"}))
refs_a = {e.get("ref") for e in ja.get("entrees", [])} \
    if isinstance(ja, dict) else set()
check("journal alias=lcd-chat-fast contient LAB-P77",
      code == 200 and "LAB-P77" in refs_a,
      f"HTTP {code} total={ja.get('total') if isinstance(ja, dict) else ja}")

code, jl = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01", "langue": "es"}))
refs_l = {e.get("ref") for e in jl.get("entrees", [])} \
    if isinstance(jl, dict) else set()
check("journal langue=es contient LAB-P77 + event ES",
      code == 200 and "LAB-P77" in refs_l
      and "LAB-P77-EVT" in refs_l
      and all(e.get("langue") == "es"
              for e in jl.get("entrees", [])),
      f"HTTP {code} total={jl.get('total') if isinstance(jl, dict) else jl}")

code, jc = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01",
     "backend": "typesafe", "alias": "lcd-chat-fast", "langue": "es"}))
check("journal combine backend+alias+langue isole LAB-P77",
      code == 200 and isinstance(jc, dict)
      and "LAB-P77" in {e.get("ref") for e in jc.get("entrees", [])},
      f"HTTP {code} total={jc.get('total') if isinstance(jc, dict) else jc}")

code, jo = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01",
     "backend": "openai"}))
check("journal backend inconnu -> total 0",
      code == 200 and isinstance(jo, dict) and jo.get("total") == 0,
      f"HTTP {code} {jo}")
code, jo2 = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01",
     "alias": "lcd-inconnu"}))
check("journal alias inconnu -> total 0",
      code == 200 and isinstance(jo2, dict) and jo2.get("total") == 0,
      f"HTTP {code} {jo2}")
code, jo3 = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01", "langue": "zh"}))
check("journal langue sans entree -> total 0",
      code == 200 and isinstance(jo3, dict) and jo3.get("total") == 0,
      f"HTTP {code} {jo3}")

print()
print("== 23. UI routage proxy LLM : routes + backup/audit + tester + reload (P7-3 §6.5) ==")
code, rt = get("router", "/routes")
noms = sorted(a.get("alias") for a in rt.get("aliases", [])) \
    if isinstance(rt, dict) else []
check("GET /routes : fast + fallbacks + 5 aliases + validation ok",
      code == 200 and isinstance(rt, dict)
      and rt.get("primaire") == "lcd-chat-fast"
      and rt.get("fallbacks") == ["lcd-chat-eu", "lcd-chat-local"]
      and noms == ["lcd-chat-custom-1", "lcd-chat-eu", "lcd-chat-fast",
                   "lcd-chat-local", "lcd-chat-strong"]
      and rt.get("validation", {}).get("ok") is True
      and rt.get("alerte_cout_mois_eur") == 5,
      f"HTTP {code} {rt}")

# Garde-fous écriture : qui auto, alias inconnu, redondance, bornes, clés.
code, obj = post("router", "/route",
                 {"qui": "auto", "primaire": "lcd-chat-eu"})
check("route qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/route",
                 {"qui": "test-lab-humain", "primaire": "lcd-fusee"})
check("route primaire inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/route",
                 {"qui": "test-lab-humain", "primaire": "lcd-chat-fast",
                  "fallbacks": ["lcd-chat-fast"]})
check("route primaire redondant -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/route",
                 {"qui": "test-lab-humain", "retry": 99})
check("route retry 99 -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/route",
                 {"qui": "test-lab-humain", "cooldown_seconds": 999})
check("route cooldown 999 -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/route",
                 {"qui": "test-lab-humain", "temperature": 0.9})
check("route cle garde-fou -> 400 cle_inconnue",
      code == 400 and isinstance(obj, dict)
      and obj.get("code") == "cle_inconnue",
      f"HTTP {code} {obj}")
code, obj = post("router", "/route",
                 {"qui": "test-lab-humain",
                  "fallbacks": ["lcd-chat-nope"]})
check("route fallback inconnu -> 400", code == 400, f"HTTP {code} {obj}")

# Bascule eu (+ backup/audit) puis restauration fast.
code, ch = post("router", "/route",
                {"qui": "test-lab-humain", "primaire": "lcd-chat-eu",
                 "fallbacks": ["lcd-chat-fast", "lcd-chat-local"]})
check("route bascule eu -> 200 avant/apres",
      code == 200 and isinstance(ch, dict)
      and ch.get("avant", {}).get("primaire") == "lcd-chat-fast"
      and ch.get("apres", {}).get("primaire") == "lcd-chat-eu",
      f"HTTP {code} {ch}")
code, rt2 = get("router", "/routes")
check("GET confirme primaire eu",
      code == 200 and isinstance(rt2, dict)
      and rt2.get("primaire") == "lcd-chat-eu",
      f"HTTP {code} {rt2}")
code, rs = post("router", "/route",
                {"qui": "test-lab-humain", "primaire": "lcd-chat-fast",
                 "fallbacks": ["lcd-chat-eu", "lcd-chat-local"]})
check("route restauration fast -> 200",
      code == 200 and isinstance(rs, dict)
      and rs.get("apres", {}).get("primaire") == "lcd-chat-fast",
      f"HTTP {code} {rs}")

# Tester par ligne : 400 inconnus, KO documentés (lab sans backends).
code, obj = post("router", "/tester",
                 {"qui": "test-lab-humain"})
check("tester sans alias -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/tester",
                 {"qui": "test-lab-humain", "alias": "lcd-fusee"})
check("tester alias inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/tester",
                 {"qui": "auto", "alias": "lcd-chat-local"})
check("tester qui=auto refuse 400", code == 400, f"HTTP {code} {obj}")
code, tl = post("router", "/tester",
                {"qui": "test-lab-humain", "alias": "lcd-chat-local"})
check("tester local -> KO documente (pas d'Ollama en lab)",
      code == 200 and isinstance(tl, dict)
      and tl.get("alias") == "lcd-chat-local"
      and tl.get("ok") is False,
      f"HTTP {code} {tl}")
code, tf = post("router", "/tester",
                {"qui": "test-lab-humain", "alias": "lcd-chat-fast"})
check("tester cloud -> KO cle box requise",
      code == 200 and isinstance(tf, dict)
      and tf.get("ok") is False
      and "box" in tf.get("detail", ""),
      f"HTTP {code} {tf}")
code, rt3 = get("router", "/routes")
check("sante memorisee local KO",
      code == 200 and isinstance(rt3, dict)
      and rt3.get("sante", {}).get("lcd-chat-local", {}).get("ok")
      is False,
      f"HTTP {code} {rt3}")

# Reload chaud : relecture + validation.
code, rl = post("router", "/reload", {})
check("reload -> 200 reloaded + validation ok",
      code == 200 and isinstance(rl, dict)
      and rl.get("reloaded") is True
      and rl.get("validation", {}).get("ok") is True,
      f"HTTP {code} {rl}")

print()
print("== 24. aliases LLM : resolution backend effectif (P7-4 §6.5) ==")
code, rs = post("router", "/resoudre", {})
check("resoudre defaut -> primaire fast",
      code == 200 and isinstance(rs, dict)
      and rs.get("alias_effectif") == "lcd-chat-fast"
      and rs.get("fournisseur") == "groq"
      and rs.get("via") == "primaire",
      f"HTTP {code} {rs}")
code, reu = post("router", "/resoudre", {"eu_only": True})
check("resoudre eu_only -> override Mistral UE",
      code == 200 and isinstance(reu, dict)
      and reu.get("alias_effectif") == "lcd-chat-eu"
      and reu.get("fournisseur") == "mistral"
      and reu.get("via") == "eu_only_override",
      f"HTTP {code} {reu}")
code, rd = post("router", "/resoudre", {"alias": "lcd-chat-strong"})
check("resoudre alias direct strong (70b)",
      code == 200 and isinstance(rd, dict)
      and rd.get("alias_effectif") == "lcd-chat-strong"
      and rd.get("via") == "demande"
      and rd.get("timeout") == 8,
      f"HTTP {code} {rd}")
code, rl = post("router", "/resoudre", {"alias": "lcd-chat-local"})
check("resoudre local Ollama",
      code == 200 and isinstance(rl, dict)
      and rl.get("fournisseur") == "ollama",
      f"HTTP {code} {rl}")
code, obj = post("router", "/resoudre", {"alias": "lcd-fusee"})
check("resoudre alias inconnu -> 400", code == 400, f"HTTP {code} {obj}")

print()
print("== 25. prompts voyageur M1-M8 : registre + composeur deterministe (P7-10 §6.7.1) ==")
code, pg = get("router", "/prompts")
usages = sorted(u.get("usage") for u in pg.get("usages", [])) \
    if isinstance(pg, dict) else []
llm = sorted(u.get("usage") for u in pg.get("usages", [])
             if u.get("moteur") == "llm") if isinstance(pg, dict) else []
jev = sorted(u.get("usage") for u in pg.get("usages", [])
             if u.get("moteur") == "jev") if isinstance(pg, dict) else []
check("GET /prompts : M1-M8 LLM + J1-J9 Jev + pricing/compta + ops",
      code == 200 and isinstance(pg, dict) and pg.get("total") == 63
      and set(["m1-detection-langue",
               "m2-normalisation-questionnaire",
               "m3-suggestion-extras", "m4-reformulation-menage",
               "m5-message-pret", "m6-resume-avis",
               "m7-concierge-courses", "m8-contrat-falc"]) <= set(llm)
      and set(["j1-completude-j2", "j2-confiance-trad",
               "j3-eligibilite-extras", "j4-coherence-memoire",
               "j5-sentiment-avis", "j6-dispatch-conciergerie",
               "j7-tri-nocturne", "j8-routage-sinistre",
               "j9-qualite-menage"]) <= set(jev)
      and set(["ollm-classif-degat", "ollm-resume-sinistre",
               "ollm-resume-intervention", "ollm-scoring-presta",
               "ollm-conflit-ics", "ollm-diagnostic-panne",
               "ollm-resume-logs", "ollm-fiche-mission",
               "ollm-dossier-incomplet", "ollm-ecart-compta"]) <= set(llm)
      and set(["ojev-scoring-dispatch", "ojev-gravite-sinistre",
               "ojev-completude-photo", "ojev-conflit-ics-garder",
               "ojev-diagnostic-supervision", "ojev-fusion-wifi",
               "ojev-linge", "ojev-caution-recours",
               "ojev-gating-palier"]) <= set(jev)
      and set(["jllm-resume-cgv", "jllm-check-conformite",
               "jllm-lettre-syndic", "jllm-relance-echeance",
               "jllm-aide-mediation", "jllm-digest-audit",
               "jllm-filtre-rbac"]) <= set(llm)
      and set(["jjev-garde-fou-clauses", "jjev-conformite-bloquante",
               "jjev-routage-litige", "jjev-eligibilite-caution",
               "jjev-criticite-echeances", "jjev-anti-fuite",
               "jjev-anomalie-pilotage"]) <= set(jev)
      and all(u.get("alias") and u.get("variables")
              for u in pg.get("usages", [])
              if u.get("moteur") == "llm"),
      f"HTTP {code} total={pg.get('total') if isinstance(pg, dict) else pg}")

code, obj = post("router", "/composer", {"variables": {"message": "x"}})
check("composer sans usage -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/composer",
                 {"usage": "m9-inconnu", "variables": {}})
check("composer usage inconnu -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/composer",
                 {"usage": "m1-detection-langue"})
check("composer sans variables -> 400", code == 400, f"HTTP {code} {obj}")
code, obj = post("router", "/composer",
                 {"usage": "m1-detection-langue", "variables": {}})
check("composer variable manquante -> 422",
      code == 422 and isinstance(obj, dict)
      and obj.get("code") == "variable_manquante"
      and obj.get("manquants") == ["message"],
      f"HTTP {code} {obj}")

code, c1 = post("router", "/composer",
                {"usage": "m1-detection-langue",
                 "variables": {"message": "Onde está a praia?"}})
check("composer m1 -> 200 + message injecte + 0 residu",
      code == 200 and isinstance(c1, dict)
      and c1.get("alias") == "lcd-chat-fast"
      and "Onde está a praia?" in c1.get("prompt", "")
      and c1.get("placeholders_restants") == 0,
      f"HTTP {code} {c1}")
code, c3 = post("router", "/composer",
                {"usage": "m3-suggestion-extras",
                 "variables": {"gouts": "plage, velo", "allergies": "arachide",
                               "langue": "fr"}})
check("composer m3 -> 200 + interdits rappeles",
      code == 200 and isinstance(c3, dict)
      and "velo" in c3.get("prompt", "")
      and isinstance(c3.get("interdits"), list),
      f"HTTP {code} {c3}")
code, c8 = post("router", "/composer",
                {"usage": "m8-contrat-falc",
                 "variables": {"document": "CGV sejour 110 EUR"}})
check("composer m8 -> 200 proposition seule (jamais d'ecriture)",
      code == 200 and isinstance(c8, dict)
      and "110 EUR" in c8.get("prompt", "")
      and "jamais d" in c8.get("rappel", ""),
      f"HTTP {code} {c8}")

print()
print("== 26. prompts voyageur Jev J1-J9 : registre + composeur seuils (P7-11 §6.7.2) ==")
code, cj = post("router", "/composer",
                {"usage": "j5-sentiment-avis",
                 "variables": {"note": "2",
                               "commentaire": "Menage sale"}})
check("composer j5 -> 200 moteur jev + seuils + construits",
      code == 200 and isinstance(cj, dict)
      and cj.get("moteur") == "jev"
      and cj.get("backend") == "typesafe"
      and "2" in cj.get("prompt", "")
      and "Menage sale" in cj.get("prompt", "")
      and cj.get("placeholders_restants") == 0
      and "choice_geste" in cj.get("construits", [])
      and "20" in cj.get("seuils", ""),
      f"HTTP {code} {cj}")
code, obj = post("router", "/composer",
                 {"usage": "j5-sentiment-avis",
                  "variables": {"note": "2"}})
check("composer j5 sans commentaire -> 422",
      code == 422 and isinstance(obj, dict)
      and obj.get("manquants") == ["commentaire"],
      f"HTTP {code} {obj}")
code, cj7 = post("router", "/composer",
                 {"usage": "j7-tri-nocturne",
                  "variables": {"texte": "fete", "db": "72",
                                "occupation": "confirmee"}})
check("composer j7 -> 200 jamais audio/amende",
      code == 200 and isinstance(cj7, dict)
      and cj7.get("moteur") == "jev"
      and "72" in cj7.get("prompt", ""),
      f"HTTP {code} {cj7}")

print()
print("== 27. prompts pricing/compta M-LLM-1-7 + M-JEV-1-6 (P7-12/13 §6.7.3-4) ==")
code, cp = post("router", "/composer",
                {"usage": "pllm-justif-prix",
                 "variables": {"pivot": "190",
                               "details": "aout 1.7 x WE 1.1"}})
check("composer pllm-justif-prix -> 200 alias fast + sans recalcul",
      code == 200 and isinstance(cp, dict)
      and cp.get("moteur") == "llm"
      and cp.get("alias") == "lcd-chat-fast"
      and "190" in cp.get("prompt", "")
      and cp.get("placeholders_restants") == 0,
      f"HTTP {code} {cp}")
code, obj = post("router", "/composer",
                 {"usage": "pllm-micro-reel",
                  "variables": {"ca": "12000"}})
check("composer pllm-micro-reel sans charges -> 422",
      code == 422 and isinstance(obj, dict)
      and set(obj.get("manquants", [])) == {"charges", "amortissement"},
      f"HTTP {code} {obj}")
code, cj = post("router", "/composer",
                {"usage": "pjev-derive-menage",
                 "variables": {"cout_moyen": "127.5",
                               "montant_affiche": "110"}})
check("composer pjev-derive-menage -> 200 seuils file",
      code == 200 and isinstance(cj, dict)
      and cj.get("moteur") == "jev"
      and "file validation" in cj.get("seuils", "")
      and "127.5" in cj.get("prompt", ""),
      f"HTTP {code} {cj}")
code, cj2 = post("router", "/composer",
                 {"usage": "pjev-anti-braderie",
                  "variables": {"pivot": "110", "remise": "0.2",
                                "prix_final": "88"}})
check("composer pjev-anti-braderie -> 200 blocage",
      code == 200 and isinstance(cj2, dict)
      and "blocage" in cj2.get("seuils", ""),
      f"HTTP {code} {cj2}")

print()
print("== 28. prompts ops M-LLM1-10 : registre + composeur garde-fous (P7-14 §6.7.5) ==")
code, co = post("router", "/composer",
                {"usage": "ollm-resume-sinistre",
                 "variables": {"quoi": "fuite SDB", "ou": "log1",
                               "quand": "2026-10-08",
                               "gravite": "moderee", "canal": "direct"}})
check("composer ollm-resume-sinistre -> 200 SLA code + jamais promesse",
      code == 200 and isinstance(co, dict)
      and co.get("moteur") == "llm"
      and co.get("alias") == "lcd-chat-fast"
      and "14 j" in co.get("prompt", "")
      and "fuite SDB" in co.get("prompt", "")
      and co.get("placeholders_restants") == 0
      and "promesse_indemnisation" in co.get("interdits", []),
      f"HTTP {code} {co}")
code, obj = post("router", "/composer",
                 {"usage": "ollm-classif-degat",
                  "variables": {"dossier": "2026-10-08_menage"}})
check("composer ollm-classif-degat sans observations -> 422",
      code == 422 and isinstance(obj, dict)
      and set(obj.get("manquants", [])) == {"observations",
                                            "metadonnees"},
      f"HTTP {code} {obj}")
code, co2 = post("router", "/composer",
                 {"usage": "ollm-diagnostic-panne",
                  "variables": {"symptome": "Hub muet 45 min",
                                "contexte": "arrivee J-0"}})
check("composer ollm-diagnostic-panne -> 200 runbook + jamais PIN",
      code == 200 and isinstance(co2, dict)
      and "Master Lock" in co2.get("prompt", "")
      and "Hub muet 45 min" in co2.get("prompt", "")
      and "pin_clair" in co2.get("interdits", []),
      f"HTTP {code} {co2}")
code, co3 = post("router", "/composer",
                 {"usage": "ollm-ecart-compta",
                  "variables": {"ecart": "12.50",
                                "details": "commission OTA"}})
check("composer ollm-ecart-compta -> 200 lecture seule jamais ecriture",
      code == 200 and isinstance(co3, dict)
      and "12.50" in co3.get("prompt", "")
      and "ecriture_auto" in co3.get("interdits", [])
      and "jamais d" in co3.get("rappel", ""),
      f"HTTP {code} {co3}")
code, co4 = post("router", "/composer",
                 {"usage": "ollm-conflit-ics",
                  "variables": {"resa_a": "DIRECT-001",
                                "resa_b": "BK-002",
                                "regle": "direct>OTA"}})
check("composer ollm-conflit-ics -> 200 ordre marge rappele",
      code == 200 and isinstance(co4, dict)
      and "DIRECT-001" in co4.get("prompt", "")
      and "arbitrage_auto" in co4.get("interdits", []),
      f"HTTP {code} {co4}")

print()
print("== 29. prompts ops Jev M-JEV1-9 : registre + composeur seuils (P7-15 §6.7.6) ==")
code, co = post("router", "/composer",
                {"usage": "ojev-scoring-dispatch",
                 "variables": {"motif": "fuite SDB",
                               "metier": "plomberie",
                               "zone": "santa_severa",
                               "candidats": "A 55/h 4.5 lun-sam"}})
check("composer ojev-scoring-dispatch -> 200 filtre zone+RC + jamais auto hors zone",
      code == 200 and isinstance(co, dict)
      and co.get("moteur") == "jev"
      and co.get("backend") == "typesafe"
      and "A 55/h 4.5" in co.get("prompt", "")
      and "jamais auto hors zone" in co.get("seuils", "")
      and "choice_presta" in co.get("construits", [])
      and co.get("placeholders_restants") == 0,
      f"HTTP {code} {co}")
code, obj = post("router", "/composer",
                 {"usage": "ojev-gravite-sinistre",
                  "variables": {"sinistre": "fuite",
                                "logement": "log1"}})
check("composer ojev-gravite-sinistre sans canal -> 422",
      code == 422 and isinstance(obj, dict)
      and obj.get("manquants") == ["canal"],
      f"HTTP {code} {obj}")
code, co2 = post("router", "/composer",
                 {"usage": "ojev-fusion-wifi",
                  "variables": {"signaux": "PIR+dB 70",
                                "occupation": "confirmee",
                                "consentement": "opt-in"}})
check("composer ojev-fusion-wifi -> 200 verbatim + jamais CSI/seul",
      code == 200 and isinstance(co2, dict)
      and "sans caméra" in co2.get("prompt", "")
      and "PIR+dB 70" in co2.get("prompt", "")
      and "wifi_seul" in co2.get("interdits", [])
      and "csi_brut" in co2.get("interdits", []),
      f"HTTP {code} {co2}")
code, co3 = post("router", "/composer",
                 {"usage": "ojev-caution-recours",
                  "variables": {"dossier": "EDL + facture 180",
                                "canal": "airbnb",
                                "montant": "180"}})
check("composer ojev-caution-recours -> 200 jamais sans justificatifs",
      code == 200 and isinstance(co3, dict)
      and "14 j" in co3.get("seuils", "")
      and "retenue_sans_preuve" in co3.get("interdits", []),
      f"HTTP {code} {co3}")
code, co4 = post("router", "/composer",
                 {"usage": "ojev-gating-palier",
                  "variables": {"checklist": "4/9 KO",
                                "copro": "verifiee false",
                                "tableau": "a_verifier"}})
check("composer ojev-gating-palier -> 200 BLOQUEE si verifiee false",
      code == 200 and isinstance(co4, dict)
      and "BLOQUÉE" in co4.get("seuils", "")
      and "mise_en_ligne_forcee" in co4.get("interdits", []),
      f"HTTP {code} {co4}")

print()
print("== 30. prompts juridique LLM M-LLM-1-7 : registre + garde-fous (P7-16 §6.7.7) ==")
code, co = post("router", "/composer",
                {"usage": "jllm-resume-cgv",
                 "variables": {"articles": "14 articles",
                               "langue": "en",
                               "mentions": "L.612-1 mediateur"}})
check("composer jllm-resume-cgv -> 200 caution verbatim + jamais invente",
      code == 200 and isinstance(co, dict)
      and co.get("moteur") == "llm"
      and co.get("alias") == "lcd-chat-fast"
      and "libérée sous 7 jours" in co.get("prompt", "")
      and "14 articles" in co.get("prompt", "")
      and co.get("placeholders_restants") == 0
      and "montant_invente" in co.get("interdits", []),
      f"HTTP {code} {co}")
code, obj = post("router", "/composer",
                 {"usage": "jllm-check-conformite",
                  "variables": {"copro": "ok", "mairie": "ok"}})
check("composer jllm-check-conformite sans logement -> 422",
      code == 422 and isinstance(obj, dict)
      and obj.get("manquants") == ["logement"],
      f"HTTP {code} {obj}")
code, co2 = post("router", "/composer",
                 {"usage": "jllm-lettre-syndic",
                  "variables": {"trimestre": "2026-T2",
                                "preuves": "dB max 70"}})
check("composer jllm-lettre-syndic -> 200 dB seuls + envoi humain",
      code == 200 and isinstance(co2, dict)
      and "tracée" in co2.get("prompt", "")
      and "dB max 70" in co2.get("prompt", "")
      and "audio" in co2.get("interdits", []),
      f"HTTP {code} {co2}")
code, co3 = post("router", "/composer",
                 {"usage": "jllm-aide-mediation",
                  "variables": {"reclamation": "bruit",
                                "canal": "airbnb"}})
check("composer jllm-aide-mediation -> 200 L.612-1 + ODR",
      code == 200 and isinstance(co3, dict)
      and "L.612-1" in co3.get("prompt", "")
      and "ODR" in co3.get("prompt", "")
      and "clause_abusive" in co3.get("interdits", []),
      f"HTTP {code} {co3}")
code, co4 = post("router", "/composer",
                 {"usage": "jllm-filtre-rbac",
                  "variables": {"role": "presta",
                                "logements": "log1",
                                "demande": "liste missions"}})
check("composer jllm-filtre-rbac -> 200 refuse hors scope + jamais secret",
      code == 200 and isinstance(co4, dict)
      and "Refuse hors scope" in co4.get("prompt", "")
      and "secret" in co4.get("interdits", []),
      f"HTTP {code} {co4}")

print()
print("== 31. prompts juridique Jev M-JEV-1-7 : registre + seuils (P7-17 §6.7.8) ==")
code, co = post("router", "/composer",
                {"usage": "jjev-garde-fou-clauses",
                 "variables": {"document": "CGV test",
                               "source": "M-LLM-1"}})
check("composer jjev-garde-fou-clauses -> 200 auto-bloquant + construits",
      code == 200 and isinstance(co, dict)
      and co.get("moteur") == "jev"
      and co.get("backend") == "typesafe"
      and "auto-bloquant" in co.get("seuils", "")
      and "CGV test" in co.get("prompt", "")
      and "noul_amende_forfaitaire" in co.get("construits", [])
      and co.get("placeholders_restants") == 0,
      f"HTTP {code} {co}")
code, obj = post("router", "/composer",
                 {"usage": "jjev-eligibilite-caution",
                  "variables": {"dossier": "EDL",
                                "canal": "airbnb"}})
check("composer jjev-eligibilite-caution sans delai -> 422",
      code == 422 and isinstance(obj, dict)
      and obj.get("manquants") == ["delai"],
      f"HTTP {code} {obj}")
code, co2 = post("router", "/composer",
                 {"usage": "jjev-routage-litige",
                  "variables": {"reclamation": "bruit",
                                "frustration": "0.9"}})
check("composer jjev-routage-litige -> 200 jamais cloture auto + mediateur",
      code == 200 and isinstance(co2, dict)
      and "L.612-1" in co2.get("prompt", "")
      and "cloture_auto" in co2.get("interdits", []),
      f"HTTP {code} {co2}")
code, co3 = post("router", "/composer",
                 {"usage": "jjev-anti-fuite",
                  "variables": {"reponse": "CA 12000",
                                "role": "presta"}})
check("composer jjev-anti-fuite -> 200 blocage + jamais secret",
      code == 200 and isinstance(co3, dict)
      and "blocage" in co3.get("seuils", "")
      and "secret" in co3.get("interdits", []),
      f"HTTP {code} {co3}")
code, co4 = post("router", "/composer",
                 {"usage": "jjev-anomalie-pilotage",
                  "variables": {"signaux": "TVA incoherente",
                                "perimetre": "compta"}})
check("composer jjev-anomalie-pilotage -> 200 file + jamais ecriture auto",
      code == 200 and isinstance(co4, dict)
      and "file validation" in co4.get("seuils", "")
      and "ecriture_auto" in co4.get("interdits", []),
      f"HTTP {code} {co4}")

print()
print("== 32. proxy LiteLLM : alias custom-1 + fallbacks + garde-fous (P7-2 §6.5) ==")
code, rc = post("router", "/resoudre", {"alias": "lcd-chat-custom-1"})
check("resoudre custom-1 direct -> 200 via demande (endpoint box)",
      code == 200 and isinstance(rc, dict)
      and rc.get("alias_effectif") == "lcd-chat-custom-1"
      and rc.get("via") == "demande",
      f"HTTP {code} {rc}")
code, tc = post("router", "/tester",
                {"qui": "test-lab-humain",
                 "alias": "lcd-chat-custom-1"})
check("tester custom-1 -> KO documente (endpoint box requis)",
      code == 200 and isinstance(tc, dict)
      and tc.get("alias") == "lcd-chat-custom-1"
      and tc.get("ok") is False,
      f"HTTP {code} {tc}")
code, rt4 = get("router", "/routes")
fiches = {a.get("alias"): a for a in rt4.get("aliases", [])} \
    if isinstance(rt4, dict) else {}
check("routes : custom-1 garde-fous 0.2/250 + validation ok",
      code == 200 and isinstance(rt4, dict)
      and len(fiches) == 5
      and rt4.get("validation", {}).get("ok") is True,
      f"HTTP {code} total={len(fiches)}")

print()
print("== 33. garde-fous 0 EUR : cascade + secrets + LAN + kill-switch (P7-19 §6.5) ==")
code, rt5 = get("router", "/routes")
fourn = {a.get("alias"): a.get("fournisseur") for a in
         rt5.get("aliases", [])} if isinstance(rt5, dict) else {}
check("cascade 0 EUR : groq free -> mistral UE -> ollama local",
      code == 200 and isinstance(rt5, dict)
      and fourn.get(rt5.get("primaire")) == "groq"
      and [fourn.get(f) for f in rt5.get("fallbacks", [])] == ["mistral",
                                                              "ollama"],
      f"HTTP {code} {fourn}")
SECRETS_MOTS = ("api_key", "master_key", "Bearer", "CHANGER")
code, cl = post("router", "/composer",
                {"usage": "ollm-resume-logs",
                 "variables": {"stats": "10 decisions",
                               "cas_faibles": "1"}})
check("secrets jamais exposes : routes + composer sans cle",
      isinstance(rt5, dict)
      and not any(m in json.dumps(rt5) for m in SECRETS_MOTS)
      and code == 200 and isinstance(cl, dict)
      and not any(m in json.dumps(cl) for m in SECRETS_MOTS),
      f"HTTP {code}")
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    with open(os.path.join(REPO, "custom", "llm-router-ui",
                            "router_ui.py"),
              encoding="utf-8") as f:
        src_router = f.read()
    with open(os.path.join(REPO, "lab", "docker-compose.yml"),
              encoding="utf-8") as f:
        src_compose = f.read()
    with open(os.path.join(REPO, "homeassistant", "packages", "log1",
                            "log1.yaml"),
              encoding="utf-8") as f:
        src_log1 = f.read()
except OSError as e:
    src_router = src_compose = src_log1 = ""
    check("fichiers versionnes lisibles", False, str(e))
check("UI jamais WAN : bind LAN par defaut, 0.0.0.0 = exception lab",
      '"127.0.0.1"' in src_router and "LCD_BIND" in src_router
      and 'LCD_BIND: "0.0.0.0"' in src_compose,
      "defaut 127.0.0.1 + override lab explicite")
check("kill-switch + couts + EU + custom-1 : entites log1",
      all(s in src_log1 for s in ("jev_enabled", "jev_cout_mois",
                                  "llm_cout_mois", "llm_eu_only",
                                  "log1_jev_backend",
                                  "lcd-chat-custom-1")),
      "selects + sensors + flags presents")

print()
print("== 34. Jev SystemOne : squelette box + selects + kill-switch (P7-5 §6.6) ==")
try:
    with open(os.path.join(REPO, "homeassistant", "packages", "log1",
                            "voix.yaml"),
              encoding="utf-8") as f:
        src_voix = f.read()
except OSError as e:
    src_voix = ""
    check("voix.yaml lisible", False, str(e))
check("rest_command typesafe squelette : endpoint + kill-switch + seuils",
      all(s in src_voix for s in ("api.typesafe.ai/v1/systemone",
                                  "jev-latest", "jev_enabled",
                                  "cache_ttl", "timeout 6",
                                  "noul>0,8", "confidence<0,7")),
      "squelette box versionne (activation + cle = box)")
check("select jev_backend : latest/1.13.0/off + override endpoint",
      all(s in src_log1 for s in ("jev-latest", "jev-1.13.0",
                                  "log1_jev_endpoint_override")),
      "choix backend + custom box")

print()
print("== 35. voix BYOD + satellites : squelettes box + garde-fous (P7-1/8 §6.5) ==")
check("P7-1 Wyoming : add-ons + BYOD + offline + jamais codes/PIN",
      all(s in src_voix for s in ("Wyoming", "Whisper", "Piper",
                                  "openWakeWord", "BYOD",
                                  "consentement",
                                  "jamais de codes",
                                  "jamais de PIN en clair",
                                  "112")),
      "squelette box versionne (install + pipeline = box)")
check("P7-8 satellites + PWA : meme pipeline + escalade humaine",
      all(s in src_voix for s in ("S3-BOX-3", "PWA",
                                  "même pipeline",
                                  "escalation humaine",
                                  "<15 min")),
      "criteres 5 s + escalade documentes (mesure = box)")

print()
print("== 36. gate go/no-go prix : bornes + direct seul + reco OTA + objectivite (P8-7 §9) ==")
bornes_ok = True
for d in ("2026-01-15", "2026-04-10", "2026-08-15", "2026-08-16",
          "2026-12-24", "2027-02-01"):
    code, px = get("pricing", "/prix?" + urllib.parse.urlencode(
        {"logement_id": "log1", "date": d}))
    pv = px.get("pivot") if isinstance(px, dict) else None
    if not (code == 200 and pv is not None
            and 75 <= float(pv) <= 290):
        bornes_ok = False
check("balayage 6 dates : pivots dans [75,290]",
      bornes_ok, "plancher/plafond inviolables toute l'annee")
code, pxmax = get("pricing", "/prix?" + urllib.parse.urlencode(
    {"logement_id": "log1", "date": "2026-08-15", "k_events": "5",
     "occ_j30": "0.99", "ferie": "1"}))
check("forcage max -> pivot 290 + clampe + bornes [75,290]",
      code == 200 and isinstance(pxmax, dict)
      and pxmax.get("pivot") == 290
      and pxmax.get("clampe") is True
      and pxmax.get("bornes") == [75, 290],
      f"HTTP {code} {pxmax}")
code, pxmin = get("pricing", "/prix?" + urllib.parse.urlencode(
    {"logement_id": "log1", "date": "2026-02-01", "k_events": "0.01",
     "occ_j30": "0.0"}))
check("forcage min -> pivot 75 + clampe",
      code == 200 and isinstance(pxmin, dict)
      and pxmin.get("pivot") == 75
      and pxmin.get("clampe") is True,
      f"HTTP {code} {pxmin}")
code, pxa = get("pricing", "/prix?" + urllib.parse.urlencode(
    {"logement_id": "log1", "date": "2026-08-15"}))
code, pxb = get("pricing", "/prix?" + urllib.parse.urlencode(
    {"logement_id": "log1", "date": "2026-08-15", "langue": "ar",
     "voyageurs": "9", "nationalite": "xx"}))
check("objectivite art. 225-1 : attributs voyageur ignores",
      code == 200 and isinstance(pxa, dict) and isinstance(pxb, dict)
      and pxa.get("pivot") == pxb.get("pivot"),
      f"HTTP {code} {pxa} vs {pxb}")
code, ap = put("pricing", "/prix",
               {"logement_id": "log1", "date": "2027-05-01",
                "prix": 180, "qui": "test-lab-humain"})
check("PUT /prix dans bornes -> direct seul (OTA = reco)",
      code == 200 and isinstance(ap, dict)
      and ap.get("statut") == "applique_direct"
      and "reco" in ap.get("note", ""),
      f"HTTP {code} {ap}")
code, ap2 = put("pricing", "/prix",
                {"logement_id": "log1", "date": "2027-05-02",
                 "prix": 500, "qui": "test-lab-humain"})
check("PUT /prix hors bornes sans motif -> 422",
      code == 422, f"HTTP {code} {ap2}")
code, reco = get("pricing", "/reco-ota?" +
                urllib.parse.urlencode({"logement_id": "log1"}))
check("GET /reco-ota -> reco 1-tap lecture seule (jamais d'ecriture)",
      code == 200 and isinstance(reco, dict)
      and isinstance(reco.get("reco_ota_1tap"), dict)
      and "direct" not in reco.get("reco_ota_1tap", {}),
      f"HTTP {code} {reco}")

print()
print("== 37. marque blanche : rendu marque + jamais LCD/HA (P8-3 §1.5.4) ==")
for _langue in ("fr", "en"):
    code, ph = get("decision", "/phrases?" + urllib.parse.urlencode(
        {"logement_id": "log1", "cle": "au_revoir",
         "langue": _langue}))
    texte = ph.get("phrase", "") if isinstance(ph, dict) else ""
    check(f"phrases au_revoir {_langue} : marque lab, 0 fuite",
          code == 200 and isinstance(ph, dict)
          and "Marque Lab Fictive" in texte
          and "LCD" not in texte
          and "Home Assistant" not in texte
          and ph.get("placeholders_restants") == 0,
          f"HTTP {code} {ph}")
try:
    with open(os.path.join(REPO, "custom", "dispatch-presta",
                            "dispatch.py"),
              encoding="utf-8") as f:
        src_dispatch = f.read()
    with open(os.path.join(REPO, "lab", "docker-compose.yml"),
              encoding="utf-8") as f:
        src_compose2 = f.read()
except OSError as e:
    src_dispatch = src_compose2 = ""
    check("fichiers dispatch/compose lisibles", False, str(e))
check("dispatch : branding versionne, jamais LCD en dur",
      "charger_branding" in src_dispatch
      and '"--branding"' in src_dispatch
      and 'branding.get("marque")' in src_dispatch
      and '.replace("{{ marque }}", "LCD")' not in src_dispatch,
      "fiche mission = marque branding ou repli 'votre hôte'")
check("compose : branding monte pour dispatch",
      src_compose2.count("--branding /opt/lcd/branding.yaml") >= 3,
      "decision + facturation + dispatch")

print()
print("== 38. clone log2 : prod BLOQUEE + defauts surs (P8-12 §9) ==")
try:
    sys.path.insert(0, os.path.join(REPO, "custom", "decision-engine"))
    import decision as _dec
    _tmp = tempfile.mkdtemp(prefix="p812-")
    os.environ["LCD_DECISION_LOG_DIR"] = _tmp
    _logts = _dec.lire_logements(os.path.join(
        REPO, "custom", "logements.yaml"))
    _acces, _dbl = _dec.lire_acces(os.path.join(
        REPO, "custom", "acces.yaml"))
    _l2 = _logts.get("log2", {})
    check("prod log2 : verifiee false + light + bornes",
          _l2.get("copro_verifiee") is False
          and _l2.get("prix_min") == 75
          and _l2.get("prix_max") == 290
          and _l2.get("features", {}).get("smart_lock") is False
          and _l2.get("features", {}).get("voix") is False
          and _l2.get("features", {}).get("extras_upsell") is False
          and _l2.get("features", {}).get("vitrines_gratuites") is False,
          "clone sur : mise en ligne BLOQUEE par defaut")
    _eng = _dec.Moteur({}, _logts, _acces, {}, {})
    _c2, _o2 = _eng.emettre_event("lcd_j2_envoi_acces", "log2",
                                  "personne_01", ref="LAB-P812")
    _c1, _o1 = _eng.emettre_event("lcd_j2_envoi_acces", "log1",
                                  "personne_01", ref="LAB-P812")
    check("prod : events J-2 log1+log2 BLOQUES (wizard requis)",
          _c2 == 403 and _c1 == 403
          and "BLOQU" in _o2.get("motif", "")
          and "BLOQU" in _o1.get("motif", ""),
          f"HTTP {_c2}/{_c1} {_o2}")
    shutil.rmtree(_tmp, ignore_errors=True)
except Exception as e:
    check("porte copro prod (unitaire decision)", False, str(e))

print()
print("== 39. box HA virtuelle : API + entites socle (lab/P1-10 §1.5.6) ==")
ha_pret = False
for _ in range(12):
    try:
        urllib.request.urlopen(HA_URL + "/api/", timeout=10)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            ha_pret = True
            break
    except Exception:
        pass
    time.sleep(10)
check("HA :8123 joignable (401 sans auth = vivante)", ha_pret,
      "box virtuelle bootée")
code, cfgha = ha_get("/api/config") if ha_pret else (0, {})
check("HA auth JWT lab -> /api/config 200",
      code == 200 and isinstance(cfgha, dict)
      and cfgha.get("version"),
      f"HTTP {code} {cfgha.get('version') if isinstance(cfgha, dict) else cfgha}")
code, states = ha_get("/api/states") if ha_pret else (0, [])
ids = sorted(s.get("entity_id", "") for s in states) \
    if isinstance(states, list) else []
fiches = {s.get("entity_id"): s for s in states} \
    if isinstance(states, list) else {}
check("HA entites socle : jev/enabled, backends, couts",
      code == 200 and all(e in ids for e in
                          ("input_boolean.jev_enabled",
                           "input_boolean.llm_eu_only",
                           "input_select.log1_llm_backend",
                           "input_select.log1_jev_backend",
                           "sensor.llm_cout_mois",
                           "sensor.jev_cout_mois")),
      f"HTTP {code} {len(ids)} states")
opts = fiches.get("input_select.log1_llm_backend",
                  {}).get("attributes", {}).get("options", [])
check("HA select backend : 5 aliases dont custom-1",
      "lcd-chat-custom-1" in opts
      and "lcd-chat-fast" in opts,
      f"{opts}")
try:
    with open(os.path.join(REPO, "homeassistant",
                            "configuration.yaml"),
              encoding="utf-8") as f:
        src_conf = f.read()
    with open(os.path.join(REPO, "lab", "ha-virtual",
                            "configuration.yaml"),
              encoding="utf-8") as f:
        src_lab = f.read()
except OSError as e:
    src_conf = src_lab = ""
    check("configs HA lisibles", False, str(e))
pkgs = lambda s: sorted(re.findall(r"^\s+\w+: !include (\S+)",
                                    s, re.M))
check("HA miroir packages : lab = box (0 derive)",
      pkgs(src_conf) and pkgs(src_conf) == pkgs(src_lab),
      f"{len(pkgs(src_lab))} includes")

print()
print("== 40. push HA reel : event + sensors + calendar (lab/P2-4/P2-7/P2-9) ==")
code, rc = post("pricing", "/recalcul", {"logement_id": "log1"})
grille = rc.get("grille", []) if isinstance(rc, dict) else []
pivot_j = grille[0].get("pivot") if grille else None
check("recalcul -> 200 + grille",
      code == 200 and pivot_j is not None,
      f"HTTP {code} pivot_j={pivot_j}")
code, capt = ha_get("/api/states/sensor.log1_prix_nuit") if ha_pret \
    else (0, "HA down")
check("HA sensor.log1_prix_nuit == pivot J (push pricing)",
      code == 200 and isinstance(capt, dict)
      and int(float(capt.get("state", -1))) == (pivot_j or -2),
      f"HTTP {code} {capt}")
_ref40 = "LAB-PUSH40"
code, br40 = post("booking", "/resa",
                  {"logement_id": "log1", "debut": "2027-06-01",
                   "fin": "2027-06-03", "voyageurs": 2,
                   "ref": _ref40})
check("resa directe 2027-06 -> 201 (declenche calendar)",
      code == 201 and isinstance(br40, dict),
      f"HTTP {code} {br40}")
code, cf40 = post("booking", "/confirmer",
                  {"logement_id": "log1", "ref": _ref40,
                   "qui": "test-lab-humain"})
check("confirmer 2027-06 -> 201 (occupe + ICS)",
      code == 201 and isinstance(cf40, dict),
      f"HTTP {code} {cf40}")
code, cal = ha_get("/api/states/calendar.log1_planning") if ha_pret \
    else (0, "HA down")
sejs = cal.get("attributes", {}).get("sejours", []) \
    if isinstance(cal, dict) else []
check("HA calendar.log1_planning contient la resa (push ics-sync)",
      code == 200 and isinstance(cal, dict)
      and _ref40 in {s.get("ref") for s in sejs},
      f"HTTP {code} sejours={len(sejs)}")

print()
print("== 41. boucle HA->moteur : script -> rest_command -> decision (lab/P2-9) ==")
code, st = ha_post_ha("/api/states/input_text.log1_ref_sejour",
                      {"state": "LAB-LOOP41"}) if ha_pret else (0, "HA down")
check("HA input ref_sejour <- LAB-LOOP41 (dashboard)",
      code in (200, 201), f"HTTP {code} {st}")
code, svc = ha_post_ha("/api/services/script/log1_renvoi_j2",
                       {}) if ha_pret else (0, "HA down")
check("HA script log1_renvoi_j2 -> 200 (rest_command decision)",
      code == 200, f"HTTP {code} {svc}")
code, jl41 = get("decision", "/journal?" + urllib.parse.urlencode(
    {"logement_id": "log1", "qui": "personne_01"}))
refs41 = [(e.get("ref"), e.get("qui")) for e in
          jl41.get("entrees", [])] if isinstance(jl41, dict) else []
check("decision journal : LAB-LOOP41 trace dashboard_hote (boucle fermee)",
      code == 200 and any(r == "LAB-LOOP41" and str(q or "").startswith(
          "dashboard_hote") for r, q in refs41),
      f"HTTP {code} refs={len(refs41)}")

print()
print("== 42. recorder : historique prix archive et lisible (lab/P1-10/P2-7) ==")
hist_ok = False
if ha_pret and pivot_j is not None:
    debut = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                          time.gmtime(time.time() - 1800))
    fin = time.strftime("%Y-%m-%dT%H:%M:%S+00:00",
                        time.gmtime())
    for _ in range(6):
        code, hist = ha_get("/api/history/period/"
                            + urllib.parse.quote(debut, safe="") + "?"
                            + urllib.parse.urlencode(
                                {"filter_entity_id":
                                 "sensor.log1_prix_nuit",
                                 "end_time": fin}))
        plats = [e.get("state") for g in
                 (hist if isinstance(hist, list) else []) for e in g]
        if code == 200 and str(pivot_j) in plats:
            hist_ok = True
            break
        time.sleep(10)
check("history : sensor.log1_prix_nuit archive (graphe Vue Prix)",
      hist_ok, f"pivot_j={pivot_j} (commit recorder)")

print()
if ECHECS:
    print(f"RÉSULTAT : {len(ECHECS)} ÉCHEC(S) : {ECHECS}")
    sys.exit(1)
print("RÉSULTAT : lab OK — tunnel <60 s + conflit + bornes + garde-fous + dispatch P6-8 + parcours intervenant P6-2 + inventaire P6-4 + extras P6-5 + menage P6-1 + stocks P6-3 + wifi P6-10 + phrases P6-11 + memoire P6-12 + menage-date-certaine P6-13 + questionnaire P6-14 + contrat P6-15 + edl P6-16 + avis P6-17 + compta P6-18 + menage-tarif P6-19 + rbac P6-20 + carnet P6-21 + formation P6-22 + seuils P7-6 + tracabilite P7-7 + routage P7-3 + aliases P7-4 + prompts P7-10 + jev P7-11 + pricing P7-12/13 + ops P7-14 + ops-jev P7-15 + juri P7-16/17 + proxy P7-2 + garde-fous P7-19 + jev P7-5 + voix P7-1/8 + gate P8-7 + marque P8-3 + clone P8-12 + box-ha + push-ha + loop-ha + history.")
