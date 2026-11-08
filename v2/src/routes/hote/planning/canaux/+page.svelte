<script lang="ts">
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  function classeStatut(statut: string | null): string {
    if (statut === "ok") return "ui-alerte ui-alerte--ok";
    if (statut === "partiel") return "ui-alerte";
    if (statut === "erreur") return "ui-alerte ui-alerte--danger";
    return "text-sm text-encre-faine";
  }
</script>

<svelte:head>
  <title>{data.t.titrePage}</title>
</svelte:head>

<main class="mx-auto max-w-5xl space-y-8 px-6 py-12">
  <header class="flex flex-wrap items-end justify-between gap-4">
    <div class="space-y-2">
      <p class="text-sm font-medium uppercase tracking-widest text-encre-faine">
        {data.t.espace}
      </p>
      <h1 class="text-3xl font-semibold tracking-tight">{data.t.titre}</h1>
      <p class="text-encre-douce">{data.t.description}</p>
    </div>
    <div class="flex flex-wrap gap-4 text-sm">
      <a class="ui-lien" href={`/hote/planning?logement=${data.logement?.id ?? ""}`}>
        {data.t.retourPlanning}
      </a>
      <a class="ui-lien" href={`/hote/planning/import?logement=${data.logement?.id ?? ""}`}>
        {data.t.importIcs}
      </a>
    </div>
  </header>

  {#if form?.message}
    <p
      class={form.ok ? "ui-alerte ui-alerte--ok" : "ui-alerte ui-alerte--danger"}
      role="status"
    >
      {form.message}
    </p>
  {/if}

  <p class="ui-alerte" role="note">
    {data.t.notice}
  </p>

  {#if data.fournisseur}
    <section class="ui-carte space-y-2" aria-label={data.t.fournisseurTitre}>
      <div class="flex flex-wrap items-center gap-2">
        <p class="text-xs uppercase tracking-widest text-encre-faine">
          {data.t.fournisseurTitre}
        </p>
        <span class="ui-badge ui-badge--accent">{data.fournisseur.nom}</span>
        <span class="ui-badge">{data.fournisseur.modeLibelle}</span>
      </div>
      <p class="text-sm text-encre-douce">
        {data.t.reserveSuperAdmin}
      </p>
      {#if data.fournisseur.externalPropertyId || data.fournisseur.derniereSync}
        <p class="text-xs text-encre-faine">
          {data.t.identifiantExterne} : {data.fournisseur.externalPropertyId ?? "—"}
          · {data.t.derniereSync} : {data.fournisseur.derniereSync ?? data.t.jamais}
        </p>
      {/if}
      {#if data.fournisseur.dernierStatut}
        <p class="text-xs text-encre-faine">
          {data.t.etat} : {data.fournisseur.dernierStatut}
          {#if data.fournisseur.dernierMessage}
            · {data.fournisseur.dernierMessage}
          {/if}
        </p>
      {/if}
    </section>
  {:else}
    <p class="ui-alerte" role="status">
      {data.t.aucunFournisseur}
    </p>
  {/if}

  {#if data.vide}
    <section class="ui-carte space-y-3">
      <p class="text-encre-douce">{data.t.videLogement}</p>
      <a class="ui-bouton ui-bouton--primaire" href="/hote/logements">
        {data.t.creerLogement}
      </a>
    </section>
  {:else if data.logement}
    {#if data.logements.length > 1}
      <form method="GET" class="flex flex-wrap items-end gap-3">
        <label class="ui-champ-groupe min-w-64 flex-1">
          <span class="ui-label">{data.t.logement}</span>
          <select class="ui-champ" name="logement">
            {#each data.logements as logement (logement.id)}
              <option value={logement.id} selected={logement.id === data.logement.id}>
                {logement.nom}
              </option>
            {/each}
          </select>
        </label>
        <button class="ui-bouton ui-bouton--secondaire" type="submit">
          {data.t.afficher}
        </button>
      </form>
    {/if}

    {#if data.sante}
      <section class="grid gap-3 sm:grid-cols-4" aria-label={data.t.santeCanaux}>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.canaux}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.total}</p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.exportsActifs}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.exportsActifs}</p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.importsIcal}</p>
          <p class="mt-1 text-2xl font-semibold">{data.sante.imports}</p>
        </div>
        <div class="ui-carte">
          <p class="text-xs uppercase tracking-widest text-encre-faine">{data.t.erreursRetard}</p>
          <p class={data.sante.enErreur + data.sante.enRetard > 0 ? "mt-1 text-2xl font-semibold text-danger" : "mt-1 text-2xl font-semibold"}>
            {data.sante.enErreur} / {data.sante.enRetard}
          </p>
        </div>
      </section>
    {/if}

    <section class="ui-carte space-y-4">
      <div>
        <h2 class="text-lg font-semibold">{data.t.ajouterCanal(data.logement.nom)}</h2>
        <p class="mt-1 text-sm text-encre-douce">{data.t.ajouterCanalAide}</p>
      </div>

      <form method="POST" action="?/creer" class="grid gap-4 sm:grid-cols-2">
        <input type="hidden" name="logementId" value={data.logement.id} />
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.plateforme}</span>
          <select class="ui-champ" name="code" required>
            <option value="">{data.t.choisir}</option>
            {#each data.catalogue as fiche (fiche.code)}
              <option value={fiche.code}>
                {fiche.nom}{fiche.aVerifier ? ` — ${data.t.icalVerifier}` : ""}
              </option>
            {/each}
          </select>
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.nomAffiche}</span>
          <input
            class="ui-champ"
            name="libelle"
            maxlength="80"
            placeholder={data.t.placeholderLibelle}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.identifiantAnnonceFacultatif}</span>
          <input
            class="ui-champ"
            name="externalListingId"
            maxlength="120"
            placeholder={data.t.placeholderId}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.urlImportFacultatif}</span>
          <input
            class="ui-champ font-mono text-xs"
            type="url"
            name="url"
            placeholder={data.t.placeholderUrl}
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.bufferApresDepart}</span>
          <input
            class="ui-champ"
            type="number"
            name="bufferJours"
            min="0"
            max="7"
            value="0"
          />
        </label>
        <label class="ui-champ-groupe">
          <span class="ui-label">{data.t.intervalleImport}</span>
          <input
            class="ui-champ"
            type="number"
            name="intervalleMinutes"
            min="1"
            max="1440"
            value="5"
          />
        </label>
        <label class="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" name="exportActif" checked />
          {data.t.publierExport}
        </label>
        <label class="ui-champ-groupe sm:col-span-2">
          <span class="ui-label">{data.t.notesInternesFacultatif}</span>
          <textarea class="ui-champ" name="notes" rows="2" maxlength="500"></textarea>
        </label>
        <div class="sm:col-span-2">
          <button class="ui-bouton ui-bouton--primaire" type="submit">
            {data.t.ajouter}
          </button>
        </div>
      </form>
    </section>

    <section class="space-y-4">
      <div class="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 class="text-lg font-semibold">{data.t.canauxDe(data.logement.nom)}</h2>
          <p class="text-sm text-encre-douce">{data.t.sansImport(data.sante?.sansImport ?? 0)}</p>
        </div>
      </div>

      {#if data.canaux.length === 0}
        <div class="ui-carte">
          <p class="text-encre-douce">
            {data.t.aucunCanal}
          </p>
        </div>
      {/if}

      {#each data.canaux as canal (canal.id)}
        <article class="ui-carte space-y-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="text-lg font-semibold">{canal.libelle}</h3>
                <span class="text-xs uppercase tracking-widest text-encre-faine">
                  {canal.nomCatalogue}
                </span>
                {#if canal.aVerifier}
                  <span class="ui-alerte text-xs" role="note">{data.t.icalVerifierBadge}</span>
                {/if}
                {#if canal.api === "partenaire"}
                  <span class="text-xs text-encre-faine">{data.t.apiNative}</span>
                {/if}
              </div>
              <p class="text-sm text-encre-douce">{canal.description}</p>
            </div>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class={canal.actif ? "ui-alerte ui-alerte--ok" : "ui-alerte"}>
                {canal.actif ? data.t.canalActif : data.t.canalDesactive}
              </span>
              <span class={canal.exportActif ? "ui-alerte ui-alerte--ok" : "ui-alerte"}>
                {canal.exportActif ? data.t.exportActif : data.t.exportCoupe}
              </span>
            </div>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2">
              <p class="text-xs uppercase tracking-widest text-encre-faine">
                {data.t.importIcal}
              </p>
              {#if canal.flux}
                <p class={classeStatut(canal.flux.dernierStatut)}>
                  {canal.flux.dernierStatut ?? data.t.jamaisSynchronise}
                  {#if canal.flux.enRetard} · {data.t.enRetard}{/if}
                </p>
                <p class="text-sm text-encre-douce">
                  {data.t.derniereSyncLabel} :
                  {canal.flux.derniereSync ?? data.t.jamais}<br />
                  {data.t.prochainEssai} : {canal.flux.prochainEssai}<br />
                  {data.t.intervalle} : {canal.flux.intervalleMinutes} min
                </p>
                {#if canal.flux.dernierMessage}
                  <p class="text-sm text-encre-douce">{canal.flux.dernierMessage}</p>
                {/if}
                {#if canal.flux.echecsConsecutifs > 0}
                  <p class="text-sm text-danger">
                    {data.t.echecs(canal.flux.echecsConsecutifs)}
                  </p>
                {/if}
              {:else}
                <p class="text-sm text-encre-douce">
                  {data.t.aucunFlux}
                </p>
              {/if}
            </div>

            <div class="space-y-2">
              <p class="text-xs uppercase tracking-widest text-encre-faine">
                {data.t.exportVers}
              </p>
              <label class="ui-champ-groupe">
                <span class="ui-label">{data.t.urlSignee}</span>
                <input
                  class="ui-champ font-mono text-xs"
                  readonly
                  value={canal.abonnement}
                />
              </label>
              <div class="flex flex-wrap gap-3 text-sm">
                {#if canal.actif && canal.exportActif}
                  <a class="ui-lien" href={canal.abonnement}>{data.t.telecharger}</a>
                {:else}
                  <span class="text-encre-faine">{data.t.exportDesactive}</span>
                {/if}
                <span class="text-encre-faine">
                  {data.t.buffer(canal.bufferJours)}
                </span>
              </div>
            </div>
          </div>

          {#if canal.externalListingId || canal.notes}
            <dl class="grid gap-2 text-sm sm:grid-cols-2">
              {#if canal.externalListingId}
                <div>
                  <dt class="text-encre-faine">{data.t.identifiantAnnonce}</dt>
                  <dd class="font-mono">{canal.externalListingId}</dd>
                </div>
              {/if}
              {#if canal.notes}
                <div>
                  <dt class="text-encre-faine">{data.t.notes}</dt>
                  <dd>{canal.notes}</dd>
                </div>
              {/if}
            </dl>
          {/if}

          <div class="flex flex-wrap gap-3">
            {#if canal.flux}
              <form method="POST" action="?/synchroniser">
                <input type="hidden" name="logementId" value={data.logement.id} />
                <input type="hidden" name="canalId" value={canal.id} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {data.t.synchroniser}
                </button>
              </form>
              <form method="POST" action="?/supprimerFlux">
                <input type="hidden" name="logementId" value={data.logement.id} />
                <input type="hidden" name="canalId" value={canal.id} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {data.t.retirerImport}
                </button>
              </form>
            {/if}
          </div>

          <details class="border-t border-encre-faine/20 pt-4">
            <summary class="cursor-pointer text-sm font-medium">
              {data.t.modifierCanal}
            </summary>
            <form method="POST" action="?/modifier" class="mt-4 grid gap-4 sm:grid-cols-2">
              <input type="hidden" name="logementId" value={data.logement.id} />
              <input type="hidden" name="canalId" value={canal.id} />
              <label class="ui-champ-groupe">
                <span class="ui-label">{data.t.nomAffiche}</span>
                <input
                  class="ui-champ"
                  name="libelle"
                  maxlength="80"
                  required
                  value={canal.libelle}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{data.t.identifiantAnnonce}</span>
                <input
                  class="ui-champ"
                  name="externalListingId"
                  maxlength="120"
                  value={canal.externalListingId ?? ""}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{data.t.bufferApresDepart}</span>
                <input
                  class="ui-champ"
                  type="number"
                  name="bufferJours"
                  min="0"
                  max="7"
                  value={canal.bufferJours}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{data.t.urlImportFacultatif}</span>
                <input
                  class="ui-champ font-mono text-xs"
                  type="url"
                  name="url"
                  placeholder={data.t.laisserVide}
                  value={canal.flux?.url ?? ""}
                />
              </label>
              <label class="ui-champ-groupe">
                <span class="ui-label">{data.t.intervalleImport}</span>
                <input
                  class="ui-champ"
                  type="number"
                  name="intervalleMinutes"
                  min="1"
                  max="1440"
                  value={canal.flux?.intervalleMinutes ?? 5}
                />
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="actif"
                  checked={canal.actif}
                />
                {data.t.canalActifLabel}
              </label>
              <label class="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="exportActif"
                  checked={canal.exportActif}
                />
                {data.t.exportActifLabel}
              </label>
              <p class="text-xs text-encre-faine sm:col-span-2">
                {data.t.desactiverAide}
              </p>
              <label class="ui-champ-groupe sm:col-span-2">
                <span class="ui-label">{data.t.notesInternes}</span>
                <textarea class="ui-champ" name="notes" rows="2" maxlength="500" defaultValue={canal.notes ?? ""}></textarea>
              </label>
              <div class="sm:col-span-2">
                <button class="ui-bouton ui-bouton--primaire" type="submit">
                  {data.t.enregistrer}
                </button>
              </div>
            </form>

            <details class="mt-4">
              <summary class="cursor-pointer text-sm text-danger">
                {data.t.supprimerCanal}
              </summary>
              <p class="mt-2 text-sm text-encre-douce">
                {data.t.supprimerAide}
              </p>
              <form method="POST" action="?/supprimer" class="mt-3">
                <input type="hidden" name="logementId" value={data.logement.id} />
                <input type="hidden" name="canalId" value={canal.id} />
                <button class="ui-bouton ui-bouton--secondaire ui-bouton--petit" type="submit">
                  {data.t.confirmerSuppression}
                </button>
              </form>
            </details>
          </details>
        </article>
      {/each}
    </section>
  {/if}
</main>
