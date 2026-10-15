# P10-10 — Revue modèle éco (trimestrielle, §S8)

> Norme : socle v1 §S8 (modèle éco figé, revu trimestriel).
> Moteur : `journal_revenus` (`custom/passerelle-parc/mandats.py`, batterie §71 verte) — la revue CHIFFRE, elle ne recode rien.
> Registre décision : `docs/registres/a-trancher.md` si arbitrage (prix, seuils, recrutement).

## 1. Forfaits rappel (§S1, `FORFAITS` figé)

| Forfait | Prix | Commission | Cible |
|---|---|---|---|
| FULL | 25 % brut HT + ménage 110 €, plancher 149 €/mois, entrée 290 € | 22 % des 3 lots | Proprio délégant tout |
| PILOTAGE | 149 €/logement/mois (129 € dès 3 lots) | 0 sur brut | Proprio gérant, nous pilotons |
| KIT | 890 € pose + 240 €/an | 0 sur brut | Autonome outillé |

## 2. Coûts fixes (P1/P2/P3 — §S4)

| Poste | P1 | P2 | P3 |
|---|---|---|---|
| Hébergement | 0 € (Vercel Hobby + Oracle Free + Cloudflare) | 0 € (tout Oracle) | ~5 €/mois (VPS) |
| IA/logement | ~1-3 €/mois | ~1-3 €/mois | ~1-3 €/mois |
| RC pro | ~1-2 k€/an (dès mandat tiers, P10-8) | idem | idem |
| Astreinte overflow | provisionnée (partenariat décroché nuit/WE) | idem | idem |
| Temps | ménage 3 h + rotation 3 h + astreinte par lot | idem | idem |

Seuils migration : P1→P2 si BW >80 Go / build >100 h / p95 >800 ms 7 j ;
P2→P3 si CPU/RAM >70 % 14 j OU >15 logements OU outbox >200.

## 3. Point mort (à recalculer chaque trimestre)

- Formule : `charges_fixes_mensuelles / marge_moyenne_par_lot`.
- Ordre de grandeur §S8 : **≈ 3-5 FULL** (ou 8-10 PILOTAGE) en P1/P2.
- À remplir à chaque revue : charges réelles du trimestre, marge/lot constatée,
  point mort recalculé, écart vs prévision précédente + cause.

## 4. BFR (à recalculer chaque trimestre)

- Règle : **1 mois de reversements + stocks**.
- Reversement J+5, clôture compta le 5 : le besoin = décalages constatés, pas théoriques.
- Règle d'or : jamais de dette pour croître (1 client = 1 box payée d'avance ou entrée).
- À remplir : BFR constaté, dérive (retards reversement ? stocks gonflés ?), action.

## 5. KPIs revue du 10 (§S8)

CA, marge/séjour, occupation, RevPAR + NPS proprio/voyageur trimestriel (cible ≥50),
churn annuel (<10 %), CAC vs LTV (cible LTV/CAC ≥3).
Tableau 1 page, 12 mois glissants → portail proprio si requis.

## 6. Journal des revues

| Date | Période | Point mort | BFR | Écart vs N-1 | Décision |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

Première revue : à la clôture du 1er trimestre d'exploitation (pas avant le go-live log1).
