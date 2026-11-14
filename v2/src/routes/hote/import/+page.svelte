<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Import CSV — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Espace hôte · Mise en route
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Import CSV</h1>
    <p class="text-encre-douce">
      Reprenez vos logements et vos réservations existants. Les lignes
      valides sont importées, les autres sont listées avec leur numéro de ligne.
    </p>
    <p class="text-sm">
      <a class="inline-flex min-h-11 items-center underline" href="/hote/onboarding">← Mise en route</a>
    </p>
  </header>

  {#if form?.erreurs.length}
    <section class="ui-alerte ui-alerte--danger space-y-2" data-rapport-import>
      <p class="font-medium">{form.message}</p>
      <ul class="max-h-64 space-y-1 overflow-y-auto text-sm">
        {#each form.erreurs as erreur (erreur.ligne + erreur.message)}
          <li>Ligne {erreur.ligne} : {erreur.message}</li>
        {/each}
      </ul>
    </section>
  {:else if form?.message}
    <p class="ui-alerte ui-alerte--ok" data-rapport-import>{form.message}</p>
  {/if}

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">Logements</h2>
      <p class="mt-1 text-sm text-encre-douce">
        Colonnes : <code>code</code>, <code>nom</code>, <code>adresse</code>
        (facultative). Le code doit être en minuscules, sans espace.
      </p>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <pre role="region" tabindex="0" aria-label="Exemple de fichier CSV" class="overflow-x-auto rounded-xl bg-surface-2 p-3 text-xs"><code>code,nom,adresse
appart-1,Studio centre,12 rue des Lilas
appart-2,Duplex gare,</code></pre>
    <form enctype="multipart/form-data" method="POST" action="?/logements">
      <label class="block space-y-2">
        <span class="ui-label">Fichier CSV des logements</span>
        <input accept=".csv,text/csv" class="ui-champ min-h-11" name="fichier" required type="file" />
      </label>
      <button class="ui-bouton ui-bouton--primaire mt-4" type="submit">
        Importer les logements
      </button>
    </form>
  </section>

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">Réservations</h2>
      <p class="mt-1 text-sm text-encre-douce">
        Colonnes : <code>ref</code>, <code>logement</code> (code existant),
        <code>debut</code>, <code>fin</code>, puis facultativement
        <code>client_nom</code>, <code>voyageurs</code> et
        <code>montant_centimes</code>. Les chevauchements sont refusés.
      </p>
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <pre role="region" tabindex="0" aria-label="Exemple de fichier CSV" class="overflow-x-auto rounded-xl bg-surface-2 p-3 text-xs"><code>ref,logement,debut,fin,client_nom,voyageurs,montant_centimes
R-2026-001,appart-1,2026-12-01,2026-12-05,Ada,2,45000</code></pre>
    <form enctype="multipart/form-data" method="POST" action="?/reservations">
      <label class="block space-y-2">
        <span class="ui-label">Fichier CSV des réservations</span>
        <input accept=".csv,text/csv" class="ui-champ min-h-11" name="fichier" required type="file" />
      </label>
      <button class="ui-bouton ui-bouton--primaire mt-4" type="submit">
        Importer les réservations
      </button>
    </form>
    <p class="text-xs text-encre-faine">
      {data.logements.length} logement(s) disponible(s) pour la correspondance
      des codes : {data.logements.map((logement) => logement.code).join(", ") || "aucun"}.
    </p>
  </section>
</main>
