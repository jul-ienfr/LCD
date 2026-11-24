<script lang="ts">
  import type { PageData } from "./$types";
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";
  import { traductionsNavigation } from "@/lib/i18n-nav";

  let { data }: { data: PageData } = $props();
  const tNav = $derived(traductionsNavigation(data.langue));

  const dateCourte = (iso: string) =>
    new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
</script>

<svelte:head>
  <title>Mesure d’audience et publicité — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Espace hôte
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">
      Mesure d’audience et publicité
    </h1>
    <p class="text-encre-douce">
      Activez le journal first-party et, si vous le souhaitez, vos comptes
      Google Analytics, Matomo, Plausible, Meta, Google Ads ou TikTok. Aucun
      traceur n’est chargé avant le consentement explicite du visiteur.
    </p>
    <p class="text-sm">
      <a class="inline-flex min-h-11 items-center underline" href="/hote/integrations">← Intégrations</a>
    </p>
  </header>

  {#if data.ok}
    <p role="status" class="ui-alerte ui-alerte--ok">
      {data.ok === "1"
        ? "Configuration enregistrée."
        : `${data.ok} événement(s) purgé(s).`}
    </p>
  {/if}
  {#if data.erreur}
    <p role="alert" class="ui-alerte ui-alerte--danger">{data.erreur}</p>
  {/if}

  <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <article class="ui-carte">
      <p class="text-sm text-encre-douce">Visiteurs (30 j)</p>
      <p class="text-2xl font-semibold">{data.resume.visiteurs}</p>
    </article>
    <article class="ui-carte">
      <p class="text-sm text-encre-douce">Événements (30 j)</p>
      <p class="text-2xl font-semibold">{data.resume.total}</p>
    </article>
    <article class="ui-carte">
      <p class="text-sm text-encre-douce">Conversions (30 j)</p>
      <p class="text-2xl font-semibold">{data.resume.conversions}</p>
    </article>
    <article class="ui-carte">
      <p class="text-sm text-encre-douce">Revenu attribué</p>
      <p class="text-2xl font-semibold">
        {(data.resume.revenuCentimes / 100).toLocaleString("fr-FR", {
          style: "currency",
          currency: "EUR",
        })}
      </p>
    </article>
  </section>

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">Configuration</h2>
      <p class="mt-1 text-sm text-encre-douce">
        Laissez vide un identifiant pour ne pas charger le fournisseur
        correspondant. Les identifiants sont propres à ce tenant.
      </p>
    </div>
    <form method="POST" action="?/enregistrer" class="space-y-6">
      <label class="flex min-h-11 min-w-11 items-center gap-3">
        <input
          type="checkbox"
          name="actif"
          value="1"
          checked={data.configuration.actif}
        />
        <span class="font-medium">Activer le suivi sur le site public</span>
      </label>

      <fieldset class="space-y-4">
        <legend class="font-semibold">Mesure d’audience</legend>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="ui-label">Google Analytics 4</span>
            <input
              class="ui-champ"
              name="ga4Id"
              placeholder="G-XXXXXXXXXX"
              value={data.configuration.mesure.ga4Id ?? ""}
            />
          </label>
          <label class="space-y-2">
            <span class="ui-label">Plausible (domaine)</span>
            <input
              class="ui-champ"
              name="plausibleDomain"
              placeholder="sejour.example.fr"
              value={data.configuration.mesure.plausibleDomain ?? ""}
            />
          </label>
          <label class="space-y-2">
            <span class="ui-label">Matomo (URL)</span>
            <input
              class="ui-champ"
              name="matomoUrl"
              placeholder="https://matomo.example.fr"
              value={data.configuration.mesure.matomoUrl ?? ""}
            />
          </label>
          <label class="space-y-2">
            <span class="ui-label">Matomo (site ID)</span>
            <input
              class="ui-champ"
              name="matomoSiteId"
              placeholder="1"
              value={data.configuration.mesure.matomoSiteId ?? ""}
            />
          </label>
        </div>
      </fieldset>

      <fieldset class="space-y-4">
        <legend class="font-semibold">Publicité et remarketing</legend>
        <p class="text-sm text-encre-douce">
          Ces pixels ne sont chargés que si le visiteur accepte à la fois la
          mesure d’audience et la publicité.
        </p>
        <div class="grid gap-4 sm:grid-cols-3">
          <label class="space-y-2">
            <span class="ui-label">Meta Pixel</span>
            <input
              class="ui-champ"
              name="metaPixelId"
              placeholder="123456789012345"
              value={data.configuration.publicite.metaPixelId ?? ""}
            />
          </label>
          <label class="space-y-2">
            <span class="ui-label">Google Ads</span>
            <input
              class="ui-champ"
              name="googleAdsId"
              placeholder="AW-123456789"
              value={data.configuration.publicite.googleAdsId ?? ""}
            />
          </label>
          <label class="space-y-2">
            <span class="ui-label">TikTok Pixel</span>
            <input
              class="ui-champ"
              name="tiktokPixelId"
              placeholder="ABCDEF123456"
              value={data.configuration.publicite.tiktokPixelId ?? ""}
            />
          </label>
        </div>
      </fieldset>

      <button class="ui-bouton" type="submit">Enregistrer</button>
    </form>
  </section>

  <section class="ui-carte space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-semibold">Derniers événements</h2>
        <p class="mt-1 text-sm text-encre-douce">
          100 derniers événements pseudonymisés. L’IP est hachée, jamais
          stockée en clair.
        </p>
      </div>
      <ConfirmationAction
        langue={data.langue}
        action="purger"
        cible="purger"
        libelle="Purger au-delà de 13 mois"
        classe="ui-bouton ui-bouton--secondaire ui-bouton--petit"
      />
    </div>
    {#if data.evenements.length === 0}
      <p class="text-sm text-encre-faine">Aucun événement enregistré.</p>
    {:else}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <div role="region" tabindex="0" aria-label={tNav.tableauDefilant}  class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="border-b border-bordure text-encre-faine">
            <tr>
              <th class="py-2 pr-4">Date</th>
              <th class="py-2 pr-4">Type</th>
              <th class="py-2 pr-4">Nom</th>
              <th class="py-2 pr-4">Page</th>
              <th class="py-2 pr-4">Campagne</th>
              <th class="py-2">Valeur</th>
            </tr>
          </thead>
          <tbody>
            {#each data.evenements as evenement (evenement.id)}
              <tr class="border-b border-bordure/60">
                <td class="whitespace-nowrap py-2 pr-4">
                  {dateCourte(evenement.creeLe)}
                </td>
                <td class="py-2 pr-4">{evenement.type}</td>
                <td class="py-2 pr-4">{evenement.nom}</td>
                <td class="max-w-48 truncate py-2 pr-4">{evenement.page}</td>
                <td class="py-2 pr-4">
                  {evenement.campagne.campagne ??
                    evenement.campagne.source ??
                    "—"}
                </td>
                <td class="py-2">
                  {evenement.valeurCentimes === null
                    ? "—"
                    : (evenement.valeurCentimes / 100).toLocaleString(
                        "fr-FR",
                        { style: "currency", currency: "EUR" },
                      )}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</main>
