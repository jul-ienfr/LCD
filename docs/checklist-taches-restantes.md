# Checklist — 55 tâches restantes terrain/box/externe (base 60-execution-v6 §60.2 v6)

> Sources : `docs/60-execution-v6.md` §60.2/60.3/60.4 + `docs/10-socle-v2.md` §S8 + fonds 30/40/50.
> Progression : `90 / 144` (63 %, +P8-9 clos + P9-14 self-hosted 2026-10-16). Lab fait (batterie verte + run global 0-5/5 exit 0). Reste = terrain/box + réel + externe.
> Recomptage : P0 8 + P1-box 10 + P3 8 + P4 10 + P5 10 + P8 2 + P9-réel 1 + P10 6 = **55 items** (54 dans le compteur 144 + P9-réel hors compteur : VM réelle sur comptes humains, comme P10-9b veille hors compteur).
> Règle : 1 phase terminée = commit + tag + ligne `registres/changelog.md`. Phase non close si DoD incomplet (§60.4).
> RACI §60.3 : P0 R hôte/A super_admin/C électricien. P1-box R hôte/A super_admin. P3/P4/P5 R hôte+presta/A super_admin/C syndic/I client. P8 R hôte+opérateur/A super_admin. P9 R hôte/A super_admin. P10 R super_admin/A juriste+assureur/C expert-comptable/I client.
> Budgets : P0 ~1 050-1 150 € log1 ; Light ~650-750 € ; FULL complet ~2 050-2 150 € ; P1 cloud 0 € ; VPS P3 ~5 €/mois ; RC pro ~1-2 k€/an ; médiation ~200-400 €/an ; juridique ~300-500 €/an ; INPI ~200 € ; 4G ~10 €/mois ; IA ~1-3,2 €/mois/logement. Jamais >200 € sans devis + 1-tap.
> DoD (5 items) : doc MAJ + changelog ; batterie verte + CI ; runbook daté + tableau tests ; test offline/rotation ; tag git.
> Gates §60.1 : G0 lab vert → G1 P1 0 € (:8443 + outbox vide + restore) → G2 box réelle (copro verifiee:true + n° + DPE + RC, séjour témoin zéro-touch + drill 3 h, 1 mois vitrine) → G2bis compta → G3 2e box → G4 1er mandat (P10-8 clos) → G5 parc. Copro `verifiee:false` = BLOQUÉE (REQ-L-001).
>
> **Cadre en vigueur depuis 2026-10-19 : `docs/71-production-locale.md`** —
> l'étape « lab socle » est close ; la barre est « production locale intégrale »
> (rien de simulé, box réelles complètes en local, déployable LAN puis
> Internet). Les 55 items ci-dessous restent valides comme travail
> terrain/externe ; tout ce qui est logiciel et local doit être réel et prouvé.
> Les dépendances tierces sont listées et chiffrées (§6 bis du doc 71), jamais
> simulées.

## Phase 0 — Commandes (~1 050-1 150 € log1)
- [ ] P0-1 Compter radiateurs/vanne/cylindre/interphone + photos tableau | R hôte/A super_admin | 0 €, bloque panier | Prérequis : accès logement
- [ ] P0-2 Commander essentiel France (NodOn, ZLinky, contacteur, Frient, vanne, Nuki, Eaton 3S 550, mini-PC) | inclus P0 | Prérequis : P0-1 (nb NodOn figé, défaut 4)
- [ ] P0-3 Commander Chine délai (ESP32/INMP441, sondes, PIR, ouvrants, Nous, RM4, S3-BOX-3, SLZB-06, QR) | 2× paniers <150 €, 10-20 j → commander en premier | Prérequis : P0-1
- [ ] P0-4 Tester à réception (CE, photo colis/contenu + facture, test OK/KO daté) | KO = retour/SAV, pas de montage | Prérequis : P0-2/P0-3 reçus
- [ ] P0-5 Master Lock + clé physique + piles AA/CR2032 | ~35 € | Gate : fallback P3-8 | Prérequis : P0-4
- [ ] P0-6 Étiquettes QR thermocollant linge + QR vinyle/NFC NTAG215 | ~10-20 € | Gate : inventaire/EDL | Prérequis : P0-4
- [ ] P0-7 Mini-bar initial (~35 € soft-only) + kit bienvenue (~3-5 €) | ~38-40 € | Prérequis : P0-4
- [ ] P0-8 Tableau par électricien 230 V (NodOn, contacteur, ZLinky) | devis, seul intervenant 230 V, photos avant/après | Prérequis : P0-1 + P0-4

