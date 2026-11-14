<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  const messagesErreur: Record<string, string> = {
    logement: "Choisissez un logement actif.",
    dates: "La date de fin doit être postérieure au début.",
    chevauchement: "Ces dates chevauchent une réservation existante.",
    inattendu: "Création impossible pour le moment.",
  };
</script>

<svelte:head>
  <title>Réservation test — LCD</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      Espace hôte · Mise en route
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">Réservation test</h1>
    <p class="text-encre-douce">
      Créez un séjour fictif pour vérifier le guide voyageur, les messages et
      le planning de bout en bout. Il est identifié <code>TEST-…</code> et
      n'entre pas dans votre chiffre d'affaires.
    </p>
    <p class="text-sm">
      <a class="inline-flex min-h-11 items-center underline" href="/hote/onboarding">← Mise en route</a>
    </p>
  </header>

  {#if data.cree}
    <p class="ui-alerte ui-alerte--ok">
      Réservation test {data.cree} créée. Ouvrez son guide ci-dessous.
    </p>
  {/if}
  {#if data.annulee}
    <p class="ui-alerte ui-alerte--ok">Réservation test annulée.</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger">
      {messagesErreur[data.erreur] ?? data.erreur}
    </p>
  {/if}

  <section class="ui-carte space-y-4">
    <h2 class="text-lg font-semibold">1. Choisir le séjour</h2>
    {#if data.logements.length === 0}
      <p class="text-sm text-encre-douce">
        Aucun logement actif. Créez et publiez un logement d'abord.
      </p>
    {:else}
      <form class="space-y-4" method="POST" action="?/creer">
        <label class="block space-y-2">
          <span class="ui-label">Logement</span>
          <select class="ui-champ" name="logementId" required>
            {#each data.logements as logement (logement.id)}
              <option value={logement.id}>{logement.nom}</option>
            {/each}
          </select>
        </label>
        <div class="grid gap-4 sm:grid-cols-2">
          <label class="space-y-2">
            <span class="ui-label">Arrivée</span>
            <input class="ui-champ" name="debut" required type="date" value={data.demain} />
          </label>
          <label class="space-y-2">
            <span class="ui-label">Départ</span>
            <input class="ui-champ" name="fin" required type="date" value={data.surlendemain} />
          </label>
        </div>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          Créer la réservation test
        </button>
      </form>
    {/if}
  </section>

  <section class="space-y-3">
    <h2 class="text-lg font-semibold">2. Vérifier le parcours</h2>
    <p class="text-sm text-encre-douce">
      Ouvrez le guide signé : il doit afficher le logement, le code d'accès
      éventuel et permettre de déposer une demande.
    </p>
    {#if data.tests.length === 0}
      <p class="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
        Aucune réservation test pour le moment.
      </p>
    {:else}
      <ul class="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
        {#each data.tests as test (test.id)}
          <li class="space-y-2 p-4">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p class="font-medium">
                  {test.ref} · {test.logement}
                </p>
                <p class="text-xs text-encre-faine">
                  {test.debut} → {test.fin} · {test.statut}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                {#if test.lienGuide}
                  <a class="ui-bouton ui-bouton--secondaire ui-bouton--petit" href={test.lienGuide}>
                    Ouvrir le guide
                  </a>
                {/if}
                {#if test.statut !== "annulee"}
                  <form method="POST" action="?/annuler">
                    <input name="reservationId" type="hidden" value={test.id} />
                    <button class="ui-bouton ui-bouton--danger ui-bouton--petit" type="submit">
                      Annuler
                    </button>
                  </form>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>

  <section class="ui-carte space-y-2">
    <h2 class="text-lg font-semibold">3. Nettoyer</h2>
    <p class="text-sm text-encre-douce">
      Annulez le séjour test une fois le parcours validé. Les données restent
      consultables dans l'historique avec la source <code>test</code>.
    </p>
  </section>
</main>
