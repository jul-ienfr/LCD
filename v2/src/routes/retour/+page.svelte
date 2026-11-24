<script lang="ts">
  import {
    libelleObstacleRetour,
    libelleParcoursRetour,
    traductionsRetour,
  } from "@/lib/i18n/public/retour";
  import {
    OBSTACLES_RETOUR,
    PARCOURS_RETOUR,
    SUPPORTS_RETOUR,
  } from "@/lib/mesure/retour";
  import type { PageData } from "./$types";

  let { data, form }: { data: PageData; form: Record<string, unknown> | null } =
    $props();

  const t = $derived(traductionsRetour(data.langue));
  const valeurs = $derived(
    (form?.valeurs as
      | { note?: string; obstacles?: string[]; support?: string }
      | undefined) ?? data.valeurs,
  );
  const erreurs = $derived(
    (form?.erreurs as Record<string, string> | undefined) ?? data.erreurs,
  );
  const parcoursChoisi = $derived(
    typeof form?.parcours === "string" ? form.parcours : data.parcours,
  );

  const messageErreur = (cle: string | undefined): string | null => {
    if (!cle) return null;
    if (cle === "requis") return t.erreurParcours;
    if (cle === "inconnu") return t.erreurParcoursInconnu;
    if (cle === "hors_bornes") return t.erreurNoteBornes;
    return t.erreurNote;
  };
</script>

<svelte:head>
  <title>{t.titre}</title>
  <meta name="description" content={t.intro} />
  <meta name="robots" content="noindex" />
</svelte:head>

<main id="contenu" class="mx-auto max-w-2xl space-y-6 px-5 py-10">
  <header class="space-y-3">
    <h1 class="ui-titre-2">{t.titre}</h1>
    <p class="ui-lecture text-encre-douce">{t.intro}</p>
    <p role="status" class="ui-alerte ui-alerte--info text-sm">{t.sansPii}</p>
  </header>

  {#if data.merci}
    <section class="ui-carte space-y-3" role="status">
      <h2 class="ui-titre-3">{t.merci}</h2>
      <p class="text-encre-douce">{t.merciTexte}</p>
      <a class="ui-bouton ui-bouton--secondaire" href="/aide">{t.retourAide}</a>
    </section>
  {:else}
    {#if Object.keys(erreurs).length > 0}
      <div class="ui-alerte ui-alerte--danger" role="alert">
        {messageErreur(erreurs.parcours ?? erreurs.note)}
      </div>
    {/if}

    <form method="POST" class="space-y-6">
      <input type="hidden" name="tenant" value={data.tenant} />

      <div class="ui-champ-groupe">
        <label class="ui-label" for="retour-parcours">{t.parcours}</label>
        <p class="text-xs text-encre-faine" id="retour-parcours-aide">
          {t.choisirParcours}
        </p>
        <select
          class="ui-champ"
          id="retour-parcours"
          name="parcours"
          aria-describedby="retour-parcours-aide{erreurs.parcours
            ? ' retour-parcours-erreur'
            : ''}"
          aria-invalid={erreurs.parcours ? "true" : undefined}
        >
          <option value="">— {t.choisirParcours} —</option>
          {#each PARCOURS_RETOUR as parcours (parcours)}
            <option value={parcours} selected={parcours === parcoursChoisi}>
              {libelleParcoursRetour(data.langue, parcours)}
            </option>
          {/each}
        </select>
        {#if erreurs.parcours}
          <p class="text-sm text-danger" id="retour-parcours-erreur" role="alert">
            {messageErreur(erreurs.parcours)}
          </p>
        {/if}
      </div>

      <fieldset class="ui-champ-groupe">
        <legend class="ui-label">{t.note}</legend>
        <p class="text-xs text-encre-faine" id="retour-note-aide">{t.noteAide}</p>
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm text-encre-faine">{t.noteBasse}</span>
          {#each [1, 2, 3, 4, 5, 6, 7] as note (note)}
            <label
              class="ui-cible grid size-11 cursor-pointer place-items-center rounded-full border border-bordure bg-surface text-sm font-semibold has-[:checked]:border-accent has-[:checked]:bg-accent-douce"
            >
              <input
                class="sr-only"
                type="radio"
                name="note"
                value={note}
                checked={String(valeurs.note ?? "") === String(note)}
                aria-describedby="retour-note-aide"
              />
              <span aria-hidden="true">{note}</span>
              <span class="sr-only">{note}</span>
            </label>
          {/each}
          <span class="text-sm text-encre-faine">{t.noteHaute}</span>
        </div>
      </fieldset>

      <fieldset class="ui-champ-groupe">
        <legend class="ui-label">{t.obstacles}</legend>
        <p class="text-xs text-encre-faine" id="retour-obstacles-aide">
          {t.obstaclesAide}
        </p>
        <div class="flex flex-wrap gap-3">
          {#each OBSTACLES_RETOUR as obstacle (obstacle)}
            <label
              class="ui-puce cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-douce"
            >
              <input
                class="sr-only"
                type="checkbox"
                name="obstacles"
                value={obstacle}
                checked={(valeurs.obstacles ?? []).includes(obstacle)}
              />
              {libelleObstacleRetour(data.langue, obstacle)}
            </label>
          {/each}
        </div>
      </fieldset>

      <fieldset class="ui-champ-groupe">
        <legend class="ui-label">{t.support}</legend>
        <div class="flex flex-wrap gap-3">
          {#each SUPPORTS_RETOUR as support (support)}
            <label class="ui-puce cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-douce">
              <input
                class="sr-only"
                type="radio"
                name="support"
                value={support}
                checked={valeurs.support === support}
              />
              {support === "telephone"
                ? t.supportTelephone
                : support === "tablette"
                  ? t.supportTablette
                  : t.supportOrdinateur}
            </label>
          {/each}
          <label class="ui-puce cursor-pointer has-[:checked]:border-accent has-[:checked]:bg-accent-douce">
            <input
              class="sr-only"
              type="radio"
              name="support"
              value=""
              checked={!valeurs.support}
            />
            {t.supportNon}
          </label>
        </div>
      </fieldset>

      <div class="flex flex-wrap items-center gap-3">
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.envoyer}
        </button>
        <a class="ui-bouton ui-bouton--fantome" href="/aide">{t.retourAide}</a>
      </div>
    </form>
  {/if}
</main>
