"""mandats.py — rattachement logement ↔ entité (plan §3bis, G2bis), sans PyYAML.

Le mandat dit QUI exploite le logement, pour QUI, et selon quelles règles de
reversement. Deux modes seulement (§3bis) :

  - `propre` : bien du super-admin, aucune commission ;
  - `mandat_tiers` : bien d'un client, convention de gestion signée, commission
    en %, reversement (mensuel J+5 ou par séjour), circuit de la caution,
    assurance, échéance.

Le fichier est le nôtre, donc écriture chirurgicale via `registre_liste`
(snapshots avant chaque écriture, clés inconnues reportées, jamais de purge).

Cycle de vie (§3bis, checklist d'onboarding tiers) :
    brouillon → pret → actif → suspendu → actif
                            ↘ resolie (reversement soldé + motif)
    et `archive` en super_admin seul, conservation 10 ans, jamais de purge.
Tout saut non consécutif = 409,afin que l'historique reste lisible.

Rien n'est décidé ici : la commission est un %, le reversement une fréquence,
et la caution un circuit — le calcul des relevés appartient au module de
portail proprio (§3bis, G2bis-b).
"""
from registre_liste import (ErreurRegistre, RegistreListe, citer,
                            utcnow_iso)

MODES = ("propre", "mandat_tiers")
MENAGE_A_CHARGE = ("voyageur", "proprio", "partage")
REVERSEMENT = ("mensuel_J+5", "par_sejour")
CIRCUITS = ("passerelle", "portail_direct", "virement_separe")
# Onboarding tiers (§3bis) : pièces du dossier `docs/logN/`.
PIECES = ("mandat_signe", "edl_entree", "inventaire_scan", "photos",
          "rib_ref", "attestation_assurance", "enregistrement_national",
          "dpe")
STATUTS = ("brouillon", "pret", "actif", "suspendu", "resolie", "archive")
# Seul état qui ne se décide PAS à la passerelle : le reversement d'un client
# tiers est un virement, la passerelle ne peut pas le vérifier — l'humain le
# déclare. Nommé pour qu'une faute de frappe dans le garde-fou ne le désactive
# pas en silence (déjà vu : `resilue` au lieu de `resolie` = garde jamais appelé).
STATUT_RESOLU = "resolie"
TRANSITIONS = {
    "brouillon": ("pret",),
    "pret": ("actif", "brouillon"),
    "actif": ("suspendu", "resolie"),
    "suspendu": ("actif", "resolie"),
    "resolie": ("archive", "actif"),
    "archive": (),
}
# Ce qui doit être vrai AVANT de passer à `actif` (bloquant).
PIECES_ACTIF = ("mandat_signe", "edl_entree", "inventaire_scan", "photos",
                "rib_ref", "attestation_assurance")


class RegistreMandats(RegistreListe):
    """Lecture + écriture chirurgicale d'un `mandats.yaml`."""

    SECTION = "mandats:"
    CLE_ID = "logement_id"
    # Un bloc sans `statut:` (créé par `definir`, ou ajouté à la main dans le
    # YAML) entre dans le cycle par `brouillon` (§3bis).
    STATUT_INITIAL = "brouillon"
    SCALAIRES = ("logement_id", "entite_id", "mode", "client_tiers_ref",
                 "client_tiers_nom", "commission_pct", "menage_a_charge",
                 "reversement", "depot_garantie_circuit", "assurance_ref",
                 "mandat_signe_le", "echeance", "statut", "cree_le",
                 "cree_par", "maj_le", "brouillon_le", "brouillon_par",
                 "pret_le", "pret_par", "actif_le", "actif_par",
                 "suspendu_le", "suspendu_par", "resolie_le", "resolie_par",
                 "archive_le", "archive_par", "motif")
    STRUCTURES = ("checklist", "notes")


def _vrai(valeur):
    """Booléen YAML relu comme chaîne (`"false"` est une chaîne VÉRACE en
    Python, donc tout test `if m.get(p)()` serait toujours vrai)."""
    return str(valeur if valeur is not None else "").strip().lower() \
        == "true"


