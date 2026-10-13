# Plan Technique LCD v3 — Pipeline automatisation + socle SaaS conciergerie

*Version : v3.0 — 2026-10-13.*
*Statut : cible normative, prête à committer.*
*Référence historique : v2.5 (1074 lignes) — la v3 la remplace comme lecture courante, sans la dupliquer.*
*Détail d'implémentation : lab + plan Passerelle v3.*

> Principe directeur : 1 box HA autonome par site + central mutualisé + passerelle multi-tenant + front web unique.
> Logiciel 0 €, moteurs stdlib maison, feature-flags par logement, isolation par tenant.

## En-tête — cible v3 en une page

- Bien pilote log1 Santa Severa, Saint-Laurent-du-Var (65 m², 4+1 pax, vue mer) = vitrine 1.
- Vitrine 2 = log2 light (boîte à clés, sans Nuki/voix) = preuve du modèle éco.
- Clients tiers dès le départ, 3 forfaits : FULL-SERVICE / PILOTAGE / KIT.
- Coût logiciel 0 € (stdlib + open source, aucune licence, aucun abonnement).
- 95 % du socle v2 reste valable TEL QUEL (moteurs, flags, dashboards, pricing, ICS, voix, juridique).
- Ce plan v3 décrit le système cible comme un tout cohérent, pas comme des deltas.
- Topologie intangible : 1 HA par site, central chez l'hôte, passerelle :8443, front web/.
- Chaque logement porte `entite_id` + `client_tiers_ref` + `forfait`.
- Chaque client a son registre privé chiffré, sa marque blanche, sa facturation.
- Hébergement 3 phases : P1 0 € → P2 Oracle → P3 VPS ~5 €/mois.
- Détail hébergement : renvoyé au plan Passerelle v3.
- Style de ce document : sobre, normatif, direct, sans code.
- Règle de gestion : toute modification = entrée changelog + tag git, jamais silencieuse.

---

## §1 — Socle box : 1 HA par site + central mutualisé

### 1.1 Topologie intangible

- 1 box Home Assistant par logement, autonome offline-first.
- Sans WAN : PIN ouvre, guide local OK, scénarios énergie/sécurité OK.
- Test offline 2 h exigible à chaque phase (critère de sortie).
- 1 central mutualisé chez l'hôte (Proxmox existant, 0 € hardware sup).
- Le central porte : moteurs métier + proxy LLM + UI routage + supervision.
- Liaison box ↔ central en WireGuard seul.
- Jamais d'exposition WAN directe des box.
- Sites dispersés = jamais de HA multi-logements sur un seul LAN distant.

### 1.2 Box type FULL (log1)

- Mini-PC N100 16 Go (suffisant en API-first, 32 Go = premium).
- Coordinateur Zigbee SLZB-06p7 en PoE/Ethernet, jamais en WiFi.
- Thread ZBT-2 dédié (Nuki Matter via OpenThread Border Router).
- Onduleur + arrêt propre via NUT + digest retour courant.
- Nuki Go + Keypad 2.0 (verrouillage local <1 s) + Hub ESP32 (codes via MQTT).
- KeyMaster comme générateur/planificateur/UI (slots 1-10).
- Sécurité vie : détecteurs fumée certifiés (jamais de cheap).
- Dégât des eaux : capteurs fuite + bras vanne quart-de-tour (<2 s, réarmement manuel).
- Bruit : capteur 3 niveaux (jour/nuit, escalade N1→N2→N3 si occupé).
- Énergie : NodOn fil pilote par zone + ZLinky + Shelly EM + prises Nous avec mesure.
- Clim : Broadlink RM4 mini en IR 100 % local.
- Constaté v2 : Phase 0 ~1 100-1 200 €, complet ~2 050-2 150 €.
- Commande en 3 paniers (EU garantie + 2× Chine <150 €, boutiques officielles, CE vérifié).

### 1.3 Box light (log2)

