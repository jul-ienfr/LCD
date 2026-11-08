<script lang="ts">
  import type { PageData } from "./$types";
  import {
    CLASSEMENTS_MEUBLE,
    ETIQUETTES_DPE,
    LIBELLES_CLASSEMENT,
    MENTIONS_ANNONCE,
  } from "@/domain/annonce";

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.t.surtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.titre}</h1>
      <p class="text-encre-douce">{data.t.description}</p>
    </div>
    <a class="text-sm underline" href="/hote">{data.t.retour}</a>
  </header>

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {data.t.creerAide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{data.t.creerLogement}</a>
    </section>
  {:else if data.logement}
    {@const logement = data.logement}
    {#if data.logements.length > 1}
      <nav class="flex flex-wrap gap-2" aria-label={data.t.choisirLogement}>
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
        {data.t.ok}
      </p>
    {/if}
    {#if data.copro}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {data.t.coproOk}
      </p>
    {/if}
    {#if data.archiveOk}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {data.t.archiveOk}
      </p>
    {/if}
    {#if data.restauration}
      <p class="ui-alerte ui-alerte--ok" role="status">
        {data.t.restaurationOk}
      </p>
    {/if}
    {#if data.erreur}
      <p class="ui-alerte ui-alerte--danger" role="alert">
        {data.erreur === "inattendu"
          ? data.t.erreurInattendue
          : data.erreur}
      </p>
    {/if}

    <section class="ui-carte space-y-4" id="copro">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{data.t.coproTitre}</h2>
          <p class="mt-1 max-w-2xl text-sm text-encre-douce">
            {data.t.coproDescription}
          </p>
        </div>
        {#if logement.coproVerifiee}
          <span class="ui-badge ui-badge--accent">{data.t.verifiee}</span>
        {:else}
          <span class="ui-badge ui-badge--alerte">{data.t.aVerifier}</span>
        {/if}
      </div>

      <p class="text-sm text-encre-douce">
        {data.publiable
          ? data.t.publiable
          : data.t.nonPubliable}
        {logement.coproVerifieeLe ? data.t.derniereVerif(logement.coproVerifieeLe) : ""}
      </p>

      <form method="POST" action="?/copro" class="flex flex-wrap items-center gap-4">
        <input type="hidden" name="logementId" value={logement.id} />
        <label
          class="flex items-start gap-3 rounded-xl border border-bordure p-3 text-sm"
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
            <span class="mt-0.5 block text-encre-douce">{data.t.coproAide}</span>
          </span>
        </label>
        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {data.t.enregistrerVerification}
        </button>
      </form>

      <div class="border-t border-bordure pt-4">
        {#if data.archive}
          <p class="text-sm text-encre-douce">
            {data.t.archiveTexte}
          </p>
        {:else}
          <p class="text-sm text-encre-douce">
            {data.t.publication}
            <span class="font-semibold">
              {data.publie ? data.t.publiee : data.t.brouillon}
            </span>. {data.t.publicationAide}
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
              {data.publie ? data.t.depublier : data.t.publier}
            </button>
          </form>
          {#if !data.publie && !data.peutPublier}
            <p class="mt-2 text-sm text-alerte">
              {data.t.verifierAvantPublication}
            </p>
          {/if}
        {/if}
      </div>
    </section>

    <section class="ui-carte space-y-4" id="cycle-vie">
      <h2 class="text-lg font-semibold">{data.t.cycleTitre}</h2>
      <p class="text-sm text-encre-douce">
        {data.t.cycleTexte(logement.statut)}
      </p>
      {#if data.archive}
        <form method="POST" action="?/restaurer" class="flex flex-wrap items-center gap-3">
          <input type="hidden" name="logementId" value={logement.id} />
          <input type="hidden" name="retour" value="/hote/annonce" />
          <button class="ui-bouton ui-bouton--encre" type="submit">
            {data.t.restaurer}
          </button>
        </form>
      {:else if data.archiver === "confirmer"}
        <div
          class="space-y-3 rounded-xl border border-danger bg-danger-douce p-4"
          role="alert"
        >
          <p class="text-sm font-medium text-danger">
            {data.t.confirmerArchivage(logement.nom)}
          </p>
          <p class="text-sm text-danger">{data.t.archivageAide}</p>
          <div class="flex flex-wrap items-center gap-3">
            <form method="POST" action="?/archiver">
              <input type="hidden" name="logementId" value={logement.id} />
              <input type="hidden" name="retour" value="/hote/annonce" />
              <input type="hidden" name="confirmation" value="oui" />
              <button class="ui-bouton ui-bouton--danger" type="submit">
                {data.t.confirmer}
              </button>
            </form>
            <a
              class="text-sm underline"
              href={`/hote/annonce?logement=${logement.id}`}
            >
              {data.t.annuler}
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
            {data.t.archiver}
          </button>
        </form>
      {/if}
    </section>

    <section class="ui-carte space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{data.t.avancement}</h2>
          <p class="mt-1 text-sm text-encre-douce">
            {data.t.mentions(data.resume.faites, data.resume.total, data.resume.pourcentage)}
          </p>
        </div>
        {#if data.resume.conforme}
          <span class="ui-badge ui-badge--accent">{data.t.conforme}</span>
        {:else}
          <span class="ui-badge ui-badge--alerte">{data.t.aCompleter}</span>
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
          {data.t.toutesCochees}
          {#if !data.resume.conforme}
            {data.t.renseignerEtiquettes}
          {/if}
        </p>
      {/if}

      <form method="POST" action="?/enregistrer" class="space-y-4">
        <input type="hidden" name="logementId" value={logement.id} />
        <ul class="grid gap-3 sm:grid-cols-2">
          {#each MENTIONS_ANNONCE as mention (mention.code)}
            <li>
              <label
                class="flex h-full items-start gap-3 rounded-xl border border-bordure p-3 text-sm"
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
            <span>{data.t.etiquetteDpe}</span>
            <select class="ui-champ" name="dpeClasse">
              <option value="" selected={(data.conformite?.dpeClasse ?? "") === ""}>{data.t.nonRenseigne}</option>
              {#each ETIQUETTES_DPE as lettre (lettre)}
                <option value={lettre} selected={lettre === (data.conformite?.dpeClasse ?? "")}>{lettre}</option>
              {/each}
            </select>
          </label>
          <label class="ui-label space-y-1">
            <span>{data.t.etiquetteGes}</span>
            <select class="ui-champ" name="gesClasse">
              <option value="" selected={(data.conformite?.gesClasse ?? "") === ""}>{data.t.nonRenseigne}</option>
              {#each ETIQUETTES_DPE as lettre (lettre)}
                <option value={lettre} selected={lettre === (data.conformite?.gesClasse ?? "")}>{lettre}</option>
              {/each}
            </select>
          </label>
          <label class="ui-label space-y-1">
            <span>{data.t.classement}</span>
            <select
              class="ui-champ"
              name="classement"
              value={data.conformite?.classement ?? ""}
            >
              <option value="">{data.t.nonRenseigne}</option>
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
            <span>{data.t.numeroMairie}</span>
            <input
              class="ui-champ"
              name="numeroEnregistrement"
              defaultValue={data.conformite?.numeroEnregistrement ?? ""}
              placeholder="ex. 06088202600012"
              maxlength="64"
            />
          </label>
          <label class="ui-label space-y-1">
            <span>{data.t.numeroCerfa}</span>
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
          {data.t.enregistrerConformite}
        </button>
      </form>
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="underline" href={`/hote/tranquillite?logement=${logement.id}`}>
        {data.t.tranquillite}
      </a>
      <a class="underline" href="/hote">{data.t.tableau}</a>
    </nav>
  {/if}
</main>
