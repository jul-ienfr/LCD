# Registre — Teardowns REA (radar concurrentiel, lab seul)

> `morluto/rea` (MIT, MCP local, `npx rea-agents setup`, Node 22/24/26).
> Radar seul : voir → comprendre côté client → rebuild maison.
> Règle socle §S10 : clean-room, lab seul, docs seuls, 0 code pompé.
> 1 cible = 1 fiche → 1 spec maison → 7 j vitrine log1 si retenue.
> Chaque fiche finit par « limites ». Sans limites = supposition.

## Mode opératoire (identique par teardown)

1. VM lab isolée, cible légalement installée, sans secrets, journal des cibles.
2. Interdits : DRM/auth/chiffrement contournés, CGU violées, backend serveur
   attaqué, scraping OTA auto (§T3), copie code/design/textes/marques.
3. Fiche = comportement + preuves + limites, jamais de dump.
4. Décision : retenir (→ spec maison chiffrée → vitrine 7 j) ou écarter (motif).
5. Juriste comme mandats/CGV avant toute reprise d'écran/wording.

## R-01 Inbox unifiée multi-canal — PRIORITÉ 1

- Cible : inbox mobile/Electron Guesty/Hospitable (compte lab propre).
- Chercher : batching webhooks, triggers auto-messages, snooze, anti-spam,
  SLA affichés, assignation, SLA <15 min 8h-22h tenable comment.
- Rebuild : inbox multi-canal + brouillons IA + SLA → étend
  `dispatch-presta` + `jev-gateway`. Jamais d'envoi auto (§S5).
- Protocole posé 2026-10-15 (lab seul, exécution À FAIRE) :
  1. VM lab isolée + compte lab propre + journal des cibles rempli
     (date/cible/version/compte) avant toute observation.
  2. Observer regroupement fils par réservation/canal/voyageur : 1 fil = 1
     réservation ? Badge non-lu, filtre par logement/statut/canal ?
  3. Noter triggers auto-messages visibles côté client (modèles,
     conditions check-in/J-1/check-out, délai) + si envoi auto ou
     brouillon à valider — chez nous = brouillon IA + 1-tap humaine
     tracée seule, jamais d'envoi auto (§S5).
  4. Noter assignation (qui répond : hôte/équipe/auto), snooze/rappel,
     SLA affiché (<15 min 8h-22h ?), escalade si dépassé.
  5. Noter anti-spam/opt-out visibles + 5 langues (FR/EN/ES/DE/IT) ?
  6. Noter preuves par message : horodatage, canal, auteur (humain vs
     auto), pièces jointes, lien réservation/ménage.
  7. Captures = comportement seul (pas de dump code, pas de clés).
- Preuves à collecter : screenshots wording SLA/triggers, tableau
  canaux observés, délai batching webhook constaté (si visible),
  liste assignation/snooze oui-non.
- Mapping rebuild maison : inbox multi-canal en `dash-operateur` +
  brouillons IA via `:4000` + file `dispatch:8096` + traçabilité
  `entite_id/logement_id` + `pin_transmis:bool` jamais en clair.
- Limites attendues (à remplir) : backend/OTA invisibles, batching
  serveur non mesurable côté client, SLA réel non prouvé sans charge.
- Statut : À FAIRE (protocole posé, exécution lab en attente).

## R-02 Prix explicable — PRIORITÉ 1

- Cible : front web PriceLabs/Beyond (compte lab propre).
- Chercher : présentation reco, explications, bornes UX 1-tap, tradeoff
  mode. Algo serveur invisible : on ne le verra pas, on note ce qu'on
  ne voit pas.
- Rebuild : écran « pourquoi ce prix » + tradeoff mode → `pricing-engine`
  + `dash-operateur`. Règle `clamp(pivot × K_*)` inchangée.
