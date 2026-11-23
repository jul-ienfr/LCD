<script lang="ts">
  import { page } from "$app/state";

  interface Props {
    /** Nom de la surface affiché en surtitre (« Espace prestataire », …). */
    surface: string;
    /** Destination du bouton principal (l’accueil de la surface). */
    accueil?: string;
    accueilLibelle?: string;
  }

  let {
    surface,
    accueil = "/",
    accueilLibelle = "Retour à l’accueil",
  }: Props = $props();

  const statut = $derived(page.status);
  const requestId = $derived(
    typeof page.error?.requestId === "string" ? page.error.requestId : null,
  );

  const titre = $derived(
    statut === 403
      ? "Vous n’avez pas accès à cette page."
      : statut === 404
        ? "Cette page n’existe pas."
        : statut >= 500
          ? "Une erreur inattendue est survenue."
          : (page.error?.message ?? "La demande n’a pas abouti."),
  );

  const explication = $derived(
    statut === 403
      ? "Votre rôle ne permet pas cette action. Demandez à un administrateur si vous pensez qu’il s’agit d’une erreur."
      : statut === 404
        ? "Vérifiez l’adresse, ou revenez à votre espace."
        : statut >= 500
          ? "L’incident a été enregistré automatiquement. Vos données n’ont pas été modifiées."
          : "Réessayez dans un instant ; si le problème persiste, communiquez la référence au support.",
  );
</script>

<svelte:head>
  <title>{statut} — {surface}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<main
  id="contenu"
  class="mx-auto flex min-h-[60vh] max-w-2xl flex-col justify-center gap-6 px-6 py-16"
>
  <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
    {surface} · erreur {statut}
  </p>
  <h1 class="text-3xl font-semibold tracking-tight">{titre}</h1>
  <p class="text-encre-douce">{explication}</p>
  {#if requestId}
    <p class="rounded-carte border border-bordure bg-surface px-4 py-3 text-sm">
      Référence : <code>{requestId}</code>
    </p>
  {/if}
  <div class="flex flex-wrap gap-3">
    <a class="ui-bouton ui-bouton--primaire" href={accueil}>{accueilLibelle}</a>
    <a class="ui-bouton ui-bouton--secondaire" href="/aide">Aide</a>
  </div>
</main>
