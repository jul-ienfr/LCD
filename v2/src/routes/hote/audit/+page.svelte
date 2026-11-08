<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.tNav.audit} — LCD Parc</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">{data.tNav.espaceHote}</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.tNav.audit}</h1>
      <p class="text-encre-douce">
        {data.total} action{data.total > 1 ? "s" : ""} sur les {data.jours} derniers jours
        {data.famille ? ` · ${data.familles.find((f) => f.id === data.famille)?.label ?? data.famille}` : ""}
      </p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.exportUrl}>{data.t.exporter}</a>
      <a class="ui-lien text-sm" href="/hote">{data.t.retour}</a>
    </div>
  </header>

  {#if data.ok === "purge"}
    <p class="ui-alerte ui-alerte--succes">
      {data.nombrePurges > 0
        ? data.t.messagePurge(data.nombrePurges, data.retention)
        : data.t.aucunePurge}
    </p>
  {/if}
  {#if data.erreur}<p class="ui-alerte ui-alerte--danger">{data.erreur.slice(0, 300)}</p>{/if}

  <form action="/hote/audit" class="flex flex-wrap items-end gap-3 rounded-carte border border-bordure bg-surface p-5 shadow-carte">
    <label class="min-w-0 flex-1 ui-champ-groupe">
      <span class="ui-label">{data.t.rechercher}</span>
      <input class="ui-champ" type="search" name="q" defaultValue={data.recherche} maxlength="100" placeholder={data.t.recherchePlaceholder} />
    </label>
    <label class="ui-champ-groupe">
      <span class="ui-label">{data.t.periode}</span>
      <select class="ui-champ" name="jours">
        {#each data.optionsJours as option (option)}<option value={option} selected={option === data.jours}>{option} {data.t.jours}</option>{/each}
      </select>
    </label>
    <label class="ui-champ-groupe">
      <span class="ui-label">{data.t.famille}</span>
      <select class="ui-champ" name="famille">
        <option value="" selected={data.famille === null || data.famille === undefined}>{data.t.toutes}</option>
        {#each data.familles as option (option.id)}<option value={option.id} selected={data.famille === option.id}>{option.label}</option>{/each}
      </select>
    </label>
    <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.filtrer}</button>
    {#if data.recherche || data.famille || data.jours !== 30}
      <a class="ui-lien text-sm" href="/hote/audit">{data.t.effacer}</a>
    {/if}
  </form>

  {#if data.entrees.length === 0}
    <p class="ui-carte border-dashed text-encre-douce">{data.t.aucuneAction}</p>
  {:else}
    <ul class="divide-y divide-bordure rounded-carte border border-bordure bg-surface">
      {#each data.entrees as entree (entree.id)}
        <li class="p-4">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <p class="flex flex-wrap items-center gap-2 font-medium">
                <span class="ui-etiquette">{entree.libelle}</span>
                <code class="text-xs text-encre-faine">{entree.action}</code>
              </p>
              <p class="break-words text-sm text-encre-douce">
                {data.t.par} <span class="font-medium">{entree.qui}</span>
                {entree.cible ? ` · ${data.t.cible} ${entree.cible}` : ""}
                {entree.ref ? ` · ${data.t.reference} ${entree.ref}` : ""}
              </p>
            </div>
            <time class="text-xs text-encre-faine" datetime={entree.createdAt}>{entree.date}</time>
          </div>
          {#if Object.keys(entree.payload).length > 0}
            <details class="mt-2 text-xs text-encre-douce">
              <summary class="cursor-pointer underline">{data.t.details}</summary>
              <pre class="mt-2 overflow-x-auto rounded-controle bg-fond p-3">{JSON.stringify(entree.payload, null, 2)}</pre>
            </details>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}

  {#if data.pages > 1}
    <nav aria-label="Pagination du journal" class="flex flex-wrap items-center gap-3 text-sm">
      {#if data.lienPrecedent}<a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.lienPrecedent}>{data.t.precedent}</a>{/if}
      <span class="text-encre-faine">{data.t.page} {data.pageCourante} / {data.pages}</span>
      {#if data.lienSuivant}<a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={data.lienSuivant}>{data.t.suivant}</a>{/if}
    </nav>
  {/if}

  <section class="ui-carte space-y-3">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold">{data.t.retention}</h2>
      <p class="text-sm text-encre-douce">
        {data.t.conservation} {data.retention} {data.t.jours}.
        {data.anciennes > 0
          ? data.t.messageAnciennes(data.anciennes)
          : data.t.aucuneAncienne}
      </p>
    </div>
    {#if data.anciennes > 0}
      <form method="POST" action="?/purger" class="flex flex-wrap items-end gap-3">
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.saisir} « {data.confirmationPurge} » pour supprimer définitivement ces entrées</span>
          <input class="ui-champ" name="confirmation" autocomplete="off" placeholder={data.confirmationPurge} required />
        </label>
        <button class="ui-bouton ui-bouton--danger" type="submit">{data.t.purger}</button>
      </form>
    {/if}
  </section>

  <a class="ui-lien text-sm" href="/hote">{data.t.tableau}</a>
</main>
