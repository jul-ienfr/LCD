# Mensaje J-2 — envío acceso (ES validada humana §5.7-ter)
# Template docs/templates/ — compuesto por decision-engine `emettre_event()`.
# Firmado {{ marque }}, nunca « LCD/HA ».
# Variables: {{ marque }}, {{ logement }}, {{ pin }}, {{ slot_nom }}, {{ arrivee }},
# {{ depart }}, {{ wifi_qr }}, {{ heure_arrivee }}, {{ adresse }}, {{ tel_urgence }},
# {{ lien_questionnaire }}, {{ lien_guide }}.
# Placeholders {{ }} INTOCABLES (§5.7-ter).
# Si pin vacío (log2 smart_lock off) → message_boite_cles, consigna caja llaves (sin MQTT, §5.2).

Hola y bienvenido {{ marque }}. Su estancia {{ logement }} se acerca.

Acceso: su código personal es {{ pin }} (activo del {{ arrivee }} al {{ depart }}).
Dirección: {{ adresse }}.
Llegada estimada: {{ heure_arrivee }} — precalentamiento automático.

WiFi: escanear {{ wifi_qr }} (conexión <3 s).

Antes de llegar (3 min): {{ lien_questionnaire }}
Guía del alojamiento: {{ lien_guide }}

Urgencia en el lugar: {{ tel_urgence }}.
— {{ marque }}
