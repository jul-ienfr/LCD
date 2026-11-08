<script lang="ts">
  import { texte } from "./utils";

  let { contenu }: { contenu: Record<string, unknown> } = $props();
  const titre = $derived(texte(contenu, "titre", "Réservez votre séjour"));
  const corps = $derived(texte(contenu, "texte"));
  const lien = $derived(texte(contenu, "lien", "#contact"));
  const libelle = $derived(texte(contenu, "libelle", "Réserver"));
</script>

<section class="px-6 py-16 text-center text-white" style="background:var(--site-accent)">
  <div class="mx-auto max-w-2xl space-y-3">
    <h2 class="text-3xl font-semibold tracking-tight">{titre}</h2>
    {#if corps}<p class="opacity-90">{corps}</p>{/if}
    <a class="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900" href={lien}>
      {libelle}
    </a>
  </div>
</section>
