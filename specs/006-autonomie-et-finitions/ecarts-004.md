# Écarts 004 soldés ou acceptés — traçabilité FR-047

```text
Statut : ACTIF
Propriétaire : produit + exploitation
Dernière vérification : 2026-11-24
Remplace / remplacé par : —
Source de vérité : specs/006-autonomie-et-finitions/ecarts-004.md
Référence : specs/004-ergonomie-experience-client/resultats.md § 4
```

FR-047 exige que chaque écart documenté par 004 soit **soldé** ou **explicitement
accepté et tracé**. Ce fichier est la trace unique : une ligne par écart de
`resultats.md` § 4, avec la décision, la preuve, et — quand l'écart reste ouvert
— le porteur et l'échéance. Les écarts qui demandent une personne sont
également inscrits au registre `docs/registres/a-trancher.md` (T-15).

## Décisions par écart

| Réf 004 | Écart | Décision 006 | Preuve / motif | Porteur · échéance |
| --- | --- | --- | --- | --- |
| T075 | Lighthouse en CI en `continue-on-error` | **Accepté** : la mesure reste à la demande, jamais bloquante | Lighthouse n'est pas une dépendance du dépôt (cache `npx`) ; le seuil ≥ 90 est déjà tenu sur le build de production (mobile 93–100, desktop 100, `.artifacts/ergonomie/lighthouse-resume.md`). Rendre l'étape bloquante ajouterait une dépendance lourde sans changer le résultat mesuré. Réévaluation si une régression perf échappe à la mesure à la demande. | super_admin · à la prochaine régression mesurée |
| LCP `/reserver` mobile | LCP simulé 3,08–3,12 s (> 2,5 s) | **Accepté** : le score Lighthouse reste ≥ 90 | Le CSS de rendu (66 Kio) et la première carte dominent ; découper le CSS critique est un chantier de performance séparé, sans impact sur le score ni sur l'utilisabilité mesurée. LCP réel non mesuré en conditions terrain (T110/T107). | super_admin · si la contrainte LCP devient bloquante |
| T007, T008, T011 | Arbitrages thème/marque | **Accepté** : choix humains hors code | Aucun arbitrage ne peut être inventé par un agent ; le code applique déjà le thème publié et les garde-fous de contraste. Les décisions restent au registre T-15. | fondateur · avant go-live |
| T045, T057, T071, T076, T077, T078 | Recette humaine (testeurs, lecteur d'écran, 7 rôles) | **Accepté** : recette humaine restante | L'automatisable est couvert (§ 2.1 de `resultats.md` : 95 routes axe/320 px, clavier, sans JS). Ces points exigent des personnes et un appareil réel. | fondateur · avant go-live |
| T072 | Retrait du flag `ERGONOMIE_NAV` | **Accepté** : flag conservé jusqu'à T071 | Le retrait sans recette 7 rôles supprimerait le seul filet de retour arrière de navigation. Le flag est documenté et sans effet sur les mesures. | fondateur · après T071 |
| T103 | Recette super-admin (brouillon, aperçu, publication) | **Accepté** : validation humaine | Les refus de publication non conforme sont testés (`theme.test.ts`, `/supervision/apparence`) ; le parcours manuel complet reste humain. | fondateur · avant go-live |
| T107 | Second round de 5 testeurs | **Accepté** : dépend de personnes | SC-001, SC-003 et SC-010 restent reportés avec ce motif dans `resultats.md` § 6. | fondateur · après go-live |
| T110 | Déploiement par surface avec retour arrière par route | **Accepté** : hors périmètre local | Aucun environnement cible n'existe avant la mise en production (005) ; le retour arrière global est traité par FR-010. | exploitation · pendant 005 |
| SC-001, SC-003, SC-010 | Indicateurs humains (temps, SUS/SEQ, tickets) | **Accepté** : non mesurables sans testeurs | Dépend de T107 ; aucune donnée ne peut être simulée sans fausser la mesure. | fondateur · après T107 |
| T083 (partiel) | `/logement/[slug]` absent en V2 | **Soldé par décision** : la fiche logement n'est pas une surface V2 | Les informations (inclusifs, taxe, délai) sont publiées sur `/site/[slug]`, `/reserver` et la confirmation ; aucune promesse ne renvoie vers une page absente. | produit · clos |
| Taxe de séjour | Chiffrée à part, paramètres `parametres_fiscaux` | **Soldé** : comportement conforme et testé | `e2e/confiance.spec.ts` accepte explicitement les deux mentions (récapitulatif + note « estimée … non comprise dans le total ») ; sans paramètre, message explicite au lieu d'un montant inventé. | produit · clos |
| axe en `sans-js` | axe ne tourne que dans le projet `js` | **Accepté** : limite de l'outil | axe exige JavaScript pour analyser une page ; le projet `sans-js` couvre rendu, structure et parcours. | produit · clos |

## Ce que 006 a soldé dans le périmètre code

- **FR-038 à FR-046** : retours d'action de `/presta`, confirmations,
  anti-doublon, saisie conservée, notifications, préférences et centre de
  notifications, libellés/ARIA/zones défilantes, hors-ligne terrain, langue
  `?lang=` partout — les frictions d'expérience listées par 004 § 2 sont
  couvertes par des tests dédiés (`v2/tests/ergonomie/`).
- **FR-020, FR-028, FR-029** : pages d'erreur par surface, cache public adapté,
  erreurs API normalisées et journalisées — les fragilités de page/route de
  004 § 2.2 sont fermées.

## Vérification

- `npx vitest run tests/ergonomie` — suite d'ergonomie complète.
- `npm run typecheck` — 0 erreur.
- Registre humain : `docs/registres/a-trancher.md` T-15.
