<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsIntegrations } from "@/lib/i18n-integrations";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsIntegrations(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espace}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
    <p class="text-encre-douce">{t.description}</p>
  </header>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok">
      {data.ok === "supprime" ? t.okSupprime : t.okEnregistre(data.libelle)}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
    </p>
  {/if}

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">{t.ajouter}</h2>
      <p class="mt-1 text-sm text-encre-douce">{t.aideAjout}</p>
    </div>
    <form class="space-y-4" method="POST" action="?/creer">
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="space-y-2">
          <span class="ui-label">{t.libelle}</span>
          <input class="ui-champ" name="libelle" placeholder="Home Assistant" required />
        </label>
        <label class="space-y-2">
          <span class="ui-label">{t.urlHttps}</span>
          <input class="ui-champ" name="url" placeholder="https://ha.example.com/api/webhook/lcd" required type="url" />
        </label>
      </div>
      <label class="block space-y-2">
        <span class="ui-label">{t.secret}</span>
        <input class="ui-champ font-mono text-xs" minlength="16" name="secret" required defaultValue={data.secretDefaut} />
        <span class="block text-xs text-encre-faine">
          {t.secretAide}
        </span>
      </label>
      <fieldset class="space-y-2">
        <legend class="text-sm font-medium">{t.evenements}</legend>
        <div class="grid gap-2 sm:grid-cols-2">
          {#each data.evenements as evenement (evenement.id)}
            <label class="flex items-center gap-2 rounded-xl border border-bordure p-3 text-sm">
              <input defaultChecked={evenement.coche} name="events" type="checkbox" value={evenement.id} />
              <span>{t.evenementsLabels[evenement.id] ?? evenement.id}</span>
              <code class="ml-auto text-xs text-encre-faine">{evenement.id}</code>
            </label>
          {/each}
        </div>
      </fieldset>
      <button class="ui-bouton ui-bouton--primaire" type="submit">{t.enregistrer}</button>
    </form>
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.webhooks(data.webhooks.length)}</h2>
    {#if data.webhooks.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucunWebhook}
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.webhooks as webhook (webhook.id)}
          <li class="p-4">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-medium">{webhook.libelle}</p>
                <p class="truncate text-xs text-encre-faine">{webhook.url}</p>
                <p class="mt-1 text-xs text-encre-faine">
                  {webhook.events
                    .map((evenement) => t.evenementsLabels[evenement] ?? evenement)
                    .join(" · ")}
                </p>
                <p class="mt-1 break-all font-mono text-xs text-encre-faine">
                  {t.secretLabel} : {webhook.secret}
                </p>
              </div>
              <form method="POST" action="?/supprimer">
                <input name="webhookId" type="hidden" value={webhook.id} />
                <button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">{t.supprimer}</button>
              </form>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">{t.livraisons}</h2>
    {#if data.livraisons.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        {t.aucuneLivraison}
      </p>
    {:else}
      <div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table class="ui-tableau min-w-[640px]">
          <thead>
            <tr>
              <th>{t.date}</th>
              <th>{t.evenement}</th>
              <th>{t.statut}</th>
              <th>{t.essais}</th>
              <th>{t.detail}</th>
            </tr>
          </thead>
          <tbody>
            {#each data.livraisons as livraison (livraison.id)}
              <tr>
                <td class="tabular-nums">{livraison.date}</td>
                <td>{t.evenementsLabels[livraison.evenement] ?? livraison.evenement}</td>
                <td>{t.statuts[livraison.statut] ?? livraison.statut}</td>
                <td>{livraison.tentatives}</td>
                <td class="text-xs text-encre-faine">{livraison.detail}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</main>
