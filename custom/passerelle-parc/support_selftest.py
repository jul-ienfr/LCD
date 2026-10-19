"""support_selftest.py — vérifie support.py sans dépendance (stdlib seule).

Exécute : `python support_selftest.py` — imprime `SELFTEST OK` si tout passe,
sinon traceback + exit 1. Tout tourne dans un répertoire temporaire jeté à la
fin : le module ne touche jamais les données de prod depuis un test.
"""
import os
import shutil
import sys
import tempfile
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import support  # noqa: E402  (après sys.path pour importer à côté de soi)


def verifier(condition, libelle):
    """Assert with message : un test muet qui échoue ne dit rien d'utile."""
    if not condition:
        raise AssertionError("ECHEC : " + libelle)


def attendre_erreur(code, fonction, *args, **kwargs):
    """Vérifie que `fonction` lève SupportErreur avec le bon `code`.

    Le code est le contrat avec la passerelle (403/404/400) : tester le code,
    pas seulement le raise, empêche qu'une inversion ACL/introuvable passe
    inaperçue.
    """
    try:
        fonction(*args, **kwargs)
    except support.SupportErreur as e:
        verifier(e.code == code,
                 "%s attendu code %s, obtenu %s (%s)"
                 % (fonction.__name__, code, e.code, e))
        return e
    raise AssertionError("ECHEC : %s aurait du lever SupportErreur(code=%s)"
                         % (fonction.__name__, code))


