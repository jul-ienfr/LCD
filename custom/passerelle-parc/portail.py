"""portail.py — portail propriétaire tiers (plan §3bis, G2bis-b), sans PyYAML.

Un propriétaire dont le bien est en mandat de gestion a le droit de savoir
combien son logement a produit et ce qu'il lui reste — et RIEN d'autre. Ce
module ne décide rien et ne détient rien : il agrège ce que la compta expose
déjà (`GET /finances`, lecture seule) et y applique les règles ÉCRITES du
mandat (commission %, ménage à charge, reversement).

TROIS règles, tenues partout dans ce fichier.

1. **Ce qui n'est pas connu est rendu `None` et listé dans `inconnu`.** Un zéro
   écrit à la place d'une valeur inconnue est un mensonge chiffré : « 0 € de
   commission plateforme » se lit comme un fait, pas comme un manque. La compta
   encaisse les payouts APRÈS commission (`_totaux` somme les `net`), donc le
   brut plateforme n'est pas reconstituable ici — on le dit, on ne l'invente
   pas.

2. **Le lien au mandat prime sur le périmètre.** Avoir `log1` dans son
   périmètre `acces.yaml` ne donne AUCUN droit sur l'argent du client de
   `log1`. Sans cette règle, n'importe quel opérateur du parc lit toutes les
   commissions de tous les clients.

3. **Un mandat qui n'est pas `actif` n'a pas de relevé courant.** Un mandat en
   `brouillon`, `pret`, `suspendu`, `resolie` ou `archive` ne produit pas de
   reversement : on renvoie ce que l'on sait (l'état, la liste de ce qui
   manque) plutôt qu'un tableau de zéros qui ressemblerait à « 0 € ce mois ».
"""
from mandats import MODES, STATUTS


# Un mandat ne produit un reversement que dans cet état (§3bis). Tout le reste
# est soit en cours d'onboarding, soit arrêté, soit archivé.
STATUTS_RELEVE = ("actif",)

# Rubriques compta qui sont du ménage (`compta.RUBRIQUES`), ramenées ici sans
# importer le moteur : la passerelle ne recharge jamais un module moteur.
RUBRIQUES_MENAGE = ("menage",)

# Rôles qui peuvent lire le relevé de N'IMPORTE quel logement du parc : la
# conciergerie fait les virements, elle doit pouvoir les vérifier.
# `gestionnaire/operateur`, `comptable`, `prestataires`, `proprietaire` non
# lié = AUCUN accès. Le comptable travaille via la compta elle-même, pas ici.
ROLES_EXPLOITANT = (("super_admin", "super_admin"), ("super_admin", "admin"))


def lien(personne, mandat):
    """(lien, refus) — pourquoi CE compte peut voir CE mandat.

    Retourne `("proprietaire", None)` si le compte est le client du mandat,
    `("exploitant", None)` si c'est la conciergerie, sinon `(None, pourquoi)`.
    `mandat` = le bloc lu dans `mandats.yaml` (dict)."""
    m = dict(mandat or {})
    p = dict(personne or {})
    cid = str(p.get("id", "") or "").strip()
    role = (str(p.get("role", "") or "").strip(),
            str(p.get("sous_role", "") or "").strip())
    mode = str(m.get("mode", "") or "").strip()

    if role in ROLES_EXPLOITANT:
        return "exploitant", None

    if role[0] == "proprietaire":
        # Un mandat `propre` n'a PAS de client : personne ne peut s'y rattacher
        # par ce chemin, y compris un super_admin-déguisé (déjà traité dessus).
        if mode != "mandat_tiers":
            return None, ("mandat propre : aucun client rattachable "
                          "(le bien est à la conciergerie)")
        # Le compte doit DÉCLARER le(s) client(s) qu'il représente. Pas de
        # déduction : `personne_05` voit `log1` ne prouve rien sur le mandat
        # de `log1`, seules les déclarations parlent.
        clients = [str(x).strip() for x in (p.get("clients_ref") or [])
                   if str(x).strip()]
        if not clients:
            return None, ("compte propriétaire sans clients_ref déclaré : "
                          "aucun rattachement possible (acces.yaml)")
        ref_mandat = str(m.get("client_tiers_ref", "") or "").strip()
        if not ref_mandat:
            return None, ("mandat mandat_tiers sans client_tiers_ref : "
                          "fiche incomplète, releve refuse")
        if ref_mandat not in clients:
            # On ne dit PAS quel client détient le logement : ce serait déjà
            # une fuite sur un autre client.
            return None, ("mandat rattache a un autre client : hors "
                          "perimetre de " + (cid or "?"))
        return "proprietaire", None

    return None, ("role %s/%s sans acces au portail proprietaire"
                  % (role[0] or "?", role[1] or "?"))


