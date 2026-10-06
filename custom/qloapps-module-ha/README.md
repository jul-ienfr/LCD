# custom/qloapps-module-ha/README.md — module maison QloApps → ics-sync (Phase 2, §4-bis P2-2).
# Transitoire Phase 1 (`moteur_direct: qloapps`) — sortie booking-direct maison Phase 2+
# (FastAPI ~200 lignes, bascule 1 flag + 1 séjour témoin + QloApps fallback 1 mois, P2-15).
# Récupérable OSL 3.0 : règles métier (mapping champs, idempotence), jamais le PHP.
# À jeter : PHP/Webservice XML/BO (remplacés par l'interface ci-dessous).
#
# ## Chaîne (contrat stable — ne PAS changer sans MAJ ics-sync)
# QloApps --POST /resa-direct--> ics-sync (même LXC `127.0.0.1:8090`, sans token :
# réseau local seul) --events + `calendar.logX_planning`--> HA (LAN, token
# `ha_api_token`, occupation <60 s, P2-14).
# Jamais de POST direct QloApps → HA : idempotence par `ref` + arbitrage
# direct>OTA + JSONL vivent dans ics-sync (`custom/ics-sync/ics_sync.py#resa_directe`).
#
# ## Hook (côté QloApps, PHP minimal — seul code QloApps/PHP du projet)
# `lcd_ha_hook.php` : `actionValidateOrderAfter` → POST JSON
# `{ref, logement_id, debut, fin (AAAA-MM-JJ), voyageurs, langue, montant, extras[]}`
# vers `<LCDICS_URL>/resa-direct` (config BO, jamais en dur).
# Réponses : `201` créée (+ `net_hote`) / `200` déjà connue (retry idempotent) /
# `400` champ manquant / `404` logement inconnu. Logs + retry 3×/5 min côté module,
# alerte humain après 3 échecs (jamais silencieux).
# Install : copier dans `/modules/lcdha/lcdha.php` (module minimal) OU coller
# `buildPayload()`+`pushWithRetry()` dans un override existant.
#
# ## Champs custom QloApps (P2-3, FAIT 2026-10-06 — reste branchement box)
# Spec `champs_custom.md` (§5.2, §5.7-ter) : 6 champs (lcd_langue, lcd_heure_arrivee,
# lcd_voyageurs_adultes/enfants, lcd_taxe_sejour CASA +44 %, lcd_extras §5.6-ter)
# + dates HotelReservation (pas dates commande) + gabarits `docs/templates/`
# (message_checkin_j2.md FR source, message_checkin_j1.md FR source, socle 5).
# `buildPayload()` lit tout via lireDatesSejour()/lireCustom()/lireExtras()
# (TODO-BOX = noms réels table/colonnes + mécanisme custom à valider sur box P2-1 ;
# défauts spec en attendant, jamais de POST aveugle). Contrat étendu P2-3 :
# {ref, logement_id, debut, fin, voyageurs (=adultes+enfants réel), langue (ISO tel
# quel), heure_arrivee (HH:MM → pré-chauffe/ECS §5.11), taxe_sejour (€ hors CA),
# montant, extras[] (refs catalogue prix TTC, cut-off J-1 18h)} — rétro-compatible.
# ics-sync stocke heure_arrivee/taxe_sejour (défauts 17:00/0.0) + les propage aux
# events J-2/J-1 (messages langue voyageur, decision-engine `emettre_event()`,
# jamais blueprints). Tests verts 2026-10-06 : 201 + net_hote 460.0, retry → 200,
# /dispo conflit_ref, state {langue es, heure_arrivee 19:30, taxe 13.8, extras 2} ✓.
# Mapping `id_product → logement_id` à renseigner (table vide = POST bloqué + log).
# Clé Webservice dédiée lecture/prix seule (P2-1) : `qloapps_webservice_key` (`secrets.yaml`).
#
# ## Fichiers
# - `lcd_ha_hook.php` : code réel (aligné sur le contrat `resa_directe` ics-sync).
# - Testé 2026-10-06 : payload type buildPayload → `POST /resa-direct` local
#   (serveur ics-sync stdlib) : `201` + `net_hote` commission 0.00, rejouée → `200`
#   idempotent, `/dispo` chevauchement → `disponible: false` + `conflit_ref` ✓ ;
#   `php -l` : pas d'erreur (ou PHP absent box LAMP P2-1, lint sur box).
#   Secrets : aucun (réseau local seul) ; token HA côté ics-sync (`ha_api_token`).
