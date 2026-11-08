<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsReglagesGroupe } from "@/lib/i18n-reglages-groupe";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsReglagesGroupe(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.surtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
    <p class="max-w-3xl text-encre-douce">
      {t.description}
    </p>
  </header>

  {#if data.ok === "applique"}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {t.okApplique(data.nombre ?? t.nombreDefautApplique)}
    </p>
  {:else if data.ok === "restaure"}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {t.okRestaure(data.nombre ?? t.nombreDefautRestaure)}
    </p>
  {:else if data.ok === "aucun"}
    <p class="ui-alerte ui-alerte--alerte" role="status">
      {t.okAucun}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
    </p>
  {/if}
  {#if form?.message}
    <p
      class:ui-alerte--danger={!form.ok}
      class:ui-alerte--succes={form.ok}
      class="ui-alerte"
      role="status"
    >
      {form.message}
    </p>
  {/if}

  <section class="ui-carte space-y-5">
    <form method="POST" action="?/previsualiser" class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-3">
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.bufferLabel}</span>
          <input
            class="ui-champ"
            type="number"
            name="bufferJours"
            min="0"
            max="7"
            step="1"
            placeholder={t.placeholderInchange}
          />
          <span class="text-xs text-encre-faine">{t.bufferIndication}</span>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.cutoffLabel}</span>
          <input
            class="ui-champ"
            type="number"
            name="cutoffJours"
            min="0"
            max="365"
            step="1"
            placeholder={t.placeholderInchange}
          />
          <span class="text-xs text-encre-faine">{t.cutoffIndication}</span>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.strategieLabel}</span>
          <select class="ui-champ" name="strategiePrix">
            <option value="">{t.optionInchangee}</option>
            {#each data.strategies as strategie (strategie.valeur)}
              <option value={strategie.valeur}>{strategie.libelle}</option>
            {/each}
          </select>
        </label>
      </div>

      <fieldset class="space-y-3">
        <legend class="text-sm font-semibold">{t.logementsConcernes}</legend>
        {#if data.logements.length === 0}
          <p class="text-sm text-encre-faine">{t.aucunLogement}</p>
        {:else}
          <div class="grid gap-2 md:grid-cols-2">
            {#each data.logements as logement (logement.logementId)}
              <label
                class="flex items-start gap-3 rounded-controle border border-bordure p-3 text-sm"
              >
                <input
                  class="mt-1"
                  type="checkbox"
                  name="logementIds"
                  value={logement.logementId}
                />
                <span>
                  <span class="font-medium">{logement.nom}</span>
                  <span class="mt-1 block text-xs text-encre-faine">
                    {t.resumeReglages(
                      logement.bufferJours,
                      logement.cutoffJours,
                      logement.strategiePrix,
                    )}
                  </span>
                </span>
              </label>
            {/each}
          </div>
        {/if}
      </fieldset>

      <div class="flex flex-wrap gap-3">
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.previsualiser}
        </button>
        <button
          class="ui-bouton ui-bouton--primaire"
          type="submit"
          formaction="?/appliquer"
        >
          {t.appliquerVersion}
        </button>
      </div>
    </form>
  </section>

  {#if form?.apercu && form.apercu.length > 0}
    <section class="space-y-3">
      <h2 class="text-xl font-semibold">{t.diffTitre}</h2>
      <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
        <table class="w-full min-w-[760px] text-left text-sm">
          <thead
            class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine"
          >
            <tr>
              <th class="p-3">{t.colLogement}</th>
              <th class="p-3">{t.colAvant}</th>
              <th class="p-3">{t.colApres}</th>
              <th class="p-3">{t.colEtat}</th>
            </tr>
          </thead>
          <tbody>
            {#each form.apercu as ligne (ligne.logementId)}
              <tr class="border-b border-bordure last:border-0">
                <td class="p-3 font-medium">{ligne.nom}</td>
                <td class="p-3 text-xs text-encre-douce">
                  {t.resumeReglages(
                    ligne.avant.bufferJours,
                    ligne.avant.cutoffJours,
                    ligne.avant.strategiePrix,
                  )}
                </td>
                <td class="p-3 text-xs">
                  {t.resumeReglages(
                    ligne.apres.bufferJours,
                    ligne.apres.cutoffJours,
                    ligne.apres.strategiePrix,
                  )}
                </td>
                <td class="p-3">
                  {#if ligne.modifie}
                    <span class="ui-badge ui-badge--accent">{t.modifie}</span>
                  {:else}
                    <span class="text-encre-faine">{t.inchange}</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}

  <section class="space-y-3">
    <div>
      <h2 class="text-xl font-semibold">{t.historiqueTitre}</h2>
      <p class="text-sm text-encre-douce">
        {t.historiqueAide}
      </p>
    </div>
    {#if data.versions.length === 0}
      <p class="ui-carte text-sm text-encre-faine">
        {t.aucuneVersion}
      </p>
    {:else}
      <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
        <table class="w-full min-w-[720px] text-left text-sm">
          <thead
            class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine"
          >
            <tr>
              <th class="p-3">{t.colDate}</th>
              <th class="p-3">{t.colAction}</th>
              <th class="p-3">{t.colAuteur}</th>
              <th class="p-3">{t.colLogements}</th>
              <th class="p-3">{t.colRef}</th>
              <th class="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {#each data.versions as version (version.id)}
              <tr class="border-b border-bordure last:border-0">
                <td class="p-3">
                  {new Date(version.createdAt).toLocaleString(t.localeDate)}
                </td>
                <td class="p-3">
                  {version.action === "restaurer"
                    ? t.restauration
                    : t.application}
                </td>
                <td class="p-3 text-encre-douce">{version.auteurEmail}</td>
                <td class="p-3">{version.logements}</td>
                <td class="p-3 font-mono text-xs text-encre-faine">
                  {version.ref.slice(0, 18)}…
                </td>
                <td class="p-3">
                  <form method="POST" action="?/restaurer">
                    <input type="hidden" name="versionId" value={version.id} />
                    <button
                      class="ui-bouton ui-bouton--fantome text-xs"
                      type="submit"
                    >
                      {t.revenirAvant}
                    </button>
                  </form>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/hote/prix">{t.lienPrix}</a>
    <a class="ui-lien" href="/hote/planning">{t.lienPlanning}</a>
    <a class="ui-lien" href="/hote">{t.lienTableauBord}</a>
  </nav>
</main>
