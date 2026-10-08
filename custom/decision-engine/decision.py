#!/usr/bin/env python3
# custom/decision-engine/decision.py — orchestrateur maison P2-8 (§5.11, §1.6).
# 0 € : stdlib seule. État unifié occupation/prix, règles prioritaires :
#   sécurité > occupation > énergie > confort > prix.
# Log JSONL : decision.logX.jsonl (schéma P1-10/P2-8/P7-7, runtime /config/logs/, 90 j accès).
#
# Règles inviolables :
#   - Ne génère JAMAIS de PIN (KeyMaster + Nuki Hub seuls, §1.6) : aucun code de
#     génération ici — le champ pin transite (poussé par KeyMaster) ou reste vide
#     (log2 smart_lock off -> boîte à clés). Ne fait JAMAIS de tool-calling
#     serrure/vanne/portail direct — émet uniquement des events HA vers blueprints.
#   - `copro.verifiee: false` -> mise en ligne BLOQUÉE + sensor.logX_config_ok rouge.
#   - RBAC double filtre : acces.yaml (qui + périmètre logement + expiry) + visibility:
#     dashboards ; journal tagué rôle+marque. Hors scope -> blocage + log, jamais d'auto.
#   - Bornes prix 75/290 inviolables en code ; hors bornes = motif humain + blocage auto.
#   - LLM/Jev consultatifs seuls (traçabilité llm/jev dans le JSONL), jamais d'action directe.
#   - Secrets (tokens) : env LCD_* ou secrets.yaml, JAMAIS en dur.
#
# Contrats :
#   GET  /etat?logement_id=log1
#     -> {logement_id, config_ok, copro_verifiee, occupation{...}, prix{...}, alertes[]}
#   POST /autoriser {qui_id, action, logement_id} -> {autorise, motif, role}
#   POST /event {type, logement_id, qui, ref?, data?} -> vérifie RBAC + copro, log, forward HA
#     types : lcd_j2_envoi_acces | lcd_j1_rappel | lcd_checkout | lcd_avis_j1
#   GET  /phrases?logement_id=log1[&cle=<cle>&langue=<code>&var=...] -> P6-11 :
#     sans cle = catalogue 20 phrases 1-tap ; avec cle = phrase rendue localisée
#     (placeholders injectés APRÈS choix langue, jamais de PIN ici)
#   GET  /memoire?logement_id=log1&hash=<sha256>&qui=<qui> -> P6-12 :
#     fiche pré-remplissage (langue/consignes/extras favoris, jamais le hash)
#     ou 404 (inconnu / opt-out / expiré)
#   POST /memoire {action: optin/optout/purge, logement_id, qui, hash?, ...}
#     -> opt-in/out 1-tap HUMAIN + purge 24 mois (opt-out = oubli immédiat).
#     Jamais de CSI brut (hash seul), jamais d'effet prix (art.225-1).
#   POST /decision {logement_id, ref, qui, quoi, canal?, montant?, motif?, llm?, jev?}
#     -> vérifie RBAC + bornes + hors_bornes Jev, log JSONL (bloqué si refusé, loggé aussi)
#   GET  /health -> {"ok": true}
#
# Usage : python3 decision.py --config config.yaml --logements ../logements.yaml --acces ../acces.yaml
#   --check : vérifie copro + pousse sensor.logX_config_ok (rouge si false) + affiche état.
#   --serve : démarre l'API HTTP.
#   env : LCD_SECRETS_YAML, LCD_HA_URL/TOKEN, LCD_ICS_SYNC_URL, LCD_PRICING_URL, LCD_HTTP_PORT.

import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

# Actions атомiques + matrice RBAC (rôle, sous-rôle) -> actions autorisées.
# Principe : moindre privilège ; voyageur = sa résa seule (via ref, pas de compte nominatif).
PERMISSIONS = {
    ("super_admin", "super_admin"): {"*"},  # tout, y compris secrets/exports (rotation seule)
    ("super_admin", "admin"): {"etat_lecture", "event_envoi", "prix_reco", "prix_derogation",
                               "forcage_stop_sell", "menage_cloture", "config_modif"},
    ("gestionnaire", "operateur"): {"etat_lecture", "event_envoi", "prix_reco",
                                    "menage_cloture", "forcage_stop_sell"},
    ("gestionnaire", "comptable"): {"etat_lecture", "exports_compta"},
    ("gestionnaire", "support"): {"etat_lecture", "event_envoi"},
    ("proprietaire", "proprio_logement"): {"etat_lecture", "prix_reco"},
    ("proprietaire", "proprio_parc"): {"etat_lecture", "prix_reco"},
    ("voyageur", "sejour"): {"etat_lecture"},  # sa résa seule (ref) : questionnaire, late/early
    ("prestataires", "menage_interne"): {"etat_lecture", "menage_cloture"},
    ("prestataires", "presta_externe"): {"etat_lecture", "menage_cloture"},
}

# quoi (JSONL) -> action RBAC requise
QUOI_VERS_ACTION = {
    "prix": "prix_reco",
    "prix_derogation": "prix_derogation",
    "acces": "event_envoi",
    "ics": "event_envoi",
    "energie": "event_envoi",
    "securite": "event_envoi",
    "menage": "menage_cloture",
    "compta": "exports_compta",
    "llm": "etat_lecture",
    "jev": "etat_lecture",
}

TYPES_EVENT = {"lcd_j2_envoi_acces", "lcd_j1_rappel", "lcd_checkout", "lcd_avis_j1"}

# P6-9-bis §5.7-ter : gabarits voyageur socle 5 (FR source validée humain + EN/ES/IT/DE
# validées humain). Autre maternelle = fallback EN + badge auto (LLM proxy :4000 hors
# moteur, stdlib seule ici). Placeholders {{ }} INTOUCHABLES : injectés APRÈS choix
# du gabarit, jamais traduits (montants, dates, heures, adresses, PIN/codes, noms).
LANGUES_SOCLE = ["fr", "en", "es", "it", "de"]
GABARIT_PAR_EVENT = {"lcd_j2_envoi_acces": "message_checkin_j2",
                     "lcd_j1_rappel": "message_checkin_j1",
                     "lcd_avis_j1": "message_avis_j1"}
CONSIGNE_BOITE_CLES = {"fr": "boîte à clés (code envoyé séparément)",
                       "en": "lockbox (code sent separately)",
                       "es": "caja de llaves (código enviado por separado)",
                       "it": "cassetta delle chiavi (codice inviato separatamente)",
                       "de": "Schlüsselbox (Code separat gesendet)"}

# P6-10 §5.10 : préfixe « Bon retour ! » localisé socle 5. Posé par data
# `retour_voyageur: true` (geste humain ou ics-sync futur : même voyageur
# reconnu) — jamais auto ici (pas de mémoire avant P6-12, §5.7-ter).
BON_RETOUR = {"fr": "Bon retour !",
              "en": "Welcome back!",
              "es": "¡Bienvenido de nuevo!",
              "it": "Bentornato!",
              "de": "Willkommen zurück!"}


def echapper_wifi(val):
    """Échappe une valeur au format WIFI: (spec : \\ ; , : préfixés de \\)."""
    return re.sub(r"([\\;,:\"])", r"\\\1", val or "")


