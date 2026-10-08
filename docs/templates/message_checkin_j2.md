# Message J-2 — envoi accès (FR source, validée humain)
# Template docs/templates/ — composé par decision-engine `emettre_event()`
# (langue voyageur), jamais par les blueprints. Signé {{ marque }}, jamais « LCD/HA ».
# Variables : {{ marque }}, {{ logement }}, {{ pin }}, {{ slot_nom }}, {{ arrivee }},
# {{ depart }}, {{ wifi_qr }}, {{ heure_arrivee }}, {{ adresse }}, {{ tel_urgence }},
# {{ lien_questionnaire }}, {{ lien_guide }}, {{ lien_pwa }}.
# Placeholders {{ }} INTOUCHABLES par la traduction (§5.7-ter) : montants, dates,
# heures, adresses, PIN/codes, noms propres = injectés APRÈS traduction.
# Si pin vide (log2 smart_lock off) → decision-engine pose message_boite_cles
# et le message devient consigne boîte à clés (pas de MQTT, §5.2).
# PIN : jamais en clair dans logs/recorder/logbook (excludes configuration.yaml).

Bonjour et bienvenue {{ marque }} ! Votre séjour {{ logement }} approche.

Accès : votre code personnel est {{ pin }} (actif du {{ arrivee }} au {{ depart }}).
Adresse : {{ adresse }}.
Arrivée estimée : {{ heure_arrivee }} — pré-chauffe calée automatiquement.

WiFi : flashez {{ wifi_qr }} (connexion <3 s).

Avant votre arrivée (3 min) : {{ lien_questionnaire }}
Guide du logement : {{ lien_guide }}
Votre espace séjour (PWA) : {{ lien_pwa }} — QR salon à l'entrée pour le tour des pièces.

Urgence sur place : {{ tel_urgence }}.
— {{ marque }}
