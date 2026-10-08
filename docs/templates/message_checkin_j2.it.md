# Messaggio J-2 — invio accesso (IT validata umana §5.7-ter)
# Template docs/templates/ — composto da decision-engine `emettre_event()`.
# Firmato {{ marque }}, mai « LCD/HA ».
# Variabili: {{ marque }}, {{ logement }}, {{ pin }}, {{ slot_nom }}, {{ arrivee }},
# {{ depart }}, {{ wifi_qr }}, {{ heure_arrivee }}, {{ adresse }}, {{ tel_urgence }},
# {{ lien_questionnaire }}, {{ lien_guide }}, {{ lien_pwa }}.
# Placeholder {{ }} INTOCCABILI (§5.7-ter).
# Se pin vuoto (log2 smart_lock off) → message_boite_cles, istruzione cassetta chiavi (no MQTT, §5.2).

Buongiorno e benvenuto {{ marque }}! Il vostro soggiorno {{ logement }} si avvicina.

Accesso: il vostro codice personale è {{ pin }} (attivo dal {{ arrivee }} al {{ depart }}).
Indirizzo: {{ adresse }}.
Arrivo stimato: {{ heure_arrivee }} — preriscaldamento automatico.

WiFi: scansionare {{ wifi_qr }} (connessione <3 s).

Prima dell'arrivo (3 min): {{ lien_questionnaire }}
Guida dell'alloggio: {{ lien_guide }}
Il tuo spazio (PWA): {{ lien_pwa }} — QR del salotto all'ingresso per il tour delle stanze.

Emergenza sul posto: {{ tel_urgence }}.
— {{ marque }}