def filtre_client_permis(personne, client_ref):
    """`?client=` — peut-on filtrer sur CE client ?

    Le filtre porte sur `client_tiers_ref`, la référence **opaque** du mandat,
    et surtout PAS sur un libellé affichable : exposer le nom d'un client ferait
    fuir, via une simple énumération de `?client=`, la liste des clients du
    cabinet — et un ref exotique révélerait son existence par le message d'erreur.

    Donc : un propriétaire ne peut filtrer que sur un client qu'il a DÉCLARÉ
    (`clients_ref[]`), et un exploitant (conciergerie) sur tout. Un ref hors
    déclaration = refus, avec un message qui ne dit PAS si ce client existe.

    Renvoie `(True, "")` ou `(False, raison)`."""
    p = dict(personne or {})
    cl = str(client_ref or "").strip()
    if not cl:
        return True, ""
    role = (str(p.get("role", "") or "").strip(),
            str(p.get("sous_role", "") or "").strip())
    if role in ROLES_EXPLOITANT:
        return True, ""
    declares = [str(x).strip() for x in (p.get("clients_ref") or [])
                if str(x).strip()]
    if cl in declares:
        return True, ""
    return False, ("client hors de vos déclarations (custom/acces.yaml -> "
                   "clients_ref) : le portail ne confirme jamais si une "
                   "référence existe")


def logements_visibles(acces, liste_id, mandats):
    """Les logements que CE compte peut voir, avec le lien qui l'autorise.

    `liste_id` = les logements du parc (boxes.yaml), `mandats` = le registre
    lu. Renvoie `{logement_id: {"lien": ..., "statut": ...}}`. Un logement sans
    mandat n'apparaît JAMAIS : pas de mandat, pas de lien, donc pas d'accès (ce
    n'est pas un oubli de pagination).

    Un refus n'est PAS listé : afficher « log2 : refusé » révélerait qu'un
    client tiers occupe log2. La raison exacte est rendue par la route
    `GET /parc/portail/{id}`, qui, elle, ne divulgue rien de plus que
    « hors périmètre »."""
    p = dict(acces or {})
    perimetre = [str(x).strip() for x in (p.get("logements") or [])
                 if str(x).strip()]
    visibles = {}
    for lid in liste_id:
        lid = str(lid or "").strip()
        if not lid or lid not in perimetre:
            continue
        m = dict((mandats or {}).get(lid) or {})
        if not m:
            continue
        vu, pourquoi = lien(p, dict(m, logement_id=lid))
        if vu:
            visibles[lid] = {"lien": vu, "statut": str(m.get("statut", "")
                                                      or "").strip()}
    return visibles

def _lot(valeur):
    """`None` si la valeur est ABSENTE, son float sinon.

    `_nombre(v, 0.0)` renvoie `0.0` pour un absent — ce qui transformerait
    « je ne sais pas » en « 0 ». Pour un dénominateur d'ADR ou
    d'occupation, ce serait un mensonge silencieux. Donc on distingue
    explicitement l'absent (None) du zéro (0.0).
    """
    if valeur is None:
        return None
    try:
        return float(valeur)
    except (TypeError, ValueError):
        return None


def _nombre(valeur, defaut=0.0):
    """float sûr : `None`/""/non numérique → `defaut`. Jamais d'invention."""
    if valeur is None:
        return defaut
    txt = str(valeur).strip()
    if txt == "":
        return defaut
    try:
        return float(txt)
    except ValueError:
        return defaut


