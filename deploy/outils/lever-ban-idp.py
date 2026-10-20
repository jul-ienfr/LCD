#!/usr/bin/env python3
"""Leve un ban de regulation Authelia dans sa base SQLite (outil d'exploitation).

Authelia enregistre les bans de regulation dans le stockage configure ici en
SQLite (`storage.local`) : redemarrer le conteneur NE LES LEVE PAS (mesure du
2026-10-19). Ce script supprime uniquement les lignes de ban (et l'historique
de tentatives) de l'utilisateur demande ; il ne touche a rien d'autre.

Usage (le volume de donnees Authelia doit etre monte sur /data) :

  docker run --rm -v lcd-deploy_authelia-data:/data \
      -v "$PWD/outils/lever-ban-idp.py:/outil.py" python:3.12-slim \
      python /outil.py personne_05

Codes de sortie : 0 = ban leve (ou aucun ban), 2 = base introuvable,
3 = utilisateur absent des tables de ban (rien a faire), 1 = erreur d'ecriture.
"""
import os
import sqlite3
import sys

BASE = os.environ.get("LCD_DB", "/data/db.sqlite")

def main() -> int:
    utilisateur = sys.argv[1] if len(sys.argv) > 1 else ""
    if not utilisateur:
        print("usage : python lever-ban-idp.py <utilisateur|tous>")
        return 1
    #  « tous » : remise a zero de l'etat de regulation, pour qu'une batterie
    #  ne mesure pas le ban laisse par la precedente (les batteries de recette
    #  echouent volontairement, la regulation du plan IdP les compte).
    tous = utilisateur == "tous"
    filtre = "" if tous else " WHERE username = ?"
    parametres = () if tous else (utilisateur,)
    if not os.path.exists(BASE):
        print(f"base introuvable : {BASE}")
        return 2
    conn = sqlite3.connect(BASE, timeout=15)
    try:
        tables = [r[0] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")]
        #  Tables d'etat de securite a remettre a zero entre deux batteries :
        #  les bans (regulation du plan) ET l'historique TOTP (un code n'est
        #  utilisable qu'une fois par periode : sans cette remise a zero, une
        #  batterie qui vient d'utiliser le code du moment fait echouer la
        #  suivante en 2FA — mesure du 2026-10-19, test-idp 4 KO apres
        #  test-deploy). La protection contre le rejeu reste prouvee par
        #  test-durcissement, qui utilise un code neuf.
        #  ATTENTION : ne JAMAIS inclure "totp" ici. Le motif "totp" attrape
        #  aussi `totp_configurations`, et supprimer cette table DESENROLE le
        #  2FA de l'utilisateur (mesure du 2026-10-19 : recette 2FA en echec
        #  pour tout le monde, table vide). On ne purge que l'historique des
        #  codes utilises et les bans.
        cibles = [t for t in tables if "ban" in t.lower() or t.lower() == "totp_history"]
        if not cibles:
            print(f"aucune table de ban (tables : {', '.join(sorted(tables))})")
            return 3
        supprimees = 0
        for t in cibles:
            colonnes = [r[1] for r in conn.execute(f"PRAGMA table_info({t})")]
            if "username" not in colonnes:
                continue
            n = conn.execute(f"DELETE FROM {t}{filtre}", parametres).rowcount
            supprimees += n
            print(f"{t} : {n} ligne(s) supprimee(s) pour {utilisateur}")
        # Historique des tentatives : sans lui, la fenetre find_time garde les
        # echecs en memoire et un nouveau 1FA serait compte comme le 4e.
        for t in tables:
            colonnes = [r[1] for r in conn.execute(f"PRAGMA table_info({t})")]
            if "username" in colonnes and "log" in t.lower():
                n = conn.execute(f"DELETE FROM {t}{filtre}", parametres).rowcount
                supprimees += n
                print(f"{t} : {n} ligne(s) supprimee(s) pour {utilisateur}")
        conn.commit()
        restant = 0
        for t in cibles:
            colonnes = [r[1] for r in conn.execute(f"PRAGMA table_info({t})")]
            if "username" in colonnes:
                restant += conn.execute(
                    f"SELECT COUNT(*) FROM {t}{filtre}", parametres).fetchone()[0]
        print(f"ban restant pour {utilisateur} : {restant}")
        return 0 if restant == 0 else 1
    finally:
        conn.close()

if __name__ == "__main__":
    sys.exit(main())
