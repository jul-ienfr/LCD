# 60 — Exécution v6 (ordre seul + G0→G5 + RACI + budgets + DoD)

> Statut : v6 du 2026-10-15. Remplace `Plan Execution LCD - Conciergerie v5.md` comme pilotage.
> Socle `§S*` (`docs/10-socle-v2.md`, fiches vues §S3.5 incluses) seul fait foi pour vision/forfaits/archi/tenant/hébergement/intangibles/bornes/SLA/vues (R1).
> Fonds : `docs/30-passerelle-v5.md` (§P1-P10) + `docs/40-logement-v5.md` (§L1-L5) + `docs/50-technique-box-v5.md` (§T1-T7).
> Contrats : `docs/20-architecture-contrats.md` (+ §20.7 plugins) + YAML réels font foi (R4).
> Plan-only : 0 touche à `lab/`, `web/`, `custom/*/`.
> Exigences : `REQ-E-001/002` + `REQ-S-003-V1..V8` (`docs/registres/exigences.csv`). État réel : `registres/etat-reel.md` (R5).
> TODO vivants seuls : `registres/a-trancher.md` (T-01..T-08 TRANCHÉS 2026-10-14). Annexes v5 gelées (R5).

**Progression reprise v5 : `89 / 143` (62 %).**
- Lab/logiciel (P1-partiel, P2, P6, P7, P9-docs, P10-docs) : **fait, batterie 1125 OK/0 KO**
- Terrain/box (P0, P1-box, P3, P4, P5, P8-go-live) : **reste, box requise**
- Externe (P10-6 client, P10-8 RC pro + carte G, juriste, VM réelle) : **reste, décisions humaines**

Règle de clôture : 1 phase terminée = commit + tag + ligne `registres/changelog.md`. Phase non close si DoD incomplet (§60.4).

## §60.1 G0→G5 (jalons passerelle, §P10 + §S4)

| Jalon | Contenu | Gate d'entrée | Gate de sortie |
|---|---|---|---|
| G0 lab | box-lab log1+log2 docker, 15 endpoints, registres YAML, batterie verte | — | batterie 1125 OK/0 KO + `config_ok` vert lab |
| G1 P1 0 € | Oracle Always Free + Vercel Hobby + WG + Cloudflare, `deploy-vps.sh`, `/v1/statut`, backup/restore | G0 vert + domaine + comptes Oracle/Vercel | `:8443` répond + outbox vide + restore testé |
| G2 box réelle 1 | P0 (~1 100 €) → P1-box offline 2 h → P3/P4/P5 → P8-8 go-live log1, 1 mois vitrine sans incident copro | copro `verifiee:true` + n° + DPE + RC | 1 séjour témoin zéro-touch + drill ménage 3 h |
| G2bis compta | `GET /v1/export-compta?format=facturx`, rapprochement CSV alerte >2 %, Chorus/PDP veille | G2 + SIRET vérifié | export accepté + clôture le 5 OK |
| G3 2e box | log2 Light→FULL si besoin, registre `boxes.yaml`, tournées ménage dès 5 logts | G2 stable 1 mois | 2 box fan-out p95 <2 s |
| G4 1er mandat tiers | juriste (mandat+CGV) + RC pro + carte G Hoguet (2-3 mois, bloquant) → P10-6 signé + install + retour 30 j | G2bis + P10-8 clos | reversement J+5 + digest hebdo OK |
| G5 parc | stop global 1-clic, messagerie 3 fils, chargeback 1-tap >20 lots, seuils P1→P2→P3 (§S4) | G4 + >5 logts ou seuils | RTO 2 h mesuré + revue trimestrielle |

Seuils P1→P2 / P2→P3 : §S4 seuls font foi (jamais recopiés ici).

## §60.2 Ordre d'exécution P0→P10 (tâches seules)

### Phase 0 — Commandes (~1 050-1 150 €, log1)
- [ ] P0-1 Compter radiateurs / vanne / cylindre / interphone + photos tableau
- [ ] P0-2 Essentiel : NodOn, ZLinky, contacteur, Frient, vanne, Nuki, onduleur Eaton 3S 550, mini-PC
- [ ] P0-3 Chine (délai) : ESP32/INMP441, sondes Aqara/Sonoff, PIR, ouvrants, prises Nous, RM4 mini, S3-BOX-3, SLZB-06, QR
- [ ] P0-4 Tester à réception (CE, photo + facture assurance/copro)
- [ ] P0-5 Master Lock + clé physique + piles (AA, CR2032)
- [ ] P0-6 Étiquettes : QR thermocollant linge + QR vinyle / NFC NTAG215
- [ ] P0-7 Mini-bar initial (~35 €, soft-only) + kit bienvenue (~3-5 €)
- [ ] P0-8 Tableau par électricien (230 V)

