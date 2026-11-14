<script lang="ts">
  import { traductionsDetails } from "@/lib/i18n-details";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsDetails((data as { langue?: string }).langue ?? "fr"));

  const urlComplete = $derived(
    typeof window === "undefined" ? data.url : new URL(data.url, window.location.origin).toString(),
  );
</script>

<svelte:head>
  <title>{t.cTitrePage(data.logement.nom)}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.cSurtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.cTitre}</h1>
    <p class="text-encre-douce">{t.cDescription(data.logement.nom, data.logement.code)}</p>
  </header>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">{t.cLienTitre}</h2>
    <p class="text-sm text-encre-douce">{t.cLienDescription}</p>
    <a class="ui-lien-action break-all text-sm" href={data.url}>{urlComplete}</a>
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien-action" href="/hote/logements">{t.cTousLogements}</a>
    <a class="ui-lien-action" href={`/hote/planning?logement=${data.logement.id}`}>
      {t.cPlanning}
    </a>
  </nav>
</main>
