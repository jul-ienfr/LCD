<script lang="ts">
  import { objet, tableau, texte, texteDe } from "./utils";

  let { contenu }: { contenu: Record<string, unknown> } = $props();
  const titre = $derived(texte(contenu, "titre", "Équipements"));
  const items = $derived(
    tableau(contenu, "items")
      .map((item) => (typeof item === "string" ? item : texteDe(objet(item), "label")))
      .filter((item): item is string => item.length > 0),
  );
</script>

{#if items.length > 0}
  <section class="mx-auto max-w-3xl px-6 py-12">
    <h2 class="text-2xl font-semibold tracking-tight">{titre}</h2>
    <ul class="mt-4 grid gap-2 sm:grid-cols-2">
      {#each items as item (item)}
        <li class="rounded-xl border border-black/10 px-3 py-2 text-sm">{item}</li>
      {/each}
    </ul>
  </section>
{/if}
