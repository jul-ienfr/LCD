# Panier P0 chiffré log1 — Phase 0 (~1 050-1 150 €) + FULL complet (~2 050-2 150 €) + light log2 (~650-750 €)

> Sources : `docs/40-logement-v5.md` §L2, `docs/50-technique-box-v5.md` §T1, Phase 0 v5 + prix corrigés audit 2026-10-05 (Nuki 299 € réel, Frient 165 €/3).
> Prix constatés 2025-2026, indicatifs, avant devis. Pas d'URL inventée : « à sourcer ».
> Règle : 🇪🇺 OBLIGATOIRE = 230 V tableau, sécurité vie, Nuki, onduleur, mini-PC. 🇨🇳 OK = ESP32, sondes, PIR, ouvrants, Nous, RM4, S3-BOX/Atom, SLZB boutique officielle. Ordre anti-douane : panier EU ~600-700 € + 2× paniers Chine <150 €. Chine en premier (10-20 j, IOSS).
> P0-1 fige les quantités : radiateurs (NodOn 3-5, défaut 4 ; −74 € si 3, +74 € si 5), vanne quart-de-tour (sinon plombier 80-120 € ou report), cylindre débrayable (sinon ~30 €), interphone + accord syndic (sinon pas de portail), WiFi >-70 dBm.

## A. Phase 0 log1 — mise en location (~1 050-1 150 € matériel, hors MO élec)

| # | Désignation | Qté | PU | Sous-total | Variante | Lien type |
|---|---|---|---|---|---|---|
| A1 | Mini-PC Beelink EQ12 N100 16 Go/500 Go (Proxmox P1-1) | 1 | 249 € | 249 € | 🇪🇺 obligatoire | Amazon EU — à sourcer |
| A2 | SMLIGHT SLZB-06p7 PoE CC2652P7 (Ethernet/PoE, jamais WiFi) | 1 | 40 € | 40 € | 🇨🇳 boutique officielle OU 🇪🇺 Domadoo +5 € | boutique officielle SMLIGHT — à sourcer |
| A3 | Home Assistant Connect ZBT-2 (Thread/OTBR, Nuki Matter) | 1 | 39 € | 39 € | 🇪🇺 | revendeur HA/Domadoo — à sourcer |
| A4 | Injecteur PoE 802.3af (0 € si SLZB en USB-C) | 1 | 15 € | 15 € | 🇨🇳 OK | boutique réseau — à sourcer |
| A5 | Onduleur Eaton 3S 550 VA + RJ45 cat6 ×2 + multiprise | 1 | 75 € + 15 € | 90 € | 🇪🇺 onduleur | Amazon EU / élec — à sourcer |
| A6 | Pack Nuki Go + Keypad 2.0 Home Set Basic (Matter/Thread, 200 codes, IP65) | 1 | 299 € | 299 € | 🇪🇺 obligatoire | boutique officielle Nuki — à sourcer |
| A7 | ESP32 devkit Nuki Hub + spare | 1 + 1 | 8 € | 8 € (16 € avec spare) | 🇨🇳 OK | boutique Espressif/Ali — à sourcer |
| A8 | Master Lock + clé secours + piles AA/CR2032 | 1 | 35 € | 35 € | 🇪🇺 | quincaillerie/Amazon EU — à sourcer |
| A9 | Portail : Shelly Uni 15 € + relais 8 € + alim 10 € (accord syndic) ; premium Opener 99-129 € | 1 | 33 € (129 € Opener) | 33 € | 🇪🇺 Shelly | boutique Shelly — à sourcer |
| A10 | Cylindre débrayable (si test P0-1 KO) | 0-1 | 30 € | 0-30 € | 🇪🇺 serrurier | serrurier local — à sourcer |
| A11 | NodOn SIN-4-FP-21 fil pilote + mesure (1 zone salon, +3 différés) | 1 | 65 € | 65 € | 🇪🇺 obligatoire 230 V | boutique NodOn/Domadoo — à sourcer |
| A12 | Sonde T/H Aqara WSDCGQ11LM (salon, +3 différées) | 1 | 9 € | 9 € | 🇨🇳 boutique officielle | boutique officielle Aqara — à sourcer |
| A13 | ECS partiel : contacteur J/N 25 A 22 € + Shelly Plus 1 Mini Gen3 13 € + diode 1N4007 1 € | 1 lot | 36 € | 36 € | 🇪🇺 puissance | boutique élec + Shelly — à sourcer |
| A14 | Fuites Sonoff SNZB-05P (sous-évier, LV, LL/SDB) | 3 | 11 € | 33 € | 🇨🇳 boutique officielle | boutique officielle Sonoff — à sourcer |
| A15 | Bras Aqara Valve Controller T1 (quart-de-tour, <2 s, manuel) | 1 | 65 € | 65 € | 🇨🇳/🇪🇺 certifié | boutique officielle Aqara — à sourcer |
| A16 | Fumée Frient SMSZB-120 EN 14604 (salon/chambre/entrée, 5 ans AA) | 3 | 55 € | 165 € | 🇪🇺 obligatoire | boutique Frient/Domadoo — à sourcer |
| A17 | Bruit DIY ESP32 6 € + INMP441 3 € + boîtier/alim 6 € (dB seuls/30 s, jamais audio) | 1 | 15 € | 15 € | 🇨🇳 OK | boutique ESP32/Ali — à sourcer |
| A18 | Divers : Wago, boîtiers, gaines, piles, étiqueteuse, QR + P0-6 (thermocollant 0,30-0,50 €/u + vinyle/NFC) | 1 lot | 40-60 € | ~40 € | mixte | papeterie/Amazon — à sourcer |
| A19 | Mini-bar soft-only 8-10 refs + kit bienvenue (P0-7) | 1 lot | 35 € + 4 € | 39 € | local | supermarché — à sourcer |
| A20 | Tableau électricien P0-8 (pose NodOn/contacteur/ZLinky, 230 V seul) | 1 | devis | provision hors matériel | 🇪🇺 artisan | électricien local — à sourcer |
| **Total A** | | | | **somme lignes ≈ 1 275-1 305 €** (A10 0-30 € inclus) **ramenée à ~1 050-1 150 € après leviers éco** : SLZB Ali −10/15 €, lots −15/20 %, EQ12 16 Go (vs 32 Go −60/70 €), PoE 0 € si SLZB en USB-C (−15 €), spare Hub différé (−8 €), tablette recond −30/40 € si comptée — hors MO ; −74 € si 3 radiateurs, +74 € si 5 ; vanne non quart-de-tour = +80-120 € ou report | | |

