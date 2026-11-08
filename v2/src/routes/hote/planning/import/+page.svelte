<script lang="ts">
  import type { ActionData, PageData } from "./$types";
  import { traductionsPlanningImport } from "@/lib/i18n-planning-import";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  const t = $derived(traductionsPlanningImport(data.langue));
</script>

<svelte:head>
  <title>{t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {t.surtitre}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{t.titre}</h1>
      <p class="text-encre-douce">{t.description}</p>
    </div>
    <div class="flex flex-wrap gap-4 text-sm">
      <a class="ui-lien" href="/hote/planning">{t.retourPlanning}</a>
      <a class="ui-lien" href={`/hote/planning/canaux?logement=${data.logement?.id ?? ""}`}>
        {t.channelManager}
      </a>
    </div>
  </header>

  {#if data.sync}
    <p
      class={data.sync === "ok" || data.sync === "supprime"
        ? "ui-alerte ui-alerte--ok"
        : "ui-alerte ui-alerte--danger"}
      role="status"
    >
      {#if data.sync === "ok"}
        {t.syncOk}
      {:else if data.sync === "supprime"}
        {t.syncSupprime}
      {:else if data.sync === "erreur"}
        {t.syncErreur}
      {:else}
        {data.sync}
      {/if}
    </p>
  {/if}

  {#if data.fluxOk}
    <p class="ui-alerte ui-alerte--ok" role="status">
      {t.fluxOk(data.fluxOk)}
    </p>
  {:else if data.fluxErreur}
    <p class="ui-alerte ui-alerte--danger" role="status">{data.fluxErreur}</p>
  {/if}

  {#if form?.message}
    <p
      class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
      role="status"
    >
      {form.message}
    </p>
  {/if}

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">
        {t.vide}
      </p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">{t.creerLogement}</a>
    </section>
  {:else if data.logement}
    {#if data.logements.length > 1}
      <form method="GET" class="flex flex-wrap items-end gap-3">
        <label class="ui-champ-groupe min-w-64 flex-1">
          <span class="ui-label">{t.logement}</span>
          <select class="ui-champ" name="logement">
            {#each data.logements as logement (logement.id)}
              <option value={logement.id} selected={logement.id === data.logement.id}>
                {logement.nom}
              </option>
            {/each}
          </select>
        </label>
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {t.afficher}
        </button>
      </form>
    {/if}

    {#if data.sante}
      <section class="grid gap-3 sm:grid-cols-4" aria-label={t.santeAria}>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.fluxActifs}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.total}</p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.enErreur}</p>
          <p class={data.sante.enErreur > 0 ? "mt-1 text-2xl font-semibold text-danger" : "mt-1 text-2xl font-semibold"}>
            {data.sante.enErreur}
          </p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.enRetard}</p>
          <p class={data.sante.enRetard > 0 ? "mt-1 text-2xl font-semibold text-danger" : "mt-1 text-2xl font-semibold"}>
            {data.sante.enRetard}
          </p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{t.jamaisSync}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.jamaisSync}</p>
        </div>
      </section>
    {/if}

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{t.abonnementTitre(data.logement.nom)}</h2>
        <p class="mt-1 text-sm text-encre-douce">{t.abonnementDescription}</p>
      </div>
      <label class="ui-champ-groupe">
        <span class="ui-label">{t.urlSignee}</span>
        <input class="ui-champ font-mono text-xs" readonly value={data.abonnement ?? ""} />
      </label>
      <div class="flex flex-wrap gap-3 text-sm">
        <a class="ui-lien" href={data.abonnement ?? "#"}>{t.telecharger}</a>
        <span class="text-encre-faine">{t.rafraichissement}</span>
      </div>
    </section>

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">
          {t.importTitre(data.logement.nom)}
        </h2>
        <p class="mt-1 text-sm text-encre-douce">{t.importDescription}</p>
      </div>

      <form
        method="POST"
        action="?/importer"
        enctype="multipart/form-data"
        class="space-y-4"
      >
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.logement}</span>
          <select class="ui-champ" name="logementId">
            {#each data.logements as logement (logement.id)}
              <option
                value={logement.id}
                selected={logement.id === (form && "logementId" in form ? form.logementId : data.logement.id)}
              >
                {logement.nom} ({logement.code})
              </option>
            {/each}
          </select>
        </label>

        <label class="ui-champ-groupe">
          <span class="ui-label">{t.fichierIcs}</span>
          <input
            class="ui-champ"
            type="file"
            name="fichier"
            accept=".ics,text/calendar,text/plain"
          />
        </label>

        <label class="ui-champ-groupe">
          <span class="ui-label">{t.ouCollage}</span>
          <textarea
            class="ui-champ min-h-40 font-mono text-xs"
            name="ics"
            placeholder={t.placeholderIcs}
          ></textarea>
        </label>

        <button class="ui-bouton ui-bouton--primaire" type="submit">
          {t.importer}
        </button>
      </form>

      {#if form && form.resultat}
        {@const resultat = form.resultat}
        <div class="space-y-3">
          <div class="flex flex-wrap gap-2">
            <span class="ui-badge ui-badge--ok">{t.cree(resultat.crees)}</span>
            <span class="ui-badge">{t.blocages(resultat.blocages)}</span>
            <span class="ui-badge">{t.maj(resultat.misAJour)}</span>
            <span class="ui-badge">{t.deja(resultat.deja)}</span>
            {#if resultat.conflits > 0}
              <span class="ui-badge ui-badge--danger">
                {t.conflits(resultat.conflits)}
              </span>
            {/if}
            {#if resultat.ignores > 0}
              <span class="ui-badge">{t.ignores(resultat.ignores)}</span>
            {/if}
          </div>

          {#if resultat.lignes.length > 0}
            <div class="overflow-x-auto rounded-carte border border-bordure bg-surface">
              <table class="ui-tableau min-w-[640px]">
                <thead>
                  <tr>
                    <th>{t.colReference}</th>
                    <th>{t.colType}</th>
                    <th>{t.colDebut}</th>
                    <th>{t.colFin}</th>
                    <th>{t.colResultat}</th>
                  </tr>
                </thead>
                <tbody>
                  {#each resultat.lignes as ligne}
                    <tr>
                      <td class="font-mono text-xs">{ligne.ref}</td>
                      <td>{ligne.type === "reservation" ? t.reservation : t.blocage}</td>
                      <td>{ligne.debut}</td>
                      <td>{ligne.fin}</td>
                      <td>{ligne.message ?? ligne.resultat}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}
    </section>

    <section class="ui-carte space-y-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-semibold">{t.fluxTitre}</h2>
          <p class="mt-1 text-sm text-encre-douce">{t.fluxDescription}</p>
        </div>
        {#if data.flux.length > 0}
          <form method="POST" action="?/synchroniserTout">
            <input type="hidden" name="logementId" value={data.logement.id} />
            <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
              {t.toutSynchroniser}
            </button>
          </form>
        {/if}
      </div>

      <form method="POST" action="?/enregistrerFlux" class="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.libelle}</span>
          <input class="ui-champ" name="libelle" placeholder="Airbnb" required defaultValue={data.fluxLibelle ?? (form && "libelle" in form ? form.libelle : "")} />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{t.urlIcs}</span>
          <input
            class="ui-champ"
            name="url"
            type="url"
            inputmode="url"
            placeholder="https://…/calendar.ics"
            required
            defaultValue={data.fluxUrl ?? (form && "url" in form ? form.url : "")}
          />
        </label>
        <div class="sm:col-span-2">
          <button class="ui-bouton ui-bouton--secondaire" type="submit">
            {t.enregistrerFlux}
          </button>
        </div>
      </form>

      {#if data.flux.length === 0}
        <p class="text-sm text-encre-douce">{t.aucunFlux}</p>
      {:else}
        <ul class="divide-y divide-bordure rounded-carte border border-bordure bg-surface">
          {#each data.flux as flux (flux.id)}
            <li class="space-y-3 p-4">
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-medium">{flux.libelle}</p>
                  <p class="break-all text-xs text-encre-faine">{flux.url}</p>
                  <p class="mt-1 text-xs text-encre-faine">
                    {#if flux.derniereSync}
                      {t.dernierSucces(flux.derniereSync)}
                    {:else}
                      {t.jamaisSynchronise}
                    {/if}
                    · {t.intervalle(flux.intervalleMinutes)}
                    · {t.prochainEssai(flux.prochainEssai)}
                  </p>
                  {#if flux.echecsConsecutifs > 0}
                    <p class="mt-1 text-xs text-danger">
                      {t.echecs(flux.echecsConsecutifs)}
                    </p>
                  {/if}
                </div>
                <div class="flex flex-wrap gap-2">
                  <span
                    class={flux.dernierStatut === "ok"
                      ? "ui-badge ui-badge--ok"
                      : flux.dernierStatut === "erreur"
                        ? "ui-badge ui-badge--danger"
                        : "ui-badge"}
                  >
                    {flux.actif ? t.actif : t.inactif}
                  </span>
                  {#if flux.enRetard}
                    <span class="ui-badge ui-badge--danger">{t.enRetardBadge}</span>
                  {/if}
                  {#if flux.dernierStatut === "partiel"}
                    <span class="ui-badge">{t.confirmationRequise}</span>
                  {/if}
                </div>
              </div>

              {#if flux.dernierMessage}
                <p class="text-xs text-encre-douce">{flux.dernierMessage}</p>
              {/if}

              {#if flux.runs.length > 0}
                <details class="text-xs text-encre-douce">
                  <summary class="cursor-pointer">{t.dernieresExecutions}</summary>
                  <ul class="mt-2 space-y-1">
                    {#each flux.runs as run (run.id)}
                      <li>
                        {t.execution(run.debut, run.statut, run.crees, run.misAJour, run.annules, run.conflits)}
                        {#if run.statutHttp} (HTTP {run.statutHttp}){/if}
                        {#if run.dureeMs} · {run.dureeMs} ms{/if}
                      </li>
                    {/each}
                  </ul>
                </details>
              {/if}

              <div class="flex flex-wrap gap-2">
                <form method="POST" action="?/synchroniser">
                  <input type="hidden" name="logementId" value={data.logement.id} />
                  <input type="hidden" name="fluxId" value={flux.id} />
                  <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                    {t.synchroniser}
                  </button>
                </form>
                <form method="POST" action="?/supprimerFlux">
                  <input type="hidden" name="logementId" value={data.logement.id} />
                  <input type="hidden" name="fluxId" value={flux.id} />
                  <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                    {t.supprimer}
                  </button>
                </form>
              </div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <nav class="flex flex-wrap gap-4 text-sm">
      <a class="ui-lien" href={`/hote/planning?logement=${data.logement.id}`}>
        {t.planningLogement}
      </a>
      <a class="ui-lien" href="/hote/logements">{t.logements}</a>
    </nav>
  {/if}
</main>
