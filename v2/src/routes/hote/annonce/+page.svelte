<script lang="ts">
  import { traductionsAnnonce } from "@/lib/i18n-annonce";
  import type { ActionData, PageData } from "./$types";
  import {
    CLASSEMENTS_MEUBLE,
    ETIQUETTES_DPE,
    LIBELLES_CLASSEMENT,
    MENTIONS_ANNONCE,
  } from "@/domain/annonce";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const erreur = $derived((form as { erreur?: string } | null)?.erreur ?? data.erreur);
  const t = $derived(traductionsAnnonce((data as { langue?: string }).langue ?? "fr"));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main id="contenu" class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.surtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="text-encre-douce">{t.description}</p>
    </div>
    <a class="inline-flex min-h-11 items-center text-sm underline" href="/hote">{t.retour}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {t.creerAide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{t.creerLogement}</a>
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
            href={`/hote/annonce?logement=${choix.id}`}
          >
            {choix.nom}
          </a>
        {/each}
      </nav>
    {/if}

    {#if data.ok}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {t.ok}
      </p>
    {/if}
    {#if data.copro}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {t.coproOk}
      </p>
    {/if}
    {#if data.archiveOk}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {t.archiveOk}
      </p>
    {/if}
    {#if data.restauration}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {t.restaurationOk}
      </p>
    {/if}
    {#if erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {erreur === "inattendu"
          ? t.erreurInattendue
          : erreur}
      </p>
    {/if}

    <section class="ui-carte space-y-4" id="copro">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{t.coproTitre}</h2>
          <p class="mt-1 max-w-2xl text-sm text-encre-douce">
            {t.coproDescription}
          </p>
        </div>
        {#if logement.coproVerifiee}
          <span class="ui-badge ui-badge--accent">{t.verifiee}</span>
        {:else}
          <span class="ui-badge ui-badge--alerte">{t.aVerifier}</span>
        {/if}
      </div>

      <p class="text-sm text-encre-douce">
        {data.publiable
          ? t.publiable
          : t.nonPubliable}
        {logement.coproVerifieeLe ? t.derniereVerif(logement.coproVerifieeLe) : ""}
      </p>

      <form method="POST" action="?/copro" class="flex flex-wrap items-center gap-4">
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
              {t.coproLabel}
            </span>
            <span class="mt-0.5 block text-encre-douce">{t.coproAide}</span>
          </span>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.enregistrerVerification}
        </button>
      </form>

      <div class="border-t border-bordure pt-4">
        {#if data.archive}
          <p class="text-sm text-encre-douce">
            {t.archiveTexte}
          </p>
        {:else}
          <p class="text-sm text-encre-douce">
            {t.publication}
            <span class="font-semibold">
              {data.publie ? t.publiee : t.brouillon}
            </span>. {t.publicationAide}
          </p>
          <form
            method="POST"
            action="?/publication"
            class="mt-3 flex flex-wrap items-center gap-3"
          >
            <input type="hidden" name="logementId" value={logement.id} />
            <input type="hidden" name="retour" value="/hote/annonce" />
            <input
              type="hidden"
              name="publication"
              value={data.publie ? "brouillon" : "publiee"}
            />
            <button
              class="ui-bouton ui-bouton--encre"
              disabled={!data.publie && !data.peutPublier}
              type="submit"
            >
              {data.publie ? t.depublier : t.publier}
            </button>
          </form>
          {#if !data.publie && !data.peutPublier}
            <p class="mt-2 text-sm text-alerte">
              {t.verifierAvantPublication}
            </p>
          {/if}
        {/if}
      </div>
    </section>

    <section class="ui-carte space-y-4" id="cycle-vie">
      <h2 class="text-lg font-semibold">{t.cycleTitre}</h2>
      <p class="text-sm text-encre-douce">
        {t.cycleTexte(logement.statut)}
      </p>
      {#if data.archive}
        <form method="POST" action="?/restaurer" class="flex flex-wrap items-center gap-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <input type="hidden" name="retour" value="/hote/annonce" />
          <button class="ui-bouton ui-bouton--encre" type="submit">
            {t.restaurer}
          </button>
        </form>
      {:else if data.archiver === "confirmer"}
        <div
          class="space-y-3 rounded-xl border border-danger bg-danger-douce p-4"
          role="alert"
        >
          <p class="text-sm font-medium text-danger">
            {t.confirmerArchivage(logement.nom)}
          </p>
          <p class="text-sm text-danger">{t.archivageAide}</p>
          <div class="flex flex-wrap items-center gap-3">
            <form method="POST" action="?/archiver">
              <input type="hidden" name="logementId" value={logement.id} />
              <input type="hidden" name="retour" value="/hote/annonce" />
              <input type="hidden" name="confirmation" value="oui" />
              <button class="ui-bouton ui-bouton--danger" type="submit">
                {t.confirmer}
              </button>
            </form>
            <a
              class="inline-flex min-h-11 items-center text-sm underline"
              href={`/hote/annonce?logement=${logement.id}`}
            >
              {t.annuler}
            </a>
          </div>
        </div>
      {:else}
        <form
          method="POST"
          action="?/demanderArchivage"
          class="flex flex-wrap items-center gap-3"
        >
          <input type="hidden" name="logementId" value={logement.id} />
          <input type="hidden" name="retour" value="/hote/annonce" />
          <button class="ui-bouton ui-bouton--secondaire text-danger" type="submit">
            {t.archiver}
          </button>
        </form>
      {/if}
    </section>

    <section class="ui-carte space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{t.avancement}</h2>
          <p class="mt-1 text-sm text-encre-douce">
            {t.mentions(data.resume.faites, data.resume.total, data.resume.pourcentage)}
          </p>
        </div>
        {#if data.resume.conforme}
          <span class="ui-badge ui-badge--accent">{t.conforme}</span>
        {:else}
          <span class="ui-badge ui-badge--alerte">{t.aCompleter}</span>
        {/if}
      </div>
      <div
        aria-hidden="true"
        class="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      >
        <div
          class="h-full rounded-full bg-accent"
          style={`width: ${data.resume.pourcentage}%`}
        ></div>
      </div>
      {#if data.resume.manquantes.length === 0}
        <p class="text-sm text-encre-douce">
          {t.toutesCochees}
          {#if !data.resume.conforme}
            {t.renseignerEtiquettes}
          {/if}
        </p>
      {/if}

      <form method="POST" action="?/enregistrer" class="space-y-4">
        <input type="hidden" name="logementId" value={logement.id} />
        <ul class="grid gap-3 sm:grid-cols-2">
          {#each MENTIONS_ANNONCE as mention (mention.code)}
            <li>
              <label
                class="flex min-h-11 min-w-11 h-full items-start gap-3 rounded-xl border border-bordure p-3 text-sm"
              >
                <input
                  class="mt-1"
                  defaultChecked={data.mentions[mention.code] === true}
                  name={`mention-${mention.code}`}
                  type="checkbox"
                />
                <span>
                  <span class="font-medium">{mention.libelle}</span>
                  <span class="mt-0.5 block text-encre-douce">
                    {mention.detail}
                  </span>
                </span>
              </label>
            </li>
          {/each}
        </ul>

        <div class="grid gap-3 sm:grid-cols-3">
          <label class="ui-label space-y-1">
            <span>{t.etiquetteDpe}</span>
            <select class="ui-champ" name="dpeClasse">
              <option value="" selected={(data.conformite?.dpeClasse ?? "") === ""}>{t.nonRenseigne}</option>
              {#each ETIQUETTES_DPE as lettre (lettre)}
                <option value={lettre} selected={lettre === (data.conformite?.dpeClasse ?? "")}>{lettre}</option>
              {/each}
            </select>
          </label>
          <label class="ui-label space-y-1">
            <span>{t.etiquetteGes}</span>
            <select class="ui-champ" name="gesClasse">
              <option value="" selected={(data.conformite?.gesClasse ?? "") === ""}>{t.nonRenseigne}</option>
              {#each ETIQUETTES_DPE as lettre (lettre)}
                <option value={lettre} selected={lettre === (data.conformite?.gesClasse ?? "")}>{lettre}</option>
              {/each}
            </select>
          </label>
          <label class="ui-label space-y-1">
            <span>{t.classement}</span>
            <select
              class="ui-champ"
              name="classement"
              value={data.conformite?.classement ?? ""}
            >
              <option value="">{t.nonRenseigne}</option>
              {#each CLASSEMENTS_MEUBLE as classement (classement)}
                <option value={classement}>
                  {LIBELLES_CLASSEMENT[classement]}
                </option>
              {/each}
            </select>
          </label>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="ui-label space-y-1">
            <span>{t.numeroMairie}</span>
            <input
              class="ui-champ"
              name="numeroEnregistrement"
              defaultValue={data.conformite?.numeroEnregistrement ?? ""}
              placeholder="ex. 06088202600012"
              maxlength="64"
            />
          </label>
          <label class="ui-label space-y-1">
            <span>{t.numeroCerfa}</span>
            <input
              class="ui-champ"
              name="numeroCerfa"
              defaultValue={data.conformite?.numeroCerfa ?? ""}
              placeholder="ex. 14004*05"
              maxlength="64"
            />
          </label>
        </div>

        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.enregistrerConformite}
        </button>
      </form>
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="inline-flex min-h-11 items-center underline" href={`/hote/tranquillite?logement=${logement.id}`}>
        {t.tranquillite}
      </a>
      <a class="inline-flex min-h-11 items-center underline" href="/hote">{t.tableau}</a>
    </nav>
  {/if}
</main>