## Phase 1-box — Socle offline-first (P1 cloud 0 €, 2e UPS ~40 € option)
- [ ] P1-1 Proxmox + VM HAOS + LXC utils (backup quotidien + hebdo chiffrée) | ½ j | Prérequis : P0 clos
- [ ] P1-2 Z2M canal 25 + availability + backup coordinateur + DHCP statiques | Prérequis : P1-1 + SLZB sur onduleur
- [ ] P1-3 OTBR + ZBT-2 + PoE SLZB sur onduleur | ~15 € | Gate : Thread local P3-7 | Prérequis : P1-1/P1-2
- [ ] P1-4 DuckDNS + LE + WireGuard seul UDP ouvert, jamais HA sans auth | Gate : §S5 (127.0.0.1, 0 port entrant) | Prérequis : P1-1
- [ ] P1-5 NUT + system_monitor + BIOS power restore ON + retour courant | Prérequis : P1-1 + onduleur
- [ ] P1-6 Box FAI sur onduleur, option 2e UPS ~40 € | Gate : 4G failover si WAN down >5 min | Prérequis : P1-5
- [ ] P1-9 secrets.yaml box + rotation (template 22 clés fait, jamais commité) | Prérequis : P1-1
- [ ] P1-11 Coupure WAN 10 min (serrure Thread, chauffage, ECS survivent) | DoD offline 2 h | Prérequis : P1-1→P1-6 + P3/P4
- [ ] P1-12 Coupure secteur 20 min (NUT + remontée + digest) | RTO 2 h | Prérequis : P1-5/P1-6
- [ ] P1-14 Restore backup testée puis trimestriel (chronométré 1×/semestre, écart = P2) | Prérequis : P1-1

## Phase 3 — Accès (catalogue T-02 : Nuki défaut, proprio libre, migration par flag)
- [ ] P3-1 Nuki Go + Keypad AA 8-12 mois, codes poussés, entrée même HA éteint/sans WAN | ~299 € | Prérequis : P1-box + cylindre débrayable
- [ ] P3-2 Nuki Hub ESP32 + watchdog alerte <30 min | ~8 € + spare | Prérequis : P3-1
- [ ] P3-3 KeyMaster slots 1-10, PIN 6 chiffres, arrivée-2 h → départ+30 min, slot ménage permanent | auto-expire + purge, jamais PIN clair | Prérequis : P3-2
- [ ] P3-4 Envoi J-2 + rappel J-1 15 h (moteur direct + SMS/Telegram, langue voyageur) | contrat signé avant PIN | Prérequis : P3-3
- [ ] P3-5 Révocation auto départ+30 min + vérif lock + alerte si échec, jamais punitive en séjour | Prérequis : P3-3
- [ ] P3-6 Portail hall Shelly Uni + relais (~33 €) ou Opener 99-129 € + consigne coupure | accord écrit syndic obligatoire | Prérequis : P0-1 + accord syndic
- [ ] P3-7 Double confirmation ouverture distance ; test PIN sans WAN Thread local | jamais d'ouverture auto | Prérequis : P3-1→P3-5
- [ ] P3-8 Batterie retirée : Master Lock + piles secours OK, code tournant/séjour | Prérequis : P0-5 + P3-1

## Phase 4 — Énergie
- [ ] P4-1 Versatile ×4 + Central + bridage 21 °C + Eco fenêtre ouverte | NodOn 65 €×4 = 260 € | Prérequis : P0-1 + sondes + ouvrants
- [ ] P4-2 RM4 clim (chaud 19-21,5 / froid 25-27) + pré-chauffe -3 h 19 °C + ECS calculée | ~22 € | Prérequis : P1-box
- [ ] P4-3 Prises LV/LL fin cycle → notif + TV/box extinction auto inoccupé | Nous ~12 €×4 = 48 € | Prérequis : P1-2
- [ ] P4-4 Energy (ZLinky+NodOn+Shelly EM+prises) + alertes >0,5 kWh/h inoccupé, pic >90 % | ZLinky ~50 € + EM ~55 € | Prérequis : P4-1/P4-3
- [ ] P4-5 Délestage PAPP >85 % (jamais LL+LV+ECS+ballon) + test charge | Prérequis : P4-4 + électricien si tableau
- [ ] P4-6 Pré-chauffe géoloc si opt-in seul (révocation checkout + purge, jamais fond) | Prérequis : P4-1 + opt-in PWA
- [ ] P4-7 VMC/humidité SDB ; volets à qualifier (SIN-4-RS-20 ~60 €/ouvrant si élec) | Prérequis : P1-box
- [ ] P4-8 Sonde frigo/congélo Aqara (~9 €, alerte >8 °C / >-12 °C 30 min) | Prérequis : P1-2
- [ ] P4-9 Critère : consigne bloquée, ballon chaud après 3 j vide (ECS : contacteur 22 € + Shelly Mini 13 € + diode 1 € = 36 € déjà P0) | Prérequis : P4-1/P4-2
- [ ] P4-10 Mémoire voyageur Confort mémorisée réappliquée, bornes inviolables, opt-in + purge 24 mois | Prérequis : P4-1

