# Plan Implementation LCD — Checklist suivi (v2.5, 2026-10-06)

> Fichier de pilotage chantier. Cocher au fur et à mesure (`- [x]`).
> Ne jamais committer `secrets.yaml`, `custom/branding.yaml` client, `docs/logN/`, backups.
> Contrainte : 0 € logiciel (open source / fork / maison). Seul le matériel s'achète.
> Référence fonctionnelle : `Plan Technique LCD - Pipeline automatisation complet.md` (v2.5).

**Progression globale (MAJ manuelle) :** `0 / ~120` tâches.
- Phase 0 Commandes : 0/8
- Phase 1 Socle : 0/14
- Phase 2 PMS/synchro/pricing : 0/16
- Phase 3 Accès : 0/8
- Phase 4 Énergie : 0/10
- Phase 5 Sécurité : 0/10
- Phase 6 Exploitation : 0/22
- Phase 7 Voix + LLM/Jev : 0/20
- Phase 8 Recette / go-live : 0/12

Règle : 1 phase = 1 commit git tagué (`v2.5-phaseN`). Recette §9 Phase 8 = go/no-go mise en location.

---

## Phase 0 — Commandes (matériel log1)

- [ ] P0-1 Compter radiateurs / vanne / cylindre / interphone + photos tableau électrique
- [ ] P0-2 Commander essentiel (~1 050-1 150 €, variante ÉCO §2.8) : NodOn, ZLinky, contacteur, Frient, vanne, Nuki, onduleur Eaton 3S 550 VA, mini-PC
- [ ] P0-3 Commander Chine (délai) : ESP32/INMP441, sondes Aqara/Sonoff, PIR, ouvrants, prises Nous, RM4 mini, S3-BOX-3, SLZB-06 (boutique officielle), QR linge/équipement
- [ ] P0-4 Tester chaque module à réception (1 sonde, 1 prise, marquage CE, photo + facture assurance/copro)
- [ ] P0-5 Boîte secours Master Lock + clé physique + piles secours (AA, CR2032)
- [ ] P0-6 Étiquettes inventaire : QR thermocollant linge (~0,30-0,50 €/u) + sticker QR vinyle / NFC NTAG215 équipement
- [ ] P0-7 Stock mini-bar initial (~35 €, 8-10 refs soft-only tant que `licence_alcool: false`) + kit bienvenue (~3-5 €)
- [ ] P0-8 Tableau par électricien (230 V : NodOn, contacteur, ZLinky — 🇪🇺 obligatoire)

## Phase 1 — Socle Proxmox + HA (offline-first)

Dépendances à installer : Proxmox VE, VM HAOS (4 vCPU/8 Go), Mosquitto, Zigbee2MQTT, OTBR, WireGuard, DuckDNS + Let's Encrypt, NUT.

- [ ] P1-1 Installer Proxmox + VM HAOS + LXC utils (backup auto quotidien local + copie hebdo chiffrée hors site)
- [ ] P1-2 Zigbee2MQTT canal 25 + `availability` + backup `coordinator_backup.json` mensuel + baux DHCP statiques (SLZB, tablette, BOX-3)
- [ ] P1-3 OTBR + ZBT-2 (Thread/Matter) + injecteur PoE SLZB **sur onduleur**
- [ ] P1-4 DuckDNS + Let's Encrypt + WireGuard (seul port ouvert UDP) ; jamais d'expo HA sans auth
- [ ] P1-5 NUT (onduleur) + `system_monitor` + BIOS `power restore ON` + automation retour courant
- [ ] P1-6 Box FAI **sur onduleur** (impératif §5.1-bis) ; option 2e petit UPS box+SLZB ~40 €
- [ ] P1-7 Packages `log1` vides selon arborescence §1.5.6 : `homeassistant/packages/log1/{log1,acces,energie,securite,exploitation,voix}.yaml` + `dashboards/{hote,menage,guest,systeme}.yaml` + `logements.yaml` (héritage global→logX) + `branding.yaml` + `acces.yaml` (5 rôles) + `zones.yaml` + `docs/templates/` + `/config/{interventions,etat_lieux,sinistres,preuves,contrats,logs}/`
- [ ] P1-7bis Vérifier arborescence §1.5.6 : 1 feature = 1 flag + 1 dossier + 1 dashboard `visibility:` ; nommage `logX_<objet>_<fonction>` ; versionné (code + `*.example` + `docs/templates/`) vs privé chiffré (`branding.yaml` + `logements.yaml` + `secrets.yaml` + `docs/logN/` + `/config/...`) ; `sensor.logX_config_ok` rouge si `copro.verifiee:false`
- [ ] P1-8 Blueprints `location/*` : arrivée, départ-ménage, bridage, bruit, fuite, incendie
- [ ] P1-9 `secrets.yaml` (clés API, master_key proxy, exports banque) — jamais commitée ; rotation clé API accès
- [ ] P1-10 Recorder purge 10 j (InfluxDB exclu) ; logbook + `decision.log1.jsonl` (`/config/logs/`)
- [ ] P1-11 Test coupure WAN 10 min : serrure Thread, chauffage, ECS, bruit→local, incendie survivent
- [ ] P1-12 Test coupure secteur 20 min (NUT + coupe ECS/pré-chauffe) + arrêt propre + remontée seule + digest
- [ ] P1-13 Dashboard hôte v1 : santé (WAN, Zigbee LQI, Thread, MQTT, backup vérifié), batteries/LQI
- [ ] P1-14 Restauration backup testée (trimestriel ensuite)

