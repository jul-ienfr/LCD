<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.fTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={data.t.fSurtitre}
    titre={data.t.fTitre}
    description={data.t.fDescription}
  />

  <section class="ui-carte">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">{data.t.fProgression}</h2>
      <p class="text-sm font-medium" aria-live="polite">
        {data.t.fResume(data.globale.faites, data.globale.total, data.globale.pourcentage)}
      </p>
    </div>
    <div aria-hidden="true" class="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div class="h-full rounded-full bg-accent" style={`width: ${data.globale.pourcentage}%`}></div>
    </div>
    {#if data.globale.total > 0 && data.globale.faites === data.globale.total}
      <p class="mt-3 text-sm font-medium text-accent">{data.t.fComplet}</p>
    {:else}
      <p class="mt-3 text-sm text-encre-douce">
        {data.t.fAide}
      </p>
    {/if}
  </section>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">
      {data.t.fOk(data.module, data.pourcentage)}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "inattendu" ? data.t.erreurInattendue : data.erreur}
    </p>
  {/if}

  <div class="grid gap-6">
    {#each data.modules as module (module.code)}
      <section class="ui-carte">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">{module.titre}</h2>
            <p class="mt-1 max-w-2xl text-sm text-encre-douce">{module.description}</p>
          </div>
          <span class={module.avancement.termine ? "ui-badge ui-badge--accent" : "ui-badge"}>
            {module.avancement.termine ? data.t.termine : `${module.avancement.faites} / ${module.avancement.total}`}
          </span>
        </div>

        <div aria-hidden="true" class="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div class="h-full rounded-full bg-accent" style={`width: ${module.avancement.pourcentage}%`}></div>
        </div>

        <form class="mt-4" method="POST" action="?/enregistrer">
          <input name="moduleCode" type="hidden" value={module.code} />
          <ul class="grid gap-2 sm:grid-cols-2">
            {#each module.etapes as etape (etape.code)}
              <li>
                <label class="flex cursor-pointer gap-3 rounded-xl border border-bordure p-3 text-sm">
                  <input defaultChecked={etape.fait} class="mt-1" name={`etape-${etape.code}`} type="checkbox" />
                  <span>
                    <span class="font-medium">{etape.titre}</span>
                    <span class="mt-0.5 block text-encre-douce">{etape.detail}</span>
                  </span>
                </label>
              </li>
            {/each}
          </ul>
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p class="text-xs text-encre-faine">{data.t.pourcentageModule(module.avancement.pourcentage)}</p>
            <button class="ui-bouton ui-bouton--secondaire" type="submit">{data.t.enregistrerProgression}</button>
          </div>
        </form>
      </section>
    {/each}
  </div>
</main>
