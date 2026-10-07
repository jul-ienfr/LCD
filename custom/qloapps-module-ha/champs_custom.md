# custom/qloapps-module-ha/champs_custom.md — spec P2-3 (§5.2, §5.7-ter).

# Champs custom QloApps + taxe séjour Métropole NCA + gabarits check-in socle 5.
# À créer sur box LXC LAMP P2-1 (BO QloApps > Catalogue > Champs personnalisés
# rattachés aux produits log1/log2). Valeurs lues par `buildPayload()` dans
# `lcd_ha_hook.php` → POST /resa-direct vers ics-sync (même LXC 127.0.0.1:8090).
# Contrat stable : {ref, logement_id, debut, fin, voyageurs, langue, montant, extras[]}
# + P2-3 : heure_arrivee (HH:MM), taxe_sejour (montant € TTC reversé Métropole NCA).
# Secrets : aucun ici (réseau local seul) ; token HA côté ics-sync (`ha_api_token`).

## 1. Champs custom à créer (par produit log1/log2)

| # | Nom BO (slug technique) | Type | Valeurs | Défaut | Usage |
|---|---|---|---|---|---|
| 1 | `lcd_langue` | liste | fr,en,es,it,de (+pt,nl,pl… auto §5.7-ter) | fr | → `input_text.logX_langue_voyageur` → messages J-2/J-1, guide PWA, voix |
| 2 | `lcd_heure_arrivee` | texte HH:MM | 00:00-23:59 | 17:00 | → pré-chauffe/ECS calées (§5.11) |
| 3 | `lcd_voyageurs_adultes` | nombre | 1-5 (log1) / 1-4 (log2) | 2 | nb réel adultes |
| 4 | `lcd_voyageurs_enfants` | nombre | 0-5 | 0 | nb réel enfants (clause copro occupants déclarés) |
| 5 | `lcd_taxe_sejour` | montant € | calcul auto (voir §2) | 0 | reversement Métropole NCA, jamais du CA |
| 6 | `lcd_extras` | cases | kit_bienvenue_offert, minibar_*, late, early, transfert, courses, pack_teletravail… (§5.6-ter) | kit seul | → `todo.logX_extras` + paiement avance, cut-off J-1 18h |

Règles : `voyageurs` payload = adultes+enfants (jamais un id) ; `langue` = ISO
envoyé tel quel (socle validé humain, autre = auto LLM badge auto, fallback EN) ;
`extras[]` = refs catalogue `logements.yaml` bloc `extras:` prix TTC affichés
avant résa (§12.2) ; cut-off J-1 18h : extra non pré-commandé = ne rentre pas.

## 2. Taxe de séjour Métropole Nice Côte d'Azur (taux + parts additionnelles à confirmer en mairie)

- Grille : taux par classe + majorations selon délibération Métropole NCA en vigueur (précédemment CASA : 3* 2,30 €/adulte/nuit ; non classé 5 % plafonné 4,60 € — ne plus utiliser).
- Direct = VOUS collectez via portail taxe de la Métropole NCA (process dashboard).
- OTA intermédiaires de paiement = elles collectent (jamais double reversement).
- `ca_annee` = hors taxe séjour (ligne compta séparée).
- `lcd_taxe_sejour` = montant calculé stocké sur la commande (traçabilité).

## 3. Dates séjour : HotelReservation, pas dates commande

`debut`/`fin` payload = check-in/out QloApps (HotelReservation), format AAAA-MM-JJ
exigé par /resa-direct. Voir TODO-BOX `buildPayload()` (requête HotelReservation
par id_order sur box — noms de tables/colonnes à valider sur la box P2-1 : les
commentaires marquent `TODO-BOX` là où le schéma réel doit être confirmé).

## 4. Gabarits check-in socle 5

- Source : `docs/templates/message_checkin_j2.md` (FR) + `message_checkin_j1.md` (FR).
- FR = langue source validée humain. Traductions EN/ES/IT/DE validées humain
  (fichiers `.*.{en,es,it,de}.md` générés à la validation, gelés ensuite).
- Toute autre maternelle = auto LLM via proxy :4000, badge « traduction
  automatique », fallback EN si échec (cf. §5.7-ter).
- Placeholders `{{ }}` INTOUCHABLES par la traduction : montants, dates, heures,
  adresses, PIN/codes, noms propres ne sont JAMAIS traduits (injectés après).
- Variables J-2/J-1 : {{ marque }}, {{ logement }}, {{ pin }} (vide si boîte à
  clés → message_boite_cles), {{ wifi_qr }}, {{ heure_arrivee }}, {{ adresse }},
  {{ tel_urgence }}, {{ lien_questionnaire }}, {{ lien_guide }}.
- Messages composés par decision-engine `emettre_event()` (langue voyageur),
  jamais par les blueprints. Signés `{{ marque }}`, jamais « LCD/HA ».
- Tokens : jamais de code PIN en clair dans logs/recorder/logbook (4 derniers
  chiffres seuls + excludes).
