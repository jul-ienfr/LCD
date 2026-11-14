# Plan d'exécution LCD — Conciergerie v5

> v5 zéro-défaut. Remplace la v4 comme pilotage : renvoie au socle (`§S*`)
> et aux 3 cahiers v4 pour le fond. Ici = l'ordre d'exécution seul.
> Chaque tâche = fait / reste / externe. 1 phase terminée = commit + tag.

**Progression : `89 / 144` (62 %).**
- Lab/logiciel (P1-partiel, P2, P6, P7, P9-docs, P10-docs) : **fait,
  batterie 1125 OK/0 KO**
- Terrain/box (P0, P1-box, P3, P4, P5, P8-go-live) : **reste, box requise**
- Externe (P10-6 client, P10-8 RC pro, juriste, VM réelle) : **reste,
  décisions humaines**

## Phase 0 — Commandes (~1 050-1 150 €, log1)

- [ ] P0-1 Compter radiateurs / vanne / cylindre / interphone + photos tableau
- [ ] P0-2 Essentiel : NodOn, ZLinky, contacteur, Frient, vanne, Nuki, onduleur Eaton 3S 550, mini-PC
- [ ] P0-3 Chine (délai) : ESP32/INMP441, sondes Aqara/Sonoff, PIR, ouvrants, prises Nous, RM4 mini, S3-BOX-3, SLZB-06, QR
- [ ] P0-4 Tester à réception (CE, photo + facture assurance/copro)
- [ ] P0-5 Master Lock + clé physique + piles (AA, CR2032)
- [ ] P0-6 Étiquettes : QR thermocollant linge + QR vinyle / NFC NTAG215
- [ ] P0-7 Mini-bar initial (~35 €, soft-only) + kit bienvenue (~3-5 €)
- [ ] P0-8 Tableau par électricien (230 V)

## Phase 1 — Socle box (offline-first)

- [ ] P1-1 Proxmox + VM HAOS + LXC utils (backup quotidien + hebdo chiffrée)
- [ ] P1-2 Z2M canal 25 + `availability` + backup coordinateur + DHCP statiques
- [ ] P1-3 OTBR + ZBT-2 + PoE SLZB **sur onduleur**
- [ ] P1-4 DuckDNS + LE + WireGuard (seul UDP ouvert) ; jamais HA sans auth
- [ ] P1-5 NUT + `system_monitor` + BIOS `power restore ON` + retour courant
- [ ] P1-6 Box FAI **sur onduleur** ; option 2e UPS ~40 €
- [x] P1-7 Packages `log1`/`log2` + arborescence (55 fichiers, 5 rôles, `visibility:` 8/8) — 2026-10-06, lab
- [x] P1-8 Blueprints `location/*` (J-2, départ-ménage, 21 °C, bruit 3 niveaux, vanne <2 s, incendie) — 2026-10-06, tests box restants
- [ ] P1-9 `secrets.yaml` box (template 22 clés fait) + rotation
- [x] P1-10 Recorder 10 j + excludes PIN + `decision.logX.jsonl` — §§39-40
- [ ] P1-11 Coupure WAN 10 min (serrure Thread, chauffage, ECS survivent)
- [ ] P1-12 Coupure secteur 20 min (NUT + remontée + digest)
- [x] P1-13 Dashboard hôte `:8060` (prix 7 j + journal + todos + santé HA) — §47
- [ ] P1-14 Restore backup testée (puis trimestriel)

## Phase 2 — Moteurs + synchro + pricing (FAIT lab)

- [x] P2-1→P2-16 Moteurs stdlib (ics-sync, pricing §S7, decision-engine RBAC, booking-direct :8095, facturation, caution, QloApps hook, copro-wizard, vitrines) — 2026-10-06, batterie verte (reste : LXC + URLs/clés réelles)

## Phase 3 — Accès (box requise)

- [ ] P3-1→P3-8 Nuki + Keypad + Hub ESP32 + KeyMaster slots 1-10 + J-2/J-1 + révocation départ+30 min + portail + PIN sans WAN + Master Lock

## Phase 4 — Énergie (box requise)

- [ ] P4-1→P4-10 Versatile ×4 + Central + RM4 + prises LV/LL + Energy + délestage + VMC + sonde frigo + mémoire voyageur

## Phase 5 — Sécurité (box requise)

- [ ] P5-1→P5-10 Bruit dB seuls + vanne <2 s + incendie interlink + PIR/ouvrants + Alarmo + journal 90 j + EDL + retour courant + tests mensuels + assurances

## Phase 6 — Exploitation (FAIT lab 22/22)