# P6-11 §5.7-ter : phrasebook 20 phrases critiques 1-tap, localisées socle 5
# (FR source validée humain ; EN/ES/IT/DE validées humain — mêmes clés de
# placeholders {{ }} que les gabarits, injectés APRÈS choix de langue, jamais
# traduits). Sans PIN ni secret : rendu en mémoire seule, jamais loggé en clair
# (réponse = métadonnées SÛRES + texte rendu côté appelant humain, comme /event).
# Hors socle -> fallback EN + traduction_auto True (badge à poser par l'appelant).
PHRASES_CRITIQUES = {
    "bienvenue": {
        "fr": "Bienvenue à {{ logement }} !",
        "en": "Welcome to {{ logement }}!",
        "es": "Bienvenido a {{ logement }}.",
        "it": "Benvenuti a {{ logement }}!",
        "de": "Willkommen in {{ logement }}!",
    },
    "arrivee_16h": {
        "fr": "Arrivée à partir de {{ heure_arrivee }}.",
        "en": "Check-in from {{ heure_arrivee }}.",
        "es": "Llegada a partir de las {{ heure_arrivee }}.",
        "it": "Check-in dalle {{ heure_arrivee }}.",
        "de": "Anreise ab {{ heure_arrivee }} Uhr.",
    },
    "depart_11h": {
        "fr": "Départ avant 11h, merci de laisser les clés à l'intérieur.",
        "en": "Check-out before 11am, please leave the keys inside.",
        "es": "Salida antes de las 11h, deje las llaves dentro por favor.",
        "it": "Check-out entro le 11, lasciate le chiavi all'interno.",
        "de": "Abreise vor 11 Uhr, bitte lassen Sie die Schlüssel drinnen.",
    },
    "heures_calmes": {
        "fr": "Heures calmes : {{ heures_calmes }} — merci de respecter le voisinage.",
        "en": "Quiet hours: {{ heures_calmes }} — please respect the neighbours.",
        "es": "Horas de silencio: {{ heures_calmes }} — gracias por respetar a los vecinos.",
        "it": "Ore di silenzio: {{ heures_calmes }} — rispettate i vicini.",
        "de": "Ruhezeiten: {{ heures_calmes }} — bitte respektieren Sie die Nachbarn.",
    },
    "urgence": {
        "fr": "Urgence : appelez le {{ tel_urgence }}.",
        "en": "Emergency: call {{ tel_urgence }}.",
        "es": "Emergencia: llame al {{ tel_urgence }}.",
        "it": "Emergenza: chiamate il {{ tel_urgence }}.",
        "de": "Notfall: Rufen Sie {{ tel_urgence }} an.",
    },
    "wifi_aide": {
        "fr": "WiFi invité : scannez le QR sur la table du salon.",
        "en": "Guest WiFi: scan the QR on the living-room table.",
        "es": "WiFi de invitados: escanee el QR de la mesa del salón.",
        "it": "WiFi ospiti: scansionate il QR sul tavolo del soggiorno.",
        "de": "Gäste-WLAN: Scannen Sie den QR auf dem Wohnzimmertisch.",
    },
    "boite_cles": {
        "fr": "Boîte à clés : le code vous a été envoyé séparément.",
        "en": "Lockbox: the code was sent to you separately.",
        "es": "Caja de llaves: el código se le envió por separado.",
        "it": "Cassetta delle chiavi: il codice vi è stato inviato separatamente.",
        "de": "Schlüsselbox: Der Code wurde Ihnen separat zugesendet.",
    },
    "code_separe": {
        "fr": "Votre code d'accès vous a été envoyé séparément.",
        "en": "Your access code was sent to you separately.",
        "es": "Su código de acceso se le envió por separado.",
        "it": "Il vostro codice di accesso vi è stato inviato separatamente.",
        "de": "Ihr Zugangscode wurde Ihnen separat zugesendet.",
    },
    "fumeur_non": {
        "fr": "Logement non fumeur, merci de fumer à l'extérieur.",
        "en": "Non-smoking property, please smoke outside.",
        "es": "Alojamiento para no fumadores, fume fuera por favor.",
        "it": "Alloggio per non fumatori, fumate fuori per favore.",
        "de": "Nichtraucher-Unterkunft, bitte rauchen Sie draußen.",
    },
    "animaux_non": {
        "fr": "Les animaux ne sont pas acceptés dans ce logement.",
        "en": "Pets are not allowed in this property.",
        "es": "No se admiten mascotas en este alojamiento.",
        "it": "Gli animali non sono ammessi in questo alloggio.",
        "de": "Tiere sind in dieser Unterkunft nicht erlaubt.",
    },
    "occupants_max": {
        "fr": "Capacité maximale : {{ occupants_max }} personnes, merci.",
        "en": "Maximum capacity: {{ occupants_max }} guests, thank you.",
        "es": "Capacidad máxima: {{ occupants_max }} personas, gracias.",
        "it": "Capienza massima: {{ occupants_max }} persone, grazie.",
        "de": "Maximale Belegung: {{ occupants_max }} Personen, danke.",
    },
    "menage_depart": {
        "fr": "Départ : lancez une machine si besoin, laissez la vaisselle rangée.",
        "en": "Check-out: run the dishwasher if needed, leave dishes put away.",
        "es": "Salida: ponga el lavavajillas si hace falta, deje la vajilla recogida.",
        "it": "Check-out: avviate la lavastoviglie se serve, lasciate i piatti a posto.",
        "de": "Abreise: Spülmaschine bei Bedarf laufen lassen, Geschirr bitte einräumen.",
    },
    "poubelles": {
        "fr": "Tri : containers au rez-de-chaussée, côté parking.",
        "en": "Sorting: bins on the ground floor, parking side.",
        "es": "Reciclaje: contenedores en la planta baja, lado parking.",
        "it": "Differenziata: contenitori al piano terra, lato parcheggio.",
        "de": "Mülltrennung: Container im Erdgeschoss, Parkplatzseite.",
    },
    "clim_consigne": {
        "fr": "Clim : 26 °C la nuit, éteignez en partant s'il vous plaît.",
        "en": "AC: 26°C at night, please switch off when leaving.",
        "es": "Clima: 26 °C por la noche, apáguelo al salir por favor.",
        "it": "Clima: 26 °C di notte, spegnete uscendo per favore.",
        "de": "Klima: nachts 26 °C, beim Verlassen bitte ausschalten.",
    },
    "eau_chaude": {
        "fr": "Eau chaude : patientez 2 minutes après ouverture du robinet.",
        "en": "Hot water: wait 2 minutes after opening the tap.",
        "es": "Agua caliente: espere 2 minutos tras abrir el grifo.",
        "it": "Acqua calda: attendete 2 minuti dopo aver aperto il rubinetto.",
        "de": "Warmwasser: Warten Sie 2 Minuten nach dem Aufdrehen.",
    },
    "parking": {
        "fr": "Parking : place visiteur au sous-sol, portail code séparé envoyé.",
        "en": "Parking: visitor bay in the basement, gate code sent separately.",
        "es": "Parking: plaza de visitante en el sótano, código enviado por separado.",
        "it": "Parcheggio: posto visitatori nel seminterrato, codice inviato separatamente.",
        "de": "Parkplatz: Besucherplatz im Untergeschoss, Torcode separat gesendet.",
    },
    "questionnaire": {
        "fr": "Questionnaire 3 min : {{ lien_questionnaire }} — merci !",
        "en": "3-min survey: {{ lien_questionnaire }} — thank you!",
        "es": "Cuestionario 3 min: {{ lien_questionnaire }} — ¡gracias!",
        "it": "Questionario 3 min: {{ lien_questionnaire }} — grazie!",
        "de": "3-Minuten-Fragebogen: {{ lien_questionnaire }} — danke!",
    },
    "avis": {
        "fr": "Votre avis compte : {{ lien_avis }} — merci de votre séjour !",
        "en": "Your review matters: {{ lien_avis }} — thanks for staying!",
        "es": "Su opinión cuenta: {{ lien_avis }} — ¡gracias por su estancia!",
        "it": "La vostra recensione conta: {{ lien_avis }} — grazie del soggiorno!",
        "de": "Ihre Bewertung zählt: {{ lien_avis }} — danke für Ihren Aufenthalt!",
    },
    "bon_retour": {
        "fr": "Bon retour ! Bon séjour à {{ logement }}.",
        "en": "Welcome back! Enjoy your stay at {{ logement }}.",
        "es": "¡Bienvenido de nuevo! Buena estancia en {{ logement }}.",
        "it": "Bentornato! Buon soggiorno a {{ logement }}.",
        "de": "Willkommen zurück! Guten Aufenthalt in {{ logement }}.",
    },
    "au_revoir": {
        "fr": "Merci et à bientôt — {{ marque }} ({{ tel_urgence }} en cas d'oubli).",
        "en": "Thank you and see you soon — {{ marque }} ({{ tel_urgence }} if forgotten).",
        "es": "Gracias y hasta pronto — {{ marque }} ({{ tel_urgence }} en caso de olvido).",
        "it": "Grazie e a presto — {{ marque }} ({{ tel_urgence }} in caso di dimenticanza).",
        "de": "Danke und bis bald — {{ marque }} ({{ tel_urgence }} bei Vergessenem).",
    },
}


