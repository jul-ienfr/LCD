<script lang="ts">
  /**
   * Sommaire ancré du séjour (T049).
   *
   * `nav` nommé contenant une liste de liens vers les sections de la page :
   * utilisable au doigt comme au clavier, sans JavaScript (les ancres natives
   * restent valides avec `csr = false`).
   */
  let {
    libelle,
    sections,
  }: {
    /** Nom accessible du repère `nav` (ex. « Sommaire du séjour »). */
    libelle: string;
    /** Sections du séjour, dans l'ordre d'affichage de la page. */
    sections: { id: string; libelle: string }[];
  } = $props();
</script>

{#if sections.length > 0}
  <nav class="ui-carte ui-noprint" aria-label={libelle} data-sommaire-sejour>
    <h2 class="text-sm font-semibold text-encre-douce">{libelle}</h2>
    <ul class="mt-3 grid gap-2 sm:grid-cols-2">
      {#each sections as section (section.id)}
        <li class="min-w-0">
          <a class="ui-bouton ui-bouton--fantome ui-bouton--petit w-full justify-start" href={`#${section.id}`}>
            {section.libelle}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
{/if}
