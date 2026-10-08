# Guide voyageur — {{ logement }} ({{ marque }})
# Template docs/templates/ — QR pièces + WiFi <3s + consignes (volet §5.7).
# Variables : {{ marque }}, {{ logement }}, {{ wifi_qr }}, {{ tel_urgence }}.

## Arrivée
- Adresse + boîte / PIN selon {{ logement }} (smart_lock on/off).
- WiFi : flasher {{ wifi_qr }} (<3 s).

## Séjour
- Chauffage : Confort 19 / Eco 16, bridage 21 °C.
- Clim : bornes 19-21,5 chaud / 25-27 froid.
- Extras : pré-commande J-1 18h via PWA.

## Départ
- Checklist PWA 30 s + photos : fenêtres fermées, clim/chaud coupés, LV/LL
  vidés et lancés, poubelles sorties (tri Métropole NCA), bagages consignés si besoin.
- Porte : code révoqué départ+30 min (PIN à usage unique, jamais réutilisé).
- Urgence : {{ tel_urgence }}.
