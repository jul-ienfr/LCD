<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const LIBELLES_ACTION: Record<string, string> = {
    publier: "Avis publié.",
    masquer: "Avis masqué.",
    repondre: "Réponse enregistrée.",
  };
</script>

<svelte:head>
  <title>Avis voyageurs — LCD Parc</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        Qualité et transparence
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">Avis voyageurs</h1>
      <p class="text-encre-douce">
        Publiez les avis reçus, répondez publiquement ou masquez un contenu
        abusif avec un motif. Un avis négatif n'est jamais masqué pour son seul
        contenu.
      </p>
    </div>
    <a class="ui-lien-action text-sm" href="/hote">← Tableau de bord</a>
  </header>

  <nav class="flex flex-wrap gap-2" aria-label="Filtrer par statut">
    <a
      class="ui-bouton ui-bouton--petit {data.statut === '' ? 'ui-bouton--primaire' : 'ui-bouton--secondaire'}"
      href="/hote/avis-voyageur"
      aria-current={data.statut === "" ? "page" : undefined}
    >
      Tous
    </a>
    {#each data.statuts as statut (statut)}
      <a
        class="ui-bouton ui-bouton--petit {data.statut === statut ? 'ui-bouton--primaire' : 'ui-bouton--secondaire'}"
        href="/hote/avis-voyageur?statut={statut}"
        aria-current={data.statut === statut ? "page" : undefined}
      >
        {data.libellesStatut[statut]}
      </a>
    {/each}
  </nav>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {LIBELLES_ACTION[data.ok] ?? "Avis mis à jour."}
    </p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">{data.erreur}</p>
  {/if}

  {#if data.avis.length === 0}
    <section class="ui-carte py-8 text-center text-encre-douce">
      Aucun avis{data.statut ? ` au statut « ${data.libellesStatut[data.statut]} »` : ""}.
    </section>
  {:else}
    <div class="space-y-4">
      {#each data.avis as avis (avis.id)}
        <section class="ui-carte space-y-4">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div class="space-y-1">
              <h2 class="text-lg font-semibold">
                {avis.logement}
                <span class="ml-2 text-sm font-normal text-encre-faine">{avis.ref}</span>
              </h2>
              <p class="text-sm text-encre-douce">
                Invité le {avis.inviteLe}
                {#if avis.recuLe}· Reçu le {avis.recuLe}{/if}
                {#if avis.publieLe}· Publié le {avis.publieLe}{/if}
              </p>
            </div>
            <div class="text-right">
              {#if avis.note}
                <p class="text-lg" aria-label={`Note ${avis.note} sur 5`}>
                  {"★".repeat(avis.note)}<span class="text-encre-faine"
                    >{"★".repeat(5 - avis.note)}</span
                  >
                </p>
              {/if}
              <p class="text-sm text-encre-faine">{data.libellesStatut[avis.statut]}</p>
            </div>
          </div>

          {#if avis.commentaire}
            <p class="rounded bg-fond/50 p-3 text-sm text-encre-douce">
              {avis.commentaire}
            </p>
          {/if}

          {#if avis.reponseHote}
            <p class="rounded bg-surface2 p-3 text-sm text-encre-douce">
              <strong>Réponse de l'hôte :</strong> {avis.reponseHote}
            </p>
          {/if}

          {#if avis.statut === "recu"}
            <form method="POST" action="?/moderer" class="border-t border-bordure pt-4">
              <input type="hidden" name="id" value={avis.id} />
              <button
                class="ui-bouton ui-bouton--primaire ui-bouton--petit"
                type="submit"
                name="action"
                value="publier"
              >
                Publier cet avis
              </button>
            </form>
          {/if}

          {#if avis.statut === "publie"}
            <div class="grid gap-4 border-t border-bordure pt-4 sm:grid-cols-2">
              <form method="POST" action="?/moderer" class="space-y-2">
                <input type="hidden" name="id" value={avis.id} />
                <label class="ui-champ-groupe">
                  <span class="ui-label">Répondre publiquement</span>
                  <textarea
                    class="ui-champ min-h-20"
                    name="reponse"
                    maxlength="2000"
                    required
                  ></textarea>
                </label>
                <button
                  class="ui-bouton ui-bouton--secondaire ui-bouton--petit"
                  type="submit"
                  name="action"
                  value="repondre"
                >
                  Enregistrer la réponse
                </button>
              </form>

              <form method="POST" action="?/moderer" class="space-y-2">
                <input type="hidden" name="id" value={avis.id} />
                <label class="ui-champ-groupe">
                  <span class="ui-label">Masquer (motif obligatoire, 10 caractères min.)</span>
                  <input
                    class="ui-champ"
                    name="motif"
                    minlength="10"
                    maxlength="2000"
                    required
                  />
                </label>
                <button
                  class="ui-bouton ui-bouton--danger ui-bouton--petit"
                  type="submit"
                  name="action"
                  value="masquer"
                >
                  Masquer l'avis
                </button>
              </form>
            </div>
          {/if}
        </section>
      {/each}
    </div>
  {/if}

  <a class="ui-lien-action text-sm" href="/hote">← Retour au tableau de bord</a>
</main>
