<script lang="ts">
  import type { PageData } from "./$types";
  import { CATEGORIES_PHRASE } from "@/domain/phrase";
  import { traductionsPhrases } from "@/lib/i18n-phrases";

  let { data }: { data: PageData } = $props();

  const t = $derived(traductionsPhrases(data.langue));

  const classesCategorie: Record<string, string> = {
    arrivee: "ui-badge ui-badge--accent",
    depart: "ui-badge",
    urgence: "ui-badge ui-badge--danger",
    general: "ui-badge ui-badge--alerte",
  };

  const messageOk = $derived(
    data.ok === "enregistre"
      ? t.okEnregistre
      : data.ok === "supprime"
        ? t.okSupprime
        : data.ok === "modeles"
          ? t.okModeles
          : data.ok
            ? t.enregistreDefaut
            : "",
  );
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-6xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.surtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="text-encre-douce">{t.description}</p>
    </div>
    <a class="text-sm underline" href="/hote">{t.retour}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">{t.videTexte}</p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {t.creerLogement}
      </a>
    </section>
  {:else if data.logement}
    {@const logement = data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={t.choisirLogement}>
        {#each data.logements as choix (choix.id)}
          <a
            class={choix.id === logement.id
              ? "ui-bouton ui-bouton--primaire ui-bouton--petit"
              : "ui-bouton ui-bouton--secondaire ui-bouton--petit"}
            href={`/hote/phrases?logement=${choix.id}`}
          >
            {choix.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok" role="status">{messageOk}</p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu" ? t.erreurInattendue : data.erreur}
      </p>
    {/if}

    <section class="ui-carte space-y-4">
      <h2 class="text-lg font-semibold">
        {data.enEdition
          ? t.modifierTitre(data.enEdition.titre)
          : t.nouvellePhrase}
      </h2>
      <form method="POST" action="?/enregistrer" class="space-y-3">
        <input type="hidden" name="logementId" value={logement.id} />
        {#if data.enEdition}
          <input type="hidden" name="id" value={data.enEdition.id} />
        {/if}
        <input
          type="hidden"
          name="ref"
          value={data.enEdition?.ref ?? data.ref}
        />
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="ui-label space-y-1">
            <span>{t.categorie}</span>
            <select
              class="ui-champ"
              name="categorie"
              value={data.enEdition?.categorie ?? "general"}
            >
              {#each CATEGORIES_PHRASE as categorie (categorie)}
                <option value={categorie}>
                  {t.categories[categorie] ?? categorie}
                </option>
              {/each}
            </select>
          </label>
          <label class="ui-label space-y-1 sm:col-span-2">
            <span>{t.titreChamp}</span>
            <input
              class="ui-champ"
              name="titre"
              defaultValue={data.enEdition?.titre ?? ""}
              placeholder={t.placeholderTitre}
              required
              maxlength="120"
            />
          </label>
        </div>
        <label class="ui-label space-y-1">
          <span>{t.message}</span>
          <textarea
            class="ui-champ"
            name="contenu"
            placeholder={t.placeholderMessage}
            required
            rows="4"
            maxlength="4000"
          >{data.enEdition?.contenu ?? ""}</textarea>
        </label>
        <p class="text-xs text-encre-douce">
          {t.variables}
        </p>
        <div class="flex flex-wrap gap-3">
          <button class="ui-bouton ui-bouton--primaire" type="submit">
            {t.enregistrer}
          </button>
          {#if data.enEdition}
            <a
              class="ui-bouton ui-bouton--secondaire"
              href={`/hote/phrases?logement=${logement.id}`}
            >
              {t.annuler}
            </a>
          {/if}
        </div>
      </form>
    </section>

    <section class="space-y-3">
      <h2 class="text-lg font-semibold">{t.phrasesDe(logement.nom)}</h2>
      {#if data.phrases.length === 0}
        <div class="space-y-4 rounded-2xl border border-dashed border-bordure p-6">
          <p class="text-encre-douce">{t.aucunePhrase}</p>
          <ul class="grid gap-3 sm:grid-cols-2">
            {#each data.modeles as modele (modele.code)}
              <li class="rounded-xl border border-bordure bg-surface p-4 text-sm">
                <p class="font-medium">{modele.titre}</p>
                <p class="mt-1 text-encre-douce">{modele.apercu}</p>
              </li>
            {/each}
          </ul>
          <form method="POST" action="?/installer">
            <input type="hidden" name="logementId" value={logement.id} />
            <button class="ui-bouton ui-bouton--primaire" type="submit">
              {t.installer}
            </button>
          </form>
        </div>
      {:else}
        <ul class="grid gap-4 sm:grid-cols-2">
          {#each data.phrases as phrase (phrase.id)}
            <li class="ui-carte space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class={classesCategorie[phrase.categorie] ?? "ui-badge"}>
                  {t.categories[phrase.categorie] ?? phrase.categorie}
                </span>
                <div class="flex gap-3 text-sm">
                  <a
                    class="underline"
                    href={`/hote/phrases?logement=${logement.id}&phrase=${phrase.id}`}
                  >
                    {t.modifier}
                  </a>
                  <form method="POST" action="?/supprimer">
                    <input
                      type="hidden"
                      name="logementId"
                      value={logement.id}
                    />
                    <input type="hidden" name="id" value={phrase.id} />
                    <button class="underline text-danger" type="submit">
                      {t.supprimer}
                    </button>
                  </form>
                </div>
              </div>
              <p class="font-medium">{phrase.titre}</p>
              <p class="whitespace-pre-line text-sm text-encre-douce">
                {phrase.apercu}
              </p>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="underline" href="/hote">{t.tableau}</a>
    </nav>
  {/if}
</main>
