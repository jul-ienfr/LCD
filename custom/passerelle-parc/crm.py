"""crm.py — CRM prospection + simulateur + offres (plan §14.5, G6), sans PyYAML.

CRM intégré passerelle (jamais SaaS externe en v1) : pipeline
`suspect → contacte → visite → simulateur → offre → mandat → onboardé →
actif`, fiches prospects, relances J+3/J+7/J+15 (brouillons seuls, envoi
humain), objectifs/comms par commercial.

Règles :
- Rôle `commercial` : prospects + simulateur + offres SEULS, jamais prix /
  coûts / autres clients, `qui=commercial-X` tracé, révocable.
- Fiche prospect : source, contact (référence, jamais de PII bancaire),
  relances calculées (J+3/J+7/J+15 depuis le dernier contact).
- Simulateur rentabilité (`POST /v1/simulateur`) : ADR × occupation −
  commission 20-30 % − plateforme 15-20 % − ménage − fiscalité par régime.
  CHIFFRES indicatifs + mention expert-comptable ; `entite_id` INCONNUE =
  422 (jamais de simulation sur une fiche fiscale inconnue).
- Offre PDF marque blanche : lien magique démo périmé 24 h, données fictives.
- Onboarding gagné = `POST /v1/parc/mandats` (checklist §3bis).
- Rétention prospects 3 ans (§16.3) ; purge 90 j voyageur inchangée.
"""
import time

PIPELINE = ("suspect", "contacte", "visite", "simulateur", "offre",
            "mandat", "onboarde", "actif")
TRANSITIONS = {
    "suspect": ("contacte",),
    "contacte": ("visite", "suspect"),
    "visite": ("simulateur", "contacte"),
    "simulateur": ("offre", "visite"),
    "offre": ("mandat", "simulateur"),
    "mandat": ("onboarde",),
    "onboarde": ("actif",),
    "actif": (),
}
SOURCES = ("apporteur", "notaire", "agence", "airbnb_fatigue", "bouche_oreille",
           "autre")
RELANCES_J = (3, 7, 15)
RETENTION_PROSPECT_J = 3 * 365       # §16.3 : prospects 3 ans

# Fourchettes du simulateur (§14.5) — affichées, jamais décidées.
COMMISSION_MIN, COMMISSION_MAX = 0.20, 0.30
PLATEFORME_MIN, PLATEFORME_MAX = 0.15, 0.20

MENTION_FISCALE = ("A titre indicatif — a valider avec l'expert-comptable "
                   "(ceci n'est pas un avis fiscal).")


def utcnow_iso():
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def transition_ok(de, vers):
    """Un saut non consécutif = refus (même discipline que les mandats)."""
    return str(vers) in TRANSITIONS.get(str(de), ())


def relances(note_ts=None):
    """Échéances J+3/J+7/J+15 depuis le dernier contact (brouillons seuls)."""
    base = float(note_ts or time.time())
    jour = 24 * 3600
    return [{"j": j, "echeance_ts": base + j * jour,
             "brouillon_seul": True} for j in RELANCES_J]


def simulateur(adr, occupation_pct, nuits_an=365, commission_pct=25,
               plateforme_pct=17, menage_montant=110, menage_nb=80,
               regime="micro_bic_non_classe", entite_connue=True,
               forfait="full_service"):
    """Simulation indicative (jamais une décision).

    `entite_connue=False` = 422 côté passerelle (on ne simule pas une fiscalité
    inconnue). `forfait` (kit/pilotage/full_service) pilote la commission :
    KIT/PILOTAGE = 0 % sur le brut (vente + maintenance / abonnement facturés
    hors relevé), FULL = commission % (défaut 20 %, fourchette 20-30 %).
    Tous les montants portent `indicatif: True` + la mention
    expert-comptable. Inconnu = None (jamais 0)."""
    if not entite_connue:
        return None, {"erreur": "entite_id inconnue : simulation impossible "
                                "(422, jamais sur une fiche fiscale "
                                "inconnue)"}
    forfait = str(forfait or "full_service").strip()
    if forfait not in ("kit", "pilotage", "full_service"):
        return None, {"erreur": "forfait hors enum : kit/pilotage/"
                                "full_service"}
    if forfait in ("kit", "pilotage"):
        commission_pct = 0.0
    try:
        a = float(adr)
        o = float(occupation_pct)
    except (TypeError, ValueError):
        return None, {"erreur": "adr + occupation_pct numeriques requis"}
    if a <= 0 or not 0 < o <= 100:
        return None, {"erreur": "adr > 0 et 0 < occupation <= 100 requis"}
    nuits = float(nuits_an) * o / 100.0
    brut = a * nuits
    commission = brut * float(commission_pct) / 100.0
    plateforme = brut * float(plateforme_pct) / 100.0
    menage = float(menage_montant) * float(menage_nb)
    net_avant_fisc = brut - commission - plateforme - menage
    # Fiscalité indicative (rappel, pas un calcul d'impôt).
    if str(regime) == "micro_bic_non_classe":
        base_fiscale = brut * 0.70
    elif str(regime) == "micro_bic_classe":
        base_fiscale = brut * 0.50
    else:
        base_fiscale = None
    return {"brut_an": round(brut, 2), "nuits_vendues": round(nuits, 1),
            "commission": round(commission, 2),
            "commission_pct": commission_pct,
            "plateforme": round(plateforme, 2),
            "plateforme_pct": plateforme_pct,
            "menage": round(menage, 2),
            "net_avant_fisc": round(net_avant_fisc, 2),
            "base_fiscale_indicative": (
                round(base_fiscale, 2) if base_fiscale is not None else None),
            "regime": regime, "indicatif": True,
            "forfait": forfait,
            "mention": MENTION_FISCALE}, None


def offre_contenu(prospect, simulation):
    """Contenu textuel d'une offre marque blanche (le PDF est rendu ailleurs).

    Données du prospect + fourchettes du simulateur, jamais de promesse :
    `indicatif` partout, mention fiscale reprise."""
    p = dict(prospect or {})
    s = dict(simulation or {})
    lignes = [
        "Offre de gestion — {{marque}}",
        "Prospect : " + str(p.get("nom", "")),
        "Bien : " + str(p.get("bien", "")),
        "Brut annuel estime : " + str(s.get("brut_an")) + " EUR (indicatif)",
        "Commission : " + str(s.get("commission_pct")) + " % (20-30 %)",
        "Net avant fiscalite : " + str(s.get("net_avant_fisc"))
        + " EUR (indicatif)",
        MENTION_FISCALE,
    ]
    return {"titre": "Offre de gestion", "lignes": lignes,
            "indicatif": True, "marque_blanche": True,
            "ref": "OFFRE-%d" % int(time.time())}
