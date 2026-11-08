<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function classe(statut: string): string {
    if (statut === "actif" || statut === "verifie") {
      return "ui-badge ui-badge--accent";
    }
    if (statut === "erreur") return "ui-badge ui-badge--alerte";
    return "ui-badge";
  }
</script>

<svelte:head>
  <title>{data.t.dTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {data.t.dSurtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{data.t.dTitre}</h1>
    <p class="max-w-2xl text-encre-douce">{data.t.dDescription}</p>
    <a class="ui-lien text-sm" href="/hote/design">{data.t.dRetour}</a>
  </header>

  {#if data.message}
    <p class="ui-alerte ui-alerte--ok" role="status">{data.message}</p>
  {/if}
  {#if form?.message}
    <p class="ui-alerte ui-alerte--danger" role="alert">{form.message}</p>
  {/if}
  {#if !data.sitePublie}
    <p class="ui-alerte ui-alerte--alerte">
      {data.t.dSiteNonPublie}
    </p>
  {/if}

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">{data.t.dAjouterTitre}</h2>
    <form class="flex flex-wrap items-end gap-3" method="POST" action="?/ajouter">
      <label class="min-w-0 flex-1 space-y-2">
        <span class="ui-label">{data.t.dDomaine}</span>
        <input
          class="ui-champ"
          name="domaine"
          placeholder="sejour.example.com"
          required
          autocomplete="off"
        />
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.dAjouter}</button>
    </form>
    <p class="text-xs text-encre-faine">
      {data.t.dAide}
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">
      {data.t.dCompte(data.domaines.length)}
    </h2>

    {#if data.domaines.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {data.t.dAucun}
      </p>
    {:else}
      {#each data.domaines as domaine (domaine.id)}
        <article class="ui-carte space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-lg font-semibold">{domaine.domaine}</h3>
            <span class={classe(domaine.statut)}>
              {data.t.dStatuts[domaine.statut] ?? domaine.statut}
            </span>
          </div>

          {#if domaine.verificationToken}
            <div class="space-y-1 rounded-xl border border-bordure bg-surface p-3 text-sm">
              <p class="font-medium">{data.t.dDns}</p>
              <p class="break-all font-mono text-xs">
                {data.t.dDnsDetail(domaine.domaine, domaine.verificationToken)}
              </p>
            </div>
          {/if}

          <div class="flex flex-wrap gap-2">
            {#if domaine.statut === "en_attente" || domaine.statut === "erreur"}
              <form method="POST" action="?/verifier">
                <input type="hidden" name="id" value={domaine.id} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {data.t.dVerifierDns}
                </button>
              </form>
            {/if}
            {#if domaine.statut === "verifie"}
              <form method="POST" action="?/activer">
                <input type="hidden" name="id" value={domaine.id} />
                <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                  {data.t.dActiver}
                </button>
              </form>
            {/if}
            <form method="POST" action="?/supprimer">
              <input type="hidden" name="id" value={domaine.id} />
              <button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">
                {data.t.dSupprimer}
              </button>
            </form>
          </div>
        </article>
      {/each}
    {/if}
  </section>
</main>
