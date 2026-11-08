<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import Carte from "@/lib/components/ui/carte.svelte";
  import EtatVide from "@/lib/components/ui/etat-vide.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.pTitrePage}</title>
</svelte:head>

<main class="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-12">
  <PageEntete
    surtitre={data.t.pSurtitre}
    titre={data.t.pTitre}
    description={data.t.pDescription}
  />

  <Carte titre={data.t.pConservees(data.fiches.length)}>
    {#if data.fiches.length === 0}
      <EtatVide message={data.t.pAucune} />
    {:else}
      <div class="mt-4 overflow-x-auto">
        <table class="ui-tableau min-w-[720px]">
          <thead>
            <tr>
              <th>{data.t.colSejour}</th>
              <th>{data.t.colLogement}</th>
              <th>{data.t.colPersonne}</th>
              <th>{data.t.colNaissance}</th>
              <th>{data.t.colContact}</th>
              <th>{data.t.colRecue}</th>
              <th>{data.t.colPurge}</th>
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
      {data.t.pNote}
    </p>
  </Carte>
</main>
