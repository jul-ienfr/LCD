<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    surtitre,
    titre,
    description,
    actions,
  }: {
    surtitre?: string;
    titre: string;
    description?: string;
    actions?: Snippet;
  } = $props();
</script>

<header class="ui-entete flex flex-wrap items-end justify-between gap-5">
  <div class="space-y-2.5">
    {#if surtitre}
      <p class="ui-surtitre">{surtitre}</p>
    {/if}
    <h1 class="text-3xl font-semibold leading-[1.05] tracking-tight md:text-4xl">{titre}</h1>
    {#if description}
      <p class="max-w-2xl leading-relaxed text-encre-douce">{description}</p>
    {/if}
  </div>
  {#if actions}
    <div class="flex flex-wrap items-center gap-3">{@render actions()}</div>
  {/if}
</header>
