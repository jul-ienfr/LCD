<script lang="ts">
  import { traductionsExtras } from "@/lib/i18n-extras";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const t = $derived(traductionsExtras(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.surtitre}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
    <p class="text-encre-douce">
      {t.resume(data.extras.length, data.commandes.length)}
    </p>
  </header>

  {#if data.ok === "cree" && data.okNom}
    <p class="ui-alerte ui-alerte--ok">{t.okCree(data.okNom)}</p>
  {:else if data.ok}
    <p class="ui-alerte ui-alerte--ok">{t.okEnregistre}</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "code-existant"
        ? t.erreurCodeExistant
        : data.erreur === "prix"
          ? t.erreurPrix
          : data.erreur}
    </p>
  {/if}

  <section class="ui-carte space-y-5">
    <div class="space-y-1">
      <h2 class="text-lg font-semibold">{t.creerTitre}</h2>
      <p class="text-sm text-encre-douce">{t.creerAide}</p>
    </div>

    <form method="POST" action="?/creer" class="space-y-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="ui-label">{t.code}</span>
          <input class="ui-champ font-mono" name="code" placeholder="petit-dej" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.nom}</span>
          <input class="ui-champ" name="nom" placeholder="Petit déjeuner" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.prix}</span>
          <input class="ui-champ" inputmode="decimal" name="prixEuros" placeholder="12" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.logementFacultatif}</span>
          <select class="ui-champ" name="logementId">
            <option value="">{t.tousLesLogements}</option>
            {#each data.logements as logement (logement.id)}
              <option value={logement.id}>{logement.nom} ({logement.code})</option>
            {/each}
          </select>
        </label>
      </div>
      <label class="block space-y-2">
        <span class="ui-label">{t.descriptionFacultatif}</span>
        <textarea class="ui-champ min-h-20" name="description"></textarea>
      </label>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.creer}</button>
    </form>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.catalogue}</h2>
    {#if data.extras.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucunExtra}
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.extras as extra (extra.id)}
          <li class="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p class="font-medium">
                {extra.nom}
                <span class="font-mono text-xs text-encre-faine">{extra.code}</span>
              </p>
              {#if extra.description}
                <p class="text-sm text-encre-douce">{extra.description}</p>
              {/if}
              <p class="text-xs text-encre-faine">{extra.logement ?? t.tousLesLogements}</p>
            </div>
            <div class="text-right">
              <p class="font-medium">{extra.prix}</p>
              <p class="text-xs text-encre-faine">{extra.actif ? t.actif : t.inactif}</p>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.commandes}</h2>
    {#if data.commandes.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucuneCommande}
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.commandes as commande (commande.id)}
          <li class="space-y-2 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <p class="font-medium">{commande.extra} × {commande.quantite}</p>
              <span class="ui-badge">{t.statuts[commande.statut] ?? commande.statut}</span>
            </div>
            <p class="text-sm text-encre-douce">
              {commande.ref} · {commande.reservation} · {commande.total}
            </p>
            {#if commande.transitions.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each commande.transitions as statut (statut)}
                  <form method="POST" action="?/statut">
                    <input name="commandeId" type="hidden" value={commande.id} />
                    <input name="statut" type="hidden" value={statut} />
                    <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                      {t.statuts[statut] ?? statut}
                    </button>
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
