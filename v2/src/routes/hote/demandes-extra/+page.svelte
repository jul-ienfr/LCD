<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const erreur = $derived((form as { erreur?: string } | null)?.erreur ?? data.erreur);

  function formatDateHeure(iso: string | null): string {
    if (!iso) return "—";
    return iso;
  }
</script>

<svelte:head>
  <title>Demandes d'extras — LCD Parc</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Gestion des extras
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">Demandes d'extras</h1>
      <p class="text-encre-douce">
        Validez ou refusez les demandes de départ tardif, arrivée anticipée, lit bébé, etc.
      </p>
    </div>
    <a class="ui-lien-action text-sm" href="/hote">← Tableau de bord</a>
  </header>

  <!-- Filtres par statut -->
  <nav class="flex flex-wrap gap-2" aria-label="Filtrer par statut">
    <a
      class="ui-bouton ui-bouton--petit {data.statut === '' ? 'ui-bouton--primaire' : 'ui-bouton--secondaire'}"
      href="/hote/demandes-extra"
      aria-current={data.statut === "" ? "page" : undefined}
    >
      Toutes
    </a>
    {#each data.statuts as statut (statut)}
      <a
        class="ui-bouton ui-bouton--petit {data.statut === statut ? 'ui-bouton--primaire' : 'ui-bouton--secondaire'}"
        href="/hote/demandes-extra?statut={statut}"
        aria-current={data.statut === statut ? "page" : undefined}
      >
        {data.libellesStatut[statut]}
      </a>
    {/each}
  </nav>

  <!-- Messages de résultat -->
  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok" role="status">
      Demande mise à jour : {data.libellesStatut[data.ok] ?? data.ok}.
    </p>
  {/if}
  {#if erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {#if erreur === "decision-invalide"}
        Décision invalide.
      {:else if erreur === "demande-introuvable"}
        Demande introuvable.
      {:else if erreur === "echec-persistance"}
        Échec de l'enregistrement.
      {:else if erreur === "demande"}
        Erreur inattendue. Réessayez.
      {:else}
        {erreur}
      {/if}
    </p>
  {/if}

  <!-- Liste des demandes -->
  {#if data.demandes.length === 0}
    <section class="ui-carte py-8 text-center text-encre-douce">
      Aucune demande d'extra{data.statut ? ` au statut « ${data.libellesStatut[data.statut]} »` : ""}.
    </section>
  {:else}
    <div class="space-y-4">
      {#each data.demandes as demande (demande.id)}
        <section class="ui-carte space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-1">
              <h2 class="text-lg font-semibold">
                {demande.libelleType}
                <span class="ml-2 text-sm font-normal text-encre-faine">{demande.ref}</span>
              </h2>
              <p class="text-sm text-encre-douce">
                Créée le {formatDateHeure(demande.creeLe)}
                {#if demande.decideeLe}
                  · Décidée le {formatDateHeure(demande.decideeLe)} par {demande.decideePar}
                {/if}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xl font-bold">{demande.prixFormatte}</p>
              <p class="text-sm text-encre-faine">{data.libellesStatut[demande.statut]}</p>
            </div>
          </div>

          {#if demande.message}
            <p class="rounded bg-fond/50 p-3 text-sm text-encre-douce">
              {demande.message}
            </p>
          {/if}

          {#if demande.motifRefus}
            <p class="rounded bg-danger/10 p-3 text-sm text-danger">
              Motif du refus : {demande.motifRefus}
            </p>
          {/if}

          <!-- Actions de décision (uniquement pour les demandes en attente) -->
          {#if demande.statut === "demande"}
            <form method="POST" action="?/decider" class="flex flex-wrap items-end gap-4 border-t border-bordure pt-4">
              <input type="hidden" name="id" value={demande.id} />

              <label class="ui-champ-groupe flex-1">
                <span class="ui-label">Motif de refus (obligatoire si refus)</span>
                <input
                  class="ui-champ"
                  name="motifRefus"
                  placeholder="Ex : Impossible ce jour-là, logement complet…"
                  minlength="10"
                />
              </label>

              <!-- Le nom/valeur est porté par le bouton cliqué : un seul
                   `decision` est soumis, sans JavaScript (règle 1). -->
              <div class="flex gap-2">
                <button
                  class="ui-bouton ui-bouton--primaire ui-bouton--petit"
                  type="submit"
                  name="decision"
                  value="validee"
                >
                  ✓ Valider
                </button>
                <button
                  class="ui-bouton ui-bouton--danger ui-bouton--petit"
                  type="submit"
                  name="decision"
                  value="refusee"
                >
                  ✗ Refuser
                </button>
              </div>
            </form>
          {/if}
        </section>
      {/each}
    </div>
  {/if}

  <a class="ui-lien-action text-sm" href="/hote">← Retour au tableau de bord</a>
</main>