## Phase 2 — Moteur direct + synchro + pricing (§3/§4/§4-bis/§4-ter)

Dépendances : LXC LAMP (QloApps Phase 1 : PHP 5.6/7.x + extensions Mcrypt/OpenSSL/Zip/Curl/GD/PDO/MySQLi/DOM/mbstring, MySQL 5.6+/MariaDB 10+, ~10 Go thin / 2 vCPU / 2 Go RAM), `custom/ics-sync/`, `custom/pricing-engine/`, `custom/decision-engine/` v1.

- [ ] P2-1 LXC LAMP + QloApps (transitoire, `moteur_direct: qloapps`) + clé Webservice dédiée lecture/prix
- [ ] P2-2 Module maison `custom/qloapps-module-ha/` : hook `actionValidateOrderAfter` → POST JSON `{ref, logement_id, dates, voyageurs, langue, montant, extras[]}` vers `http://ha:8123/api/webhook/resa-logX` (LAN/WireGuard), idempotence par `ref`, logs + retry
- [ ] P2-3 Champs custom QloApps : langue, heure arrivée, taxe CASA (+44 %) + mails/SMS check-in socle 5
- [ ] P2-4 `custom/ics-sync/` : poll 15 min OTA (Airbnb/Booking/Abritel/Expedia), anti-double-résa, stop-sell same-day auto, direct→occupation <60 s
- [ ] P2-5 `custom/pricing-engine/` : `prix = clamp(base × K_saison × K_events × K_we × K_occ × K_duree × K_lastmin, 75, 290)` + `prix_canal = arrondi(pivot/(1-commission)+frais)` + clamp bornes + recalcul 1×/j + à chaque résa
- [ ] P2-6 Application auto prix au moteur direct (`PUT /prix`) ; OTA = reco 1-tap, jamais d'écriture auto
- [ ] P2-7 Capteurs `sensor.log1_prix_nuit` + `sensor.log1_prix_canal_*` + graphe 30 j + occ J+30 Vue Prix §5.11
- [ ] P2-8 `custom/decision-engine/` v1 : état unifié occupation/prix, règles prioritaires (sécurité>occupation>énergie>confort>prix), log JSONL
- [ ] P2-9 Dashboard hôte : planning / prix / langue / forçage / notif groupée jour
- [ ] P2-10 CGV direct 14 articles §12.2 + contrat PDF §12.5-bis + facture Factur-X B2B / PDF B2C
- [ ] P2-11 Hold caution 500-800 € (Swikly/Stripe/TPE) + taxe casa.taxesejour.fr (direct = vous collectez)
- [ ] P2-12 Vitrines gratuites si `vitrines_gratuites: on` : Google Vacation Rentals, Tripadvisor, Leboncoin, GreenGo/Gîtes/Clévacances, SeLoger/PAP/FB/Insta → lien direct UTM `?src=<vitrine>`
- [ ] P2-13 Traçabilité `{ref, canal, commission, net_hote}` en `decision.logX.jsonl` + Vue Finances
- [ ] P2-14 Test : résa directe → PIN + occupation <60 s ; conflit ICS simulé → arbitrage <15 min
- [ ] P2-15 (Phase 2+, pas day-1) `booking-direct` FastAPI (~200 lignes, même LXC que pricing/ics-sync) : catalogue + dispo + Checkout Stripe + ICS export + POST natif HA ; bascule 1 flag + 1 séjour témoin + QloApps fallback 1 mois
- [ ] P2-16 Wizard copro §12.1-bis : `copro.verifiee: false` → mise en ligne BLOQUÉE (log1 Santa Severa = true, log2 = false défaut sûr)

