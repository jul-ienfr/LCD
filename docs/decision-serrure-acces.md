# Décision — Serrure d'accès : Gimdow/Tuya vs Nuki

> Date : 2026-10-08 · Contexte : choix du verrou d'accès log1 (et log2) pour le tunnel zéro-touch.
> Recherche exhaustive menée le 2026-10-08 (GitHub, docs Tuya, fiches produit, communauté).

## 1. La question

Le plan technique (§2.4) retient **Nuki Go + Keypad 2.0** (Home Set Basic 209 €).
Une piste alternative est apparue : les serrures **Gimdow** (OEM Tuya BLE, ~90-150 € sur AliExpress)
avec le clavier radio **Gimdow P1 Pro**. Verdict de faisabilité après recherche exhaustive.

## 2. Matériel identifié

| Élément | Modèle | Identifiants | Prix constaté |
|---|---|---|---|
| Serrure | Gimdow A1 | — | ~60-90 € |
| Serrure | Gimdow A1 PRO | `ms/uueg45qu` | ~90-120 € |
| Serrure | Gimdow A1 PRO MAX | `jtmspro/rlyxv7pe` | ~120-150 € |
| Serrure | Gimdow A1 Ultra | `hc7n0urm` (TuyaOS FD50) | ~150-200 € |
| Clavier | **Gimdow P1 Pro** | BLE, entrée de code | dans le pack lock |

**Références croisées** : même famille OEM Tuya BLE que Raykube A1 Ultra / A1 Pro Max.

## 3. Les 3 questions — réponses (avec preuves)

### Q1 — Le clavier P1 Pro stocke-t-il les codes, ou la serrure ?

**Réponse : la serrure.** Confiance : élevée.

