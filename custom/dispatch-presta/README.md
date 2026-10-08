# custom/dispatch-presta — dispatch prestataires + dossier sinistre (P6-8, §12.4-bis) + todos ménage (P6-1, §1.6.2)

Moteur stdlib `:8096`. Proposition seule, jamais d'envoi auto ; mission = 1-tap humaine.

## Contrats

- `GET /health` → `{"ok": true}`
- `GET /annuaire?logement_id=log1` → prestataires (statut `actif` / `suspendu_assurance` /
  `inactif`) + alertes couverture (<2 actifs/métier/zone) + rappels RC J-30/J-7
- `POST /dispatch {logement_id, metier, zone?, motif?, qui?}` → `proposition` (1er en
  zone, tri prix/note si renseignés) + `deuxieme_choix` hors zone avec surcoût +
  `escalade_hote` si aucun en zone. `motif` seul suffit (carte `fuite_eau→plombier`…).
  Si `annuaire_presta: off` → `mode: contacts_libres`.
- `POST /mission {logement_id, presta_id, motif, qui, debut?, fin?}` → 201, 1-tap HUMAINE
  exigée (`qui=auto/llm/jev` → 400), RC invalide → 403. Crée
  `interventions/logX/<date>_<presta>_<motif>/{mission.md, intervention.json, avant/, apres/}`.
- `GET /intervention?logement_id=log1&dossier=<nom>` → état mission (statut,
  pointage, photos, temps).
- `POST /pointage {logement_id, dossier, evenement: arrivee|depart, qui}` → 200
  (départ sans arrivée → 409 ; geste intervenant seul, `qui=auto` → 400).
- `POST /photo {logement_id, dossier, phase: avant|apres, piece, nom,
  donnees_base64, qui}` → 201 (jpg/png/webp ≤8 Mo, stockée
  `{avant,apres}/<piece>_<ts>_<nom>` + entrée `photos_avant/apres` avec pièce/ts).
- `POST /cloture {logement_id, dossier, temps_declare_min?, justificatif?, qui}` →
  409 `preuves_manquantes` (pointage arrivée/départ ou photos AVANT/APRÈS par
  pièce incomplets : clôture/facturation BLOQUÉES) ; 409 `justificatif_requis`
  (écart >20 % présence vs déclaré sans texte) ; 201 `cloturee` avec
  `temps_facture_min` = temps pointé + `alerte_ecart` si >20 % (jamais sanction
  auto, dossier `nom` seul accepté — aucun chemin arbitraire ne sort des missions).
- `POST /sinistre {logement_id, motif, declarant, description, canal?, resa?}` → 201,
  `sinistres/logX/<AAAA-MM-JJ>_<motif>/fiche.json` + échéance plateforme
  (Airbnb 14 j ET avant suivant / Booking 48 h / Vrbo ~14 j). Suivi caution :
  jamais de retenue sans justificatifs.
- `POST /todos {logement_id, ref_resa?, checkout?, checkin_suivant?, arrivee?,
  presta_dispo?, sejours_rapproches?, extras_payes[]?, qui}` → 201, dossier
  `menage/logX/<date>_<ref>_menage/{todos.json, entree/, sortie/}`. 7 items
  socle + deadline check-in −2h + assigné interne/presta + extras fusionnés si
  `extras_upsell: on` + notifs multi-destinataires (hôte + intervenant +
  voyageur si `etat_lieux_auto: on`). `qui=auto/llm/jev` → 400.
- `GET /todos?logement_id=log1[&dossier=...]` → liste ou détail + statut.
- `POST /menage-intermediaire {logement_id, qui, ref_resa?, arrivee, depart,
  frequence_j?, heure_pref?, pendant_absence?, presta_dispo?}` → 201, dates
  certaines arrivée+N × fréquence < départ (défaut J+7 si séjour ≥10j sans
  pref, sinon `fin_sejour_seul` si <10j) + dossiers `menage/logX` via `/todos`
  (création HUMAINE, `qui=auto` → 400) + facturation info SÛRE (`offert` dès
  14j si `mode_gestion_defaut: remplissage_max`, sinon 60 EUR par passage) +
  messages voyageur J-1 SÛRS (jamais de PIN). P6-13 (§5.6 + §5.7-quater).
- `POST /menage-pointage {logement_id, dossier, evenement: arrivee|depart, qui}`
  → 200 (départ sans arrivée → 409 ; `qui=auto` → 400).
- `POST /menage-photo {logement_id, dossier, phase: entree|sortie, piece, nom,
  donnees_base64, qui}` → 201 (jpg/png/webp ≤8 Mo).
- `POST /menage-cloture {logement_id, dossier, checklist?, photos_voyageur_ok?,
  dossier_intervention?, qui}` → 409 `preuves_manquantes` (pointage, photos
  E/S par pièce, photos voyageur si `etat_lieux_auto`, dossier intervention
  clôturé si `traca_intervenants`) / `cases_manquantes` (checklist 7 cases) ;
  201 `remise_en_dispo`. Traversée `..` bloquée comme P6-2. P6-16 : si le
  voyageur a COMMENCÉ son EDL PWA (dossier `etat_lieux/logX/<ref>` pour la
  `ref_resa` du todo), l'EDL complet est exigé (attestation humaine seule
  insuffisante) ; sans dossier EDL : legacy (attestation humaine).
