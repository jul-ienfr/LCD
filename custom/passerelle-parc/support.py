"""support.py — tickets support + messagerie 3 fils, stdlib seule (passerelle).

Couche « support » de la passerelle HTTP : TICKETS (suivi d'incidents avec SLA)
et MESSAGERIE à 3 fils (`proprio`, `presta`, `voyageur`). Importé par
`gateway.py` ; aucune dépendance hors stdlib, aucun secret, aucun mot de passe
et aucune donnée bancaire ne transite par ce module.

Choix de stockage (le POURQUOI) :
- `tickets.jsonl` et `messages.jsonl` sont en JSONL APPEND-ONLY : une ligne
  JSON par enregistrement, on ne réécrit JAMAIS l'historique — une panne en
  cours d'écriture perd au pire une ligne, jamais tout le fichier, et l'ordre
  de création est préservé sans index. Les lectures rechargent le fichier
  entier (tailles maîtrisées : quelques milliers de lignes au plus).
- L'état des ACL de messagerie (les `auteurs` de chaque fil) vit dans
  `fils.json`, réécrit ATOMIQUEMENT (tmp + os.replace) à chaque mutation : ce
  n'est pas un journal mais un état courant, il doit refléter l'instant T et
  survivre à une coupure sans rester corrompu à moitié.

Sécurité (fail-closed, anti-fuite inter-client) :
- ACL par défaut REFUSE : un non-opérateur ne lit/écrit QUE les fils dont il
  est `auteur` ; « opérateur » est un booléen que la passerelle calcule depuis
  le rôle (super_admin / admin / gestionnaire => True), ce module ne fait que
  le respecter. Un voyageur ne voit JAMAIS le fil d'un autre voyageur.
- Chaque ticket porte une `ref` stable (jamais un ticket sans ref) : c'est la
  clé de reprise d'un échange déjà routé.
- Toute erreur métier lève `SupportErreur` avec un `code` HTTP suggéré
  (400 saisie invalide, 403 ACL, 404 introuvable) : la passerelle traduit sans
  re-parser les messages.

SLA tickets (documenté ici, pas encore calculé par ce module) : P1 < 4 h,
P2 < 48 h, P3 < 5 j (120 h) entre l'ouverture et la clôture.
"""
import json
import os
import time
from datetime import datetime, timezone

# Énums du domaine — centrales pour que gateway.py et ce module parlent pareil.
PRIORITES = ("P1", "P2", "P3")
STATUTS = ("ouvert", "en_cours", "cloture")
# Seuls ces statuts sont des cibles de transition : `ouvert` est l'état
# initial, on ne rouvre pas un ticket par cette porte (réouverture = nouveau
# ticket qui référence le même dossier).
STATUTS_MAJ = ("en_cours", "cloture")
TYPES_FIL = ("proprio", "presta", "voyageur")

# SLA en heures, en documentation pure (le module ne sanctionne pas un
# dépassement : le calcul d'alerte appartient à la passerelle).
SLA_H = {"P1": 4, "P2": 48, "P3": 120}

# Cap des listes : au-delà, la passerelle paginera côté applicatif ; limiter
# ici évite qu'un fichier détérioré ne renvoie des milliers d'entrées.
CAP_LISTE = 200


class SupportErreur(ValueError):
    """Erreur métier du support — porte son code HTTP suggéré.

    La passerelle mappe `e.code` en réponse HTTP sans re-qualifier l'erreur :
    403 = ACL (fail-closed), 404 = ticket/fil introuvable, 400 = saisie
    invalide. Hériter de ValueError garde la compatibilité avec un `except
    ValueError` générique déjà écrit côté gateway.
    """

    def __init__(self, message, code=400):
        super().__init__(message)
        self.code = code
        self.message = message