## Phase 3 — Accès (Nuki + KeyMaster)

Dépendances : Nuki Hub (ESP32), KeyMaster, NodOn SIN-4 / portail (accord syndic).

- [ ] P3-1 Nuki + Keypad (piles AA 8-12 mois) + codes déjà poussés (entrée même HA éteint / sans WAN)
- [ ] P3-2 Nuki Hub (ESP32) + watchdog alerte <30 min si débranché
- [ ] P3-3 KeyMaster : slots 1-10 (`keymaster.log1_pin_<n>`), PIN 6 chiffres, actif arrivée−2 h → départ+30 min, slot ménage permanent séparé
- [ ] P3-4 Envoi auto : message moteur direct (§4-bis) + SMS Free/Telegram, langue voyageur, J-2 + rappel J-1 15h ; jamais de PIN en clair dans logs (4 derniers + exclude recorder/logbook)
- [ ] P3-5 Révocation auto départ+30 min + vérif `lock` + alerte si échec ; jamais de révocation punitive en cours de séjour
- [ ] P3-6 Portail hall Uni/Opener (avec accord écrit syndic) + consigne coupure (backup hall / entrer avec résidents / appeler hôte)
- [ ] P3-7 Double confirmation ouverture à distance ; test : PIN ouvre **sans WAN** (Thread local)
- [ ] P3-8 Procédure batterie retirée : boîte Master Lock + piles secours OK

## Phase 4 — Énergie (Versatile + ECS + clim)

Dépendances : Versatile Thermostat, Central, Shelly EM, ZLinky, prises Nous, RM4 mini (Broadlink `python-broadlink`).

- [ ] P4-1 Versatile ×4 + Central + bridage 21 °C en code + Eco si fenêtre ouverte
- [ ] P4-2 RM4 clim (bornes chaud 19-21,5 / froid 25-27) + pré-chauffe −3 h Confort 19 °C + ECS calculée
- [ ] P4-3 Prises LV/LL (fin de cycle → notif « linge à étendre ») + TV/box sur prise (extinction auto inoccupé)
- [ ] P4-4 Energy dashboard (ZLinky + NodOn + Shelly EM + prises) + alertes (>0,5 kWh/h inoccupé, pic >90 % abo)
- [ ] P4-5 Délestage PAPP >85 % (jamais LL+LV+ECS+ballon ensemble) + test charge
- [ ] P4-6 Pré-chauffe géoloc seulement si opt-in (`device_tracker.logX_voyageur`, révocation checkout + purge, jamais fond permanent)
- [ ] P4-7 VMC/humidité SDB (sonde → alerte moisissure + rappel VMC) ; volets à qualifier (NodOn SIN-4-RS-20 ~60 €/ouvrant si électriques)
- [ ] P4-8 Sonde frigo/congélo Aqara (~9 €, alerte >8 °C / >−12 °C 30 min)
- [ ] P4-9 Critère : consigne bloquée, ballon chaud après 3 j vide
- [ ] P4-10 Mémoire voyageur : consigne Confort mémorisée réappliquée (bornes inviolables, proposition si au-delà)

## Phase 5 — Sécurité (bruit / fuite / incendie / présence)

Dépendances : ESP32 + INMP441 (bruit dB seuls), Frient (5 ans), détecteurs fuite + vanne T1, DAAF, PIR/ouvrants, Alarmo.

