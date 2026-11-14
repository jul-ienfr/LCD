<script lang="ts">
  import { traductionsRapports } from "@/lib/i18n-rapports";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsRapports((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espace}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre(data.moisLibelle)}</h1>
    <p class="text-encre-douce">{t.description}</p>
  </header>

  <div class="flex flex-wrap items-center gap-3">
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.precedent}>{t.precedent}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.courant}>{t.courant}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.suivant}>{t.suivant}</a>
    <a class="ui-lien-action ml-auto inline-flex min-h-11 items-center text-sm" href="/hote/compta">{t.exportsTitre}</a>
  </div>

  <!-- KPIs -->
  <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#each data.kpis as kpi (kpi.libelle)}
      <Kpi libelle={kpi.libelle} valeur={kpi.valeur} note={kpi.note} />
    {/each}
  </section>

  <!-- Alertes -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.alertesTitre}</h2>
    {#if data.alertes.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucuneAlerte}
      </p>
    {:else}
      <ul class="space-y-2">
        {#each data.alertes as alerte (alerte.id)}
          <li class="rounded-xl border p-3 text-sm {alerte.severite === 'danger' ? 'border-danger bg-danger/10' : 'border-alerte bg-alerte/10'}">
            {alerte.message}
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <!-- Mix canal -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.mixCanalTitre}</h2>
    {#if data.mixCanal.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucunCanal}
      </p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div 
        class="overflow-x-auto rounded-2xl border border-bordure bg-surface"
        role="region"
        tabindex="0"
        aria-label={t.mixCanalTitre}
      >
        <table class="ui-tableau min-w-[480px]">
          <thead>
            <tr>
              <th>{t.colCanal}</th>
              <th class="text-right">{t.colReservations}</th>
              <th class="text-right">{t.colCaCanal}</th>
              <th class="text-right">{t.colPart}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.mixCanal as canal (canal.canal)}
              <tr>
                <td>{canal.canal}</td>
                <td class="text-right">{canal.reservations}</td>
                <td class="text-right">{canal.ca}</td>
                <td class="text-right">{canal.part}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <!-- Détail par logement -->
  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.parLogementTitre}</h2>
    {#if data.parLogement.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucunLogement}
      </p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div 
        class="overflow-x-auto rounded-2xl border border-bordure bg-surface"
        role="region"
        tabindex="0"
        aria-label={t.parLogementTitre}
      >
        <table class="ui-tableau min-w-[640px]">
          <thead>
            <tr>
              <th>{t.colLogement}</th>
              <th class="text-right">{t.colSejours}</th>
              <th class="text-right">{t.colCa}</th>
              <th class="text-right">{t.colCommission}</th>
              <th class="text-right">{t.colCharges}</th>
              <th class="text-right">{t.colNet}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.parLogement as ligne (ligne.id)}
              <tr>
                <td>{ligne.nom}</td>
                <td class="text-right">{ligne.sejours}</td>
                <td class="text-right">{ligne.ca}</td>
                <td class="text-right">{ligne.commission}</td>
                <td class="text-right">{ligne.charges}</td>
                <td class="text-right {ligne.netNegatif ? 'text-danger font-medium' : ''}">{ligne.net}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <!-- Exports -->
  <section class="flex flex-wrap items-center gap-2 rounded-2xl border border-bordure bg-surface p-3 text-sm">
    <span class="font-medium">{t.exportsTitre}</span>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/reservations?mois=${data.mois}`}>{t.resasCsv}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/factures?mois=${data.mois}`}>{t.facturesCsv}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/paiements?mois=${data.mois}`}>{t.paiementsCsv}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/comptable?mois=${data.mois}`}>{t.comptableCsv}</a>
  </section>
</main>