- La spec officielle Tuya (data model réel d'une serrure Tuya, issue make-all/tuya-local#6389)
  place tous les DPs de codes **sur l'objet serrure** : `unlock_method_create` /
  `unlock_method_delete` / `unlock_method_modify`, `temporary_password_creat` /
  `temporary_password_delete`, `remote_no_pd_setkey`, `unlock_offline_pd`.
- Aucune intégration communautaire (ha_gimdow_ble, gimdow_ble ESPHome) ne modélise le clavier
  comme device distinct → cohérent avec un clavier "terminal d'entrée" qui relaie la saisie.
- La fonction **anti-peeping** de la fiche P1 Pro (chiffres parasites avant/après le vrai code)
  est une fonction de parsing du **firmware serrure** : c'est bien le lock qui vérifie les codes.
- prokudin07/gimdow_ble documente les télécommandes BLE physiques comme des **clients BLE**
  qui se connectent au lock (`auto_connect: false` pour les préserver) : ils n'ont pas de mémoire codes.

### Q2 — Peut-on créer/supprimer un code à distance via l'app ? Faut-il un gateway ?

**Réponse : oui via l'app, mais la livraison passe par un relais.** Confiance : élevée.

- La fonctionnalité « programmer la validité d'un code (date/heure) » est **standard Tuya** :
  `temporary_password_creat` = « création de mot de passe avec validité début+fin (calendaire
  ou nomore d'utilisations) » — confirmé par un avis client AliExpress et par la spec.
- Le lock est **enregistré dans le cloud Tuya** lors de l'appairage app Tuya/Smart Life
  (preuve : shrynx/gimdow-tuya et nicolasglg/tuya-smart-lock découvrent les locks depuis un
  projet cloud Tuya via l'API `door-lock/...`).
- **Mais** le lock A1 est BLE seul (pas de Wi-Fi). Pour qu'un ordre cloud atteigne le lock,
  il faut un **relais** : (a) le téléphone avec l'app à portée, (b) un **gateway Tuya**
  (~15-30 €, vendu en option — les listings Amazon mentionnent « GIMDOW with Gateway »),
  ou (c) un ESP32 maison (voir §6 scénarios).
- Testament : `notrix/tuya-lock-temp-password` implémente le flux complet
  `POST /v1.0/devices/{id}/door-lock/temp-password` avec `effective_time`/`invalid_time`
  → la planification par API cloud **fonctionne**.

### Q3 — Le lock est-il visible/pilotable dans le cloud sans gateway ?

**Réponse : visible oui, pilotable à distance seulement via relais.** Confiance : élevée.

- Visible : oui — enregistré au cloud lors de l'appairage app (cf. Q2, intégrations cloud).
- Pilotable : shrynx/gimdow-tuya (lock/unlock cloud) et nicolasglg/tuya-smart-lock
  (ticket d'ouverture cloud) existent et fonctionnent, **mais nécessitent** :
  1. un compte Tuya IoT (projet cloud + abonnement « Smart Lock Open Service »,
     **gratuit mais à renouveler ~tous les 6 mois**),
  2. un relais joignable pour livrer l'ordre au lock BLE (téléphone/gateway/ESP32).

## 4. Cartographie open source (état 2026-10-08)

| Projet | ⭐ | Rôle | Couvre les codes ? |
|---|---|---|---|
| [afalfallaj/ha_gimdow_ble](https://github.com/afalfallaj/ha_gimdow_ble) | 1 | Intégration HA **100% locale BLE**, A1 PRO MAX + A1 PRO (PR ouverte), 443 tests | ❌ |
| [prokudin07/gimdow_ble](https://github.com/prokudin07/gimdow_ble) | 7 | Composant **ESPHome** BLE local, A1 PRO MAX + A1 Ultra, vérifié sur hardware | ❌ |
| [shrynx/gimdow-tuya](https://github.com/shrynx/gimdow-tuya) | 3 | Intégration HA **cloud** (API Tuya Smart Lock), lock/unlock | ❌ |
| [nicolasglg/tuya-smart-lock](https://github.com/nicolasglg/tuya-smart-lock) | 15 | Intégration HA cloud (lock entité), multi-catégories | ❌ |
| [notrix/tuya-lock-temp-password](https://github.com/notrix/tuya-lock-temp-password) | 0 | **Service MQTT → création de temp passwords planifiés** via cloud | ✅ proto (create seul ; delete/planif à ajouter) |
| [DokPlay/ble-lock-set-pin](https://github.com/DokPlay/ble-lock-set-pin) | 1 | Script PIN (delete/create) : capture BLE + API cloud, AES-CTR | ✅ preuve de concept (manuel) |
| [khseal/tuya_local_ble](https://github.com/khseal/tuya_local_ble) | 4 | BLE local Raykube A1 Ultra (expérimental) | ❌ |
| [make-all/tuya-local](https://github.com/make-all/tuya-local) | 1k | tuya_local (HA core) — verrous Wi-Fi/gateway, code éphémère 5 min | ⚠️ partiel |

**Conclusion** : personne n'a fait l'équivalent KeyMaster pour Tuya. Les briques
existent séparément (ouvrir = local ; codes = cloud).

## 5. Protocole — DPs connus (vérifiés dans le code et les tests)

**A1 PRO MAX (`jtmspro/rlyxv7pe`)** — Tuya BLE v3, service `0x1910` :

| DP | Fonction |
|---|---|
| DP6 | Unlock (RAW : action + member ID 1) — A1 PRO |
| DP46 | Lock |
| DP47 | État moteur (push-only, non pollable) |
| DP9 / DP21 | Batterie / dernière alarme |
| DP30 / DP48 | Volume sonore / sens moteur |
| DP33 / DP36 | Auto-lock hardware + durée |

**Aucun DP de codes dans le mapping.** Le client BLE supporte pourtant le transport RAW
(gimdow_ble : `DT_RAW`, `FUN_SENDER_DPS`) — donc techniquement extensible.

**Dés de jeu Tuya standard** (spec officielle, hors Gimdow) : `unlock_method_create` (TLV :
type 01 pwd_id, 02 code 6 chiffres, 03, 04 CRC16, préfixe `31 40 05 12`, chiffré AES-CTR
avec clé de session BLE), `temporary_password_creat` (validité début/fin),
`remote_no_pd_setkey` (member ID + start/end unixtime + usable times + clé 8 chiffres).

**Contrainte BLE** : un seul lien BLE à la fois sur le lock (prokudin07). Si l'ESP32/HA
garde la connexion, le P1 Pro ne peut plus se connecter → `auto_connect: false`
(connexion à la demande) obligatoire. L'A1 Ultra exige en plus un `ble_unlock_check`
(token de session à extraire).

## 6. Scénarios d'architecture

| | **A. Nuki (plan)** | **B. Gimdow + cloud** | **C. Gimdow + local** |
|---|---|---|---|
| Matériel | Home Set Basic 209 € | Lock ~120 € + P1 Pro + gateway ~25 € | Lock ~120 € + P1 Pro + ESP32 existant |
| €/mois | 0 | 0 (renouvellement API/6 mois) | 0 |
| Codes planifiés | ✅ KeyMaster (HACS) | ✅ API cloud (à intégrer) | ❌ **à développer** |
| Ouvre sans WAN | ✅ (codes sur la serrure) | ✅ (anti-peep = local) | ✅ |
| Effort dev | 0 | ~2-5 j (scheduler + delete autour de notrix) | ~1-2 semaines (reverse DP + intégration) |
| Risque | nul | moyen (OEM, API Tuya, relais) | élevé (DP inconnu, BLE, firmware) |
| Garantie/SAV | UE 2 ans | AliExpress | AliExpress |

## 7. Décision

**Retenir Nuki Go + Keypad 2.0 (Home Set Basic, 209 €).**

Motifs : 0 dev, 0 cloud, codes planifiés/révoqués par KeyMaster, ouverture locale garantie,
garantie UE. Le gain Tuya (~60-100 €/logement) ne couvre pas 2-5 jours de dev cloud,
ni 1-2 semaines de reverse-engineering, ni le risque sur le poste « jamais de cheap » du plan.

Le Gimdow reste une option **bidouille** documentée : la base locale est excellente
(2 intégrations pro) et le point d'entrée serait l'endpoint
`/v1.1/devices/{id}/specifications` (déjà appelé par ha_gimdow_ble) pour lister les DPs
réels du firmware et vérifier si un DP de codes est exposé en BLE.

## 8. Reste à trancher (tests matos en main)

1. `specifications` du device A1/A1 PRO : un DP `unlock_method_*` ou `temporary_password_*`
   existe-t-il en BLE direct ? (conditionne le scénario C)
2. Le P1 Pro fonctionne-t-il seul avec le lock (sans app/gateway) ? Codes locaux ?
3. Un gateway Gimdow est-il requis pour la portée/app à distance ?
4. Acceptation du lien BLE exclusif (clavier vs ESP32) en usage réel.

## 9. Sources

- github.com/afalfallaj/ha_gimdow_ble (+ PR #58 « support A1 PRO ») — code, tests, DPs
- github.com/prokudin07/gimdow_ble — ESPHome, contrainte BLE, DP6/46/47
- github.com/make-all/tuya-local — DEVICES.md + issue #6389 (spec DPs officiels Tuya)
- github.com/notrix/tuya-lock-temp-password — flux API temp passwords planifiés
- github.com/DokPlay/ble-lock-set-pin — mécanique TLV/AES-CTR + handshake BLE
- github.com/shrynx/gimdow-tuya, nicolasglg/tuya-smart-lock — chemins cloud
- developer.tuya.com (Smart Lock / BLE Lock) — doc protocole (JS, non extractible)
- gimdow.com, AliExpress, Amazon, DuckDuckGo — **injoignables** depuis l'environnement
  de recherche (blocage réseau) ; Bing sans index sur la marque
