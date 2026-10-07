# Mensaje J+1 — encuesta satisfacción (ES validada humana §5.7-ter)
# Template docs/templates/ — compuesto por decision-engine `emettre_event()`.
# Firmado {{ marque }}, nunca « LCD/HA ».
# Variables: {{ marque }}, {{ logement }}, {{ lien_avis }}, {{ lien_guide }}, {{ tel_urgence }}.
# Placeholders {{ }} INTOCABLES (§5.7-ter).
# Regla §5.7-bis: >=4★ → enlace público ; <4★ → recuperación privada.

¡Gracias por su estancia {{ logement }} con {{ marque }}!

Su opinión en 30 s: {{ lien_avis }}
Si todo fue perfecto (4-5★), su reseña pública nos ayuda enormemente.
Si hubo algún problema (<4★), díganoslo en privado por el mismo enlace:
respondemos en <15 min (8h-22h) y lo resolvemos antes de cualquier reseña pública.

Guía del alojamiento (recuerdo / regreso): {{ lien_guide }}
Urgencia post-estancia: {{ tel_urgence }}.
— {{ marque }}