- [ ] P5-1 Bruit calibré : dB seuls /30 s affichés, escalade 3 niveaux (voyageur → appel/PWA → hôte + Alarmo si fête), jamais d'audio, jamais chambres/SDB, jamais d'amende auto
- [ ] P5-2 Fuite → vanne <2 s (règle déterministe), **réarmement toujours manuel**
- [ ] P5-3 Incendie interlink déterministe immédiat (Jev = résumé post-événement seul) + DAAF + remplacement 10 ans + test mensuel auto-rappelé (`todo` + bip loggué, muet >24 h → alerte)
- [ ] P5-4 PIR (§2.5) + ouvrants + conso anormale (+ WiFi sensing opt-in si `wifi_sensing: on` : statut+classe+horodatage, jamais CSI brut, jamais fond permanent, phrase annonce verbatim, purge 90 j) = présomption fête/surnombre, confirmation humaine 2 sources <2 min
- [ ] P5-5 Alarmo : arm auto checkout+30 min, incendie désarme intrusion
- [ ] P5-6 Journal accès 90 j (heures+slot, jamais code) + tag rôle+marque
- [ ] P5-7 Preuves : état des lieux PWA EXIF + messages J-2/J-1 via plateforme → dossiers AirCover <14 j ET avant suivant / Booking 48 h / Vrbo ~14 j
- [ ] P5-8 Automation retour courant : vérif vanne/ECS/chauffage/Versatile + re-arm Alarmo selon calendrier
- [ ] P5-9 Tests mensuels planifiés dashboard ménage + piles AA stock Grocy
- [ ] P5-10 Assurance habitation + RC LCD + attestation RC villégiature exigée voyageur

## Phase 6 — Exploitation (ménage / extras / guide / langues / mémoire / questionnaire)

Dépendances : Grocy (add-on + intégration), WallPanel, Telegram/Companion App, Tesseract OCR (compta), PWA Guest/Ménage/Presta.

