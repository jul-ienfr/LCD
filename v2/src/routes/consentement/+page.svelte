<script lang="ts">
  import { page } from "$app/state";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  const retour = $derived(page.url.searchParams.get("retour") ?? "/");
</script>

<svelte:head>
  <title>Préférences de suivi — LCD</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="contenu" class="mx-auto max-w-2xl px-4 py-12">
  <p class="text-sm text-encre-douce"><a class="ui-lien-action" href={retour}>← Retour</a></p>
  <h1 class="mt-4 text-2xl font-semibold">Préférences de suivi</h1>
  <p class="mt-3 text-encre-douce">
    Les cookies essentiels (session, sécurité, langue) restent toujours actifs.
    Les deux catégories ci-dessous sont facultatives et révocables à tout
    moment. Refuser est aussi simple qu’accepter : les deux choix ci-dessous
    sont au même niveau, aucun n’est précoché, et « Tout refuser » s’applique
    en un seul clic.
  </p>

  <form method="POST" action="?/enregistrer" class="mt-8 space-y-5">
    <input type="hidden" name="retour" value={retour} />
    <div class="grid gap-3 sm:grid-cols-2">
      <button class="ui-bouton ui-bouton--secondaire" type="submit" formaction="?/refus">
        Tout refuser
      </button>
      <button class="ui-bouton ui-bouton--secondaire" type="submit" formaction="?/tout">
        Tout accepter
      </button>
    </div>
    <label class="flex min-h-11 min-w-11 items-start gap-3 rounded-xl border border-bordure p-4">
      <input
        type="checkbox"
        name="mesure"
        value="1"
        checked={data.consentement?.mesure ?? false}
        class="mt-1"
      />
      <span>
        <strong>Mesure d’audience</strong>
        <span class="block text-sm text-encre-douce">
          Pages vues, clics, formulaires, provenance et campagnes, via un journal
          first-party et, si configuré, Google Analytics ou Matomo.
        </span>
      </span>
    </label>
    <label class="flex min-h-11 min-w-11 items-start gap-3 rounded-xl border border-bordure p-4">
      <input
        type="checkbox"
        name="publicite"
        value="1"
        checked={data.consentement?.publicite ?? false}
        class="mt-1"
      />
      <span>
        <strong>Publicité et remarketing</strong>
        <span class="block text-sm text-encre-douce">
          Mesure des conversions publicitaires via les pixels du compte
          (Meta, Google Ads, TikTok) configurés par l’hôte. Nécessite la mesure
          d’audience.
        </span>
      </span>
    </label>
    <div class="flex flex-wrap gap-3">
      <button class="ui-bouton" type="submit">Enregistrer mes choix</button>
      <a class="ui-bouton ui-bouton--secondaire" href={retour}>Annuler</a>
    </div>
  </form>

  <p class="mt-8 text-sm text-encre-faine">
    Les identifiants publicitaires ne sont chargés qu’après votre accord. Vous
    pouvez retirer votre accord en décochant les cases ; le journal first-party
    conserve au maximum 13 mois de données pseudonymisées.
  </p>
</main>
