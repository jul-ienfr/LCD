<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsLogements } from "@/lib/i18n-logements";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsLogements(data.langue));
</script>

<svelte:head>
  <title>{t.titre} — LCD Parc</title>
</svelte:head>

<main class="mx-auto max-w-4xl space-y-8 px-6 py-10">
  <header class="ui-entete space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espace}
    </p>
    <div class="flex flex-wrap items-end justify-between gap-3">
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <a class="ui-lien text-sm" href={data.tous ? "/hote/logements" : "/hote/logements?tous=1"}>
        {data.tous ? t.masquerArchives : t.afficherArchives}
      </a>
    </div>
    <p class="text-encre-douce">
      {t.tenant} : <span class="font-medium">{data.tenantId}</span>
    </p>
  </header>

  <section class="ui-carte space-y-4">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold">{t.ajouter}</h2>
      <p class="text-sm text-encre-douce">{t.ajouterIntro}</p>
    </div>

    <form method="POST" action="?/creer" class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="ui-label">{t.code}</span>
          <input
            class="ui-champ"
            name="code"
            placeholder="log-1"
            pattern="[a-z0-9][a-z0-9-]&#123;0,30&#125;[a-z0-9]"
            defaultValue={form?.code ?? ""}
            required
          />
          <span class="block text-xs text-encre-faine">
            {t.codeAide}
          </span>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.nom}</span>
          <input
            class="ui-champ"
            name="nom"
            placeholder="Santa Severa"
            defaultValue={form?.nom ?? ""}
            required
          />
        </label>
      </div>
      <label class="space-y-2">
        <span class="ui-label">{t.adresse}</span>
        <input
          class="ui-champ"
          name="adresse"
          placeholder="Saint-Laurent-du-Var"
          defaultValue={form?.adresse ?? ""}
        />
      </label>

      {#if form?.message}
        <p
          class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
          role="status"
        >
          {form.message}
        </p>
      {/if}

      <button class="ui-bouton ui-bouton--primaire" type="submit">
        {t.creer}
      </button>
    </form>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">
      {data.logements.length} logement{data.logements.length > 1 ? "s" : ""}
    </h2>

    {#if data.logements.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">
        {t.aucun}
      </p>
    {:else}
      <ul class="divide-y divide-bordure overflow-hidden rounded-carte border border-bordure bg-surface">
        {#each data.logements as logement (logement.id)}
          <li class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p class="font-medium">{logement.nom}</p>
              <p class="text-sm text-encre-faine">
                {logement.code}
                {logement.adresse ? ` — ${logement.adresse}` : ""}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
              {#if !logement.coproVerifiee}
                <span class="ui-badge ui-badge--alerte">{t.copro}</span>
              {/if}
              <span class="ui-badge">{logement.statut}</span>
              <span class="ui-badge">{logement.publication}</span>
              <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/hote/logements/${logement.id}/calendrier`}>
                {t.calendrier}
              </a>
              <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={`/hote/logements/${logement.id}`}>
                {t.guide}
              </a>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
