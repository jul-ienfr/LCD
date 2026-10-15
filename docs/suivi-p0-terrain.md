# P0 — Suivi terrain : inventaire + commandes + réception (log1)

> Norme : plan v5 Phase 0 (~1 050-1 150 €, log1). Docs seuls, 0 code.
> Règle : 1 item reçu = photo + facture archivée (assurance/copro) + test CE.
> Sans photo/facture = non reçu. Copro log1/log2 `verifiee:false` = BLOQUÉES (REQ-L-001).

## 1. P0-1 Inventaire + photos tableau (avant toute commande)

- [ ] Compter radiateurs / vanne / cylindre / interphone (log1).
- [ ] Photos tableau électrique (avant/après électricien P0-8).
- [ ] Verser photos + constats en `docs/log1/copro/` (dossier en cours, cf. etat-reel).

## 2. P0-2 Essentiel (commande France, sans délai Chine)

| Item | Qté log1 | Reçu | Photo | Facture |
|---|---|---|---|---|
| NodOn (fil pilote / relais) | selon radiateurs P0-1 | | | |
| ZLinky | 1 | | | |
| Contacteur | 1 | | | |
| Frient (fumée/incendie) | selon plan §P1 | | | |
| Vanne (coupure eau <2 s) | 1 | | | |
| Nuki (+ Keypad/Hub selon P3) | 1 | | | |
| Onduleur Eaton 3S 550 | 1 | | | |
| Mini-PC (Proxmox P1-1) | 1 | | | |

## 3. P0-3 Chine (délai — commander en premier)

| Item | Reçu | Photo | Facture |
|---|---|---|---|
| ESP32 + INMP441 (bruit dB seuls, jamais d'audio) | | | |
| Sondes Aqara/Sonoff | | | |
| PIR + ouvrants | | | |
| Prises Nous | | | |
| RM4 mini | | | |
| S3-BOX-3 | | | |
| SLZB-06 (PoE, sur onduleur P1-3) | | | |
| QR (plaques / supports) | | | |

## 4. P0-4 Réception : test systématique

- [ ] Marquage CE vérifié (photo).
- [ ] Photo colis + contenu à l'ouverture.
- [ ] Facture archivée (assurance/copro).
- [ ] Test fonctionnel minimal noté (OK/KO + date).
- [ ] KO = retour/SAV tracé ici, pas de montage en P1/P3/P4/P5.

## 5. P0-5/6/7/8 Restants

- [ ] P0-5 Master Lock + clé physique + piles (AA, CR2032).
- [ ] P0-6 Étiquettes : QR thermocollant linge + QR vinyle / NFC NTAG215.
- [ ] P0-7 Mini-bar initial (~35 €, soft-only) + kit bienvenue (~3-5 €).
- [ ] P0-8 Tableau par électricien (230 V) — seul intervenant 230 V, photos avant/après.

## 6. Journal

| Date | Item | Reçu | Photo | Facture | Test | Statut |
|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — |

P0 clos = tout coché + photos/factures versées → débloque P1-box (P1-1..P1-6, P1-9, P1-11/12/14).
