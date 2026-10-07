# Message J+1 — satisfaction survey (EN source, validated human §5.7-ter)
# Template docs/templates/ — composed by decision-engine `emettre_event()`
# (voyager language socle + auto §5.7-ter). Signed {{ marque }}, never "LCD/HA".
# Variables: {{ marque }}, {{ logement }}, {{ lien_avis }}, {{ lien_guide }}, {{ tel_urgence }}.
# Placeholders {{ }} UNTOUCHABLE by translation (§5.7-ter).
# Rule §5.7-bis: >=4★ → public link ; <4★ → private recovery (never force public link).
# Never log PIN in clear (excludes configuration.yaml).

Thanks for staying {{ logement }} with {{ marque }}!

Your 30 s review: {{ lien_avis }}
If everything was perfect (4-5★), your public review helps us enormously.
If anything was wrong (<4★), tell us privately via the same link:
we reply in <15 min (8am-10pm) and fix it before any public review.

Property guide (souvenir / return): {{ lien_guide }}
Post-stay emergency: {{ tel_urgence }}.
— {{ marque }}
