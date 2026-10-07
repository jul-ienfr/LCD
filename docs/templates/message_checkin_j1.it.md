# Messaggio J-1 15h — promemoria (IT validata umana §5.7-ter)
# Template docs/templates/ — solo promemoria, nessun re-invio PIN (§5.2, blueprint arrivee.yaml id j1).
# Composto da decision-engine (lingua viaggiatore). Firmato {{ marque }}, mai « LCD/HA ».
# Variabili: {{ marque }}, {{ logement }}, {{ heure_arrivee }}, {{ adresse }},
# {{ wifi_qr }}, {{ tel_urgence }}, {{ lien_guide }}.
# Placeholder {{ }} INTOCCABILI (§5.7-ter).

Promemoria {{ marque }} — arrivo domani {{ logement }}.

Indirizzo: {{ adresse }}.
Arrivo stimato: {{ heure_arrivee }}.
WiFi: {{ wifi_qr }}.

Guida: {{ lien_guide }}
Emergenza: {{ tel_urgence }}. Buon viaggio!
— {{ marque }}