# --------------------------------------------------------------------------- #
# socle stockage (chemins, JSONL append-only, JSON atomique)                   #
# --------------------------------------------------------------------------- #
def _utc_iso():
    """Horodatage ISO UTC avec suffixe `Z` (format imposé à la passerelle)."""
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _chemins(rep):
    """Les 3 fichiers du support : 2 journaux append-only + l'état des ACL.

    Regroupés ici pour qu'une évolution du schéma ne touche qu'un seul endroit.
    """
    return (os.path.join(rep, "tickets.jsonl"),
            os.path.join(rep, "messages.jsonl"),
            os.path.join(rep, "fils.json"))


def _preparer(rep):
    """Le répertoire de stockage doit exister avant toute lecture OU écriture.

    Créé à chaque appel (exist_ok) plutôt qu'à l'import : le module est sans
    état, le répertoire est choisi par l'appelant (utile pour les tests).
    """
    if not rep:
        raise SupportErreur("repertoire de stockage manquant", 400)
    os.makedirs(rep, exist_ok=True)


def _lire_jsonl(chemin):
    """Toutes les lignes JSON valides d'un journal ; les lignes corrompues sont
    IGNORÉES (continue) : une écriture coupée net ne doit pas rendre tout
    l'historique illisible, une ligne perdue est acceptable, tout le fichier
    non."""
    out = []
    try:
        with open(chemin, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.strip()
                if not ligne:
                    continue
                try:
                    out.append(json.loads(ligne))
                except ValueError:
                    continue
    except FileNotFoundError:
        pass                      # pas encore d'enregistrement : liste vide
    return out


def _ajouter_jsonl(chemin, objet):
    """Append d'une ligne JSON (utf-8, accents conservés grâce à
    ensure_ascii=False : un fichier lisible en `git diff` par des humains)."""
    with open(chemin, "a", encoding="utf-8") as f:
        f.write(json.dumps(objet, ensure_ascii=False) + "\n")


def _ecrire_json(chemin, data):
    """Réécriture atomique (tmp + fsync + os.replace) d'un état courant.

    os.replace est atomique même sur le même volume : un lecteur ne voit
    jamais un fichier à moitié écrit, une coupure laisse l'ancienne version
    ou la nouvelle, jamais un mélange.
    """
    tmp = chemin + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, chemin)


# --------------------------------------------------------------------------- #
# TICKETS                                                                      #
# --------------------------------------------------------------------------- #
def ticket_creer(rep, qui, sujet, description, priorite="P2", logement_id="",
                 ref=""):
    """Ouvre un ticket : qui + sujet + description obligatoires, ref stable.

    `ref` fournie par la passerelle est conservée telle quelle (elle permet de
    rattacher un ticket à un échange déjà routé) ; sinon une ref auto est
    générée — jamais un ticket sans ref. SLA associés (documentation) :
    P1 < 4 h, P2 < 48 h, P3 < 5 j.
    """
    _preparer(rep)
    qui, sujet, description = (str(qui or "").strip(), str(sujet or "").strip(),
                               str(description or "").strip())
    if not qui:
        raise SupportErreur("ticket : qui requis")
    if not sujet:
        raise SupportErreur("ticket : sujet requis")
    if not description:
        raise SupportErreur("ticket : description requise")
    priorite = str(priorite or "").strip()
    if priorite not in PRIORITES:
        raise SupportErreur("ticket : priorite hors enum P1/P2/P3")
    tickets_fichier, _, _ = _chemins(rep)
    ref = str(ref or "").strip()
    if not ref:
        # n = nb de tickets existants + 1 : le suffixe évite une collision si
        # deux tickets sont ouverts dans la même milliseconde.
        n = len(_lire_jsonl(tickets_fichier)) + 1
        ref = "TICKET-%d-%d" % (int(time.time() * 1000), n)
    ticket = {"ref": ref, "qui": qui, "sujet": sujet,
              "description": description, "priorite": priorite,
              "logement_id": str(logement_id or "").strip(),
              "statut": "ouvert", "ouvert_le": _utc_iso(),
              "ferme_le": None, "motif_cloture": None}
    _ajouter_jsonl(tickets_fichier, ticket)
    return ticket


