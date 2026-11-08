<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const urlComplete = $derived(
    typeof window === "undefined" ? data.url : new URL(data.url, window.location.origin).toString(),
  );
</script>

<svelte:head>
  <title>{data.t.cTitrePage(data.logement.nom)}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {data.t.cSurtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{data.t.cTitre}</h1>
    <p class="text-encre-douce">{data.t.cDescription(data.logement.nom, data.logement.code)}</p>
  </header>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">{data.t.cLienTitre}</h2>
    <p class="text-sm text-encre-douce">{data.t.cLienDescription}</p>
    <a class="ui-lien break-all text-sm" href={data.url}>{urlComplete}</a>
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/hote/logements">{data.t.cTousLogements}</a>
    <a class="ui-lien" href={`/hote/planning?logement=${data.logement.id}`}>
      {data.t.cPlanning}
    </a>
  </nav>
</main>
