# Message J-1 15h — reminder (EN source, validated human §5.7-ter)
# Template docs/templates/ — reminder only, no PIN re-push (§5.2, blueprint arrivee.yaml id j1).
# Composed by decision-engine (voyager language). Signed {{ marque }}, never "LCD/HA".
# Variables: {{ marque }}, {{ logement }}, {{ heure_arrivee }}, {{ adresse }},
# {{ wifi_qr }}, {{ tel_urgence }}, {{ lien_guide }}.
# Placeholders {{ }} UNTOUCHABLE by translation (§5.7-ter).

Reminder {{ marque }} — arrival tomorrow {{ logement }}.

Address: {{ adresse }}.
Estimated arrival: {{ heure_arrivee }}.
WiFi: {{ wifi_qr }}.

Guide: {{ lien_guide }}
Emergency: {{ tel_urgence }}. Safe travels!
— {{ marque }}
