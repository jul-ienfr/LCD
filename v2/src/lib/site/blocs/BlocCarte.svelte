<script lang="ts">
  import { texte } from "./utils";

  let { contenu }: { contenu: Record<string, unknown> } = $props();
  const titre = $derived(texte(contenu, "titre", "Nous trouver"));
  const adresse = $derived(texte(contenu, "adresse"));
  const lien = $derived(texte(contenu, "lien"));
  const latitude = $derived(texte(contenu, "latitude"));
  const longitude = $derived(texte(contenu, "longitude"));
  const lienCarte = $derived(
    lien ||
      (latitude && longitude
        ? `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(longitude)}#map=15/${encodeURIComponent(latitude)}/${encodeURIComponent(longitude)}`
        : ""),
  );
</script>

{#if adresse || lienCarte}
  <section class="mx-auto max-w-3xl px-6 py-12">
    <h2 class="text-2xl font-semibold tracking-tight">{titre}</h2>
    {#if adresse}<p class="mt-2 text-sm opacity-80">{adresse}</p>{/if}
    {#if lienCarte}
      <a class="mt-4 inline-flex text-sm font-semibold underline" href={lienCarte} rel="noreferrer noopener" target="_blank">
        Ouvrir la carte
      </a>
    {/if}
  </section>
{/if}
