<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    titre,
    description,
    children,
  }: {
    titre?: string;
    description?: string;
    children: Snippet;
  } = $props();
</script>

<section class="ui-carte space-y-4">
  {#if titre || description}
    <div>
      {#if titre}
        <h2 class="text-lg font-semibold">{titre}</h2>
      {/if}
      {#if description}
        <p class="mt-1 text-sm text-encre-douce">{description}</p>
      {/if}
    </div>
  {/if}
  {@render children()}
</section>
