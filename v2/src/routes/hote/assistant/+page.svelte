<script lang="ts">
  import PageEntete from "@/lib/components/ui/page-entete.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.aTitrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <PageEntete
    surtitre={data.t.aSurtitre}
    titre={data.t.aTitre}
    description={data.t.aDescription}
  />

  <section class="grid gap-3 rounded-2xl border border-bordure bg-surface p-5 shadow-sm sm:grid-cols-2">
    <div>
      <p class="text-sm text-encre-faine">{data.t.aBrouillonsMois}</p>
      <p class="mt-1 text-xl font-semibold">{data.consommation.nombre} / {data.consommation.quota}</p>
    </div>
    <div>
      <p class="text-sm text-encre-faine">{data.t.aCoutMois}</p>
      <p class="mt-1 text-xl font-semibold">{data.consommation.cout} / {data.consommation.budget}</p>
    </div>
    {#if data.quotaAtteint}
      <p class="ui-alerte ui-alerte--alerte sm:col-span-2" role="alert">
        {data.t.aQuotaAtteint}
      </p>
    {/if}
    {#if !data.assistantActif}
      <p class="ui-alerte ui-alerte--danger sm:col-span-2" role="alert">
        {data.t.aDesactive}
      </p>
    {/if}
  </section>

  {#if !data.logement}
    <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
      {data.t.aCreerAide}
    </p>
  {:else}
    {#if data.logements.length > 1}
      <nav aria-label={data.t.aChoisirLogement} class="flex flex-wrap gap-2">
        {#each data.logements as logement (logement.id)}
          <a
            class="rounded-full border px-4 py-2 text-sm {logement.id === data.logement.id ? 'border-accent bg-accent-douce font-semibold text-accent' : 'border-bordure bg-surface'}"
            href={`/hote/assistant?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">{data.erreur}</p>
    {/if}

    <form action="/hote/assistant" class="ui-carte space-y-3" method="GET">
      <input name="logement" type="hidden" value={data.logement.id} />
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="ui-label">{data.t.aIntention}</span>
          <select class="ui-champ" name="intention">
            {#each data.intentions as intention (intention.valeur)}
              <option value={intention.valeur} selected={intention.valeur === data.intention}>{intention.libelle}</option>
            {/each}
          </select>
        </label>
        <label class="space-y-2">
          <span class="ui-label">{data.t.aTon}</span>
          <select class="ui-champ" name="ton">
            {#each data.tons as ton (ton.valeur)}
              <option value={ton.valeur} selected={ton.valeur === data.ton}>{ton.libelle}</option>
            {/each}
          </select>
        </label>
      </div>
      <label class="block space-y-2">
        <span class="ui-label">{data.t.aVoyageur}</span>
        <input class="ui-champ" maxlength="80" name="voyageur" placeholder={data.t.aVoyageurPlaceholder} defaultValue={data.voyageur} />
      </label>
      <label class="block space-y-2">
        <span class="ui-label">{data.t.aDetails}</span>
        <textarea class="ui-champ" maxlength="400" name="details" placeholder={data.t.aDetailsPlaceholder} rows="3" defaultValue={data.details}></textarea>
      </label>
      <div class="flex flex-wrap gap-3">
        <button class="ui-bouton ui-bouton--primaire" type="submit">{data.t.aRediger}</button>
        <button class="ui-bouton ui-bouton--secondaire" name="comparer" type="submit" value="1">{data.t.aComparer}</button>
      </div>
    </form>

    {#if data.cartes.length > 0}
      <section class={data.comparaison ? "grid gap-4 lg:grid-cols-3" : "space-y-4"}>
        {#each data.cartes as carte (carte.ton)}
          <article class="space-y-3 rounded-2xl border border-accent bg-accent-douce p-6">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h2 class="text-lg font-semibold">{data.comparaison ? data.t.aVariante(carte.tonLibelle) : data.t.aBrouillon}</h2>
              <span class="rounded-full bg-surface px-3 py-1 text-xs font-medium">
                {carte.modele} · {carte.cout} · {data.t.aMots(carte.mots, data.maxMots)}
              </span>
            </div>
            <details class="text-xs">
              <summary class="cursor-pointer text-encre-douce">{data.t.aPrompt}</summary>
              <pre class="mt-2 whitespace-pre-wrap rounded-xl border border-bordure bg-surface p-3 font-mono text-xs text-encre-douce">{carte.invite}</pre>
            </details>
            {#if carte.alertes.length > 0}
              <ul class="rounded-xl border border-alerte bg-alerte-douce p-3 text-sm text-alerte" role="alert">
                {#each carte.alertes as alerte (alerte)}
                  <li>{alerte}</li>
                {/each}
              </ul>
            {/if}
            <p class="whitespace-pre-line text-sm text-encre">{carte.texte}</p>
            <form class="flex flex-wrap items-end gap-3 border-t border-accent/30 pt-3" method="POST" action="?/enregistrer">
              <input name="logementId" type="hidden" value={data.logement.id} />
              <input name="intention" type="hidden" value={data.intention} />
              <input name="ton" type="hidden" value={carte.ton} />
              <input name="voyageur" type="hidden" value={data.voyageur} />
              <input name="details" type="hidden" value={data.details} />
              <input name="texte" type="hidden" value={carte.texte} />
              <label class="space-y-1 text-sm font-medium">
                <span class="ui-label">{data.t.aCanal}</span>
                <select class="ui-champ text-sm" name="canal">
                  <option value="email">E-mail</option>
                  <option value="sms">SMS</option>
                </select>
              </label>
              <label class="space-y-1 text-sm">
                <span class="ui-label">{data.t.aEmailVoyageur}</span>
                <input autocomplete="email" class="ui-champ text-sm" inputmode="email" name="destinataire" placeholder="camille@example.com" type="text" />
              </label>
              <label class="space-y-1 text-sm">
                <span class="ui-label">{data.t.aTelephone}</span>
                <input class="ui-champ text-sm" inputmode="tel" maxlength="30" name="telephone" placeholder="+33 6 12 34 56 78" type="text" />
              </label>
              <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">{data.t.aEnregistrerMessages}</button>
            </form>
          </article>
        {/each}
      </section>
    {/if}
  {/if}

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href="/hote/messages">{data.t.aMessagesVoyageurs}</a>
    <a class="ui-lien" href="/hote/phrases">{data.t.aPhrasesTypes}</a>
  </nav>
</main>
