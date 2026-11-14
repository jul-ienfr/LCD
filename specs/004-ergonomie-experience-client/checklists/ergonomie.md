# Checklist ergonomie — Ergonomie globale et expérience client

**Purpose**: revue de qualité des exigences et des preuves avant implémentation
et avant chaque gate.

**Created**: 2026-11-12

**Feature**: [spec.md](../spec.md)

**Note**: cocher `[x]` uniquement après revue et vérification de la preuve.

## Alignement avec les plans fondateurs

- [ ] CHK001 La feature reste dans `v2/` et ne rouvre pas les chantiers métier.
- [ ] CHK002 Les contraintes HTML-first et `csr = false` sont respectées.
- [ ] CHK003 Aucune librairie UI ou CDN n'est ajouté.
- [ ] CHK004 Le thème reste global, sans préférence par utilisateur.
- [ ] CHK005 Les cinq langues (fr, en, es, it, de) sont la cible unique.
- [ ] CHK006 Les budgets JS et les seuils LCP/CLS sont conservés.
- [ ] CHK007 Les règles RLS, rôles, tenant et HMAC ne sont pas contournées.
- [ ] CHK008 Les routes et contrats existants restent valides.

## Problème et utilisateurs

- [ ] CHK009 Le problème est formulé avec des preuves (frictions, temps, erreurs).
- [ ] CHK010 Les personas et leurs tâches principales sont explicites.
- [ ] CHK011 Les cinq tâches hôte prioritaires sont validées par l'exploitant.
- [ ] CHK012 Les parcours P1 ont un début, une fin et un temps cible.
- [ ] CHK013 Les cas limites (sans JS, 320 px, offline, erreur) sont couverts.
- [ ] CHK014 Les points à valider sont tranchés ou explicitement reportés.

## Navigation et structure

- [ ] CHK015 La navigation staff a au plus 7 entrées principales par rôle.
- [ ] CHK016 Les groupes secondaires sont nommés par domaine, pas « Plus ».
- [ ] CHK017 La recherche globale est accessible partout et sans JS.
- [ ] CHK018 Le fil d'Ariane est dérivé du modèle, pas écrit à la main.
- [ ] CHK019 `aria-current="page"` est correct sur chaque écran.
- [ ] CHK020 Aucun lien ou action hors rôle n'est visible.
- [ ] CHK021 Aucun doublon de destination dans la navigation.

## Réservation et confiance

- [ ] CHK022 Le parcours tient en deux étapes explicites après le logement.
- [ ] CHK023 Le prix, les dates, les voyageurs et le total sont visibles avant l'envoi.
- [ ] CHK024 Les dates invalides sont bloquées avec un message actionnable.
- [ ] CHK025 Le récapitulatif reste visible sur desktop et mobile.
- [ ] CHK026 Un seul CTA primaire par étape.
- [ ] CHK027 La confirmation indique référence, délai, contact et suite.
- [ ] CHK028 Les inclusions, la taxe et les conditions sont claires.
- [ ] CHK029 Aucun dark pattern (case précochée, faux compteur, promesse floue).
- [ ] CHK030 Le parcours fonctionne sans JS à 320 px.

## Voyageur

- [ ] CHK031 Le premier écran répond à accès, Wi-Fi, horaires, urgence et départ.
- [ ] CHK032 Le guide long est regroupé en sections repliables.
- [ ] CHK033 Les actions incident, extra, départ et avis ont un état et un délai.
- [ ] CHK034 Le mode hors ligne est honnête et lisible.
- [ ] CHK035 Le rejeu outbox ne crée pas de doublon.
- [ ] CHK036 Le mode impression est lisible.
- [ ] CHK037 Le parcours fonctionne sans JS et au lecteur d'écran.

## Accessibilité

- [ ] CHK038 Un skip link permet d'aller au contenu.
- [ ] CHK039 Le `lang` du document est correct sur les cinq langues.
- [ ] CHK040 Les titres, labels et messages sont annoncés correctement.
- [ ] CHK041 Le focus est visible et l'ordre de tabulation est logique.
- [ ] CHK042 Les cibles tactiles des contrôles font ≥ 44 px.
- [ ] CHK043 Les contrastes sont ≥ 4,5:1 (texte normal) sur tous les thèmes.
- [ ] CHK044 Le zoom 200 % ne casse pas les actions.
- [ ] CHK045 `prefers-reduced-motion` supprime les animations non essentielles.
- [ ] CHK046 Aucune information ne dépend de la couleur seule.
- [ ] CHK047 axe ne remonte aucune erreur sérieuse/critique.

## Performance et dégradation

- [ ] CHK048 Aucun JS obligatoire sur public/voyageur.
- [ ] CHK049 Le budget JS voyageur reste < 50 Ko et staff < 200 Ko.
- [ ] CHK050 Lighthouse mobile ≥ 90 sur les cinq pages de référence.
- [ ] CHK051 320 px ne produit aucun défilement horizontal.
- [ ] CHK052 Le mode lite et les vieux navigateurs restent utilisables.
- [ ] CHK053 Les images et polices ne bloquent pas le premier rendu.

## Mesure et amélioration

- [ ] CHK054 Une baseline est mesurée avant la refonte.
- [ ] CHK055 Les événements sont first-party, agrégés et sans PII.
- [ ] CHK056 Les parcours sans JS sont mesurés côté serveur.
- [ ] CHK057 Les rapports comparent baseline et après.
- [ ] CHK058 Les gates G0-G6 ont un seuil et une preuve.
- [ ] CHK059 Une revue ergonomie mensuelle est planifiée.
- [ ] CHK060 Les résultats et décisions sont documentés dans la spec.

## Notes

- Les items non cochés doivent avoir un motif et une date de revue.
- `/speckit.implement` lit les cases comme gate et ne doit pas les modifier.
- Toute exception doit être documentée avec son plan de retrait.
