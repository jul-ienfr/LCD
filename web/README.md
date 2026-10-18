# LCD Parc — web/ (option B)

Frontend moderne (Next.js 16 + React 19 + Tailwind 4) sur la passerelle `:8443`.
Hôte + voyageur + proprio + commercial. **Fonctionne sans JavaScript**
(vieux téléphones) : tout le contenu et tous les formulaires sont rendus en
SSR dans le HTML ; les `<form action>` POSTent en natif vers les Server
Actions qui relaient la gateway et re-rendent. Avec JS : amélioration
progressive (pending + résultat inline via `useActionState`).

## Lancer en local (lab)

```bash
cd web
npm ci
LCD_GATEWAY_URL=http://127.0.0.1:8443 npm run dev   # http://localhost:3000
```

## Auto-héberger en Docker (self-hosted, 0 €)

Voir `deploy/README.md` (entrée unique `https://lcd.test:4001` → ce front
+ gateway lab). Image minimale : `output: standalone` (`next.config.ts`) +
`web/Dockerfile` multi-stage (`npm ci` reproductible, lock versionné). Build
local prouvé `lcd-deploy-web` ~281 Mo, `test-deploy.ps1` 7/7 vert.

La gateway lab tourne via `lab/docker-compose.yml` (service `gateway-parc`,
`:8443`). Le navigateur ne touche jamais la gateway : tout passe par les
Server Actions / `gwGet` côté serveur (allowlist stricte `src/lib/gateway.ts`
+ préfixe `/parc/portail/<logement>` lecture seule, jamais de proxy libre,
jamais de secret exposé).

## Déployer sur Vercel

1. Pousser ce dossier (`web/`) sur GitHub (racine du repo Vercel = `web/`).
2. Sur Vercel : nouveau projet → `Framework: Next.js` → Root Directory `web/`.
3. Variable d'environnement **serveur** : `LCD_GATEWAY_URL=https://api.<domaine>`
   (le VPS Caddy du plan §16.3 — jamais `127.0.0.1`, jamais en `NEXT_PUBLIC_*`).
4. Déployer. Chaque page rend en SSR à la requête (`instant = false`) ; sans
   JS tout marche (formulaires natifs + navigation `?lang=`).

> Limite assumée : `LCD_GATEWAY_URL` doit être joignable depuis les serveurs
> Vercel (donc VPS public avec `api.<domaine>`, G3 réel). En attendant, le lab
> local prouve le fonctionnel de bout en bout.

## Pages

| Page | Rôle | Écritures |
|---|---|---|
| `/` | Hôte : bandeau + cartes + 14 actions 1-tap/logement (43 formulaires) | `POST /v1/action` |
| `/voyageur` | Séjour : extras + incident (hôte-relayé, tracé) | `commande_extras`, `sinistre_declarer` |
| `/proprio` | Relevé mandat (lecture seule, par construction) | aucune |
| `/commercial` | Pipeline + prospect + simulateur (scope strict) | `/v1/prospects`, `/v1/simulateur` |

5 langues : `?lang=` (`fr/en/es/it/de`, défaut `fr`) — onglets + libellés
des 14 actions traduits (`src/lib/i18n.ts`). Le `<select>` du header navigue
en `?lang=` sans JS.

## Architecture plugins (§20.7, cahier `docs/70-front-v1.md`)

8 dashboards = 1 dossier chacun dans `src/plugins/dash-*/` avec un manifeste
`dashboard.yaml` (id, version semver, actif, roles, routes, apis, flags,
i18n_prefixe, route_prefix, lite, offline) + un `i18n.json` 5 langues. Le
chargeur **strict** `scripts/valider-plugins.mjs` (0 dépendance, sous-ensemble
YAML plat écrit à la main) tourne à chaque `npm run build` et en CI :

- schéma **fermé** : toute clé inconnue = refus (fail-closed, jamais de
  demi-chargement) ;
- `roles` ⊆ `src/plugins/roles.json` (liste fermée §S3.1), `flags` ⊆
  `src/plugins/flags.json` (miroir synchronisé avec `custom/logements.yaml`,
  kill-switch `jev_enabled` autorisé) ;
- `apis` ⊆ `src/lib/allowlist.json` (la MÊME source que `src/lib/gateway.ts`,
  DRY) : un plugin ne peut que sous-utiliser la gateway, jamais l'élargir ;
- 1 route = 1 plugin (pas de double propriété), route active = page existante ;
- `npm run valider:plugins` seule, `npm run budget` pour le garde-fou JS/page.

`npm run build` = validateur plugins → `next build` → `scripts/budget-bundle.mjs`
(mesure gzip réelle page par page via serveur standalone, budget 200 Ko §S3.4.6,
surcharge `LCD_BUDGET_KO`). Sortie courante : ~177 Ko/page, marge faible —
les ajouts de composants clients doivent rester rares.

## Mode dégradé (L0-L3, REQ-S-008)

Le front doit vieillir avec ses téléphones, pas tomber en panne : `lite.css`
+ cookie `lcd_lite` posé par `GET /api/lite?on=1&retour=/…` (lien `<a>` natif,
sans JS, anti open-redirect) → classe `html.mode-lite` neutralise
backdrop-filter, dégradés et transitions (vieilles versions Safari/Chrome).
Aucune règle ne masque du contenu : alléger n'est pas réduire.
L'échelle complète L0 (SMS + papier) → L3 (PWA offline) : `docs/70-front-v1.md` §F7.

## Contraintes respectées

- Gateway **intacte** : le front lit le JSON existant, ne modifie aucune route
  (batterie lab §§47-68 inchangée, page `:8443` historique conservée).
- 0 secret : allowlist fermée, `qui` humain explicite, ref idempotent, RBAC
  revérifié par la gateway puis les moteurs (le front ne fait que relayer).
- Stdlib-plan côté gateway inchangé ; dépendances JS cantonnées à `web/`.
