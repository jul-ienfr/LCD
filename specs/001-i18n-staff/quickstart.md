# Quickstart — i18n staff

## Vérifier une page

1. Se connecter.
2. Choisir une langue dans l’en-tête (`FR/EN/ES/IT/DE`).
3. Ouvrir la page cible ; vérifier titres, filtres, boutons, états vides.
4. Recharger : la préférence doit persister.
5. Forcer `?lang=xx` : repli français attendu.

## Commandes

```powershell
cd v2
npm run check
npx vitest run
npm run build
npm run db:check
```

## Pages couvertes à ce jour

- `/login`, `/hote`, `/hote/audit`, `/hote/logements`.
- Menus et sélecteur de langue.

## Restant

Voir `specs/001-i18n-staff/tasks.md` et `v2/PLAN-I18N-STAFF.md`.
