# ADR-008 — Moteurs GÉNÉRIQUES, cibles runtime par CONFIG (jamais un fork)

Date : 2026-10-17. Statut : accepté (décision humaine console, suite ADR-007/T-11).
Contexte : ADR-007 pose "1 box = 1 runtime" (HA ou Moli). Les services lab
" dédoublés " (ics-sync-nord, pricing-nord, decision-nord) et la phrase
"c'est le 2e moteur"auraient pu être lus comme "1 moteur = 1 fork de code
par box". Cette ADR ferme la porte.

## Décision

1. **Un moteur = UNE base de code, UNE image générique** — les moteurs
   partagent `lab/Dockerfile.moteur` (build-args `SCRIPT`+`CONFIG`) :
   ce qui varie par box = **la CONFIG** (`logements.yaml` sous-ensemble
   du logement + sa clé `runtime:`, mapping `LCD_RUNTIME_MAP`,
   URLs/PIN/secrets, port) — JAMAIS un fork du code. Ajouter un
   logement = taper config, pas écrire un moteur (R3 : 0 fork, 0 clé
   en dur).
2. **Toute écriture moteur → box passe le contrat unique
   `custom/runtime-box/`** (`RuntimeAdapter`) : le MÊME code moteur pousse
   HA ou Moli selon la clé `runtime:` du logement (CONFIG > env).
   Brancher un moteur sur le contrat = modifier LE moteur, qui profite
   à toutes ses instances — jamais "créer un moteur box".
3. **Canal message/voyageur = box native P2+** (automatisation draft →
   empreinte humaine). Le relais d'événements (T-11) ne transporte
   JAMAIS le message ni le PIN.

## Conséquences

- `pricing_engine.py` branche le contrat DANS le moteur unique :
  prix_nuit suit le runtime du logement (HA historique, Moli = helper
  number `prix_nuit` de SA box) ; instances socle/nord identiques.
- Nouveau runtime cible ⇢ un backend dans `runtime-box/`, un mapping
  dans la config — pas un moteur de plus.
- Lab : les services nord restent des INSTANCES d'images génériques
  (split-brain §16.2/G4-b), jamais des variantes de code.

## Rejets

- Forker un moteur par box (code dupliqué, divergences, 0 évolutivité).
- Écrire HA/Moli en dur dans un moteur (le contrat a été posé pour ça).
