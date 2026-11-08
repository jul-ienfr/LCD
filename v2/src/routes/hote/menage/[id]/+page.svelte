<script lang="ts">
  import type { PageData } from "./$types";
  import { traductionsMenage } from "@/lib/i18n-menage";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsMenage(data.langue));
</script>

<svelte:head>
  <title>{t.titrePageDetail(data.menage.date)}</title>
</svelte:head>

<main class="mx-auto max-w-3xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.espaceMenage(data.menage.ref)}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titreDetail(data.logement.nom)}</h1>
      <p class="text-encre-douce">
        {t.detailResume(data.menage.date, data.menage.statutLabel, data.avancement.faites, data.avancement.total, data.avancement.pourcentage)}
      </p>
    </div>
    <a class="ui-lien text-sm" href={`/hote/menage?logement=${data.logement.id}`}>
      {t.tousMenages}
    </a>
  </header>

  {#if data.ok}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.enregistre}</p>
  {/if}
  {#if data.evalue}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.evaluationEnregistree}</p>
  {/if}
  {#if data.ok === "photo"}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {t.photoAjoutee(Number(data.evincees ?? 0))}
    </p>
  {/if}
  {#if data.ok === "photo-supprimee"}
    <p class="ui-alerte ui-alerte--ok" role="status">{t.photoSupprimee}</p>
  {/if}
  {#if data.erreur}
    <p class="ui-alerte ui-alerte--danger" role="alert">
      {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
    </p>
  {/if}

  <section class="ui-carte">
    {#if data.menage.taches.length === 0}
      <p class="ui-alerte ui-alerte--alerte">
        {t.aucuneTache}
      </p>
    {:else}
      <form method="POST" action="?/enregistrer" class="space-y-4">
        <input type="hidden" name="id" value={data.menage.id} />

        <fieldset class="space-y-2">
          <legend class="text-sm font-semibold">{t.checklist}</legend>
          {#each data.menage.taches as tache, index (index)}
            <label
              class="flex items-center gap-3 rounded-controle border border-bordure p-3 text-sm"
            >
              <input
                type="checkbox"
                name={`tache-${index}`}
                defaultChecked={tache.fait}
              />
              <input
                class="ui-champ flex-1"
                name={`libelle-${index}`}
                defaultValue={tache.libelle}
                maxlength="120"
              />
            </label>
          {/each}
        </fieldset>

        <div class="grid gap-4 sm:grid-cols-2">
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.statut}</span>
            <select class="ui-champ" name="statut">
              {#each data.statuts as statut (statut.valeur)}
                <option value={statut.valeur} selected={statut.valeur === data.menage.statut}>
                  {statut.libelle}
                </option>
              {/each}
            </select>
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.notesLabel}</span>
            <input class="ui-champ" name="notes" defaultValue={data.menage.notes} />
          </label>
        </div>

        <p class="text-xs text-encre-douce">
          {t.passageFait}
        </p>

        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.enregistrerMenage}
        </button>
      </form>
    {/if}
  </section>

  <section class="ui-carte space-y-4">
    <div>
      <h2 class="text-lg font-semibold">{t.photosPreuve}</h2>
      <p class="text-sm text-encre-douce">{t.photosAide(data.photoMaxMo)}</p>
    </div>

    <form
      method="POST"
      action="?/photo"
      enctype="multipart/form-data"
      class="space-y-3"
    >
      <input type="hidden" name="id" value={data.menage.id} />
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.phase}</span>
          <select class="ui-champ" name="phase">
            <option value="avant">{t.avant}</option>
            <option value="apres">{t.apres}</option>
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.fichier}</span>
          <input
            class="ui-champ"
            type="file"
            name="photo"
            accept={data.photoTypes}
            required
          />
        </label>
      </div>
      <button class="ui-bouton ui-bouton--secondaire" type="submit">
        {t.ajouterPhoto}
      </button>
    </form>

    {#if data.photos.length > 0}
      <ul class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {#each data.photos as photo (photo.id)}
          <li class="space-y-2 rounded-controle border border-bordure p-2">
            <a href={photo.url} target="_blank" rel="noreferrer">
              <img
                src={photo.url}
                alt={`${photo.phaseLabel} — ${data.menage.ref}`}
                loading="lazy"
                class="aspect-square w-full rounded-controle object-cover"
              />
            </a>
            <p class="text-xs text-encre-douce">
              {photo.phaseLabel} · {photo.tailleMo} Mo
            </p>
            <form method="POST" action="?/supprimerPhoto">
              <input type="hidden" name="id" value={data.menage.id} />
              <input type="hidden" name="photoId" value={photo.id} />
              <button
                class="ui-bouton ui-bouton--fantome text-xs"
                type="submit"
              >
                {t.supprimer}
              </button>
            </form>
          </li>
        {/each}
      </ul>
    {:else}
      <p class="text-sm text-encre-faine">{t.aucunePhoto}</p>
    {/if}
  </section>

  {#if data.menage.statut === "fait"}
    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.evaluation}</h2>
        <p class="text-sm text-encre-douce">{t.evaluationAide}</p>
      </div>

      <form method="POST" action="?/evaluer" class="space-y-4">
        <input type="hidden" name="id" value={data.menage.id} />
        <div class="grid gap-4 sm:grid-cols-3">
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.score}</span>
            <select class="ui-champ" name="score">
              <option value="">{t.nonRenseigne}</option>
              {#each [1, 2, 3, 4, 5] as score (score)}
                <option value={score} selected={score === data.menage.score}>
                  {score} / 5
                </option>
              {/each}
            </select>
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.cout}</span>
            <input
              class="ui-champ"
              name="coutEuros"
              inputmode="decimal"
              placeholder="45,00"
              defaultValue={data.menage.coutEuros}
            />
          </label>
          <label class="ui-champ-groupe">
            <span class="ui-label">{t.duree}</span>
            <input
              class="ui-champ"
              type="number"
              name="dureeMinutes"
              inputmode="numeric"
              placeholder="90"
              min="0"
              max="600"
              defaultValue={data.menage.dureeMinutes ?? ""}
            />
          </label>
        </div>
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.enregistrerEvaluation}
        </button>
      </form>
    </section>
  {/if}

  <nav class="flex flex-wrap gap-4 text-sm">
    <a class="ui-lien" href={`/hote/menage?logement=${data.logement.id}`}>
      {t.tousMenages}
    </a>
    <a class="ui-lien" href={`/hote/etats-des-lieux?logement=${data.logement.id}`}>
      {t.etatsDesLieux}
    </a>
    <a class="ui-lien" href={`/hote/entretien?logement=${data.logement.id}`}>
      {t.entretien}
    </a>
    <a class="ui-lien" href="/hote">{t.tableauBord}</a>
  </nav>
</main>