def releve(mandat, finances):
    """Relevé d'un logement sur une période (§3bis) — ordre EXPLICITE.

    `finances` = la réponse `GET /finances` de la compta pour CE logement
    (ca, charges, par_rubrique, par_canal, nuits). On n'écrit rien, on ne
    relit aucun fichier de la compta : la compta reste la source de vérité.
    """
    m = dict(mandat or {})
    f = dict(finances or {})
    brut = _nombre(f.get("ca"), None) if f.get("ca") is not None else None
    charges = _nombre(f.get("charges"), None) if f.get("charges") is not None \
        else None
    par_rub = dict(f.get("par_rubrique") or {})
    charges_connues = charges is not None

    # Ménage : la rubrique compta `menage` (linge, blanchisserie, draps,
    # pressing y sont classés par le moteur). On la sépare des autres charges
    # parce que C'EST la ligne que le client conteste en premier.
    menage = sum(_nombre(v, 0.0) for k, v in par_rub.items()
                 if str(k or "").strip().lower() in RUBRIQUES_MENAGE)
    autres = max(0.0, (charges or 0.0) - menage) if charges_connues else None

    # Commission de la conciergerie : le % du mandat appliqué au brut encaissé.
    # Un mandat `propre` ne prélève rien (le bien est à nous).
    mode = str(m.get("mode", "") or "").strip()
    pct = _nombre(m.get("commission_pct"), 0.0) if mode != "propre" else 0.0
    commission = round((brut or 0.0) * pct / 100.0, 2)

    # Commission plateforme : la compta la déduit AVANT d'enregistrer le
    # payout (`net`), et ne l'expose pas. On ne la reconstitue pas.
    plateforme_connue = False

    inconnu = []
    if brut is None:
        inconnu.append("brut recolte : la compta n'a pas repondu de CA pour "
                       "cette periode")
    if plateforme_connue is False:
        inconnu.append("commission plateforme : deduite par la compta avant "
                       "encaissement (le payout est stocke `net`), le detail "
                       "n'est pas expose par GET /finances — donc pas "
                       "restitue ici")
    if not charges_connues:
        inconnu.append("charges : aucune facture validee lue par la compta")

    attention = []
    statut = str(m.get("statut", "") or "").strip()
    if statut not in STATUTS_RELEVE:
        attention.append("mandat non actif (" + (statut or "sans statut")
                         + ") : ce tableau est un etat, pas un releve de "
                           "reversement")
    # Marque explicite : ce relevé n'est PAS une pièce comptable. Le
    # rapprochement bancaire et la validation restent chez l'expert-comptable,
    # et la compta garde sa propre `file_validation`. Sans ce marqueur, un
    # relevé affiché ressemble à un arrêté de compte.
    note = ("relevé indicatif : le rapprochement compta et la validation "
            "restent chez l'expert-comptable (file de validation de la "
            "compta non vide tant que des factures sont en brouillon)")

    r = {"logement_id": str(m.get("logement_id") or f.get("logement_id") or ""),
         "entite_id": str(m.get("entite_id", "") or ""),
         "mode": mode, "statut": statut,
         # Le client, par sa référence OPAQUE (jamais un libellé : c'est le même
         # namespace que `clients_ref[]` de l'autorisation, donc rien de neuf
         # n'est exposé — et `?client=` filtre dessus).
         "client_tiers_ref": (str(m.get("client_tiers_ref", "") or "")
                              or None),
         "indicatif": True, "note": note,
         "brut_recolte": (None if brut is None else round(brut, 2)),
         "plateforme": None, "plateforme_connue": plateforme_connue,
         "menage": (round(menage, 2) if charges_connues else None),
         "autres_charges": (None if autres is None else round(autres, 2)),
         "charges_totales": (None if not charges_connues else round(charges, 2)),
         "commission_conciergerie": (None if brut is None else commission),
         "commission_pct_applique": (None if brut is None else pct),
         "menage_a_charge": str(m.get("menage_a_charge", "") or ""),
         "reversement": str(m.get("reversement", "") or ""),
         "nuits": f.get("nuits"),
         "par_canal": dict(f.get("par_canal") or {}),
         "net_reverse": None,
         "inconnu": inconnu, "attention": attention}
    if brut is not None and charges_connues:
        # Ordre tenu : ce qui est encaissé, moins les charges réelles, moins la
        # commission. La commission plateforme est DÉJÀ sortie du `ca` coté
        # compta : la retirer ici serait la compter deux fois.
        r["net_reverse"] = round(brut - charges - commission, 2)
    return r


