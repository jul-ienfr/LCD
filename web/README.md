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
npm install
LCD_GATEWAY_URL=http://127.0.0.1:8443 npm run dev   # http://localhost:3000
```

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

## Contraintes respectées

- Gateway **intacte** : le front lit le JSON existant, ne modifie aucune route
  (batterie lab §§47-68 inchangée, page `:8443` historique conservée).
- 0 secret : allowlist fermée, `qui` humain explicite, ref idempotent, RBAC
  revérifié par la gateway puis les moteurs (le front ne fait que relayer).
- Stdlib-plan côté gateway inchangé ; dépendances JS cantonnées à `web/`.
