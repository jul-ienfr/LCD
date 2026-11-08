<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.rTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={data.t.rSurtitre}
    titre={data.t.rTitre}
    description={data.t.rDescription}
  />

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">{data.t.rOk}</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "inattendu" ? data.t.erreurInattendue : data.erreur}
    </p>
  {/if}

  <section class="ui-carte">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">{data.t.rAvancement}</h2>
        <p class="mt-1 text-sm text-encre-douce">
          {data.t.rResume(data.resume.documentes, data.resume.actifs, data.resume.pourcentage)}
        </p>
      </div>
      <span class={data.resume.complet ? "ui-badge ui-badge--accent" : "ui-badge ui-badge--alerte"}>
        {data.resume.complet ? data.t.rComplet : data.t.rACompleter}
      </span>
    </div>
    {#if data.resume.manquants.length > 0}
      <p class="mt-3 text-sm text-alerte">
        {data.t.rManquants(data.resume.manquants.join(", "))}
      </p>
    {/if}
    {#if !data.registre.dpoContact}
      <p class="mt-2 text-sm text-encre-douce">
        {data.t.rDpoAide}
      </p>
    {/if}
  </section>

  <form class="space-y-6 rounded-2xl border border-bordure bg-surface p-6 shadow-sm" method="POST" action="?/enregistrer">
    <div class="grid gap-3 sm:grid-cols-3">
      <label class="space-y-2">
        <span class="ui-label">{data.t.dpoNom}</span>
        <input class="ui-champ" name="dpoNom" placeholder="Camille Martin" defaultValue={data.registre.dpoNom} />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.dpoContact}</span>
        <input class="ui-champ" name="dpoContact" placeholder="dpo@exemple.fr" defaultValue={data.registre.dpoContact} />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{data.t.hebergement}</span>
        <input class="ui-champ" name="hebergement" defaultValue={data.registre.hebergement} />
      </label>
    </div>

    <div class="overflow-x-auto">
      <table class="ui-tableau min-w-[880px]">
        <thead>
          <tr>
            <th>{data.t.colTraitement}</th>
            <th>{data.t.colBaseLegale}</th>
            <th>{data.t.colDonnees}</th>
            <th>{data.t.colDestinataires}</th>
            <th>{data.t.colActif}</th>
            <th>{data.t.colConservation}</th>
          </tr>
        </thead>
        <tbody>
          {#each data.traitements as traitement (traitement.code)}
            <tr>
              <td>
                <p class="font-medium">{traitement.finalite}</p>
                <input
                  class="ui-champ mt-2 text-xs"
                  name={`notes-${traitement.code}`}
                  placeholder={data.t.notesPlaceholder}
                  defaultValue={traitement.entree.notes}
                />
              </td>
              <td class="text-encre-douce">{traitement.baseLegale}</td>
              <td class="text-encre-douce">{traitement.donnees}</td>
              <td class="text-encre-douce">{traitement.destinataires}</td>
              <td>
                <label class="flex items-center gap-2">
                  <input defaultChecked={traitement.entree.actif} name={`actif-${traitement.code}`} type="checkbox" />
                  <span class="sr-only">{data.t.actifSr(traitement.finalite)}</span>
                </label>
              </td>
              <td>
                <input
                  class="ui-champ w-24"
                  max={data.dureeMax}
                  min="1"
                  name={`duree-${traitement.code}`}
                  type="number"
                  defaultValue={traitement.entree.dureeMois}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <p class="text-xs text-encre-douce">
      {data.t.rDurees(data.dureeMax)}
    </p>

    <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.enregistrerRegistre}</button>
  </form>
</main>
