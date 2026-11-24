<script lang="ts">
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";
  import { traductionsEntretienDomaine } from "@/lib/i18n-entretien-domaine";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsEntretienDomaine((data as { langue?: string }).langue ?? "fr"));

  function classe(statut: string): string {
    if (statut === "actif" || statut === "verifie") {
      return "ui-badge ui-badge--accent";
    }
    if (statut === "erreur") return "ui-badge ui-badge--alerte";
    return "ui-badge";
  }
</script>

<svelte:head>
  <title>{t.dTitrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.dSurtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.dTitre}</h1>
    <p class="max-w-2xl text-encre-douce">{t.dDescription}</p>
    <a class="ui-lien-action text-sm" href="/hote/design">{t.dRetour}</a>
  </header>

  {#if data.message}
    <p class="ui-alerte ui-alerte--ok" role="status">{data.message}</p>
  {/if}
  {#if form?.message}
    <p class="ui-alerte ui-alerte--danger" role="alert">{form.message}</p>
  {/if}
  {#if !data.sitePublie}
    <p role="status" class="ui-alerte ui-alerte--alerte">
      {t.dSiteNonPublie}
    </p>
  {/if}

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">{t.dAjouterTitre}</h2>
    <form class="flex flex-wrap items-end gap-3" method="POST" action="?/ajouter">
      <label class="min-w-0 flex-1 space-y-2">
        <span class="ui-label">{t.dDomaine}</span>
        <input
          class="ui-champ"
          name="domaine"
          placeholder="sejour.example.com"
          required
          autocomplete="off"
        />
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.dAjouter}</button>
    </form>
    <p class="text-xs text-encre-faine">
      {t.dAide}
    </p>
  </section>

  <section class="space-y-3">
    <h2 class="text-xl font-semibold">
      {t.dCompte(data.domaines.length)}
    </h2>

    {#if data.domaines.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.dAucun}
      </p>
    {:else}
      {#each data.domaines as domaine (domaine.id)}
        <article class="ui-carte space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h3 class="text-lg font-semibold">{domaine.domaine}</h3>
            <span class={classe(domaine.statut)}>
              {t.dStatuts[domaine.statut] ?? domaine.statut}
            </span>
          </div>

          {#if domaine.verificationToken}
            <div class="space-y-1 rounded-xl border border-bordure bg-surface p-3 text-sm">
              <p class="font-medium">{t.dDns}</p>
              <p class="break-all font-mono text-xs">
                {t.dDnsDetail(domaine.domaine, domaine.verificationToken)}
              </p>
            </div>
          {/if}

          <div class="flex flex-wrap gap-2">
            {#if domaine.statut === "en_attente" || domaine.statut === "erreur"}
              <form method="POST" action="?/verifier">
                <input type="hidden" name="id" value={domaine.id} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {t.dVerifierDns}
                </button>
              </form>
            {/if}
            {#if domaine.statut === "verifie"}
              <form method="POST" action="?/activer">
                <input type="hidden" name="id" value={domaine.id} />
                <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                  {t.dActiver}
                </button>
              </form>
            {/if}
            <ConfirmationAction
              langue={data.langue}
              action="supprimer"
              cible={domaine.id}
              libelle={t.dSupprimer}
              champs={{ id: domaine.id }}
            />
          </div>
        </article>
      {/each}
    {/if}
  </section>
</main>
