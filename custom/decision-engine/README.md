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
# - P6-15 (§12.5-bis) : contrat PWA 30 s GET/POST /contrat — CGV 1 page +
#   signature tactile + opt-ins (mémoire, géoloc, CRM retour −10 % direct si
#   `crm_retour: on`). Geste HUMAIN seul, ref_resa slug seule, accepte_cgv
#   true exigé (422 cgv_requise), tactile >= 8 exigée (422 signature_requise,
#   sha256 + longueur seuls stockés, raw jamais persisté ni loggé). 201 créé /
#   200 re-signé. PDF horodaté runtime `contrats/logX/<ref>_contrat.pdf`
#   (box /config/contrats/, gitignoré, généré facturation :8093 sur box ;
#   ici preuve horodatée + référence). Lie questionnaire (accepte_cgv=true
#   sans écraser). J-2 direct sans contrat = pin_autorise False indicatif
#   (jamais bloquant). Stockage runtime `contrat-<logX>.json` (gitignoré).
# - P6-17 (§5.7-bis) : boucle avis GET/POST /avis (enquête J+1 1-5, 201/200,
#   routage >=4★ lien_public / 3★ rattrapage + late_gratuite auto / <=2★
#   rattrapage + geste à valider, todo correctif mots-clés, jamais bloquant),
#   POST /avis-geste (validation 1-tap HUMAINE, alerte si >20 €, jamais de
#   débit auto), POST /avis-reponse (pré-réponse brouillon déterministe ton
#   hôte ou texte humain scanné 422 si promesse, puis validation 1-tap,
#   publication manuelle box jamais auto), GET /scenes + POST /scene (3
#   scènes 1-tap Arrivée/Départ/Nuit calme, log indicatif). Stockage runtime
#   `avis-<logX>.json` (gitignoré).
# - P6-20 (§1.6) : RBAC 5 rôles GET /acces (audit nominatif : MFA
#   exigée/active, expiry, révocations, doublons ; réservé super_admin/admin,
#   jamais de secrets) + POST /acces-revoquer (1-tap super_admin/admin,
#   jamais soi-même ni super_admin, idempotent, runtime
#   `acces-revocations.json` gitignoré — box : acces.yaml éditable, lab :
#   monté ro) + POST /acces-reactiver (expire_le passé = reste expiré) +
#   GET /journal (qui/quand/quoi 90 j, etat_lecture + périmètre, cap 200,
#   jamais de PIN) + `--check` alertes MFA/expiry/doublons. Voyageur = pas
#   de compte nominatif (PWA séjour, `qui inconnu` par défaut) ; presta =
#   PWA mission seule, jamais HA direct.
# - P6-21 (§12.5-bis) : carnet preuve tranquillité POST /preuve-db (dB seuls
#   0-120, jamais d'audio, trimestre auto) + POST /preuve-attestation
#   (intervention/ménage/message_rappel) + GET /carnet (synthèse trimestre :
#   dépassements jour/nuit + attestations, hôte seul, conservation 1 an) +
#   POST /lettre-tranquillite (brouillon chiffré) + POST /lettre-envoyer
#   (1-tap humain, messagerie tracée) + GET /registre-rgpd (7 traitements +
#   durées, filtré features) + GET /mentions-annonce (9 obligatoires,
#   renseigné/manquant + actions, jamais inventé). Stockage runtime
#   `preuves-<logX>.json` + `lettres-<logX>.json` (gitignorés).
# - P7-6 (§6.7) : seuils transverses GET /seuils (doc vivante) + POST
#   /gardien (porte LLM/Jev : RBAC -> outil interdit serrure/vanne/portail/
#   PIN toujours BLOQUÉ -> hors_bornes>0,5 BLOQUÉ -> confidence<0,7
#   dashboard jamais d'auto -> noul>0,8+conf>0,75 auto borné réversible seul
#   -> sinon dashboard ; log JSONL avec trace P7-7 alias/fournisseur/modèle
#   + backend/endpoint/confidence). Scores absents = 0 (jamais d'auto).
# - P7-7 (§6.7) : traçabilité `decision.logX.jsonl` (alias+fournisseur+modèle
#   +endpoint+tokens+latence, Jev backend+endpoint+modèle+confidence, langue
#   voyageur) + filtres dashboard GET /journal?backend=&alias=&langue=
#   (backend Jev, alias LLM, langue ; vides = sans filtre).
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