- HA Green ~109 € ou RPi4 existant + SLZB + onduleur + câbles.
- Accès = boîte à clés (code manuel/Keybox auto, messages J-2/J-1 adaptés).
- Pas de Nuki, pas de ZBT-2, pas de voix satellites, pas de RM4 si pas de clim IR.
- Phase 0 ~650-750 €, reste différé Phase 1-bis financée par loyers.
- Migration vers FULL = ajout pack + flip `smart_lock: true`, 0 automation à réécrire.
- Même socle logiciel (HA + Z2M + flags), branches off simplement sautées.

### 1.4 Moteurs stdlib 0 € (ports 8090-8100, lab validé)

- `ics-sync` :8090 — poll OTA 15 min, anti-double-résa, stop-sell same-day.
- `pricing` :8091 — pivot direct + K_saison×K_events×K_we×K_occ×K_duree×K_lastmin.
- `decision-engine` :8092 — orchestrateur (règles prioritaires + jugements LLM/Jev).
- `facturation` :8093 — factures direct, Factur-X B2B / PDF B2C.
- `caution` :8094 — holds Swikly/Stripe/TPE, jamais dans le prix.
- `booking-direct` :8095 — interface stable `POST /resa`, `PUT /prix`, `GET /dispo`.
- QloApps transitoire Phase 1 → booking-direct maison Phase 2, bascule = 1 flag.
- `dispatch` :8096 — prestataires (score prix×note×dispo×délai, zone + RC).
- `inventaire` :8097 — biens QR/NFC (utilisations, état, dormants, garanties).
- `extras` :8098 — upsells (mini-bar, late/early, kits, partenariats).
- `stocks` :8099 — consommables Grocy (seuils, courses auto).
- `compta` :8100 — rapprochement payouts, alertes fiscales, export comptable.
- Transverses : proxy LLM `:4000`, UI routage `:8050`, supervision `:8060`, passerelle `:8443`.
- Tous les moteurs : Python stdlib uniquement, aucune dépendance payante.
- Chaque moteur lit `logement_id` + `entite_id`, jamais d'ID en dur.

### 1.5 Feature-flags logX (règle d'or)

- 1 feature = 1 flag dans `logements.yaml` + 1 dossier + 1 dashboard filtré.
- Héritage `global` → override `logX` (ex `global.voix` → `log1.voix`).
- Flags socle : `smart_lock`, `portail`, `chauffage_fp`, `clim_ir`, `ecs_pilotee`.
- Flags sécurité : `vanne_eau`, `bruit`, `incendie`, `alarme_intrusion`.
- Flags parcours : `voix`, `voix_satellite`, `geoloc_voyageur`, `assistance_voyageur`.
- Flags preuve : `etat_lieux_auto`, `traca_intervenants`, `inventaire_biens`.
- Flags revenus : `events_auto`, `sinistre_auto`, `annuaire_presta`, `concurrence_suivi`.
- Flags gestion : `compta_auto`, `extras_upsell`, `memoire_voyageur`, `moteur_direct`.
- Même trigger, 2 branches (ex résa confirmée → PIN Nuki si on, boîte à clés si off).
- Decision-engine + dashboards + watchdog sautent les branches off.
- Cartes Lovelace : `visibility: input_boolean.logX_enable_<feature> == on`.
- 4 axes de filtrage : logement + voyageur (opt-in séjour) + intervenant + gestionnaire.
- Kill-switch global : `input_boolean.jev_enabled`.
- Ajouter log3 = 5 lignes (bloc YAML + packages + prestataires + docs + accès).
- Jamais d'entity_id en dur, jamais de code dupliqué.

### 1.6 Arborescence et garde-fous

- Repo template public générique : code + `*.example` + `docs/templates` seuls.
- Privé chiffré par client : branding + logements + secrets + `docs/logN` + backups.
- Runtime `/config` non versionné : interventions, états des lieux, sinistres, preuves, contrats, logs.
- `decision.logX.jsonl` tagué `{entite_id, client_tiers_ref, marque, rôle}`.
- Nommage `logX_objet_fonction`, dates `AAAA-MM-JJ`, minuscules, sans accents.
- `sensor.logX_config_ok` rouge si copro non vérifiée = mise en ligne bloquée.
- Bornes prix en code, jamais d'écriture auto OTA (reco 1-tap).
- Jamais de PIN/ouverture par un modèle, jamais d'amende forfaitaire.
- Réarmement vanne manuel, incendie prioritaire sur intrusion.
- Jamais de PIN en clair (4 derniers chiffres + `exclude` recorder/logbook).
- Backups : quotidien vérifié + hebdo chiffrée hors site + restore trimestriel.

