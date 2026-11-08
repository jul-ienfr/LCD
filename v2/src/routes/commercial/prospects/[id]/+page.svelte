<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const libellesProspect: Record<string, string> = {
    nouveau: "Nouveau",
    qualifie: "Qualifier",
    visite: "Visite faite",
    offre: "Passer en offre",
    gagne: "Gagné",
    perdu: "Perdu",
  };
  const libellesOffre: Record<string, string> = {
    brouillon: "Brouillon",
    envoyee: "Envoyer",
    acceptee: "Accepter",
    refusee: "Refuser",
  };
</script>

<svelte:head>
  <title>{data.prospect.nom} — Prospect</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">Prospect</p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.prospect.nom}</h1>
      <p class="text-encre-douce">{data.prospect.source}{data.prospect.email ? ` · ${data.prospect.email}` : ""}{data.prospect.telephone ? ` · ${data.prospect.telephone}` : ""}</p>
    </div>
    <a class="ui-lien text-sm" href="/commercial">← Pipeline</a>
  </header>

  {#if form?.message}
    <p class:ui-alerte--danger={!form.ok} class:ui-alerte--succes={form.ok} class="ui-alerte" role="status">{form.message}</p>
  {/if}

  <section class="ui-carte space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h2 class="text-lg font-semibold">Statut</h2>
      <span class="ui-etiquette">{data.prospect.statut}</span>
    </div>
    {#if data.transitionsProspect.length > 0}
      <div class="flex flex-wrap gap-2">
        {#each data.transitionsProspect as statut (statut)}
          <form method="POST" action="?/statutProspect">
            <input type="hidden" name="prospectId" value={data.prospect.id} />
            <input type="hidden" name="statut" value={statut} />
            <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{libellesProspect[statut] ?? statut}</button>
          </form>
        {/each}
      </div>
    {/if}
    {#if data.prospect.notes}<p class="whitespace-pre-line text-sm text-encre-douce">{data.prospect.notes}</p>{/if}
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">Nouvelle offre</h2>
    <form method="POST" action="?/creerOffre" class="grid gap-3 sm:grid-cols-2">
      <input type="hidden" name="prospectId" value={data.prospect.id} />
      <label class="ui-champ-groupe"><span class="ui-label">Titre</span><input class="ui-champ" name="titre" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">Montant (€)</span><input class="ui-champ" name="montantEuros" inputmode="decimal" placeholder="1490,00" required /></label>
      <label class="ui-champ-groupe"><span class="ui-label">Logement (facultatif)</span>
        <select class="ui-champ" name="logementId">
          <option value="">Aucun</option>
          {#each data.logements as logement (logement.id)}<option value={logement.id}>{logement.nom}</option>{/each}
        </select>
      </label>
      <label class="ui-champ-groupe"><span class="ui-label">Notes</span><input class="ui-champ" name="notes" /></label>
      <div class="sm:col-span-2"><button class="ui-bouton ui-bouton--primaire" type="submit">Créer l’offre</button></div>
    </form>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">Offres ({data.offres.length})</h2>
    {#if data.offres.length === 0}
      <p class="ui-carte border-dashed text-encre-douce">Aucune offre pour ce prospect.</p>
    {:else}
      <ul class="space-y-3">
        {#each data.offres as offre (offre.id)}
          <li class="ui-carte">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium">{offre.titre}</p>
                <p class="text-sm text-encre-douce">{offre.montant}{offre.logement ? ` · ${offre.logement}` : ""}</p>
              </div>
              <span class="ui-etiquette">{offre.statut}</span>
            </div>
            {#if offre.notes}<p class="mt-2 text-sm text-encre-douce">{offre.notes}</p>{/if}
            {#if offre.transitions.length > 0}
              <div class="mt-3 flex flex-wrap gap-2">
                {#each offre.transitions as statut (statut)}
                  <form method="POST" action="?/statutOffre">
                    <input type="hidden" name="offreId" value={offre.id} />
                    <input type="hidden" name="statut" value={statut} />
                    <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">{libellesOffre[statut] ?? statut}</button>
                  </form>
                {/each}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>
