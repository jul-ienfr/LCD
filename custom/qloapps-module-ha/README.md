# custom/qloapps-module-ha/README.md — module maison QloApps → HA (Phase 2, §4-bis P2-2).
# Transitoire Phase 1 (`moteur_direct: qloapps`) — sortie booking-direct maison Phase 2+
# (FastAPI ~200 lignes, bascule 1 flag + 1 séjour témoin + QloApps fallback 1 mois, P2-15).
# Récupérable OSL 3.0 : règles métier (mapping champs, idempotence), jamais le PHP.
# À jeter : PHP/Webservice XML/BO (remplacés par l'interface ci-dessous).
#
# ## Hook (côté QloApps, PHP minimal — seul code QloApps du projet)
# `actionValidateOrderAfter` → POST JSON vers `http://ha:8123/api/webhook/resa-logX`
# (LAN/WireGuard ; token dans `secrets.yaml`, header `X-LCD-Token`) :
# `{ref, logement_id, dates: {arrivee, depart}, voyageurs, langue, montant, extras[]}`.
# Idempotence par `ref` (retry même ref = 1 seule résa). Logs + retry 3×/5 min côté module.
#
# ## Côté HA (réception — webhook REST natif, automation ou pyscript)
# - Vérifie token + `ref` inconnu → crée/MAJ `calendar.logX_planning` + `input_boolean.logX_occupation`
#   + `input_text.logX_langue_voyageur` → decision-engine émet `lcd_j2_envoi_acces`
#   (<60 s, P2-14) → blueprint arrivée (PIN J-2).
# - Champs custom QloApps (P2-3) : langue, heure arrivée, taxe CASA (+44 %) + mails/SMS
#   check-in socle 5 (templates `docs/templates/`, placeholders `{{ }}` intouchables).
# - Clé Webservice dédiée lecture/prix seule (P2-1) : `qloapps_webservice_key` (`secrets.yaml`).