---

## §2 — Multi-tenant natif (cœur SaaS)

### 2.1 Clés d'isolation

- Chaque logement porte `entite_id` (entité juridique facturante).
- Chaque logement porte `client_tiers_ref` (vide = bien propre vitrine, renseigné = client).
- Chaque logement porte `forfait` (`full` | `pilotage` | `kit`).
- Moteurs, facturation, dashboards, passerelle filtrent sur ce triplet.
- Aucune donnée compta/finances mutualisée entre clients.
- Aucun dashboard propriétaire ne montre un autre client.
- Support multi-marques via tag `marque` dans les logs.

### 2.2 Branches par forfait (mêmes moteurs, comportements distincts)

- FULL-SERVICE : pack box complet + exploitation totale.
- FULL couvre : calendrier, pricing, messages, ménage/linge, maintenance, sinistres, compta, taxe.
- FULL tarif tranché : 25 % du brut HT + ménage 110 € refacturé voyageur, plancher 149 €/mois, entrée 290 € (box offerte si 12 mois), 22 % dès 3 lots.
- PILOTAGE : box légère sans actionneurs critiques.
- PILOTAGE : pas de vanne auto (alerte seule), pas d'ouverture à distance.
- PILOTAGE : supervision + reco + messages + pricing 1-tap, interventions sur devis.
- PILOTAGE tarif tranché : 149 €/logement/mois (129 € dès 3 lots), mise en route 190 €, engagement 3 mois puis libre.
- KIT : box + documentation + formation, client autonome.
- KIT tarif tranché : 890 € posé + maintenance 240 €/an, support hors garantie facturé.
- Le forfait est un flag par logement, changement = bascule de branches.
- Jamais de fork de code par forfait, jamais de promesse de rendement.

### 2.3 Registres isolés et RBAC par tenant

- 1 dossier privé chiffré par client (branding + logements + secrets + docs + backups).
- 5 rôles : `super_admin`/`admin` (vous seuls), `gestionnaire`, `proprietaire`, `prestataires`, `voyageur`.
- `super_admin` seul touche secrets, proxy `:4000`, UI `:8050`, flags critiques.
- `gestionnaire` = périmètre logX opérés, pas de `/systeme`, pas de secrets.
- `proprietaire` = ses logX seuls (Planning + Prix + Finances son périmètre + Incidents lecture).
- `prestataires` = mission/fenêtre seule (PWA mission + pointage + photos + facture).
- `voyageur` = PWA séjour seul, session révoquée au checkout + purge 90 j.
- Source : `custom/acces.yaml` (1 entrée/personne : rôle, sous-rôle, logements, expiry).
- Onboarding auto (invitation scopée à la signature mandat) + révocation auto.
- 2FA exigée : super_admin + admin + gestionnaire (+ comptable).
- Journal qui/quand/quoi 90 j, forçage manuel = motif obligatoire loggué.

### 2.4 Marque blanche dès jour 1

- Aucune mention de stack en dur côté voyageur/presta.
- Tout vient de `custom/branding.yaml` : marque, logo, couleurs, domaine, contacts, mentions, langues.
- PWA Guest/Ménage/Presta thémée (variables CSS + logo + nom + contact).
- Messages J-1/J-2/SMS signés `{{ marque }}`, jamais « LCD/Home Assistant ».
- QR physiques = gabarit générique (logo + domaine, pas de nom technique).
- Docs = templates `{{ marque }}` + `{{ logement }}`, instances en `docs/logN/`.
- Changer de client = 1 fichier + logos, 0 code.
- Recette : re-thème sans toucher au code, 0 fuite technique côté voyageur/presta.

### 2.5 Wizard copro par client (bloquant)

