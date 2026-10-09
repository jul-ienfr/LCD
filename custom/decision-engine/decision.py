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
#   GET  /questionnaire?logement_id=log1[&ref_resa=<slug>&hash=<sha256>&langue=<code>]
#     -> P6-14 : schéma 4 blocs (arrivée/préférences/extras/contrat) + pré-rempli
#     mémoire si hash reconnu + état complétude si ref_resa (repondu_complet /
#     incomplet / non_repondu + blocs manquants + risque friction). 503 si
#     `questionnaire: off`, 404 logement inconnu. Jamais de PIN, jamais de hash
#     en sortie.
#   POST /questionnaire {logement_id, qui, ref_resa, arrivee, reponses, optins, hash?}
#     -> P6-14 : dépôt 1-tap HUMAIN (qui auto -> 400), ref_resa slug seule
#     (traversée bloquée -> 400), nb voyageurs <= occupants_max copro (sinon
#     400), températures bornées Versatile (chauffage clampé 21 °C max),
#     extras = ids socle seuls (prix jamais ici, extras seul fait foi),
#     cut-off J-1 18h : extras hors délai = statut cutoff_depasse (proposer sur
#     place), jamais de refus global (ne bloque jamais l'accès). Réponse M2
#     « On a compris : … Corriger ? » + suggestions M3 (max 3, filtre
#     allergènes, opt-in requis sinon génériques) + opt-in mémoire -> fiche
#     §5.7-quater (si `memoire_voyageur: off` : séjour seul, non persisté).
#     201 créé / 200 mis à jour (même ref = correction 1-tap).
#   GET  /contrat?logement_id=log1&ref_resa=<slug>
#     -> P6-15 : statut contrat PWA 30 s (§12.5-bis) : non_signe (signature
#     manquante, questionnaire_accepte indicatif) ou signe (horodatage +
#     opt-ins + code_retour si `crm_retour: on`). 404 logement inconnu,
#     400 sans ref_resa. Jamais de signature/hash en sortie.
#   POST /contrat {logement_id, qui, ref_resa, nom_voyageur, signature,
#     accepte_cgv, optins{optin_memoire, optin_geoloc, optin_crm_retour}, hash?}
#     -> P6-15 : signature tactile 1-tap HUMAIN (qui auto -> 400), ref_resa
#     slug seule (traversée -> 400), accepte_cgv true exigé (sinon 422
#     cgv_requise), signature tactile >=8 exigée (sinon 422
#     signature_requise, sha256 + longueur seuls stockés, raw jamais persisté
#     ni loggé). 201 créé / 200 re-signé (même ref = mise à jour horodatée).
#     PDF horodaté runtime `contrats/logX/<ref>_contrat.pdf` (box
#     /config/contrats/, gitignoré) référencé, preuve opposable = horodatage
#     + hash signature. Opt-ins : mémoire -> fiche §5.7-quater (si
#     `memoire_voyageur: off` : séjour seul) ; géoloc -> séjour seul,
#     révocation checkout (box) ; CRM -> code -10 % direct seul si
#     `crm_retour: on` (sinon stocké sans code, jamais d'effet prix auto
#     art. 225-1). J-2 direct sans contrat = pin_autorise False indicatif
#     (jamais bloquant, comme questionnaire).
#   GET  /avis?logement_id=log1&ref_resa=<slug>
#     -> P6-17 : statut enquête J+1 (§5.7-bis) : non_repondue (échelle 1-5)
#     ou repondue/rattrapage (note + routage lien_public/rattrapage_prive +
#     geste + todo correctif). 404 logement inconnu, 400 sans ref_resa.
#     Jamais bloquant.
#   POST /avis {logement_id, qui, ref_resa, note 1-5, commentaire?, langue?}
#     -> P6-17 : dépôt 1-tap HUMAIN (qui auto -> 400), ref_resa slug seule
#     (traversée -> 400), note entière 1-5 (sinon 400). 201 créé / 200
#     corrigé. Routage : note>=4 -> lien_public (timing optimal) ;
#     note==3 -> rattrapage_prive + geste auto late_gratuite (<=20 €) ;
#     note<=2 -> rattrapage_prive + geste à valider humain (422 non, 200
#     rattrapage_validation_requise + geste_propose). Todo correctif
#     ménage/technique par mots-clés (jamais de sanction auto).
#   POST /avis-geste {logement_id, qui, ref_resa, geste, montant_eur?}
#     -> P6-17 : validation 1-tap HUMAINE du geste (qui auto -> 400),
#     geste in {late_gratuite, moins_10_direct, remboursement_partiel} ;
#     montant>20 € -> alerte loggée (la validation humaine elle-même fait
#     foi). 404 si enquête absente.
#   POST /avis-reponse {logement_id, qui, ref_resa, action: brouillon|valider,
#     texte?} -> P6-17 : pré-réponse IA 1-tap (brouillon déterministe ton
#     hôte depuis gabarit + note/langue, ou texte humain scanné : promesse
#     détectée -> 422, jamais forcée) puis validation humaine (publication
#     manuelle box, jamais auto).
#   GET  /scenes?logement_id=log1 -> P6-17 : 3 scènes 1-tap PWA
#     (arrivee/depart/nuit_calme + actions, lecture seule).
#   POST /scene {logement_id, qui, ref_resa?, scene} -> P6-17 : activation
#     1-tap HUMAIN (log décision + actions indicatives, box exécute via HA ;
#     jamais bloquant, scene inconnue -> 400).
#   GET  /acces?qui=<id> -> P6-20 : audit 5 rôles (comptes nominatifs,
#     MFA exigée/active, expiry, révocations, doublons ; réservé
#     super_admin/admin). Jamais de secrets.
#   POST /acces-revoquer {qui, personne_id, motif?} -> P6-20 : révocation
#     1-tap super_admin/admin (jamais soi-même, jamais super_admin,
#     idempotent ; runtime acces-revocations.json, gitignoré).
#   POST /acces-reactiver {qui, personne_id} -> P6-20 : levée de
#     révocation (expire_le passé = reste expiré, éditer acces.yaml).
#   GET  /journal?logement_id=log1&qui=<id>[&quoi=acces][&jours=90] ->
#     P6-20 : qui/quand/quoi 90 j (etat_lecture + périmètre, cap 200,
#     anti-chronologique, jamais de PIN).
#   POST /decision {logement_id, ref, qui, quoi, canal?, montant?, motif?, llm?, jev?}
#     -> vérifie RBAC + bornes + hors_bornes Jev, log JSONL (bloqué si refusé, loggé aussi)
#   GET  /health -> {"ok": true}
#
# Usage : python3 decision.py --config config.yaml --logements ../logements.yaml --acces ../acces.yaml
#   --check : vérifie copro + pousse sensor.logX_config_ok (rouge si false) + affiche état.
#   --serve : démarre l'API HTTP.
#   env : LCD_SECRETS_YAML, LCD_HA_URL/TOKEN, LCD_ICS_SYNC_URL, LCD_PRICING_URL, LCD_HTTP_PORT.

import argparse
import base64
import datetime as dt
import hashlib
import hmac
import json
import os
import re
import sys
import time
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
    # Compte machine dashboard hôte (LAN seul, P2-9) : scripts HA
    # (renvoi J-2/J-1, forçage stop-sell) via rest_command. Moindre
    # privilège (jamais menage_cloture/prix/config), tracé au journal
    # (qui=dashboard_hote), jamais de MFA simulée (hors MFA_EXIGEE).
    ("gestionnaire", "dashboard"): {"etat_lecture", "event_envoi",
                                    "forcage_stop_sell"},
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


def forger_jeton_ha(duree_s=900):
    """Jeton d'accès HA : Bearer secrets.yaml (box, prioritaire, jamais
    CHANGER) ou JWT lab forgé (box virtuelle : LCD_HA_REFRESH_ID +
    LCD_HA_JWT_KEY, HS256 iss = refresh id). "" si non configuré
    (jamais d'appel aveugle, jamais de WAN)."""
    rid = os.environ.get("LCD_HA_REFRESH_ID", "")
    key = os.environ.get("LCD_HA_JWT_KEY", "")
    if not (rid and key):
        return ""
    now = int(time.time())

    def _b64(obj):
        return base64.urlsafe_b64encode(json.dumps(obj).encode()).rstrip(
            b"=").decode()
    head = _b64({"alg": "HS256", "typ": "JWT"})
    pay = _b64({"iss": rid, "iat": now, "exp": now + duree_s})
    sig = base64.urlsafe_b64encode(hmac.new(
        key.encode(), (head + "." + pay).encode(),
        hashlib.sha256).digest()).rstrip(b"=").decode()
    return head + "." + pay + "." + sig


# P6-12 §5.7-quater : mémoire voyageur. Opt-in séjour seul (geste HUMAIN
# 1-tap, qui != auto/llm/jev/moteur-*), jamais de discrimination tarifaire
# (art.225-1 : aucun effet prix), jamais de CSI brut (hash sha256 seul),
# purge 24 mois (dernier_sejour > 730 j), présence 90 j = logs JSONL.
# Registre : custom/memoire/voyageurs.yaml (box) / voyageurs.lab.yaml (lab RW,
# monté comme inventaire/stocks lab, reset via `git checkout -- memoire.lab`).
# Format : liste `- hash: "<hex64>"` + champs scalaires (opt_in, opt_in_le,
# dernier_sejour AAAA-MM-JJ, langue socle, consignes, extras_favoris CSV).
MEMOIRE_CHAMPS = ("opt_in", "opt_in_le", "dernier_sejour", "langue",
                  "consignes", "extras_favoris",
                  # P6-13 : prefs ménage intermédiaire §5.6 (§5.7-quater).
                  "menage_frequence_j", "menage_heure_pref",
                  "menage_pendant_absence")
QUI_AUTO_MEMOIRE = ("auto", "llm", "jev", "moteur-direct",
                    "moteur-dispatch", "moteur-caution", "")


# P6-14 §5.7-quinquies : questionnaire pré-arrivée J-2. 1 lien PWA+PIN, 3 min,
# tout pré-rempli si voyageur reconnu (§5.7-quater), 4 blocs (arrivée /
# préférences / extras / contrat+opt-ins), cut-off extras J-1 18h, rappel
# ciblé J-1 15h, jamais bloquant (sans réponse = kit standard + défaut).
# GET /questionnaire : schéma + pré-rempli mémoire (hash) + complétude J1
# (ref_resa : état + blocs manquants + risque friction + relance).
# POST /questionnaire : dépôt 1-tap HUMAIN (qui auto -> 400), ref_resa slug
# seule (traversée bloquée -> 400), 201 créé / 200 mis à jour (correction).
# Stockage : `questionnaire-<logX>.json` dans decision_log_dir (volume
# decision-state, runtime gitignoré comme decision.logX.jsonl, jamais commité).
QUESTIONNAIRE_BLOCS = ("arrivee", "preferences", "extras", "contrat")
# M2 : champs libres normalisés -> input_* (LLM :4000 hors moteur ; ici
# extraction déterministe + « On a compris : … Corriger ? » 1-tap avant
# écriture). Validation voyageur obligatoire (a_corriger_1tap).
QUESTIONNAIRE_CHAMPS_M2 = ("heure_arrivee", "nb_voyageurs", "vol",
                           "temp_chauffage", "temp_clim", "allergies",
                           "consignes")
# Schéma des 4 blocs (champs attendus ; extras = ids catalogue socle,
# contrat = CGV 1-tap P6-15 + opt-ins). Si `memoire_voyageur: off` : blocs
# 1+3+4 seuls (choix valables séjour courant, jamais persistés).
QUESTIONNAIRE_SCHEMA_BLOCS = {
    "arrivee": ("heure_arrivee", "vol", "nb_voyageurs", "consigne_bagages",
                "parking"),
    "preferences": ("langue", "temp_chauffage", "temp_clim",
                    "pack_teletravail", "kit_bebe", "kit_plage",
                    "menage_frequence_j", "menage_heure_pref",
                    "menage_pendant_absence", "gouts_kit", "allergies",
                    "courses_type", "petit_dej", "consignes"),
    "extras": ("extra_ids",),
    "contrat": ("accepte_cgv", "optin_memoire", "optin_geoloc",
                "optin_crm_retour"),
}
REF_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_.-]*$")
QUI_AUTO_QUESTIONNAIRE = QUI_AUTO_MEMOIRE
TEMP_CHAUFFAGE_MAX = 21.0  # Versatile §5.7-quater : jamais >21 °C forcé
QUESTIONNAIRE_CUTOFF_J_MOINS = 1  # cut-off extras J-1 18h (§5.6-ter)
QUESTIONNAIRE_CUTOFF_HEURE = 18
# M3 : suggestions génériques (opt-in mémoire absent : pas de fiche goûts).
# Ids socle catalogue, prix JAMAIS ici (extras seul fait foi, art. 225-1).
QUESTIONNAIRE_SUGGESTIONS_GENERIQUES = ("kit_bienvenue_offert", "petit_dej",
                                        "transfert_aeroport")

