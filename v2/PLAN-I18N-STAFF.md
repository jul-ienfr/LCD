# Plan i18n staff

État : **terminé** (2026-11-08). Navigation, connexion, tableau de bord et
toutes les pages métier rendus en 5 langues (`fr`, `en`, `es`, `it`, `de`).
Plus aucune page métier sous « Reste » ; tests et `npm run check` verts,
37 dictionnaires typés, tous protégés par `masquerFonctions()`.

## Déjà couvert

- `/login` : libellés, erreurs, captcha, sélecteur de langue.
- `/hote` : en-tête, KPI, arrivées/départs, accès rapides.
- Layout `/hote` : menus principal, Exploitation, Relation, Conformité,
  Administration, actions « Voir le site / Quitter ».
- Cookie `lcd_langue` (un an) et endpoint `/api/langue` avec retour interne
  validé.
- Repli français centralisé par `resoudreLangue()`.

## Pages métier traduites

- `/hote/audit` : en-tête, filtres, actions, pagination et rétention.
- `/hote/logements` : en-tête, formulaire de création, liste, badges et actions.
- `/hote/proprietaires` : mandats, formulaires, libellés de mode/statut et dates.
- `/hote/integrations` : webhooks, événements, statuts de livraison et tableau.
- `/hote/dispatch` : offres, missions, types, statuts et historique.
- `/hote/phrases` : catégories, formulaire, modèles et actions.
- `/hote/tourisme` : lieux, catégories, statuts et formulaire.
- `/hote/tranquillite` : carnet, KPI, formulaire, tableau et lettre.
- `/hote/annonce` : conformité, copropriété, publication, cycle de vie et mentions.
- `/hote/onboarding` : étapes, vérification copropriété, publication et navigation.
- `/hote/formation` : progression, modules, étapes et enregistrement.
- `/hote/police` : fiches, colonnes, état vide et note RGPD.
- `/hote/rgpd` : avancement, DPO, tableau des traitements et durées.
- `/hote/utilisateurs` : comptes, rôles, RC prestataire, 2FA et mots de passe.
- `/hote/sinistres` : dossiers, formulaire, types, statuts et pièces.
- `/hote/avis`, `/hote/questionnaires`, `/hote/objets-trouves` : listes, formulaires et statuts.
- `/hote/extras` : catalogue, commandes, statuts et transitions.
- `/hote/stocks` : consommables, rotation, liste de courses et statuts.
- `/hote/prix` : mode de pilotage, cut-off, plans tarifaires, prix et règles.
- `/hote/assistant` : brouillons, intentions, tons, quota et enregistrement.
- `/hote/fils` : création, filtres, tableau, statuts et dates localisées.
- `/hote/planning/import` : flux ICS, abonnement, import, santé et messages d’action.
- `/hote/entretien` : KPI, formulaire, historique et types d’intervention.
- `/hote/etats-des-lieux` et `/hote/etats-des-lieux/[id]` : constats, brouillon, KPI et historique.
- `/hote/promotions` : codes, conditions, validité et activation.
- `/hote/logements/[id]` et `/hote/logements/[id]/calendrier` : guide et abonnement.
- `/hote/fils/[id]` : réponses, statuts et dates localisées.
- `/hote/design/domaine` : domaine personnalisé, DNS et statuts.

## Pages métier à traduire

Priorité 1 (quotidien) : terminé.

- `/hote/planning`, `/hote/planning/canaux`, `/hote/logements`, `/hote/menage`,
  `/hote/factures`, `/hote/compta`, `/hote/messages`, `/hote/missions`,
  `/hote/cautions`, `/hote/sorties`.

Priorité 2 (relation) :

- Fait : `/hote/avis`, `/hote/questionnaires`, `/hote/objets-trouves`,
  `/hote/phrases`, `/hote/tourisme`, `/hote/tranquillite`, `/hote/sinistres`.

Priorité 3 (conformité et administration) :

- Fait : `/hote/recherche`, `/hote/acces`, `/hote/entite`, `/hote/audit`,
  `/hote/securite`, `/hote/proprietaires`, `/hote/integrations`,
  `/hote/dispatch`, `/hote/annonce`, `/hote/onboarding`, `/hote/formation`,
  `/hote/police`, `/hote/rgpd`, `/hote/utilisateurs`, `/hote/prix`,
  `/hote/assistant`, `/hote/fils`, `/hote/inventaire`,
  `/hote/reglages-groupe`, `/hote/planning/import`.
- Reste : aucune page métier. `/hote/design` redirige immédiatement vers
  `/supervision/apparence` et n’affiche aucun contenu.

## Méthode

- Un dictionnaire par page dans `src/lib/i18n-*.ts`, typé, avec les cinq
  langues et repli via `resoudreLangue()`.
- Les `+page.server.ts` lisent `lcd_langue` et renvoient `t` et `langue`.
- Aucun texte métier critique (montants, statuts, erreurs) ne doit rester
  codé en dur dans le Svelte.
- Test par dictionnaire : les cinq langues ont toutes les clés, repli
  français, aucune valeur vide.
- Les dates et montants utilisent `Intl` avec `data.langue`.
- Les e-mails et PDF restent hors périmètre de cette phase.

## Critère de fin

Toutes les pages listées ci-dessus rendues dans les cinq langues, tests et
`npm run check` verts, puis ligne `i18n 5 langues` passée à **Fait** dans
`ECARTS-V1.md`.