## Phase 5 — Sécurité
- [ ] P5-1 Bruit dB seuls/30 s, 3 niveaux, jamais audio/chambres/SDB/amende auto | DIY ~15 € (Minut option ~150 €) | Prérequis : P1-box
- [ ] P5-2 Fuite → vanne <2 s, réarmement toujours manuel | 3 Sonoff ~33 € + bras Aqara T1 ~65 € | Prérequis : vanne quart-de-tour (sinon plombier 80-120 €)
- [ ] P5-3 Incendie interlink déterministe + DAAF + test mensuel (muet >24 h → alerte) | 3 Frient ~165 € + chaleur cuisine 42 € différable | Prérequis : P1-box
- [ ] P5-4 PIR + ouvrants + conso anormale = présomption fête, confirmation humaine 2 sources <2 min | 2 PIR ~26 € + 4 ouvrants ~28 € | Prérequis : P1-2
- [ ] P5-5 Alarmo arm auto checkout+30 min, incendie désarme intrusion | sirène Frient ~45 € | Prérequis : P5-4 + P3
- [ ] P5-6 Journal accès 90 j (heures+slot, jamais code) + tag rôle+marque | Prérequis : P3
- [ ] P5-7 Preuves EDL PWA EXIF + messages J-2/J-1 → AirCover <14 j / Booking 48 h | EDL 13 mois, PII 90 j | Prérequis : P3/P4
- [ ] P5-8 Retour courant : vérif vanne/ECS/chauffage/Versatile + re-arm Alarmo | Prérequis : P1-5/P1-12
- [ ] P5-9 Tests mensuels dashboard ménage + piles AA stock Grocy | retard >30 j = P2 | Prérequis : runbook
- [ ] P5-10 Assurance habitation + RC LCD + RC villégiature J-2 exigée | défaut = suspension après mise en demeure | Prérequis : onboarding §L3

## Phase 8 — Recette/go-live (P8-9 CLOS 2026-10-16 : run global 0-5/5 exit 0, plus dans les restantes)
- [ ] P8-8 Go-live log1 → tag + changelog | Gate G2 (copro true + n° + DPE + RC, séjour témoin + drill 3 h, 1 mois vitrine) | Prérequis : P0→P5 + P8-9 + conformité §L3
- [ ] P8-11 Maintenance annuelle (piles, audit, 4G failover ~30 €) | 4G ~10 €/mois | Prérequis : P8-8

## Phase 9 — Hébergement SaaS (docs faits, réel restant)
- [ ] P9-réel VM Oracle réelle (comptes + DNS + cron + deploy-vps.sh + /v1/statut + backup/restore) | P1 0 €, P3 ~5 €/mois + domaine ~10 €/an si seuils §S4 | Gate G1 (:8443 + outbox vide + restore) | Prérequis : G0 vert + domaine

## Phase 10 — Offre SaaS + 1er client (docs faits, externe restant)
- [ ] P10-6 1er client signé FULL/PILOTAGE + install + go-live + retour 30 j — EXTERNE | entrée FULL 290 € / PILOTAGE 190 €, plancher 149 €/mois | Gate G4 (P10-8 clos + juriste), jamais sans mandat actif | Prérequis : P10-8 + G2bis
- [ ] P10-8 RC pro + carte G Hoguet (CCI + GALIAN/SOCAF + RCP, ~1-2 k€/an, 2-3 mois — bloquant mandat tiers, lancement au 1er prospect) — EXTERNE | + médiation 200-400 €/an + juridique 300-500 €/an | Prérequis : 1er prospect
- [ ] P10-9 Benchmark (10 appels mystères + 5/an, tableau trimestriel §L4) — EXTERNE | Prérequis : kit démo P10-7 fait
- [ ] P10-10 Modèle éco revu trimestriel (point mort 3-5 FULL ou 8-10 PILOTAGE, BFR 1 mois + stocks) | fixes ~5 €/mois + IA ~1-3 €/logement | Gate : revue le 10 + KPIs NPS ≥50, churn <10 %, LTV/CAC ≥3 | Prérequis : G2bis — fiche `docs/revue-modele-eco-p10-10.md` posée, 1re revue au 1er trimestre d'exploitation
- [ ] P10-11 INPI (~200 €, avant 3e client) + formation 1/an min | DUERP dès 1er salarié, 2e personne avant 3e client | Prérequis : P10-6 — fiche `docs/marque-formation-p10-11.md` posée
- [ ] P10-12 AG SAS annuelle (revues trimestrielles = base PV, comptes <6 mois) — EXTERNE | Prérequis : P10-10 — fiche `docs/ag-sas-p10-12.md` posée

Ordre : 1. Terrain P0→P1-box→P3/P4/P5→P8-8. 2. Cloud procédure P1 0 €. 3. Juridique P10-8→P10-6. 4. Commerce 10 appels → kit démo → signature.
