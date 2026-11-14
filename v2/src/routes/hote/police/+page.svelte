<script lang="ts">
  import { traductionsConformite } from "@/lib/i18n-conformite";
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Carte from "@/lib/components/ui/carte.svelte";
  import EtatVide from "@/lib/components/ui/etat-vide.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsConformite((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.pTitrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
  <PageEntete
    surtitre={t.pSurtitre}
    titre={t.pTitre}
    description={t.pDescription}
  />

  <Carte titre={t.pConservees(data.fiches.length)}>
    {#if data.fiches.length === 0}
      <EtatVide message={t.pAucune} />
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div role="region" tabindex="0" aria-label="Tableau défilant" class="mt-4 overflow-x-auto">
        <table class="ui-tableau min-w-[720px]">
          <thead>
            <tr>
              <th>{t.colSejour}</th>
              <th>{t.colLogement}</th>
              <th>{t.colPersonne}</th>
              <th>{t.colNaissance}</th>
              <th>{t.colContact}</th>
              <th>{t.colRecue}</th>
              <th>{t.colPurge}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.fiches as fiche (fiche.id)}
              <tr>
                <td class="font-mono text-xs">{fiche.sejour}</td>
                <td>{fiche.logement}</td>
                <td>
                  <span class="font-medium">{fiche.personne}</span><br />
                  <span class="text-xs text-encre-faine">{fiche.nationalite}</span>
                </td>
                <td class="tabular-nums">
                  {fiche.naissance}<br />
                  <span class="text-xs text-encre-faine">{fiche.lieuNaissance}</span>
                </td>
                <td>
                  {fiche.telephone}<br />
                  <span class="text-xs text-encre-faine">{fiche.domicile}</span>
                </td>
                <td class="tabular-nums text-xs">{fiche.recue}</td>
                <td class="tabular-nums text-xs">{fiche.purge}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
    <p class="mt-4 text-xs text-encre-faine">
      {t.pNote}
    </p>
  </Carte>
</main>
