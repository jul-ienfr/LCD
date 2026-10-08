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


def _aff(txt):
    try:
        print(txt)
    except UnicodeEncodeError:
        print(txt.encode("ascii", "replace").decode("ascii"))


def check(nom, cond, detail=""):
    _aff(f"[{'OK' if cond else 'KO'}] {nom}" + (f" — {detail}" if detail else ""))
    if not cond:
        ECHECS.append(nom)


print("== 1. health des 10 moteurs ==")
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
# Decision-engine :8092 — ha_url vide en lab -> 202 loge_sans_ha attendu.
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
      code == 202 and isinstance(j2_fr, dict)
      and j2_fr.get("statut") == "loge_sans_ha"
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
      code == 202 and isinstance(j2_en, dict)
      and j2_en.get("langue") == "en"
      and j2_en.get("traduction_auto") is False
      and j2_en.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_en}")

code, j1_fr = event("lcd_j1_rappel", "log1", "personne_01",
                    {**BASE_DATA, "langue": "fr", "pin": "482913"})
check("J-1 FR rappel seul : PIN force vide (jamais re-push §5.2)",
      code == 202 and isinstance(j1_fr, dict)
      and j1_fr.get("pin_transmis") is False
      and j1_fr.get("gabarit_trouve") is True
      and j1_fr.get("placeholders_restants") == 0,
      f"HTTP {code} {j1_fr}")

code, avis_en = event("lcd_avis_j1", "log1", "personne_01",
                      {**BASE_DATA, "langue": "en", "pin": "482913"})
check("J+1 EN enquete : jamais de PIN",
      code == 202 and isinstance(avis_en, dict)
      and avis_en.get("pin_transmis") is False
      and avis_en.get("langue") == "en"
      and avis_en.get("placeholders_restants") == 0,
      f"HTTP {code} {avis_en}")

code, j2_l2 = event("lcd_j2_envoi_acces", "log2", "personne_01",
                    {**BASE_DATA, "logement": "log2", "langue": "fr",
                     "pin": "999999"})
check("log2 LIGHT J-2 : pin vide + consigne boite a cles (jamais genere)",
      code == 202 and isinstance(j2_l2, dict)
      and j2_l2.get("pin_transmis") is False
      and j2_l2.get("message_boite_cles") is True
      and j2_l2.get("gabarit_trouve") is True
      and j2_l2.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_l2}")

code, j2_pt = event("lcd_j2_envoi_acces", "log1", "personne_01",
                    {**BASE_DATA, "langue": "pt", "pin": "482913"})
check("fallback hors socle pt -> EN + badge auto",
      code == 202 and isinstance(j2_pt, dict)
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
      code == 202 and isinstance(j2_def, dict)
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
      code == 202 and isinstance(j2_exp, dict)
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
      code == 202 and isinstance(j2_wifi, dict)
      and j2_wifi.get("gabarit_trouve") is True
      and j2_wifi.get("placeholders_restants") == 0,
      f"HTTP {code} {j2_wifi}")

# wifi_qr fourni prime (jamais ecrase) : gabarit compose sans placeholders.
code, j2_wifi_f = event("lcd_j2_envoi_acces", "log1", "personne_01",
                        {"langue": "fr", "pin": "482913",
                         "wifi_qr": "WIFI:T:WPA;S:Fourni;P:faux;;"})
check("wifi_qr fourni jamais ecrase par defaults",
      code == 202 and isinstance(j2_wifi_f, dict)
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
      code == 202 and isinstance(j2_ret, dict)
      and j2_ret.get("gabarit_trouve") is True
      and j2_ret.get("placeholders_restants") == 0
      and "message" not in j2_ret and "pin" not in j2_ret,
      f"HTTP {code} {j2_ret}")

# Non-returning : pas de flag -> pas de prefixe, comportement inchange.
code, j2_new = event("lcd_j2_envoi_acces", "log1", "personne_01",
                     {**BASE_DATA, "langue": "en", "pin": "482913"})
check("non-returning EN : J-2 202 + gabarit + placeholders 0",
      code == 202 and isinstance(j2_new, dict)
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
      code == 202 and isinstance(j2_mem, dict)
      and j2_mem.get("langue") == "es"
      and j2_mem.get("retour_voyageur") is True
      and j2_mem.get("gabarit_trouve") is True
      and "message" not in j2_mem and "pin" not in j2_mem
      and "hash" not in j2_mem, f"HTTP {code} {j2_mem}")
code, j2_mem_fr = event("lcd_j2_envoi_acces", "log1", "personne_01",
                        {**BASE_DATA, "langue": "fr", "pin": "482913",
                         "hash": HASH_LAB})
check("returning hash : langue fournie fr prime sur memoire",
      code == 202 and isinstance(j2_mem_fr, dict)
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
      code == 202 and isinstance(j2_oublie, dict)
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
if ECHECS:
    print(f"RÉSULTAT : {len(ECHECS)} ÉCHEC(S) : {ECHECS}")
    sys.exit(1)
print("RÉSULTAT : lab OK — tunnel <60 s + conflit + bornes + garde-fous + dispatch P6-8 + parcours intervenant P6-2 + inventaire P6-4 + extras P6-5 + menage P6-1 + stocks P6-3 + wifi P6-10 + phrases P6-11 + memoire P6-12 + menage-date-certaine P6-13 + questionnaire P6-14.")
