<script lang="ts">
  import type { PageData } from "./$types";
  import { messageFils } from "@/lib/i18n-fils";

  let { data, form }: { data: PageData; form: { erreur?: string } | null } = $props();

  const t = $derived(data.t);
</script>

<svelte:head>
  <title>{t.titreAutomatisations}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <nav class="text-sm"><a class="ui-lien-action" href="/hote/messages/fils">← {t.titre}</a></nav>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titreAutomatisations}</h1>
    <p class="max-w-3xl text-encre-douce">{t.descriptionAutomatisations}</p>
    <p class="text-sm text-encre-faine">{t.variables}</p>
  </header>

  {#if data.ok}<p class="ui-alerte ui-alerte--succes" role="status">{messageFils(t, data.ok)}</p>{/if}
  {#if data.erreur}<p class="ui-alerte ui-alerte--danger" role="alert">{data.erreur}</p>{/if}
  {#if form?.erreur}<p class="ui-alerte ui-alerte--danger" role="alert">{form.erreur}</p>{/if}

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">{t.automatisations} ({data.automatisations.length})</h2>
    {#if data.automatisations.length === 0}
      <p class="text-encre-douce">{t.creerDepuisDefaut}</p>
    {/if}
    {#each data.automatisations as automatisation (automatisation.id)}
      <article class="space-y-3 border-t border-bordure pt-4">
        <header class="flex flex-wrap items-center justify-between gap-2">
          <p class="font-semibold">
            {automatisation.libelle}
            <span class="ui-etiquette-ui">{automatisation.declencheurLibelle}</span>
            <span class="ui-etiquette-ui">{automatisation.actif ? t.actif : t.desactiver}</span>
          </p>
          <div class="flex gap-2">
            <form method="POST" action="?/basculer">
              <input type="hidden" name="id" value={automatisation.id} />
              <input type="hidden" name="actif" value={automatisation.actif ? "false" : "true"} />
              <button class="ui-bouton ui-bouton--fantome" type="submit">
                {automatisation.actif ? t.desactiver : t.activer}
              </button>
            </form>
            <form method="POST" action="?/supprimer">
              <input type="hidden" name="id" value={automatisation.id} />
              <button class="ui-bouton ui-bouton--fantome" type="submit">{t.supprimer}</button>
            </form>
          </div>
        </header>
        <form method="POST" action="?/modifier" class="space-y-3">
          <input type="hidden" name="id" value={automatisation.id} />
          <p class="ui-label">{t.declencheur} : {automatisation.declencheurLibelle}</p>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.sujet}</span>
            <input class="ui-champ" type="text" name="sujet" value={automatisation.sujet ?? ""} />
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.modele}</span>
            <textarea class="ui-champ" name="modele" rows="7">{automatisation.modele}</textarea>
          </label>
          <button class="ui-bouton" type="submit">{t.okModifie}</button>
        </form>
      </article>
    {/each}
  </section>

  <section class="ui-carte space-y-4">
    <h2 class="text-xl font-semibold">{t.creerDepuisDefaut}</h2>
    <ul class="space-y-3">
      {#each data.defauts as defaut (defaut.code)}
        <li class="flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-3 first:border-0 first:pt-0">
          <div>
            <p class="font-medium">{defaut.libelle}</p>
            <p class="text-sm text-encre-faine">
              {defaut.code} · {defaut.declencheurLibelle}
            </p>
          </div>
          {#if defaut.dejaCree}
            <span class="ui-etiquette-ui">{t.okCree}</span>
          {:else}
            <form method="POST" action="?/creer">
              <input type="hidden" name="code" value={defaut.code} />
              <button class="ui-bouton ui-bouton--fantome" type="submit">{t.creer}</button>
            </form>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
</main>
