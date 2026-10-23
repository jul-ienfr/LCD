# 73 - Inventaire des donnees (regenerable)

**Genere le** : 2026-10-23 10:11 par `deploy/inventaire-donnees.ps1` (doctrine 71, V2).
**Ne pas editer a la main** : relancer le script apres tout changement de fixture.

## Methode

Chaque valeur des fixtures box (`lab/**/*.yaml`, hors `vps-sim`) est classee en quatre verdicts :

| Verdict | Sens |
|---|---|
| **vide** | chaine vide, `?`, `note`, `-` : conforme (R4 - un trou avoue vaut mieux qu'une valeur inventee) |
| **placeholder** | la valeur se denonce elle-meme (lab, exemple, demo, test, todo, a completer, xxx) : **a remplacer** |
| **source** | la valeur se retrouve telle quelle dans `docs/` : elle a une piece justificative |
| **a documenter** | ni vide, ni placeholder, ni retrouvee dans `docs/` : a rapprocher d'un releve terrain |
| **technique** | identifiants, dates, nombres, booleens : hors jugement |

## Resume

| Verdict | Valeurs |
|---|---:|
| **placeholder** (a remplacer) | 70 |
| **a documenter** (a rapprocher d'un releve) | 203 |
| source (justifiee par une piece) | 181 |
| vide (conforme) | 37 |
| technique (hors jugement) | 711 |
| **total examine** | **1202** |

## Placeholders a remplacer (70)

| Fichier | Clef | Valeur |
|---|---|---|
| `lab/branding.lab.yaml` | `adresse` | 1 rue du Lab, 06700 Saint-Laurent-du-Var (fictif) |
| `lab/branding.lab.yaml` | `email` | lab@example.invalid |
| `lab/branding.lab.yaml` | `marque` | Marque Lab Fictive |
| `lab/branding.lab.yaml` | `raison_sociale` | Lab Fictif — raison sociale fictive |
| `lab/branding.lab.yaml` | `site` | https://example.invalid |
| `lab/extras.lab/log1.yaml` | `lab_golf_sophia` | Golf partenaire Biot (lien affilié lab) \| 0 \| affiliation_10_15 \| sophia_antipolis |
| `lab/extras.lab/log1.yaml` | `lab_paddle_santa` | Paddle encadré baie (partenaire lab, lien affilié) \| 0 \| affiliation_10_15 \| santa_severa |
| `lab/extras.lab/log1.yaml` | `lab_visite_nice` | Visite guidée Nice ouest (partenaire lab) \| 0 \| affiliation_10_15 \| nice_ouest |
| `lab/extras.lab/log1.yaml` | `matelas_plage_partenaire` | Matelas plage privée partenaire (lien affilié, LAB) \| 0 \| affiliation_10_15 \| santa_severa |
| `lab/extras.lab/log1.yaml` | `petit_dej` | Petit-dej LAB PRIX FAUX (collision volontaire, socle 15 fait foi) \| 999 |
| `lab/extras.lab/log1.yaml` | `visite_guidee_vieux_nice` | Visite guidée Vieux-Nice (partenaire, lien affilié, LAB) \| 0 \| affiliation_10_15 \| nice_ouest |
| `lab/ha-virtual/configuration.yaml` | `name` | LCD-lab |
| `lab/ha-virtual/secrets.yaml` | `decision_api_token` | CHANGER-LAB-FAUX |
| `lab/inventaire.lab/log1/biens.yaml` | `fournisseur` | Fournisseur Lab |
| `lab/inventaire.lab/log1/biens.yaml` | `fournisseur` | Fournisseur Lab |
| `lab/inventaire.lab/log1/biens.yaml` | `fournisseur` | Fournisseur Lab |
| `lab/inventaire.lab/log1/biens.yaml` | `fournisseur` | Fournisseur Lab |
| `lab/inventaire.lab/log1/biens.yaml` | `fournisseur` | Fournisseur Lab |
| `lab/inventaire.lab/log1/biens.yaml` | `label` | Drap test lab |
| `lab/inventaire.lab/log1/biens.yaml` | `qr` | TEST-INV-1792466282 |
| `lab/lab-config/booking-direct.yaml` | `location_voiture_velo` | https://example.invalid/partenaire-auto-velo |
| `lab/lab-config/booking-direct.yaml` | `resa_resto_plage` | https://example.invalid/partenaire-resto-plage |
| `lab/lab-config/box-nord/logements.nord.yaml` | `nom` | Logement 3 Nord (LAB) |
| `lab/lab-config/box-nord/logements.nord.yaml` | `numero_declaration` | LAB-DECL-06800-2026 |
| `lab/lab-config/box-nord/logements.nord.yaml` | `ui_routage` | http://lab-ui:8050 |
| `lab/lab-config/dashboard.yaml` | `nom` | Log2 futur (lab) |
| `lab/lab-config/dashboard.yaml` | `nom` | Log1 Santa Severa (lab) |
| `lab/lab-config/logements.moli.yaml` | `commune` | Lab |
| `lab/lab-config/logements.moli.yaml` | `nom` | Logement 2 (LAB) |
| `lab/lab-config/logements.moli.yaml` | `nom` | Santa Severa (LAB) |
| `lab/lab-config/logements.moli.yaml` | `ui_routage` | http://lab-ui:8050 |
| `lab/lab-config/passerelle-parc.yaml` | `boxes` | /opt/lcd/lab-config/passerelle-parc-boxes.yaml |
| `lab/lab-config/passerelle-parc.yaml` | `llm` | /opt/lcd/lab-config/passerelle-parc-llm.yaml |
| `lab/lab-config/passerelle-parc-boxes.yaml` | `box_id` | box-lab |
| `lab/lab-config/passerelle-parc-boxes.yaml` | `description` | box lab — moteurs dockerisés (batterie §§48-49) |
| `lab/lab-config/passerelle-parc-boxes.yaml` | `description` | box nord lab — 2e box G4-b (offline cross-box + split-brain) |
| `lab/lab-config/passerelle-parc-boxes.yaml` | `nom` | Log1 Santa Severa (lab) |
| `lab/lab-config/passerelle-parc-boxes.yaml` | `nom` | Log2 futur (lab) |
| `lab/lab-config/passerelle-parc-boxes.yaml` | `nom` | Log3 Nord (lab) |
| `lab/lab-config/passerelle-parc-boxes.yaml` | `site` | lab |
| `lab/logements.lab.yaml` | `commune` | Lab |
| `lab/logements.lab.yaml` | `nom` | Santa Severa (LAB) |
| `lab/logements.lab.yaml` | `nom` | Logement 2 (LAB) |
| `lab/logements.lab.yaml` | `numero_declaration` | LAB-DECL-06560-2025 |
| `lab/logements.lab.yaml` | `ui_routage` | http://lab-ui:8050 |
| `lab/parc-registre/annonces.modele.yaml` | `titre` | Nice Gambetta (LAB) — studio 2 personnes pour tests |
| `lab/parc-registre/annonces.modele.yaml` | `titre` | Santa Severa (LAB) — T3 terrasse face mer pour tests |
| `lab/parc-registre/annonces.yaml` | `titre` | Nice Gambetta (LAB) — studio 2 personnes pour tests |
| `lab/parc-registre/annonces.yaml` | `titre` | Santa Severa (LAB) — T3 terrasse plein sud |
| `lab/parc-registre/entites.yaml` | `entite_id` | ent-lab-portail |
| `lab/parc-registre/locations.modele.yaml` | `nom` | Santa Severa (LAB) |
| `lab/parc-registre/locations.modele.yaml` | `nom` | Nice Gambetta (LAB) |
| `lab/parc-registre/locations.yaml` | `nom` | Santa Severa (LAB) |
| `lab/parc-registre/locations.yaml` | `nom` | Logement de test lab |
| `lab/parc-registre/locations.yaml` | `nom` | Nice Gambetta (LAB) |
| `lab/parc-registre/mandats.yaml` | `assurance_ref` | vault:client-lab-01/assurance |
| `lab/parc-registre/mandats.yaml` | `client_tiers_nom` | Client Lab 01 |
| `lab/parc-registre/mandats.yaml` | `client_tiers_ref` | client-lab-01 |
| `lab/parc-registre/mandats.yaml` | `entite_id` | ent-lab-portail |
| `lab/parc-registre/prospects.yaml` | `nom` | Proprietaire Lab |
| `lab/parc-registre/prospects.yaml` | `prospect_id` | prospect-lab-01 |
| `lab/secrets.lab.yaml` | `ha_api_token` | CHANGER-LAB-TOKEN-HA |
| `lab/secrets.lab.yaml` | `qloapps_webservice_key` | LAB-FAUSSE-cle-qloapps |
| `lab/secrets.lab.yaml` | `swikly_api_key` | LAB-FAUSSE-cle-swikly |
| `lab/secrets.lab.yaml` | `wifi_log1_key` | LAB-FAUSSE-cle-wifi-log1 |
| `lab/secrets.lab.yaml` | `wifi_log1_ssid` | LCD-LAB-Guest-log1 |
| `lab/secrets.lab.yaml` | `wifi_log2_key` | LAB-FAUSSE-cle-wifi-log2 |
| `lab/secrets.lab.yaml` | `wifi_log2_ssid` | LCD-LAB-Guest-log2 |
| `lab/stocks.lab/log1/conso.yaml` | `id` | TEST-STOCK |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Test stocks lab |

## Valeurs a documenter (203)

| Fichier | Clef | Valeur |
|---|---|---|
| `lab/branding.lab.yaml` | `siret` | 000 000 000 00000 |
| `lab/branding.lab.yaml` | `telephone` | +33 0 00 00 00 00 |
| `lab/ha-virtual/configuration.yaml` | `log1_acces` | !include packages/log1/acces.yaml |
| `lab/ha-virtual/configuration.yaml` | `log1_communs` | !include packages/log1/log1.yaml |
| `lab/ha-virtual/configuration.yaml` | `log1_energie` | !include packages/log1/energie.yaml |
| `lab/ha-virtual/configuration.yaml` | `log1_exploitation` | !include packages/log1/exploitation.yaml |
| `lab/ha-virtual/configuration.yaml` | `log1_securite` | !include packages/log1/securite.yaml |
| `lab/ha-virtual/configuration.yaml` | `log1_voix` | !include packages/log1/voix.yaml |
| `lab/ha-virtual/configuration.yaml` | `log2_acces` | !include packages/log2/acces.yaml |
| `lab/ha-virtual/configuration.yaml` | `log2_communs` | !include packages/log2/log2.yaml |
| `lab/ha-virtual/configuration.yaml` | `log2_energie` | !include packages/log2/energie.yaml |
| `lab/ha-virtual/configuration.yaml` | `log2_exploitation` | !include packages/log2/exploitation.yaml |
| `lab/ha-virtual/configuration.yaml` | `log2_securite` | !include packages/log2/securite.yaml |
| `lab/ha-virtual/configuration.yaml` | `log2_voix` | !include packages/log2/voix.yaml |
| `lab/inventaire.lab/log1/biens.yaml` | `label` | Lave-vaisselle (pièce détachée stock) |
| `lab/inventaire.lab/log1/biens.yaml` | `label` | Plaid transfert 58 |
| `lab/inventaire.lab/log1/biens.yaml` | `label` | Serviette bain (lot A) |
| `lab/inventaire.lab/log1/biens.yaml` | `label` | Drap housse 160 (lot A) |
| `lab/inventaire.lab/log1/biens.yaml` | `label` | Aspirateur balai |
| `lab/inventaire.lab/log1/biens.yaml` | `label` | TV salon 43 pouces |
| `lab/inventaire.lab/log2/biens.yaml` | `label` | Plaid transfert 58 |
| `lab/lab-config/booking-direct.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/booking-direct.yaml` | `early_checkin_12h` | Early check-in 12h (si pas de départ jour J) \| 30 |
| `lab/lab-config/booking-direct.yaml` | `kit_bebe` | Kit bébé / séjour \| 40 |
| `lab/lab-config/booking-direct.yaml` | `late_checkout_14h` | Late checkout 14h (si pas d'arrivée jour J) \| 50 |
| `lab/lab-config/booking-direct.yaml` | `logements_yaml` | /opt/lcd/custom/logements.yaml |
| `lab/lab-config/booking-direct.yaml` | `petit_dej` | Petit-déj (par pers, coût 5) \| 15 |
| `lab/lab-config/booking-direct.yaml` | `secrets_yaml` | /opt/lcd/secrets.yaml |
| `lab/lab-config/box-nord/agent-box-nord.yaml` | `outbox_dir` | /opt/lcd/outbox/box-nord |
| `lab/lab-config/box-nord/decision-nord.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/box-nord/ics-nord.yaml` | `canaux_ota` | [airbnb, booking, abritel, expedia] |
| `lab/lab-config/box-nord/ics-nord.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/box-nord/ics-nord.yaml` | `logements` | [log3] |
| `lab/lab-config/box-nord/ics-nord.yaml` | `ordre_arbitrage` | [direct, airbnb, booking, abritel] |
| `lab/lab-config/box-nord/ics-nord.yaml` | `secrets_yaml` | /opt/lcd/secrets.yaml |
| `lab/lab-config/box-nord/ics-nord.yaml` | `stop_sell_heure_limite` | 18:00 |
| `lab/lab-config/box-nord/logements.nord.yaml` | `classement` | non_classe_nc |
| `lab/lab-config/box-nord/logements.nord.yaml` | `langue_hote` | fr |
| `lab/lab-config/box-nord/logements.nord.yaml` | `langues_socle` | [fr] |
| `lab/lab-config/box-nord/logements.nord.yaml` | `zones` | [] |
| `lab/lab-config/box-nord/pricing-nord.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/box-nord/pricing-nord.yaml` | `k_saison_par_mois` | {1: 0.80, 2: 0.80, 3: 1.00, 4: 1.00, 5: 1.40, 6: 1.50, |
| `lab/lab-config/caution.yaml` | `abritel_vrbo` | [caution_vrbo, damage_protection] |
| `lab/lab-config/caution.yaml` | `booking` | [tpe_sur_place, lien_declare] |
| `lab/lab-config/caution.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/caution.yaml` | `direct` | [swikly, stripe, tpe] |
| `lab/lab-config/caution.yaml` | `taxe_base_par_classe` | {1: 0.80, 2: 0.90, 3: 1.60, 4: 2.10, 5: 2.80} |
| `lab/lab-config/compta.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/dashboard.yaml` | `nom` | Log3 box-nord (moli) |
| `lab/lab-config/decision-engine.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/dispatch.yaml` | `carte_motifs` | fuite_eau:plombier panne_elec:elec serrure_bloquee:serrurier menage:menage_externe linge:blanchisserie |
| `lab/lab-config/dispatch.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/dispatch.yaml` | `delais_plateforme_j` | airbnb:14 booking:2 vrbo:14 direct:0 |
| `lab/lab-config/dispatch.yaml` | `sla_h` | plombier:24 elec:24 serrurier:4 menage_externe:48 blanchisserie:72 |
| `lab/lab-config/extras.yaml` | `courses_intermarche` | Courses Intermarché (forfait + tickets) \| 25 |
| `lab/lab-config/extras.yaml` | `day_pass_cowork` | Day pass cowork (partenariat, commission) \| 0 \| partenariat_commission_10_15 |
| `lab/lab-config/extras.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/extras.yaml` | `early_checkin_12h` | Early check-in 12h (si pas de départ jour J) \| 30 |
| `lab/lab-config/extras.yaml` | `excursions` | Excursions Lérins / Antibes / St-Paul-de-Vence (lien affilié) \| 0 \| affiliation_10_15 |
| `lab/lab-config/extras.yaml` | `kit_bebe` | Kit bébé / séjour \| 40 |
| `lab/lab-config/extras.yaml` | `kit_bienvenue_offert` | Kit bienvenue OFFERT (charge accueil) \| 0 |
| `lab/lab-config/extras.yaml` | `late_checkout_14h` | Late checkout 14h (si pas d'arrivée jour J) \| 50 |
| `lab/lab-config/extras.yaml` | `location_voiture_velo` | Location voiture livrée / vélo électrique (partenariat local, lien affilié) \| 0 \| partenariat_commission_15_20 |
| `lab/lab-config/extras.yaml` | `minibar_biscuits` | Mini-bar biscuits \| 3.5 |
| `lab/lab-config/extras.yaml` | `minibar_cafe` | Mini-bar café (dosette) \| 1 |
| `lab/lab-config/extras.yaml` | `minibar_chips` | Mini-bar chips \| 3 |
| `lab/lab-config/extras.yaml` | `minibar_chocolat` | Mini-bar chocolat \| 3.5 |
| `lab/lab-config/extras.yaml` | `minibar_eau_50cl` | Mini-bar eau 50cl \| 2 |
| `lab/lab-config/extras.yaml` | `minibar_honnetete` | Mini-bar honnêteté soft-only \| 0 |
| `lab/lab-config/extras.yaml` | `minibar_jus_bio` | Mini-bar jus bio \| 3.5 |
| `lab/lab-config/extras.yaml` | `minibar_kit_apero_soft` | Mini-bar kit apéro soft \| 12 |
| `lab/lab-config/extras.yaml` | `minibar_soda` | Mini-bar soda 33cl \| 3 |
| `lab/lab-config/extras.yaml` | `minibar_the` | Mini-bar thé \| 1 |
| `lab/lab-config/extras.yaml` | `petit_dej` | Petit-déj (par pers, coût 5) \| 15 |
| `lab/lab-config/extras.yaml` | `resa_resto_plage` | Réservation resto/plage partenaire (gratuit voyageur, commission côté resto) \| 0 \| commission_resto_10 |
| `lab/lab-config/extras.yaml` | `transfert_aeroport` | Transfert aéroport (presta VTC commission) \| 30 |
| `lab/lab-config/facturation.yaml` | `contrats_dir` | /opt/lcd/state/contrats |
| `lab/lab-config/facturation.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/facturation.yaml` | `interdits_garde_fou` | ["amende forfaitaire", "non contractuel", "sans recours", |
| `lab/lab-config/facturation.yaml` | `mentions_contrat` | ["L.221-28", "L.612-1", "ec.europa.eu/consumers/odr"] |
| `lab/lab-config/facturation.yaml` | `mentions_facture_b2b` | [] |
| `lab/lab-config/facturation.yaml` | `mentions_facture_b2c` | ["L.612-1", "ec.europa.eu/consumers/odr"] |
| `lab/lab-config/facturation.yaml` | `templates_dir` | /opt/lcd/docs/templates |
| `lab/lab-config/ics-sync.yaml` | `canaux_ota` | [airbnb, booking, abritel, expedia] |
| `lab/lab-config/ics-sync.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/ics-sync.yaml` | `ordre_arbitrage` | [direct, airbnb, booking, abritel] |
| `lab/lab-config/ics-sync.yaml` | `secrets_yaml` | /opt/lcd/secrets.yaml |
| `lab/lab-config/ics-sync.yaml` | `stop_sell_heure_limite` | 18:00 |
| `lab/lab-config/inventaire.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/logements.moli.yaml` | `langue_hote` | fr |
| `lab/lab-config/logements.moli.yaml` | `nom` | Temoins flag off (hors box) |
| `lab/lab-config/logements.moli.yaml` | `zones` | [] |
| `lab/lab-config/logements.moli.yaml` | `zones` | [santa_severa, nice_ouest] |
| `lab/lab-config/passerelle-parc.yaml` | `acces` | /opt/lcd/acces.yaml |
| `lab/lab-config/passerelle-parc.yaml` | `annonces` | /opt/lcd/parc-registre/annonces.yaml |
| `lab/lab-config/passerelle-parc.yaml` | `docs_dir` | /opt/lcd/docs |
| `lab/lab-config/passerelle-parc.yaml` | `entites` | /opt/lcd/parc-registre/entites.yaml |
| `lab/lab-config/passerelle-parc.yaml` | `logements` | /opt/lcd/parc-registre/locations.yaml |
| `lab/lab-config/passerelle-parc.yaml` | `mandats` | /opt/lcd/parc-registre/mandats.yaml |
| `lab/lab-config/passerelle-parc.yaml` | `prospects` | /opt/lcd/parc-registre/prospects.yaml |
| `lab/lab-config/passerelle-parc.yaml` | `revocations` | /opt/lcd/decision-logs/acces-revocations.json |
| `lab/lab-config/passerelle-parc.yaml` | `secrets` | /opt/lcd/custom/passerelle-parc/secrets-registre.yaml |
| `lab/lab-config/passerelle-parc-llm.yaml` | `entites` | {} |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["ollama-local/qwen2.5-7b-instruct", "jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["ollama-local/qwen2.5-7b-instruct", "jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["ollama-local/qwen2.5-7b-instruct", "jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["ollama-local/qwen2.5-7b-instruct", "jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["ollama-local/qwen2.5-7b-instruct", "jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["ollama-local/qwen2.5-7b-instruct", "jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `fallback` | ["jev-one-system/jev-1.13", "degrade_sans_IA"] |
| `lab/lab-config/passerelle-parc-llm.yaml` | `logements` | {} |
| `lab/lab-config/pricing-engine.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/lab-config/pricing-engine.yaml` | `k_saison_par_mois` | {1: 0.80, 2: 0.80, 3: 1.00, 4: 1.00, 5: 1.40, 6: 1.50, |
| `lab/lab-config/stocks.yaml` | `decision_log_dir` | /opt/lcd/logs |
| `lab/logements.lab.yaml` | `classement` | non_classe_nc |
| `lab/logements.lab.yaml` | `langue_hote` | fr |
| `lab/logements.lab.yaml` | `nom` | Temoins flag off (hors box) |
| `lab/logements.lab.yaml` | `zones` | [] |
| `lab/logements.lab.yaml` | `zones` | [santa_severa, nice_ouest] |
| `lab/parc-registre/annonces.modele.yaml` | `arrivee` | 15:00 |
| `lab/parc-registre/annonces.modele.yaml` | `arrivee` | 16:00 |
| `lab/parc-registre/annonces.modele.yaml` | `depart` | 11:00 |
| `lab/parc-registre/annonces.modele.yaml` | `en` | >- |
| `lab/parc-registre/annonces.modele.yaml` | `en` | >- |
| `lab/parc-registre/annonces.modele.yaml` | `equipements` | [wifi, parking, climatisation, lave_linge, lave_vaisselle, |
| `lab/parc-registre/annonces.modele.yaml` | `equipements` | [wifi, climatisation] |
| `lab/parc-registre/annonces.modele.yaml` | `fr` | >- |
| `lab/parc-registre/annonces.modele.yaml` | `fr` | >- |
| `lab/parc-registre/annonces.modele.yaml` | `langue_defaut` | fr |
| `lab/parc-registre/annonces.modele.yaml` | `photos` | ["photo-01.jpg", "photo-02.jpg", "photo-03.jpg", "photo-04.jpg", |
| `lab/parc-registre/annonces.modele.yaml` | `photos` | ["photo-11.jpg", "photo-12.jpg", "photo-13.jpg", "photo-14.jpg", |
| `lab/parc-registre/annonces.yaml` | `archive_le` | 2026-10-20T03:21:37Z |
| `lab/parc-registre/annonces.yaml` | `arrivee` | 17:00 |
| `lab/parc-registre/annonces.yaml` | `arrivee` | 15:00 |
| `lab/parc-registre/annonces.yaml` | `canaux` | [airbnb, direct, booking] |
| `lab/parc-registre/annonces.yaml` | `depart` | 11:00 |
| `lab/parc-registre/annonces.yaml` | `en` | >- |
| `lab/parc-registre/annonces.yaml` | `en` | >- |
| `lab/parc-registre/annonces.yaml` | `equipements` | ["wifi", "parking", "climatisation", "lave_linge", "lave_vaisselle", "terrasse"] |
| `lab/parc-registre/annonces.yaml` | `equipements` | ["wifi", "climatisation"] |
| `lab/parc-registre/annonces.yaml` | `fr` | >- |
| `lab/parc-registre/annonces.yaml` | `fr` | >- |
| `lab/parc-registre/annonces.yaml` | `langue_defaut` | fr |
| `lab/parc-registre/annonces.yaml` | `maj_le` | 2026-10-20T03:21:37Z |
| `lab/parc-registre/annonces.yaml` | `photos` | ["photo-11.jpg", "photo-12.jpg", "photo-13.jpg", "photo-14.jpg", "photo-15.jpg", "photo-16.jpg"] |
| `lab/parc-registre/annonces.yaml` | `photos` | ["p1.jpg", "p2.jpg", "p3.jpg", "p4.jpg", "p5.jpg", "p6.jpg", "p7.jpg"] |
| `lab/parc-registre/annonces.yaml` | `publie_le` | 2026-10-20T03:21:37Z |
| `lab/parc-registre/annonces.yaml` | `statut` | synchronise |
| `lab/parc-registre/entites.modele.yaml` | `exercice` | 01-01/31-12 |
| `lab/parc-registre/entites.modele.yaml` | `iban_ref` | env:ENT_NP_IBAN |
| `lab/parc-registre/entites.modele.yaml` | `libelle` | Julie — nom propre |
| `lab/parc-registre/entites.yaml` | `cree_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/entites.yaml` | `exercice` | 01-01/31-12 |
| `lab/parc-registre/entites.yaml` | `iban_ref` | env:ENT_PORTAL_IBAN |
| `lab/parc-registre/entites.yaml` | `iban_ref` | env:ENT_NP_IBAN |
| `lab/parc-registre/entites.yaml` | `libelle` | Julie — nom propre |
| `lab/parc-registre/entites.yaml` | `maj_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/locations.modele.yaml` | `langue_hote` | fr |
| `lab/parc-registre/locations.yaml` | `langue_hote` | fr |
| `lab/parc-registre/mandats.modele.yaml` | `assurance_ref` | env:ASSURANCE_MRH |
| `lab/parc-registre/mandats.yaml` | `actif_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/mandats.yaml` | `actif_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/mandats.yaml` | `assurance_ref` | env:ASSURANCE_MRH |
| `lab/parc-registre/mandats.yaml` | `cree_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/mandats.yaml` | `maj_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/mandats.yaml` | `motif` | litige reversement en cours |
| `lab/parc-registre/mandats.yaml` | `pret_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/mandats.yaml` | `suspendu_le` | 2026-10-20T03:21:39Z |
| `lab/parc-registre/prospects.yaml` | `bien` | T2 Cagnes-sur-Mer |
| `lab/parc-registre/prospects.yaml` | `contact_ref` | tel:0600000000 |
| `lab/parc-registre/prospects.yaml` | `cree_le` | 2026-10-20T03:22:35Z |
| `lab/parc-registre/prospects.yaml` | `maj_le` | 2026-10-20T03:22:35Z |
| `lab/prestataires.lab/log1.yaml` | `metiers_critiques` | [menage_externe, plombier, elec, serrurier] |
| `lab/prestataires.lab/log1.yaml` | `zones` | [nice_ouest] |
| `lab/prestataires.lab/log1.yaml` | `zones` | [santa_severa, nice_ouest] |
| `lab/prestataires.lab/log2.yaml` | `metier` | menage_externe |
| `lab/prestataires.lab/log2.yaml` | `metiers_critiques` | [menage_externe, plombier, elec, serrurier] |
| `lab/secrets.lab.yaml` | `stripe_secret_key` | sk_test_LAB_FAUX |
| `lab/stocks.lab/log1/conso.yaml` | `id` | essuie_tout |
| `lab/stocks.lab/log1/conso.yaml` | `id` | liquide_vaisselle |
| `lab/stocks.lab/log1/conso.yaml` | `id` | gel_douche |
| `lab/stocks.lab/log1/conso.yaml` | `id` | sac_poubelle_tri |
| `lab/stocks.lab/log1/conso.yaml` | `id` | eponge |
| `lab/stocks.lab/log1/conso.yaml` | `id` | cafe_accueil |
| `lab/stocks.lab/log1/conso.yaml` | `id` | papier_wc |
| `lab/stocks.lab/log1/conso.yaml` | `id` | pastille_lv |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Sacs poubelle tri (lot) |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Papier WC (rouleau) |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Essuie-tout (rouleau) |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Liquide vaisselle (flacon) |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Gel douche (flacon recharge) |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Cafe accueil (dosette) |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Pastille lave-vaisselle |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Kit bienvenue OFFERT (charge accueil) |
| `lab/stocks.lab/log1/conso.yaml` | `label` | Eponge neuve |
| `lab/stocks.lab/log1/conso.yaml` | `unite` | kit |
| `lab/stocks.lab/log1/conso.yaml` | `unite` | lot |
| `lab/stocks.lab/log2/conso.yaml` | `id` | cafe_accueil |
| `lab/stocks.lab/log2/conso.yaml` | `id` | papier_wc |
| `lab/stocks.lab/log2/conso.yaml` | `label` | Papier WC (rouleau) |
| `lab/stocks.lab/log2/conso.yaml` | `label` | Cafe accueil (dosette) |

## Comment fermer cet inventaire

1. chaque **placeholder** est remplace par la donnee reelle du logement (ou par `?` si elle n'existe pas) ;
2. chaque valeur **a documenter** est rapprochee d'un releve (`docs/log1/`, `docs/parc/`, contrat) : soit la piece existe et la valeur devient *source*, soit elle est corrigee ;
3. relancer `deploy/inventaire-donnees.ps1` puis vÃ©rifier `deploy/test-donnees.ps1` : l'inventaire doit se reduire, jamais grossir.