# P6-15 §12.5-bis : contrat voyageur PWA 30 s + signature tactile + opt-ins
# (mémoire, géoloc, CRM retour −10 % direct si `crm_retour: on`).
# Lien J-2 + QR accueil -> CGV 1 page (contrat_pwa.md) + case + tactile ->
# PDF horodaté `/config/contrats/logX/<ref>.pdf` (RUNTIME box, gitignoré,
# généré par facturation :8093 sur box ; ici preuve horodatée + référence).
# Direct : contrat signé EXIGÉ avant envoi PIN (signalé pin_autorise False,
# jamais bloquant comme questionnaire — le durcissement KeyMaster est box
# Phase 8). OTA : règlement via messagerie plateforme déjà traçé (indicatif).
# Stockage : `contrat-<logX>.json` dans decision_log_dir (volume
# decision-state, runtime gitignoré comme questionnaire-<logX>.json).
# Réponses SÛRES : jamais signature raw ni hash en sortie (sha256 + longueur
# seuls stockés, jamais loggés en clair).
QUI_AUTO_CONTRAT = QUI_AUTO_MEMOIRE
CONTRAT_SIGNATURE_MIN = 8  # tactile base64 PNG >> 8 ; "signe" PWA >= 8 évite vide
CONTRAT_OPTINS = ("optin_memoire", "optin_geoloc", "optin_crm_retour")

# P6-17 §5.7-bis : boucle avis (enquête J+1 + pré-réponse 1-tap + scènes).
# J+1 checkout -> note 1-5 privée + commentaire -> >=4★ lien public (timing
# optimal, note protégée) ; <4★ rattrapage privé (excuse + geste calibré,
# validation humaine 1-tap si >20 €) + todo correctif ménage/technique par
# mots-clés (jamais de sanction auto). Pré-réponse : brouillon déterministe
# ton hôte (LLM :4000 hors moteur sur box ; ici gabarit + note/langue) +
# validation 1-tap, publication manuelle box jamais auto. Scènes PWA :
# Arrivée (Confort+ECS+WiFi), Départ (checklist+Eco+révocation annoncée),
# Nuit calme (Eco+rappel 22h-8h) — box exécute via HA, ici log indicatif.
# Stockage : `avis-<logX>.json` dans decision_log_dir (volume
# decision-state, runtime gitignoré comme questionnaire/contrat).
QUI_AUTO_AVIS = QUI_AUTO_MEMOIRE
AVIS_SEUIL_PUBLIC = 4  # >=4★ lien public, <4★ rattrapage privé
AVIS_MONTANT_VALIDATION = 20  # geste >20 € -> alerte (validation humaine fait foi)
AVIS_GESTES = ("late_gratuite", "moins_10_direct", "remboursement_partiel")
AVIS_MOTS_MENAGE = ("menage", "ménage", "propre", "sale", "draps", "poussiere",
                    "poussière")
AVIS_MOTS_TECHNIQUE = ("panne", "casse", "cassé", "clim", "chauffage", "bruit",
                        "eau", "fuite", "wifi", "chaudiere", "chaudière")
# Promesses interdites en pré-réponse auto (garde-fou Jev, jamais forcées ;
# texte humain les contenant -> 422, reformulation exigée).
AVIS_PROMESSES = ("remboursement", "rembourse", "gratuit", "dedommagement",
                  "dédommagement", "indemnit", "compens")
SCENES = {
    "arrivee": ("confort_19", "ecs_relance", "wifi_affiche"),
    "depart": ("checklist_zero_friction", "eco_16", "revocation_annoncee"),
    "nuit_calme": ("eco_16", "rappel_22h_8h"),
}


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
    lignes = ["# custom/memoire/voyageurs.yaml — registre opt-in (P6-12 §5.7-quater).",
              "# Hash seul, jamais de CSI brut. Purge 24 mois. Écrit par geste humain.",
              "voyageurs:"]
    for h in sorted(fiches):
        lignes.append(f"  - hash: \"{h}\"")
        for k in MEMOIRE_CHAMPS:
            if fiches[h].get(k) not in (None, ""):
                lignes.append(f"    {k}: \"{fiches[h][k]}\"")
    tmp = str(path) + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write("\n".join(lignes) + "\n")
    os.replace(tmp, path)


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
    section = None  # pricing | copro | features | menage | None
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
                          "surface_m2": "", "capacite": "",
                          "fetes_interdites": True,
                          "menage_montant": "", "menage_facturation": "",
                          "copro_verifiee": False, "features": {}}
            section = None
            continue
        if cur is None:
            continue
        if indent == 4 and prop in ("pricing:", "copro:", "features:",
                                    "menage:"):
            section = prop[:-1]
            continue
        if indent == 4 and prop.endswith(":"):
            section = None  # menage:, autres blocs
            continue
        if indent == 4 and not section and ":" in prop:
            # Identité statique logement (nom, commune, surface, capacité —
            # sert les defaults J-2/J-1/J+1 + mentions annonce P6-21).
            k_id, v_id = [x.strip().strip("\"'") for x in prop.split(":", 1)]
            if k_id in ("nom", "commune", "surface_m2",
                        "capacite") and v_id:
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
                elif k == "fetes":
                    # fetes: false (plan) = fêtes interdites = true.
                    logts[cur]["fetes_interdites"] = (v != "true")
            elif section == "menage":
                # P6-21 : supplément voyageur (§12.2-ter).
                if k == "montant" and v:
                    logts[cur]["menage_montant"] = v
                elif k == "facturation" and v:
                    logts[cur]["menage_facturation"] = v
            elif section == "features":
                logts[cur]["features"][k] = (v == "true")
    return logts


def lire_acces(path):
    """Extrait personnes : id, role, sous_role, logements, expire_le, mfa.

    Parseur minimal. Retourne (personnes, doublons) : les `- id:` répétés
    sont signalés (1 compte nominatif/personne, jamais de partage sauf
    `guest` kiosk). `mfa: true` = 2FA active vérifiée sur la box HA
    (exigée super_admin/admin/gestionnaire, P6-20)."""
    try:
        with open(path, encoding="utf-8") as f:
            lignes = f.readlines()
    except FileNotFoundError:
        return {}, []
    pers = {}
    doublons = []
    cur = None
    for brute in lignes:
        ligne = brute.split("#", 1)[0].rstrip("\n")
        if not ligne.strip():
            continue
        indent = len(ligne) - len(ligne.lstrip(" "))
        prop = ligne.strip()
        if indent == 2 and prop.startswith("- id:"):
            cur = prop.split(":", 1)[1].strip().strip("\"'")
            if cur in pers:
                doublons.append(cur)
            pers[cur] = {"role": "", "sous_role": "", "logements": [],
                         "expire_le": None, "mfa": False}
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
            elif k == "mfa":
                pers[cur][k] = v in ("true", "1", "oui", "yes", True)
    return pers, sorted(set(doublons))


# P6-20 §1.6 : 2FA obligatoire super_admin/admin/gestionnaire (tous
# sous-rôles). Vérifiée sur la box HA ; `mfa: true` dans acces.yaml une
# fois activée (re-check vert). Voyageur/presta/proprio : session PWA
# durée séjour/mission, jamais d'accès HA direct.
MFA_EXIGEE = {("super_admin", "super_admin"), ("super_admin", "admin"),
              ("gestionnaire", "operateur"), ("gestionnaire", "comptable"),
              ("gestionnaire", "support")}
QUI_AUTO_ACCES = QUI_AUTO_MEMOIRE
JOURNAL_MAX_J = 90
JOURNAL_MAX_LIGNES = 200

# P6-21 §12.5-bis : carnet preuve tranquillité + lettre syndic + registre
# RGPD + mentions annonce. Dossier `/config/preuves/logX/<trimestre>/`
# (box ; ici `preuves-<logX>.json` runtime gitignoré) : dB seuls (jamais
# d'audio, jamais chambres/SDB), messages 22h-8h, interventions Alarmo,
# attestations ménage -> courrier chiffré (humain envoie via messagerie
# tracée). Conservation 1 an, accès hôte seul (super_admin + gestionnaire
# opérationnel/support — jamais voyageur/presta/proprio/comptable).
SEUIL_BRUIT_JOUR = 75  # dB, 8h-22h (§5.9 : 75 dB jour / 10 min)
SEUIL_BRUIT_NUIT = 60  # dB, 22h-8h (§5.9 : 60 dB nuit / 5 min)
HEURES_CALMES_DEBUT = 22
HEURES_CALMES_FIN = 8
ATTESTATION_TYPES = ("intervention", "menage", "message_rappel")
TRIMESTRE_RE = re.compile(r"^\d{4}-T[1-4]$")
PREUVE_CONSERVATION_J = 365

# P7-6 §6.7 : seuils transverses LLM/Jev en code (consultatifs seuls).
# noul>0,8 + confidence>0,75 -> auto borné (sinon dashboard) ;
# confidence<0,7 -> jamais d'auto ; hors_bornes>0,5 -> blocage.
# Garde-fou inviolable : jamais de tool-calling serrure/vanne/portail,
# jamais de génération PIN/ouverture (KeyMaster + Nuki Hub seuls) — même
# avec des scores parfaits, ces actions sont BLOQUÉES ici (403).
SEUIL_NOUL_AUTO = 0.8
SEUIL_CONFIDENCE_AUTO = 0.75
SEUIL_CONFIDENCE_MIN = 0.7
SEUIL_HORS_BORNES_BLOCAGE = 0.5
# Actions physiques interdites au pipeline LLM/Jev (consultatif seul).
OUTILS_INTERDITS = ("serrure", "vanne", "portail", "ouverture", "pin",
                    "alarme_off")


