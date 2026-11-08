<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.t.espace}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.titre}</h1>
      <p class="text-encre-douce">{data.t.description}</p>
    </div>
    <a class="ui-lien text-sm" href="/hote/proprietaires">{data.t.proprietaires}</a>
  </header>

  {#if !data.tenant}
    <p class="ui-alerte ui-alerte--danger">{data.t.introuvable}</p>
  {:else}
    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok">{data.t.ok}</p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger">
        {data.erreur === "inattendu" ? data.t.erreurInattendue : data.erreur}
      </p>
    {/if}

    <section class="ui-carte">
      <h2 class="text-lg font-semibold">{data.t.identite}</h2>
      <p class="mt-1 text-sm text-encre-douce">{data.t.identiteAide}</p>
      <form class="mt-5 space-y-5" method="POST" action="?/enregistrer">
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="ui-label">{data.t.nom}</span>
            <input class="ui-champ" maxlength="120" minlength="2" name="nom" required defaultValue={data.tenant.nom} />
          </label>
          <label class="space-y-2">
            <span class="ui-label">{data.t.siren}</span>
            <input class="ui-champ font-mono" inputmode="numeric" maxlength="9" name="siren" pattern="[0-9]&#123;9&#125;" placeholder="123456789" defaultValue={data.tenant.siren ?? ""} />
            {#if data.tenant.siren}
              <span class="block text-xs text-encre-faine">{data.t.sirenEnregistre} : <span class="font-mono">{data.tenant.siren}</span></span>
            {/if}
          </label>
          <label class="space-y-2">
            <span class="ui-label">{data.t.nature}</span>
            <select class="ui-champ" name="nature">
              {#each data.natures as nature (nature.valeur)}
                <option value={nature.valeur} selected={nature.valeur === data.tenant.nature}>{nature.libelle}</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{data.t.regime}</span>
            <select class="ui-champ" name="regime">
              {#each data.regimes as regime (regime.valeur)}
                <option value={regime.valeur} selected={regime.valeur === data.tenant.regime}>{regime.libelle}</option>
              {/each}
            </select>
          </label>
          <label class="space-y-2">
            <span class="ui-label">{data.t.tva}</span>
            <select class="ui-champ" name="tva">
              {#each data.tvas as tva (tva.valeur)}
                <option value={tva.valeur} selected={tva.valeur === data.tenant.tva}>{tva.libelle}</option>
              {/each}
            </select>
          </label>
        </div>
        <label class="block space-y-2">
          <span class="ui-label">{data.t.adresse}</span>
          <textarea class="ui-champ min-h-20" maxlength="500" name="adresse" defaultValue={data.tenant.adresse ?? ""}></textarea>
        </label>
        <label class="block space-y-2">
          <span class="ui-label">{data.t.mentions}</span>
          <textarea class="ui-champ min-h-20" maxlength="2000" name="mentionsLegales" defaultValue={data.tenant.mentionsLegales ?? ""}></textarea>
          <span class="block text-xs text-encre-faine">
            {data.t.mentionsAide}
          </span>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.enregistrer}</button>
      </form>
    </section>
  {/if}
</main>