- `GET /edl?logement_id=log1&ref_resa=<slug>` → P6-16 (§5.6) : statut EDL
  voyageur (`non_commence` / `consenti` / `partiel` / `complet` + comparatif
  entrée/sortie par pièce + purge 90 j). Jamais bloquant.
- `POST /edl-consentement {logement_id, ref_resa, qui, consentement: true,
  nom_voyageur?}` → 201 `consenti` (préalable obligatoire : photos du
  logement seul, jamais de personnes exigées, purge 90 j) ; `false` → 200
  `refuse` (EDL manuel ménage seul). Geste voyageur/humain seul.
- `POST /edl-photo {logement_id, ref_resa, phase: entree|sortie,
  piece: salon|cuisine|chambre|sdb|entree, nom, donnees_base64, prise_le?,
  qui}` → 201 (jpg/png/webp ≤8 Mo, EXIF/horodatage conservés, galerie >24 h
  → 422 `galerie_refusee`, sans consentement → 403).
- `POST /edl-video {logement_id, ref_resa, phase, nom, donnees_base64,
  duree_s, qui}` → 201 optionnelle (<60 s, mp4/mov/webm ≤50 Mo, 422
  `video_trop_longue` sinon).
- `POST /edl-purge {logement_id, qui}` → 200 dossiers >90 j supprimés
  (juste après délai AirCover 14 j, geste humain seul).
- `POST /objet-trouve {logement_id, qui, description, piece?, ref_resa?,
  photo_base64?}` → P6-17 (§5.7-bis) : 201 fiche `objets/logX/<id>.json` +
  photo (message voyageur J+0 si `ref_resa`, geste intervenant seul,
  forfait 15 € rappelé).
- `GET /objets?logement_id=log1[&statut=trouve]` → P6-17 : liste fiches
  (trouve/reclame/envoye/don/stock, filtre 400 si statut inconnu).
- `POST /objet-reclamer {logement_id, objet_id, qui, ref_resa}` → P6-17 :
  200 `reclame` (voyageur/humain, jamais auto ; déjà traité → 409).
- `POST /objet-envoyer {logement_id, objet_id, qui, preuve_paiement}` →
  P6-17 : forfait 15 € inviolable, sans preuve → 402 `paiement_requis` ;
  200 `envoye` (Colissimo, traçé).
- `POST /objet-cloturer {logement_id, objet_id, qui, sort: don|stock}` →
  P6-17 : non réclamé 30 j (sinon 409 `trop_tot`) → 200 `don`/`stock`.
- `GET /menage-tarif?logement_id=log1` → P6-19 (§12.2-ter) : supplément +
  10 postes (prorata socle log1 110 €, total == montant, MO en solde) +
  surcharge saison +20 € juin-sept (info, humain jamais auto) + alerte si
  `inclus_nuit` (durée min ≥4 requise).
- `POST /menage-cout {logement_id, qui, montant, ref_resa?, dossier?,
  facture?}` → P6-19 : 201 coût réel rotation (saisie HUMAINE → OPEX
  §12.6, dérive rotation affichée).
- `GET /menage-couts?logement_id=log1` → P6-19 : rotations + moyenne +
  dérive vs affiché (alerte >10 %, ≥2 rotations) + payload
  `sensor.menage_cout_rotation`.
- `POST /menage-note {logement_id, qui, note 1-5, ref_resa?, dossier?,
  commentaire?}` → P6-19 : 201 score qualité (+ alerte temps si pointage
  dossier écart >20 % vs ~3h).
- `GET /menage-score?logement_id=log1` → P6-19 : moyenne + alerte <3,5
  (≥3 notes) + durées pointées vs ~3h + écarts.
- `GET /formation?logement_id=log1[&session=<id>]` → P6-22 (§14) :
  programme 30 min (5 modules) ou statut session (modules + test départ).
- `POST /formation-session {logement_id, qui, presta}` → P6-22 : 201
  session rotation blanche (drill 1×/trimestre + papier daté).
- `POST /formation-module {logement_id, qui, session, module}` → P6-22 :
  200 module coché 1-tap (pointage/photos/checklist/edl_comparatif/
  cloture ; idempotent ; 409 si session validée).
- `POST /formation-valider {logement_id, qui, session, dossier_menage}` →
  P6-22 : 200 `formation_validee` (5 modules + dossier `remise_en_dispo`,
  sinon 409 `formation_incomplete`) — attestée par l'hôte.

## Règles verrouillées

Zone + actif + RC valide seuls dispatchés. Hors zone = 2e choix, jamais auto.
Ancien champ `zone:` texte migré vers `zones:` + avertissement `migrations`.
Traçabilité `decision.logX.jsonl` (schéma P2-13).

## Lab / box

Lab : `lab/lab-config/dispatch.yaml` + annuaires fictifs `lab/prestataires.lab/` —
traiter le lab comme la box (cf. `lab/README.md` transfert `export-box.sh`).
