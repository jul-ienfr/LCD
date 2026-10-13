# Plan d'exécution LCD — Conciergerie v4 (2026-10-13)

> v4 zéro-défaut. Remplace la checklist v2.5/v3 comme document de pilotage :
> ce plan présente le chemin d'exécution complet (terrain + lab + SaaS),
> chaque tâche = état réel (fait / reste / externe). Les versions précédentes
> sont archivées (`Plan Implementation LCD - Checklist suivi.md` conservé tel
> quel). Références : Passerelle v3, Logement v3, Technique v3.
> Règle : 1 phase terminée = commit + tag. 0 € logiciel (open source / maison).

**Progression : `89 / 143` tâches (62 %).**
- Phases lab/logiciel (P1-partiel, P2, P6, P7, P9-docs, P10-docs) : **fait, batterie 1125 OK/0 KO**
- Phases terrain/box (P0, P1-box, P3, P4, P5, P8-go-live) : **reste, box physique requise**
- Étapes externes (P10-6 client, P10-8 RC pro, juriste, VM réelle) : **reste, décisions humaines**

---

## Phase 0 — Commandes (matériel log1, ~1 050-1 150 €)

- [ ] P0-1 Compter radiateurs / vanne / cylindre / interphone + photos tableau électrique
- [ ] P0-2 Commander essentiel : NodOn, ZLinky, contacteur, Frient, vanne, Nuki, onduleur Eaton 3S 550 VA, mini-PC
- [ ] P0-3 Commander Chine (délai) : ESP32/INMP441, sondes Aqara/Sonoff, PIR, ouvrants, prises Nous, RM4 mini, S3-BOX-3, SLZB-06, QR linge/équipement
- [ ] P0-4 Tester chaque module à réception (marquage CE, photo + facture assurance/copro)
- [ ] P0-5 Boîte secours Master Lock + clé physique + piles secours (AA, CR2032)
- [ ] P0-6 Étiquettes inventaire : QR thermocollant linge + sticker QR vinyle / NFC NTAG215
- [ ] P0-7 Stock mini-bar initial (~35 €, soft-only) + kit bienvenue (~3-5 €)
- [ ] P0-8 Tableau par électricien (230 V : NodOn, contacteur, ZLinky)

## Phase 1 — Socle box (Proxmox + HA, offline-first)

- [ ] P1-1 Installer Proxmox + VM HAOS + LXC utils (backup auto quotidien + copie hebdo chiffrée)
- [ ] P1-2 Zigbee2MQTT canal 25 + `availability` + backup coordinateur mensuel + DHCP statiques
- [ ] P1-3 OTBR + ZBT-2 (Thread/Matter) + injecteur PoE SLZB **sur onduleur**
- [ ] P1-4 DuckDNS + Let's Encrypt + WireGuard (seul port ouvert UDP) ; jamais d'expo HA sans auth
- [ ] P1-5 NUT (onduleur) + `system_monitor` + BIOS `power restore ON` + automation retour courant
- [ ] P1-6 Box FAI **sur onduleur** ; option 2e petit UPS ~40 €
- [x] P1-7 Packages `log1`/`log2` + arborescence §1.5.6 (55 fichiers, `acces.yaml` 5 rôles, `visibility:` 8/8 dashboards) — fait 2026-10-06, prouvé lab
- [x] P1-8 Blueprints `location/*` (arrivée J-2, départ-ménage, bridage 21 °C, bruit 3 niveaux, fuite→vanne <2 s, incendie) — fait 2026-10-06, tests box restants
- [ ] P1-9 `secrets.yaml` sur box (template 22 clés fait) + rotation
- [x] P1-10 Recorder 10 j + excludes PIN + `decision.logX.jsonl` — prouvé lab §§39-40
- [ ] P1-11 Test coupure WAN 10 min (serrure Thread, chauffage, ECS survivent)
- [ ] P1-12 Test coupure secteur 20 min (NUT + remontée seule + digest)
- [x] P1-13 Dashboard hôte `:8060` (prix 7 j + journal + todos + santé HA, lecture seule) — prouvé lab §47
- [ ] P1-14 Restauration backup testée (trimestriel ensuite)

## Phase 2 — Moteurs + synchro + pricing (logiciel, FAIT lab)

- [x] P2-1→P2-16 Moteurs stdlib 0 € (ics-sync, pricing bornes 75/290, decision-engine RBAC, booking-direct :8095, facturation, caution, QloApps hook, copro-wizard, vitrines) — code fait 2026-10-06, batterie verte (reste : déploiement LXC + URLs/clés réelles sur box)