### Phase 1 — Socle box (offline-first)
- [ ] P1-1 Proxmox + VM HAOS + LXC utils (backup quotidien + hebdo chiffrée)
- [ ] P1-2 Z2M canal 25 + `availability` + backup coordinateur + DHCP statiques
- [ ] P1-3 OTBR + ZBT-2 + PoE SLZB **sur onduleur**
- [ ] P1-4 DuckDNS + LE + WireGuard (seul UDP ouvert) ; jamais HA sans auth
- [ ] P1-5 NUT + `system_monitor` + BIOS `power restore ON` + retour courant
- [ ] P1-6 Box FAI **sur onduleur** ; option 2e UPS ~40 €
- [x] P1-7 Packages `log1`/`log2` + arborescence — lab
- [x] P1-8 Blueprints `location/*` — lab, tests box restants
- [ ] P1-9 `secrets.yaml` box + rotation
- [x] P1-10 Recorder 10 j + excludes PIN + `decision.logX.jsonl`
- [ ] P1-11 Coupure WAN 10 min (serrure Thread, chauffage, ECS survivent)
- [ ] P1-12 Coupure secteur 20 min (NUT + remontée + digest)
- [x] P1-13 Dashboard hôte `:8060` — lab
- [ ] P1-14 Restore backup testée (puis trimestriel)

### Phase 2 — Moteurs + synchro + pricing (FAIT lab)
- [x] P2-1→P2-16 Moteurs stdlib (ics-sync, pricing, decision-engine RBAC, booking-direct :8095 maison v1 — T-01 TRANCHÉ 2026-10-14, QloApps écarté v1, facturation, caution, copro-wizard, vitrines) — batterie verte (reste : LXC + URLs/clés réelles)

### Phase 3 — Accès (box requise)
- [ ] P3-1→P3-8 Serrure catalogue T-02 (défaut Nuki + Keypad + Hub ESP32 + KeyMaster slots 1-10, proprio libre, migration par flag — TRANCHÉ 2026-10-14) + J-2/J-1 + révocation départ+30 min + portail + PIN sans WAN + Master Lock

### Phase 4 — Énergie (box requise)
- [ ] P4-1→P4-10 Versatile ×4 + Central + RM4 + prises LV/LL + Energy + délestage + VMC + sonde frigo + mémoire voyageur

### Phase 5 — Sécurité (box requise)
- [ ] P5-1→P5-10 Bruit dB seuls + vanne <2 s + incendie interlink + PIR/ouvrants + Alarmo + journal 90 j + EDL + retour courant + tests mensuels + assurances

### Phase 6 — Exploitation (FAIT lab 22/22)
- [x] P6-1→P6-22 Dispatch, intervenant, inventaire, extras, ménage, stocks, wifi, phrases, mémoire, questionnaire, contrat, EDL, avis, compta, tarifs, RBAC, carnet, formation — batterie verte

### Phase 7 — Voix + LLM/Jev (FAIT lab 20/20)
- [x] P7-1→P7-19 Voix + routage + seuils + traçabilité + pricing + ops + juridique + proxy + garde-fous — batterie verte (split actuel `llm.yaml` 9 usages validé — T-08 TRANCHÉ 2026-10-14)

### Phase 8 — Recette / go-live (box requise pour la fin)
- [x] P8-1→P8-7/10/12 Formation, bornes prix, maintenance dry-run, clone log2 — lab
- [ ] P8-9 Bac-a-sable pre-deploiement vert (REQ-S-004) : faux jeu complet LAB + test global local 1 commande + seed reset OK — bloquant avant G1/G2
- [ ] P8-8 Go-live log1 → tag + changelog
- [ ] P8-11 Maintenance annuelle (piles, audit, 4G failover ~30 €)

