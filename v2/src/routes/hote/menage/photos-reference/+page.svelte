<script lang="ts">
  import type { PageData } from "./$types";
  import ConfirmationAction from "@/lib/components/ui/confirmation-action.svelte";
  import { traductionsMenage } from "@/lib/i18n-menage";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsMenage(data.langue));
</script>

<svelte:head>
  <title>{t.titrePageInventairePhotos}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-10">
  <header class="ui-entete space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espaceInventairePhotos}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.inventairePhotosTitre}</h1>
    <p class="text-encre-douce">{t.inventairePhotosDescription}</p>
    <p class="text-sm text-encre-faine">
      {t.inventairePhotosLimites(
        data.limites.photosParPiece,
        data.limites.piece,
        data.limites.legende,
        data.limites.poidsMo,
      )}
    </p>
  </header>

  {#if data.vide || !data.logement}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">{t.videLogement}</p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {t.creerLogement}
      </a>
    </section>
  {:else}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as logement (logement.id)}
          <a
            class={logement.id === data.logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/menage/photos-reference?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok === "ajoute"}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.photoReferenceAjoutee}</p>
    {/if}
    {#if data.ok === "supprime"}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.photoReferenceSupprimee}</p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
      </p>
    {/if}

    <form
      method="POST"
      action="?/ajouter"
      enctype="multipart/form-data"
      class="ui-carte space-y-4"
    >
      <input type="hidden" name="logementId" value={data.logement.id} />
      <div>
        <h2 class="text-lg font-semibold">{t.ajouterPhotoReference}</h2>
        <p class="text-sm text-encre-douce">{t.ajouterPhotoReferenceAide}</p>
      </div>
      <div class="grid gap-3 sm:grid-cols-3">
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.colPiece}</span>
          <input
            class="ui-champ min-h-11"
            name="piece"
            list="pieces-connues"
            maxlength={data.limites.piece}
            required
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.legende}</span>
          <input
            class="ui-champ min-h-11"
            name="legende"
            maxlength={data.limites.legende}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.fichier}</span>
          <input
            class="ui-champ min-h-11"
            type="file"
            name="photo"
            accept={data.photoTypes}
            required
          />
        </label>
      </div>
      <datalist id="pieces-connues">
        {#each data.pieces as entree (entree.piece)}
          <option value={entree.piece}></option>
        {/each}
      </datalist>
      <button class="ui-bouton ui-bouton--primaire" type="submit">
        {t.ajouterPhotoReference}
      </button>
    </form>

    {#each data.pieces as entree (entree.piece)}
      <section class="ui-carte space-y-3">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h2 class="text-lg font-semibold">{entree.piece}</h2>
          <p class="text-xs text-encre-faine">
            {t.photosDeLaPiece(entree.photos.length, data.limites.photosParPiece)}
          </p>
        </div>

        {#if entree.photos.length === 0}
          <p class="text-sm text-encre-faine">{t.aucunePhotoReference}</p>
        {:else}
          <ul class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {#each entree.photos as photo (photo.id)}
              <li class="space-y-2">
                <a href={photo.url} target="_blank" rel="noreferrer">
                  <img
                    src={photo.url}
                    alt={`${entree.piece} — ${photo.legende || t.sansLegendePhoto}`}
                    loading="lazy"
                    class="aspect-square w-full rounded-controle border border-bordure object-cover"
                  />
                </a>
                <p class="text-xs text-encre-douce">
                  {photo.legende || t.sansLegendePhoto} · {photo.tailleMo} Mo
                </p>
                <ConfirmationAction
                  langue={data.langue}
                  action="supprimer"
                  cible={photo.id}
                  libelle={t.supprimer}
                  champs={{ logementId: data.logement.id, photoId: photo.id }}
                  classe="ui-bouton ui-bouton--fantome text-xs"
                />
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/each}
  {/if}

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien-action" href="/hote/menage">{t.menages}</a>
    {#if data.logement}
      <a
        class="ui-lien-action"
        href={`/hote/menage/referentiel?logement=${data.logement.id}`}
      >
        {t.reglerReferentiel}
      </a>
      <a class="ui-lien-action" href={`/hote/menage?logement=${data.logement.id}`}>
        {t.tousMenages}
      </a>
    {/if}
    <a class="ui-lien-action" href="/hote">{t.tableauBord}</a>
  </nav>
</main>
