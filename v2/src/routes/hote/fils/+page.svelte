<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>{data.t.fTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {data.t.fSurtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{data.t.fTitre}</h1>
    <p class="max-w-3xl text-encre-douce">{data.t.fDescription}</p>
  </header>

  {#if data.ok === "cree"}
    <p class="ui-alerte ui-alerte--ok" role="status">{data.t.fCree}</p>
  {/if}
  {#if form?.message}
    <p
      class:ui-alerte--danger={!form.ok}
      class="ui-alerte"
      role="alert"
    >
      {form.message}
    </p>
  {/if}

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">{data.t.fNouveau}</h2>
    <form method="POST" action="?/creer" class="grid gap-4 sm:grid-cols-4">
      <label class="ui-champ-groupe">
        <span class="ui-label">{data.t.fCanal}</span>
        <select class="ui-champ" name="canal" required>
          {#each data.canaux as canal (canal.valeur)}
            <option value={canal.valeur}>{canal.libelle}</option>
          {/each}
        </select>
      </label>
      <label class="ui-champ-groupe sm:col-span-2">
        <span class="ui-label">{data.t.fSujet}</span>
        <input
          class="ui-champ"
          name="sujet"
          required
          minlength="3"
          maxlength={data.sujetMax}
          placeholder={data.t.fSujetPlaceholder}
        />
      </label>
      <label class="ui-champ-groupe">
        <span class="ui-label">{data.t.fLogementOptionnel}</span>
        <select class="ui-champ" name="logementId">
          <option value="">{data.t.fAucun}</option>
          {#each data.logements as logement (logement.id)}
            <option value={logement.id}>{logement.nom}</option>
          {/each}
        </select>
      </label>
      <div class="sm:col-span-4">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {data.t.fCreer}
        </button>
      </div>
    </form>
  </section>

  <section class="space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-xl font-semibold">{data.t.fConversations}</h2>
      <nav class="flex flex-wrap gap-2 text-sm" aria-label={data.t.fFiltrer}>
        <a
          class={data.canal === null
            ? "rounded-full border border-accent bg-accent-douce px-3 py-1 font-semibold text-accent"
            : "rounded-full border px-3 py-1"}
          href="/hote/fils"
        >
          {data.t.fTous}
        </a>
        {#each data.canaux as canal (canal.valeur)}
          <a
            class={data.canal === canal.valeur
              ? "rounded-full border border-accent bg-accent-douce px-3 py-1 font-semibold text-accent"
              : "rounded-full border px-3 py-1"}
            href={`/hote/fils?canal=${canal.valeur}`}
          >
            {canal.libelle}
          </a>
        {/each}
      </nav>
    </div>

    {#if data.fils.length === 0}
      <p class="ui-carte text-sm text-encre-faine">
        {data.t.fVide}
      </p>
    {:else}
      <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead
            class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine"
          >
            <tr>
              <th class="p-3">{data.t.fColSujet}</th>
              <th class="p-3">{data.t.fColCanal}</th>
              <th class="p-3">{data.t.fColLogement}</th>
              <th class="p-3">{data.t.fColStatut}</th>
              <th class="p-3">{data.t.fColActivite}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.fils as fil (fil.id)}
              <tr class="border-b border-bordure last:border-0">
                <td class="p-3">
                  <a class="ui-lien font-medium" href={`/hote/fils/${fil.id}`}>
                    {fil.sujet}
                  </a>
                </td>
                <td class="p-3">{fil.canalLibelle}</td>
                <td class="p-3 text-encre-douce">
                  {fil.logementNom ?? "—"}
                </td>
                <td class="p-3">
                  {#if fil.statut === "ouvert"}
                    <span class="ui-badge ui-badge--accent">{data.t.fOuvert}</span>
                  {:else}
                    <span class="ui-badge">{data.t.fFerme}</span>
                  {/if}
                </td>
                <td class="p-3 text-xs text-encre-faine">
                  {fil.dernierMessageAt.toLocaleString(data.langue, { dateStyle: "short", timeStyle: "short" })}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/hote">{data.t.fTableau}</a>
    <a class="ui-lien" href="/hote/messages">{data.t.fMessagesVoyageur}</a>
  </nav>
</main>
