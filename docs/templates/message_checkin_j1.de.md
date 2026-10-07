# Nachricht J-1 15h — Erinnerung (DE validiert menschlich §5.7-ter)
# Template docs/templates/ — nur Erinnerung, kein erneuter PIN-Versand (§5.2, Blueprint arrivee.yaml id j1).
# Zusammengestellt von decision-engine (Gästesprache). Signiert {{ marque }}, niemals „LCD/HA".
# Variablen: {{ marque }}, {{ logement }}, {{ heure_arrivee }}, {{ adresse }},
# {{ wifi_qr }}, {{ tel_urgence }}, {{ lien_guide }}.
# Platzhalter {{ }} UNANTASTBAR (§5.7-ter).

Erinnerung {{ marque }} — Anreise morgen {{ logement }}.

Adresse: {{ adresse }}.
Voraussichtliche Ankunft: {{ heure_arrivee }}.
WLAN: {{ wifi_qr }}.

Führer: {{ lien_guide }}
Notfall: {{ tel_urgence }}. Gute Reise!
— {{ marque }}