def pilotage(finances, calendrier=None):
    """ADR / RevPAR / occupation (§14.3 « pilotage ») — à partir de ce qu'on a.

    Trois divisions, et donc trois occasions de mentir. La règle est celle de
    tout le portail : **un dénominateur inconnu rend `None`, jamais 0**.

    - `adr` = CA / nuits vendues. Si `nuits` vaut 0, l'ADR n'est pas 0 € : elle
      est **indéfinie** (on ne vend pas). `0` se lirait « chambre à 0 € ».
    - `revpar` = CA / nuits OUVERTES. Les nuits ouvertes viennent du calendrier
      (`occupes + libres`) et **jamais des jours en erreur** : un jour que le
      moteur n'a pas su dire n'est pas une nuit invendue, c'est une nuit inconnue
      — le compter disponible gonflerait le taux d'occupation.
    - `occupation_pct` = nuits vendues / nuits ouvertes. Deux pièges, dits tous
      les deux dans `attention` : le calendrier est **borné à 62 jours** (§54),
      et le CA couvre la période demandée. Comparer un mois de CA à une fenêtre
      calendrier de 30 jours glissants, c'est comparer deux intervalles — le
      résultat est alors **indicatif**, et on le dit.
    - **ADR par canal : impossible, et on le dit.** La compta expose le CA par
      canal (`par_canal`) mais PAS les nuitées par canal. Diviser le CA d'un
      canal par les nuitées TOTALES donnerait un faux ADR — plus petit que la
      réalité, silencieusement. Donc `None` + entrée dans `inconnu`."""
    f = dict(finances or {})
    c = dict(calendrier or {})
    inconnu = []
    attention = []

    nuits = _lot(f.get("nuits"))
    ca = _lot(f.get("ca"))
    if nuits is None:
        inconnu.append("nuits vendues : non exposées par la compta")
    if ca is None:
        inconnu.append("CA : non exposé par la compta")
    # nuits ouvertes : None si le calendrier est muet ou absent
    occ, lib = _lot(c.get("occupes")), _lot(c.get("libres"))
    ouvertes = None if (occ is None or lib is None) else int(occ + lib)
    erreurs = _lot(c.get("erreurs"))
    if ouvertes is None:
        inconnu.append("nuits ouvertes : calendrier indisponible (ou fenêtre "
                       "sans réponse moteur)")
    elif erreurs and erreurs > 0:
        inconnu.append(f"{int(erreurs)} jour(s) d'erreur calendrier : "
                       "exclus des nuits ouvertes, jamais comptés libres")

    adr = None if (ca is None or not nuits) else round(ca / nuits, 2)
    revpar = None if (ca is None or not ouvertes) else round(ca / ouvertes, 2)
    occupation = (None if (nuits is None or not ouvertes)
                  else round(100.0 * nuits / ouvertes, 1))

    fenetre = None
    if c:
        fenetre = {"debut": c.get("debut") or c.get("premier_jour"),
                   "fin": c.get("fin") or c.get("dernier_jour"),
                   "jours": c.get("jours"), "nuits_ouvertes": ouvertes}
    if fenetre and ouvertes and nuits and nuits > ouvertes:
        attention.append(
            f"le CA porte sur {nuits} nuitée(s) mais la fenêtre calendrier ne "
            f"couvre que {ouvertes} nuit(s) ouverte(s) (§54 : calendrier borné "
            "à 62 jours) : taux d'occupation et RevPAR comparés sur deux "
            "intervalles, donc INDICATIFS")
    if fenetre is None:
        attention.append("aucune fenêtre calendrier fournie : occupation et "
                         "RevPAR non calculables (ADR seul est fiable)")

    # CA par canal : on rend les parts, mais PAS d'ADR par canal.
    par_canal = {}
    for canal, montant in sorted((f.get("par_canal") or {}).items()):
        montant = _nombre(montant)
        par_canal[str(canal)] = {
            "ca": montant, "adr": None,
            "part_pct": (None if (ca is None or not ca)
                         else round(100.0 * (montant or 0) / ca, 1))}
    if par_canal:
        inconnu.append("nuitées par canal : la compta expose le CA par canal "
                       "(`par_canal`) mais pas les nuitées — l'ADR par canal "
                       "n'est PAS calculable (le diviser par les nuitées "
                       "totales donnerait un chiffre faux, donc il n'est pas "
                       "rendu)")

    return {"adr": adr, "revpar": revpar, "occupation_pct": occupation,
            "nuits_vendues": nuits, "nuits_ouvertes": ouvertes,
            "ca": ca, "fenetre": fenetre, "par_canal": par_canal,
            "inconnu": inconnu, "attention": attention,
            "indicatif": True,
            "note": "ADR = CA / nuitées vendues ; RevPAR = CA / nuitées "
                    "ouvertes ; occupation = vendues / ouvertes. Aucun "
                    "dénominateur inconnu n'est remplacé par 0."}

