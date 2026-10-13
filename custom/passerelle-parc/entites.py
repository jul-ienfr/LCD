"""entites.py — entités juridiques du parc (plan §3bis, G2bis), sans PyYAML.

Une entité juridique = le « qui détient les biens » : nom propre du
super-admin, indivision, SCI-IR, SCI-IS, SARL de famille, SAS, SASU, holding,
autre. Chaque logement du parc est rattaché à UNE entité et UN mode de
détention (`mandats.py`), visibles partout (cartes parc, fiches, exports
compta) — §3bis.

Aucune règle fiscale ici : les régimes et les seuils sont RAPPELÉS à titre
indicatif (le plan le dit noir sur blanc : « ceci n'est pas un avis fiscal »),
et le calcul reste chez l'expert-comptable. Ce module refuse juste ce qui est
objectivement dangereux :

  - un régime ou une nature hors enum (typo = erreur comptable silencieuse) ;
  - un SIREN qui n'est pas 9 chiffres (ou vide, légal pour un nom propre) ;
  - **un IBAN en clair** dans le fichier, alors qu'il est versionné : on
    n'accepte qu'une référence (`env:` / `vault:`) et on refuse tout ce qui
    ressemble à un IBAN, où que ce soit dans le bloc.

Le reste (seuils, jauges, e-facture) est affiché ailleurs (§6quater).
"""
from registre_liste import (ErreurRegistre, RegistreListe, citer,
                            utcnow_iso)

# Natures juridiques du plan §3bis (ordre = ordre d'affichage).
NATURES = ("nom_propre", "indivision", "sci_ir", "sci_is", "sarl_famille",
           "sas", "sasu", "holding", "autre")
# Régimes fiscaux (§3bis étendu). Indicatifs, jamais un conseil.
REGIMES = ("micro_bic_non_classe", "micro_bic_classe", "lmnp_reel", "lmp",
           "foncier_2044", "is_2065")
TVA = ("non", "option", "para_hoteliere")
# Cycle de vie d'une entité. `resolie` = plus aucun mandat actif ; `archive` =
# conservation 10 ans (comptabilité), JAMAIS de purge (plan §16.3).
STATUTS = ("active", "suspendue", "resolie", "archive")
TRANSITIONS = {
    "active": ("suspendue", "resolie"),
    "suspendue": ("active", "resolie"),
    "resolie": ("archive", "active"),
    "archive": (),
}

# Ce qu'une entité DOIT porter pour être exploitable (rappels, pas bloquants :
# une fiche incomplète se signale dans `/etat-parc`, cf. §3bis).
OBLIGATOIRES = ("libelle", "nature", "regime", "tva", "titulaire")

# Seuils rappelés par régime (MICRO-BIC) — affichage seul, aucune décision.
SEUILES_REGIME = {
    "micro_bic_non_classe": {"abattement_pct": 30, "plafond": 15000},
    "micro_bic_classe": {"abattement_pct": 50, "plafond": 77700},
}


class RegistreEntites(RegistreListe):
    """Lecture + écriture chirurgicale d'un `entites.yaml`."""

    SECTION = "entites:"
    CLE_ID = "entite_id"
    # Une entité créée sans `statut:` (ou écrite à la main dans le YAML) entre
    # dans le cycle par `active`, état nominal d'une fiche complète.
    STATUT_INITIAL = "active"
    SCALAIRES = ("entite_id", "libelle", "nature", "siren", "regime", "tva",
                 "exercice", "expert_comptable_ref", "pdp_ref",
                 "iban_ref", "titulaire", "statut", "cree_le", "cree_par",
                 "maj_le", "suspendue_le", "suspendue_par",
                 "resolue_le", "resolue_par", "archive_le", "archive_par",
                 "motif")
    STRUCTURES = ("seuils_perso", "releves")


