<script lang="ts">
  import { traductionsConformite } from "@/lib/i18n-conformite";
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsConformite((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.rTitrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={t.rSurtitre}
    titre={t.rTitre}
    description={t.rDescription}
  />

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">{t.rOk}</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
    </p>
  {/if}

  <section class="ui-carte">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">{t.rAvancement}</h2>
        <p class="mt-1 text-sm text-encre-douce">
          {t.rResume(data.resume.documentes, data.resume.actifs, data.resume.pourcentage)}
        </p>
      </div>
      <span class={data.resume.complet ? "ui-badge ui-badge--accent" : "ui-badge ui-badge--alerte"}>
        {data.resume.complet ? t.rComplet : t.rACompleter}
      </span>
    </div>
    {#if data.resume.manquants.length > 0}
      <p class="mt-3 text-sm text-alerte">
        {t.rManquants(data.resume.manquants.join(", "))}
      </p>
    {/if}
    {#if !data.registre.dpoContact}
      <p class="mt-2 text-sm text-encre-douce">
        {t.rDpoAide}
      </p>
    {/if}
  </section>

  <form class="space-y-6 rounded-2xl border border-bordure bg-surface p-6 shadow-sm" method="POST" action="?/enregistrer">
    <div class="grid gap-3 sm:grid-cols-3">
      <label class="space-y-2">
        <span class="ui-label">{t.dpoNom}</span>
        <input class="ui-champ" name="dpoNom" placeholder="Camille Martin" defaultValue={data.registre.dpoNom} />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{t.dpoContact}</span>
        <input class="ui-champ" name="dpoContact" placeholder="dpo@exemple.fr" defaultValue={data.registre.dpoContact} />
      </label>
      <label class="space-y-2">
        <span class="ui-label">{t.hebergement}</span>
        <input class="ui-champ" name="hebergement" defaultValue={data.registre.hebergement} />
      </label>
    </div>

    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div role="region" tabindex="0" aria-label="Tableau défilant"  class="overflow-x-auto">
      <table class="ui-tableau min-w-[880px]">
        <thead>
          <tr>
            <th>{t.colTraitement}</th>
            <th>{t.colBaseLegale}</th>
            <th>{t.colDonnees}</th>
            <th>{t.colDestinataires}</th>
            <th>{t.colActif}</th>
            <th>{t.colConservation}</th>
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
                  placeholder={t.notesPlaceholder}
                  defaultValue={traitement.entree.notes}
                  aria-label={`${t.notesPlaceholder} — ${traitement.finalite}`}
                />
              </td>
              <td class="text-encre-douce">{traitement.baseLegale}</td>
              <td class="text-encre-douce">{traitement.donnees}</td>
              <td class="text-encre-douce">{traitement.destinataires}</td>
              <td>
                <label class="flex min-h-11 min-w-11 items-center gap-2">
                  <input defaultChecked={traitement.entree.actif} name={`actif-${traitement.code}`} type="checkbox" />
                  <span class="sr-only">{t.actifSr(traitement.finalite)}</span>
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
                  aria-label={`${t.colConservation} (mois) — ${traitement.finalite}`}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <p class="text-xs text-encre-douce">
      {t.rDurees(data.dureeMax)}
    </p>

    <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrerRegistre}</button>
  </form>
</main>