- [ ] P6-1 Todos + photos E/S (Companion App → dossier daté) + notifs multi-destinataires + clôture bloquante si manquantes
- [ ] P6-2 Parcours intervenant PWA/QR : pointage arrivée/départ + photos AVANT/APRÈS par pièce + `intervention.json` (durée présence vs temps déclaré, écart >20 % → alerte) + dossier `/config/interventions/logX/<date>_<presta>_<motif>/{avant,apres}/`
- [ ] P6-3 Grocy consommables (café, papier, sacs aspirateur, piles, produits) : seuils + liste courses auto
- [ ] P6-4 Inventaire biens (`inventaire_biens: on`) : étiquettes QR/NFC + `custom/inventaire/logX/biens.yaml` + stats coût/séjour + alerte dormant >90 j + garantie <30 j
- [ ] P6-5 Extras (`extras_upsell: on`) : `extras:` dans `logements.yaml` + cut-off J-1 18h + paiement avance Stripe/Swikly + `todo.logX_extras` + `input_boolean.logX_extra_<nom>` + ligne `compta_auto` par extra
- [ ] P6-6 Kit bienvenue OFFERT (~3-5 €, charge « accueil », jamais CA) vs mini-bar PAYANT honnêteté (QR + fiche prix, soft-only, réassort checkout + Grocy)
- [ ] P6-7 Conciergerie séjour : arrivée/départ (accueil 30 €, transfert 40 €, location partenariat 15-20 %) + vie sur place 100 % partenariat (chef 69 €/pers, massage 75 €/h, babysitting 30 €/h, pressing 15 €, resto/plage 10 %, excursions 10-15 %) + pack télétravail 25 €/séjour (stock ~150 €)
- [ ] P6-8 Annuaire prestas + zones (`custom/zones.yaml`, clés jamais texte libre, `zone_defaut`, dispatch filtre zone+actif+RC, hors zone = 2e choix + surcoût jamais auto, alerte <2 actifs/métier/zone)
- [ ] P6-9 Guide vivant : WallPanel kiosk + vues socle 5 + QR par pièce/appareil + arrivée guidée J-1 (lien PWA + PIN + WiFi + QR salon) + départ zéro friction (checklist + avis J+1)
- [ ] P6-10 WiFi invité isolé : SSID guest + QR `WIFI:T:WPA;…` + clé rotative par défaut (`input_text.logX_wifi_key`), returning si même voyageur reconnu (message « Bon retour ! »), jamais en vocal/LLM/logs
- [ ] P6-11 Langues (§5.7-ter) : socle FR/EN/ES/IT/DE (`docs/templates/*.{fr,en,es,it,de}.md`) + maternelle auto LLM (placeholders `{{ }}` intouchables, cache phrase+langue, badge auto, fallback EN) + sélecteur PWA + Piper `it_IT`/`de_DE` si satellites + 20 phrases critiques 1-tap + recette 50 requêtes/langue
- [ ] P6-12 Mémoire voyageur (`memoire_voyageur: on`) : opt-in PWA révocable 1-tap + `custom/memoire/voyageurs.yaml` (hash, jamais prestas, jamais discrimination tarifaire, purge 24 mois) + pré-remplissage séjour suivant (langue, consignes, extras favoris 1-tap, « Bon retour [prénom] ! », WiFi returning)
- [ ] P6-13 Ménage à date certaine : `menage_frequence_j` + séjour ≥ durée → `todo.logX_menage_intermediaire` (heure pref, pendant absence si PIR+code=vide) + message voyageur + facturation (offert dès 14 j si `remplissage_max`, sinon 60 €) ; défaut J+7 si ≥10 j
- [ ] P6-14 Questionnaire J-2 (§5.7-quinquies) : 1 lien PWA+PIN, 3 min, pré-rempli, 4 blocs (Arrivée / Préférences / Extras / Contrat+opt-ins), cut-off J-1 18h, rappel J-1 15h, jamais bloquant
- [ ] P6-15 Contrat + signature tactile → PDF horodaté §12.5-bis + opt-ins (mémoire, géoloc, CRM retour −10 % direct si `crm_retour: on`)
- [ ] P6-16 État des lieux auto (`etat_lieux_auto: on`) : photos horodatées par pièce + vidéo <60 s + `/config/etat_lieux/logX/<resa>/{entree,sortie}/` + EXIF + refus >24 h + comparatif + purge 90 j + consentement arrivée
- [ ] P6-17 Boucle avis : enquête J+1 (≥4★ → lien public, <4★ → rattrapage privé + geste 1-tap si >20 €) + pré-réponse IA 1-tap + livret vidéo QR + objets trouvés (15 € forfait) + scènes 1-tap (Arrivée/Départ/Nuit calme)
- [ ] P6-18 Compta auto : OCR Tesseract → catégorisation (fournisseur, TTC/HT/TVA, logement, rubrique) → brouillon + confiance → validation humaine si < seuil ; rapprochements payouts/banque (écart >2 % / orpheline >7 j → file, jamais d'écriture auto) ; simulateur micro vs réel (jamais d'option auto) ; jauges 15 k€ / 77,7 k€ + 120 j + alertes 80/100 % ; clôture le 5 + dossier `docs/parc/<annee>/`
- [ ] P6-19 Supplément ménage log1 110 € ligne séparée §12.2-ter (décomposition 10 postes) + suivi `sensor.menage_cout_rotation` + score qualité
- [ ] P6-20 RBAC 5 rôles (`acces.yaml` + 2FA super_admin/admin/gestionnaire + 1 compte nominatif + révocation auto + journal 90 j) : dashboards /hote /menage /guest /systeme + PWA mission presta seule + voyageur durée séjour jamais HA direct
- [ ] P6-21 Lettre tranquillité syndic/copro (preuves dB + interventions, humain envoie via messagerie tracée) + registre RGPD + mentions annonce
- [ ] P6-22 Formation ménage 30 min + test départ complet (todo + photos + comparatif + clôture OK)

## Phase 7 — Voix + LLM/Jev (§6.5/§6.6/§6.7 + 63 apports v2.5)

Dépendances : Wyoming/Whisper-small/Piper/openWakeWord, proxy LiteLLM `:4000`, UI routage `:8050` (FastAPI/Flask), Ollama `qwen2.5:7b`, GroqCloud free, Mistral si `llm_eu_only`, TypeSafe Jev, 2 satellites S3-BOX-3/Atom Echo.

