# Contrat — dictionnaires staff

Chaque module `v2/src/lib/i18n-<page>.ts` expose :

```ts
export interface Traductions<Page> {
  // toutes les clés visibles, typées string
  // fonctions uniquement pour l’interpolation
}

export function traductions<Page>(langue: string): Traductions<Page>;
```

## Garanties

- Cinq langues présentes : `fr`, `en`, `es`, `it`, `de`.
- Repli français pour toute valeur absente ou inconnue.
- Aucune valeur vide.
- Aucune dépendance SvelteKit, Drizzle ou réseau.
- Les fonctions d’interpolation échappent uniquement des données déjà
  contrôlées (code logement, compteur, jours).

## Consommation

```ts
const t = traductions<Page>(event.cookies.get("lcd_langue") ?? "fr");
return { t, ...donnees };
```

Le Svelte affiche `data.t.<cle>` et ne contient plus de libellé d’interface en
dur.
