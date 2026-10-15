# Registre — Teardowns REA (radar concurrentiel, lab seul)

> `morluto/rea` (MIT, MCP local, `npx rea-agents setup`, Node 22/24/26).
> Radar seul : voir → comprendre côté client → rebuild maison.
> Règle socle §S9 : clean-room, lab seul, docs seuls, 0 code pompé.
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
- Statut : À FAIRE.

## R-02 Prix explicable — PRIORITÉ 1

- Cible : front web PriceLabs/Beyond (compte lab propre).
- Chercher : présentation reco, explications, bornes UX 1-tap, tradeoff
  mode. Algo serveur invisible : on ne le verra pas, on note ce qu'on
  ne voit pas.
- Rebuild : écran « pourquoi ce prix » + tradeoff mode → `pricing-engine`
  + `dash-operateur`. Règle `clamp(pivot × K_*)` inchangée.
- Statut : À FAIRE.

## R-03 Relance abandon + upsell J-2/J-1 — PRIORITÉ 1

- Cible : portail voyageur Duve/Enso (compte lab propre).
- Chercher : timing upsells, abandon panier, magic-link expiry/rate-limit,
  cut-off J-1 18h tenu comment, géoloc opt-in.
- Rebuild : relance abandon + upsell contextuel → `extras-upsell` +
  `booking-direct`. Opt-out 1-clic, charte anti-spam §S7.
- Statut : À FAIRE.

## R-04 Tuning bruit validé — PRIORITÉ 2

- Cible : app Minut (compte lab propre).
- Chercher : seuils 3 niveaux, fenêtres, consentement, anti-faux-positifs,
  wording 5 langues, preuves (dB seuls, jamais d'audio).
- Rebuild : tuning + wording → §T1/§L2, 0 hardware nouveau.
- Statut : À FAIRE.

## R-05 Durcissement KeyMaster — PRIORITÉ 2

- Cible : Nuki/August (compte lab propre).
- Chercher : provisioning codes, rotation, audit trail, offline, modes
  dégradés sans WAN.
- Rebuild : audit slots 1-10 + révocation +30 min prouvée → P3.
  Réserve 2026-10-14 : KeyMaster HACS = Z-Wave ; si Nuki Matter/Thread,
  reprendre le PATTERN via automatisations Nuki (cf. benchmark-oss.md).
- Statut : À FAIRE.

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
