<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsMenage } from "@/lib/i18n-menage";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsMenage(data.langue));
</script>

<svelte:head>
  <title>{t.titrePageComparaison(data.logement.nom)}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.espaceComparaison(data.menage.ref)}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">
        {t.comparaisonTitre(data.logement.nom)}
      </h1>
      <p class="text-encre-douce">{t.comparaisonDescription}</p>
      <p class="text-sm text-encre-faine">
        {t.bilanComparaison(
          data.bilan.pieces,
          data.bilan.avecPhotos,
          data.bilan.comparables,
        )}
      </p>
    </div>
    <a class="ui-lien-action text-sm" href={`/hote/menage/${data.menage.id}`}>
      {t.retourMenage}
    </a>
  </header>

  {#each data.pieces as piece (piece.piece === "" ? "~sans-piece" : piece.piece)}
    <section class="ui-carte space-y-4">
      <div class="flex flex-wrap items-baseline justify-between gap-2">
        <h2 class="text-lg font-semibold">
          {piece.piece === "" ? t.pieceGenerale : piece.piece}
        </h2>
        <span
          class="ui-badge"
          class:ui-badge--ok={piece.etat === "comparaison"}
          class:ui-badge--alerte={piece.etat === "preuve_manquante" ||
            piece.etat === "reference_manquante"}
        >
          {t.etatsComparaison[piece.etat]}
        </span>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-widest text-encre-faine">
            {t.colReference}
          </h3>
          {#if piece.references.length === 0}
            <p class="text-sm text-encre-faine">{t.aucunePhotoReference}</p>
          {:else}
            <ul class="grid grid-cols-2 gap-3">
              {#each piece.references as photo (photo.id)}
                <li class="space-y-1">
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    <img
                      src={photo.url}
                      alt={`${piece.piece === "" ? t.pieceGenerale : piece.piece} — ${photo.legende || t.sansLegendePhoto}`}
                      loading="lazy"
                      class="aspect-square w-full rounded-controle border border-bordure object-cover"
                    />
                  </a>
                  <p class="text-xs text-encre-douce">
                    {photo.legende || t.sansLegendePhoto}
                  </p>
                </li>
              {/each}
            </ul>
          {/if}
        </div>

        <div class="space-y-3">
          <h3 class="text-sm font-semibold uppercase tracking-widest text-encre-faine">
            {t.colPreuve}
          </h3>
          {#if piece.preuves.length === 0}
            <p class="text-sm text-encre-faine">{t.aucunePhotoPreuve}</p>
          {:else}
            <ul class="grid grid-cols-2 gap-3">
              {#each piece.preuves as photo (photo.id)}
                <li class="space-y-1">
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    <img
                      src={photo.url}
                      alt={`${photo.phaseLabel} — ${data.menage.ref}`}
                      loading="lazy"
                      class="aspect-square w-full rounded-controle border border-bordure object-cover"
                    />
                  </a>
                  <p class="text-xs text-encre-douce">
                    {photo.phaseLabel} · {photo.creeLe}
                  </p>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </section>
  {:else}
    <p class="ui-carte text-sm text-encre-faine">{t.comparaisonVide}</p>
  {/each}

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien-action" href={`/hote/menage/${data.menage.id}`}>
      {t.retourMenage}
    </a>
    <a
      class="ui-lien-action"
      href={`/hote/menage/photos-reference?logement=${data.logement.id}`}
    >
      {t.gererInventaire}
    </a>
    <a class="ui-lien-action" href={`/hote/menage?logement=${data.logement.id}`}>
      {t.tousMenages}
    </a>
  </nav>
</main>
