<script lang="ts">
  import { page } from "$app/state";

  const statut = $derived(page.status);
  const requestId = $derived(
    typeof page.error?.requestId === "string" ? page.error.requestId : null,
  );
</script>

<svelte:head>
  <title>{statut} — LCD</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="contenu" class="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-16">
  <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
    Erreur {statut}
  </p>
  <h1 class="text-3xl font-semibold tracking-tight">
    {#if statut === 404}
      Cette page n’existe pas ou a été déplacée.
    {:else if statut >= 500}
      Une erreur inattendue est survenue.
    {:else}
      {page.error?.message ?? "La demande n’a pas abouti."}
    {/if}
  </h1>
  <p class="text-encre-douce">
    {#if statut === 404}
      Vérifiez l’adresse, ou revenez à l’accueil.
    {:else if statut >= 500}
      L’incident a été enregistré automatiquement. Vous pouvez réessayer dans
      un instant ; si le problème persiste, communiquez la référence ci-dessous
      au support.
    {:else}
      {page.error?.message ?? ""}
    {/if}
  </p>
  {#if requestId}
    <p class="rounded-carte border border-bordure bg-surface px-4 py-3 text-sm">
      Référence : <code>{requestId}</code>
    </p>
  {/if}
  <div class="flex flex-wrap gap-3">
    <a class="ui-bouton ui-bouton--primaire" href="/">Retour à l’accueil</a>
    <a class="ui-bouton ui-bouton--secondaire" href="/aide">Aide</a>
  </div>
</main>
