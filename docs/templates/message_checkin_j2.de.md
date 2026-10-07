# Nachricht J-2 — Zugangsversand (DE validiert menschlich §5.7-ter)
# Template docs/templates/ — zusammengestellt von decision-engine `emettre_event()`.
# Signiert {{ marque }}, niemals „LCD/HA".
# Variablen: {{ marque }}, {{ logement }}, {{ pin }}, {{ slot_nom }}, {{ arrivee }},
# {{ depart }}, {{ wifi_qr }}, {{ heure_arrivee }}, {{ adresse }}, {{ tel_urgence }},
# {{ lien_questionnaire }}, {{ lien_guide }}.
# Platzhalter {{ }} UNANTASTBAR (§5.7-ter).
# Wenn pin leer (log2 smart_lock off) → message_boite_cles, Schlüsselbox-Anweisung (kein MQTT, §5.2).

Hallo und willkommen {{ marque }}! Ihr Aufenthalt {{ logement }} naht.

Zugang: Ihr persönlicher Code ist {{ pin }} (aktiv von {{ arrivee }} bis {{ depart }}).
Adresse: {{ adresse }}.
Voraussichtliche Ankunft: {{ heure_arrivee }} — Vorheizen automatisch.

WLAN: {{ wifi_qr }} scannen (Verbindung <3 s).

Vor Anreise (3 Min.): {{ lien_questionnaire }}
Unterkunftsführer: {{ lien_guide }}

Notfall vor Ort: {{ tel_urgence }}.
— {{ marque }}
