<script lang="ts">
  /**
   * Fil d'Ariane accessible (T018).
   *
   * Props :
   * - `elements` : `{ libelle: string; href?: string }[]` — du domaine (premier)
   *   à la page courante (dernier). Le dernier élément est la page courante :
   *   il n'est jamais un lien et porte `aria-current="page"`.
   * - `libelle` : nom accessible du repère `<nav>` (défaut « Fil d'Ariane »).
   *
   * Sans JavaScript : le fil est un `<nav>` + `<ol>` de liens statiques.
   * Masqué à l'impression (`print:hidden`).
   */
  let {
    elements,
    libelle = "Fil d'Ariane",
  }: {
    elements: { libelle: string; href?: string }[];
    libelle?: string;
  } = $props();
</script>

<nav aria-label={libelle} class="print:hidden">
  <ol class="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-encre-douce">
    {#each elements as element, index (index)}
      <li class="flex items-center gap-x-2">
        {#if index > 0}
          <span aria-hidden="true" class="text-encre-faine">&rsaquo;</span>
        {/if}
        {#if index === elements.length - 1}
          <span aria-current="page" class="font-semibold text-encre">{element.libelle}</span>
        {:else if element.href}
          <a class="rounded-sm underline decoration-bordure underline-offset-2 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" href={element.href}>
            {element.libelle}
          </a>
        {:else}
          <span>{element.libelle}</span>
        {/if}
      </li>
    {/each}
  </ol>
</nav>