- Protocole posé 2026-10-15 (lab seul, exécution À FAIRE) :
  1. VM lab isolée + compte lab propre + journal des cibles rempli
     avant toute observation.
  2. Observer écran reco prix : valeur proposée, fourchette min-max,
     comparables affichés (lesquels ? distance ? dates ?), confiance ?
  3. Noter explications visibles : facteurs cités (saison, events,
     week-end, occupation, durée, last-minute) vs nos K_* — écart de
     vocabulaire = piste wording « pourquoi ce prix ».
  4. Noter bornes UX : 1-tap accepter/ajuster ? Min-max modifiables ?
     Override manuel tracé (qui+motif) ? Équivalent de notre 409 si
     hors bornes ?
  5. Noter tradeoff mode : curseur remplissage vs revenu ? Profils
     (prudent/agressif) ? Comparer à notre pivot × K_*.
  6. Noter ce qui est INVISIBLE : algo serveur, poids exacts, données
     d'entraînement — on les liste comme limites, on ne les suppose pas.
  7. Captures = comportement seul (pas de dump, pas de clés).
- Preuves à collecter : screenshots écran reco + explications, tableau
  facteurs affichés vs nos K_*, description bornes UX et override.
- Mapping rebuild maison : écran « pourquoi ce prix » en
  `dash-operateur` (décomposition pivot × K_saison × K_events × K_we ×
  K_occ × K_durée × K_lastmin + motif_prix) + tradeoff mode + 1-tap
  (`pricing:8091`) + 409 si hors bornes. Jamais d'auto-OTA.
- Limites attendues (à remplir) : algo serveur invisible, poids non
  mesurables côté client, reco non validée sans A/B réel.
- Statut : À FAIRE (protocole posé, exécution lab en attente).

## R-03 Relance abandon + upsell J-2/J-1 — PRIORITÉ 1

- Cible : portail voyageur Duve/Enso (compte lab propre).
- Chercher : timing upsells, abandon panier, magic-link expiry/rate-limit,
  cut-off J-1 18h tenu comment, géoloc opt-in.
- Rebuild : relance abandon + upsell contextuel → `extras-upsell` +
  `booking-direct`. Opt-out 1-clic, charte anti-spam §S7.
- Protocole posé 2026-10-15 (lab seul, exécution À FAIRE) :
  1. VM lab isolée + compte lab propre + journal des cibles rempli
     avant toute observation.
  2. Observer timing upsells : à quels moments proposés (résa, J-7,
     J-2/J-1, check-in) ? Quels extras en premier ? Ordre = piste
     priorisation `extras:8098`.
  3. Noter abandon panier : relance observée (délai, canal, contenu) ?
     1 relance ou N ? Opt-out visible et fonctionnel ?
  4. Noter magic-link : expiry constatée, rate-limit, renouvellement,
     cut-off J-1 18h tenu comment côté voyageur.
  5. Noter géoloc/opt-in : consentement explicite ? Quid 5 langues
     (FR/EN/ES/DE/IT) et charte anti-spam §S7.
  6. Noter lien avec séjour : PWA/vue voyageur, offline, photos et
     consignes — comparer à notre vue séjour V1 (REQ-S-003-V1).
  7. Captures = comportement seul (pas de dump, pas de clés).
- Preuves à collecter : screenshots timing upsells + relance abandon,
  tableau magic-link (expiry/rate-limit/cut-off), wording opt-out.
- Mapping rebuild maison : relance abandon + upsell contextuel en
  `extras-upsell` + `booking-direct` + vue séjour V1, opt-out 1-clic,
  1-tap humaine tracée seule, jamais d'envoi auto.
- Limites attendues (à remplir) : backend invisible, taux conversion
  non mesurable sans volume, délivrabilité non prouvée en lab.
- Statut : À FAIRE (protocole posé, exécution lab en attente).

## R-04 Tuning bruit validé — PRIORITÉ 2