## Phase 3 — Accès (Nuki + KeyMaster, box requise)

- [ ] P3-1→P3-8 Nuki + Keypad + Nuki Hub ESP32 + KeyMaster slots 1-10 + envoi J-2/J-1 + révocation départ+30 min + portail hall + PIN sans WAN + boîte Master Lock

## Phase 4 — Énergie (box requise)

- [ ] P4-1→P4-10 Versatile ×4 + Central + RM4 clim + prises LV/LL + Energy dashboard + délestage + VMC + sonde frigo + mémoire voyageur

## Phase 5 — Sécurité (box requise)

- [ ] P5-1→P5-10 Bruit dB seuls + fuite→vanne <2 s + incendie interlink + PIR/ouvrants + Alarmo + journal accès 90 j + preuves EDL + retour courant + tests mensuels + assurances

## Phase 6 — Exploitation (logiciel, FAIT lab 22/22)

- [x] P6-1→P6-22 Parcours complet (dispatch, intervenant, inventaire, extras, ménage, stocks, wifi, phrases, mémoire, questionnaire, contrat, EDL, avis, compta, tarifs, RBAC, carnet, formation) — batterie verte

## Phase 7 — Voix + LLM/Jev (logiciel, FAIT lab 20/20)

- [x] P7-1→P7-19 Voix + routage IA + seuils + traçabilité + pricing + ops + juridique + proxy + garde-fous — batterie verte

## Phase 8 — Recette / go-live (box requise pour la fin)

- [x] P8-1→P8-7/10/12 Recette lab (formation, formation, bornes prix, maintenance trimestrielle dry-run, clone log2) — prouvées lab
- [ ] P8-8 Go-live log1 → tag git + changelog
- [ ] P8-11 Maintenance annuelle (piles, audit, 4G failover ~30 €)

## Phase 9 — Hébergement SaaS 3 phases (docs FAITS, exécution réelle restante)

- [x] P9-1→P9-9 Procédures `docs/ops/` (P1 mise en service 0 € + migration P2/P3 + backup/restore) + `deploy-vps.sh` (init/wg-key/rotate/authelia-users/backup/restore/statut/check) + compteurs `/v1/statut` + Caddy `api.` actif — reste : exécution sur VM Oracle réelle (comptes + DNS + cron)
- [x] P9-10 Base SQLite ADR-006 (`stockage.py` + `parc.db` WAL + batterie §69) — fait
- [x] P9-11 Bascule mesurée (`GET /v1/statut` + batterie §70) — fait
- [x] P9-12 Front PWA + CI (`manifest.ts` + vitest + `.github/workflows/ci.yml`) — fait
- [x] P9-13 Faux VPS `lab/vps-sim` (test-vps.ps1 7/7 + batterie §72) — fait

## Phase 10 — Offre SaaS + 1er client tiers (docs FAITS, externe restant)

- [x] P10-1 Grille tranchée (FULL 25 % + 110 € / PILOTAGE 149 € / KIT 890 €+240 €) + mandat type + CGV entité (`docs/templates/`, relecture juriste obligatoire) — fait
- [x] P10-2 Pack box par forfait (Logement v3 §1 : FULL ~890 € / PILOTAGE ~640 €+190 € / KIT 890 €) — fait
- [x] P10-3 Onboarding 7 étapes (Logement v3 §2) — fait
- [x] P10-4 Isolation tenant (404/403/400 + batterie §73) — fait
- [x] P10-5 Facturation par forfait (`FORFAITS` enum + `journal_revenus` + simulateur + batterie §71) — fait
- [ ] P10-6 1er client tiers signé (1 logement FULL ou PILOTAGE) + install + go-live + retour 30 j — EXTERNE
- [x] P10-7 Kit démo (visite log1 + dashboard + simulateur) — fait
- [ ] P10-8 RC pro conciergerie + assurances mandats tiers — EXTERNE (bloquant avant P10-6)

---

## Prochaines actions (ordre)

1. **Terrain** : P0 (commandes ~1 100 €) → P1-box → P3/P4/P5 → P8-8 go-live log1.
2. **Cloud** : exécuter `docs/ops/procedure-p1-mise-en-service.md` (comptes Oracle/Vercel + domaine + cron) — 0 €.
3. **Juridique** : relecture juriste (mandat + CGV) + RC pro (P10-8) → P10-6 1er client.
4. **Commerce** : 10 appels mystères (valider grille) → kit démo → signature.

*Annexe — état réel au 2026-10-13 : lab 19 conteneurs verts, front `:3100` refondu 2026, batterie **1125 OK / 0 KO** (§§69-73), commits `2d2add3`/`0fae986`.*
