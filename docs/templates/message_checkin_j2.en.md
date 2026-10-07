# Message J-2 — access delivery (EN source, validated human §5.7-ter)
# Template docs/templates/ — composed by decision-engine `emettre_event()`
# (voyager language), never by blueprints. Signed {{ marque }}, never "LCD/HA".
# Variables: {{ marque }}, {{ logement }}, {{ pin }}, {{ slot_nom }}, {{ arrivee }},
# {{ depart }}, {{ wifi_qr }}, {{ heure_arrivee }}, {{ adresse }}, {{ tel_urgence }},
# {{ lien_questionnaire }}, {{ lien_guide }}.
# Placeholders {{ }} UNTOUCHABLE by translation (§5.7-ter).
# If pin empty (log2 smart_lock off) → decision-engine sets message_boite_cles
# and message becomes lockbox instruction (no MQTT, §5.2).
# PIN: never in clear in logs/recorder/logbook (excludes configuration.yaml).

Hello and welcome {{ marque }}! Your stay {{ logement }} is coming soon.

Access: your personal code is {{ pin }} (active from {{ arrivee }} to {{ depart }}).
Address: {{ adresse }}.
Estimated arrival: {{ heure_arrivee }} — pre-heating set automatically.

WiFi: scan {{ wifi_qr }} (connection <3 s).

Before arrival (3 min): {{ lien_questionnaire }}
Property guide: {{ lien_guide }}

Emergency on site: {{ tel_urgence }}.
— {{ marque }}
