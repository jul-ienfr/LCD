<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Routage assistant — LCD Parc</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Super-admin · Assistant
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Routage LLM</h1>
    <p class="max-w-3xl text-encre-douce">
      Le routage choisit un niveau local, standard ou premium selon l’intention
      et le ton. Les modèles ci-dessous surchargent les valeurs d’environnement
      sans redéploiement. Le kill-switch coupe immédiatement la génération.
    </p>
  </header>

  {#if data.ok === "config"}
    <p class="ui-alerte ui-alerte--ok" role="status">
      Configuration enregistrée et auditée.
    </p>
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

  <section class="grid gap-4 md:grid-cols-2">
    <article class="ui-carte space-y-2">
      <h2 class="text-lg font-semibold">Fournisseur</h2>
      <p class="text-sm">
        État :
        {#if data.fournisseur.configure}
          <span class="ui-badge ui-badge--accent">Configuré</span>
        {:else}
          <span class="ui-badge">Repli local uniquement</span>
        {/if}
      </p>
      <p class="text-sm text-encre-douce">
        Endpoint : {data.fournisseur.hote ?? "non renseigné"}<br />
        Modèle standard env. : <code>{data.fournisseur.modeleEnv}</code><br />
        Modèle premium env. :
        <code>{data.fournisseur.modelePremiumEnv ?? "non renseigné"}</code>
      </p>
      <p class="text-xs text-encre-faine">
        Les clés LLM restent dans les secrets serveur et ne sont jamais affichées
        ici.
      </p>
    </article>

    <article class="ui-carte space-y-2">
      <h2 class="text-lg font-semibold">État global</h2>
      <p class="text-sm">
        {#if data.configuration.actif}
          <span class="ui-badge ui-badge--accent">Génération active</span>
        {:else}
          <span class="ui-badge">Kill-switch actif</span>
        {/if}
      </p>
      <p class="text-sm text-encre-douce">
        {data.configuration.actif
          ? "Les hôtes peuvent générer des brouillons."
          : "Toute nouvelle génération est refusée ; l’historique reste consultable."}
      </p>
    </article>
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">Configuration</h2>
    <form method="POST" action="?/configurer" class="space-y-4">
      <label class="flex items-start gap-3 text-sm">
        <input
          class="mt-1"
          type="checkbox"
          name="actif"
          checked={data.configuration.actif}
        />
        <span>
          <span class="font-medium">Assistant actif</span><br />
          <span class="text-encre-faine">
            Décocher coupe la génération immédiatement, sans redéploiement.
          </span>
        </span>
      </label>

      <div class="grid gap-4 sm:grid-cols-2">
        <label class="ui-champ-groupe">
          <span class="ui-label">Modèle standard (surcharge)</span>
          <input
            class="ui-champ"
            name="modeleStandard"
            value={data.configuration.modeleStandard}
            placeholder={data.fournisseur.modeleEnv}
            maxlength="80"
            autocomplete="off"
          />
          <span class="text-xs text-encre-faine">
            Vide = valeur d’environnement. Ex. <code>gpt-4o-mini</code>.
          </span>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">Modèle premium (surcharge)</span>
          <input
            class="ui-champ"
            name="modelePremium"
            value={data.configuration.modelePremium}
            placeholder={data.fournisseur.modelePremiumEnv ?? "non renseigné"}
            maxlength="80"
            autocomplete="off"
          />
          <span class="text-xs text-encre-faine">
            Vide = valeur d’environnement.
          </span>
        </label>
      </div>

      <button class="ui-bouton ui-bouton--primaire" type="submit">
        Enregistrer la configuration
      </button>
    </form>
  </section>

  <section class="space-y-3">
    <div>
      <h2 class="text-xl font-semibold">Règles de routage</h2>
      <p class="text-sm text-encre-douce">
        Aperçu déterministe des 15 combinaisons. Le coût est une estimation
        interne, pas une facture fournisseur.
      </p>
    </div>
    <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
      <table class="w-full min-w-[820px] text-left text-sm">
        <thead
          class="border-b border-bordure text-xs uppercase tracking-wide text-encre-faine"
        >
          <tr>
            <th class="p-3">Intention</th>
            <th class="p-3">Ton</th>
            <th class="p-3">Niveau</th>
            <th class="p-3">Modèle</th>
            <th class="p-3">Coût estimé</th>
            <th class="p-3">Raison</th>
          </tr>
        </thead>
        <tbody>
          {#each data.routage as ligne (`${ligne.intention}-${ligne.ton}`)}
            <tr class="border-b border-bordure last:border-0">
              <td class="p-3 font-medium">{ligne.intentionLibelle}</td>
              <td class="p-3">{ligne.tonLibelle}</td>
              <td class="p-3">
                <span
                  class:ui-badge--accent={ligne.niveau !== "local"}
                  class="ui-badge"
                >
                  {ligne.niveau}
                </span>
              </td>
              <td class="p-3 font-mono text-xs">
                {ligne.modeleEffectif}
                {#if ligne.modeleEffectif === "local"}
                  <span class="ml-1 font-sans text-encre-faine">(repli)</span>
                {/if}
              </td>
              <td class="p-3">{ligne.cout === 0 ? "0 €" : `${ligne.cout} cts`}</td>
              <td class="p-3 text-xs text-encre-douce">{ligne.raison}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/supervision">Supervision</a>
    <a class="ui-lien" href="/hote/assistant">Voir l’assistant hôte</a>
    <a class="ui-lien" href="/journal">Journal d’audit</a>
  </nav>
</main>