def main():
    rep = tempfile.mkdtemp(prefix="support-selftest-")
    try:
        # ------------------------------------------------------------------ #
        # TICKETS : création, list, cloture (avec/sans motif), 404, 400
        # ------------------------------------------------------------------ #
        t1 = support.ticket_creer(rep, "client-1", "Clé bloquée",
                                  "Le voyageur n'arrive pas à ouvrir",
                                  priorite="P1", logement_id="log1")
        verifier(t1["ref"].startswith("TICKET-"), "ref auto générée")
        verifier(t1["statut"] == "ouvert", "statut initial ouvert")
        verifier(t1["ferme_le"] is None, "ferme_le null à l'ouverture")

        # Ref fournie : utilisée telle quelle (jamais un ticket sans ref).
        t2 = support.ticket_creer(rep, "client-2", "Linge manquant",
                                  "Manque 2 draps", logement_id="log2",
                                  ref="TICKET-EXTERNE-7")
        verifier(t2["ref"] == "TICKET-EXTERNE-7", "ref fournie conservée")

        liste = support.tickets_lister(rep)
        verifier(len(liste) == 2, "2 tickets listés")
        verifier(liste[0]["ref"] == t2["ref"],
                 "plus récent d'abord (t2 avant t1)")
        verifier(len(support.tickets_lister(rep, statut="cloture")) == 0,
                 "filtre statut cloture vide")
        verifier(support.tickets_lister(rep, statut="ouvert")[0]["ref"]
                 == t2["ref"], "filtre statut ouvert")

        attendre_erreur(400, support.ticket_statut, rep, "client-1",
                        t1["ref"], "cloture", motif="")
        t1 = support.ticket_statut(rep, "client-1", t1["ref"], "en_cours")
        verifier(t1["statut"] == "en_cours", "transition en_cours")
        verifier(t1["maj_par"] == "client-1", "maj_par tracé")

        t1 = support.ticket_statut(rep, "support-1", t1["ref"], "cloture",
                                   motif="Serrage vis effectue")
        verifier(t1["statut"] == "cloture", "cloture appliquée")
        verifier(bool(t1["ferme_le"]), "ferme_le horodaté à la clôture")
        verifier(t1["motif_cloture"] == "Serrage vis effectue",
                 "motif_cloture conservé")

        attendre_erreur(404, support.ticket_statut, rep, "client-1",
                        "TICKET-INCONNU", "cloture", motif="x")
        attendre_erreur(400, support.ticket_statut, rep, "client-1",
                        t1["ref"], "ouvert")
        attendre_erreur(400, support.ticket_creer, rep, "", "sujet", "desc")
        attendre_erreur(400, support.ticket_creer, rep, "q", "sujet", "desc",
                        priorite="P9")

        # ------------------------------------------------------------------ #
        # MESSAGERIE : ACL voyageur (403 inter-clients), opérateur OK
        # ------------------------------------------------------------------ #
        m1 = support.fil_creer(rep, "voyageur-1", "voyageur", "RES-001",
                               "Bonjour, arrivee a quelle heure ?")
        verifier(m1["fil_id"] == "voyageur:RES-001", "fil_id = type:ref")
        verifier(m1["seq"] == 1, "premier message seq 1")

        # Un AUTRE voyageur ne voit ni n'écrit chez le premier (anti-fuite).
        attendre_erreur(403, support.fil_lire, rep, "voyageur-2",
                        "voyageur:RES-001")
        attendre_erreur(403, support.message_envoyer, rep, "voyageur-2",
                        "voyageur", "RES-001", "Moi aussi !")

        # L'opérateur lit et répond toujours (rôle calculé par la passerelle).
        fil = support.fil_lire(rep, "support-1", "voyageur:RES-001",
                               operateur=True)
        verifier(fil["total"] == 1, "operateur lit le fil (1 message)")
        verifier(fil["auteurs"] == ["voyageur-1"], "auteur = créateur")
        m2 = support.message_envoyer(rep, "support-1", "voyageur", "RES-001",
                                     "Arrivee a 16h.", operateur=True)
        verifier(m2["seq"] == 2, "réponse opérateur seq 2")

        # Le voyageur 1 voit les 2 messages, en ordre croissant.
        fil = support.fil_lire(rep, "voyageur-1", "voyageur:RES-001")
        verifier(fil["total"] == 2, "voyageur-1 voit 2 messages")
        verifier([m["seq"] for m in fil["messages"]] == [1, 2],
                 "messages triés par seq croissant")

        # ------------------------------------------------------------------ #
        # 5 fils listés correctement (opérateur = tous, client = les siens)
        # ------------------------------------------------------------------ #
        support.fil_creer(rep, "voyageur-2", "voyageur", "RES-002",
                          "Question sur le parking")
        support.fil_creer(rep, "proprio-1", "proprio", "log1",
                          "Le chauffe-eau grince")
        support.fil_creer(rep, "presta-1", "presta", "M-001",
                          "Creneau menage propose")
        # Fil créé par un seul opérateur : invisible des clients jusqu'à ce
        # qu'un client réponde (auteurs=[]).
        support.message_envoyer(rep, "support-1", "proprio", "log9",
                                "Prise de contact", operateur=True)

        tous = support.fils_lister(rep, "support-1", operateur=True)
        verifier(len(tous) == 5, "operateur voit 5 fils (obtenu %d)"
                 % len(tous))
        ids = sorted(e["fil_id"] for e in tous)
        verifier(ids == ["presta:M-001", "proprio:log1", "proprio:log9",
                         "voyageur:RES-001", "voyageur:RES-002"],
                 "les 5 fil_id attendus : " + str(ids))
        par_id = {e["fil_id"]: e for e in tous}
        verifier(par_id["voyageur:RES-001"]["nb_messages"] == 2,
                 "nb_messages compté depuis le journal")

        v1 = support.fils_lister(rep, "voyageur-1")
        verifier([e["fil_id"] for e in v1] == ["voyageur:RES-001"],
                 "voyageur-1 ne voit que SON fil (anti-fuite)")
        v2 = support.fils_lister(rep, "voyageur-2")
        verifier([e["fil_id"] for e in v2] == ["voyageur:RES-002"],
                 "voyageur-2 ne voit que SON fil")
        p1 = support.fils_lister(rep, "proprio-1")
        verifier([e["fil_id"] for e in p1] == ["proprio:log1"],
                 "proprio-1 ne voit pas proprio:log9 (opérateur seul)")

        # Fil totalement inconnu : 403 pour un client (pas de sondage), 404
        # pour l'opérateur.
        attendre_erreur(403, support.fil_lire, rep, "voyageur-1",
                        "voyageur:RES-999")
        attendre_erreur(404, support.fil_lire, rep, "support-1",
                        "voyageur:RES-999", operateur=True)

        print("SELFTEST OK")
    finally:
        shutil.rmtree(rep, ignore_errors=True)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc()
        sys.exit(1)