def rendre_phrase(cle, langue, variables):
    """Rend une phrase 1-tap : choix langue socle (fallback EN + badge) puis
    injection placeholders APRÈS (jamais traduits). Retourne
    (texte, langue_utilisee, traduction_auto). Jamais de PIN ici."""
    entrees = PHRASES_CRITIQUES.get(cle or "")
    if not entrees:
        return "", "fr", False
    code = (langue or "fr").lower()[:2]
    if code in LANGUES_SOCLE:
        texte, utilisee, auto = entrees.get(code, ""), code, False
    else:
        texte, utilisee, auto = entrees.get("en", ""), "en", True
    for k, v in (variables or {}).items():
        texte = texte.replace("{{ " + str(k) + " }}", "" if v is None else str(v))
    texte = re.sub(r"\{\{\s*\w+\s*\}\}", "", texte)
    if auto:
        texte = "[traduction automatique] " + texte
    return texte.strip(), utilisee, auto


def _dossier_gabarits():
    """Localise docs/templates/ (repo, container /opt/lcd, ou cwd)."""
    ici = os.path.dirname(os.path.abspath(__file__))
    for cand in (os.path.join(ici, "..", "..", "docs", "templates"),
                 "/opt/lcd/docs/templates",
                 os.path.join(os.getcwd(), "docs", "templates"),
                 os.path.join(os.getcwd(), "custom", "decision-engine",
                              "..", "..", "docs", "templates")):
        if os.path.isdir(os.path.normpath(cand)):
            return os.path.normpath(cand)
    return ""


def charger_gabarit(base, langue):
    """Retourne (texte, langue_utilisee, traduction_auto). FR -> base.md, sinon
    base.{langue}.md, fallback base.en.md + badge auto si hors socle."""
    dossier = _dossier_gabarits()
    code = (langue or "fr").lower()[:2]
    candidats = []
    if code in LANGUES_SOCLE and code != "fr":
        candidats.append(f"{base}.{code}.md")
    elif code == "fr":
        candidats.append(f"{base}.md")
    else:
        candidats.append(f"{base}.en.md")
    if f"{base}.md" not in candidats:
        candidats.append(f"{base}.md")
    if f"{base}.en.md" not in candidats:
        candidats.append(f"{base}.en.md")
    for nom in candidats:
        if not dossier:
            break
        path = os.path.join(dossier, nom)
        try:
            with open(path, encoding="utf-8") as f:
                lignes = [l for l in f if not l.startswith("#")]
            texte = "".join(lignes).strip()
            if texte:
                utilisee = "fr" if nom == f"{base}.md" else nom.rsplit(".", 2)[-2]
                return texte, utilisee, (code not in LANGUES_SOCLE)
        except FileNotFoundError:
            continue
    return "", "fr", (code not in LANGUES_SOCLE)


def composer_message(type_event, langue, variables):
    """Compose le message voyageur : gabarit langue + injection placeholders APRÈS.
    variables : dict (marque, logement, pin_affichage, slot_nom, arrivee, depart,
    wifi_qr, heure_arrivee, adresse, tel_urgence, lien_questionnaire, lien_guide,
    lien_avis, lien_pwa...). Clés manquantes -> '' (jamais de {{ }} résiduel envoyé)."""
    base = GABARIT_PAR_EVENT.get(type_event)
    if not base:
        return "", langue or "fr", False
    texte, utilisee, auto = charger_gabarit(base, langue)
    if not texte:
        return "", utilisee, auto
    for k, v in (variables or {}).items():
        texte = texte.replace("{{ " + str(k) + " }}", "" if v is None else str(v))
    texte = re.sub(r"\{\{\s*\w+\s*\}\}", "", texte)
    if auto:
        texte = "[traduction automatique] " + texte
    return texte.strip(), utilisee, auto


def utcnow_iso():
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


# P6-12 §5.7-quater : mémoire voyageur. Opt-in séjour seul (geste HUMAIN
# 1-tap, qui != auto/llm/jev/moteur-*), jamais de discrimination tarifaire
# (art.225-1 : aucun effet prix), jamais de CSI brut (hash sha256 seul),
# purge 24 mois (dernier_sejour > 730 j), présence 90 j = logs JSONL.
# Registre : custom/memoire/voyageurs.yaml (box) / voyageurs.lab.yaml (lab RW,
# monté comme inventaire/stocks lab, reset via `git checkout -- memoire.lab`).
# Format : liste `- hash: "<hex64>"` + champs scalaires (opt_in, opt_in_le,
# dernier_sejour AAAA-MM-JJ, langue socle, consignes, extras_favoris CSV).
MEMOIRE_CHAMPS = ("opt_in", "opt_in_le", "dernier_sejour", "langue",
                  "consignes", "extras_favoris")
QUI_AUTO_MEMOIRE = ("auto", "llm", "jev", "moteur-direct",
                    "moteur-dispatch", "moteur-caution", "")


