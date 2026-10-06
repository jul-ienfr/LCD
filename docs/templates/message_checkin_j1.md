# Message J-1 15h — rappel (FR source, validée humain)
# Template docs/templates/ — rappel seul, pas de re-push PIN (§5.2, blueprint arrivee.yaml id j1).
# Composé par decision-engine (langue voyageur). Signé {{ marque }}, jamais « LCD/HA ».
# Variables : {{ marque }}, {{ logement }}, {{ pin }}, {{ heure_arrivee }}, {{ adresse }},
# {{ wifi_qr }}, {{ tel_urgence }}, {{ lien_guide }}.
# Placeholders {{ }} INTOUCHABLES par la traduction (§5.7-ter).

Rappel {{ marque }} — arrivée demain {{ logement }}.

Votre code : {{ pin }}. Adresse : {{ adresse }}.
Arrivée estimée : {{ heure_arrivee }}.
WiFi : {{ wifi_qr }}.

Guide : {{ lien_guide }}
Urgence : {{ tel_urgence }}. Bon voyage !
— {{ marque }}
