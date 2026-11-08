<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsFinance } from "@/lib/i18n-finance";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsFinance(data.langue));
</script>

<svelte:head>
  <title>{t.sortiesTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.sortieEspace}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.sortieTitre}</h1>
    <p class="max-w-3xl text-encre-douce">{t.sortieDescription}</p>
  </header>

  {#if data.ok === "demande"}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {t.okDemande}
    </p>
  {:else if data.ok === "decide"}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.okDecide}</p>
  {:else if data.ok === "paye"}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.okPaye}</p>
  {/if}
  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class="ui-alerte" role="alert">
      {form.message}
    </p>
  {/if}

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">{t.nouvelle}</h2>
    <form method="POST" action="?/demander" class="grid gap-4 sm:grid-cols-2">
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.colType}</span>
        <select class="ui-champ" name="type" required>
          {#each data.types as type (type.valeur)}
            <option value={type.valeur}>{type.libelle}</option>
          {/each}
        </select>
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.beneficiaire}</span>
        <input
          class="ui-champ"
          name="beneficiaire"
          required
          minlength="2"
          maxlength="120"
          placeholder={t.beneficiairePlaceholder}
        />
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.montant}</span>
        <input
          class="ui-champ"
          name="montantEuros"
          required
          inputmode="decimal"
          placeholder="120,50"
        />
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.referenceOptionnel}</span>
        <input
          class="ui-champ"
          name="reference"
          maxlength="64"
          placeholder={t.referencePlaceholder}
        />
      </label>
      <label class="ui-champ-groupe sm:col-span-2">
        <span class="ui-label">{t.motifSortie}</span>
        <textarea
          class="ui-champ min-h-24"
          name="motif"
          required
          minlength="3"
          maxlength="500"
          placeholder={t.motifSortiePlaceholder}
        ></textarea>
      </label>
      <div class="sm:col-span-2">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.demander}
        </button>
      </div>
    </form>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">{t.registre}</h2>
    {#if data.sorties.length === 0}
      <p class="ui-carte text-sm text-encre-faine">
        {t.aucuneSortie}
      </p>
    {:else}
      <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead
            class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine"
          >
            <tr>
              <th class="p-3">{t.colDate}</th>
              <th class="p-3">{t.colType}</th>
              <th class="p-3">{t.colBeneficiaire}</th>
              <th class="p-3">{t.colMontant}</th>
              <th class="p-3">{t.colRef}</th>
              <th class="p-3">{t.colStatut}</th>
              <th class="p-3">{t.colDemandeur}</th>
              <th class="p-3">{t.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.sorties as sortie (sortie.id)}
              <tr class="border-b border-bordure align-top last:border-0">
                <td class="p-3 text-xs text-encre-faine">
                  {sortie.createdAt.toLocaleString("fr-FR")}
                </td>
                <td class="p-3">{sortie.typeLibelle}</td>
                <td class="p-3">
                  <span class="font-medium">{sortie.beneficiaire}</span>
                  <span class="mt-1 block text-xs text-encre-faine">
                    {sortie.motif}
                  </span>
                </td>
                <td class="p-3 font-semibold">{sortie.montant}</td>
                <td class="p-3 font-mono text-xs">{sortie.ref}</td>
                <td class="p-3">
                  <span
                    class:ui-badge--accent={sortie.statut === "approuvee"}
                    class="ui-badge"
                  >
                    {t.statutsSortie[sortie.statut] ?? sortie.statutLibelle}
                  </span>
                  {#if sortie.payeeLe}
                    <span class="mt-1 block text-xs text-encre-faine">
                      {t.payeeLe(sortie.payeeLe.toLocaleDateString())}
                    </span>
                  {/if}
                </td>
                <td class="p-3 text-xs text-encre-douce">
                  {sortie.demandeurEmail}
                </td>
                <td class="p-3">
                  {#if sortie.statut === "en_attente"}
                    {#if data.peutDecider && sortie.demandeurId !== data.moi}
                      <div class="flex flex-wrap gap-2">
                        <form method="POST" action="?/decider">
                          <input
                            type="hidden"
                            name="validationId"
                            value={sortie.id}
                          />
                          <input type="hidden" name="decision" value="approuvee" />
                          <button
                            class="ui-bouton ui-bouton--primaire text-xs"
                            type="submit"
                          >
                            {t.approuver}
                          </button>
                        </form>
                        <form method="POST" action="?/decider">
                          <input
                            type="hidden"
                            name="validationId"
                            value={sortie.id}
                          />
                          <input type="hidden" name="decision" value="rejetee" />
                          <button
                            class="ui-bouton ui-bouton--fantome text-xs"
                            type="submit"
                          >
                            {t.rejeter}
                          </button>
                        </form>
                      </div>
                    {:else}
                      <span class="text-xs text-encre-faine">
                        {t.attenteAutre}
                      </span>
                    {/if}
                  {:else if sortie.statut === "approuvee" && data.peutDecider}
                    <form method="POST" action="?/payer">
                      <input
                        type="hidden"
                        name="validationId"
                        value={sortie.id}
                      />
                      <button
                        class="ui-bouton ui-bouton--secondaire text-xs"
                        type="submit"
                      >
                        {t.marquerPayee}
                      </button>
                    </form>
                  {:else}
                    <span class="text-xs text-encre-faine">—</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/hote/compta">{t.compta}</a>
    <a class="ui-lien" href="/hote/cautions">{t.cautions}</a>
    <a class="ui-lien" href="/hote">{t.tableauBord}</a>
  </nav>
</main>
