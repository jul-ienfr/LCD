<script lang="ts">
  import { texte } from "./utils";

  let { contenu }: { contenu: Record<string, unknown> } = $props();
  const titre = $derived(texte(contenu, "titre", "Bienvenue"));
  const sousTitre = $derived(texte(contenu, "sousTitre"));
  const image = $derived(texte(contenu, "image"));
  const lien = $derived(texte(contenu, "lien", "#contact"));
  const libelleLien = $derived(texte(contenu, "libelleLien", "Nous contacter"));
</script>

<section
  class="relative isolate overflow-hidden px-6 py-24 text-white"
  style={image
    ? `background-image:linear-gradient(rgba(0,0,0,.45),rgba(0,0,0,.45)),url('${image}');background-size:cover;background-position:center`
    : "background:var(--site-accent)"}
>
  <div class="mx-auto max-w-4xl space-y-5 text-center">
    <h1 class="text-4xl font-semibold tracking-tight md:text-5xl">{titre}</h1>
    {#if sousTitre}<p class="text-lg text-white/90">{sousTitre}</p>{/if}
    <a
      class="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-neutral-900"
      href={lien}
    >
      {libelleLien}
    </a>
  </div>
</section>
