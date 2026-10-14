# 00 — Vision + portée + gouvernance docs-as-code (v2, plan-only)

> Statut : squelette v2 du 2026-10-14. Ne remplace pas encore les v4/v5.
> Règle : tout ce qui est normatif figé reste en `Socle v1 + cahiers v4/v5`.
> Ici = cap + règles de coordination pour atteindre 10/10.
> Plan-only : 0 touche à `lab/`, `web/`, `custom/*/gateway.py`, moteurs.

## 00.1 Vision (inchangée, rappel §S0)

Conciergerie pilotée par logiciel. Le logiciel = control plane, la
conciergerie = opérateur. Log1 + log2 = vitrines ET bancs d'essai 7 j.
Jamais de test direct chez un client. Multi-tenant dès J1.

## 00.2 Portée v2

Inclus : socle DRY, contrats gateway-boxes-front (§20), passerelle `:8443`
v5, logement v5, technique box v5, exécution v6 (G0→G5 + RACI + risques +
budgets + DoD), glossaire, registres + bac-a-sable pre-deploiement S9 (REQ-S-004).
Exclus (plan-only) : tout code, toute VM réelle, tout mandat tiers payant
sans carte G (bloquant P10-8).

## 00.3 Grille 10/10 (1 pt chaque, CI docs)

1. Clair (phrases courtes, normatif, exemples réels YAML).
2. Borné (bornes §S7 rappelées, jamais de promesse).
3. Testable (chaque REQ = 1 batterie lab verte exigée).
4. Tracé (REQ-xxx → moteur:port → flag → batterie → dashboard).
5. DRY (socle seul fait foi, cahiers renvoient `§S*`, 0 copie).
6. Versionné (semver docs + changelog + tag git par phase).
7. Owner (RACI par phase, 1 owner, jamais de collectif flou).
8. Risque (risques.md, mitigation + owner + échéance).
9. Budget (coût € + temps + seuil, jamais de surprise).
10. Réversible (rollback 1 commande, jamais d'irréversible silencieux).

Score actuel estimé : ~7/10 (perd : Tracé, DRY partiel, Versionné partiel).
Cible v2 : 10/10 au gel (tag).

## 00.4 Les 6 règles de coordination (figées v2)

R1. Socle DRY : forfaits/archi/tenant/hébergement/intangibles/bornes/SLA =
  `§S*` seuls. Toute copie en cahier = remplacée par renvoi.
R2. REQ-IDs : toute exigence = `REQ-[S|P|T|L|E]-NNN` dans
  `docs/registres/exigences.csv`. Sans ID = non exigible en recette.
R3. 1 feature = 1 flag `logements.yaml` + 1 dossier + 1 batterie +
  1 ligne CSV. CI bloque si batterie rouge.
R4. §20 l'emporte sur les contrats : en cas de divergence
  gateway-boxes-front, `20-architecture-contrats.md` + `openapi.yaml`
  réel font foi, jamais le texte d'un cahier.
R5. Séparation normatif / état / TODO : normatif = cahiers ; état réel =
  `registres/etat-reel.md` ; TODO vivants = `registres/a-trancher.md`
  seul. Annexes *-A/*-B des v4 gelées, non reprises en v5.
R6. Gel = tag git : 1 phase close = doc MAJ + batterie verte + runbook daté
  + test offline/rotation + `git tag plan-vX.Y`.

## 00.5 RACI v2 (rappel, détaillé en 60-execution-v6)

- R (réalise) : opérateur (terrain/box), super_admin (P1, secrets, tranches).
- A (approuve) : super_admin seul (prix hors bornes, gestes >50 €, go-live).
- C (consulté) : comptable (seuils), juriste (mandat/CGV), expert-comptable.
- I (informé) : proprio (digest lundi 9h + J+5 + J+30), voyageur (J-2/J-1/J+1).

4 yeux financiers (§S3.1) : reversement + remboursement + débit caution
>300 € + geste >50 € = maker + checker, jamais seul.

## 00.6 MoSCoW v2

- Must : ICS pull 15 min + anti-double-résa + stop-sell, pricing clamp +
  1-tap OTA, PIN séjour sans WAN, outbox idempotente, SQLite V2 (ADR-006),
  i18n 5 langues, PWA séjour, Factur-X/PDF, fiche police 6 mois.
- Should : gap-night auto, late/early auto, pace+pick-up, chargeback 1-tap,
  multivariate A/B, test A/B waiver.
- Could : NL/PT, multi-devises, prévisionnel 90 j, journal hash-chaîné,
  liste d'attente.
- Won't (v1) : Channel API 2-way maison, scraping concurrence auto,
  surréservation (INTERDITE §S5, jamais de Won't réversible).

## 00.7 DoD par phase (5 items, tous cochés ou phase non close)

1. Doc plan MAJ + ligne changelog.
2. Batterie lab verte (1125 OK / 0 KO tenue).
3. Runbook daté + drill si concerné.
4. Test offline 2 h / rotation concernée OK.
5. Tag git `plan-vX.Y`.

## 00.8 Budget + délais (rappel §S8, sans changer)

P1 0 €, P2 0 € Oracle, P3 ~5 €/mois + domaine ~10 €/an. IA ~1-3 €/mois/
logement, alerte >5 €. Phase 0 log1 ~1 050-1 150 €. Effort passerelle
~6-7 sem temps partiel 1 personne (réf. §P10).