class Moteur:
    def __init__(self, cfg, logts, acces, secrets, branding=None,
                 memoire_path="", acces_doublons=None):
        self.cfg = cfg
        self.logts = logts
        self.acces = acces
        self.acces_doublons = list(acces_doublons or [])
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
    def _lire_revocations(self):
        try:
            with open(os.path.join(self.decision_dir,
                                   "acces-revocations.json"),
                      encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except (FileNotFoundError, ValueError):
            return {}

    def _sauver_revocations(self, revoc):
        chemin = os.path.join(self.decision_dir, "acces-revocations.json")
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(revoc, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, chemin)

    def autoriser(self, qui_id, action, logement_id):
        p = self.acces.get(qui_id)
        if not p:
            return False, f"qui inconnu: {qui_id}", None
        # P6-20 : révocation (runtime acces-revocations.json, gitignoré —
        # box : acces.yaml éditable, lab : montée ro) puis expiry.
        rev = self._lire_revocations().get(qui_id)
        if rev:
            return False, (f"compte révoqué le {rev.get('revoque_le')} "
                            f"({rev.get('motif', 'motif non précisé')})"), p
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

    # --- P6-20 §1.6 : audit comptes + révocation + journal 90 j ---
    @staticmethod
    def _statut_compte(pid, p, revoc):
        if pid in revoc:
            return "revoque"
        if p.get("expire_le"):
            try:
                if dt.date.fromisoformat(p["expire_le"]) < dt.date.today():
                    return "expire"
            except ValueError:
                pass
        return "actif"

    def acces_audit(self, qui_id):
        """GET /acces : audit 5 rôles (1 compte nominatif/personne, MFA,
        expiry, révocations, doublons). Réservé super_admin/admin
        (action config_modif). Jamais de secrets (aucun ici)."""
        ok, msg, _ = self.autoriser(qui_id, "config_modif", "")
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        revoc = self._lire_revocations()
        personnes, sans_mfa, expires, revoques = [], [], [], []
        for pid in sorted(self.acces):
            p = self.acces[pid]
            statut = self._statut_compte(pid, p, revoc)
            mfa_exigee = (p.get("role"), p.get("sous_role")) in MFA_EXIGEE
            personnes.append({"id": pid, "role": p.get("role"),
                              "sous_role": p.get("sous_role"),
                              "logements": p.get("logements", []),
                              "expire_le": p.get("expire_le"),
                              "mfa_exigee": mfa_exigee,
                              "mfa_active": bool(p.get("mfa")),
                              "statut": statut})
            if mfa_exigee and not p.get("mfa"):
                sans_mfa.append(pid)
            if statut == "expire":
                expires.append(pid)
            if statut == "revoque":
                revoques.append(pid)
        return 200, {"personnes": personnes,
                     "total": len(personnes),
                     "alertes": {"sans_mfa": sans_mfa, "expires": expires,
                                 "revoques": revoques,
                                 "doublons": list(self.acces_doublons)}}

    def acces_revoquer(self, qui_id, personne_id, motif=""):
        """POST /acces-revoquer : 1-tap super_admin/admin (config_modif).
        Jamais soi-même, jamais super_admin (compte protégé). Idempotent.
        Voyageur = pas de compte nominatif (PWA séjour) : rien à révoquer."""
        ok, msg, _ = self.autoriser(qui_id, "config_modif", "")
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        pid = str(personne_id or "").strip()
        if pid == qui_id:
            return 403, {"statut": "bloque",
                         "motif": "auto-révocation interdite"}
        p = self.acces.get(pid)
        if not p:
            return 404, {"erreur": f"personne inconnue: {pid}"}
        if (p.get("role"), p.get("sous_role")) == ("super_admin",
                                                   "super_admin"):
            return 403, {"statut": "bloque",
                         "motif": "compte super_admin protégé"}
        revoc = self._lire_revocations()
        if pid in revoc:
            return 200, {"statut": "deja_revoque", "personne_id": pid}
        revoc[pid] = {"revoque_le": dt.date.today().isoformat(),
                      "par": qui_id,
                      "motif": str(motif or "").strip()[:200]}
        self._sauver_revocations(revoc)
        scope = (p.get("logements") or [""])[0]
        if scope:
            self.log_decision(scope, f"acces-{pid}", qui_id, "acces", None,
                              None,
                              f"compte révoqué ({p.get('role')}/"
                              f"{p.get('sous_role')})")
        return 200, {"statut": "revoque", "personne_id": pid}

    def acces_reactiver(self, qui_id, personne_id):
        """POST /acces-reactiver : lève la révocation (1-tap
        super_admin/admin). Si expire_le passé : reste expiré (éditer
        acces.yaml sur box)."""
        ok, msg, _ = self.autoriser(qui_id, "config_modif", "")
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        pid = str(personne_id or "").strip()
        p = self.acces.get(pid)
        if not p:
            return 404, {"erreur": f"personne inconnue: {pid}"}
        revoc = self._lire_revocations()
        if pid not in revoc:
            return 200, {"statut": "deja_actif", "personne_id": pid}
        del revoc[pid]
        self._sauver_revocations(revoc)
        expire = False
        if p.get("expire_le"):
            try:
                expire = dt.date.fromisoformat(p["expire_le"]) \
                    < dt.date.today()
            except ValueError:
                pass
        scope = (p.get("logements") or [""])[0]
        if scope:
            self.log_decision(scope, f"acces-{pid}", qui_id, "acces", None,
                              None,
                              "compte réactivé"
                              + (" (reste expiré : éditer acces.yaml)"
                                 if expire else ""))
        return 200, {"statut": "reactive", "personne_id": pid,
                     "compte_expire": expire}

    def journal(self, logement_id, qui_id, quoi="", jours=90,
                  backend="", alias="", langue=""):
        """GET /journal : qui/quand/quoi 90 j (decision.logX.jsonl, tagué
        rôle). Lecture filtrée etat_lecture + périmètre. Filtres dashboard
        P7-7 : backend Jev (jev.backend), alias LLM (llm.alias), langue
        voyageur. Cap 200 lignes, ordre anti-chronologique. Jamais de PIN
        (jamais loggé en clair)."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ok, msg, _ = self.autoriser(qui_id, "etat_lecture", logement_id)
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        try:
            jours_i = int(float(str(jours)))
        except (TypeError, ValueError):
            return 400, {"erreur": "jours entier 1-90"}
        if jours_i < 1 or jours_i > JOURNAL_MAX_J:
            return 400, {"erreur": "jours entier 1-90"}
        cutoff = (dt.datetime.now(dt.timezone.utc)
                  - dt.timedelta(days=jours_i))
        # Filtres dashboard P7-7 (vides = sans filtre).
        f_backend = str(backend or "").strip().lower()
        f_alias = str(alias or "").strip().lower()
        f_langue = str(langue or "").lower()[:2]
        entrees = []
        try:
            with open(os.path.join(self.decision_dir,
                                   f"decision.{logement_id}.jsonl"),
                      encoding="utf-8") as f:
                for ligne in f:
                    ligne = ligne.strip()
                    if not ligne:
                        continue
                    try:
                        e = json.loads(ligne)
                    except ValueError:
                        continue
                    try:
                        ts = dt.datetime.fromisoformat(
                            str(e.get("ts", "")).replace("Z", "+00:00"))
                        if ts.tzinfo is None:
                            ts = ts.replace(tzinfo=dt.timezone.utc)
                    except ValueError:
                        continue
                    if ts < cutoff:
                        continue
                    if quoi and e.get("quoi") != quoi:
                        continue
                    if f_backend and str(
                            (e.get("jev") or {}).get(
                                "backend", "")).lower() != f_backend:
                        continue
                    if f_alias and str(
                            (e.get("llm") or {}).get(
                                "alias", "")).lower() != f_alias:
                        continue
                    if f_langue and str(
                            e.get("langue", "")).lower() != f_langue:
                        continue
                    entrees.append(e)
        except FileNotFoundError:
            pass
        entrees.sort(key=lambda e: str(e.get("ts", "")), reverse=True)
        return 200, {"logement_id": logement_id, "jours": jours_i,
                     "entrees": entrees[:JOURNAL_MAX_LIGNES],
                     "total": len(entrees)}

    # --- P6-21 §12.5-bis : carnet preuve tranquillité + lettre syndic ---
    def _hote_seul(self, qui_id, logement_id):
        """Accès hôte seul (preuves litige, 1 an) : super_admin + gestionnaire
        opérationnel/support. Jamais voyageur/presta/proprio/comptable."""
        p = self.acces.get(qui_id)
        if not p:
            return False, "qui inconnu"
        if (p.get("role"), p.get("sous_role")) not in (
                ("super_admin", "super_admin"), ("super_admin", "admin"),
                ("gestionnaire", "operateur"), ("gestionnaire", "support")):
            return False, "accès hôte seul (preuves litige, jamais diffusées)"
        if logement_id and logement_id not in p.get("logements", []):
            return False, f"hors périmètre : {qui_id}"
        return True, f"{p.get('role')}/{p.get('sous_role')}"

    @staticmethod
    def _trimestre_courant():
        auj = dt.date.today()
        return f"{auj.year}-T{(auj.month - 1) // 3 + 1}"

    def _lire_preuves(self, logement_id):
        try:
            with open(os.path.join(self.decision_dir,
                                   f"preuves-{logement_id}.json"),
                      encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict):
                data.setdefault("releves", [])
                data.setdefault("attestations", [])
                return data
        except (FileNotFoundError, ValueError):
            pass
        return {"releves": [], "attestations": []}

    def _sauver_preuves(self, logement_id, carnet):
        chemin = os.path.join(self.decision_dir, f"preuves-{logement_id}.json")
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(carnet, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, chemin)

    @staticmethod
    def _est_nuit(heure_iso):
        """Heures calmes 22h-8h (§12.1 log1)."""
        try:
            h = dt.datetime.fromisoformat(
                str(heure_iso).replace("Z", "+00:00")).hour
        except ValueError:
            return False
        return h >= HEURES_CALMES_DEBUT or h < HEURES_CALMES_FIN

    def _synthese_trimestre(self, carnet, trimestre):
        rel = [r for r in carnet.get("releves", [])
               if str(r.get("trimestre", "")) == trimestre]
        att = [a for a in carnet.get("attestations", [])
               if str(a.get("trimestre", "")) == trimestre]
        dep_jour = sorted((r for r in rel
                           if not r.get("nuit")
                           and r.get("db", 0) > SEUIL_BRUIT_JOUR),
                          key=lambda r: r.get("db", 0), reverse=True)
        dep_nuit = sorted((r for r in rel
                           if r.get("nuit")
                           and r.get("db", 0) > SEUIL_BRUIT_NUIT),
                          key=lambda r: r.get("db", 0), reverse=True)
        max_db = max([r.get("db", 0) for r in rel] + [0])
        par_type = {}
        for a in att:
            par_type[a.get("type", "?")] = par_type.get(
                a.get("type", "?"), 0) + 1
        return {"trimestre": trimestre, "releves": len(rel),
                "max_db": max_db,
                "depassements_jour": [{"db": r["db"], "heure": r["heure"]}
                                      for r in dep_jour],
                "depassements_nuit": [{"db": r["db"], "heure": r["heure"]}
                                      for r in dep_nuit],
                "aucun_depassement": not (dep_jour or dep_nuit),
                "attestations": len(att),
                "attestations_par_type": par_type}

    # --- POST /preuve-db : relevé dB seul (jamais d'audio) ---
    def preuve_db(self, logement_id, qui, db, heure="", occupation=""):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui or str(qui).strip().lower() in QUI_AUTO_ACCES:
            return 400, {"erreur": "relevé = capteur/humain "
                                   "(qui != auto/llm/jev)"}
        try:
            db_f = float(str(db))
        except (TypeError, ValueError):
            return 400, {"erreur": "db (dB seuls, jamais d'audio) requis"}
        if not (0 <= db_f <= 120):
            return 400, {"erreur": "db entre 0 et 120 (dB seuls)"}
        try:
            mom = dt.datetime.fromisoformat(
                str(heure or "").strip().replace("Z", "+00:00")) \
                if str(heure or "").strip() else \
                dt.datetime.now(dt.timezone.utc)
            if mom.tzinfo is None:
                mom = mom.replace(tzinfo=dt.timezone.utc)
        except ValueError:
            return 400, {"erreur": "heure ISO AAAA-MM-JJTHH:MM"}
        heure_iso = mom.isoformat(timespec="seconds")
        trimestre = f"{mom.year}-T{(mom.month - 1) // 3 + 1}"
        nuit = self._est_nuit(heure_iso)
        seuil = SEUIL_BRUIT_NUIT if nuit else SEUIL_BRUIT_JOUR
        carnet = self._lire_preuves(logement_id)
        carnet["releves"].append({"db": round(db_f, 1), "heure": heure_iso,
                                  "trimestre": trimestre, "nuit": nuit,
                                  "occupation": str(occupation or "")[:40],
                                  "par": qui})
        self._sauver_preuves(logement_id, carnet)
        self.log_decision(logement_id, f"preuve-{trimestre}", qui, "acces",
                          None, None,
                          f"relevé dB {db_f} ({'nuit' if nuit else 'jour'})")
        return 201, {"logement_id": logement_id, "db": round(db_f, 1),
                     "heure": heure_iso, "trimestre": trimestre,
                     "nuit": nuit, "depasse": db_f > seuil,
                     "seuil": seuil}

    # --- POST /preuve-attestation : intervention/ménage/message ---
    def preuve_attestation(self, logement_id, qui, type_attestation,
                           ref="", detail=""):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui or str(qui).strip().lower() in QUI_AUTO_ACCES:
            return 400, {"erreur": "attestation = geste HUMAIN "
                                   "(qui != auto/llm/jev)"}
        typ = str(type_attestation or "").strip().lower()
        if typ not in ATTESTATION_TYPES:
            return 400, {"erreur": "type parmi : "
                                   + ", ".join(ATTESTATION_TYPES)}
        ref = str(ref or "").strip()
        if ref and (not REF_RE.fullmatch(ref) or ".." in ref):
            return 400, {"erreur": "ref slug seule (traversée bloquée)"}
        carnet = self._lire_preuves(logement_id)
        carnet["attestations"].append(
            {"type": typ, "ref": ref,
             "detail": str(detail or "")[:500],
             "trimestre": self._trimestre_courant(),
             "par": qui, "le": utcnow_iso()})
        self._sauver_preuves(logement_id, carnet)
        self.log_decision(logement_id, ref or f"preuve-{typ}", qui, "acces",
                          None, None, f"attestation {typ} versée au carnet")
        return 201, {"logement_id": logement_id, "type": typ,
                     "trimestre": self._trimestre_courant()}

    # --- GET /carnet : synthèse trimestre (hôte seul) ---
    def carnet(self, logement_id, qui, trimestre=""):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ok, msg = self._hote_seul(qui, logement_id)
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        trim = str(trimestre or "").strip() or self._trimestre_courant()
        if not TRIMESTRE_RE.fullmatch(trim):
            return 400, {"erreur": "trimestre AAAA-Tn (n = 1-4)"}
        synth = self._synthese_trimestre(self._lire_preuves(logement_id),
                                         trim)
        return 200, {"logement_id": logement_id, **synth,
                     "conservation_j": PREUVE_CONSERVATION_J,
                     "jamais_audio": True}

    # --- POST /lettre-tranquillite : brouillon chiffré (humain envoie) ---
    def lettre_tranquillite(self, logement_id, qui, trimestre="",
                            destinataire="syndic"):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ok, msg = self._hote_seul(qui, logement_id)
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        trim = str(trimestre or "").strip() or self._trimestre_courant()
        if not TRIMESTRE_RE.fullmatch(trim):
            return 400, {"erreur": "trimestre AAAA-Tn (n = 1-4)"}
        dest = str(destinataire or "syndic").strip().lower()[:20] or "syndic"
        synth = self._synthese_trimestre(self._lire_preuves(logement_id),
                                         trim)
        log = self.logts.get(logement_id, {})
        if synth["aucun_depassement"]:
            corps = (f"Trimestre {trim} — {log.get('nom', logement_id)} : "
                     f"aucun dépassement ({synth['releves']} relevés dB, "
                     f"max {synth['max_db']} dB) ; "
                     f"{synth['attestations']} attestation(s) au dossier.")
        else:
            tot_dep = (len(synth["depassements_jour"])
                       + len(synth["depassements_nuit"]))
            corps = (f"Trimestre {trim} — {log.get('nom', logement_id)} : "
                     f"{tot_dep} dépassement(s) (max {synth['max_db']} dB), "
                     f"rappels + interventions tracés, "
                     f"{synth['attestations']} attestation(s) au dossier.")
        try:
            with open(os.path.join(self.decision_dir,
                                   f"lettres-{logement_id}.json"),
                      encoding="utf-8") as f:
                lettres = json.load(f)
            lettres = lettres if isinstance(lettres, dict) else {}
        except (FileNotFoundError, ValueError):
            lettres = {}
        lettres[trim] = {"statut": "brouillon", "destinataire": dest,
                         "texte": corps,
                         "chiffres": {"releves": synth["releves"],
                                      "max_db": synth["max_db"],
                                      "depassements": len(
                                          synth["depassements_jour"])
                                      + len(synth["depassements_nuit"]),
                                      "attestations": synth[
                                          "attestations"]},
                         "redige_le": utcnow_iso(), "redige_par": qui}
        chemin = os.path.join(self.decision_dir,
                                f"lettres-{logement_id}.json")
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(lettres, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, chemin)
        self.log_decision(logement_id, f"lettre-{trim}", qui, "acces",
                          None, None,
                          f"lettre tranquillité brouillon ({dest})")
        return 201, {"statut": "brouillon", "logement_id": logement_id,
                     "trimestre": trim, "destinataire": dest,
                     "longueur": len(corps),
                     "rappel": "humain envoie via messagerie tracée "
                               "(POST /lettre-envoyer)"}

    # --- POST /lettre-envoyer : 1-tap humain (messagerie tracée) ---
    def lettre_envoyer(self, logement_id, qui, trimestre="", canal=""):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ok, msg = self._hote_seul(qui, logement_id)
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        trim = str(trimestre or "").strip() or self._trimestre_courant()
        if not TRIMESTRE_RE.fullmatch(trim):
            return 400, {"erreur": "trimestre AAAA-Tn (n = 1-4)"}
        canal = re.sub(r"[^a-z0-9_-]+", "_",
                       str(canal or "").lower()).strip("_")
        if not canal:
            return 400, {"erreur": "canal messagerie tracée requis "
                                   "(ex : email)"}
        try:
            with open(os.path.join(self.decision_dir,
                                   f"lettres-{logement_id}.json"),
                      encoding="utf-8") as f:
                lettres = json.load(f)
            lettres = lettres if isinstance(lettres, dict) else {}
        except (FileNotFoundError, ValueError):
            lettres = {}
        lettre = lettres.get(trim)
        if not lettre or lettre.get("statut") != "brouillon":
            return 409, {"erreur": "brouillon requis avant envoi "
                                   "(POST /lettre-tranquillite)",
                         "code": "brouillon_requis"}
        lettre["statut"] = "envoyee"
        lettre["canal"] = canal
        lettre["envoyee_le"] = utcnow_iso()
        lettre["envoyee_par"] = qui
        lettres[trim] = lettre
        chemin = os.path.join(self.decision_dir,
                                f"lettres-{logement_id}.json")
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(lettres, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, chemin)
        self.log_decision(logement_id, f"lettre-{trim}", qui, "acces",
                          None, None,
                          f"lettre tranquillité envoyée ({canal})")
        return 200, {"statut": "envoyee", "logement_id": logement_id,
                     "trimestre": trim, "canal": canal}

    # --- GET /registre-rgpd : traitements + durées (lecture seule) ---
    def registre_rgpd(self, logement_id, qui):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ok, msg, _ = self.autoriser(qui, "etat_lecture", logement_id)
        if not ok:
            return 403, {"statut": "bloque", "motif": msg}
        feats = self.logts.get(logement_id, {}).get("features", {})
        lignes = [
            {"donnees": "bruit dB seuls (jamais d'audio)",
             "finalite": "tranquillité copro + carnet preuve",
             "base": "contrat (règlement intérieur)", "duree_j": 365,
             "actif": True},
            {"donnees": "voix : texte transcrit seul (BYOD, 0 j audio)",
             "finalite": "assistance séjour", "base": "consentement par échange",
             "duree_j": 90, "actif": bool(feats.get("voix", False))},
            {"donnees": "géoloc séjour (zones home/away)",
             "finalite": "pré-chauffe/accueil",
             "base": "opt-in par séjour",
             "duree_j": 90,
             "actif": bool(feats.get("geoloc_voyageur", False))},
            {"donnees": "photos EDL (logement seul, EXIF)",
             "finalite": "preuves AirCover/Booking/Vrbo",
             "base": "consentement arrivée",
             "duree_j": 90,
             "actif": bool(feats.get("etat_lieux_auto", False))},
            {"donnees": "photos interventions + pointages (logement seul)",
             "finalite": "preuve travail (temps facturé = pointé)",
             "base": "contrat prestation",
             "duree_j": 365,
             "actif": bool(feats.get("traca_intervenants", False))},
            {"donnees": "fiche mémoire (hash seul, jamais CSI brut)",
             "finalite": "confort retour (pré-remplissage)",
             "base": "opt-in 1-tap révocable",
             "duree_j": 730,
             "actif": bool(feats.get("memoire_voyageur", False))},
            {"donnees": "journal qui/quand/quoi (texte seul, jamais PIN)",
             "finalite": "traçabilité accès 90 j",
             "base": "intérêt légitime (sécurité)",
             "duree_j": 90, "actif": True},
        ]
        return 200, {"logement_id": logement_id, "traitements": lignes,
                     "total": len(lignes)}

    # --- GET /mentions-annonce : obligatoires + statut renseigné/manquant ---
    def mentions_annonce(self, logement_id):
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        log = self.logts.get(logement_id, {})
        mentions = [
            {"id": "numero_declaration",
             "label": "N° déclaration mairie (toutes annonces)",
             "renseigne": False,
             "action": "Cerfa 14004*04 en mairie, saisir le n° reçu"},
            {"id": "dpe",
             "label": "DPE < 10 ans (classe + dépenses)",
             "renseigne": False,
             "action": "diagnostiqueur, afficher classe A-G"},
            {"id": "classement",
             "label": "Classement Atout France (défaut : non classé)",
             "renseigne": False,
             "action": "visite Office de Tourisme ou rester non classé"},
            {"id": "capacite",
             "label": f"Capacité max ({log.get('occupants_max', '?')} pers.)",
             "renseigne": bool(str(log.get("occupants_max", "") or "")
                               .strip()),
             "action": ""},
            {"id": "surface",
             "label": f"Surface ({log.get('surface_m2', '?')} m²)",
             "renseigne": bool(str(log.get("surface_m2", "") or "")
                               .strip()),
             "action": ""},
            {"id": "heures_calmes",
             "label": f"Heures calmes ({log.get('heures_calmes', '?')})",
             "renseigne": bool(str(log.get("heures_calmes", "") or "")
                               .strip()),
             "action": ""},
            {"id": "fetes",
             "label": "Fêtes interdites (copro)",
             "renseigne": bool(log.get("fetes_interdites", False)),
             "action": ""},
            {"id": "menage",
             "label": (f"Ménage {log.get('menage_montant', '?')} € "
                       f"({log.get('menage_facturation', '?')})"),
             "renseigne": bool(str(log.get("menage_montant", "") or "")
                               .strip()),
             "action": ""},
            {"id": "taxe_sejour",
             "label": "Taxe de séjour Métropole NCA (affichée, OTA "
                      "collectent / direct = vous collectez)",
             "renseigne": True,
             "action": "compte portail taxe + tarifs dans le logement"},
        ]
        manquantes = [m["id"] for m in mentions if not m["renseigne"]]
        return 200, {"logement_id": logement_id, "mentions": mentions,
                     "manquantes": manquantes,
                     "mise_en_ligne_ok": not manquantes}

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
                     motif="", llm=None, jev=None, langue=""):
        tx = self.commissions.get(canal) if canal else None
        ligne = {"ts": utcnow_iso(), "logement_id": logement_id, "ref": ref,
                 "qui": qui, "quoi": quoi, "canal": canal, "commission": tx,
                 "net_hote": (None if (tx is None or montant is None or
                                       not isinstance(montant, (int, float)))
                              else round(float(montant) * (1.0 - tx), 2)),
                 "llm": llm or {}, "jev": jev or {}, "motif": motif,
                 # P7-7 : langue voyageur (filtre dashboard, vide = non
                 # renseignée — champ additif, schéma P1-10/P2-8 inchangé).
                 "langue": str(langue or "").lower()[:2]}
        path = os.path.join(self.decision_dir, f"decision.{logement_id}.jsonl")
        with open(path, "a", encoding="utf-8") as f:
            f.write(json.dumps(ligne, ensure_ascii=False) + "\n")
        return ligne

    def ha_post(self, chemin, payload):
        auth = ""
        if self.ha_token and not self.ha_token.startswith("CHANGER"):
            auth = f"Bearer {self.ha_token}"
        else:
            jeton = forger_jeton_ha()
            if jeton:
                auth = f"Bearer {jeton}"
        if not (self.ha_url and auth):
            return False, "ha_non_configure"
        req = urllib.request.Request(
            self.ha_url + chemin, data=json.dumps(payload or {}).encode("utf-8"),
            headers={"Authorization": auth,
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
        # P6-15 §12.5-bis : statut contrat indicatif (jamais bloquant, comme
        # questionnaire). Direct sans contrat signé = pin_autorise False
        # (consigne KeyMaster/box Phase 8, pas de blocage event ici pour
        # rétro-compatibilité batterie). OTA / sans canal / sans ref = True.
        contrat_signe = False
        try:
            if str(ref or "").strip():
                contrat_signe = str(ref).strip() in self._lire_contrats(
                    logement_id)
        except (ValueError, OSError):
            contrat_signe = False
        canal = str(data.get("canal", "") or "").strip().lower()
        pin_autorise = True
        if (type_event == "lcd_j2_envoi_acces" and canal == "direct"
                and not contrat_signe):
            pin_autorise = False
        self.log_decision(logement_id, ref or type_event, qui, "acces", None, None,
                          f"event {type_event} -> HA {'OK' if ok_ha else info}"
                          + ("" if contrat_signe
                             else " (contrat non signe : pin_autorise "
                             f"{str(pin_autorise).lower()})"),
                          langue=langue_utilisee)
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
                      "contrat_signe": contrat_signe,
                      "pin_autorise": pin_autorise,
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
                     "extras_favoris": extras,
                     # P6-13 : prefs ménage §5.6 (SÛRES, loggables).
                     "menage_frequence_j": str(fiche.get(
                         "menage_frequence_j", "0") or "0"),
                     "menage_heure_pref": str(fiche.get(
                         "menage_heure_pref", "11:00") or "11:00"),
                     "menage_pendant_absence": str(fiche.get(
                         "menage_pendant_absence", "non") or "non")}

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
        # P6-13 : prefs ménage intermédiaire §5.6 (questionnaire J-2,
        # séjour suivant). frequence 0 = fin de séjour seul ; heure "HH:MM"
        # validée (défaut 11:00) ; pendant_absence oui/non (défaut non).
        try:
            freq = int(str(prefs.get("menage_frequence_j", "0") or "0"))
        except ValueError:
            freq = 0
        freq = max(0, min(30, freq))
        heure = str(prefs.get("menage_heure_pref", "11:00") or "11:00").strip()
        if not re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", heure):
            heure = "11:00"
        absence = str(prefs.get("menage_pendant_absence", "non") or "non"
                      ).strip().lower() in ("oui", "yes", "true", "1")
        self.memoire[h] = {
            "opt_in": "true",
            "opt_in_le": str(prefs.get("opt_in_le", "") or "") or utcnow_iso()[:10],
            "dernier_sejour": dt.date.today().isoformat(),
            "langue": langue,
            "consignes": str(prefs.get("consignes", "") or "")[:500],
            "extras_favoris": ",".join(
                [x.strip() for x in str(prefs.get("extras_favoris", "") or "")
                 .replace(";", ",").split(",") if x.strip()][:10]),
            "menage_frequence_j": str(freq),
            "menage_heure_pref": heure,
            "menage_pendant_absence": "oui" if absence else "non",
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

    # --- P6-14 §5.7-quinquies : questionnaire pré-arrivée J-2 ---
    def _chemin_questionnaire(self, logement_id):
        """État runtime (volume decision-state, gitignoré comme les JSONL,
        jamais commité) : un JSON par logement {ref_resa: dossier}."""
        return os.path.join(self.decision_dir,
                            f"questionnaire-{logement_id}.json")

    def _lire_questionnaires(self, logement_id):
        try:
            with open(self._chemin_questionnaire(logement_id),
                      encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _sauver_questionnaires(self, logement_id, dossiers):
        chemin = self._chemin_questionnaire(logement_id)
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(dossiers, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, chemin)

    def questionnaire_schema(self, logement_id, ref_resa="",
                             hash_voyageur="", langue="fr"):
        """GET /questionnaire : schéma 4 blocs + pré-rempli mémoire (hash) +
        complétude J1 (ref_resa : état + manquants + risque + relance).
        503 si `questionnaire: off`. Jamais de PIN, jamais de hash en sortie."""
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not l["features"].get("questionnaire", False):
            return 503, {"erreur": "questionnaire: off pour ce logement"}
        code_langue = str(langue or "fr").lower()[:2]
        if code_langue not in LANGUES_SOCLE:
            code_langue = "fr"
        # Si `memoire_voyageur: off` : blocs 1+3+4 seuls (choix séjour
        # courant, jamais persistés).
        avec_prefs = bool(l["features"].get("memoire_voyageur", False))
        blocs = [b for b in QUESTIONNAIRE_BLOCS
                 if b != "preferences" or avec_prefs]
        schema = {b: list(QUESTIONNAIRE_SCHEMA_BLOCS[b]) for b in blocs}
        fiche = (self._fiche_valide(hash_voyageur)
                 if str(hash_voyageur or "").strip() else None)
        pre_rempli = {}
        if fiche is not None:
            pre_rempli = {
                "langue": str(fiche.get("langue", "fr") or "fr"),
                "consignes": str(fiche.get("consignes", "") or ""),
                "gouts_kit": str(fiche.get("extras_favoris", "") or ""),
                "menage_frequence_j": str(fiche.get(
                    "menage_frequence_j", "0") or "0"),
                "menage_heure_pref": str(fiche.get(
                    "menage_heure_pref", "11:00") or "11:00"),
                "menage_pendant_absence": str(fiche.get(
                    "menage_pendant_absence", "non") or "non"),
            }
        completude = {"etat": "non_repondu", "blocs_remplis": [],
                      "blocs_manquants": list(blocs),
                      "risque_friction": 1.0, "relance": "dashboard",
                      "relance_ciblee": ""}
        if str(ref_resa or "").strip():
            dossiers = self._lire_questionnaires(logement_id)
            dossier = dossiers.get(str(ref_resa).strip(), {})
            remplis = [b for b in blocs if any(
                str((dossier.get(b, {}) or {}).get(c, "") or "").strip()
                for c in QUESTIONNAIRE_SCHEMA_BLOCS[b])]
            manquants = [b for b in blocs if b not in remplis]
            risque = round(len(manquants) / max(len(blocs), 1), 2)
            etat_c = ("non_repondu" if not dossier
                      else ("repondu_complet" if not manquants else "incomplet"))
            relance = ("relance_auto" if (manquants
                                          and etat_c != "repondu_complet")
                       else "dashboard")
            completude = {
                "etat": etat_c, "blocs_remplis": remplis,
                "blocs_manquants": manquants, "risque_friction": risque,
                "relance": relance,
                "relance_ciblee": (f"il manque : {', '.join(manquants)}"
                                  if relance == "relance_auto" and manquants
                                  else "")}
        return 200, {"statut": "schema", "logement_id": logement_id,
                     "langue": code_langue, "blocs": schema,
                     "blocs_sans_preferences": not avec_prefs,
                     "pre_rempli": pre_rempli,
                     "voyageur_reconnu": fiche is not None,
                     "completude": completude,
                     "suggestions_generiques": list(
                         QUESTIONNAIRE_SUGGESTIONS_GENERIQUES),
                     "cutoff_extras": (f"J-{QUESTIONNAIRE_CUTOFF_J_MOINS} "
                                       f"{QUESTIONNAIRE_CUTOFF_HEURE}h00"),
                     "jamais_bloquant": True}

    @staticmethod
    def _normaliser_m2(arrivee, reponses):
        """M2 déterministe (moteur) : normalise les champs libres (arrivée +
        réponses) en valeurs typées + résumé « On a compris : … Corriger ? »
        (validation voyageur 1-tap OBLIGATOIRE avant écriture input_*/mémoire ;
        le LLM :4000 hors moteur ne fait que proposer, jamais écrire)."""
        src = dict(arrivee or {})
        for k, v in (reponses or {}).items():
            src.setdefault(k, v)
        norm = {}
        norm["heure_arrivee"] = str(src.get("heure_arrivee", "") or "").strip()[:5]
        try:
            norm["nb_voyageurs"] = int(float(str(src.get("nb_voyageurs", "")
                                                     or "0")))
        except ValueError:
            norm["nb_voyageurs"] = 0
        norm["vol"] = str(src.get("vol", "") or "").strip().upper()[:12]
        for cle in ("temp_chauffage", "temp_clim"):
            try:
                v = float(str(src.get(cle, "") or ""))
                norm[cle] = None if v != v else v  # NaN (vide) = absent
            except ValueError:
                norm[cle] = None
        # Versatile : chauffage jamais forcé >21 °C (clampé en code, signalé).
        if (norm.get("temp_chauffage") is not None
                and norm["temp_chauffage"] > TEMP_CHAUFFAGE_MAX):
            norm["temp_chauffage"] = TEMP_CHAUFFAGE_MAX
            norm["temp_chauffage_clampee"] = True
        norm["allergies"] = [
            x.strip().lower() for x in
            str(src.get("allergies", "") or "").replace(";", ",").split(",")
            if x.strip()][:10]
        norm["consignes"] = str(src.get("consignes", "") or "").strip()[:500]
        morceaux = []
        if norm["heure_arrivee"]:
            morceaux.append(f"arrivée {norm['heure_arrivee']}")
        if norm["nb_voyageurs"]:
            morceaux.append(f"{norm['nb_voyageurs']} voyageur(s)")
        if norm["vol"]:
            morceaux.append(f"vol {norm['vol']}")
        if norm.get("temp_chauffage") is not None:
            morceaux.append(f"chauffage {norm['temp_chauffage']} °C")
        if norm.get("temp_clim") is not None:
            morceaux.append(f"clim {norm['temp_clim']} °C")
        if norm["allergies"]:
            morceaux.append(f"allergies : {', '.join(norm['allergies'])}")
        if norm["consignes"]:
            morceaux.append(f"consignes : {norm['consignes'][:80]}")
        norm["compris"] = ("On a compris : " + "; ".join(morceaux)
                           + ". Corriger ?" if morceaux
                           else "On a compris : rien. Corriger ?")
        return norm

    def _suggestions_m3(self, fiche, allergies):
        """M3 : max 3 suggestions (ids catalogue socle, prix JAMAIS ici —
        extras seul fait foi, art. 225-1). Filtre allergènes strict
        (sous-chaîne, jamais de diagnostic santé). Opt-in absent (pas de fiche
        goûts) -> génériques seules."""
        favoris = []
        if fiche is not None:
            favoris = [x.strip().lower() for x in
                       str(fiche.get("extras_favoris", "") or "")
                       .replace(";", ",").split(",") if x.strip()]
        allergenes = [a for a in (allergies or []) if a]

        def _ok(candidat):
            return not any(a in candidat for a in allergenes)
        retenues = [c for c in favoris if _ok(c)][:3]
        for gen in QUESTIONNAIRE_SUGGESTIONS_GENERIQUES:
            if len(retenues) >= 3:
                break
            if gen not in retenues and _ok(gen):
                retenues.append(gen)
        return retenues

    def questionnaire_depot(self, logement_id, qui_id, ref_resa, arrivee=None,
                            reponses=None, optins=None, hash_voyageur=""):
        """POST /questionnaire : dépôt 1-tap HUMAIN (qui auto -> 400), ref_resa
        slug seule (traversée bloquée -> 400), nb voyageurs <= occupants_max
        copro (sinon 400), températures bornées Versatile (chauffage clampé
        21 °C max, jamais rejeté), extras = ids socle seuls (prix jamais ici),
        cut-off J-1 18h : extras hors délai = statut cutoff_depasse (proposer
        sur place), jamais de refus global (ne bloque jamais l'accès).
        201 créé / 200 mis à jour (même ref = correction 1-tap). Jamais de PIN
        (ni entrée ni sortie), jamais de hash en sortie."""
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not l["features"].get("questionnaire", False):
            return 503, {"erreur": "questionnaire: off pour ce logement"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_QUESTIONNAIRE:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        ref = str(ref_resa or "").strip()
        if not ref or not REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        norm = self._normaliser_m2(arrivee, reponses)
        # occupants_max copro (renseigné -> borne dure, jamais inventée).
        occ_max = str(l.get("occupants_max", "") or "").strip()
        if (norm["nb_voyageurs"] and occ_max.isdigit()
                and norm["nb_voyageurs"] > int(occ_max)):
            return 400, {"erreur": f"nb_voyageurs > occupants_max copro ({occ_max})"}
        arrivee = dict(arrivee or {})
        reponses = dict(reponses or {})
        optins = dict(optins or {})
        # Bloc arrivée : M2 normalisé + date (cut-off) + textes courts.
        bloc_arrivee = {
            "heure_arrivee": norm["heure_arrivee"],
            "nb_voyageurs": norm["nb_voyageurs"],
            "vol": norm["vol"],
            "date_arrivee": str(arrivee.get("date_arrivee", "") or "")[:10],
            "consigne_bagages": str(arrivee.get("consigne_bagages", "")
                                    or "")[:20],
            "parking": str(arrivee.get("parking", "") or "")[:20],
        }
        # Cut-off extras J-1 18h : dépassé -> statut informatif seul (proposer
        # sur place), jamais de refus global.
        cutoff_depasse = False
        if bloc_arrivee["date_arrivee"]:
            try:
                j_arr = dt.date.fromisoformat(bloc_arrivee["date_arrivee"])
                limite = dt.datetime.combine(
                    j_arr - dt.timedelta(days=QUESTIONNAIRE_CUTOFF_J_MOINS),
                    dt.time(QUESTIONNAIRE_CUTOFF_HEURE))
                cutoff_depasse = dt.datetime.now() >= limite
            except ValueError:
                bloc_arrivee["date_arrivee"] = ""
        # Bloc préférences : champs schéma seuls, textes bornés, jamais PIN/hash.
        bloc_prefs = {}
        for champ in QUESTIONNAIRE_SCHEMA_BLOCS["preferences"]:
            if champ in ("temp_chauffage", "temp_clim"):
                bloc_prefs[champ] = norm.get(champ)
            elif champ in ("menage_frequence_j", "menage_heure_pref",
                           "menage_pendant_absence", "langue", "gouts_kit",
                           "allergies", "courses_type", "petit_dej",
                           "consignes", "pack_teletravail", "kit_bebe",
                           "kit_plage"):
                v = reponses.get(champ, "")
                bloc_prefs[champ] = (",".join(norm["allergies"])
                                    if champ == "allergies"
                                    else str(v or "")[:200])
        # Bloc extras : ids socle seuls (format slug, invalides ignorés +
        # signalés) ; prix JAMAIS ici (extras seul fait foi, art. 225-1).
        bruts = (arrivee.get("extra_ids", reponses.get("extra_ids", [])) or [])
        if isinstance(bruts, str):
            bruts = [x.strip() for x in bruts.replace(";", ",").split(",")]
        extra_ids, ignores = [], []
        for cand in bruts:
            cand = str(cand or "").strip().lower()[:60]
            if not cand:
                continue
            (extra_ids if REF_RE.fullmatch(cand) else ignores).append(cand)
        statut_extras = ("cutoff_depasse" if (cutoff_depasse and extra_ids)
                         else "ok")
        bloc_extras = {"extra_ids": extra_ids, "statut": statut_extras}
        # Bloc contrat + opt-ins (CGV 1-tap P6-15 ; opt-ins booléens).
        bloc_contrat = {k: str(optins.get(k, "") or "").strip().lower()
                        in ("true", "1", "oui", "yes")
                        for k in QUESTIONNAIRE_SCHEMA_BLOCS["contrat"]}
        # M3 : suggestions (fiche opt-in si hash reconnu, sinon génériques).
        fiche = (self._fiche_valide(hash_voyageur)
                 if str(hash_voyageur or "").strip() else None)
        suggestions = self._suggestions_m3(fiche, norm["allergies"])
        # Opt-in mémoire -> fiche §5.7-quater (geste humain déjà vérifié) ;
        # si `memoire_voyageur: off` : séjour seul, non persisté.
        optin_mem = bloc_contrat["optin_memoire"]
        mem_persiste, sejour_seul = False, False
        if optin_mem and fiche is not None or (optin_mem and str(
                hash_voyageur or "").strip()
                and re.fullmatch(r"[0-9a-f]{64}",
                                 str(hash_voyageur or "").lower())):
            h = str(hash_voyageur).lower()
            if l["features"].get("memoire_voyageur", False):
                maj = dict(self.memoire.get(h, {}))
                maj.update({
                    "opt_in": "true",
                    "opt_in_le": maj.get("opt_in_le", "") or utcnow_iso()[:10],
                    "dernier_sejour": dt.date.today().isoformat(),
                    "langue": str(reponses.get("langue", "") or "fr").lower()[:2]
                    if str(reponses.get("langue", "") or "").lower()[:2]
                    in LANGUES_SOCLE else maj.get("langue", "fr"),
                    "consignes": norm["consignes"] or maj.get("consignes", ""),
                    "extras_favoris": ",".join(extra_ids[:10])
                    or maj.get("extras_favoris", ""),
                })
                if str(reponses.get("menage_frequence_j", "") or "").strip():
                    try:
                        maj["menage_frequence_j"] = str(max(0, min(
                            30, int(str(reponses["menage_frequence_j"])))))
                    except ValueError:
                        pass
                if re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d",
                                str(reponses.get("menage_heure_pref", "")
                                    or "").strip()):
                    maj["menage_heure_pref"] = str(
                        reponses["menage_heure_pref"]).strip()
                if str(reponses.get("menage_pendant_absence", "")
                       or "").strip().lower() in ("oui", "yes", "true", "1",
                                                 "non", "no", "false", "0"):
                    maj["menage_pendant_absence"] = (
                        "oui" if str(reponses["menage_pendant_absence"])
                        .strip().lower() in ("oui", "yes", "true", "1")
                        else "non")
                self.memoire[h] = maj
                self._sauver_memoire()
                mem_persiste = True
            else:
                sejour_seul = True
        dossier = {"arrivee": bloc_arrivee, "preferences": bloc_prefs,
                   "extras": bloc_extras, "contrat": bloc_contrat,
                   "compris": norm["compris"], "a_corriger_1tap": True,
                   "temp_chauffage_clampee": bool(
                       norm.get("temp_chauffage_clampee")),
                   "suggestions": suggestions,
                   "optin_memoire_persiste": mem_persiste,
                   "optin_memoire_sejour_seul": sejour_seul,
                   "maj_le": utcnow_iso()}
        dossiers = self._lire_questionnaires(logement_id)
        statut, code = ("mis_a_jour", 200) if ref in dossiers else ("cree", 201)
        dossiers[ref] = dossier
        self._sauver_questionnaires(logement_id, dossiers)
        remplis = [b for b in QUESTIONNAIRE_BLOCS if any(
            str(dossier.get(b, {}).get(c, "") or "").strip()
            if not isinstance(dossier.get(b, {}).get(c, ""), bool)
            else dossier.get(b, {}).get(c, False)
            for c in QUESTIONNAIRE_SCHEMA_BLOCS[b])]
        self.log_decision(logement_id, f"questionnaire-{ref}", qui_id, "acces",
                          None, None,
                          f"questionnaire J-2 {statut} ({len(remplis)}/4 blocs)")
        return code, {"statut": statut, "ref_resa": ref,
                      "logement_id": logement_id, "blocs_remplis": remplis,
                      "compris": norm["compris"], "a_corriger_1tap": True,
                      "temp_chauffage_clampee": bool(
                          norm.get("temp_chauffage_clampee")),
                      "suggestions": suggestions,
                      "extras": {"ids": extra_ids, "statut": statut_extras,
                                 "ignores": ignores},
                      "optin_memoire_persiste": mem_persiste,
                      "optin_memoire_sejour_seul": sejour_seul,
                      "jamais_bloquant": True}

    # --- P6-15 §12.5-bis : contrat PWA 30 s + signature tactile + opt-ins ---
    def _chemin_contrat(self, logement_id):
        """État runtime (volume decision-state, gitignoré comme les JSONL,
        jamais commité) : un JSON par logement {ref_resa: dossier signé}."""
        return os.path.join(self.decision_dir,
                            f"contrat-{logement_id}.json")

    def _lire_contrats(self, logement_id):
        try:
            with open(self._chemin_contrat(logement_id),
                      encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _sauver_contrats(self, logement_id, dossiers):
        chemin = self._chemin_contrat(logement_id)
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(dossiers, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, chemin)

    @staticmethod
    def _code_retour(ref_resa):
        """Code CRM retour −10 % direct seul (déterministe, sans effet prix
        ici — applicable direct seul, validation humaine box, art. 225-1 :
        remise affichée critère objectif retour, jamais discriminatoire)."""
        propre = re.sub(r"[^A-Za-z0-9-]", "", str(ref_resa or "").upper())[:24]
        return f"DIRECT-10-{propre}" if propre else ""

    def contrat_statut(self, logement_id, ref_resa):
        """GET /contrat : statut PWA 30 s (non_signe / signe + horodatage +
        opt-ins + code_retour si `crm_retour: on`). 404 logement inconnu,
        400 sans ref_resa. Jamais de signature/hash en sortie."""
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ref = str(ref_resa or "").strip()
        if not ref:
            return 400, {"erreur": "ref_resa requise (slug)"}
        if not REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        dossiers = self._lire_contrats(logement_id)
        dossier = dossiers.get(ref)
        if not dossier:
            # Indicatif questionnaire : CGV déjà acceptées là-bas mais tactile
            # manquante ici -> invite signature (jamais bloquant).
            questionnaires = self._lire_questionnaires(logement_id)
            qd = questionnaires.get(ref, {})
            q_contrat = (qd.get("contrat", {}) if isinstance(qd, dict)
                         else {})
            q_accepte = bool(q_contrat.get("accepte_cgv", False))
            return 200, {"statut": "non_signe", "logement_id": logement_id,
                         "ref_resa": ref,
                         "questionnaire_accepte": q_accepte,
                         "signature_manquante": True,
                         "pin_autorise": True,
                         "pdf_reference": f"contrats/{logement_id}/{ref}_contrat.pdf",
                         "jamais_bloquant": True}
        optins = dossier.get("optins", {})
        crm_on = bool(l["features"].get("crm_retour", False))
        code = dossier.get("code_retour", "") if (
            optins.get("optin_crm_retour") and crm_on) else ""
        return 200, {"statut": "signe", "logement_id": logement_id,
                     "ref_resa": ref,
                     "nom_voyageur": dossier.get("nom_voyageur", ""),
                     "horodatage": dossier.get("horodatage", ""),
                     "optins": optins,
                     "geoloc_statut": dossier.get("geoloc_statut", ""),
                     "code_retour": code,
                     "crm_en_attente": bool(optins.get("optin_crm_retour")
                                            and not crm_on),
                     "pin_autorise": True,
                     "pdf_reference": dossier.get(
                         "pdf_reference",
                         f"contrats/{logement_id}/{ref}_contrat.pdf"),
                     "signature_sha256": "",
                     "jamais_bloquant": True}

    def contrat_signer(self, logement_id, qui_id, ref_resa, nom_voyageur="",
                       signature="", accepte_cgv=False, optins=None,
                       hash_voyageur=""):
        """POST /contrat : signature tactile 1-tap HUMAIN (qui auto -> 400),
        ref_resa slug seule (traversée -> 400), accepte_cgv true exigé (sinon
        422 cgv_requise), signature >=8 exigée (sinon 422 signature_requise,
        sha256 + longueur seuls stockés). 201 créé / 200 re-signé (même ref =
        mise à jour horodatée). Lie questionnaire (contrat.accepte_cgv=true
        sans écraser autres blocs) + opt-in mémoire (-> fiche §5.7-quater).
        Jamais de signature/hash en sortie, jamais en clair en log."""
        l = self.logts.get(logement_id)
        if not l:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_CONTRAT:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        ref = str(ref_resa or "").strip()
        if not ref or not REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        nom = str(nom_voyageur or "").strip()[:100]
        if len(nom) < 2:
            return 400, {"erreur": "nom_voyageur requis (>= 2 caractères)"}
        acc = (str(accepte_cgv).strip().lower() in ("true", "1", "oui", "yes")
               if not isinstance(accepte_cgv, bool) else bool(accepte_cgv))
        if not acc:
            return 422, {"erreur": "CGV non acceptées (case obligatoire)",
                         "code": "cgv_requise"}
        sig = str(signature or "")
        if len(sig.strip()) < CONTRAT_SIGNATURE_MIN:
            return 422, {"erreur": "signature tactile requise (>= 8 caractères)",
                         "code": "signature_requise"}
        import hashlib
        sig_hash = hashlib.sha256(sig.encode("utf-8")).hexdigest()
        optins = dict(optins or {})
        bloc_optins = {k: str(optins.get(k, "") or "").strip().lower()
                       in ("true", "1", "oui", "yes")
                       for k in CONTRAT_OPTINS}
        # Opt-in mémoire -> fiche §5.7-quater (geste humain déjà vérifié) ;
        # si `memoire_voyageur: off` : séjour seul, non persisté.
        mem_persiste, sejour_seul = False, False
        h = str(hash_voyageur or "").lower().strip()
        if bloc_optins["optin_memoire"] and h and re.fullmatch(
                r"[0-9a-f]{64}", h):
            if l["features"].get("memoire_voyageur", False):
                maj = dict(self.memoire.get(h, {}))
                maj.update({
                    "opt_in": "true",
                    "opt_in_le": maj.get("opt_in_le", "") or utcnow_iso()[:10],
                    "dernier_sejour": dt.date.today().isoformat(),
                })
                self.memoire[h] = maj
                self._sauver_memoire()
                mem_persiste = True
            else:
                sejour_seul = True
        elif bloc_optins["optin_memoire"]:
            sejour_seul = True
        # Géoloc séjour seul : révocation checkout + purge = box terrain ;
        # ici statut indicatif (jamais de tracking, jamais de fond permanent).
        geoloc_on = bool(l["features"].get("geoloc_voyageur", False))
        geoloc_statut = ("geoloc_active_sejour" if (
            bloc_optins["optin_geoloc"] and geoloc_on)
            else ("geoloc_stockee_sans_suivi" if bloc_optins["optin_geoloc"]
                  else "geoloc_refusee"))
        # CRM retour : code −10 % direct seul si `crm_retour: on`, sinon
        # optin stocké sans code (jamais d'effet prix auto, art. 225-1).
        crm_on = bool(l["features"].get("crm_retour", False))
        code_retour = (self._code_retour(ref) if (
            bloc_optins["optin_crm_retour"] and crm_on) else "")
        horodatage = utcnow_iso()
        pdf_ref = f"contrats/{logement_id}/{ref}_contrat.pdf"
        dossier = {"nom_voyageur": nom,
                   "horodatage": horodatage,
                   "signature_sha256": sig_hash,
                   "signature_len": len(sig),
                   "accepte_cgv": True,
                   "optins": bloc_optins,
                   "geoloc_statut": geoloc_statut,
                   "code_retour": code_retour,
                   "optin_memoire_persiste": mem_persiste,
                   "optin_memoire_sejour_seul": sejour_seul,
                   "pdf_reference": pdf_ref}
        dossiers = self._lire_contrats(logement_id)
        statut, code_http = (("re_signe", 200) if ref in dossiers
                             else ("signe", 201))
        dossiers[ref] = dossier
        self._sauver_contrats(logement_id, dossiers)
        # Lie questionnaire : contrat.accepte_cgv=true sans écraser le reste.
        try:
            questionnaires = self._lire_questionnaires(logement_id)
            qd = questionnaires.get(ref)
            if isinstance(qd, dict):
                qc = dict(qd.get("contrat", {}))
                qc["accepte_cgv"] = True
                for k in CONTRAT_OPTINS:
                    if bloc_optins.get(k):
                        qc[k] = True
                qd["contrat"] = qc
                qd["maj_le"] = horodatage
                questionnaires[ref] = qd
                self._sauver_questionnaires(logement_id, questionnaires)
        except (ValueError, OSError):
            pass
        self.log_decision(logement_id, f"contrat-{ref}", qui_id, "acces",
                          None, None,
                          f"contrat PWA {statut} ({nom}, optins "
                          f"memoire={bloc_optins['optin_memoire']} "
                          f"geoloc={bloc_optins['optin_geoloc']} "
                          f"crm={bloc_optins['optin_crm_retour']})")
        return code_http, {"statut": statut, "ref_resa": ref,
                           "logement_id": logement_id,
                           "horodatage": horodatage,
                           "optins": bloc_optins,
                           "geoloc_statut": geoloc_statut,
                           "code_retour": code_retour,
                           "crm_en_attente": bool(
                               bloc_optins["optin_crm_retour"] and not crm_on),
                           "optin_memoire_persiste": mem_persiste,
                           "optin_memoire_sejour_seul": sejour_seul,
                           "pin_autorise": True,
                           "pdf_reference": pdf_ref,
                           "jamais_bloquant": True}

    # --- P6-17 §5.7-bis : boucle avis (enquête J+1 + pré-réponse + scènes) ---
    def _chemin_avis(self, logement_id):
        """État runtime (volume decision-state, gitignoré comme les JSONL,
        jamais commité) : un JSON par logement {ref_resa: dossier enquête}."""
        return os.path.join(self.decision_dir,
                            f"avis-{logement_id}.json")

    def _lire_avis(self, logement_id):
        try:
            with open(self._chemin_avis(logement_id),
                      encoding="utf-8") as f:
                data = json.load(f)
            return data if isinstance(data, dict) else {}
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _sauver_avis(self, logement_id, dossiers):
        chemin = self._chemin_avis(logement_id)
        tmp = chemin + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(dossiers, f, ensure_ascii=False, indent=1, sort_keys=True)
        os.replace(tmp, chemin)

    @staticmethod
    def _todo_correctif(commentaire):
        """Todo correctif par mots-clés (ménage/technique/générique).
        Indicatif dashboard, jamais de sanction auto."""
        bas = str(commentaire or "").lower()
        if any(m in bas for m in AVIS_MOTS_MENAGE):
            return "correctif_menage"
        if any(m in bas for m in AVIS_MOTS_TECHNIQUE):
            return "correctif_technique"
        return "relecture_hote"

    def avis_statut(self, logement_id, ref_resa):
        """GET /avis : statut enquête J+1 (non_repondue + échelle 1-5, ou
        dossier note + routage + geste). 404 logement inconnu, 400 sans
        ref_resa. Jamais bloquant."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        ref = str(ref_resa or "").strip()
        if not ref:
            return 400, {"erreur": "ref_resa requise (slug)"}
        if not REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        dossier = self._lire_avis(logement_id).get(ref)
        if not dossier:
            return 200, {"statut": "non_repondue",
                         "logement_id": logement_id, "ref_resa": ref,
                         "echelle": [1, 2, 3, 4, 5],
                         "jamais_bloquant": True}
        return 200, {"statut": dossier.get("statut", "repondue"),
                     "logement_id": logement_id, "ref_resa": ref,
                     "note": dossier.get("note"),
                     "routage": dossier.get("routage"),
                     "geste": dossier.get("geste"),
                     "geste_valide": dossier.get("geste_valide", False),
                     "todo_correctif": dossier.get("todo_correctif"),
                     "reponse": dossier.get("reponse", {}).get("statut",
                                                               "absente"),
                     "jamais_bloquant": True}

    def avis_depot(self, logement_id, qui_id, ref_resa, note,
                   commentaire="", langue="fr"):
        """POST /avis : dépôt 1-tap HUMAIN (qui auto -> 400), ref_resa slug
        seule (traversée -> 400), note entière 1-5 (sinon 400), commentaire
        <=2000. 201 créé / 200 corrigé (même ref = correction 1-tap).
        Routage : >=4★ lien_public ; 3★ rattrapage + late_gratuite auto ;
        <=2★ rattrapage + geste à valider humain. Jamais bloquant."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_AVIS:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        ref = str(ref_resa or "").strip()
        if not ref or not REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        try:
            note_i = int(float(str(note)))
        except (TypeError, ValueError):
            return 400, {"erreur": "note entière 1-5 requise"}
        if note_i < 1 or note_i > 5:
            return 400, {"erreur": "note entière 1-5 requise"}
        comm = str(commentaire or "")[:2000]
        code_langue = str(langue or "fr").lower()[:2]
        if code_langue not in LANGUES_SOCLE:
            code_langue = "fr"
        todo = self._todo_correctif(comm) if note_i < AVIS_SEUIL_PUBLIC else ""
        if note_i >= AVIS_SEUIL_PUBLIC:
            routage, statut = "lien_public", "repondue"
            geste = {"type": "", "montant_eur": 0, "validation_requise": False}
            geste_valide = False
        elif note_i == 3:
            routage, statut = "rattrapage_prive", "rattrapage"
            geste = {"type": "late_gratuite", "montant_eur": 0,
                     "validation_requise": False}
            geste_valide = True  # <=20 € : auto, sans validation
        else:
            routage, statut = "rattrapage_prive", \
                "rattrapage_validation_requise"
            geste = {"type": "moins_10_direct", "montant_eur": 0,
                     "validation_requise": True}
            geste_valide = False
        dossiers = self._lire_avis(logement_id)
        ancien = dossiers.get(ref, {})
        dossier = {"note": note_i, "commentaire": comm,
                   "langue": code_langue, "routage": routage,
                   "statut": statut, "geste": geste,
                   "geste_valide": geste_valide or bool(
                       ancien.get("geste_valide") and ancien.get("note")
                       == note_i),
                   "todo_correctif": todo, "maj_le": utcnow_iso(),
                   "reponse": ancien.get("reponse", {"statut": "absente"})}
        statut_http, code = (("corrige", 200) if ref in dossiers
                             else ("cree", 201))
        dossiers[ref] = dossier
        self._sauver_avis(logement_id, dossiers)
        self.log_decision(logement_id, f"avis-{ref}", qui_id, "acces",
                          None, None,
                          f"enquete J+1 {statut_http} (note {note_i} -> "
                          f"{routage}"
                          + (f" + {todo}" if todo else "") + ")")
        return code, {"statut": statut_http, "ref_resa": ref,
                      "logement_id": logement_id, "note": note_i,
                      "routage": routage, "geste": dossier["geste"],
                      "geste_valide": dossier["geste_valide"],
                      "todo_correctif": todo,
                      "jamais_bloquant": True}

    def avis_geste(self, logement_id, qui_id, ref_resa, geste,
                   montant_eur=0):
        """POST /avis-geste : validation 1-tap HUMAINE du geste (qui auto ->
        400), geste in AVIS_GESTES (sinon 400), montant >=0. Montant >20 € ->
        alerte loggée (la validation humaine elle-même fait foi, jamais de
        débit auto). 404 si enquête absente."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_AVIS:
            return 400, {"erreur": "validation 1-tap HUMAINE exigée "
                                   "(qui != auto/llm/jev)"}
        ref = str(ref_resa or "").strip()
        if not ref or not REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        geste = str(geste or "").strip().lower()
        if geste not in AVIS_GESTES:
            return 400, {"erreur": "geste parmi : "
                                   + ", ".join(AVIS_GESTES)}
        try:
            montant = float(str(montant_eur or 0))
        except (TypeError, ValueError):
            return 400, {"erreur": "montant_eur >= 0 requis"}
        if montant < 0:
            return 400, {"erreur": "montant_eur >= 0 requis"}
        dossiers = self._lire_avis(logement_id)
        dossier = dossiers.get(ref)
        if not dossier:
            return 404, {"erreur": "enquete absente (POST /avis d'abord)"}
        dossier["geste"] = {"type": geste, "montant_eur": montant,
                            "validation_requise": False}
        dossier["geste_valide"] = True
        if dossier.get("statut") == "rattrapage_validation_requise":
            dossier["statut"] = "rattrapage"
        dossier["geste_valide_par"] = qui_id
        dossier["geste_valide_le"] = utcnow_iso()
        dossiers[ref] = dossier
        self._sauver_avis(logement_id, dossiers)
        alerte = montant > AVIS_MONTANT_VALIDATION
        self.log_decision(logement_id, f"avis-{ref}", qui_id, "acces",
                          None, montant,
                          f"geste 1-tap {geste} ({montant} EUR)"
                          + (" — ALERTE >20 €" if alerte else ""))
        return 200, {"statut": "geste_valide", "ref_resa": ref,
                     "logement_id": logement_id, "geste": dossier["geste"],
                     "alerte_montant": alerte,
                     "jamais_bloquant": True}

    def avis_reponse(self, logement_id, qui_id, ref_resa, action,
                     texte=""):
        """POST /avis-reponse : pré-réponse 1-tap (brouillon déterministe ton
        hôte depuis gabarit + note/langue, ou texte humain scanné : promesse
        détectée -> 422 jamais forcée ; action valider : brouillon ->
        validee, publication manuelle box jamais auto). Geste HUMAIN seul,
        404 si enquête absente."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_AVIS:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        ref = str(ref_resa or "").strip()
        if not ref or not REF_RE.fullmatch(ref) or ".." in ref:
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        action = str(action or "").strip().lower()
        if action not in ("brouillon", "valider"):
            return 400, {"erreur": "action = brouillon|valider"}
        dossiers = self._lire_avis(logement_id)
        dossier = dossiers.get(ref)
        if not dossier:
            return 404, {"erreur": "enquete absente (POST /avis d'abord)"}
        rep = dossier.get("reponse", {"statut": "absente"})
        if action == "brouillon":
            brut = str(texte or "").strip()[:2000]
            if brut:
                bas = brut.lower()
                trouvees = sorted({p for p in AVIS_PROMESSES if p in bas})
                if trouvees:
                    return 422, {"erreur": "promesse détectée (jamais auto)",
                                 "code": "promesse_detectee",
                                 "promesses": trouvees}
                corps = brut
                source = "humain"
            else:
                marque = self.branding.get("marque") or "votre hôte"
                log_nom = (self.logts.get(logement_id, {}).get("nom")
                           or logement_id)
                if dossier.get("note", 0) >= AVIS_SEUIL_PUBLIC:
                    corps = (f"Merci pour votre séjour à {log_nom} ! "
                             f"Toute l'équipe {marque} vous remercie et "
                             f"espère vous revoir bientôt.")
                else:
                    corps = (f"Merci pour votre retour sur {log_nom}. "
                             f"L'équipe {marque} vous a répondu en privé "
                             f"et reste à votre écoute.")
                source = "gabarit"
            rep = {"statut": "brouillon", "texte": corps, "source": source,
                   "redige_le": utcnow_iso(), "redige_par": qui_id}
            dossier["reponse"] = rep
            dossiers[ref] = dossier
            self._sauver_avis(logement_id, dossiers)
            self.log_decision(logement_id, f"avis-{ref}", qui_id, "acces",
                              None, None,
                              f"pre-reponse {source} (validation 1-tap requise)")
            return 201, {"statut": "brouillon", "ref_resa": ref,
                         "logement_id": logement_id, "source": source,
                         "longueur": len(corps),
                         "jamais_bloquant": True}
        if rep.get("statut") != "brouillon":
            return 409, {"erreur": "brouillon requis avant validation "
                                   "(action brouillon d'abord)",
                         "code": "brouillon_requis"}
        rep["statut"] = "validee"
        rep["validee_le"] = utcnow_iso()
        rep["validee_par"] = qui_id
        dossier["reponse"] = rep
        dossiers[ref] = dossier
        self._sauver_avis(logement_id, dossiers)
        self.log_decision(logement_id, f"avis-{ref}", qui_id, "acces",
                          None, None,
                          "pre-reponse validee 1-tap (publication manuelle box)")
        return 200, {"statut": "validee", "ref_resa": ref,
                     "logement_id": logement_id,
                     "rappel": "publication manuelle (jamais auto)",
                     "jamais_bloquant": True}

    def scenes(self, logement_id):
        """GET /scenes : 3 scènes 1-tap PWA (lecture seule, jamais bloquant)."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        return 200, {"logement_id": logement_id,
                     "scenes": [{"id": sid, "actions": list(act)}
                                for sid, act in SCENES.items()]}

    def scene_activer(self, logement_id, qui_id, scene, ref_resa=""):
        """POST /scene : activation 1-tap HUMAIN (log décision + actions
        indicatives, box exécute via HA ; jamais bloquant)."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        if not qui_id or str(qui_id).strip().lower() in QUI_AUTO_AVIS:
            return 400, {"erreur": "geste humain exigé (qui != auto/llm/jev)"}
        scene = str(scene or "").strip().lower()
        if scene not in SCENES:
            return 400, {"erreur": "scene parmi : "
                                   + ", ".join(sorted(SCENES))}
        ref = str(ref_resa or "").strip()
        if ref and (not REF_RE.fullmatch(ref) or ".." in ref):
            return 400, {"erreur": "ref_resa slug seule (traversée bloquée)"}
        self.log_decision(logement_id, ref or f"scene-{scene}", qui_id,
                          "acces", None, None,
                          f"scene 1-tap {scene} "
                          f"({', '.join(SCENES[scene])})")
        return 200, {"statut": "scene_activee", "scene": scene,
                     "logement_id": logement_id,
                     "actions": list(SCENES[scene]),
                     "jamais_bloquant": True}

    # --- P7-6 §6.7 : seuils transverses LLM/Jev + garde-fou outils ---
    @staticmethod
    def _score_jev(jev):
        """Extrait (noul, confidence, hors_bornes) flottants >= 0.
        Absents/invalides -> 0.0 (défaut sûr : jamais d'auto sans scores)."""
        def _f(cle):
            try:
                v = float((jev or {}).get(cle, 0) or 0)
            except (TypeError, ValueError):
                return 0.0
            return v if v == v and v >= 0 else 0.0  # NaN/négatif -> 0
        j = _f("noul"), _f("confidence"), _f("hors_bornes")
        return j

    def seuils(self):
        """GET /seuils : seuils transverses (lecture seule, doc vivante)."""
        return 200, {"noul_auto": SEUIL_NOUL_AUTO,
                     "confidence_auto": SEUIL_CONFIDENCE_AUTO,
                     "confidence_min": SEUIL_CONFIDENCE_MIN,
                     "hors_bornes_blocage": SEUIL_HORS_BORNES_BLOCAGE,
                     "outils_interdits": list(OUTILS_INTERDITS),
                     "regle": ("noul>0,8 + confidence>0,75 -> auto borné "
                               "sinon dashboard ; confidence<0,7 -> jamais "
                               "d'auto ; hors_bornes>0,5 -> blocage ; "
                               "serrure/vanne/portail/PIN -> BLOQUÉ "
                               "toujours (consultatifs seuls)")}

    def gardien(self, logement_id, qui_id, quoi, llm=None, jev=None,
                ref="", langue=""):
        """POST /gardien : porte LLM/Jev (RBAC + outils interdits + seuils,
        puis log JSONL avec trace P7-7). Ordre : RBAC (403) -> outil
        interdit (403, même scores parfaits) -> hors_bornes>0,5 (403) ->
        confidence<0,7 (dashboard, jamais d'auto) -> noul>0,8+conf>0,75
        (auto borné) -> sinon dashboard. Références sans scores = dashboard.
        LLM/Jev consultatifs seuls : l'auto borné n'autorise que des actions
        réversibles/lisibles (jamais d'ouverture, jamais de PIN)."""
        if logement_id not in self.logts:
            return 404, {"erreur": f"logement inconnu: {logement_id}"}
        action = QUOI_VERS_ACTION.get(quoi, "etat_lecture")
        ok, msg_rbac, p = self.autoriser(qui_id, action, logement_id)
        qui = f"{qui_id}:{p.get('role')}/{p.get('sous_role')}" if p else qui_id
        llm = dict(llm or {})
        jev = dict(jev or {})
        noul, confidence, hors_bornes = self._score_jev(jev)
        trace = {"llm": {k: llm.get(k) for k in
                         ("alias", "fournisseur", "modele", "endpoint")
                         if llm.get(k) is not None},
                 "jev": {k: jev.get(k) for k in
                         ("backend", "endpoint", "modele", "confidence")
                         if jev.get(k) is not None}}
        lang = str(langue or "").lower()[:2]
        if lang not in LANGUES_SOCLE:
            lang = ""
        if not ok:
            self.log_decision(logement_id, ref or quoi, qui, quoi, None,
                              None, f"BLOQUÉ RBAC gardien : {msg_rbac}",
                              llm or None, jev or None, langue=lang)
            return 403, {"statut": "bloque", "motif": msg_rbac,
                         "trace": trace}
        if str(quoi or "").strip().lower() in OUTILS_INTERDITS:
            self.log_decision(logement_id, ref or quoi, qui, quoi, None,
                              None,
                              f"BLOQUÉ outil interdit ({quoi}) : LLM/Jev "
                              f"consultatifs seuls (KeyMaster+Nuki Hub)",
                              llm or None, jev or None, langue=lang)
            return 403, {"statut": "bloque",
                         "motif": f"outil interdit ({quoi}) : consultatifs "
                                  f"seuls, jamais d'ouverture/PIN",
                         "code": "outil_interdit", "trace": trace}
        if hors_bornes > SEUIL_HORS_BORNES_BLOCAGE:
            self.log_decision(logement_id, ref or quoi, qui, quoi, None,
                              None,
                              f"BLOQUÉ Jev hors_bornes={hors_bornes}",
                              llm or None, jev or None, langue=lang)
            return 403, {"statut": "bloque",
                         "motif": "jev_hors_bornes>0,5 : humain requis",
                         "trace": trace}
        if confidence < SEUIL_CONFIDENCE_MIN:
            self.log_decision(logement_id, ref or quoi, qui, quoi, None,
                              None,
                              f"dashboard (confidence {confidence} < 0,7 : "
                              f"jamais d'auto)", llm or None, jev or None, langue=lang)
            return 200, {"statut": "dashboard",
                         "motif": "confiance basse : jamais d'auto",
                         "confidence": confidence, "trace": trace,
                         "jamais_bloquant": True}
        if (noul > SEUIL_NOUL_AUTO
                and confidence > SEUIL_CONFIDENCE_AUTO):
            self.log_decision(logement_id, ref or quoi, qui, quoi, None,
                              None,
                              f"auto borné (noul {noul}, conf {confidence})",
                              llm or None, jev or None, langue=lang)
            return 200, {"statut": "auto_borne",
                         "motif": "seuils OK : auto borné, réversible seul",
                         "noul": noul, "confidence": confidence,
                         "trace": trace}
        self.log_decision(logement_id, ref or quoi, qui, quoi, None, None,
                          f"dashboard (noul {noul}, conf {confidence})",
                          llm or None, jev or None, langue=lang)
        return 200, {"statut": "dashboard",
                     "motif": "sous seuils auto : validation dashboard",
                     "noul": noul, "confidence": confidence,
                     "trace": trace, "jamais_bloquant": True}


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
        if url.path == "/questionnaire":
            # P6-14 §5.7-quinquies : schéma 4 blocs + pré-rempli + J1.
            # 503 si `questionnaire: off`. Jamais de PIN, jamais de hash.
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = self.engine.questionnaire_schema(
                logement_id, qs.get("ref_resa", [""])[0],
                qs.get("hash", [""])[0], qs.get("langue", ["fr"])[0])
            return self._json(code, obj)
        if url.path == "/contrat":
            # P6-15 §12.5-bis : statut contrat PWA (non_signe / signe).
            # Jamais de signature ni hash en sortie.
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = self.engine.contrat_statut(
                logement_id, qs.get("ref_resa", [""])[0])
            return self._json(code, obj)
        if url.path == "/avis":
            # P6-17 §5.7-bis : statut enquête J+1 (non_repondue / dossier).
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = self.engine.avis_statut(
                logement_id, qs.get("ref_resa", [""])[0])
            return self._json(code, obj)
        if url.path == "/scenes":
            # P6-17 §5.7-bis : 3 scènes 1-tap PWA (lecture seule).
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = self.engine.scenes(logement_id)
            return self._json(code, obj)
        if url.path == "/acces":
            # P6-20 §1.6 : audit 5 rôles (réservé super_admin/admin).
            qui = qs.get("qui", [""])[0]
            if not qui:
                return self._json(400, {"erreur": "qui requis"})
            code, obj = self.engine.acces_audit(qui)
            return self._json(code, obj)
        if url.path == "/journal":
            # P6-20 §1.6 + P7-7 : qui/quand/quoi 90 j + filtres dashboard
            # (backend Jev, alias LLM, langue).
            logement_id = qs.get("logement_id", [""])[0]
            qui = qs.get("qui", [""])[0]
            if not (logement_id and qui):
                return self._json(400, {"erreur": "logement_id, qui requis"})
            code, obj = self.engine.journal(
                logement_id, qui, qs.get("quoi", [""])[0],
                qs.get("jours", ["90"])[0],
                qs.get("backend", [""])[0],
                qs.get("alias", [""])[0],
                qs.get("langue", [""])[0])
            return self._json(code, obj)
        if url.path == "/carnet":
            # P6-21 §12.5-bis : synthèse trimestre (hôte seul, jamais audio).
            logement_id = qs.get("logement_id", [""])[0]
            qui = qs.get("qui", [""])[0]
            if not (logement_id and qui):
                return self._json(400, {"erreur": "logement_id, qui requis"})
            code, obj = self.engine.carnet(
                logement_id, qui, qs.get("trimestre", [""])[0])
            return self._json(code, obj)
        if url.path == "/registre-rgpd":
            # P6-21 : traitements + durées (lecture seule).
            logement_id = qs.get("logement_id", [""])[0]
            qui = qs.get("qui", [""])[0]
            if not (logement_id and qui):
                return self._json(400, {"erreur": "logement_id, qui requis"})
            code, obj = self.engine.registre_rgpd(logement_id, qui)
            return self._json(code, obj)
        if url.path == "/mentions-annonce":
            # P6-21 : obligatoires + renseigné/manquant (jamais inventé).
            logement_id = qs.get("logement_id", [""])[0]
            if not logement_id:
                return self._json(400, {"erreur": "logement_id requis"})
            code, obj = self.engine.mentions_annonce(logement_id)
            return self._json(code, obj)
        if url.path == "/seuils":
            # P7-6 §6.7 : seuils transverses (lecture seule).
            code, obj = self.engine.seuils()
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
        if url.path == "/questionnaire":
            # P6-14 §5.7-quinquies : dépôt 1-tap humain (201 créé / 200 maj).
            if not (p.get("logement_id") and p.get("qui") and p.get("ref_resa")):
                return self._json(
                    400, {"erreur": "logement_id, qui, ref_resa requis"})
            code, obj = self.engine.questionnaire_depot(
                p["logement_id"], p["qui"], p["ref_resa"], p.get("arrivee"),
                p.get("reponses"), p.get("optins"), p.get("hash", ""))
            return self._json(code, obj)
        if url.path == "/contrat":
            # P6-15 §12.5-bis : signature tactile 1-tap humain (201/200).
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("ref_resa")):
                return self._json(
                    400, {"erreur": "logement_id, qui, ref_resa requis"})
            code, obj = self.engine.contrat_signer(
                p["logement_id"], p["qui"], p["ref_resa"],
                p.get("nom_voyageur", ""), p.get("signature", ""),
                p.get("accepte_cgv", False), p.get("optins"),
                p.get("hash", ""))
            return self._json(code, obj)
        if url.path == "/avis":
            # P6-17 §5.7-bis : dépôt enquête J+1 1-tap humain (201/200).
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("ref_resa") is not None):
                return self._json(
                    400, {"erreur": "logement_id, qui, ref_resa requis"})
            if "note" not in p:
                return self._json(400, {"erreur": "note 1-5 requise"})
            code, obj = self.engine.avis_depot(
                p["logement_id"], p["qui"], p["ref_resa"], p["note"],
                p.get("commentaire", ""), p.get("langue", "fr"))
            return self._json(code, obj)
        if url.path == "/avis-geste":
            # P6-17 §5.7-bis : validation 1-tap HUMAINE du geste.
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("ref_resa") and p.get("geste")):
                return self._json(
                    400, {"erreur": "logement_id, qui, ref_resa, geste requis"})
            code, obj = self.engine.avis_geste(
                p["logement_id"], p["qui"], p["ref_resa"], p["geste"],
                p.get("montant_eur", 0))
            return self._json(code, obj)
        if url.path == "/avis-reponse":
            # P6-17 §5.7-bis : pré-réponse (brouillon puis validation 1-tap).
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("ref_resa") and p.get("action")):
                return self._json(
                    400, {"erreur": "logement_id, qui, ref_resa, action requis"})
            code, obj = self.engine.avis_reponse(
                p["logement_id"], p["qui"], p["ref_resa"], p["action"],
                p.get("texte", ""))
            return self._json(code, obj)
        if url.path == "/scene":
            # P6-17 §5.7-bis : activation scène 1-tap HUMAIN.
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("scene")):
                return self._json(
                    400, {"erreur": "logement_id, qui, scene requis"})
            code, obj = self.engine.scene_activer(
                p["logement_id"], p["qui"], p["scene"],
                p.get("ref_resa", ""))
            return self._json(code, obj)
        if url.path == "/acces-revoquer":
            # P6-20 §1.6 : révocation 1-tap super_admin/admin (jamais
            # soi-même, jamais super_admin).
            if not (p.get("qui") and p.get("personne_id")):
                return self._json(
                    400, {"erreur": "qui, personne_id requis"})
            code, obj = self.engine.acces_revoquer(
                p["qui"], p["personne_id"], p.get("motif", ""))
            return self._json(code, obj)
        if url.path == "/acces-reactiver":
            # P6-20 §1.6 : levée de révocation (expire_le passé = reste
            # expiré, éditer acces.yaml sur box).
            if not (p.get("qui") and p.get("personne_id")):
                return self._json(
                    400, {"erreur": "qui, personne_id requis"})
            code, obj = self.engine.acces_reactiver(
                p["qui"], p["personne_id"])
            return self._json(code, obj)
        if url.path == "/preuve-db":
            # P6-21 §12.5-bis : relevé dB seul (capteur/humain, jamais audio).
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            if p.get("db") is None:
                return self._json(400, {"erreur": "db requis (dB seuls)"})
            code, obj = self.engine.preuve_db(
                p["logement_id"], p["qui"], p["db"],
                p.get("heure", ""), p.get("occupation", ""))
            return self._json(code, obj)
        if url.path == "/preuve-attestation":
            # P6-21 : intervention/ménage/message versés au carnet.
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("type")):
                return self._json(
                    400, {"erreur": "logement_id, qui, type requis"})
            code, obj = self.engine.preuve_attestation(
                p["logement_id"], p["qui"], p["type"],
                p.get("ref", ""), p.get("detail", ""))
            return self._json(code, obj)
        if url.path == "/lettre-tranquillite":
            # P6-21 : brouillon chiffré (hôte seul, humain envoie ensuite).
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            code, obj = self.engine.lettre_tranquillite(
                p["logement_id"], p["qui"],
                p.get("trimestre", ""), p.get("destinataire", "syndic"))
            return self._json(code, obj)
        if url.path == "/lettre-envoyer":
            # P6-21 : envoi 1-tap humain via messagerie tracée.
            if not (p.get("logement_id") and p.get("qui")):
                return self._json(
                    400, {"erreur": "logement_id, qui requis"})
            code, obj = self.engine.lettre_envoyer(
                p["logement_id"], p["qui"],
                p.get("trimestre", ""), p.get("canal", ""))
            return self._json(code, obj)
        if url.path == "/gardien":
            # P7-6 §6.7 : porte LLM/Jev (RBAC + outils + seuils + trace).
            if not (p.get("logement_id") and p.get("qui")
                    and p.get("quoi")):
                return self._json(
                    400, {"erreur": "logement_id, qui, quoi requis"})
            code, obj = self.engine.gardien(
                p["logement_id"], p["qui"], p["quoi"],
                p.get("llm"), p.get("jev"), p.get("ref", ""),
                p.get("langue", ""))
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
    acces, doublons = lire_acces(args.acces)
    if not acces:
        print(f"acces introuvable ou vide: {args.acces}", file=sys.stderr)
        return 2
    secrets = charger_yaml_plat(os.environ.get("LCD_SECRETS_YAML", "./secrets.yaml"))
    branding = charger_branding(args.branding)  # PRIVÉ, absent = {} (jamais commité)
    eng = Moteur(cfg, logts, acces, secrets, branding, args.memoire,
                 doublons)
    Handler.engine = eng

    if args.check or not args.serve:
        for log in logts:
            res, err = eng.etat(log)
            print(json.dumps(res or {"erreur": err}, ensure_ascii=False)[:400] + "...")
        print("config_ok:", eng.pousser_config_ok())
        # P6-20 §1.6 : audit comptes (MFA exigée, expiry, doublons).
        sans_mfa = sorted(pid for pid, p in acces.items()
                          if (p.get("role"), p.get("sous_role")) in MFA_EXIGEE
                          and not p.get("mfa"))
        expires = sorted(pid for pid, p in acces.items()
                         if p.get("expire_le"))
        print(f"acces_mfa: {len(sans_mfa)} sans 2FA {sans_mfa} "
              f"(activer sur box HA puis mfa:true)")
        print(f"acces_expires: {expires} ; acces_doublons: {doublons}")
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