def verifier(champs, existantes=None):
    """Contrôles objectifs d'une fiche entité → `(bloquants, rappels)`.

    `bloquants` = ce qui empêche d'enregistrer (enum, SIREN, IBAN en clair).
    `rappels` = ce qui manque ou mérite un œil humain, sans bloquer."""
    e = dict(champs or {})
    bloquants, rappels = [], []
    nature = str(e.get("nature", "") or "").strip()
    regime = str(e.get("regime", "") or "").strip()
    tva = str(e.get("tva", "") or "").strip()

    if nature not in NATURES:
        bloquants.append("nature hors enum : " + str(nature))
    if regime not in REGIMES:
        bloquants.append("regime hors enum : " + str(regime))
    if tva not in TVA:
        bloquants.append("tva hors enum : " + str(tva))

    siren = str(e.get("siren", "") or "").strip()
    if siren:
        if not siren.isdigit() or len(siren) != 9:
            bloquants.append("siren : 9 chiffres, ou vide si nom propre "
                             "sans SIRET")
        elif nature == "nom_propre":
            rappels.append("un nom propre porte rarement un SIREN — "
                           "à vérifier")

    # Interdiction d'un IBAN en clair dans un fichier versionné.
    iban = str(e.get("iban_ref", "") or "").strip()
    if iban:
        haut = iban.upper()
        if iban.replace(" ", "").isdigit() or \
                (len(iban.replace(" ", "")) >= 14 and haut[:2].isalpha()
                 and haut[2:4].isdigit()):
            bloquants.append("iban_ref ressemble à un IBAN en clair : "
                             "mettre une référence env:/vault:")
        elif not iban.startswith(("env:", "vault:", "secret:")):
            rappels.append("iban_ref : référence env:/vault: attendue "
                           "(banque et numéro restent hors dépôt)")

    for c in OBLIGATOIRES:
        if not str(e.get(c, "") or "").strip():
            rappels.append(c + " : à renseigner")

    if regime == "micro_bic_classe" \
            and str(e.get("classement_atout_france", "") or "").strip() in \
            ("", "non_classe"):
        rappels.append("micro_bic_classe suppose un classement Atout France "
                       "— à confirmer avec l'expert-comptable")
    if regime not in ("micro_bic_non_classe", "micro_bic_classe") \
            and regime in REGIMES:
        rappels.append("régime " + regime + " : sortie du micro, "
                       "comptabilité d'engagement + compte de résultat "
                       "attendus par l'expert-comptable")
    return bloquants, rappels


def seuils(regime):
    """Seuils indicatifs d'un régime (affichage seul, jamais une décision)."""
    cle = str(regime or "").strip()
    if cle in SEUILES_REGIME:
        return dict(SEUILES_REGIME[cle], indicatif=True)
    return {"abattement_pct": None, "plafond": None,
            "note": "regime " + cle + " : bareme reel, bareme MICRO non "
                    "applicable — indicatif", "indicatif": True}


def interdire_secret(champs):
    """Refuse tout champ qui ressemble à un secret bancaire (§16.3).

    Appelé avant `definir()` par la passerelle : un IBAN, un BIC ou un RIB
    en clair dans `entites.yaml` finirait dans `git`, donc dans chaque clone,
    chaque sauvegarde et chaque image docker. La référence suffit."""
    SUSPECTS = ("iban", "bic", "rib", "num_compte")
    for cle, val in (champs or {}).items():
        bas = str(cle).lower()
        if not any(s in bas for s in SUSPECTS):
            continue
        s = str(val or "").strip()
        if not s:
            continue
        if s.replace(" ", "").replace("-", "").isdigit():
            raise ErreurRegistre(400, cle + " : numéro de compte en clair "
                                       "interdit — référence env:/vault:")
        haut = s.upper()
        if len(s) >= 14 and haut[:2].isalpha() and haut[2:4].isdigit():
            raise ErreurRegistre(400, cle + " : ressemble à un IBAN en clair "
                                       "— référence env:/vault:")