- [x] P6-1→P6-22 Dispatch, intervenant, inventaire, extras, ménage, stocks, wifi, phrases, mémoire, questionnaire, contrat, EDL, avis, compta, tarifs, RBAC, carnet, formation — batterie verte

## Phase 7 — Voix + LLM/Jev (FAIT lab 20/20)

- [x] P7-1→P7-19 Voix + routage + seuils + traçabilité + pricing + ops + juridique + proxy + garde-fous — batterie verte

## Phase 8 — Recette / go-live (box requise pour la fin)

- [x] P8-1→P8-7/10/12 Formation, bornes prix, maintenance dry-run, clone log2 — lab
- [ ] P8-8 Go-live log1 → tag + changelog
- [ ] P8-11 Maintenance annuelle (piles, audit, 4G failover ~30 €)

## Phase 9 — Hébergement SaaS (docs FAITS, exécution réelle restante)

- [x] P9-1→P9-9 `docs/ops/` (P1 0 € + migration P2/P3 + backup/restore) + `deploy-vps.sh` (init/wg-key/rotate/authelia-users/backup/restore/statut/check) + `/v1/statut` + Caddy `api.` — reste : VM Oracle réelle (comptes + DNS + cron)
- [x] P9-10 SQLite ADR-006 (`stockage.py` + `parc.db` WAL + §69)
- [x] P9-11 Bascule mesurée (`/v1/statut` + §70)
- [x] P9-12 Front PWA + CI (manifest + vitest + `ci.yml`)
- [x] P9-13 Faux VPS `lab/vps-sim` (7/7 + §72)

## Phase 10 — Offre SaaS + 1er client (docs FAITS, externe restant)

- [x] P10-1 Grille §S1 + mandat type + CGV (`docs/templates/`, juriste obligatoire)
- [x] P10-2 Pack par forfait (cahier Logement §L2)
- [x] P10-3 Onboarding 7 étapes (cahier Logement §L3)
- [x] P10-4 Isolation tenant (404/403/400 + §73)
- [x] P10-5 Facturation par forfait (`FORFAITS` + `journal_revenus` + simulateur + §71)
- [ ] P10-6 1er client signé (FULL ou PILOTAGE) + install + go-live + retour 30 j — EXTERNE
- [x] P10-7 Kit démo (visite + dashboard + simulateur)
- [ ] P10-8 RC pro + carte G Hoguet (CCI + garantie GALIAN/SOCAF + RCP + attestations collaborateurs, ~1-2 k€/an, 2-3 mois — bloquant mandat tiers payant) + assurances mandats — EXTERNE (bloquant avant P10-6)
- [ ] P10-9 Benchmark (10 appels mystères initiaux + 5/an, tableau comparatif trimestriel — méthode cahier Logement §L4) — EXTERNE
- [ ] P10-9b Radar REA (lab seul, clean-room §S10, registre `docs/registres/teardowns-rea.md`) : setup `npx rea-agents setup` en VM lab isolée (Node 22/24/26, sans secrets) + journal des cibles + 5 teardowns/an (R-01 inbox → R-02 prix explicable → R-03 upsell J-2/J-1 → R-04 bruit → R-05 KeyMaster → R-06 direct → R-07 QA ménage → R-08 prédictif) + 1 fiche/cible (comportement + preuves + limites) → spec maison → 7 j vitrine si retenue — DOCS SEULS, 0 code prod
- [ ] P10-10 Modèle éco revu (point mort, BFR, coûts fixes — socle §S8, revue trimestrielle)
- [ ] P10-11 Dépôt marque INPI (nom + logo, ~200 €, avant le 3e client) + formation continue (1/an min : ménage, accueil, pricing — socle §S8)
- [ ] P10-12 AG SAS annuelle (revues trimestrielles §S8 = base du PV, dépôt des comptes <6 mois après clôture) — EXTERNE

## Prochaines actions (ordre)

1. **Terrain** : P0 (~1 100 €) → P1-box → P3/P4/P5 → P8-8 go-live log1.
2. **Cloud** : `docs/ops/procedure-p1-mise-en-service.md` (Oracle/Vercel + domaine + cron) — 0 €.
3. **Juridique** : juriste (mandat + CGV) + RC pro (P10-8) → P10-6.
4. **Commerce** : 10 appels mystères (§S1) → kit démo → signature.

*Références : socle commun v1 + cahiers Passerelle/Logement/Technique v4.
Annexes P-A/T-A/L-A = état réel au 2026-10-13 (lab 19 conteneurs, front
`:3100`, batterie 1125 OK/0 KO, commits `0bdcfd0`/`0fae986`/`2d2add3`).*