### Phase 9 — Hébergement SaaS (docs FAITS, exécution réelle restante)
- [x] P9-1→P9-9 `docs/ops/` + `deploy-vps.sh` + `/v1/statut` + Caddy — reste : VM Oracle réelle
- [x] P9-10 SQLite ADR-006 (`stockage.py` + `parc.db` WAL)
- [x] P9-11 Bascule mesurée (`/v1/statut`)
- [x] P9-12 Front PWA + CI (manifest + vitest + `ci.yml`)
- [x] P9-13 Faux VPS `lab/vps-sim` (7/7)

### Phase 10 — Offre SaaS + 1er client (docs FAITS, externe restant)
- [x] P10-1 Grille §S1 + mandat type + CGV (`docs/templates/`, juriste obligatoire)
- [x] P10-2 Pack par forfait (§L2)
- [x] P10-3 Onboarding 7 étapes (§L3)
- [x] P10-4 Isolation tenant (404/403/400)
- [x] P10-5 Facturation par forfait (`FORFAITS` + `journal_revenus` + simulateur)
- [ ] P10-6 1er client signé (FULL ou PILOTAGE) + install + go-live + retour 30 j — EXTERNE
- [x] P10-7 Kit démo (visite + dashboard + simulateur)
- [ ] P10-8 RC pro + carte G Hoguet (CCI + GALIAN/SOCAF + RCP, ~1-2 k€/an, 2-3 mois — bloquant mandat tiers payant, lancement au 1er prospect jamais avant — T-06 TRANCHÉ 2026-10-14) + assurances mandats — EXTERNE
- [ ] P10-9 Benchmark (10 appels mystères + 5/an, tableau trimestriel, §L4) — EXTERNE
- [ ] P10-10 Modèle éco revu (point mort, BFR, coûts fixes — §S8, revue trimestrielle)
- [ ] P10-11 Dépôt marque INPI (~200 €, avant 3e client) + formation continue (1/an min — §S8)
- [ ] P10-12 AG SAS annuelle (revues trimestrielles §S8 = base PV, comptes <6 mois) — EXTERNE

Prochaines actions (ordre) : 1. **Terrain** P0 → P1-box → P3/P4/P5 → P8-8. 2. **Cloud** `docs/ops/procedure-p1-mise-en-service.md` — 0 €. 3. **Juridique** juriste + RC pro (P10-8) → P10-6. 4. **Commerce** 10 appels mystères (§L4) → kit démo → signature.

## §60.3 RACI + budgets

RACI (R=réalise, A=approuve, C=consulté, I=informé) :

| Phase | R | A | C | I |
|---|---|---|---|---|
| P0 commandes | hôte | super_admin | électricien | — |
| P1-box offline | hôte | super_admin | — | — |
| P2/P6/P7 lab | hôte | super_admin | — | — |
| P3/P4/P5 box | hôte + presta | super_admin | syndic (accès) | client |
| P8 go-live | hôte + opérateur | super_admin | client | voyageur test |
| P9 cloud | hôte | super_admin | — | — |
| P10-6/8/9 juridique+client | super_admin | juriste + assureur | expert-comptable | client |

Budgets (figés, §S1/§S8 seuls font foi pour prix clients) : P0 ~1 050-1 150 € log1 ; Light log2 ~650-750 € ; FULL complet ~2 050-2 150 € ; P1 cloud 0 € ; P3 VPS ~5 €/mois si seuils §S4 ; RC pro ~1-2 k€/an ; médiation ~200-400 €/an ; protection juridique ~300-500 €/an ; marque INPI ~200 € ; 4G failover ~10 €/mois ; OPEX logiciel 0 € strict à ~1-3,2 €/mois/logement. Jamais de dépense >200 € sans devis + validation 1-tap (mandat tiers).

## §60.4 DoD (5 items, tous cochés ou phase non close)

1. Doc plan MAJ (`docs/` + `registres/changelog.md` + `exigences.csv` si REQ touchée).
2. Batterie verte (1125 OK / 0 KO tenue, CI bloquant).
3. Runbook daté (2 pages rotation + incidents, tableau dernier/prochain-test).
4. Test offline/rotation concerné (2 h sans WAN, ou restore RTO 2 h, ou séjour témoin zéro-touch).
5. Tag git (`plan-vX.Y` docs, `go-live-logX` terrain).

## Traçabilité REQ-E

| ID | Exigence | Batterie |
|---|---|---|
| REQ-E-001 | Ordre P0→P10 + G0→G5 + gates mesurés | revue jalons |
| REQ-E-002 | RACI + budgets + DoD 5 items bloquants | CI + tag |
