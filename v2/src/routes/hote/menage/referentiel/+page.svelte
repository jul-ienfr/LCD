<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsMenage } from "@/lib/i18n-menage";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const t = $derived(traductionsMenage(data.langue));
  const lignes = $derived(form?.lignes ?? data.lignes);
  const nbLignes = $derived(lignes.length + data.lignesLibres);
  const piecesConnues = $derived([
    ...new Set(
      lignes.map((ligne) => ligne.piece.trim()).filter((piece) => piece !== ""),
    ),
  ]);
</script>

<svelte:head>
  <title>{t.titrePageReferentiel}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-4xl space-y-8 px-6 py-10">
  <header class="ui-entete space-y-2">
    <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
      {t.espaceReferentiel}
    </p>
    <h1 class="text-3xl font-semibold tracking-tight">{t.referentielTitre}</h1>
    <p class="text-encre-douce">{t.referentielDescription}</p>
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
            href={`/hote/menage/referentiel?logement=${logement.id}`}
          >
            {logement.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok === "enregistre"}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.referentielEnregistre}</p>
    {/if}
    {#if data.ok === "reinitialise"}
      <p class="ui-alerte ui-alerte--ok" role="status">{t.referentielReinitialise}</p>
    {/if}
    {#if form?.erreur ?? data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {(form?.erreur ?? data.erreur) === "inattendu"
          ? t.erreurInattendue
          : (form?.erreur ?? data.erreur)}
      </p>
    {/if}

    <section class="ui-carte space-y-2">
      <h2 class="text-lg font-semibold">{data.logement.nom}</h2>
      <p class="text-sm text-encre-douce">
        {data.personnalise
          ? t.referentielDuLogement(piecesConnues.length, lignes.length)
          : t.referentielModele(piecesConnues.length, lignes.length)}
      </p>
      <p class="text-xs text-encre-faine">{t.referentielAide}</p>
      <p class="text-xs text-encre-faine">
        {t.limites(
          data.limites.pieces,
          data.limites.tachesParPiece,
          data.limites.piece,
          data.limites.tache,
        )}
      </p>
    </section>

    <section class="ui-carte space-y-4">
      <form method="POST" action="?/enregistrer" class="space-y-4">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <input type="hidden" name="nbLignes" value={nbLignes} />

        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <div
          class="overflow-x-auto rounded-carte border border-bordure bg-surface"
          role="region"
          tabindex="0"
          aria-label={t.referentielTitre}
        >
          <table class="ui-tableau min-w-[560px]">
            <thead>
              <tr>
                <th>{t.colPiece}</th>
                <th>{t.colTache}</th>
                <th>{t.supprimer}</th>
              </tr>
            </thead>
            <tbody>
              {#each Array.from({ length: nbLignes }, (_, index) => index) as index (index)}
                {@const ligne = lignes[index]}
                <tr>
                  <td>
                    <input
                      class="ui-champ min-w-[10rem]"
                      name={`piece-${index}`}
                      list="pieces-connues"
                      maxlength={data.limites.piece}
                      defaultValue={ligne?.piece ?? ""}
                      placeholder={t.ligneVide}
                      aria-label={`${t.colPiece} ${index + 1}`}
                    />
                  </td>
                  <td>
                    <input
                      class="ui-champ min-w-[12rem]"
                      name={`libelle-${index}`}
                      maxlength={data.limites.tache}
                      defaultValue={ligne?.libelle ?? ""}
                      aria-label={`${t.colTache} ${index + 1}`}
                    />
                  </td>
                  <td>
                    {#if ligne}
                      <label class="flex items-center gap-2 text-sm">
                        <input type="checkbox" name={`supprimer-${index}`} />
                        <span class="sr-only">{t.supprimer}</span>
                      </label>
                    {/if}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <datalist id="pieces-connues">
          {#each piecesConnues as piece (piece)}
            <option value={piece}></option>
          {/each}
        </datalist>

        <p class="text-xs text-encre-douce">{t.lignesAide(data.lignesLibres)}</p>

        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.enregistrerReferentiel}
        </button>
      </form>
    </section>

    <section class="ui-carte space-y-3">
      <p class="text-sm text-encre-douce">{t.reinitialiserAide}</p>
      <form method="POST" action="?/reinitialiser">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.reinitialiserReferentiel}
        </button>
      </form>
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="ui-lien-action" href={`/hote/menage?logement=${data.logement.id}`}>
        {t.tousMenages}
      </a>
      <a class="ui-lien-action" href={`/hote/menage/referentiel?logement=${data.logement.id}`}>
        {t.reglerReferentiel}
      </a>
      <a
        class="ui-lien-action"
        href={`/hote/menage/photos-reference?logement=${data.logement.id}`}
      >
        {t.gererInventaire}
      </a>
    </nav>
  {/if}
</main>
