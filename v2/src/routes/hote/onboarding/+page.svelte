<script lang="ts">
  import { formaterDureeChrono } from "@/domain/chrono-onboarding";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.oTitrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.t.oSurtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.oTitre}</h1>
      <p class="max-w-2xl text-encre-douce">{data.t.oDescription}</p>
      <nav class="flex flex-wrap gap-4 text-sm">
        <a class="inline-flex min-h-11 items-center underline" href="/hote/import">Importer un CSV</a>
        <a class="inline-flex min-h-11 items-center underline" href="/hote/onboarding/reservation-test">Réservation test</a>
        <a class="inline-flex min-h-11 items-center underline" href="/aide">Centre d'aide</a>
      </nav>
    </div>
    <a class="inline-flex min-h-11 items-center text-sm underline" href="/hote">{data.t.retour}</a>
  </header>

  {#if data.copro}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {data.t.coproOk}
    </p>
  {/if}
  {#if data.publication}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {data.t.publicationOk}
    </p>
  {/if}
  {#if data.erreur === "publication"}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {data.t.publicationRefusee}
    </p>
  {:else if data.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {data.erreur === "inattendu"
        ? data.t.erreurInattendue
        : data.erreur}
    </p>
  {/if}

  {#if !data.logement}
    <section class="ui-carte space-y-3 text-center">
      <h2 class="text-lg font-semibold">{data.t.aucunLogement}</h2>
      <p class="text-sm text-encre-douce">{data.t.aucunLogementAide}</p>
      <a class="ui-bouton ui-bouton--encre" href="/hote/logements">{data.t.creerLogement}</a>
    </section>
  {:else}
    {@const logement = data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={data.t.choisirLogement}>
        {#each data.logements as choix (choix.id)}
          <a
            class={choix.id === logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/onboarding?logement=${choix.id}`}
          >
            {choix.nom}
          </a>
        {/each}
      </nav>
    {/if}

    <section class="ui-carte space-y-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">
            {data.avancementTexte}
          </h2>
          <p class="mt-1 text-sm text-encre-douce">
            {data.progressionTexte}
          </p>
        </div>
        {#if data.pret}
          <span class="ui-badge ui-badge--accent">{data.t.pret}</span>
        {:else}
          <span class="ui-badge ui-badge--alerte">{data.t.nonPubliable}</span>
        {/if}
      </div>
      <div
        aria-hidden="true"
        class="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div
          class="h-full rounded-full bg-accent"
          style={`width: ${data.pourcentage}%`}
        ></div>
      </div>
    </section>

    <section class="ui-carte space-y-3">
      <div>
        <h2 class="text-lg font-semibold">Chrono d’onboarding</h2>
        <p class="mt-1 text-sm text-encre-douce">
          Temps réellement écoulé depuis la création du compte, calculé à partir
          du journal d’audit. Une étape non franchie n’est pas comptée.
        </p>
      </div>
      <p class="text-sm">
        <strong>Durée totale :</strong>
        {formaterDureeChrono(data.chrono.totalMs)}
        {#if data.chrono.termine}
          <span class="ui-badge ui-badge--accent ml-2">Terminé</span>
        {:else}
          <span class="ui-badge ui-badge--alerte ml-2">En cours</span>
        {/if}
      </p>
      <ol class="divide-y divide-bordure text-sm">
        {#each data.chrono.etapes as etape (etape.code)}
          <li class="flex flex-wrap items-center justify-between gap-2 py-2">
            <span class="font-medium">{etape.libelle}</span>
            <span class="text-encre-douce">
              {#if etape.at}
                {etape.at.toISOString().slice(0, 16).replace("T", " ")} UTC
                · +{formaterDureeChrono(etape.depuisDebutMs)}
              {:else}
                Non franchie
              {/if}
            </span>
          </li>
        {/each}
      </ol>
    </section>

    <ol class="space-y-3">
      {#each data.etapes as etape (etape.code)}
        <li class="ui-carte--p5 rounded-2xl border border-bordure bg-surface shadow-sm">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <span
                aria-hidden="true"
                class={etape.fait
                  ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-fond"
                  : "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-bordure text-xs font-bold text-encre-faine"}
              >
                {etape.fait ? "✓" : ""}
              </span>
              <div>
                <h3 class="font-semibold">{etape.titre}</h3>
                <p class="mt-1 max-w-2xl text-sm text-encre-douce">
                  {etape.detail}
                </p>
              </div>
            </div>
            <span
              class={etape.fait
                ? "ui-badge ui-badge--accent"
                : "ui-badge ui-badge--alerte"}
            >
              {etape.fait ? data.t.fait : data.t.aFaire}
            </span>
          </div>

          {#if etape.code === "copro"}
            <form
              method="POST"
              action="?/copro"
              class="mt-4 flex flex-wrap items-center gap-4 border-t border-bordure pt-4"
            >
              <input type="hidden" name="logementId" value={logement.id} />
              <label
                class="flex min-h-11 min-w-11 items-start gap-3 rounded-xl border border-bordure p-3 text-sm"
              >
                <input
                  class="mt-1"
                  defaultChecked={logement.coproVerifiee}
                  name="coproVerifiee"
                  type="checkbox"
                />
                <span>
                  <span class="font-medium">
                    {data.t.coproLabel}
                  </span>
                  <span class="mt-0.5 block text-encre-douce">
                    {data.t.coproAide}
                  </span>
                </span>
              </label>
              <button class="ui-bouton ui-bouton--primaire ui-bouton--petit" type="submit">
                {data.t.enregistrer}
              </button>
            </form>
          {/if}

          {#if etape.code === "golive"}
            <div class="mt-4 border-t border-bordure pt-4">
              <p class="text-sm text-encre-douce">
                {data.t.etatPublication}
                <span class="font-semibold">
                  {logement.publication === "publiee" ? data.t.publie : data.t.brouillon}
                </span>. {data.t.publicationNote}
              </p>
              <form
                method="POST"
                action="?/publication"
                class="mt-3 flex flex-wrap items-center gap-3"
              >
                <input type="hidden" name="logementId" value={logement.id} />
                <input
                  type="hidden"
                  name="publication"
                  value={logement.publication === "publiee"
                    ? "brouillon"
                    : "publiee"}
                />
                <button
                  class="ui-bouton ui-bouton--encre ui-bouton--petit"
                  disabled={logement.publication !== "publiee" && !data.peutPublier}
                  type="submit"
                >
                  {logement.publication === "publiee"
                    ? data.t.depublier
                    : data.t.publier}
                </button>
              </form>
              {#if logement.publication !== "publiee" && !data.peutPublier}
                <p class="mt-2 text-sm text-alerte">
                  {data.t.verifierCopro}
                </p>
              {/if}
            </div>
          {/if}

          {#if etape.lien}
            <a class="mt-3 inline-block text-sm underline" href={etape.lien.href}>
              {etape.lien.label}
            </a>
          {/if}
        </li>
      {/each}
    </ol>

    <p class="text-sm text-encre-douce">
      {data.pret
        ? data.pretNoteTexte
        : data.t.pasPretNote}
    </p>
  {/if}

  <footer class="flex flex-wrap gap-4 border-t border-bordure pt-4 text-sm">
    <a class="inline-flex min-h-11 items-center underline" href="/hote/annonce">{data.t.annonce}</a>
    <a class="inline-flex min-h-11 items-center underline" href="/hote/logements">{data.t.logements}</a>
    <a class="inline-flex min-h-11 items-center underline" href="/hote">{data.t.tableau}</a>
  </footer>
</main>
