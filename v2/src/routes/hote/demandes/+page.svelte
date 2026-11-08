<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  function lienStatut(statut: string): string {
    return statut ? `/hote/demandes?statut=${statut}` : "/hote/demandes";
  }
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<div class="space-y-6">
  <header>
    <h1 class="text-2xl font-semibold">{data.t.titre}</h1>
    <p class="mt-1 text-sm text-encre-douce">{data.t.description}</p>
  </header>

  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {data.t.erreur} ({data.erreur})
    </p>
  {:else if data.ok === "qualifiee"}
    <p class="ui-alerte" role="status">{data.t.okQualifiee}</p>
  {:else if data.ok === "refusee"}
    <p class="ui-alerte" role="status">{data.t.okRefusee}</p>
  {:else if data.ok}
    <p class="ui-alerte" role="status">{data.t.okConvertie(data.ok)}</p>
  {/if}

  <nav class="flex flex-wrap gap-2 text-sm">
    <a
      class="ui-bouton ui-bouton--fantome"
      class:font-semibold={data.statut === ""}
      href={lienStatut("")}>{data.t.filtreTous}</a
    >
    {#each data.statuts as statut (statut)}
      <a
        class="ui-bouton ui-bouton--fantome"
        class:font-semibold={data.statut === statut}
        href={lienStatut(statut)}>{data.t.statuts[statut]}</a
      >
    {/each}
  </nav>

  {#if data.demandes.length === 0}
    <p class="ui-carte text-sm text-encre-douce">{data.t.vide}</p>
  {:else}
    <ul class="space-y-4">
      {#each data.demandes as demande (demande.id)}
        <li class="ui-carte space-y-4">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p class="font-mono text-xs text-encre-douce">{demande.ref}</p>
              <p class="font-semibold">{demande.nom}</p>
              <p class="text-sm text-encre-douce">
                {demande.email}
                {#if demande.telephone}&middot; {demande.telephone}{/if}
              </p>
            </div>
            <span class="ui-etiquette">{data.t.statuts[demande.statut]}</span>
          </div>

          <dl class="grid gap-2 text-sm md:grid-cols-3">
            <div>
              <dt class="ui-label">{data.t.colonneSejour}</dt>
              <dd>
                {#if demande.arrivee && demande.depart}
                  {demande.arrivee} &rarr; {demande.depart}
                {:else}
                  -
                {/if}
                &middot; {demande.voyageurs} {data.t.voyageurs}
              </dd>
            </div>
            <div>
              <dt class="ui-label">{data.t.colonneSource}</dt>
              <dd>{demande.source}</dd>
            </div>
            <div>
              <dt class="ui-label">{data.t.colonneStatut}</dt>
              <dd>
                {data.t.statuts[demande.statut]}
                {#if demande.reservationId}
                  &middot; {data.t.reservation} {demande.reservationId}
                {/if}
                {#if demande.motifRefus}&middot; {demande.motifRefus}{/if}
              </dd>
            </div>
          </dl>

          {#if demande.message}
            <div>
              <p class="ui-label">{data.t.colonneMessage}</p>
              <p class="whitespace-pre-line text-sm">{demande.message}</p>
            </div>
          {/if}

          {#if demande.statut === "convertie"}
            <p class="text-sm text-encre-douce">
              {data.t.reservation} : {demande.reservationId ?? "-"}
            </p>
          {:else if demande.statut !== "refusee"}
            <div class="flex flex-wrap items-end gap-3">
              <form method="POST" action="?/qualifier">
                <input type="hidden" name="id" value={demande.id} />
                <input type="hidden" name="statut" value="qualifiee" />
                <button class="ui-bouton" type="submit">
                  {data.t.qualifier}
                </button>
              </form>

              <form class="flex flex-wrap items-end gap-2" method="POST" action="?/qualifier">
                <input type="hidden" name="id" value={demande.id} />
                <input type="hidden" name="statut" value="refusee" />
                <label class="space-y-1">
                  <span class="ui-label">{data.t.motifRefus}</span>
                  <input
                    class="ui-champ"
                    name="motifRefus"
                    placeholder={data.t.motifPlaceholder}
                    required
                    minlength="3"
                    maxlength="200"
                  />
                </label>
                <button class="ui-bouton ui-bouton--fantome" type="submit">
                  {data.t.refuser}
                </button>
              </form>

              <form class="flex flex-wrap items-end gap-2" method="POST" action="?/convertir">
                <input type="hidden" name="id" value={demande.id} />
                <label class="space-y-1">
                  <span class="ui-label">{data.t.logementChoisi}</span>
                  <select class="ui-champ" name="logementId">
                    <option value={demande.logementId ?? ""}>
                      {demande.logementId ?? "-"}
                    </option>
                    {#each data.logements as logement (logement.id)}
                      <option value={logement.id}>{logement.nom}</option>
                    {/each}
                  </select>
                </label>
                <button class="ui-bouton" type="submit">
                  {data.t.convertir}
                </button>
              </form>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>

