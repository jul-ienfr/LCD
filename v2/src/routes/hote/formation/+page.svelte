<script lang="ts">
  import { traductionsConformite } from "@/lib/i18n-conformite";
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const erreur = $derived((form as { erreur?: string } | null)?.erreur ?? data.erreur);
  const t = $derived(traductionsConformite((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.fTitrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.fSurtitre}
    titre={t.fTitre}
    description={t.fDescription}
  />

  <section class="ui-carte">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">{t.fProgression}</h2>
      <p class="text-sm font-medium" aria-live="polite">
        {t.fResume(data.globale.faites, data.globale.total, data.globale.pourcentage)}
      </p>
    </div>
    <div aria-hidden="true" class="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
      <div class="h-full rounded-full bg-accent" style={`width: ${data.globale.pourcentage}%`}></div>
    </div>
    {#if data.globale.total > 0 && data.globale.faites === data.globale.total}
      <p class="mt-3 text-sm font-medium text-accent">{t.fComplet}</p>
    {:else}
      <p class="mt-3 text-sm text-encre-douce">
        {t.fAide}
      </p>
    {/if}
  </section>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">
      {t.fOk(data.module, data.pourcentage)}
    </p>
  {/if}
  {#if erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {erreur === "inattendu" ? t.erreurInattendue : erreur}
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
            {module.avancement.termine ? t.termine : `${module.avancement.faites} / ${module.avancement.total}`}
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
                <label class="flex min-h-11 min-w-11 cursor-pointer gap-3 rounded-xl border border-bordure p-3 text-sm">
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
            <p class="text-xs text-encre-faine">{t.pourcentageModule(module.avancement.pourcentage)}</p>
            <button class="ui-bouton ui-bouton--secondaire" type="submit">{t.enregistrerProgression}</button>
          </div>
        </form>
      </section>
    {/each}
  </div>
</main>