- Onboarding `/systeme` : photo règlement + accord syndic + heures calmes + animaux + occupants max.
- Versés dans `docs/logN/copro/` (jamais commités si repo public).
- Tant que `copro.verifiee: false` → mise en ligne BLOQUÉE (rouge + `config_ok` + todo).
- Propagation auto : règlement 5 langues + CGV direct + annonces + J-1 + PWA.
- Clauses auto : fêtes interdites, silence `heures_calmes`, animaux copro-alignés.
- Clauses auto : occupants max + identité déclarée, chambres séparées interdites.
- `usage interdit` = logement désactivé (pas de calendrier, pas de PIN, annonces suspendues).
- Toute modif copro (AG, syndic) = MAJ YAML + régénération + version datée.
- Enforcement séjour : bruit 3 niveaux + Alarmo + états des lieux photo = preuves horodatées.

---

## §3 — Pricing et synchro par tenant

### 3.1 Moteur prix unique, paramètres par tenant

- Formule : `prix = clamp(pivot × K_saison × K_events × K_we × K_occ × K_duree × K_lastmin, min, max)`.
- Bornes log1 : base 110 €, min 75 €, max 290 € (ménage + énergie + usure + marge).
- Chaque logN/client a ses propres bornes (surface, capacité, équipements).
- Recalcul 1×/j + à chaque résa, log ancien→nouveau dans `decision.logX.jsonl`.
- Capteurs : `sensor.logX_prix_nuit` (pivot) + `sensor.logX_prix_canal_*` + attributs `{pivot, commission, frais, bornes, K_*}`.
- Direct = écriture auto (`PUT /prix`) ; OTA = reco 1-tap, jamais auto.
- Graphe 30 j + taux occupation J+30 en Vue Prix.

### 3.2 Déclinaison canal légale

- `prix_canal = arrondi(pivot / (1 − commission) + frais_fixes)`, clampé aux bornes du logement.
- Commissions par défaut : direct 0 %, Airbnb 15 %, Booking 17 %, Abritel 10 %.
- Ajuster au contrat réel de chaque client (vérifier Extranet).
- Caution/hold hors prix, jamais dans le calcul.
- Frais ménage/linge/taxe ajoutés au facial seulement si déclarés avant résa et payés via la plateforme.
- Remises uniquement sur critères objectifs affichés (durée, saison, early-bird, last-minute).
- Jamais de discrimination (art. 225-1 + CGU).
- Dérogation hors bornes = humain seul + motif obligatoire (moteur bloque, Jev signale).

### 3.3 Modes de gestion (1 select pilote tout)

- `remplissage_max` (volume) / `equilibre` (défaut) / `revenu_max` (marge) + customs.
- Le mode règle : pricing + seuils last-minute + durée min + énergie + dispatch + concurrence.
- Recommandation log1 : `equilibre` annuel, `remplissage` creux hiver, `revenu` pics Cannes/GP/été.
- Bascule 1-tap au dashboard, logguée, jamais silencieuse.
- Option `mode_auto_saison` = proposition au digest, validation 1-tap.
- Tradeoff affiché (nuits+ vs €/nuit−), plancher protège la marge.

### 3.4 Revenus ++ (mêmes moteurs, par tenant)

- Gap-night auto : trou 1-2 nuits → −20 % pivot (jamais < plancher) + push reco.
- Séjour min dynamique : creux 1 nuit tout jour, pics 3-4 nuits arrivées sam/mer.
- Flex = pivot (annulation J-7) / non-remb = −10 % / flex+ pics +15 % (direct auto, OTA reco).
- Late/early dynamique : <2 h gratuit (geste avis), jusqu'à 14h/dès 12h = 50 % pivot.
- Paiement d'avance + `input_boolean.logX_extra_late` + ménage replanifié auto.
- CRM retour direct J+30/J+180 (4★+) : −10 % direct + extras, opt-out, base locale.
- Objectif : −15 % dépendance OTA en 12 mois, taux suivi en capteur.
- Frais animaux 25-35 €/séjour si copro OK + caution majorée (assistance 0 €, loi).
- Superhost watch : note <4,8 / réponse <90 % / annulation hôte → alerte + rattrapage.

### 3.5 Synchro isolée par logement

