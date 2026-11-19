<script lang="ts">
  import { page } from "$app/state";

  const statut = $derived(page.status);
  const requestId = $derived(
    typeof page.error?.requestId === "string" ? page.error.requestId : null,
  );
</script>

<svelte:head>
  <title>{statut} — Espace hôte</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="contenu" class="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-6 px-6 py-16">
  <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
    Espace hôte · erreur {statut}
  </p>
  <h1 class="text-3xl font-semibold tracking-tight">
    {#if statut === 403}
      Vous n’avez pas accès à cette page.
    {:else if statut === 404}
      Cette page de l’espace hôte n’existe pas.
    {:else}
      L’action n’a pas abouti.
    {/if}
  </h1>
  <p class="text-encre-douce">
    {#if statut === 403}
      Votre rôle ne permet pas cette action. Demandez à un administrateur si
      vous pensez qu’il s’agit d’une erreur.
    {:else if statut >= 500}
      L’incident a été enregistré. Vos données n’ont pas été modifiées.
    {:else}
      {page.error?.message ?? "Réessayez ou revenez au tableau de bord."}
    {/if}
  </p>
  {#if requestId}
    <p class="rounded-carte border border-bordure bg-surface px-4 py-3 text-sm">
      Référence : <code>{requestId}</code>
    </p>
  {/if}
  <div class="flex flex-wrap gap-3">
    <a class="ui-bouton ui-bouton--primaire" href="/hote">Tableau de bord</a>
    <a class="ui-bouton ui-bouton--secondaire" href="/aide">Aide</a>
  </div>
</main>
