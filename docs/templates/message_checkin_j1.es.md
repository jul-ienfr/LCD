# Mensaje J-1 15h — recordatorio (ES validada humana §5.7-ter)
# Template docs/templates/ — recordatorio solo, sin reenvío PIN (§5.2, blueprint arrivee.yaml id j1).
# Compuesto por decision-engine (idioma viajero). Firmado {{ marque }}, nunca « LCD/HA ».
# Variables: {{ marque }}, {{ logement }}, {{ heure_arrivee }}, {{ adresse }},
# {{ wifi_qr }}, {{ tel_urgence }}, {{ lien_guide }}.
# Placeholders {{ }} INTOCABLES (§5.7-ter).

Recordatorio {{ marque }} — llegada mañana {{ logement }}.

Dirección: {{ adresse }}.
Llegada estimada: {{ heure_arrivee }}.
WiFi: {{ wifi_qr }}.

Guía: {{ lien_guide }}
Urgencia: {{ tel_urgence }}. ¡Buen viaje!
— {{ marque }}
