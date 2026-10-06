# Fiche mission presta — {{ logement }} ({{ marque }})
# Template docs/templates/ — 1 logement / 1 fenêtre mission. QR entrée + photos avant/après.
# Dispatch : métier + zone + RC (§12.4-bis). Pas de codes complets (slot mission seul).

- Logement : {{ logement }}
- Fenêtre : {{ debut }} → {{ fin }}
- Tâches : voir todo mission (checklist PWA).
- Photos : avant/après obligatoires → /config/interventions/{{ logement }}/{{ date }}_{{ presta }}_{{ motif }}/
- Pointage : arrivée/départ PWA. Facture : dépôt PWA.
- Accès expiré fin mission auto. Urgence : {{ tel_urgence }}.
