# custom/decision-engine/README.md — orchestrateur maison pyscript/AppDaemon (Phase 2, §5.11 P2-8).
# 100 % gratuit, 0 € logiciel. Lit `custom/logements.yaml` (flags) + `custom/acces.yaml` (RBAC).
# Règles prioritaires : sécurité > occupation > énergie > confort > prix.
# Log JSONL : `/config/logs/decision.logX.jsonl` (qui/quand/quoi + llm/jev backend, 90 j accès).
# Bornes prix 75/290 inviolables en code. LLM/Jev consultatifs seuls, jamais d'action directe.
#
# ## Events émis (contrats stables — déclencheurs blueprints P1-8)
# - `lcd_j2_envoi_acces {logement_id, pin, slot_nom, arrivee, depart, message}`
#   (J-2 ; log2 smart_lock off → pin vide + message boîte à clés).
# - `lcd_j1_rappel {logement_id, message}` (J-1 15h).
# - `lcd_checkout {logement_id, pin, deadline_menage, message}` (checkout ; révocation + todo).
# - Messages composés ici (langue voyageur socle + auto §5.7-ter), jamais par les blueprints.
#
# ## Phrases 1-tap P6-11 (§5.7-ter) — GET /phrases?logement_id=log1[&cle=...&langue=...&var=...]
# - Sans cle -> catalogue (20 cles critiques, 5 langues socle FR/EN/ES/IT/DE).
# - Avec cle -> phrase rendue localisee (hors socle -> fallback EN + traduction_auto,
#   badge "[traduction automatique]" a poser par l'appelant), placeholders logement
#   injectes APRES choix langue (jamais traduits : heures_calmes/occupants_max du
#   logement + defaults marque/tel_urgence/liens, donnees fournies priment).
# - Jamais de PIN ni secret (ni en entree ni en sortie : pin/code/message ignores).
#   Reponse SURE loggable (phrase + metadonnees, comme /event).
#
# ## Mémoire voyageur P6-12 (§5.7-quater) — GET/POST /memoire
# - Opt-in séjour seul, 1-tap révocable, geste HUMAIN seul (qui != auto/llm/jev/
#   moteur-*). Registre `custom/memoire/voyageurs.yaml` (box) : hash sha256 seul,
#   jamais de CSI brut, jamais d'effet prix (art.225-1).
# - GET /memoire?logement_id=log1&hash=<hex64> -> fiche SÛRE loggable
#   (langue/consignes/extras_favoris, jamais le hash) ou 404 (inconnu/opt-out/expiré).
# - POST /memoire {action: optin/optout/purge, ...} -> opt-in (crée/maj fiche,
#   dernier_sejour = jour J), opt-out (oubli IMMÉDIAT, idempotent), purge
#   (dernier_sejour > 730 j = 24 mois). Présence 90 j = logs JSONL.
# - Returning J-2 : data.hash reconnu (fiche opt-in valide) -> langue fiche si
#   absente + « Bon retour ! » localisé socle 5 ; hash jamais transmis ni loggé.
#   Jamais de PIN ni secret ici (ni entrée ni sortie).
# - P6-13 (§5.6) : prefs ménage intermédiaire (menage_frequence_j 0-30,
#   menage_heure_pref HH:MM, menage_pendant_absence oui/non) posées à
#   l'opt-in, exposées SÛRES au pré-remplissage ; dispatchées par
#   POST /menage-intermediaire côté dispatch-presta (dates certaines).
# - P6-14 (§5.7-quinquies) : questionnaire J-2 GET/POST /questionnaire —
#   1 lien PWA+PIN, 3 min, pré-rempli mémoire si hash reconnu, 4 blocs
#   (arrivee/preferences/extras/contrat), M2 « On a compris : … Corriger ? »
#   + correction 1-tap (même ref = 200), M3 suggestions max 3 filtrées
#   allergènes (prix JAMAIS ici, art. 225-1), cut-off extras J-1 18h =
#   statut cutoff_depasse (jamais bloquant), J1 complétude (incomplet ->
#   relance_auto ciblée). Garde-fous : qui HUMAIN seul, ref_resa slug seule,
#   nb_voyageurs <= occupants_max copro, chauffage clampé 21 °C, jamais PIN
#   ni hash en sortie. Stockage runtime `questionnaire-<logX>.json` (gitignoré).
#
# ## Règles
# - Ne génère JAMAIS de PIN (KeyMaster + Nuki Hub seuls, §1.6) ; ne fait JAMAIS de tool-calling
#   serrure/vanne/portail direct — passe par blueprints + vérif état.
# - `copro.verifiee: false` → mise en ligne BLOQUÉE + `sensor.logX_config_ok` rouge.
# - RBAC double filtre : `acces.yaml` + `visibility:` dashboards ; journal tagué rôle+marque.
# - Hors bornes prix / hors scope RBAC (`hors_bornes>0,5`) → blocage + log, jamais d'auto.
# - Secrets (tokens webhook) dans `secrets.yaml`, jamais ici.
#
# ## Schéma decision.logX.jsonl (P1-10/P2-8/P7-7 — runtime `/config/logs/`, gitignoré, 90 j accès)
# {"ts": "...", "logement_id": "log1", "ref": "...", "qui": "decision-engine|humain:<role>", "quoi": "prix|acces|ics|energie|securite|llm|jev|menage|compta", "canal": "direct|airbnb|booking|abritel|expedia", "commission": 0.0, "net_hote": 0.0, "llm": {"alias": "...", "fournisseur": "...", "modele": "...", "tokens": 0, "latence_ms": 0}, "jev": {"backend": "...", "confidence": 0.0, "noul": 0.0}, "motif": "..."}
#
# ## Fichiers
# - `decision.py` : code réel (stdlib seule) — `/etat` + `/autoriser` + `/decision`
#   (porte unique RBAC + copro + bornes + Jev hors_bornes) + `/event`
#   (lcd_j2_envoi_acces/lcd_j1_rappel/lcd_checkout -> HA, PIN jamais généré ici) +
#   `--check` (copro + sensor.logX_config_ok) + `--serve` (:8092).
# - `config.yaml` : URLs HA/ics-sync/pricing, commissions §4 (net_hôte JSONL,
#   expedia → null), ports/chemins (surcharge env `LCD_*`). Secrets JAMAIS ici.
# - `decision.service` : systemd même LXC (`After=ics-sync+pricing`).
# - Testé 2026-10-06 : 7/7 verts — RBAC (opérateur ménage log1 oui, comptable non,
#   opérateur log2 hors périmètre non), prix 50 → 422 sans motif humain,
#   Jev hors_bornes 0,7 → 403, event J-2 copro false → 403 BLOQUÉE,
#   prix 120 direct → autorisé + JSONL commission 0.0/net_hote 120.0 ✓ ;
#   copro false → config_ok off + alerte mise en ligne BLOQUÉE ✓.
#   Secrets : `LCD_HA_TOKEN` > `ha_api_token`, lecture prix via `LCD_PRICING_URL`.
