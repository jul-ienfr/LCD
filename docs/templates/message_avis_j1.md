# Message J+1 — enquête satisfaction (FR source, validée humain)
# Template docs/templates/ — composé par decision-engine `emettre_event()`
# (langue voyageur socle + auto §5.7-ter). Signé {{ marque }}, jamais « LCD/HA ».
# Variables : {{ marque }}, {{ logement }}, {{ lien_avis }}, {{ lien_guide }}, {{ tel_urgence }}.
# Placeholders {{ }} INTOUCHABLES par la traduction (§5.7-ter) : montants, dates,
# heures, adresses, PIN/codes, noms propres = injectés APRÈS traduction.
# Règle §5.7-bis : >=4★ → lien public ; <4★ → rattrapage privé (jamais de lien public forcé).
# Jamais de PIN en clair dans logs/recorder/logbook (excludes configuration.yaml).

Merci d'avoir séjourné {{ logement }} avec {{ marque }} !

Votre avis en 30 s : {{ lien_avis }}
Si tout était parfait (4-5★), votre avis public nous aide énormément.
En cas de souci (<4★), dites-le-nous en privé via le même lien :
on vous répond en <15 min (8h-22h) et on rattrape avant tout avis public.

Guide du logement (souvenir / retour) : {{ lien_guide }}
Urgence post-séjour : {{ tel_urgence }}.
— {{ marque }}