- [ ] P7-1 Wyoming + Whisper-small + Piper + openWakeWord (BYOD : smartphone voyageur seul, consentement par échange révocable, jamais de codes/vanne/portail/alarme OFF en réponse, urgences → fixe hôte+112)
- [ ] P7-2 Proxy LiteLLM `:4000` : `custom/llm-proxy/config.yaml` (groq/ollama/mistral/custom `api_base`, fallbacks, master_key, spend-logging, `cache_ttl: 0` sur `lcd-jev`) + `rest_command.lcd_chat` (`temperature 0.2 / max_tokens 250 / timeout 8s voix / 6s Jev`, retry 1, cooldown 30s)
- [ ] P7-3 `routing.json` + `endpoints.yaml` + UI `custom/llm-router-ui/` `:8050` (LAN+WireGuard seule, primaire + fallbacks illimités `lcd-chat-*`/`jev-*`, Tester par ligne, reload chaud, santé OK/KO/cooldown, garde-fous non supprimables)
- [ ] P7-4 Aliases : `lcd-chat-fast` Groq 8b 0 € / `strong` 70b / `eu` Mistral si `llm_eu_only` / `local` Ollama / `custom-N` + `select.log1_llm_backend` + `input_text.log1_llm_model_override` + `sensor.llm_cout_mois` (alerte >5 €) + verif dépréciation mensuelle
- [ ] P7-5 Jev SystemOne : `rest_command.typesafe_systemone` (`POST https://api.typesafe.ai/v1/systemone`, `jev-latest`/`jev-1.13.0`, ~0,042 $/Mtok, ~0,05-0,15 €/mois, timeout 6s, retry 1, `cache_ttl: 0`, kill-switch `input_boolean.jev_enabled`, `select.log1_jev_backend`) ; 0 € strict = off + règles déterministes seules
- [ ] P7-6 Seuils transverses en code : `noul>0,8 + confidence>0,75 → auto borné sinon dashboard`, `confidence<0,7 → jamais d'auto`, `hors_bornes>0,5 → blocage` ; LLM/Jev consultatifs seuls, jamais tool-calling serrure/vanne/portail, jamais génération PIN/ouverture (KeyMaster+Nuki Hub seuls)
- [ ] P7-7 Traçabilité : `decision.logX.jsonl` (alias+fournisseur+modèle+endpoint+tokens+latence, Jev backend+endpoint+modèle+confidence) + filtre dashboard par backend/alias/langue
- [ ] P7-8 2 satellites + prompts voix + PWA parler/écrire (même pipeline, escalation humaine auto <15 min 8h-22h) ; critères : 3 questions socle 5 + maternelle <5 s avec WAN (proxy) et <5 s sans WAN (fallback local)
- [ ] P7-9 Recette : 50 requêtes/langue socle + maternelle (Groq vs Mistral vs Jev vs custom, latence/coût/confidence, seuils relevés si <EN)
- [ ] P7-10 Parcours voyageur LLM M1-M8 (§6.7.1) : détection langue M1, normalisation questionnaire M2, suggestion extras M3, reformulation ménage M4, messages langue M5, résumé avis M6, concierge + courses M7, contrat FALC + carte + transcription M8
- [ ] P7-11 Parcours voyageur Jev J1-J9 (§6.7.2) : complétude J-2 J1, confiance trad J2, éligibilité extras J3, cohérence mémoire J4, sentiment avis J5, dispatch zone/assurance J6, tri nocturne fusion dB J7, routage sinistre J8, qualité ménage J9 (jamais sanction auto)
- [ ] P7-12 Pricing/compta LLM M-LLM-1→7 (§6.7.3) : résumé events Vue Prix, justification prix, micro vs réel, écarts payouts/banque, clamp canal, relevé concurrence (jamais de scraping auto, saisie manuelle), CGV/factures/emails à trous (montants moteur/compta/direct, Factur-X B2B / PDF B2C, 1-tap)
- [ ] P7-13 Pricing/compta Jev M-JEV-1→6 (§6.7.4) : anti-braderie gap-night/last-minute, juge flex/late/early, pertinence mode gestion (jamais de bascule silencieuse), fiabilité relevé, dérive ménage 110 €, priorisation fiscale (jamais micro→réel auto)
- [ ] P7-14 Ops LLM M-LLM1→10 (§6.7.5) : classification photo dégât (via `intervention.json`, sans vision), résumé sinistre SLA, résumé intervention, scoring presta expliqué, conflit ICS expliqué, diagnostic supervision → runbook Phase 8, résumé logs 7 j, fiche mission, dossier incomplet, écart compta + onboarding
- [ ] P7-15 Ops Jev M-JEV1→9 (§6.7.6) : vrai scoring dispatch Choice, gravité sinistre SLA, complétude photo sans vision, conflit ICS (direct > Airbnb > Booking > Abritel), diagnostic supervision, fusion WiFi-sensing (classe/surnombre/fête, jamais seul), blanchisserie/linge, caution/litige (AirCover 14 j / Booking 48 h / Vrbo ~14 j, jamais retenue sans justificatifs), wizard gating palier
- [ ] P7-16 Juridique LLM M-LLM-1→7 (§6.7.7) : résumé CGV 1 page/langue (mentions L.111-1/L.112-1/L.221-28/L.612-1 + médiateur + ODR, R.212-1 interdit, verbatim caution, validation humaine datée), check-list conformité (`verifiee: false` → BLOQUÉ), lettre syndic, relances RC/registre/DPE/taxe/syndic (dispatch bloqué si `suspendu_assurance`), réclamation/médiation, digest audit, filtrage RBAC prompt scopé
- [ ] P7-17 Juridique Jev M-JEV-1→7 (§6.7.8) : garde-fou R.212-1, complétude conformité bloquante, routage réclamation/médiation (jamais clôture auto), éligibilité caution avant forclusion, criticité échéances (digest vs critique), anti-fuite RBAC, anomalie pilotage (jamais d'écriture auto compta, pièces 10 ans chiffrées)
- [ ] P7-18 Ordre suggéré : M-LLM-2 + M-LLM-5 (zéro écriture) → M-JEV-1 + M-JEV-2 (marge) → M-LLM-4 + M-LLM-3 → M-LLM-6 + M-JEV-4 → M-LLM-7 → M-JEV-3 + M-JEV-5 + M-JEV-6
- [ ] P7-19 Garde-fous 0 € : Groq free → Mistral UE → Ollama ; `sensor.jev_cout_mois` ; EU-only si `llm_eu_only` ; secrets jamais au LLM ; UI jamais WAN
- [ ] P7-20 Option B `custom/jev-gateway/` (wrapper OpenAI-compatible → SystemOne) seulement si 0 € strict absolu (sinon appel direct recommandé Phase 7)

## Phase 8 — Recette + go-live

- [ ] P8-1 5 scénarios : résa→arrivée, séjour incident complet, départ→ménage, offline 2 h, panne+feu test
- [ ] P8-2 Test zéro-touch : 1 séjour témoin complet sans intervention hôte (hors ménage physique)
- [ ] P8-3 Test marque blanche : changer `branding.yaml` → PWA + SMS + QR + dashboards re-thémés, 0 fuite « LCD/Home Assistant » (grep + navigation)
- [ ] P8-4 Pannes simulées : (1) WAN 2 h jour d'arrivée, (2) Nuki Hub débranché, (3) batterie Nuki retirée, (4) double résa, (5) voyageur bloqué 2h
- [ ] P8-5 Test DAAF + vanne + sirène + piles ; coupure longue + arrivée (code OK + Master Lock + message J-1)
- [ ] P8-6 Formation ménage + registre RGPD + relecture juriste CGV/mentions avant mise en ligne multi-plateformes
- [ ] P8-7 Vérification borniers prix 75/290 + jamais d'écriture auto OTA + critères objectifs seuls (art. 225-1)
- [ ] P8-8 Go-live log1 → tag git + entrée changelog + `Date MAJ`
- [ ] P8-9 Maintenance mensuelle : vanne/sirène/piles + DAAF
- [ ] P8-10 Maintenance trimestrielle : codes, revue pricing, backup-restore test, rotation WiFi vérifiée
- [ ] P8-11 Maintenance annuelle : piles, audit, 4G failover ? (~30 € clé + SIM prépayée)
- [ ] P8-12 Cloner log2 (light) : même socle, `verifiee: false` + défaut sûr max jusqu'au wizard copro complet

---

*MAJ : cocher + ajuster compteurs en tête à chaque avancement. 1 phase terminée = commit + tag.*