def chemin_doc(racine, logement_id, quoi):
    """Chemin ABSOLU d'un document de mandat, ou `(None, motif)`.

    C'est le seul endroit où le portail touche au disque, donc le seul endroit
    où une faille peut entrer. Trois barrières, dans cet ordre, et aucune ne
    fait confiance à la précédente :

    1. **Whitelist d'extension.** Seuls `.pdf` sortent. Un `.html` ou un `.svg`
       rendu par un navigateur exécute du script dans l'origine du portail ; un
       `.docx` porte des macros. Donc : `application/pdf` en `Content-
       Disposition: attachment`, jamais une restitution inline.
    2. **Résolution PUIS confinement.** On résout d'abord (`realpath`), ensuite
       on vérifie que le résultat est SOUS la racine. L'ordre inverse ne sert à
       rien : `../..` se résout, donc c'est le RÉSULTAT de la résolution qu'il
       faut confiner.
    3. **Whitelist de caractères.** `logement_id` et `quoi` entrent dans le
       chemin : un `..` ou un `/` dedans changerait de répertoire. On remplace
       donc tout ce qui n'est pas `[A-Za-z0-9_-]` — pas de blacklist.

    Retourne `(chemin, "")` ou `(None, motif_lisible)`. Ne lève JAMAIS : un
    motif vague vaut mieux qu'une traceback qui renseignerait sur la structure
    du disque."""
    import os as _os, re as _re
    if not str(racine or "").strip():
        return None, "racine documents non configurée (docs_dir absent)"
    lid = str(logement_id or "").strip()
    q = str(quoi or "").strip()
    if not lid or not q:
        return None, "logement_id et quoi sont obligatoires"
    # 1) l'extension D'ABORD : un `.html` doit être refusé par son extension
    #    (motif précis), pas par un vague « caractères interdits ».
    if not q.lower().endswith(".pdf"):
        return None, ("extension non servie : seuls les .pdf sortent (un "
                      ".html/.svg rendu par un navigateur exécuterait du "
                      "script dans l'origine du portail, un .docx porte des "
                      "macros)")
    # 2) whitelists PAR nom : le point n'a de sens que dans un NOM DE FICHIER
    #    (l'extension). Le laisser dans `logement_id` ouvrirait `./`,
    #    `..`, ou un répertoire caché — aucun intérêt, donc interdit.
    for nom, val, motif_re in (
            ("logement_id", lid, r"[A-Za-z0-9_-]+"),
            ("quoi", q, r"[A-Za-z0-9_.-]+")):
        if not _re.fullmatch(motif_re, val):
            return None, (f"{nom} : caractères interdits (lettres, chiffres, "
                          "point (nom de fichier), tiret et underscore "
                          "seulement)")
    if ".." in q or ".." in lid:
        return None, ("nom contenant « .. » : une remontée de répertoire "
                      "n'est pas un nom de fichier")
    racine_reelle = _os.path.realpath(racine)
    cible = _os.path.realpath(_os.path.join(racine_reelle, lid, q))
    if cible != racine_reelle and not cible.startswith(
            racine_reelle + _os.sep):
        return None, "chemin hors de la racine documents (tentative de sortie)"
    return cible, ""


def documents_disponibles(racine, logement_id):
    """Les documents RÉELLEMENT présents pour un logement — noms seuls.

    Retourne `(liste, note)`. Jamais un chemin : nommer le chemin révélerait
    l'arborescence du disque sans rien apprendre au propriétaire. Si le
    répertoire n'existe pas, la liste est `None` et la note le dit — **`None`
    et pas `[]`** : « aucun document déposé » et « le dépôt est absent » sont
    deux informations différentes, et `0 document` les confondrait."""
    import os as _os
    lid = str(logement_id or "").strip()
    if not lid:
        return None, "logement_id obligatoire"
    d = _os.path.join(str(racine or ""), lid)
    if not _os.path.isdir(d):
        return None, ("aucun dépôt pour ce logement : le document n'a pas "
                      "encore été versé (ce n'est pas 0 document, c'est un "
                      "dépôt absent)")
    noms = [f for f in sorted(_os.listdir(d))
            if f.lower().endswith(".pdf")
            and _os.path.isfile(_os.path.join(d, f))]
    return (noms, "" if noms else
            "dépôt présent mais vide : aucun document versé")


def documents(mandat):
    """Ce que le portail peut pointer SANS rien inventer.

    Le mandat signé vit dans `docs/logN/` (archives chiffrées) : on donne le
    CHEMIN ATTENDU, jamais un lien qui prétendrait servir un fichier que
    personne n'a déposé. Les références `vault:`/`env:` sont des pointeurs :
    elles ne révèlent aucun numéro."""
    m = dict(mandat or {})
    lid = str(m.get("logement_id", "") or "")
    docs = []
    if lid:
        docs.append({"quoi": "mandat_signe",
                     "attendu": "docs/log%s/convention-signee.pdf" % lid,
                     "statut": "a deposer (hors perimetre passerelle)"})
    if str(m.get("assurance_ref", "") or "").strip():
        docs.append({"quoi": "attestation_assurance",
                     "reference": str(m.get("assurance_ref") or ""),
                     "statut": "pointeur seulement (vault:/env:)"})
    return docs