def lire_memoire(path):
    """Lit le registre mémoire : {hash: {champs}}. Parseur minimal stdlib
    (liste `- hash:` + scalaires), même style que lire_acces. Absent = {}."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    fiches = {}
    cur = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        prop = ligne.strip()
        if prop.startswith("- hash:"):
            cur = prop.split(":", 1)[1].strip().strip("\"'")
            if re.fullmatch(r"[0-9a-f]{64}", (cur or "").lower()):
                fiches[cur.lower()] = {}
                cur = cur.lower()
            else:
                cur = None  # hash invalide -> ignoré (jamais de CSI brut)
            continue
        if cur and ":" in prop and not prop.startswith("- "):
            k, v = [x.strip().strip("\"'") for x in prop.split(":", 1)]
            if k in MEMOIRE_CHAMPS and v not in ("", "null", "None"):
                fiches[cur][k] = v
    return fiches


def ecrire_memoire(path, fiches):
    """Réécrit le registre (même format). Trié par hash (déterministe)."""
    with open(path, "w", encoding="utf-8") as f:
        f.write("# custom/memoire/voyageurs.yaml — registre opt-in (P6-12 §5.7-quater).\n"
                "# Hash seul, jamais de CSI brut. Purge 24 mois. Écrit par geste humain.\n"
                "voyageurs:\n")
        for h in sorted(fiches):
            f.write(f"  - hash: \"{h}\"\n")
            for k in MEMOIRE_CHAMPS:
                if fiches[h].get(k) not in (None, ""):
                    f.write(f"    {k}: \"{fiches[h][k]}\"\n")


def memoire_expiree(fiche, aujourd_hui=None):
    """True si dernier_sejour > 730 j (purge 24 mois) ou date invalide."""
    try:
        sejour = dt.date.fromisoformat(str(fiche.get("dernier_sejour", "")))
    except ValueError:
        return True
    ref = aujourd_hui or dt.date.today()
    return (ref - sejour).days > 730


def charger_yaml_plat(path):
    data = {}
    try:
        with open(path, encoding="utf-8") as f:
            for ligne in f:
                ligne = ligne.split("#", 1)[0].rstrip()
                if not ligne.strip() or ligne[0] in (" ", "\t"):
                    continue
                if ":" in ligne:
                    k, v = ligne.split(":", 1)
                    k, v = k.strip(), v.strip().strip("\"'")
                    if v.startswith("[") and v.endswith("]"):
                        data[k] = [x.strip().strip("\"'") for x in v[1:-1].split(",") if x.strip()]
                    elif v in ("true", "false"):
                        data[k] = (v == "true")
                    elif re.fullmatch(r"-?\d+", v):
                        data[k] = int(v)
                    elif re.fullmatch(r"-?\d+\.\d+", v):
                        data[k] = float(v)
                    elif v:
                        data[k] = v
    except FileNotFoundError:
        pass
    return data


def charger_branding(path):
    """Variables statiques marque (fichier PRIVÉ, jamais commité). Plat (lab) ou
    imbriqué sous `branding:` (exemple prod) : lit toute ligne `k: v` non vide,
    niveau 0 comme indentée, sauf la clé `branding:` elle-même. Absent = {}."""
    data = {}
    try:
        with open(path, encoding="utf-8") as f:
            for brute in f:
                ligne = brute.split("#", 1)[0].rstrip()
                if not ligne.strip() or ":" not in ligne:
                    continue
                k, v = ligne.strip().split(":", 1)
                k, v = k.strip().strip("\"'"), v.strip().strip("\"'")
                if not k or k == "branding" or not v:
                    continue
                if v.startswith("[") and v.endswith("]"):
                    data[k] = [x.strip().strip("\"'") for x in v[1:-1].split(",")
                               if x.strip()]
                elif v in ("true", "false"):
                    data[k] = (v == "true")
                elif re.fullmatch(r"-?\d+", v):
                    data[k] = int(v)
                elif re.fullmatch(r"-?\d+\.\d+", v):
                    data[k] = float(v)
                else:
                    data[k] = v
    except FileNotFoundError:
        pass
    return data


def lire_logements(path):
    """Extrait par logement : identité (nom/commune) + pricing, copro.verifiee,
    features, mode (parseur minimal)."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    logts = {}
    cur = None
    section = None  # pricing | copro | features | None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        prop = ligne.strip()
        if indent == 2 and prop in ("log1:", "log2:", "log3:"):
            cur = prop[:-1]
            logts[cur] = {"nom": cur, "commune": "", "prix_base": 110,
                          "prix_min": 75, "prix_max": 290,
                          "mode_gestion_defaut": "equilibre",
                          "heures_calmes": "", "occupants_max": "",
                          "copro_verifiee": False, "features": {}}
            section = None
            continue
        if cur is None:
            continue
        if indent == 4 and prop in ("pricing:", "copro:", "features:"):
            section = prop[:-1]
            continue
        if indent == 4 and prop.endswith(":"):
            section = None  # menage:, autres blocs
            continue
        if indent == 4 and not section and ":" in prop:
            # Identité statique logement (nom, commune) — sert les defaults J-2/J-1/J+1.
            k_id, v_id = [x.strip().strip("\"'") for x in prop.split(":", 1)]
            if k_id in ("nom", "commune") and v_id:
                logts[cur][k_id] = v_id
            continue
        if section and ":" in prop:
            k, v = [x.strip().strip("\"'") for x in prop.split(":", 1)]
            if section == "pricing":
                if k in ("prix_base", "prix_min", "prix_max"):
                    try:
                        logts[cur][k] = int(float(v))
                    except ValueError:
                        pass
                elif k == "mode_gestion_defaut" and v:
                    logts[cur][k] = v
            elif section == "copro":
                if k == "verifiee":
                    logts[cur]["copro_verifiee"] = (v == "true")
                elif k in ("heures_calmes", "occupants_max") and v:
                    logts[cur][k] = v
            elif section == "features":
                logts[cur]["features"][k] = (v == "true")
    return logts


