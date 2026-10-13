"""export_compta.py — export Chorus Pro / PDP + mono-SIREN (§6quater, §13.8).

- 1 plan comptable par SIREN, jamais de mélange ; consolidation lecture seule
  côté passerelle (§6quater).
- Chaque écriture porte `entite_id + logement_id + ref + qui` (§6quater) ;
  sans `entite_id` = 422 (sauf bascule lab).
- Export Chorus Pro / PDP (ETI 09/2026 en vigueur, §13.8) : factures au format
  d'échange (montants, TVA, SIREN émetteur), jamais de secret bancaire.
- E-facture : `pdp_ref` de l'entité repris tel quel ; sans `pdp_ref` = export
  marqué `sans_pdp` (dit, jamais bloquant).
- Module PUR : la passerelle lit la compta (`GET /finances`) et tague
  `entite_id` gateway-side (§13.6 : zéro modif moteur en v1).
"""
import time

CHAMPS_ECRITURE = ("entite_id", "logement_id", "ref", "qui", "montant_ttc",
                   "tva", "siren", "exercice")


def utcnow_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def verifier_ecriture(champs):
    """Garde-fous gateway (§6quater) : 422 si violés, + log."""
    e = dict(champs or {})
    manquants = [c for c in ("entite_id", "logement_id", "ref", "qui")
                 if not str(e.get(c, "") or "").strip()]
    if manquants:
        return ["manquants : " + ", ".join(manquants)]
    errs = []
    try:
        if float(e.get("montant_ttc", 0)) <= 0:
            errs.append("montant_ttc > 0 requis (jamais inventé)")
    except (TypeError, ValueError):
        errs.append("montant_ttc numérique requis")
    return errs


def ligne_chorus(facture, entite):
    """Une facture → ligne d'échange Chorus Pro / PDP (lecture seule)."""
    f = dict(facture or {})
    e = dict(entite or {})
    siren = str(e.get("siren", "") or "").strip()
    return {"emetteur_siren": siren or None,
            "siren_manquant": not bool(siren),
            "entite_id": e.get("entite_id"),
            "logement_id": f.get("logement_id"),
            "ref": f.get("ref") or f.get("facture_id"),
            "montant_ttc": f.get("montant_ttc"),
            "tva": f.get("tva", "non"),
            "pdp_ref": e.get("pdp_ref") or None,
            "sans_pdp": not bool(str(e.get("pdp_ref", "") or "").strip()),
            "exporte_le": utcnow_iso(),
            "lecture_seule": True}


def export_parc(factures, entites):
    """Export mono-SIREN par entité (jamais de mélange, §6quater)."""
    par_entite = {}
    for f in factures or []:
        eid = str((f or {}).get("entite_id", "") or "")
        ent = next((x for x in (entites or [])
                    if str(x.get("entite_id", "")) == eid), None)
        if ent is None:
            par_entite.setdefault("_sans_entite", []).append(dict(f))
            continue
        par_entite.setdefault(eid, []).append(ligne_chorus(f, ent))
    return {"generated_at": utcnow_iso(), "lecture_seule": True,
            "par_entite": par_entite,
            "sans_entite": par_entite.pop("_sans_entite", []),
            "note": "1 plan comptable par SIREN, jamais de mélange "
                    "(consolidation lecture seule)"}