- ICS poll 15 min par logement, jamais de calendrier partagé entre clients.
- Fusion direct <60 s + OTA, anti-double-résa + stop-sell same-day.
- Chevauchement = critique + blocage sortant + relogement (modèle message).
- Événements auto : fériés + vacances A/B/C+UK/DE/IT + ICS curé local.
- ICS local : Cannes, GP Monaco, Carnaval, Ironman, Jazz Fest, matchs, congrès.
- K_events = max des coefs actifs, affiché en Vue Prix.
- Concurrence : relevé manuel trimestriel 5 annonces, proposition ±10 % 1-tap.
- Jamais de scraping auto (CGU OTA : ban + données faussées).

### 3.6 Simulateur argumentaire (commercial)

- Entrées : nuits/an, pivot moyen, forfait → sorties : CA direct vs OTA, coût conciergerie, net proprio.
- Usage : closing + révision annuelle, jamais de promesse de rendement.
- Données : bornes du logement + occupation J+30 réelles.
- Porté par le front (parcours commercial) + fiche PDF par prospect.

---

## §4 — Voix + LLM/Jev (coûts répercutés par tenant)

### 4.1 Chaîne voix par défaut (0 € hardware)

- Smartphone voyageur uniquement (BYOD strict, aucun téléphone laissé).
- QR/PWA → consentement par échange → STT téléphone → proxy `:4000` → TTS téléphone.
- Seul le texte transcrit part en API (jamais d'audio), session = durée séjour.
- Révocation auto au checkout, refus = guide texte/QR inchangé.
- Scripts exposés bornés : FAQ, WiFi QR, horaires, tri/départ, clim dans bornes.
- Jamais exposés : codes, KeyMaster, portail, vanne, alarme OFF, caméras (aucune dedans).
- Satellites S3-BOX-3 + Atom (+75 €) seulement si `voix_satellite: true` (PMR/premium).
- Critère : sans WAN, 3 questions types <5 s via smartphone + sentences offline.

### 4.2 Proxy unique, backends substituables

- HA et decision-engine ne parlent qu'au proxy `:4000` (LiteLLM, aliases `lcd-chat-*`).
- Fallbacks en chaîne + retry 1 + cooldown 30 s + local/sentences en dernier recours.
- WAN down >2 min → force local (Ollama démarré par automation), Ollama HS → sentences.
- UI `:8050` (LAN + WireGuard seuls) : primaire + fallbacks illimités par usage.
- Bouton Tester par ligne (latence/tokens/erreur, tag `test_ui`, n'écrit rien).
- `routing.json` versionné + backup auto + reload à chaud + log qui/quand/avant→après.
- Pivot acté : gateway apportée par l'hôte (`mimo-v2.6-flash`, `muse-spark-1.3-contributor`, `jev-1.13`).
- Mentions Groq/Mistral/TypeSafe directs = historique, spec fonctionnelle inchangée.

### 4.3 Jev consultatif seul

- Primitives : `Choice` (routage), `Score` (gravité), `Noul` (urgence/garde-fou).
- Usages : tri urgence bruit, routage ménage interne/presta, garde-fous prix/messages.
- Usages : arbitrage pré-chauffe/prix, scoring no-show/surconso/litige.
- Seuils : `noul >0,8 + confidence >0,75` → action bornée, sinon dashboard + humain.
- Jamais d'effet de bord direct (serrure/vanne/portail = code HA seul).
- `cache_ttl: 0` verrouillé sur `lcd-jev-*`, kill-switch `jev_enabled`.
- Chaque décision loggue fournisseur+modèle+endpoint+étage+confidence+tokens+latence.

### 4.4 Compteurs et refacturation par logement

- `sensor.llm_cout_mois` + `sensor.jev_cout_mois` (spend-logging + usage).
- Ventilation par `{logement, usage}` → ligne « IA/voix » sur facture tenant.
- Ordre de grandeur : ~1-3 €/mois/logement qualité UE + ~0,1 € Jev, 0 € en strict.
- Alerte dashboard si >5 €, comparatif par backend en recette.
- FULL : inclus au forfait jusqu'au seuil, au-delà refacturé au réel.
- PILOTAGE/KIT : refacturé au réel dès le premier token.
- Kill-switch par entité sans impacter les autres tenants.

### 4.5 RGPD voix/géoloc

- Texte seul en TLS, opt-in par échange/séjour, révocable, refus sans conséquence.
- Géoloc OFF par défaut, proposée 1×/séjour (2 zones home/away, jamais de tracking fond).
- Jamais d'ouverture auto, révocation auto checkout (tracker supprimé + session fermée).
- Conservation : logs HA 90 j (texte + zone seule), audio 0 j, voyageurs 24 mois / présence 90 j.
- 100 % local possible (Ollama + sentences + calendrier/PIR, aucun envoi).
- Mentions au guide + règlement + QR consentement.

---

## §5 — Front web/ (Next.js, 4 parcours)

### 5.1 Stack et exigences

- App `web/` Next.js 16 (build + lint verts), servie derrière la passerelle `:8443`.
- 5 langues FR/EN/ES/IT/DE + maternelle auto LLM (glossaire intouchable + badge auto).
- PWA (manifest, offline guide + QR papier fallback), sans-JS OK en lecture.
- Thème par marque (tokens dark/light, mobile-first, a11y), 0 nom de stack côté voyageur/presta.
- Langue hôte FR, ménage FR simplifié + pictos, guest = langue résa (`logX_langue_voyageur`).

### 5.2 4 parcours

- Hôte : 14 actions (planning, accès/PIN, prix + modes, énergie, incidents/sinistres, supervision, finances, messages, clôture…).
- Voyageur : WiFi <3 s, guide QR par pièce, parler/écrire, extras, départ zéro friction, SAV SLA <15 min 8h-22h.
- Propriétaire : ses logements seuls (CA/charges/net, validation travaux >seuil, exports périmètre).
- Commercial : simulateur, offres, pipeline prospects CRM, fiche PDF.
- Auth nominative, scopes par tenant, sessions séjour/mission à expiry auto.

### 5.3 Dashboards (+1 vue opérateur)

- Hôte 7 onglets : Planning, Accès, Prix, Énergie, Incidents, Supervision, Finances.
- Vue **opérateur conciergerie multi-clients** : file tous tenants (arrivées <18 h, todos ménage, incidents critiques, prix à valider, litiges/cautions, seuils IA).
- Ménage 3 onglets : todos (dispatch + deadline check-in −2 h), checklist bloquante si preuves manquantes, stocks.
- Guest kiosk (WallPanel) : même contenu que PWA, QR backup si tablette HS.
- Système (hôte seul) : features, onboarding, maintenance, LLM/Jev, logs.
- 100 % Lovelace YAML versionné côté HA ; front web lit les mêmes APIs.
- Switcher `logement_actif` (log1/log2/…+`tous`), bandeau offline permanent.
- Recette : mobile + offline 2 h + 1 séjour témoin zéro-touch (hors ménage physique).

### 5.4 Preuves et traçabilité

- État des lieux voyageur PWA : photos horodatées obligatoires par pièce + vidéo optionnelle.
- Anti-galerie >24 h, EXIF conservés, comparatif avant/après, clôture bloquée si manquantes.
- Traça intervenants : pointage arrivée/départ, photos avant/après, temps facturé = temps pointé.
- Clôture/facturation bloquées si dossier incomplet (`preuves_manquantes` + rappel + notif hôte).
- Journal accès 90 j (heures + slot, jamais le code), logs décisions filtrables.
- Inventaire biens QR/NFC (+1 utilisation/clôture, alertes dormant/dégradé/garantie).
- Extras/mini-bar (stock vs seuil, CA/séjour, top ventes), questionnaire J-2 (cut-off J-1 18h, jamais bloquant).

---

## §6 — Passerelle :8443 (control plane multi-tenant)

### 6.1 Rôle (proxy authentifié, jamais décideur)

- Seul point d'entrée WAN (front + boxes), fan-out vers moteurs/boxes.
- Allowlist de 14 actions d'écriture (planning, PIN, prix reco, messages, todos, dispatch, clôture…).
- Tout le reste en lecture ; chaque écriture loggée `{qui, quand, quoi, entite_id, logement}`.
- Motif exigé hors bornes, double confirmation (ouverture à distance, désactivation sécurité).
- Jamais de décision métier en passerelle (elle relaie, les moteurs disposent).

### 6.2 Transport et sécurité

- Caddy TLS (interne en lab, certificats publics en P3), WireGuard box ↔ central/passerelle.
- Auth nominative + scopes par tenant (un proprio ne voit que ses logX).
- 2FA admin/gestionnaire/comptable, rotation secrets trimestrielle.
- Secrets en vault (`secrets.yaml` jamais commité, `.gitignore` + `.example`).
- Rate-limit + quotas par tenant, santé par ligne (OK/dégradé/KO + cooldown).

### 6.3 Données (ADR-006)

- SQLite stdlib (WAL, FK, schéma v1, migration YAML idempotente).
- Objets : registre parc, résas, décisions, compteurs IA, facturation.
- Pas de Postgres/Redis en P1/P2 (stdlib suffit, 0 €).
- Sauvegardes chiffrées par client, restauration testée trimestriellement.
- Exports : FEC/comptable 1-clic (`docs/parc/<annee>/`), clôture mensuelle le 5.

### 6.4 Offline et split-brain

- Box autonome si WAN down (PIN local, guide local, sentences).
- Reconnexion : heartbeat + rejeu borné (résas/prix), conflit = vérité calendrier fusionné + humain.
- Jamais d'écrasement silencieux, jamais de bascule prix silencieuse.
- Supervision : heartbeat, LQI/batteries, capteur muet >24 h, backup vérifié.
- Redondance : spare ESP32 Hub ~8 €, clé Zigbee secours ~30 € (restore 15 min).

### 6.5 Hébergement 3 phases (détail : plan Passerelle v3 §1)

- P1 0 € : front Vercel + gateway Oracle Always Free.
- P2 : tout Oracle (front + passerelle + moteurs).
- P3 : VPS payant ~5 €/mois dès seuils (trafic, SLA, stockage preuves, multi-région).
- Seuils de bascule : IA/logement >5 € durable, indispo Oracle, support 24/7, >20 logements actifs.
- Procédures : migration P1→P2→P3 + backup/restore + statut de bascule (scripts + checklist).

---

## §7 — 0 € logiciel (stdlib, versions, CVE)

### 7.1 Socle

- HAOS, Proxmox VE, Mosquitto, Zigbee2MQTT, OTBR, Nuki Hub, Versatile, KeyMaster.
- Wyoming/Whisper/Piper/openWakeWord, LiteLLM, ESPHome, WireGuard, Grocy, WallPanel.
- python-broadlink, `ics_calendar`, DuckDNS/Let's Encrypt, Telegram/Companion App.
- Code maison : `ics-sync`, `pricing-engine`, `decision-engine`, `branding`.
- Code maison : `llm-proxy`, `router-ui`, `jev-gateway` (option), `qloapps-module-ha`.
- Blueprints : arrivée, départ-ménage, bridage, bruit, fuite, incendie.
- Moteurs lab en Python stdlib uniquement, aucune dépendance payante.
- Aucun abonnement HA/add-on/HACS, aucun SaaS intermédiaire obligatoire.

### 7.2 Versions et CVE

- `versions.lock` committé (1 ligne = 1 composant figé).
- Revue mensuelle : modèles décommissionnés, quotas Groq, CVE HA/add-ons.
- MAJ fenêtrées + backup avant + test PIN sans WAN après.
- OPEX logiciel : 0 € strict (gateway + local, Jev off) à ~1-3,2 €/mois/logement (UE + Jev).
- Tableau de bord : coûts LLM/Jev + tokens/latence/backend actif, alerte >5 €.

### 7.3 Qualité et runbook

- Batterie lab verte exigée avant commit (cible tenue : 1125 OK / 0 KO).
- 1 séjour témoin zéro-touch (hors ménage physique) par phase.
- Drill trimestriel (rotation blanche 30 min) + version papier datée.
- Runbook 2 pages : rotation ~3 h (todos → EDL → linge → checklist → PIN → scène Arrivée).
- Runbook incidents : fuite, bruit, serrure HS, coupure net, double-résa, objets trouvés.
- Maintenance calendaire (mensuel/trimestriel/annuel) + tests mensuels 1-tap.

---

## §8 — Juridique FR par client (matrice, pas de conseil)

### 8.1 Mandat et documents par client

- Mandat écrit de gestion saisonnière par propriétaire (périmètre, forfait, seuils, durée, rémunération).
- CGV direct propres + CGU plateformes respectées (hiérarchie : CGU plateforme > conditions propres).
- Contrat voyageur PWA 30 s + règlement copro-aligné + mentions annonces.
- Factur-X B2B / PDF B2C, registre national + taxe Métropole NCA + DPE.
- Classement Atout France en option (levier fiscal, quelques centaines d'€).
- Comptes 5 rôles créés à la signature (invitation scopée, périmètre = ses logX).

### 8.2 Caution et assurances

- Airbnb : caution hors plateforme INTERDITE → AirCover + Centre résolution 14 j.
- Booking : collecte séparée déclarée (Policies), VCC = séjour seul, jamais caution.
- Abritel : caution remboursable OU Damage Protection, jamais cumul.
- Direct : hold libre 500-800 € Swikly/Stripe/TPE, jamais dans le prix.
- Fonds tagués par logement, jamais de compte commun, 1 dossier privé chiffré/client.
- Retenue uniquement sur justificatifs (photos + dB + factures), jamais d'amende punitive.
- RC pro conciergerie + suivi expiry, transport/enfants = prestas assurés seuls.
- Annuaire ≥2 actifs/métier/zone avec RC vérifiée, alerte si <2.
- Sinistres : dossier auto + dispatch + compte à rebours plateforme + suivi caution + clôture compta.

### 8.3 Fiscalité et RGPD

- LMNP : 1 SIREN = N logements suivis indépendants, plafonds micro cumulés.
- Jauges : 15 000 € / 77 700 € + compteur 120 j résidence principale, alertes 80 %/100 %.
- Simulateur micro-BIC vs réel + export comptable 1-clic, clôture mensuelle le 5.
- Sourcing : factures + OCR versés `docs/logN/compta/`, file validation basse confiance.
- RGPD : registre, consentements par séjour, purge (voyageurs 24 mois / présence 90 j / audio 0 j).
- Effacement sur demande, revente/croisement interdits, refus sans conséquence.
- Données compta 1 dossier privé chiffré/client, backups chiffrés par client.

---

## Annexe A — État réel constaté (2026-10-13)

- Lab : ~19 services/conteneurs (moteurs 8090-8100 + passerelle :8443 + UI :8050/:8060 + proxy :4000).
- Lab : boxes log1/log2 simulées + VPS-sim Caddy TLS + registre parc + batterie.
- Configs : `lab/lab-config/*.yaml` (un fichier par moteur + passerelle + boxes + LLM).
- Batterie : 1125 OK / 0 KO (design system + KPIs + i18n 5 langues + simulateur, vitest + build + lint verts).
- Front : `web/` Next.js 16 (hôte 14 actions, voyageur, proprio, commercial), PWA manifest.
- Commits récents : `0fae986` refonte SaaS ; `2d2add3` plan 100 % codable P9/P10.
- Commits récents : `ec8532c` 3 forfaits + VPS-sim ; `29846aa` durcissement SaaS + PWA.
- Commits récents : `ba2dad2` vision SaaS + Passerelle v2 ; `7005bf4` front Next.js option B.
- Forfaits tranchés 2026-10-13 : FULL 25 % + 110 € ; PILOTAGE 149 €/mois ; KIT 890 € + 240 €/an.
- Tarifs ajustables au closing par avenant, jamais dans le code, jamais de promesse de rendement.

## Annexe B — Points à trancher par l'utilisateur

1. Ligne IA/voix par tenant (incluse FULL jusqu'au seuil, refacturée au-delà ; refacturée dès le 1er token en PILOTAGE/KIT).
2. Nom commercial + domaine + SIREN/RC pro (branding) + mentions légales.
3. Seuils P1→P2→P3 (nb logements, SLA, stockage preuves).
4. EU-only par défaut (`llm_eu_only`) vs 0 € strict (gateway + local, Jev off).
5. Accord syndic log1 (écrit, hall/portail) + cylindre débrayable + comptage radiateurs.
6. Seuil validation travaux/dépenses par client dans le mandat type.
