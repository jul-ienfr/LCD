<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const notes = [5, 4, 3, 2, 1];
  const erreur = $derived(
    (form as { erreur?: string } | null)?.erreur ?? data.erreur,
  );
</script>

<svelte:head>
  <title>Votre avis — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-xl space-y-8 px-6 py-12">
  {#if data.indisponible}
    <section class="ui-carte space-y-3 text-center">
      <h1 class="text-2xl font-semibold tracking-tight">Lien indisponible</h1>
      <p class="text-encre-douce">
        {#if data.indisponible === "invalide"}
          Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.
        {:else}
          Ce lien ne correspond plus à une réservation en cours.
        {/if}
      </p>
    </section>
  {:else}
    <header class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Votre séjour
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        Votre avis sur {data.logementNom ?? "votre séjour"}
      </h1>
      <p class="text-encre-douce">
        Merci {data.voyageur}. Votre retour aide les prochains voyageurs et nous
        permet de progresser.
      </p>
    </header>

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok" role="status">
        Merci, votre avis a bien été enregistré.
      </p>
    {/if}
    {#if erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {#if erreur === "avis"}
          Une erreur est survenue. Réessayez.
        {:else}
          {erreur}
        {/if}
      </p>
    {/if}

    {#if data.dejaDepose}
      <section class="ui-carte space-y-3">
        <h2 class="text-lg font-semibold">Avis déjà déposé</h2>
        <p class="text-sm text-encre-douce">
          Vous avez déjà partagé votre avis pour ce séjour.
        </p>
        {#if data.note}
          <p class="font-medium" aria-label={`Note ${data.note} sur 5`}>
            {"★".repeat(data.note)}<span class="text-encre-faine"
              >{"★".repeat(5 - data.note)}</span
            >
          </p>
        {/if}
        {#if data.commentaire}
          <p class="whitespace-pre-line text-sm text-encre-douce">
            {data.commentaire}
          </p>
        {/if}
      </section>
    {:else}
      <form method="POST" action="?/deposer" class="ui-carte space-y-4">
        <label class="ui-champ-groupe">
          <span class="ui-label">Votre note</span>
          <select class="ui-champ" name="note" required>
            {#each notes as note (note)}
              <option value={note}>{note} / 5</option>
            {/each}
          </select>
        </label>

        <label class="ui-champ-groupe">
          <span class="ui-label">Votre commentaire (facultatif)</span>
          <textarea
            class="ui-champ min-h-32"
            name="commentaire"
            maxlength="2000"
            placeholder="Ce qui vous a plu, ce qui pourrait être amélioré…"
          ></textarea>
        </label>

        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Envoyer mon avis
        </button>
      </form>
    {/if}
  {/if}
</main>