- Cible : app Minut (compte lab propre).
- Chercher : seuils 3 niveaux, fenêtres, consentement, anti-faux-positifs,
  wording 5 langues, preuves (dB seuls, jamais d'audio).
- Rebuild : tuning + wording → §T1/§L2, 0 hardware nouveau.
- Protocole posé 2026-10-15 (lab seul, exécution À FAIRE) :
  1. VM lab isolée + compte lab propre + journal des cibles rempli
     avant toute observation.
  2. Observer seuils 3 niveaux : valeurs dB par niveau, durées avant
     alerte, fenêtres jour/nuit différenciées ?
  3. Noter anti-faux-positifs : quoi pour éviter les déclenchements
     abusifs (fête 1 soir vs bruit continu) ? Comparer à notre logique
     §T1/L2.
  4. Noter consentement voyageur : info affichée où, wording exact,
     opt-out possible ? Mention RGPD ?
  5. Noter wording 5 langues (FR/EN/ES/DE/IT) des alertes + messages
     voyageur — piste copiable en propre (wording maison, pas copié).
  6. Noter preuves : dB seuls horodatés, jamais d'audio — confirmer que
     c'est bien le standard observé.
  7. Captures = comportement seul (pas de dump, pas de clés).
- Preuves à collecter : screenshots seuils + wording consentement +
  alertes, tableau niveaux/durées/fenêtres.
- Mapping rebuild maison : tuning seuils + wording 5 langues → §T1/§L2,
  0 hardware nouveau, dB seuls jamais d'audio, 1-tap humaine tracée.
- Limites attendues (à remplir) : calibration pièce non visible,
  faux-positifs non mesurables sans déploiement réel.
- Statut : À FAIRE (protocole posé, exécution lab en attente).

## R-05 Durcissement KeyMaster — PRIORITÉ 2

- Cible : Nuki/August (compte lab propre).
- Chercher : provisioning codes, rotation, audit trail, offline, modes
  dégradés sans WAN.
- Rebuild : audit slots 1-10 + révocation +30 min prouvée → P3.
  Réserve 2026-10-14 : KeyMaster HACS = Z-Wave ; si Nuki Matter/Thread,
  reprendre le PATTERN via automatisations Nuki (cf. benchmark-oss.md).
- Protocole posé 2026-10-15 (lab seul, exécution À FAIRE) :
  1. VM lab isolée + compte lab propre + journal des cibles rempli
     avant toute observation.
  2. Observer provisioning codes : création, plages dates, slots,
     auto-expire checkout — comparer à nos slots 1-10 P3.
  3. Noter rotation/révocation : délai effectif (+30 min prouvée ?),
     purge checkout automatique ? Audit trail visible (qui/quand) ?
  4. Noter offline : fonctionnement sans WAN ? Mode dégradé documenté ?
     Comparer à notre offline-first box (§T1).
  5. Noter jamais de PIN en clair : 4 derniers seuls ? `pin_transmis:bool` ?
     Équivalent de notre REQ R-02 observé ou non.
  6. Noter Matter/Thread vs Z-Wave : quel transport observé, passage à
     l'échelle multi-logements comment géré.
  7. Captures = comportement seul (pas de dump, pas de clés, jamais de
     PIN même lab).
- Preuves à collecter : screenshots provisioning + audit trail + mode
  dégradé, tableau slots/rotation/révocation.
- Mapping rebuild maison : audit slots 1-10 + révocation +30 min → P3,
  pattern KeyMaster si Z-Wave sinon automatisations Nuki, jamais de
  PIN en clair, jamais d'auto-ouverture (1-tap humaine tracée §S5).
- Limites attendues (à remplir) : firmware/transport exacts non visibles,
  délai révocation réel non mesurable sans serrure lab.
- Statut : À FAIRE (protocole posé, exécution lab en attente).

## R-06 Moteur direct anti-OTA — PRIORITÉ 2

- Cible : funnel direct Smoobu/Lodgify (compte lab propre).
- Chercher : funnel, codes promo, SEO, reprise abandon, acompte/solde,
  UTM `?src=` tracé comment.
- Rebuild : promo retour J+30/J+180 auto + reprise abandon →
  `booking-direct`. Objectif : direct >30 % à 10 logements (§L4).
- Statut : À FAIRE.

## R-07 QA ménage photo-IA — PRIORITÉ 3

- Cible : ticketing Operto/Breezeway (compte lab propre).
- Chercher : checklist photo obligatoire, score presta, gamification,
  preuves de clôture, écart >20 % géré comment.
- Rebuild : todos + photos + score → `dispatch` + `inventaire`.
  Clôture 409 si preuves manquantes (déjà §P1).
- Statut : À FAIRE.

## R-08 Maintenance prédictive — PRIORITÉ 3

- Cible : conso eau/élec vue concurrent (ZLinky/NodOn, compte lab propre).
- Chercher : seuils surconso, alertes fuite lente, pic conso suivi comment.
- Rebuild : surconso = ticket auto P2 → `grocy-stocks`/`compta` + §S8 SLA.
- Statut : À FAIRE.

## Journal des cibles

| Date | Cible | Version | Compte lab | Fiche | Décision |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
