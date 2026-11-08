<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    nom,
    logoUrl,
    retourHref = "/",
    retourLibelle = "Accueil",
    actions,
  }: {
    nom: string;
    logoUrl?: string | null;
    retourHref?: string;
    retourLibelle?: string;
    actions?: Snippet;
  } = $props();
</script>

<header class="sticky top-0 z-30 border-b border-bordure ui-verre">
  <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-3">
    <a class="flex items-center gap-2.5 font-semibold tracking-tight" href="/">
      {#if logoUrl}
        <img class="h-8 w-auto" src={logoUrl} alt="" />
      {:else}
        <span class="grid size-8 place-items-center rounded-lg bg-accent text-sm font-black text-sur-accent">
          {nom.slice(0, 1)}
        </span>
      {/if}
      <span class="text-sm">{nom}</span>
    </a>
    <nav class="flex flex-wrap items-center gap-1" aria-label="Navigation">
      <a class="ui-nav-lien" href={retourHref}>← {retourLibelle}</a>
      <a class="ui-nav-lien" href="/aide">Aide</a>
      <a class="ui-nav-lien" href="/legales">Mentions</a>
      {#if actions}
        {@render actions()}
      {/if}
    </nav>
  </div>
</header>