def lire_acces(path):
    """Extrait personnes : id, role, sous_role, logements, expire_le (parseur minimal)."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}
    pers = {}
    cur = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        prop = ligne.strip()
        if indent == 2 and prop.startswith("- id:"):
            cur = prop.split(":", 1)[1].strip().strip("\"'")
            pers[cur] = {"role": "", "sous_role": "", "logements": [], "expire_le": None}
            continue
        if cur and indent >= 4 and ":" in prop and not prop.startswith("- "):
            k, v = [x.strip().strip("\"'") for x in prop.split(":", 1)]
            if k in ("role", "sous_role"):
                pers[cur][k] = v
            elif k == "logements":
                v = v.strip("[]")
                pers[cur][k] = [x.strip().strip("\"'") for x in v.split(",") if x.strip()]
            elif k == "expire_le":
                pers[cur][k] = None if v in ("", "null", "None") else v
    return pers


class Moteur:
    def __init__(self, cfg, logts, acces, secrets, branding=None,
                 memoire_path=""):
        self.cfg = cfg
        self.logts = logts
        self.acces = acces
        self.secrets = secrets
        self.branding = dict(branding or {})
        # P6-12 §5.7-quater : registre opt-in (hash seul, jamais CSI brut).
        # Lu au boot, réécrit à chaque opt-in/out/purge (geste humain seul).
        self.memoire_path = memoire_path or ""
        self.memoire = (lire_memoire(memoire_path) if memoire_path else {})
        self.decision_dir = os.environ.get("LCD_DECISION_LOG_DIR",
                                          cfg.get("decision_log_dir", "./state"))
        os.makedirs(self.decision_dir, exist_ok=True)
        self.ha_url = os.environ.get("LCD_HA_URL", cfg.get("ha_url", "")).rstrip("/")
        self.ha_token = os.environ.get("LCD_HA_TOKEN", secrets.get("ha_api_token", ""))
        self.ics_sync_url = os.environ.get(
            "LCD_ICS_SYNC_URL", cfg.get("ics_sync_url", "http://127.0.0.1:8090")).rstrip("/")
        self.pricing_url = os.environ.get(
            "LCD_PRICING_URL", cfg.get("pricing_url", "http://127.0.0.1:8091")).rstrip("/")
        self.commissions = {
            "direct": float(cfg.get("commission_direct", 0.00)),
            "airbnb": float(cfg.get("commission_airbnb", 0.15)),
            "booking": float(cfg.get("commission_booking", 0.17)),
            "abritel": float(cfg.get("commission_abritel", 0.10)),
            "expedia": None,  # taux contrat à vérifier -> reco sans prix + motif
        }

    # --- RBAC ---
    def autoriser(self, qui_id, action, logement_id):
        p = self.acces.get(qui_id)
        if not p:
            return False, f"qui inconnu: {qui_id}", None
        if p.get("expire_le"):
            try:
                if dt.date.fromisoformat(p["expire_le"]) < dt.date.today():
                    return False, f"compte expiré le {p['expire_le']}", p
            except ValueError:
                pass
        if logement_id and logement_id not in p.get("logements", []):
            return False, (f"hors périmètre : {qui_id} n'a pas {logement_id} "
                           f"(périmètre {p.get('logements')})"), p
        droits = PERMISSIONS.get((p.get("role"), p.get("sous_role")), set())
        if "*" in droits or action in droits:
            return True, f"{p.get('role')}/{p.get('sous_role')} autorisé {action}", p
        return False, f"{p.get('role')}/{p.get('sous_role')} non autorisé {action}", p

    # --- traçabilité (schéma §README, 90 j accès) ---
    def vars_statiques(self, logement_id):
        """Defaults statiques P6-9-bis : branding (marque/tel_urgence/liens) +
        identité logement (nom -> logement, commune -> adresse). Rendus dans
        `data` seulement si la clé est absente/vide — les données fournies
        (ics-sync/QloApps/KeyMaster/renvoi humain) priment TOUJOURS. Jamais
        de PIN ici (KeyMaster seul, boîte à clés si vide).
        P6-10 §5.10 : `wifi_qr` produit depuis les secrets (wifi_<log>_ssid +
        wifi_<log>_key, box P1-9/secrets, lab = valeurs FAUSSES) au format
        `WIFI:T:WPA;S:<ssid>;P:<clé>;;` (échappement spec). Secrets absents
        (box non renseignée) -> pas de wifi_qr (QR accueil/papier en fallback,
        jamais de clé inventée ici)."""
        log = self.logts.get(logement_id, {})
        contact = self.branding.get("contact", "")
        brut = self.branding.get("tel_urgence", "")
        tel = brut if isinstance(brut, str) else ""
        if not tel:
            tel = (contact if isinstance(contact, str)
                   else (contact.get("tel_urgence", "") if isinstance(contact, dict)
                         else ""))
        if not tel:
            tel = self.branding.get("telephone", "") or ""
        marque = (self.branding.get("marque") or "votre hôte")
        domaine = (self.branding.get("domaine") or "").strip()
        if not domaine:
            # Forme plate lab : site: "https://..." -> hôte seul.
            site = (self.branding.get("site") or "").strip()
            domaine = re.sub(r"^https?://", "", site).split("/")[0].strip()
            if "." not in domaine:
                domaine = ""
        base_url = f"https://{domaine}" if domaine else ""
        # P6-10 §5.10 : QR WiFi `WIFI:T:WPA;S:<ssid>;P:<clé>;;` depuis secrets.
        # Jamais de clé inventée : secrets absents -> "" (fallback QR/papier).
        ssid = str(self.secrets.get(f"wifi_{logement_id}_ssid", "") or "").strip()
        cle = str(self.secrets.get(f"wifi_{logement_id}_key", "") or "").strip()
        wifi_qr = (f"WIFI:T:WPA;S:{echapper_wifi(ssid)};"
                   f"P:{echapper_wifi(cle)};;") if (ssid and cle) else ""
        return {
            "marque": marque,
            "logement": log.get("nom", logement_id) or logement_id,
            "adresse": log.get("commune", "") or "",
            "tel_urgence": tel if isinstance(tel, str) else "",
            "wifi_qr": wifi_qr,
            "lien_questionnaire": f"{base_url}/q/{logement_id}" if base_url else "",
            "lien_guide": f"{base_url}/guide/{logement_id}" if base_url else "",
            "lien_avis": f"{base_url}/avis/{logement_id}" if base_url else "",
            "lien_pwa": f"{base_url}/sejour/{logement_id}" if base_url else "",
        }

    def log_decision(self, logement_id, ref, qui, quoi, canal=None, montant=None,
                     motif="", llm=None, jev=None):
        tx = self.commissions.get(canal) if canal else None
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": canal, "commission": tx,
                 "net_hote": (None if (tx is None or montant is None or
                                       not isinstance(montant, (int, float)))
                              else round(float(montant) * (1.0 - tx), 2)),
                 "llm": llm or {}, "jev": jev or {}, "motif": motif}
        path = os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl")
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
        return ligne

    def ha_post(self, chemin, payload):
        if not (self.ha_url and self.ha_token and not self.ha_token.startswith("CHANGER")):
            return False, "ha_non_configure"
        req = urllib.request.Request(
            self.ha_url + chemin, data=json.dumps(payload or {}).encode("utf-8"),
            headers={"Authorization": f"Bearer {self.ha_token}",
                     "Content-Type": "application/json"}, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return (r.status < 300), r.status
        except Exception as e:
            return False, f"ha_erreur:{type(e).__name__}"

    def ha_get(self, url):
        try:
            with urllib.request.urlopen(url, timeout=8) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            return None

    # --- état unifié ---
    def etat(self, logement_id):
        l = self.logts.get(logement_id)
        if not l:
            return None, f"logement inconnu: {logement_id}"
        config_ok = bool(l["copro_verifiee"])
        alertes = []
        if not config_ok:
            alertes.append("copro.verifiee=false : mise en ligne BLOQUÉE (régénérer docs §12.1)")
        # occupation : planning fusionné ics-sync (state partagé, fallback HTTP /dispo)
        sejours = []
        state_dir = os.environ.get("LCD_STATE_DIR", "./state")
        for cand in (os.path.join(state_dir, f"planning-{logement_id}.json"),
                     os.path.join(self.cfg.get("state_dir", "./state"),
                                  f"planning-{logement_id}.json")):
            try:
                with open(cand, encoding="utf-8") as f:
                    sejours = json.load(f)
                break
            except (FileNotFoundError, json.JSONDecodeError):
                continue
        auj = dt.date.today()
        occupees = sum(1 for i in range(30)
                       if any(s["debut"] <= (auj + dt.timedelta(days=i)).isoformat() < s["fin"]
                              for s in sejours))
        occupation = {"occ_j30": round(occupees / 30.0, 3), "sejours_connus": len(sejours)}
        # prix pivot J (pricing-engine, fallback local si injoignable)
        prix = self.ha_get(f"{self.pricing_url}/prix?logement_id={logement_id}"
                           f"&date={auj.isoformat()}") if self.pricing_url else None
        if not prix:
            prix = {"pivot": None, "note": "pricing-engine injoignable (LXC box)",
                    "bornes": [l["prix_min"], l["prix_max"]]}
        return {"logement_id": logement_id, "config_ok": config_ok,
                "copro_verifiee": config_ok, "occupation": occupation, "prix": prix,
                "features_actives": sorted(k for k, v in l["features"].items() if v),
                "bornes_prix": [l["prix_min"], l["prix_max"]], "alertes": alertes}, None

    def pousser_config_ok(self):
        """sensor.logX_config_ok : rouge (off) si copro non vérifiée."""
        res = []
        for log, l in self.logts.items():
            ok, info = self.ha_post(
                f"/api/states/sensor.{log}_config_ok",
                {"state": "on" if l["copro_verifiee"] else "off",
                 "attributes": {"copro_verifiee": l["copro_verifiee"],
                                "updated": utcnow_iso(),
                                "note": ("mise en ligne BLOQUÉE : accord syndic + Cerfa requis"
                                         if not l["copro_verifiee"] else "config OK")}})
            res.append((log, ok, info))
        return res

    # --- règles prioritaires : sécurité > occupation > énergie > confort > prix ---
    @staticmethod
    def priorite(quoi):
        ordre = {"securite": 0, "acces": 1, "ics": 1, "menage": 1, "energie": 2,
                 "compta": 3, "prix": 4, "prix_derogation": 4, "llm": 5, "jev": 5}
        return ordre.get(quoi, 9)

    def decider(self, logement_id, ref, qui_id, quoi, canal=None, montant=None,
                motif="", llm=None, jev=None):
        """Porte d'entrée unique : RBAC + copro + bornes + hors_bornes Jev, puis log."""
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        action = QUOI_VERS_ACTION.get(quoi, "etat_lecture")
        ok, msg_rbac, p = self.autoriser(qui_id, action, logement_id)
        qui = f"{qui_id}:{p.get('role')}/{p.get('sous_role')}" if p else qui_id
        # Jev hors scope -> blocage (M-JEV4 : hors_bornes>0,5 jamais auto)
        if isinstance(jev, dict) and float(jev.get("hors_bornes", 0) or 0) > 0.5:
            self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                              f"BLOQUÉ Jev hors_bornes={jev.get('hors_bornes')} : {motif}",
                              llm, jev)
            return 403, {"statut": "bloque", "motif": "jev_hors_bornes>0,5 : humain requis"}
        if not ok:
            self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                              f"BLOQUÉ RBAC : {msg_rbac}", llm, jev)
            return 403, {"statut": "bloque", "motif": msg_rbac}
        # copro : mise en ligne bloquée (lecture/reco restent autorisées)
        if not l["copro_verifiee"] and action in ("event_envoi", "prix_derogation",
                                                  "forcage_stop_sell", "config_modif"):
            self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                              "BLOQUÉ copro.verifiee=false : mise en ligne interdite", llm, jev)
            return 403, {"statut": "bloque",
                         "motif": "copro.verifiee=false : mise en ligne BLOQUÉE"}
        # bornes prix inviolables : dérogation = humain + motif, sinon 422
        if quoi in ("prix", "prix_derogation") and isinstance(montant, (int, float)):
            pmin, pmax = l["prix_min"], l["prix_max"]
            if not (pmin <= montant <= pmax):
                if quoi != "prix_derogation" or not motif:
                    self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                                      f"BLOQUÉ hors bornes [{pmin}, {pmax}] sans motif humain",
                                      llm, jev)
                    return 422, {"statut": "bloque",
                                 "erreur": f"hors bornes [{pmin}, {pmax}] : motif humain obligatoire"}
        self.log_decision(logement_id, ref, qui, quoi, canal, montant,
                          motif or f"{action} autorisé ({msg_rbac})", llm, jev)
        return 200, {"statut": "autorise", "priorite": self.priorite(quoi), "detail": msg_rbac}

    def emettre_event(self, type_event, logement_id, qui_id, ref="", data=None):
        """Émet lcd_j2_envoi_acces / lcd_j1_rappel / lcd_checkout / lcd_avis_j1 vers HA.
        Messages composés ici (langue voyageur socle + auto §5.7-ter, gabarits
        docs/templates/message_{checkin_j2,checkin_j1,avis_j1}[.{en,es,it,de}].md),
        jamais par les blueprints. J-1 : rappel seul, jamais de re-push PIN (§5.2).
        J+1 : enquête avis (§5.7-bis : >=4★ lien public, <4★ rattrapage privé) —
        jamais de PIN dans data.message ni data.pin J+1.
        PIN : jamais généré ici — transite depuis KeyMaster ou reste vide (boîte à clés).
        PIN : jamais en clair dans logs/recorder/logbook (motif loggé sans PIN)."""
        if type_event not in TYPES_EVENT:
            return 400, {"erreur": f"type inconnu (attendus {sorted(TYPES_EVENT)})"}
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ok, msg_rbac, p = self.autoriser(qui_id, "event_envoi", logement_id)
        qui = f"{qui_id}:{p.get('role')}/{p.get('sous_role')}" if p else qui_id
        if not ok:
            self.log_decision(logement_id, ref or type_event, qui, "acces", None, None,
                              f"BLOQUÉ RBAC event {type_event} : {msg_rbac}")
            return 403, {"statut": "bloque", "motif": msg_rbac}
        if not l["copro_verifiee"]:
            self.log_decision(logement_id, ref or type_event, qui, "acces", None, None,
                              f"BLOQUÉ event {type_event} : copro.verifiee=false")
            return 403, {"statut": "bloque",
                         "motif": "copro.verifiee=false : mise en ligne BLOQUÉE"}
        data = dict(data or {})
        # Defaults statiques P6-9-bis : branding + identité logement complètent
        # les trous ics-sync/QloApps (marque/adresse/tel/liens). Données
        # fournies priment TOUJOURS — jamais d'écrasement. Jamais de PIN ici.
        for k_def, v_def in self.vars_statiques(logement_id).items():
            if not (data.get(k_def) or "") and (v_def or ""):
                data[k_def] = v_def
        # P6-12 §5.7-quater : returning via hash (data fournie par geste
        # humain / renvoi / ics-sync futur, jamais calculé ici). Si le hash
        # matche une fiche opt-in valide : langue fiche si absente + flag
        # retour_voyageur (Bon retour ci-dessous). Données fournies priment
        # TOUJOURS. Jamais de hash/CSI ni de PIN en sortie (réponse SÛRE).
        if str(data.get("hash", "") or "").strip():
            fiche = self._fiche_valide(data.get("hash", ""))
            if fiche is not None:
                if not (data.get("langue") or ""):
                    data["langue"] = str(fiche.get("langue", "fr") or "fr")
                data["retour_voyageur"] = True
                data.pop("hash", None)  # jamais transmis à HA ni loggé
        langue = (data.get("langue") or "fr")
        # log2 LIGHT / smart_lock off -> pin vide + message boîte à clés (jamais généré ici)
        if not l["features"].get("smart_lock", True):
            data["pin"] = ""
            data.setdefault("message_boite_cles", True)
        # J-1 rappel seul + J+1 enquête : jamais de PIN transféré (ni MQTT, ni message)
        if type_event in ("lcd_j1_rappel", "lcd_avis_j1"):
            data["pin"] = ""
        # Composition localisée (gabarit langue + injection placeholders APRÈS).
        langue_utilisee, traduction_auto = langue, False
        if type_event in GABARIT_PAR_EVENT:
            variables = dict(data)
            if not (variables.get("pin") or ""):
                code_langue = (langue or "fr").lower()[:2]
                variables["pin"] = CONSIGNE_BOITE_CLES.get(
                    code_langue, CONSIGNE_BOITE_CLES["fr"])
            message, langue_utilisee, traduction_auto = composer_message(
                type_event, langue, variables)
            # P6-10 §5.10 : returning (même voyageur reconnu, data fournie par
            # geste humain / renvoi / ics-sync futur, jamais auto ici) ->
            # préfixe « Bon retour ! » localisé socle 5 (jamais traduit, jamais
            # en vocal/LLM/logs — message seul, réponse sans message).
            if (type_event == "lcd_j2_envoi_acces"
                    and str(data.get("retour_voyageur", "")).lower()
                    in ("true", "1", "oui", "yes")):
                prefixe = BON_RETOUR.get((langue_utilisee or "fr")[:2],
                                         BON_RETOUR["fr"])
                message = f"{prefixe} {message}" if message else prefixe
            data["message"] = message or data.get("message", "")
            data["langue_utilisee"] = langue_utilisee
            data["traduction_auto"] = traduction_auto
        ok_ha, info = self.ha_post(f"/api/events/{type_event}",
                                   {"logement_id": logement_id, **data})
        self.log_decision(logement_id, ref or type_event, qui, "acces", None, None,
                          f"event {type_event} -> HA {'OK' if ok_ha else info}")
        code = 200 if ok_ha else 202
        # Réponse : métadonnées SÛRES uniquement — jamais le message (contient le
        # PIN J-2) ni le PIN lui-même (jamais en clair logs/recorder/logbook).
        msg = data.get("message", "")
        return code, {"statut": "emis" if ok_ha else "loge_sans_ha",
                      "type": type_event, "ha": info,
                      "langue": langue_utilisee,
                      "traduction_auto": traduction_auto,
                      "retour_voyageur": bool(str(data.get("retour_voyageur", ""))
                                              .lower() in ("true", "1", "oui", "yes")),
                      "gabarit_trouve": bool(msg),
                      "message_longueur": len(msg),
                      "placeholders_restants": msg.count("{{"),
                      "pin_transmis": bool(data.get("pin")),
                      "message_boite_cles": bool(data.get("message_boite_cles"))}

    def rendre_phrases(self, logement_id, cle="", langue="fr", variables=None):
        """P6-11 §5.7-ter : rend le phrasebook 1-tap pour un logement.
        Sans cle -> catalogue (20 clés, jamais de texte). Avec cle -> phrase
        localisée socle 5 (fallback EN + badge hors socle), placeholders
        logement injectés APRÈS choix langue (jamais traduits) : defaults
        statiques (marque/logement/heures_calmes/occupants_max/tel_urgence/
        liens) complètent les trous, données fournies priment. Jamais de PIN
        ici (ni en entrée ni en sortie) — réponse SÛRE loggable."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not cle:
            return 200, {"logement_id": logement_id,
                         "cles": sorted(PHRASES_CRITIQUES),
                         "nb_phrases": len(PHRASES_CRITIQUES),
                         "langues": list(LANGUES_SOCLE)}
        if cle not in PHRASES_CRITIQUES:
            return 400, {"erreur": f"cle inconnue (attendues {sorted(PHRASES_CRITIQUES)})"}
        log = self.logts.get(logement_id, {})
        vars_auto = dict(self.vars_statiques(logement_id))
        # P6-11 : placeholders specifiques logement (heures_calmes/occupants_max
        # depuis copro, jamais inventes : absents -> "" efface proprement).
        vars_auto.setdefault("heures_calmes", log.get("heures_calmes", "") or "")
        vars_auto.setdefault("occupants_max", log.get("occupants_max", "") or "")
        # wifi_qr hors phrasebook (QR papier/salon, jamais de cle en phrase).
        vars_auto.pop("wifi_qr", None)
        fusion = dict(vars_auto)
        for k, v in (variables or {}).items():
            if str(k).lower() in ("pin", "code", "message"):
                continue  # jamais de PIN/code via phrases (garde-fou §5.2)
            if (v or "") != "":
                fusion[k] = v
        texte, utilisee, auto = rendre_phrase(cle, langue, fusion)
        return 200, {"logement_id": logement_id, "cle": cle,
                     "langue": utilisee, "traduction_auto": auto,
                     "phrase": texte,
                     "placeholders_restants": texte.count("{{")}

    # --- P6-12 §5.7-quater : mémoire voyageur (opt-in séjour seul) ---
    def _sauver_memoire(self):
        if self.memoire_path:
            ecrire_memoire(self.memoire_path, self.memoire)

    def _fiche_valide(self, hash_voyageur):
        """Fiche opt-in non expirée ou None (inconnu / opt-out / expiré /
        hash invalide). Jamais de CSI brut : la clé est le hash seul."""
        h = str(hash_voyageur or "").lower()
        fiche = self.memoire.get(h)
        if not fiche or fiche.get("opt_in") not in ("true", "1", "oui", "yes", True):
            return None
        if memoire_expiree(fiche):
            return None
        return fiche

    def pre_remplissage(self, hash_voyageur):
        """GET /memoire : fiche SÛRE loggable (jamais le hash en sortie,
        jamais de PIN — il n'y en a pas ici de toute façon)."""
        fiche = self._fiche_valide(hash_voyageur)
        if fiche is None:
            return 404, {"erreur": "voyageur inconnu, opt-out ou fiche expirée"}
        langue = str(fiche.get("langue", "fr") or "fr").lower()[:2]
        if langue not in LANGUES_SOCLE:
            langue = "fr"
        extras = [x.strip() for x in str(fiche.get("extras_favoris", "") or "").split(",")
                  if x.strip()]
        return 200, {"statut": "reconnu",
                     "langue": langue,
                     "consignes": str(fiche.get("consignes", "") or ""),
                     "extras_favoris": extras}

    def memoire_optin(self, logement_id, qui_id, hash_voyageur, prefs=None):
        """POST /memoire optin : geste HUMAIN seul (qui != auto/llm/jev/
        moteur-*), ref séjour exigée via prefs (traçabilité). Crée/maj la
        fiche (dernier_sejour = aujourd'hui). Jamais d'effet prix."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_MEMOIRE:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        h = str(hash_voyageur or "").lower()
        if not re.fullmatch(r"[0-9a-f]{64}", h):
            return 400, {"erreur": "hash sha256 hex 64 requis (jamais de CSI brut)"}
        prefs = dict(prefs or {})
        langue = str(prefs.get("langue", "fr") or "fr").lower()[:2]
        if langue not in LANGUES_SOCLE:
            langue = "fr"
        self.memoire[h] = {
            "opt_in": "true",
            "opt_in_le": str(prefs.get("opt_in_le", "") or "") or utcnow_iso()[:10],
            "dernier_sejour": dt.date.today().isoformat(),
            "langue": langue,
            "consignes": str(prefs.get("consignes", "") or "")[:500],
            "extras_favoris": ",".join(
                [x.strip() for x in str(prefs.get("extras_favoris", "") or "")
                 .replace(";", ",").split(",") if x.strip()][:10]),
        }
        self._sauver_memoire()
        self.log_decision(logement_id, f"memoire-optin", qui_id, "acces",
                          None, None, "opt-in mémoire (hash seul, sans effet prix)")
        return 200, {"statut": "optin", "langue": langue}

    def memoire_optout(self, logement_id, qui_id, hash_voyageur):
        """POST /memoire optout : oubli IMMÉDIAT (suppression fiche). Même
        garde-fou humain que l'opt-in. 200 même si inconnu (idempotent)."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_MEMOIRE:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        h = str(hash_voyageur or "").lower()
        supprime = self.memoire.pop(h, None) is not None
        if supprime:
            self._sauver_memoire()
        self.log_decision(logement_id, "memoire-optout", qui_id, "acces",
                          None, None, "opt-out mémoire (oubli immédiat)")
        return 200, {"statut": "optout", "fiche_supprimee": supprime}

    def memoire_purge(self, logement_id, qui_id):
        """POST /memoire purge : supprime fiches dernier_sejour > 730 j
        (24 mois). Geste humain. Retourne le nb purgé (SÛR, loggable)."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_MEMOIRE:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        avant = len(self.memoire)
        self.memoire = {h: f for h, f in self.memoire.items()
                        if not memoire_expiree(f)}
        purgees = avant - len(self.memoire)
        if purgees:
            self._sauver_memoire()
        self.log_decision(logement_id, "memoire-purge", qui_id, "acces",
                          None, None, f"purge mémoire 24 mois : {purgees}")
        return 200, {"statut": "purge", "purgees": purgees,
                     "restantes": len(self.memoire)}


class Handler(BaseHTTPRequestHandler):
    engine = None

    def log_message(self, *a):
        pass

    def _json(self, code, obj):
        corps = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(corps)))
        self.end_headers()
        self.wfile.write(corps)

    def _lire_json(self):
        try:
            n = int(self.headers.get("Content-Length", 0))
            return json.loads(self.rfile.read(n) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return None

    def do_GET(self):
        url = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(url.query)
        if url.path == "/health":
            return self._json(200, {"ok": True})
        if url.path == "/etat":
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            res, err = self.engine.etat(logement_id)
            if err:
                return self._json(404, {"erreur": err})
            return self._json(200, res)
        if url.path == "/phrases":
            # P6-11 §5.7-ter : phrasebook 1-tap localise socle 5.
            # Sans cle -> catalogue ; avec cle -> phrase rendue (jamais de PIN).
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            variables = {k: v[0] for k, v in qs.items()
                         if k not in ("logement_id", "cle", "langue") and v}
            code, obj = self.engine.rendre_phrases(
                logement_id, qs.get("cle", [""])[0],
                qs.get("langue", ["fr"])[0], variables)
            return self._json(code, obj)
        if url.path == "/memoire":
            # P6-12 §5.7-quater : fiche pré-remplissage (hash seul en entrée,
            # jamais en sortie). 404 si inconnu/opt-out/expiré.
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = self.engine.pre_remplissage(qs.get("hash", [""])[0])
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})

    def do_POST(self):
        url = urllib.parse.urlparse(self.path)
        p = self._lire_json()
        if p is None:
            return self._json(400, {"erreur": "JSON invalide"})
        if url.path == "/autoriser":
            if not (p.get("qui_id") and p.get("action") and p.get("logement_id")):
                return self._json(400, {"erreur": "qui_id, action, logement_id requis"})
            ok, msg, pers = self.engine.autoriser(p["qui_id"], p["action"], p["logement_id"])
            return self._json(200, {"autorise": ok, "motif": msg,
                                    "role": (f"{pers.get('role')}/{pers.get('sous_role')}"
                                             if pers else None)})
        if url.path == "/decision":
            if not (p.get("logement_id") and p.get("qui") and p.get("quoi")):
                return self._json(400, {"erreur": "logement_id, qui, quoi requis"})
            code, obj = self.engine.decider(
                p["logement_id"], p.get("ref", p["quoi"]), p["qui"], p["quoi"],
                p.get("canal"), p.get("montant"), p.get("motif", ""),
                p.get("llm"), p.get("jev"))
            return self._json(code, obj)
        if url.path == "/event":
            if not (p.get("type") and p.get("logement_id") and p.get("qui")):
                return self._json(400, {"erreur": "type, logement_id, qui requis"})
            code, obj = self.engine.emettre_event(
                p["type"], p["logement_id"], p["qui"], p.get("ref", ""), p.get("data"))
            return self._json(code, obj)
        if url.path == "/memoire":
            # P6-12 §5.7-quater : optin/optout/purge (geste humain seul).
            action = str(p.get("action", "") or "").lower()
            if not (p.get("logement_id") and p.get("qui") and action):
                return self._json(400, {"erreur": "logement_id, qui, action requis"})
            if action == "optin":
                code, obj = self.engine.memoire_optin(
                    p["logement_id"], p["qui"], p.get("hash", ""),
                    p.get("preferences"))
            elif action == "optout":
                code, obj = self.engine.memoire_optout(
                    p["logement_id"], p["qui"], p.get("hash", ""))
            elif action == "purge":
                code, obj = self.engine.memoire_purge(
                    p["logement_id"], p["qui"])
            else:
                return self._json(400, {"erreur": "action inconnue (optin/optout/purge)"})
            return self._json(code, obj)
        return self._json(404, {"erreur": "inconnu"})


def main():
    ap = argparse.ArgumentParser(description="LCD decision-engine P2-8")
    ap.add_argument("--config", default="config.yaml")
    ap.add_argument("--logements", default="../logements.yaml")
    ap.add_argument("--acces", default="../acces.yaml")
    ap.add_argument("--branding", default="../branding.yaml",
                    help="variables statiques marque (PRIVÉ, absent = {})")
    ap.add_argument("--memoire", default="../memoire/voyageurs.yaml",
                    help="registre mémoire opt-in (P6-12, hash seul, absent = {})")
    ap.add_argument("--check", action="store_true",
                    help="vérifie copro + pousse sensor.logX_config_ok + affiche état")
    ap.add_argument("--serve", action="store_true", help="démarre l'API HTTP")
    args = ap.parse_args()

    cfg = charger_yaml_plat(args.config)
    logts = lire_logements(args.logements)
    if not logts:
        print(f"logements introuvables ou vides: {args.logements}", file=sys.stderr)
        return 2
    acces = lire_acces(args.acces)
    if not acces:
        print(f"acces introuvable ou vide: {args.acces}", file=sys.stderr)
        return 2
    secrets = charger_yaml_plat(os.environ.get("LCD_SECRETS_YAML", "./secrets.yaml"))
    branding = charger_branding(args.branding)  # PRIVÉ, absent = {} (jamais commité)
    eng = Moteur(cfg, logts, acces, secrets, branding, args.memoire)
    Handler.engine = eng

    if args.check or not args.serve:
        for log in logts:
            res, err = eng.etat(log)
            print(json.dumps(res or {"erreur": err}, ensure_ascii=False)[:400] + "...")
        print("config_ok:", eng.pousser_config_ok())
        if not args.serve:
            return 0
    port = int(os.environ.get("LCD_HTTP_PORT", cfg.get("http_port", 8092)))
    bind = os.environ.get("LCD_BIND", "127.0.0.1")  # lab Docker : 0.0.0.0
    srv = ThreadingHTTPServer((bind, port), Handler)
    print(f"decision-engine : HTTP 127.0.0.1:{port} ({', '.join(logts)})", flush=True)
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
