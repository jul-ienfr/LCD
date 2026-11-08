<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<svelte:head>
  <title>Pipeline commercial — LCD</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Espace commercial</p>
      <h1 class="text-3xl font-semibold tracking-tight">Pipeline commercial</h1>
      <p class="text-encre-douce">{data.nombreProspects} prospect{data.nombreProspects > 1 ? "s" : ""} · {data.enCours} en cours · {data.gagnes} gagné{data.gagnes > 1 ? "s" : ""} · {data.nombreOffres} offre{data.nombreOffres > 1 ? "s" : ""}</p>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <a class="ui-lien text-sm" href="/hote/securite">Sécurité / 2FA</a>
      <a class="ui-lien text-sm" href="/support">Support</a>
      <form method="POST" action="/logout"><button class="ui-bouton ui-bouton--fantome ui-bouton--petit" type="submit">Quitter</button></form>
    </div>
  </header>

  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role="status">{form.message}</p>
  {/if}

  <section class="ui-carte">
    <h2 class="text-lg font-semibold">Nouveau prospect</h2>
    <form method="POST" action="?/creer" class="mt-4 grid gap-3 sm:grid-cols-2">
      <label class="ui-champ-groupe"><span class="ui-label">Nom</span><input class="ui-champ" name="nom" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">Source</span>
        <select class="ui-champ" name="source">
          <option value="site">Site</option>
          <option value="manuel">Manuel</option>
          <option value="recommandation">Recommandation</option>
          <option value="salon">Salon</option>
        </select>
      </label>
      <label class="ui-champ-groupe"><span class="ui-label">E-mail</span><input class="ui-champ" type="email" name="email" /></label>
      <label class="ui-champ-groupe"><span class="ui-label">Téléphone</span><input class="ui-champ" type="tel" name="telephone" /></label>
      <label class="ui-champ-groupe sm:col-span-2"><span class="ui-label">Notes</span><textarea class="ui-champ" name="notes" rows="2"></textarea></label>
      <div class="sm:col-span-2"><button class="ui-bouton ui-bouton--primaire" type="submit">Créer le prospect</button></div>
    </form>
  </section>

  <section class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {#each data.prospection as colonne (colonne.statut)}
      <div class="rounded-carte border border-bordure bg-surface p-4">
        <h2 class="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-encre-douce">
          <span>{colonne.libelle}</span>
          <span class="ui-etiquette">{colonne.items.length}</span>
        </h2>
        <ul class="mt-3 space-y-2">
          {#each colonne.items as prospect (prospect.id)}
            <li>
              <a class="block rounded-controle border border-bordure p-3 hover:bg-surface-2" href={`/commercial/prospects/${prospect.id}`}>
                <p class="font-medium">{prospect.nom}</p>
                <p class="text-xs text-encre-faine">{prospect.source}{prospect.email ? ` · ${prospect.email}` : ""}</p>
              </a>
            </li>
          {/each}
          {#if colonne.items.length === 0}<li class="text-xs text-encre-faine">Aucun prospect.</li>{/if}
        </ul>
      </div>
    {/each}
  </section>

  <a class="ui-lien text-sm" href="/">Retour à l’accueil</a>
</main>
