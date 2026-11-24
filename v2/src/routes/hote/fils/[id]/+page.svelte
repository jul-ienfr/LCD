<script lang="ts">
  import { traductionsDetails } from "@/lib/i18n-details";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsDetails((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.fTitrePage(data.fil.sujet)}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="space-y-3">
    <p class="text-sm text-encre-faine">
      <a class="ui-lien-action" href="/hote/fils">{t.fTousFils}</a> ·
      {data.fil.canalLibelle}
    </p>
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">{data.fil.sujet}</h1>
        <p class="mt-1 text-sm text-encre-douce">
          {data.fil.logementNom ?? t.fSansLogement} · {t.fOuvertPar(data.fil.creePar, data.fil.createdAt.toLocaleString(data.langue))}
        </p>
      </div>
      {#if data.fil.statut === "ouvert"}
        <span class="ui-badge ui-badge--accent">{t.fOuvert}</span>
      {:else}
        <span class="ui-badge">{t.fFerme}</span>
      {/if}
    </div>
  </header>

  {#if data.ok === "reponse"}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.fOkReponse}</p>
  {:else if data.ok === "ferme"}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.fOkFerme}</p>
  {:else if data.ok === "rouvert"}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.fOkRouvert}</p>
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

  <section class="space-y-3">
    {#if data.fil.messages.length === 0}
      <p class="ui-carte text-sm text-encre-faine">
        {t.fAucunMessage}
      </p>
    {:else}
      <ol class="space-y-3">
        {#each data.fil.messages as message (message.id)}
          <li class="ui-carte space-y-2">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <p class="text-sm font-semibold">
                {message.auteurEmail}
                <span class="font-normal text-encre-faine">
                  ({message.auteurRole})
                </span>
              </p>
              <time class="text-xs text-encre-faine" datetime={message.createdAt.toISOString()}>
                {message.date}
              </time>
            </div>
            <p class="whitespace-pre-wrap text-sm">{message.corps}</p>
          </li>
        {/each}
      </ol>
    {/if}
  </section>

  {#if data.fil.statut === "ouvert"}
    <section class="ui-carte space-y-3">
      <h2 class="text-lg font-semibold">{t.fRepondre}</h2>
      <form method="POST" action="?/repondre" class="space-y-3">
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.fMessage}</span>
          <textarea
            class="ui-champ min-h-28"
            name="corps"
            required
            maxlength={data.messageMax}
            placeholder={t.fPlaceholder}
          ></textarea>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.fEnvoyer}
        </button>
      </form>
    </section>

    <form method="POST" action="?/basculer">
      <input type="hidden" name="statut" value="ferme" />
      <button class="ui-bouton ui-bouton--secondaire" type="submit">
        {t.fCloturer}
      </button>
    </form>
  {:else}
    <section class="space-y-3">
      <p role="status" class="ui-alerte">
        {t.fFermeAide}
      </p>
      <form method="POST" action="?/basculer">
        <input type="hidden" name="statut" value="ouvert" />
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.fRouvrir}
        </button>
      </form>
    </section>
  {/if}

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien-action" href="/hote/fils?canal={data.fil.canal}">
      {t.fTousFilsCanal(data.fil.canalLibelle)}
    </a>
    <a class="ui-lien-action" href="/hote/fils">{t.fTousFils}</a>
  </nav>
</main>
