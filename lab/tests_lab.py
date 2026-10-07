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
    "inventaire": "http://127.0.0.1:8097",
    "extras": "http://127.0.0.1:8098",
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


print("== 1. health des 9 moteurs ==")
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

print("== 11. extras upsells : catalogue + cut-off J-1 18h + paiement avance (P6-5 §5.6-ter) ==")
code, cat = get("extras", "/catalogue?" + urllib.parse.urlencode(
    {"logement_id": "log1"}))
items = cat.get("catalogue", []) if isinstance(cat, dict) else []
prix = {e.get("id"): e.get("prix_ttc") for e in items}
check("catalogue log1 200 + 8 extras lab + late 50",
      code == 200 and len(items) == 8 and prix.get("late_checkout_14h") == 50,
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
check("commande 201 a_payer + total 30 (2 pers) + todo + compta accueil",
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

print()
if ECHECS:
    print(f"RÉSULTAT : {len(ECHECS)} ÉCHEC(S) : {ECHECS}")
    sys.exit(1)
print("RÉSULTAT : lab OK — tunnel <60 s + conflit + bornes + garde-fous + dispatch P6-8 + parcours intervenant P6-2 + inventaire P6-4 + extras P6-5.")