## B. Complément FULL complet (~2 050-2 150 €)

| # | Désignation | Qté | PU | Sous-total | Variante | Lien type |
|---|---|---|---|---|---|---|
| B1 | NodOn supplémentaires (chambre/SDB/cuisine-entrée) | 3 | 65 € | 195 € | 🇪🇺 | boutique NodOn — à sourcer |
| B2 | Sondes Aqara supplémentaires | 3 | 9 € | 27 € | 🇨🇳 officielle | boutique Aqara — à sourcer |
| B3 | Ouverture Sonoff SNZB-04P (baie, fenêtre, SDB, porte) | 4 | 7 € | 28 € | 🇨🇳 officielle | boutique Sonoff — à sourcer |
| B4 | ZLinky_TIC standard (Linky HP/HC + PAPP → Energy/délestage) | 1 | 50 € | 50 € | 🇪🇺 Lixee/Domadoo | boutique Lixee — à sourcer |
| B5 | Shelly EM 1 pince 50 A (ligne ECS) | 1 | 55 € | 55 € | 🇪🇺 | boutique Shelly — à sourcer |
| B6 | Prises Nous A1Z Zigbee + mesure (LV, LL, TV/box, réserve) | 4 | 12 € | 48 € | 🇨🇳 officielle | boutique officielle Nous — à sourcer |
| B7 | PIR Aqara P1 (salon, entrée) | 2 | 13 € | 26 € | 🇨🇳 officielle | boutique Aqara — à sourcer |
| B8 | Chaleur Frient HESZB-120 cuisine | 1 | 42 € | 42 € | 🇪🇺 | boutique Frient — à sourcer |
| B9 | Sirène Frient SIRZB-110 intérieure (pas d'extérieure en copro) | 1 | 45 € | 45 € | 🇪🇺 | boutique Frient — à sourcer |
| B10 | Broadlink RM4 mini (clim IR local, avant mai) | 1 | 22 € | 22 € | 🇨🇳 officielle | boutique Broadlink — à sourcer |
| B11 | Sonde frigo/congélo Aqara (P4-8) | 1 | 9 € | 9 € | 🇨🇳 | boutique Aqara — à sourcer |
| B12 | Tablette Lenovo Tab M9 / Fire HD 10 + support + chargeur (WallPanel ; QR papier en attendant) | 1 | 125 € | 125 € | reconditionné −30/40 € possible | Amazon EU — à sourcer |
| B13 | Voix satellite S3-BOX-3 60 € + Atom Echo 15 € (défaut 0 € BYOD) | 0-1 | 75 € | 0 € / +75 € si PMR/premium | 🇨🇳 M5Stack | boutique officielle M5Stack — à sourcer |
| **Total A+B** | | | | **~2 050-2 150 €** (A ramené ~1 050-1 150 par leviers éco §A + B ~672 + marge 5-10 % ≈ 1 800-1 990 + tablette/voix/différés ; somme brute sans leviers = 1 947-1 977 + 75 € si voix satellite ; vérifié 2026-10-16) | | |

## C. Light log2 (~650-750 €) — sans Nuki/voix/ZBT-2/RM4
- Retiré vs log1 : Nuki 299 + Hub 8 + ZBT-2 39 + S3-BOX/Atom 75 + RM4 22 + portail 33 = **−460-480 €**.
- Box log2 : HA Green ~109 € (ou RPi4 existant) + SLZB 40 + onduleur 75 + câbles 15 = **socle ~239 €** (vs 418 €). ZBT-2 +39 € seulement si Nuki ajouté plus tard (flip `smart_lock:true`, 0 automation réécrite).
- Gardé P0 log2 : socle 239 + 1 NodOn+sonde 74 + ECS partiel 36 + fuite+vanne 98 + fumée 3× 165 + divers 40 + boîte clés 35 ≈ **~690 €** (fourchette **650-750 €**).
- Accès log2 : code boîte manuel/Keybox via calendrier, J-2/J-1 adaptés (pas de PIN). Migration Nuki = pack + ZBT-2 + flip flag.
- Reste différé Phase 1-bis comme log1 : 3 NodOn, ZLinky, EM, prises, ouvrants, PIR, tablette, chaleur cuisine.

## Rappels OPEX (§S8 seul fait foi pour prix clients)
- 0 € strict (Groq free + Ollama + sentences, Jev off) à ~1-3,2 €/mois/logement (Mistral UE + Jev ~0,05-0,15 €), alerte >5 €. 4G failover ~10 €/mois.
- Leviers éco : SLZB Ali −10/15 €, lots −15/20 %, EQ12 16 Go vs 32 Go −60/70 €, tablette recond −30/40 €, test Tuya 18 € vs NodOn 65 € (validation seule, jamais tableau définitif).
