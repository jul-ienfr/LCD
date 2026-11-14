<script lang="ts">
  import { traductionsCompta } from "@/lib/i18n-compta";
  import Kpi from "@/lib/components/ui/kpi.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsCompta((data as { langue?: string }).langue ?? "fr"));
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
    <a class="ui-lien-action ml-auto text-sm" href="/hote/factures">{t.factures}</a>
    <a class="ui-lien-action text-sm" href="/hote/compta/rapprochement">{t.rapprochement}</a>
    <a class="ui-lien-action text-sm" href="/hote/compta/parametres">{t.parametresFiscaux}</a>
    <a class="ui-lien-action text-sm" href="/hote/compta/simulateur">{t.simulateur}</a>
    <a class="ui-lien-action text-sm" href="/hote/sorties">{t.sorties}</a>
    <a class="ui-lien-action text-sm" href="/hote/planning">{t.planning}</a>
  </div>

  <div class="flex flex-wrap items-center gap-2 rounded-2xl border border-bordure bg-surface p-3 text-sm">
    <span class="font-medium">{t.exports(data.moisLibelle)}</span>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/reservations?mois=${data.mois}`}>{t.resasCsv}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/factures?mois=${data.mois}`}>{t.facturesCsv}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/paiements?mois=${data.mois}`}>{t.paiementsCsv}</a>
    <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/api/exports/factur-x?mois=${data.mois}`}>{t.facturX}</a>
    <a class="ui-lien-action" href="/api/exports/modele-rapprochement">{t.modele}</a>
    {#if data.role === "admin"}
      <a class="ui-lien-action" href="/api/exports/audit">{t.auditCsv}</a>
    {/if}
  </div>

  <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    {#each data.kpis as kpi (kpi.libelle)}
      <Kpi libelle={kpi.libelle} valeur={kpi.valeur} note={kpi.note} />
    {/each}
  </section>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <section tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
    <table class="ui-tableau min-w-[640px]">
      <thead>
        <tr>
          <th>{t.colLogement}</th>
          <th class="text-right">{t.colSejours}</th>
          <th class="text-right">{t.colCa}</th>
          <th class="text-right">{t.colFactures}</th>
          <th class="text-right">{t.colTtc}</th>
        </tr>
      </thead>
      <tbody>
        {#each data.parLogement as ligne (ligne.id)}
          <tr>
            <td>
              {ligne.nom}
              <span class="ml-2 text-xs text-encre-faine">{ligne.code}</span>
            </td>
            <td class="text-right">{ligne.sejours}</td>
            <td class="text-right">{ligne.ca}</td>
            <td class="text-right">{ligne.factures}</td>
            <td class="text-right">{ligne.ttc}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.paiementsMois}</h2>
    {#if data.paiements.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucunPaiement}
      </p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table class="ui-tableau min-w-[640px]">
          <thead>
            <tr>
              <th>{t.colDate}</th>
              <th>{t.colFacture}</th>
              <th>{t.colMode}</th>
              <th>{t.colReference}</th>
              <th class="text-right">{t.colMontant}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.paiements as paiement (paiement.id)}
              <tr>
                <td>{paiement.date}</td>
                <td>
                  {#if paiement.factureId}
                    <a class="ui-lien-action" href={`/hote/factures/${paiement.factureId}`}>{paiement.numero}</a>
                  {:else}
                    {paiement.numero}
                  {/if}
                </td>
                <td>{paiement.mode}</td>
                <td>{paiement.reference}</td>
                <td class="text-right">{paiement.montant}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</main>