def tickets_lister(rep, statut=""):
    """Tickets, plus récent d'abord, cap 200 ; filtre `statut` si non vide.

    Un statut de filtre inconnu rend simplement une liste vide (pas de raise) :
    le gateway ne doit pas casser une liste parce qu'un front envoie une
    valeur obsolète.
    """
    _preparer(rep)
    tickets_fichier, _, _ = _chemins(rep)
    tickets = _lire_jsonl(tickets_fichier)
    # Tri par ouvert_le desc, puis par position dans le fichier desc : à
    # horodatage égal, le dernier append (le plus récent) passe devant.
    paires = list(enumerate(tickets))
    paires.sort(key=lambda p: (str(p[1].get("ouvert_le", "")), p[0]),
                reverse=True)
    out = [t for _, t in paires]
    statut = str(statut or "").strip()
    if statut:
        out = [t for t in out if t.get("statut") == statut]
    return out[:CAP_LISTE]


def ticket_statut(rep, qui, ref, statut, motif=""):
    """Change le statut d'un ticket ; `cloture` exige un motif non vide.

    Réécriture atomique de tout le journal (append-only à l'écriture
    courante : ici le fichier EST l'état, on met à jour la ligne du ticket).
    Si plusieurs lignes portent la même ref, la dernière gagne (en pratique :
    un ticket par ref).
    """
    _preparer(rep)
    ref, statut = str(ref or "").strip(), str(statut or "").strip()
    motif = str(motif or "").strip()
    if not ref:
        raise SupportErreur("ticket : ref requise")
    if not statut:
        raise SupportErreur("ticket : statut requis")
    if statut not in STATUTS_MAJ:
        raise SupportErreur("ticket : statut hors enum en_cours/cloture")
    if statut == "cloture" and not motif:
        # Clôture sans motif = dossier clos sans explication : refus (le motif
        # est la trace opposable du pourquoi, pas un champ cosmétique).
        raise SupportErreur("ticket : motif requis pour une cloture")
    tickets_fichier, _, _ = _chemins(rep)
    tickets = _lire_jsonl(tickets_fichier)
    maj, idx = None, -1
    for i, t in enumerate(tickets):
        if str(t.get("ref", "")) == ref:
            maj, idx = dict(t), i      # dernière ligne pour cette ref gagne
    if maj is None:
        raise SupportErreur("ticket introuvable : " + ref, 404)
    maj["statut"] = statut
    maj["maj_par"] = str(qui or "").strip()
    if statut == "cloture":
        maj["ferme_le"] = _utc_iso()
        maj["motif_cloture"] = motif
    tickets[idx] = maj
    with open(tickets_fichier + ".tmp", "w", encoding="utf-8") as f:
        for t in tickets:
            f.write(json.dumps(t, ensure_ascii=False) + "\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tickets_fichier + ".tmp", tickets_fichier)
    return maj


# --------------------------------------------------------------------------- #
# MESSAGERIE (3 fils)                                                          #
# --------------------------------------------------------------------------- #
def _lire_fils(rep):
    """État courant des fils `{fil_id: entête}` ; `{}` si absent/corrompu.

    Un fichier corrompu dégrade vers AUCUN auteur (fail-closed) : seuls les
    opérateurs restent lecteurs, personne ne récupère un accès par accident.
    """
    _, _, fils_fichier = _chemins(rep)
    try:
        with open(fils_fichier, encoding="utf-8") as f:
            donnees = json.load(f)
        return donnees if isinstance(donnees, dict) else {}
    except (OSError, ValueError):
        return {}


def _ecrire_fils(rep, d):
    """Persiste l'état des fils (atomicité : jamais un JSON à moitié écrit)."""
    _, _, fils_fichier = _chemins(rep)
    _ecrire_json(fils_fichier, d)


def _messages(rep):
    """Tous les messages valides du journal (lignes corrompues ignorées)."""
    _, messages_fichier, _ = _chemins(rep)
    return _lire_jsonl(messages_fichier)


def _nb_par_fil(messages):
    """`{fil_id: nb de messages}` — comptage sans recharger par requête."""
    compte = {}
    for m in messages:
        cle = str(m.get("fil_id", ""))
        compte[cle] = compte.get(cle, 0) + 1
    return compte


def _fils_etendus(rep):
    """Fusion entêtes (`fils.json`) + reconstruction depuis les messages.

    Un fil « existe » s'il a >= 1 message ; l'entête porte les `auteurs` qui
    persistent au-delà d'un simple message d'opérateur. Si un fil a des
    messages mais plus d'entête (état dégradé), on le reconstruit avec
    `auteurs=[]` : visible opérateurs, invisible clients (fail-closed).
    """
    etats = _lire_fils(rep)
    messages = _messages(rep)
    comptes = _nb_par_fil(messages)
    out = {}
    for fid, etat in etats.items():
        ent = dict(etat)
        ent["fil_id"] = str(fid)
        ent["auteurs"] = [str(a) for a in (etat.get("auteurs") or [])]
        ent["nb_messages"] = comptes.get(str(fid), 0)
        out[str(fid)] = ent
    for fid, nb in comptes.items():
        if fid in out:
            continue
        premier = next((m for m in messages
                        if str(m.get("fil_id", "")) == fid), {})
        out[fid] = {"fil_id": fid,
                    "type": str(premier.get("type", "")),
                    "ref": str(premier.get("ref", "")),
                    "auteurs": [],
                    "cree_le": str(premier.get("ts", "")),
                    "dernier_ts": str(premier.get("ts", "")),
                    "nb_messages": nb}
    return out


def _valider_fil(qui, type_fil, ref, texte):
    """Commun à `fil_creer` / `message_envoyer` : champs requis + enum type.

    Retourne les valeurs nettoyées (strip) pour que le stockage ne garde ni
    espaces parasites ni champs « vides mais présents ».
    """
    qui, texte = str(qui or "").strip(), str(texte or "").strip()
    type_fil, ref = str(type_fil or "").strip(), str(ref or "").strip()
    if not qui:
        raise SupportErreur("message : qui requis")
    if not texte:
        raise SupportErreur("message : texte requis")
    if type_fil not in TYPES_FIL:
        raise SupportErreur("fil : type hors enum proprio/presta/voyageur")
    if not ref:
        raise SupportErreur("fil : ref requise (logement/mission/reservation)")
    return qui, type_fil, ref, texte


def fil_creer(rep, qui, type_fil, ref, texte):
    """Premier message d'un fil (crée le fil si besoin) — mode non-opérateur.

    Un appelant sans `operateur` passe forcément par ici pour démarrer un fil :
    il devient `auteur`, donc le fil n'existe QUE pour lui et les opérateurs
    (jamais de fil « invisible » créé par un client, jamais d'élévation de
    privilège : si le fil existe déjà et qu'il n'est pas auteur, c'est 403).
    """
    return message_envoyer(rep, qui, type_fil, ref, texte, operateur=False)


def message_envoyer(rep, qui, type_fil, ref, texte, operateur=False):
    """Ajoute un message au fil `type:ref` (le crée si absent) avec ACL.

    ACL fail-closed : non-opérateur hors `auteurs` => 403. Un opérateur peut
    toujours écrire ; un fil créé par un opérateur seul a `auteurs=[]` (visible
    opérateurs seulement) jusqu'à ce qu'un client réponde, il est alors ajouté
    aux auteurs.
    """
    _preparer(rep)
    qui, type_fil, ref, texte = _valider_fil(qui, type_fil, ref, texte)
    fil_id = "%s:%s" % (type_fil, ref)
    etats = _lire_fils(rep)
    entete = etats.get(fil_id)
    # Un fil existe aussi par ses messages (état dégradé : entête perdue) :
    # on le traite alors comme « sans auteur connu », donc 403 pour un client
    # (fail-closed : pas de re-création d'entête qui ouvrirait l'accès).
    existe_par_messages = entete is None and any(
        str(m.get("fil_id", "")) == fil_id for m in _messages(rep))
    if existe_par_messages and not operateur:
        raise SupportErreur("fil inaccessible : " + fil_id, 403)
    if entete is not None and not operateur and qui not in entete["auteurs"]:
        # Le fil existe : sans être auteur, un client n'écrit pas chez un
        # autre client (anti-fuite inter-client, y compris en écriture).
        raise SupportErreur("fil inaccessible : " + fil_id, 403)
    ts = _utc_iso()
    if entete is None:
        entete = {"fil_id": fil_id, "type": type_fil, "ref": ref,
                  # Opérateur créant un fil => aucun client auteur pour
                  # l'instant ; client créant => il est dedans.
                  "auteurs": [] if operateur else [qui],
                  "cree_le": ts, "dernier_ts": ts}
        etats[fil_id] = entete
    if not operateur and qui not in entete["auteurs"]:
        entete["auteurs"].append(qui)
    seq = _nb_par_fil(_messages(rep)).get(fil_id, 0) + 1
    message = {"fil_id": fil_id, "type": type_fil, "ref": ref, "qui": qui,
               "texte": texte, "ts": ts, "seq": seq}
    _, messages_fichier, _ = _chemins(rep)
    _ajouter_jsonl(messages_fichier, message)
    entete["dernier_ts"] = ts
    _ecrire_fils(rep, etats)          # l'état suit TOUJOURS le message écrit
    return message


def fil_lire(rep, qui, fil_id, operateur=False):
    """Lit un fil complet (messages triés par seq croissant) avec ACL.

    L'ACL est testée AVANT l'existence : un appelant non autorisé reçoit un
    403 identique que le fil existe ou non, il ne peut même pas sonder
    l'existence des fils. 404 réservé aux opérateurs (ou auteurs) sur un fil
    réellement absent.
    """
    _preparer(rep)
    fil_id = str(fil_id or "").strip()
    if not fil_id:
        raise SupportErreur("fil_id requis")
    etats = _lire_fils(rep)
    entete = etats.get(fil_id)
    messages = [m for m in _messages(rep)
                if str(m.get("fil_id", "")) == fil_id]
    messages.sort(key=lambda m: m.get("seq", 0))
    if not operateur:
        auteurs = [str(a) for a in (entete or {}).get("auteurs", [])]
        if qui not in auteurs:
            raise SupportErreur("fil inaccessible : " + fil_id, 403)
    if entete is None and not messages:
        raise SupportErreur("fil introuvable : " + fil_id, 404)
    entete = entete or {"type": (messages[0].get("type", "") if messages
                                 else ""),
                        "ref": (messages[0].get("ref", "") if messages
                                else ""),
                        "auteurs": []}
    return {"fil_id": fil_id, "type": entete.get("type", ""),
            "ref": entete.get("ref", ""),
            "auteurs": [str(a) for a in entete.get("auteurs", [])],
            "messages": messages, "total": len(messages)}


def fils_lister(rep, qui, operateur=False):
    """Métadonnées des fils visibles par l'appelant, plus récent d'abord.

    Opérateur : TOUS les fils. Non-opérateur : SEULEMENT ceux dont il est
    `auteur` — c'est la barrière anti-fuite (un voyageur ne voit jamais
    l'existence d'un fil d'un autre voyageur, même en liste).
    """
    _preparer(rep)
    qui = str(qui or "").strip()
    etendus = _fils_etendus(rep)
    out = []
    for ent in etendus.values():
        if not operateur and qui not in ent.get("auteurs", []):
            continue                  # fail-closed : hors ACL, absent de la
                                      # liste (pas même une métadonnée)
        out.append({"fil_id": ent.get("fil_id", ""),
                    "type": ent.get("type", ""),
                    "ref": ent.get("ref", ""),
                    "auteurs": list(ent.get("auteurs", [])),
                    "dernier_ts": ent.get("dernier_ts", ""),
                    "nb_messages": ent.get("nb_messages", 0)})
    out.sort(key=lambda e: str(e.get("dernier_ts", "")), reverse=True)
    return out[:CAP_LISTE]