def verifier(champs):
    """Contrôles objectifs d'un mandat → `(bloquants, rappels)`.

    Bloquant = ce qui rend le mandat inexploitable ou dangereux. Un
    `mandat_tiers` sans commission ni client est un mandat fantôme : on
    refuse de l'enregistrer."""
    m = dict(champs or {})
    bloquants, rappels = [], []
    mode = str(m.get("mode", "") or "").strip()
    entite_id = str(m.get("entite_id", "") or "").strip()

    if mode not in MODES:
        bloquants.append("mode hors enum : " + str(mode))
    if not entite_id:
        bloquants.append("entite_id obligatoire (rattachement §3bis)")
    if str(m.get("menage_a_charge", "") or "").strip() \
            not in MENAGE_A_CHARGE:
        rappels.append("menage_a_charge hors enum : "
                       + str(m.get("menage_a_charge") or "(vide)")
                       + " — attendu " + "/".join(MENAGE_A_CHARGE))
    if str(m.get("reversement", "") or "").strip() \
            and str(m.get("reversement")).strip() not in REVERSEMENT:
        bloquants.append("reversement hors enum : "
                         + str(m.get("reversement") or "(vide)"))
    if str(m.get("depot_garantie_circuit", "") or "").strip() \
            and str(m.get("depot_garantie_circuit")).strip() \
            not in CIRCUITS:
        bloquants.append("depot_garantie_circuit hors enum : "
                         + str(m.get("depot_garantie_circuit") or "(vide)"))

    if mode == "mandat_tiers":
        if not str(m.get("client_tiers_ref", "") or "").strip():
            bloquants.append("client_tiers_ref obligatoire en mandat_tiers")
        com = str(m.get("commission_pct", "") or "").strip()
        if com == "":
            bloquants.append("commission_pct obligatoire en mandat_tiers")
        else:
            try:
                v = float(com)
            except ValueError:
                bloquants.append("commission_pct : nombre attendu")
            else:
                if not 0 <= v <= 50:
                    bloquants.append("commission_pct hors 0-50 % "
                                     "(au-delà = à valider par la direction)")
        for p in PIECES:
            if not _vrai(dict(m.get("checklist") or {}).get(p)):
                rappels.append("dossier : " + p + " manquant")
        if str(m.get("echeance", "") or "").strip() == "":
            rappels.append("echeance du mandat non fixée")
    return bloquants, rappels


def journal_revenus(mandat, brut, menage=0, plateforme=0, commission=None):
    """Relevé de reversement d'un séjour/période (§3bis, G2bis-b).

    Rend l'ordre de calcul EXPLICITE et traçable : brut → commissions
    plateforme → ménage → commission conciergerie → net reversé. Le mode
    `propre` ne prélève aucune commission. Rien n'est inventé : ce qui n'est
    pas fourni vaut 0 et le relevé reste marqué `indicatif` (le rapprochement
    compta reste chez l'expert-comptable)."""
    m = dict(mandat or {})
    mode = str(m.get("mode", "") or "").strip()
    proprio = (mode == "propre")
    brut_v = float(brut or 0)
    pl_v = float(plateforme or 0)
    mg_v = float(menage or 0)
    if proprio:
        com_v = 0.0
    else:
        com_v = float(commission if commission is not None
                      else (m.get("commission_pct") or 0))
    net_v = brut_v - pl_v - mg_v - com_v
    return {"mode": mode, "entite_id": m.get("entite_id"),
            "logement_id": m.get("logement_id"),
            "brut": round(brut_v, 2), "plateforme": round(pl_v, 2),
            "menage": round(mg_v, 2),
            "commission_conciergerie": round(com_v, 2),
            "commission_pct_applique": (None if proprio else com_v),
            "net_reverse": round(net_v, 2),
            "menage_a_charge": m.get("menage_a_charge", ""),
            "reversement": m.get("reversement", ""),
            "indicatif": True}
