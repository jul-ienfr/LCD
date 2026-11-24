<script lang="ts">
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import { traductionsIntervenants } from "@/lib/i18n-intervenants";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsIntervenants(data.langue));

  /** Note de composante : barre + valeur, ou « non mesurable ». */
  const teinte = (valeur: number | null) =>
    valeur === null ? "" : valeur >= 80 ? "text-accent" : valeur < 50 ? "text-alerte" : "";
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espace}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
    <p class="text-encre-douce">{t.description}</p>
    <p class="text-sm text-encre-faine">{t.resume(data.lignes.length)}</p>
  </header>

  <section class="ui-carte space-y-4">
    <form class="flex flex-wrap items-end gap-3" method="GET">
      <label class="space-y-2">
        <span class="ui-label">{t.du}</span>
        <input class="ui-champ" name="du" type="date" value={data.du} />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{t.au}</span>
        <input class="ui-champ" name="au" type="date" value={data.au} />
      </label>
      <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
        {t.filtrer}
      </button>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.raccourcis.moisCourant}>
        {t.moisCourant}
      </a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.raccourcis.moisPrecedent}>
        {t.moisPrecedent}
      </a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.raccourcis.douzeMois}>
        {t.douzeMois}
      </a>
      <a class="ui-lien-action ml-auto inline-flex min-h-11 items-center text-sm" href="/hote/missions">
        {t.espaceMissions}
      </a>
    </form>
    <p class="text-sm text-encre-douce">{data.periodeAffichee}</p>
    {#if data.periodeInvalide}
      <p class="ui-alerte ui-alerte--alerte" role="alert">{t.periodeInvalide}</p>
    {/if}
  </section>

  <section class="grid gap-4 sm:grid-cols-2">
    <Kpi
      libelle={t.kpiIntervenants}
      valeur={data.lignes.length}
      note={data.periodeAffichee}
    />
    <Kpi
      libelle={t.kpiScoreMoyen}
      valeur={data.scoreMoyenLibelle ?? t.nonMesurable}
      note={t.kpiNote}
    />
  </section>

  <section class="space-y-3">
    {#if data.lignes.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucune}
      </p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div
        class="overflow-x-auto rounded-2xl border border-bordure bg-surface"
        role="region"
        tabindex="0" aria-label={t.titre}
      >
        <table class="ui-tableau min-w-[880px]">
          <thead>
            <tr>
              <th>{t.colIntervenant}</th>
              <th class="text-right">{t.colScore}</th>
              <th>{t.colQualite}</th>
              <th>{t.colPonctualite}</th>
              <th>{t.colRegularite}</th>
              <th>{t.colPreuves}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.lignes as ligne (ligne.id)}
              <tr>
                <td>
                  <p class="font-medium">{ligne.nom}</p>
                  {#if ligne.email}
                    <p class="text-xs text-encre-faine">{ligne.email}</p>
                  {/if}
                  <p class="text-xs text-encre-faine">{ligne.interventionsDetail}</p>
                </td>
                <td class="text-right">
                  <span class="text-lg font-semibold {teinte(ligne.score)}">
                    {ligne.scoreLibelle ?? t.nonMesurable}
                  </span>
                </td>
                <td>
                  <p class="font-medium {teinte(ligne.qualite)}">
                    {ligne.qualiteLibelle ?? t.nonMesurable}
                  </p>
                  <p class="text-xs text-encre-faine">{ligne.qualiteDetail}</p>
                </td>
                <td>
                  <p class="font-medium {teinte(ligne.ponctualite)}">
                    {ligne.ponctualiteLibelle ?? t.nonMesurable}
                  </p>
                  <p class="text-xs text-encre-faine">{ligne.ponctualiteDetail}</p>
                </td>
                <td>
                  <p class="font-medium {teinte(ligne.regularite)}">
                    {ligne.regulariteLibelle ?? t.nonMesurable}
                  </p>
                  <p class="text-xs text-encre-faine">{ligne.regulariteDetail}</p>
                </td>
                <td class="text-xs text-encre-douce">{ligne.preuvesDetail}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <section class="ui-carte space-y-2">
    <h2 class="text-lg font-semibold">{t.aideTitre}</h2>
    <p class="text-sm text-encre-douce">{t.aide}</p>
    <p class="text-sm text-encre-faine">
      {t.tolerances(data.tolerances.ponctualite, data.tolerances.ecart)}
    </p>
  </section>
</main>
