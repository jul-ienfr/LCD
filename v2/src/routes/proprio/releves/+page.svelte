<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Relevés archivés — Espace propriétaire</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace propriétaire</p>
      <h1 class="text-3xl font-semibold tracking-tight">Relevés archivés</h1>
      <p class="text-encre-douce">{data.nom}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-lien-action text-sm" href="/proprio">← Relevé du mois</a>
      <form method="POST" action="/logout"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter</button></form>
    </div>
  </header>

  {#if data.releves.length === 0}
    <p class="ui-alerte">Aucun relevé archivé pour le moment. Les relevés générés chaque mois apparaîtront ici.</p>
  {:else}
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <section tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr class="border-b border-bordure bg-fond text-left">
            <th class="p-3">Période</th>
            {#if !data.estProprietaire}<th class="p-3">Propriétaire</th>{/if}
            <th class="p-3 text-right">CA</th>
            <th class="p-3 text-right">Commission</th>
            <th class="p-3 text-right">Charges</th>
            <th class="p-3 text-right">Net</th>
            <th class="p-3">Généré le</th>
            <th class="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {#each data.releves as releve (releve.id)}
            <tr class="border-b border-bordure last:border-0">
              <td class="p-3">
                <span class="font-medium">{releve.periodeLabel}</span>
                <span class="ml-2 text-xs text-encre-faine">{releve.periode}</span>
              </td>
              {#if !data.estProprietaire}<td class="p-3">{releve.proprietaireNom}</td>{/if}
              <td class="p-3 text-right">{releve.ca}</td>
              <td class="p-3 text-right">{releve.commission}</td>
              <td class="p-3 text-right">{releve.charges}</td>
              <td class="p-3 text-right font-semibold {releve.netNegatif ? 'text-danger' : ''}">{releve.net}</td>
              <td class="p-3 text-encre-douce">{releve.genereLe}</td>
              <td class="p-3 text-right">
                <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/proprio/releves/${releve.id}`}>PDF</a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
</main>
