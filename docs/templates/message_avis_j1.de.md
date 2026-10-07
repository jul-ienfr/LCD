# Nachricht J+1 — Zufriedenheitsumfrage (DE validiert menschlich §5.7-ter)
# Template docs/templates/ — zusammengestellt von decision-engine `emettre_event()`.
# Signiert {{ marque }}, niemals „LCD/HA".
# Variablen: {{ marque }}, {{ logement }}, {{ lien_avis }}, {{ lien_guide }}, {{ tel_urgence }}.
# Platzhalter {{ }} UNANTASTBAR (§5.7-ter).
# Regel §5.7-bis: >=4★ → öffentlicher Link ; <4★ → private Nachbesserung.

Danke für Ihren Aufenthalt {{ logement }} mit {{ marque }}!

Ihre Bewertung in 30 s: {{ lien_avis }}
Wenn alles perfekt war (4-5★), hilft uns Ihre öffentliche Bewertung enorm.
Bei Problemen (<4★) sagen Sie es uns privat über denselben Link:
wir antworten in <15 min (8-22h) und beheben es vor jeder öffentlichen Bewertung.

Unterkunftsführer (Erinnerung / Rückkehr): {{ lien_guide }}
Notfall nach Aufenthalt: {{ tel_urgence }}.
— {{ marque }}
