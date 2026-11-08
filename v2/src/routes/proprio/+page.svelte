<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>Relevé de mandat — {data.moisLabel}</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace propriétaire</p>
      <h1 class="text-3xl font-semibold tracking-tight">Relevé de mandat — {data.moisLabel}</h1>
      <p class="text-encre-douce">
        {#if data.vide}0 logement{:else}{data.logements.length} logement{data.logements.length > 1 ? "s" : ""}{/if} · {data.nom}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-lien text-sm" href="/hote/securite">Sécurité / 2FA</a>
      <form method="POST" action="/logout"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter</button></form>
    </div>
  </header>

  {#if data.vide}
    <p class="ui-alerte ui-alerte--alerte">Aucun logement n’est encore rattaché à votre compte. Contactez votre gestionnaire.</p>
  {:else}
    <div class="flex flex-wrap items-center gap-3 text-sm">
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/proprio?mois=${data.moisPrecedent}`}>← Mois précédent</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/proprio?mois=${data.moisCourant}`}>Mois courant</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/proprio?mois=${data.moisSuivant}`}>Mois suivant →</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/proprio?mois=${data.mois}`}>Export CSV</a>
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/proprio/releve?mois=${data.mois}`}>Relevé PDF</a>
    </div>

    <section class={data.estProprietaire ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 sm:grid-cols-3"}>
      <div class="ui-carte"><p class="text-sm text-encre-faine">CA réservations</p><p class="mt-1 text-2xl font-semibold">{data.ca}</p><p class="text-xs text-encre-faine">{data.sejours} séjour{data.sejours > 1 ? "s" : ""}</p></div>
      {#if data.estProprietaire}
        <div class="ui-carte"><p class="text-sm text-encre-faine">Commission de mandat</p><p class="mt-1 text-2xl font-semibold">{data.commissionTotale}</p><p class="text-xs text-encre-faine">taux du mandat par logement</p></div>
        <div class="ui-carte"><p class="text-sm text-encre-faine">Charges mensuelles</p><p class="mt-1 text-2xl font-semibold">{data.chargesTotales}</p><p class="text-xs text-encre-faine">forfait par logement</p></div>
        <div class="ui-carte"><p class="text-sm text-encre-faine">Net propriétaire</p><p class="mt-1 text-2xl font-semibold">{data.netTotal}</p><p class="text-xs text-encre-faine">CA − commission − charges</p></div>
      {:else}
        <div class="ui-carte"><p class="text-sm text-encre-faine">HT facturé</p><p class="mt-1 text-2xl font-semibold">{data.ht}</p><p class="text-xs text-encre-faine">{data.factures} facture{data.factures > 1 ? "s" : ""}</p></div>
      {/if}
      <div class="ui-carte"><p class="text-sm text-encre-faine">TTC facturé</p><p class="mt-1 text-2xl font-semibold">{data.ttc}</p><p class="text-xs text-encre-faine">taxe de séjour incluse</p></div>
    </section>

    <section class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr class="border-b border-bordure bg-fond text-left">
            <th class="p-3">Logement</th>
            <th class="p-3 text-right">Séjours</th>
            <th class="p-3 text-right">CA</th>
            {#if data.estProprietaire}<th class="p-3 text-right">Taux</th><th class="p-3 text-right">Commission</th><th class="p-3 text-right">Charges</th><th class="p-3 text-right">Net</th>{:else}<th class="p-3 text-right">HT</th><th class="p-3 text-right">TTC</th>{/if}
          </tr>
        </thead>
        <tbody>
          {#each data.logements as logement (logement.id)}
            <tr class="border-b border-bordure last:border-0">
              <td class="p-3 font-medium">{logement.nom}</td>
              <td class="p-3 text-right">{logement.sejours}</td>
              <td class="p-3 text-right">{logement.ca}</td>
              {#if data.estProprietaire}
                <td class="p-3 text-right">{logement.taux ?? "—"}</td>
                <td class="p-3 text-right">{logement.commission}</td>
                <td class="p-3 text-right">{logement.charges}</td>
                <td class="p-3 text-right font-semibold">{logement.net}</td>
              {:else}
                <td class="p-3 text-right">{logement.ht}</td>
                <td class="p-3 text-right">{logement.ttc}</td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">Séjours du mois</h2>
      {#if data.sejoursDetail.length === 0}
        <p class="ui-alerte">Aucun séjour sur ce mois.</p>
      {:else}
        <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface text-sm">
          {#each data.sejoursDetail as sejour (sejour.id)}
            <li class="flex flex-wrap items-center justify-between gap-2 p-3">
              <span class="font-medium">{sejour.ref}</span>
              <span>{sejour.logement}</span>
              <span class="text-encre-douce">{sejour.clientNom}</span>
              <span class="text-encre-douce">{sejour.debut} → {sejour.fin}</span>
              <span class="font-semibold">{sejour.montant}</span>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</main>
